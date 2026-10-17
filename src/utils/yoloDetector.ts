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

    const className = YOLO_CLASS_NAMES[bestClass] || "post_tile";
    const minPreThreshold = Math.min(confThreshold, 0.34);
    if (bestScore < minPreThreshold || bestClass < 0) continue;

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

    // Allow 0.34 threshold for avatar, OR for a header avatar with an Instagram "Note" speech bubble
    // (which can cause YOLO to score the tall Note+Avatar box as post_tile around 0.34-0.41 in the top-left header)
    const isHeaderAvatarZone =
      ymin < 260 && ymax < 360 && xmin < 350 && xmax - xmin <= 280;
    const effectiveThreshold =
      className === "avatar" || (className === "post_tile" && isHeaderAvatarZone)
        ? minPreThreshold
        : confThreshold;
    if (bestScore < effectiveThreshold) continue;

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

  // Filter out partial/clipped post_tile slivers at top/bottom scroll boundaries
  const filtered = filterClippedPostTiles(kept, origW, origH);

  // Sort deterministically: group by label, then sort post_tile in reading order
  // and sort avatar by ymin ascending so the topmost main Profile Picture comes before Story Highlights
  filtered.sort((a, b) => {
    if (a.label !== b.label) {
      return a.label.localeCompare(b.label);
    }
    if (a.label === "post_tile") {
      const rowDiff = a.ymin - b.ymin;
      // If within the same horizontal row (tolerance 60/1000)
      if (Math.abs(rowDiff) < 60) {
        return a.xmin - b.xmin;
      }
      return rowDiff;
    }
    if (a.label === "avatar") {
      return a.ymin - b.ymin;
    }
    return b.confidence - a.confidence;
  });

  return filtered;
}

/**
 * 3-Stage Clipped Tile Filter + Spatial Header Avatar Recovery:
 * - Reclassifies header avatars with Note bubbles above ig_tab_bar that were misclassified as post_tile.
 * - Eliminates incomplete/cut-off post tiles at the top (under sticky tab bar)
 *   or bottom (screen edge) when a user scrolls through a profile.
 */
export function filterClippedPostTiles(
  boxes: YoloBox[],
  origW?: number,
  origH?: number
): YoloBox[] {
  const getLabel = (b: YoloBox) => b.label || (b.type as YoloClassLabel);
  const rawPostTiles = boxes.filter((b) => getLabel(b) === "post_tile");
  if (rawPostTiles.length === 0) return boxes;

  const otherBoxes = boxes.filter((b) => getLabel(b) !== "post_tile");
  const tabBar = otherBoxes.find((b) => getLabel(b) === "ig_tab_bar");
  const hasStatsOrEmpty = otherBoxes.some(
    (b) => getLabel(b) === "ig_stats_bar" || getLabel(b) === "empty_or_private"
  );

  // Stage 0: Spatial Header Avatar Recovery
  // On Instagram, the post grid NEVER exists above ig_tab_bar (t.ymax <= tabBar.ymin).
  // When a user has a Note speech bubble on their profile picture (especially on iPad/Light Mode),
  // YOLO can classify the combined Note+Avatar box in the top-left header as post_tile.
  const postTiles: YoloBox[] = [];
  for (const t of rawPostTiles) {
    const isAboveTabBar = Boolean(tabBar && t.ymax <= tabBar.ymin);
    const isInHeaderAvatarZone =
      t.ymin < 260 && t.ymax < 360 && t.xmin < 350 && t.xmax - t.xmin <= 280;

    if (isAboveTabBar || (rawPostTiles.length === 1 && isInHeaderAvatarZone && hasStatsOrEmpty)) {
      if (isInHeaderAvatarZone) {
        const recoveredAvatar: YoloBox = {
          ...t,
          type: "avatar",
          label: "avatar",
        };
        const alreadyHasAvatar = otherBoxes.some(
          (b) => getLabel(b) === "avatar" && computeIoU(b, recoveredAvatar) > 0.3
        );
        if (!alreadyHasAvatar) {
          otherBoxes.push(recoveredAvatar);
        }
      }
      // Never allow a box above ig_tab_bar to be treated as a grid post_tile
      continue;
    }
    postTiles.push(t);
  }

  if (postTiles.length === 0) return otherBoxes;

  // Stage 1: Absolute Aspect Ratio Gate
  // Standard IG grid tiles are 1:1 (H/W = 1.0) or 3:4 portrait (H/W ~ 1.33).
  // Cut-off scroll slivers have H/W < 0.72 in pixel space (or < 0.35 in normalized portrait screen space).
  const stage1Tiles = postTiles.filter((t) => {
    const normW = Math.max(1, t.xmax - t.xmin);
    const normH = Math.max(1, t.ymax - t.ymin);
    if (origW && origH && origW > 0 && origH > 0) {
      const pxW = (normW / 1000) * origW;
      const pxH = (normH / 1000) * origH;
      if (pxH / Math.max(1, pxW) < 0.72) return false;
    } else {
      if (normH / normW < 0.35) return false;
    }
    return true;
  });

  if (stage1Tiles.length === 0) return otherBoxes;

  // Compute reference full-row height from the tallest tiles in this screenshot
  const sortedHeights = stage1Tiles
    .map((t) => t.ymax - t.ymin)
    .sort((a, b) => b - a);
  const topHalfCount = Math.max(1, Math.ceil(sortedHeights.length / 2));
  const refFullHeight =
    sortedHeights[Math.floor((topHalfCount - 1) / 2)] || sortedHeights[0];

  // Stage 2 & 3: Relative Row-Height Gate & Scroll Boundary Touching Gate
  const validTiles = stage1Tiles.filter((t) => {
    const normH = t.ymax - t.ymin;

    // Stage 2: Any tile shorter than 80% of the full row height in the same screenshot is clipped
    if (normH < refFullHeight * 0.80) return false;

    // Stage 3: Touching bottom screen edge or sticky tab bar while shorter than 88% of full height
    const touchesBottomEdge = t.ymax >= 985;
    const touchesStickyTab =
      Boolean(tabBar && Math.abs(t.ymin - tabBar.ymax) <= 20) || t.ymin <= 225;
    if ((touchesBottomEdge || touchesStickyTab) && normH < refFullHeight * 0.88) {
      return false;
    }

    return true;
  });

  return [...validTiles, ...otherBoxes];
}

/**
 * Evaluates YOLO detections against the IGOTYOU Decision Matrix:
 * 1. Rejects non-IG screenshots (bank slips, chats, collages, random photos).
 * 2. Identifies 0-post / Private profiles so the app uses Avatar for Color DNA.
 * 3. Counts exact visible post tiles (1 to 9+).
 */
export function evaluateYoloDetections(boxes: YoloBox[]): YoloValidationSummary {
  // Group by image_index so relative row-height filtering works per screenshot
  const grouped = new Map<number, YoloBox[]>();
  for (const b of boxes) {
    const idx = b.image_index ?? 0;
    if (!grouped.has(idx)) grouped.set(idx, []);
    grouped.get(idx)!.push(b);
  }
  const cleanedBoxes: YoloBox[] = [];
  for (const [, groupBoxes] of grouped) {
    cleanedBoxes.push(...filterClippedPostTiles(groupBoxes));
  }

  const getLabel = (b: YoloBox) => b.label || (b.type as YoloClassLabel);
  const hasAvatar = cleanedBoxes.some((b) => getLabel(b) === "avatar");
  const hasStats = cleanedBoxes.some((b) => getLabel(b) === "ig_stats_bar");
  const hasTabBar = cleanedBoxes.some((b) => getLabel(b) === "ig_tab_bar");
  const hasStrongTabBar = cleanedBoxes.some(
    (b) =>
      getLabel(b) === "ig_tab_bar" &&
      b.confidence >= 0.55 &&
      b.xmax - b.xmin >= 350
  );
  const hasEmptyState = cleanedBoxes.some((b) => getLabel(b) === "empty_or_private");
  const postTiles = cleanedBoxes.filter((b) => getLabel(b) === "post_tile");

  // Valid IG Profile conditions:
  // - Has header anchors (avatar + stats/tabs/empty/tiles)
  // - Or has stats + tabs
  // - Or has tab bar + tiles/empty, or a high-confidence full-width IG tab bar (e.g. 0-post "Create your first post" on iPad)
  // - Or is a scrolled grid screenshot with >= 4 tiles, or 3 tiles with tight IG grid spacing (gap <= 12)
  const isValidHeader =
    (hasAvatar && (hasStats || hasTabBar || hasEmptyState || postTiles.length >= 1)) ||
    (hasStats && (hasTabBar || hasEmptyState || postTiles.length >= 1)) ||
    (hasTabBar && (postTiles.length >= 1 || hasEmptyState)) ||
    hasStrongTabBar;

  let hasTightGridSpacing = false;
  if (postTiles.length === 3) {
    const sortedX = [...postTiles].sort((a, b) => a.xmin - b.xmin);
    const gap1 = Math.abs(sortedX[1].xmin - sortedX[0].xmax);
    const gap2 = Math.abs(sortedX[2].xmin - sortedX[1].xmax);
    hasTightGridSpacing = gap1 <= 12 && gap2 <= 12;
  }

  const isScrolledGrid = postTiles.length >= 4 || (postTiles.length === 3 && hasTightGridSpacing);
  const isValidProfile = isValidHeader || isScrolledGrid;

  if (!isValidProfile) {
    return {
      isValidProfile: false,
      isZeroPostOrPrivate: false,
      postCount: 0,
      invalidReason:
        "ภาพที่อัปโหลดไม่ตรงกับหน้าจอโปรไฟล์ Instagram (ไม่พบแถบสถิติ รูปโปรไฟล์ หรือตารางโพสต์) กรุณาแคปภาพหน้าโปรไฟล์ Instagram แล้วลองใหม่อีกครั้ง",
      boxes: cleanedBoxes,
    };
  }

  const isZeroPostOrPrivate = postTiles.length === 0 || (hasEmptyState && postTiles.length === 0);

  return {
    isValidProfile: true,
    isZeroPostOrPrivate,
    postCount: postTiles.length,
    boxes: cleanedBoxes,
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
