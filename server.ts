import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createApp, currentSession, setSession, resetSessionStore } from './api/app.js';
import { InspectionSession, RealtimeMessage } from './src/types.js';

const PORT = 3000;
const app = createApp((type: string, payload: unknown) => {
  broadcastState({ type: type as RealtimeMessage['type'], payload });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const connectedClients = new Set<WebSocket>();

function broadcastState(message: RealtimeMessage, senderWs?: WebSocket) {
  const data = JSON.stringify(message);
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Setup WebSocket handling
wss.on('connection', (ws: WebSocket) => {
  connectedClients.add(ws);

  // Send current state to newly connected client immediately
  ws.send(
    JSON.stringify({
      type: 'SYNC_STATE',
      payload: {
        session: currentSession,
        clientCount: connectedClients.size,
      },
    })
  );

  // Notify everyone about new client count
  broadcastState({
    type: 'CLIENT_COUNT',
    payload: { clientCount: connectedClients.size },
  });

  ws.on('message', (rawMessage: Buffer) => {
    try {
      const msg: RealtimeMessage = JSON.parse(rawMessage.toString());
      if (msg.type === 'STATE_UPDATE' && msg.payload?.session) {
        setSession(msg.payload.session);
        broadcastState(
          {
            type: 'STATE_UPDATE',
            payload: { session: currentSession },
          },
          ws
        );
      } else if (msg.type === 'RESET_STATE') {
        resetSessionStore();
        broadcastState({
          type: 'SYNC_STATE',
          payload: { session: currentSession, clientCount: connectedClients.size },
        });
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcastState({
      type: 'CLIENT_COUNT',
      payload: { clientCount: connectedClients.size },
    });
  });
});

// Vite or Static file middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Automotive Inspection Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
