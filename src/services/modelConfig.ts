/**
 * On-device model configuration.
 *
 * AFTER TRAINING — update ONLY this file:
 *   1. Export your trained YOLO model to ONNX:
 *        yolo export model=best.pt format=onnx imgsz=640
 *   2. Copy the exported .onnx into `public/models/`.
 *   3. Set `fileName` to that file's name.
 *   4. Set `classes` to your defect labels — MUST match the class order
 *      used during training (index 0, 1, 2, ...).
 *
 * ═══════════════════════════════════════════════════════════════
 * ✅ CarDD TRAINED MODEL TEMPLATE (uncomment setelah training):
 * ═══════════════════════════════════════════════════════════════
 *   fileName: 'best.onnx',
 *   classes: ['dent', 'scratch', 'crack', 'glass shatter', 'lamp broken', 'tire flat'],
 *   inputSize: 640,
 *   confThreshold: 0.3,
 *   iouThreshold: 0.45,
 * ═══════════════════════════════════════════════════════════════
 *
 * The rest of the app picks up these values automatically.
 */

export const MODEL_CONFIG = {
  // Placeholder COCO model — replace with your trained defect model file name.
  fileName: 'yolov8n.onnx',

  // Class names in the exact training order. Example for a defect model:
  // classes: ['dent', 'scratch', 'chipping', 'crack', 'rust', 'paint_discoloration']
  classes: [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat',
    'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork',
    'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog',
    'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv',
    'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
    'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush',
  ],

  // Model input size — keep 640 (standard YOLO). Smaller = faster but less accurate.
  inputSize: 640,

  // Detection tuning
  confThreshold: 0.3,
  iouThreshold: 0.45,
};
