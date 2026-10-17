import { BoundingBox } from "./colorExtractor";

export type YoloClassLabel =
  | "post_tile"
  | "avatar"
  | "ig_stats_bar"
  | "ig_tab_bar"
  | "empty_or_private";

export const YOLO_CLASS_NAMES: Record<number, YoloClassLabel> = {
  0: "post_tile",
  1: "avatar",
  2: "ig_stats_bar",
  3: "ig_tab_bar",
  4: "empty_or_private",
};

export interface YoloBox extends BoundingBox {
  label: YoloClassLabel;
  confidence: number;
}

export interface YoloValidationSummary {
  isValidProfile: boolean;
  isZeroPostOrPrivate: boolean;
  postCount: number;
  invalidReason?: string;
  boxes: YoloBox[];
}

/**
 * Calculates Intersection over Union (IoU) between two normalized [0..1000] boxes
 */
export function computeIoU(a: BoundingBox, b: BoundingBox): number {
  const xA = Math.max(a.xmin, b.xmin);
  const yA = Math.max(a.ymin, b.ymin);
  const xB = Math.min(a.xmax, b.xmax);
  const yB = Math.min(a.ymax, b.ymax);

  const interW = Math.max(0, xB - xA);
  const interH = Math.max(0, yB - yA);
  const interArea = interW * interH;

  if (interArea <= 0) return 0;

  const areaA = Math.max(1, (a.xmax - a.xmin) * (a.ymax - a.ymin));
  const areaB = Math.max(1, (b.xmax - b.xmin) * (b.ymax - b.ymin));

  return interArea / (areaA + areaB - interArea);
}

/**
 * Parses raw YOLOv11/v8 output tensor [1, 4 + numClasses, numAnchors]
 * into normalized [0..1000] BoundingBoxes with Non-Maximum Suppression (NMS),
 * sorted in natural reading order (top-to-bottom, left-to-right).
 */
export function parseYoloOutputTensor(
  outputData: ArrayLike<number>,
  numAnchors = 8400,
  numClasses = 5,
  scale = 1,
  padX = 0,
  padY = 0,
  origW = 640,
  origH = 640,
  confThreshold = 0.42,
  iouThreshold = 0.45,
  imageIndex = 0
): YoloBox[] {
  const candidates: YoloBox[] = [];

  for (let i = 0; i < numAnchors; i++) {
    let bestClass = -1;
    let bestScore = 0;

    for (let c = 0; c < numClasses; c++) {
      const score = outputData[(4 + c) * numAnchors + i];
      if (score > bestScore) {
        bestScore = score;
        bestClass = c;
      }
    }

    if (bestScore < confThreshold || bestClass < 0) continue;

    const cx = outputData[0 * numAnchors + i];
    const cy = outputData[1 * numAnchors + i];
    const w = outputData[2 * numAnchors + i];
    const h = outputData[3 * numAnchors + i];

    // Map from 640x640 letterboxed space back to original image pixels
    const x1 = (cx - w / 2 - padX) / scale;
    const y1 = (cy - h / 2 - padY) / scale;
    const x2 = (cx + w / 2 - padX) / scale;
    const y2 = (cy + h / 2 - padY) / scale;

    // Normalize to 0 - 1000
    const xmin = Math.max(0, Math.min(1000, Math.round((x1 / origW) * 1000)));
    const ymin = Math.max(0, Math.min(1000, Math.round((y1 / origH) * 1000)));
    const xmax = Math.max(0, Math.min(1000, Math.round((x2 / origW) * 1000)));
    const ymax = Math.max(0, Math.min(1000, Math.round((y2 / origH) * 1000)));

    if (xmax - xmin < 15 || ymax - ymin < 15) continue;

    const className = YOLO_CLASS_NAMES[bestClass] || "post_tile";
    candidates.push({
      image_index: imageIndex,
      type: className,
      label: className,
      xmin,
      ymin,
      xmax,
      ymax,
      confidence: bestScore,
    });
  }

  // Per-class Non-Maximum Suppression (NMS)
  candidates.sort((a, b) => b.confidence - a.confidence);
  const kept: YoloBox[] = [];

  for (const cand of candidates) {
    const isOverlapping = kept.some(
      (k) => k.label === cand.label && computeIoU(k, cand) > iouThreshold
    );
    if (!isOverlapping) {
      kept.push(cand);
    }
  }

  // Sort post_tile in natural reading order (row by row, left to right)
  kept.sort((a, b) => {
    if (a.label === "post_tile" && b.label === "post_tile") {
      const rowDiff = a.ymin - b.ymin;
      // If within the same horizontal row (tolerance 60/1000)
      if (Math.abs(rowDiff) < 60) {
        return a.xmin - b.xmin;
      }
      return rowDiff;
    }
    return 0;
  });

  return kept;
}

/**
 * Evaluates YOLO detections against the IGOTYOU Decision Matrix:
 * 1. Rejects non-IG screenshots (bank slips, chats, random photos).
 * 2. Identifies 0-post / Private profiles so the app uses Avatar for Color DNA.
 * 3. Counts exact visible post tiles (1 to 9+).
 */
export function evaluateYoloDetections(boxes: YoloBox[]): YoloValidationSummary {
  const getLabel = (b: YoloBox) => b.label || (b.type as YoloClassLabel);
  const hasAvatar = boxes.some((b) => getLabel(b) === "avatar");
  const hasStats = boxes.some((b) => getLabel(b) === "ig_stats_bar");
  const hasTabBar = boxes.some((b) => getLabel(b) === "ig_tab_bar");
  const hasEmptyState = boxes.some((b) => getLabel(b) === "empty_or_private");
  const postTiles = boxes.filter((b) => getLabel(b) === "post_tile");

  // Valid IG Profile conditions:
  // - Has header anchors (avatar + stats/tabs/empty/tiles)
  // - Or has stats + tabs
  // - Or has tab bar + tiles/empty
  // - Or is a scrolled grid screenshot with >= 3 aligned post tiles
  const isValidHeader =
    (hasAvatar && (hasStats || hasTabBar || hasEmptyState || postTiles.length >= 1)) ||
    (hasStats && (hasTabBar || hasEmptyState || postTiles.length >= 1)) ||
    (hasTabBar && (postTiles.length >= 1 || hasEmptyState));

  const isScrolledGrid = postTiles.length >= 3;
  const isValidProfile = isValidHeader || isScrolledGrid;

  if (!isValidProfile) {
    return {
      isValidProfile: false,
      isZeroPostOrPrivate: false,
      postCount: 0,
      invalidReason:
        "ภาพที่อัปโหลดไม่ตรงกับหน้าจอโปรไฟล์ Instagram (ไม่พบแถบสถิติ รูปโปรไฟล์ หรือตารางโพสต์) กรุณาแคปภาพหน้าโปรไฟล์ Instagram แล้วลองใหม่อีกครั้ง",
      boxes,
    };
  }

  const isZeroPostOrPrivate = postTiles.length === 0 || (hasEmptyState && postTiles.length === 0);

  return {
    isValidProfile: true,
    isZeroPostOrPrivate,
    postCount: postTiles.length,
    boxes,
  };
}

let cachedOrtSession: any = null;
let modelCheckAttempted = false;
let modelAvailable = false;

/**
 * Dynamically loads onnxruntime-web and runs /models/ig_detector.onnx if placed in public/models/.
 * Returns null if the ONNX model file is not deployed yet, seamlessly falling back to standard pipeline.
 */
export async function runLocalYoloDetection(files: File[]): Promise<YoloValidationSummary | null> {
  if (typeof window === "undefined" || !files || files.length === 0) return null;

  try {
    if (!modelCheckAttempted) {
      modelCheckAttempted = true;
      const headRes = await fetch("/models/ig_detector.onnx", { method: "HEAD" }).catch(() => null);
      const contentType = headRes?.headers.get("content-type") || "";
      // Make sure it's actually a binary ONNX file and not SPA index.html fallback
      modelAvailable = Boolean(
        headRes && headRes.ok && !contentType.includes("text/html")
      );
    }

    if (!modelAvailable) return null;

    // Load ONNX Runtime Web from CDN on-demand
    if (!(window as any).ort) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load onnxruntime-web"));
        document.head.appendChild(script);
      });
    }

    const ort = (window as any).ort;
    if (!cachedOrtSession) {
      cachedOrtSession = await ort.InferenceSession.create("/models/ig_detector.onnx", {
        executionProviders: ["wasm"],
      });
    }

    const allBoxes: YoloBox[] = [];

    for (let idx = 0; idx < files.length; idx++) {
      const imgUrl = URL.createObjectURL(files[idx]);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = imgUrl;
      });
      URL.revokeObjectURL(imgUrl);

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const targetSize = 640;

      const scale = Math.min(targetSize / origW, targetSize / origH);
      const newW = Math.round(origW * scale);
      const newH = Math.round(origH * scale);
      const padX = Math.floor((targetSize - newW) / 2);
      const padY = Math.floor((targetSize - newH) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      // Standard YOLO letterbox gray (114, 114, 114)
      ctx.fillStyle = "rgb(114, 114, 114)";
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.drawImage(img, 0, 0, origW, origH, padX, padY, newW, newH);

      const imgData = ctx.getImageData(0, 0, targetSize, targetSize).data;
      const floatData = new Float32Array(3 * targetSize * targetSize);
      const area = targetSize * targetSize;

      for (let i = 0; i < area; i++) {
        floatData[i] = imgData[i * 4] / 255.0;
        floatData[area + i] = imgData[i * 4 + 1] / 255.0;
        floatData[2 * area + i] = imgData[i * 4 + 2] / 255.0;
      }

      const inputTensor = new ort.Tensor("float32", floatData, [1, 3, targetSize, targetSize]);
      const inputName = cachedOrtSession.inputNames[0];
      const feeds: Record<string, any> = { [inputName]: inputTensor };
      const results = await cachedOrtSession.run(feeds);
      const outputName = cachedOrtSession.outputNames[0];
      const outputTensor = results[outputName];

      const numClasses = outputTensor.dims[1] - 4;
      const numAnchors = outputTensor.dims[2];

      const fileBoxes = parseYoloOutputTensor(
        outputTensor.data,
        numAnchors,
        numClasses,
        scale,
        padX,
        padY,
        origW,
        origH,
        0.42,
        0.45,
        idx
      );
      allBoxes.push(...fileBoxes);
    }

    return evaluateYoloDetections(allBoxes);
  } catch (err) {
    console.warn("[YOLO Detector] Local ONNX inference skipped, using fallback pipeline:", err);
    return null;
  }
}
