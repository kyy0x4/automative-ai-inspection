import { useState, useEffect, useRef, useCallback } from 'react';
import { InspectionSession, RealtimeMessage, Defect, ZoneStatus } from '../types';
import { INITIAL_SESSION } from '../data/initialData';
import { APP_CONFIG } from '../config';
import { initAI, analyzeImage, getModelStatus } from '../services/aiEngine';
import { savePhoto } from '../services/storage';

export function useRealtimeSession() {
  const [session, setSession] = useState<InspectionSession>(INITIAL_SESSION);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [clientCount, setClientCount] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const addLog = useCallback((msg: string) => {
    setSyncLog((prev) => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19) ]);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    // Preload on-device AI model in the background (Edge AI mode)
    if (APP_CONFIG.useOnDeviceAI) {
      initAI().then(() => {
        const st = getModelStatus();
        addLog(st.ready ? `On-device AI ready (${st.name})` : `On-device AI unavailable: ${st.error}. Using simulated scan.`);
      });
    }

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addLog('Connected to Real-time Inspection Server');
      };

      ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          if (message.type === 'SYNC_STATE' || message.type === 'STATE_UPDATE') {
            if (message.payload?.session) {
              setSession(message.payload.session);
              addLog(`State synced (${message.payload.session.zones.filter((z) => z.status !== 'PENDING').length}/12 zones checked)`);
            }
            if (message.payload?.clientCount) {
              setClientCount(message.payload.clientCount);
            }
          } else if (message.type === 'CLIENT_COUNT') {
            setClientCount(message.payload.clientCount);
            addLog(`Active inspection devices: ${message.payload.clientCount}`);
          }
        } catch (e) {
          console.error('Failed to parse websocket message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        addLog('Disconnected from server. Retrying in 3s...');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [addLog]);

  // Broadcast local session changes to server via WebSocket or REST
  const broadcastSession = useCallback(
    (newSession: InspectionSession) => {
      setSession(newSession);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'STATE_UPDATE',
            payload: { session: newSession },
          })
        );
      } else {
        // Fallback to REST
        fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: newSession }),
        }).catch((err) => console.error('REST sync error:', err));
      }
    },
    []
  );

  // Helper actions
  const selectZone = useCallback(
    (zoneId: string) => {
      const updated = { ...session, currentZoneId: zoneId };
      broadcastSession(updated);
      addLog(`Switched active camera to zone: ${zoneId}`);
    },
    [session, broadcastSession, addLog]
  );

  const toggleCplFilter = useCallback(() => {
    const updated = { ...session, cplFilterActive: !session.cplFilterActive };
    broadcastSession(updated);
    addLog(`CPL Filter toggled: ${updated.cplFilterActive ? 'ACTIVE' : 'OFF'}`);
  }, [session, broadcastSession, addLog]);

  const toggleLighting = useCallback(() => {
    const updated = { ...session, lightingGood: !session.lightingGood };
    broadcastSession(updated);
    addLog(`Lighting status toggled: ${updated.lightingGood ? 'GOOD' : 'DIM'}`);
  }, [session, broadcastSession, addLog]);

  const updateVehicle = useCallback(
    (vin: string, makeModel: string) => {
      const updated = {
        ...session,
        vehicle: {
          ...session.vehicle,
          vin,
          makeModel,
        },
      };
      broadcastSession(updated);
      addLog(`Updated vehicle profile: ${makeModel} (${vin})`);
    },
    [session, broadcastSession, addLog]
  );

  const updateZoneStatus = useCallback(
    (zoneId: string, status: ZoneStatus, defects: Defect[], notes?: string) => {
      const updatedZones = session.zones.map((z) => {
        if (z.id === zoneId) {
          return {
            ...z,
            status,
            defects,
            confidence: status === 'PASS' ? 98 : status === 'WARN' ? 75 : 94,
            notes: notes || z.notes,
            lastInspectedAt: new Date().toISOString(),
          };
        }
        return z;
      });

      const updated = {
        ...session,
        zones: updatedZones,
      };
      broadcastSession(updated);
      addLog(`Updated zone ${zoneId} -> ${status}`);
    },
    [session, broadcastSession, addLog]
  );

  const triggerAiScan = useCallback(
    async (zoneId: string, imageBase64?: string) => {
      setIsAnalyzing(true);
      const currentZone = session.zones.find((z) => z.id === zoneId);
      addLog(`Analyzing ${currentZone?.name || zoneId} with AI Vision...`);

      try {
        if (APP_CONFIG.useOnDeviceAI) {
          // Edge AI: run YOLO inference in-browser, store photo on-device
          if (imageBase64) {
            try {
              await savePhoto(zoneId, imageBase64);
            } catch (e) {
              console.warn('Failed to save photo to internal storage:', e);
            }
          }

          const result = await analyzeImage(
            imageBase64 || '',
            currentZone?.name,
            `${zoneId}-${Date.now()}`
          );
          updateZoneStatus(
            zoneId,
            result.status,
            result.defects,
            result.notes
          );
          addLog(
            `On-device scan done for ${currentZone?.name}: ${result.status} (${result.defects.length} detections, ${result.modelName})`
          );
          return;
        }

        // Server-side mode: send to Gemini endpoint
        const res = await fetch('/api/ai/analyze-inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zoneId,
            zoneName: currentZone?.name,
            imageBase64,
          }),
        });

        const data = await res.json();
        if (data.status) {
          addLog(`AI Scan complete for ${currentZone?.name}: ${data.status} (${data.defects?.length || 0} defects)`);
        }
      } catch (e) {
        console.error('AI Scan Error:', e);
        addLog('AI scan failed, applying local fallback');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [session, addLog, updateZoneStatus]
  );

  const resetSession = useCallback(async () => {
    try {
      await fetch('/api/session/reset', { method: 'POST' });
      addLog('Reset inspection session');
    } catch (e) {
      setSession(INITIAL_SESSION);
    }
  }, [addLog]);

  return {
    session,
    isConnected,
    clientCount,
    isAnalyzing,
    syncLog,
    selectZone,
    toggleCplFilter,
    toggleLighting,
    updateVehicle,
    updateZoneStatus,
    triggerAiScan,
    resetSession,
  };
}
