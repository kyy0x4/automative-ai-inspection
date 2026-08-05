import { createApp } from './app.js';

// Vercel serverless entry point.
// WebSocket/Realtime is not available on Vercel — session sync falls back to REST.
export default createApp();
