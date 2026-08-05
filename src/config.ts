/**
 * App configuration switches.
 */

export const APP_CONFIG = {
  // true  -> run YOLO inference on-device (Edge AI, no backend, free)
  // false -> send image to server-side Gemini endpoint (/api/ai/analyze-inspection)
  useOnDeviceAI: true,
};
