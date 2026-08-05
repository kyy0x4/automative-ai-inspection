import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_SESSION } from '../src/data/initialData.js';
import { InspectionSession, Defect, DefectSeverity } from '../src/types.js';

// Shared server-side session state (in-memory).
// Note: on Vercel serverless this is ephemeral per-instance — fine for PoC testing.
export let currentSession: InspectionSession = JSON.parse(
  JSON.stringify(INITIAL_SESSION)
);

export function setSession(session: InspectionSession): InspectionSession {
  currentSession = { ...session, lastSyncTimestamp: Date.now() };
  return currentSession;
}

export function resetSessionStore(): InspectionSession {
  currentSession = JSON.parse(JSON.stringify(INITIAL_SESSION));
  currentSession.lastSyncTimestamp = Date.now();
  return currentSession;
}

export type BroadcastFn = (type: string, payload: unknown) => void;

const noopBroadcast: BroadcastFn = () => {};

export function createApp(broadcast: BroadcastFn = noopBroadcast) {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/session', (req, res) => {
    res.json(currentSession);
  });

  app.post('/api/session', (req, res) => {
    if (req.body && req.body.session) {
      currentSession = {
        ...req.body.session,
        lastSyncTimestamp: Date.now(),
      };
      broadcast('STATE_UPDATE', { session: currentSession });
      return res.json({ success: true, session: currentSession });
    }
    res.status(400).json({ error: 'Invalid session payload' });
  });

  app.post('/api/session/reset', (req, res) => {
    currentSession = JSON.parse(JSON.stringify(INITIAL_SESSION));
    currentSession.lastSyncTimestamp = Date.now();
    broadcast('SYNC_STATE', {
      session: currentSession,
    });
    res.json({ success: true, session: currentSession });
  });

  // Gemini AI Inspection Endpoint
  app.post('/api/ai/analyze-inspection', async (req, res) => {
    try {
      const { zoneId, imageBase64, zoneName } = req.body;
      if (!zoneId) {
        return res.status(400).json({ error: 'zoneId is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Graceful fallback simulation if GEMINI_API_KEY is not present
        const fallbackDefect: Defect = {
          id: `defect-${Date.now()}`,
          type: Math.random() > 0.5 ? 'Dent' : 'Chipping',
          severity: Math.random() > 0.5 ? 'MINOR' : 'MICRO',
          confidence: Math.floor(Math.random() * 15) + 80,
          location: zoneName || 'Vehicle Surface',
          description: 'AI Inspection detected surface irregularity during optical scan.',
          bbox: {
            x: Math.floor(Math.random() * 40) + 20,
            y: Math.floor(Math.random() * 40) + 20,
            width: 30,
            height: 25,
          },
          createdAt: new Date().toISOString(),
        };

        const zoneIndex = currentSession.zones.findIndex((z) => z.id === zoneId);
        if (zoneIndex !== -1) {
          currentSession.zones[zoneIndex].status = 'FAIL';
          currentSession.zones[zoneIndex].confidence = 92;
          currentSession.zones[zoneIndex].defects = [fallbackDefect];
          currentSession.zones[zoneIndex].lastInspectedAt = new Date().toISOString();
          currentSession.lastSyncTimestamp = Date.now();

          broadcast('STATE_UPDATE', { session: currentSession });
        }

        return res.json({
          status: 'FAIL',
          confidence: 92,
          defects: [fallbackDefect],
          notes: 'Simulated scan analysis (AI Key not configured).',
        });
      }

      // Call Gemini API with server-side SDK
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptText = `Analyze this automotive vehicle surface image for inspection of the zone: "${zoneName || zoneId}".
Detect any defects such as Dents, Chipping, Scratches, Cracks, Rust, or Paint Discoloration.
Return a structured JSON with:
- status: "PASS", "FAIL", or "WARN"
- confidence: integer percentage (1-100)
- defects: array of defect objects { type, severity ("MICRO", "MINOR", "MODERATE", "SEVERE"), confidence, location, description, bbox: { x, y, width, height } }
- notes: short summary note`;

      const contents: any[] = [promptText];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, description: 'PASS, FAIL, or WARN' },
              confidence: { type: Type.INTEGER, description: 'Percentage 1-100' },
              notes: { type: Type.STRING },
              defects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    confidence: { type: Type.INTEGER },
                    location: { type: Type.STRING },
                    description: { type: Type.STRING },
                    bbox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      const newDefects: Defect[] = (parsed.defects || []).map((d: any, idx: number) => ({
        id: `ai-defect-${Date.now()}-${idx}`,
        type: d.type || 'Dent',
        severity: (d.severity?.toUpperCase() as DefectSeverity) || 'MINOR',
        confidence: d.confidence || 90,
        location: d.location || zoneName || 'Vehicle Zone',
        description: d.description || 'AI detected surface anomaly',
        bbox: d.bbox || { x: 30, y: 30, width: 30, height: 25 },
        createdAt: new Date().toISOString(),
      }));

      const status = (parsed.status?.toUpperCase() as any) || (newDefects.length > 0 ? 'FAIL' : 'PASS');
      const confidence = parsed.confidence || 95;

      // Update session state
      const zoneIndex = currentSession.zones.findIndex((z) => z.id === zoneId);
      if (zoneIndex !== -1) {
        currentSession.zones[zoneIndex].status = status;
        currentSession.zones[zoneIndex].confidence = confidence;
        currentSession.zones[zoneIndex].defects = newDefects;
        currentSession.zones[zoneIndex].notes = parsed.notes || (newDefects.length > 0 ? `${newDefects.length} defect(s) detected.` : 'No defects detected.');
        currentSession.zones[zoneIndex].lastInspectedAt = new Date().toISOString();
        currentSession.lastSyncTimestamp = Date.now();

        broadcast('STATE_UPDATE', { session: currentSession });
      }

      res.json({
        status,
        confidence,
        defects: newDefects,
        notes: parsed.notes || 'AI Inspection Completed.',
      });
    } catch (err: any) {
      console.error('Gemini AI analyze error:', err);
      res.status(500).json({ error: 'AI Analysis failed', message: err.message });
    }
  });

  return app;
}
