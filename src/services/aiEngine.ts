/**
 * On-device AI inspection engine (Edge AI).
 *
 * Runs a YOLOv8 ONNX model directly in the browser via ONNX Runtime Web
 * (WebAssembly / WebGPU) — no backend required.
 *
 * Currently ships with a COCO placeholder model (yolov8n.onnx) to prove the
 * pipeline. When the custom defect model is trained, drop the exported .onnx
 * into `public/models/` and update MODEL_CLASSES below.
 */
import * as ort from 'onnxruntime-web';
import { Defect, ZoneStatus } from '../types';

export interface AnalyzeResult {
  status: ZoneStatus;
  confidence: number;
  defects: Defect[];
  notes: string;
  modelName: string;
}

interface DetBox {
  x: number;
  y: number;
  w: number;
  h: number;
  classId: number;
  score: number;
}

const IMG_SIZE = 640;
const CONF_THRESHOLD = 0.3;
const IOU_THRESHOLD = 0.45;

const MODEL_URL = '/models/yolov8n.onnx';

// TODO: Replace with your trained defect classes, e.g.
// ['dent', 'scratch', 'chipping', 'crack', 'rust', 'paint_discoloration']
const MODEL_CLASSES = [
  'person','bicycle','car','motorcycle','airplane','bus','train','truck','boat',
  'traffic light','fire hydrant','stop sign','parking meter','bench','bird','cat',
  'dog','horse','sheep','cow','elephant','bear','zebra','giraffe','backpack','umbrella',
  'handbag','tie','suitcase','frisbee','skis','snowboard','sports ball','kite','baseball bat',
  'baseball glove','skateboard','surfboard','tennis racket','bottle','wine glass','cup','fork',
  'knife','spoon','bowl','banana','apple','sandwich','orange','broccoli','carrot','hot dog',
  'pizza','donut','cake','chair','couch','potted plant','bed','dining table','toilet','tv',
  'laptop','mouse','remote','keyboard','cell phone','microwave','oven','toaster','sink',
  'refrigerator','book','clock','vase','scissors','teddy bear','hair drier','toothbrush',
];

let session: ort.InferenceSession | null = null;
let modelReady = false;
let modelError: string | null = null;
let initPromise: Promise<void> | null = null;

export function getModelStatus() {
  return {
    ready: modelReady,
    error: modelError,
    name: modelReady ? 'yolov8n.onnx (COCO placeholder)' : 'simulated (no model loaded)',
  };
}

export async function initAI(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      // Serve WASM runtime locally instead of CDN (supports offline-first later)
      ort.env.wasm.wasmPaths = '/wasm/';
      session = await ort.InferenceSession.create(MODEL_URL);
      modelReady = true;
      modelError = null;
    } catch (err) {
      modelReady = false;
      modelError = err instanceof Error ? err.message : String(err);
      console.warn('On-device model load failed, falling back to local simulation:', modelError);
    }
  })();
  return initPromise;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = dataUrl;
  });
}

/** Letterbox-resize + normalize to [0,1] RGB, channel-first. */
function preprocess(
  img: HTMLImageElement
): { tensor: ort.Tensor; scale: number; padX: number; padY: number } {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const scale = Math.min(IMG_SIZE / w, IMG_SIZE / h);
  const newW = Math.max(1, Math.round(w * scale));
  const newH = Math.max(1, Math.round(h * scale));
  const padX = Math.round((IMG_SIZE - newW) / 2);
  const padY = Math.round((IMG_SIZE - newH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = IMG_SIZE;
  canvas.height = IMG_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, IMG_SIZE, IMG_SIZE);
  ctx.drawImage(img, padX, padY, newW, newH);

  const pixels = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE).data;
  const size = IMG_SIZE * IMG_SIZE;
  const data = new Float32Array(3 * size);
  for (let i = 0; i < size; i++) {
    data[i] = pixels[i * 4] / 255; // R
    data[size + i] = pixels[i * 4 + 1] / 255; // G
    data[2 * size + i] = pixels[i * 4 + 2] / 255; // B
  }
  return { tensor: new ort.Tensor('float32', data, [1, 3, IMG_SIZE, IMG_SIZE]), scale, padX, padY };
}

function iou(a: DetBox, b: DetBox): number {
  const ax1 = a.x, ay1 = a.y, ax2 = a.x + a.w, ay2 = a.y + a.h;
  const bx1 = b.x, by1 = b.y, bx2 = b.x + b.w, by2 = b.y + b.h;
  const ix1 = Math.max(ax1, bx1), iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2), iy2 = Math.min(ay2, by2);
  const iw = Math.max(0, ix2 - ix1), ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

function nms(boxes: DetBox[], iouThresh: number): DetBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: DetBox[] = [];
  while (sorted.length) {
    const best = sorted.shift()!;
    kept.push(best);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (iou(best, sorted[i]) > iouThresh) sorted.splice(i, 1);
    }
  }
  return kept;
}

function postprocess(
  output: ort.Tensor,
  scale: number,
  padX: number,
  padY: number,
  imgW: number,
  imgH: number,
  zoneName?: string
): Defect[] {
  const data = output.data as Float32Array;
  const dims = output.dims;
  if (dims.length !== 3) return [];

  const isRowMajor = dims[1] > dims[2]; // [1, A, C] vs [1, C, A]
  const numClasses = isRowMajor ? dims[2] - 4 : dims[1] - 4;
  const numAnchors = isRowMajor ? dims[1] : dims[2];
  const rowLen = isRowMajor ? dims[2] : numAnchors;

  const boxes: DetBox[] = [];
  for (let i = 0; i < numAnchors; i++) {
    const base = isRowMajor ? i * rowLen : 0;
    const cx = data[base + 0 + (isRowMajor ? 0 : i)];
    const cy = data[base + 1 + (isRowMajor ? 0 : i)];
    const w = data[base + 2 + (isRowMajor ? 0 : i)];
    const h = data[base + 3 + (isRowMajor ? 0 : i)];

    let bestClass = 0;
    let bestScore = 0;
    for (let c = 0; c < numClasses; c++) {
      const s = data[base + (isRowMajor ? 4 + c : (4 + c) * rowLen + i)];
      if (s > bestScore) {
        bestScore = s;
        bestClass = c;
      }
    }
    if (bestScore < CONF_THRESHOLD) continue;

    let x1 = (cx - w / 2), y1 = (cy - h / 2), x2 = (cx + w / 2), y2 = (cy + h / 2);
    x1 = Math.max(0, x1); y1 = Math.max(0, y1);
    x2 = Math.min(IMG_SIZE, x2); y2 = Math.min(IMG_SIZE, y2);

    const ox1 = (x1 - padX) / scale;
    const oy1 = (y1 - padY) / scale;
    const ox2 = (x2 - padX) / scale;
    const oy2 = (y2 - padY) / scale;
    const bw = ox2 - ox1, bh = oy2 - oy1;
    if (bw <= 0 || bh <= 0) continue;

    boxes.push({ x: ox1, y: oy1, w: bw, h: bh, classId: bestClass, score: bestScore });
  }

  return nms(boxes, IOU_THRESHOLD).map((b, idx) => {
    const className = MODEL_CLASSES[b.classId] || `class_${b.classId}`;
    const severity =
      b.score > 0.7 ? 'MODERATE' : b.score > 0.45 ? 'MINOR' : 'MICRO';
    return {
      id: `ai-defect-${Date.now()}-${idx}`,
      type: className as Defect['type'],
      severity: severity as Defect['severity'],
      confidence: Math.max(5, Math.round(b.score * 100)),
      location: zoneName || 'Vehicle Surface',
      description: `Detected "${className}" (${Math.round(b.score * 100)}% confidence). ${
        modelReady ? 'COCO placeholder detection — replace with trained defect model.' : ''
      }`,
      bbox: {
        x: (b.x / imgW) * 100,
        y: (b.y / imgH) * 100,
        width: (b.w / imgW) * 100,
        height: (b.h / imgH) * 100,
      },
      createdAt: new Date().toISOString(),
    };
  });
}

/** Deterministic-ish simulated result used when no model is available. */
function simulateResult(zoneName?: string, seed?: string): AnalyzeResult {
  const conf = 82 + Math.floor(Math.random() * 14);
  const types: Defect['type'][] = ['Dent', 'Chipping', 'Scratch'];
  const idx = Math.floor(Math.random() * types.length);
  const defect: Defect = {
    id: `sim-defect-${Date.now()}`,
    type: types[idx],
    severity: Math.random() > 0.6 ? 'MODERATE' : 'MINOR',
    confidence: conf,
    location: zoneName || 'Vehicle Surface',
    description: 'Simulated detection — on-device YOLO model not loaded yet.',
    bbox: {
      x: 25 + Math.floor(Math.random() * 35),
      y: 25 + Math.floor(Math.random() * 35),
      width: 24,
      height: 22,
    },
    createdAt: new Date().toISOString(),
  };
  return {
    status: 'FAIL',
    confidence: conf,
    defects: [defect],
    notes: 'Simulated scan analysis (on-device model not available).',
    modelName: 'simulated',
  };
}

export async function analyzeImage(
  dataUrl: string,
  zoneName?: string,
  _seed?: string
): Promise<AnalyzeResult> {
  if (!modelReady || !session) {
    return simulateResult(zoneName);
  }

  try {
    const img = await loadImage(dataUrl);
    const { tensor, scale, padX, padY } = preprocess(img);
    const feeds: Record<string, ort.Tensor> = {};
    feeds[session.inputNames[0]] = tensor;
    const results = await session.run(feeds);
    const output = results[session.outputNames[0]];
    const defects = postprocess(output, scale, padX, padY, img.naturalWidth, img.naturalHeight, zoneName);

    const status: ZoneStatus = defects.length > 0 ? 'FAIL' : 'PASS';
    const avgConf =
      defects.length > 0
        ? Math.round(defects.reduce((s, d) => s + d.confidence, 0) / defects.length)
        : 98;

    return {
      status,
      confidence: avgConf,
      defects,
      notes:
        defects.length > 0
          ? `${defects.length} object(s) detected by on-device model.`
          : 'No objects detected. (Placeholder COCO model — trained defect model coming soon.)',
      modelName: 'yolov8n.onnx (COCO placeholder)',
    };
  } catch (err) {
    console.error('On-device inference error:', err);
    return simulateResult(zoneName);
  }
}
