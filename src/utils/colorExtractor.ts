export interface ExtractedColor {
  hex: string;
  name: string;
}

export interface BoundingBox {
  image_index?: number;
  ymin: number; // 0 - 1000 normalized
  xmin: number;
  ymax: number;
  xmax: number;
  label?: string;
}

export interface ColorExtractionResult {
  palette: ExtractedColor[];
  croppedImages: string[];
  metrics: {
    harmonyScore: number;
    contrastScore: number;
  };
}

// Convert RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Map HEX/RGB to aesthetic Thai/English color names
export function getAestheticColorName(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness > 235) return "Cream Linen";
  if (brightness < 18) return "Pitch Black";
  if (brightness < 38) return "Charcoal Ink";
  if (diff < 16) {
    if (brightness > 180) return "Warm Oat";
    if (brightness > 130) return "Concrete Gray";
    if (brightness > 75) return "Deep Slate";
    return "Obsidian Shadow";
  }

  let h = 0;
  if (max === r) h = ((g - b) / diff) % 6;
  else if (max === g) h = (b - r) / diff + 2;
  else h = (r - g) / diff + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  if (h >= 20 && h < 50) {
    return brightness > 150 ? "Warm Almond" : "Roasted Espresso";
  }
  if (h >= 50 && h < 75) {
    return brightness > 140 ? "Butter Muted" : "Raw Olive";
  }
  if (h >= 75 && h < 160) {
    return brightness > 140 ? "Matcha Foam" : "Forest Pine";
  }
  if (h >= 160 && h < 210) {
    return brightness > 140 ? "Misty Teal" : "Deep Marine";
  }
  if (h >= 210 && h < 265) {
    return brightness > 140 ? "Pastel Sky" : "Midnight Navy";
  }
  if (h >= 265 && h < 330) {
    return brightness > 140 ? "Lavender Mist" : "Smoky Plum";
  }
  return brightness > 140 ? "Peach Blossom" : "Terracotta Clay";
}

/**
 * Filter out Instagram app UI background colors (pure white, pure dark mode, neutral app borders).
 */
export function isAppBackground(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Instagram White mode background / header
  if (brightness > 242 && diff < 15) return true;

  // Instagram Dark mode background
  if (brightness < 32 && diff < 12) return true;

  // Instagram separator lines / neutral gray icons
  if (diff < 10 && brightness > 210 && brightness < 240) return true;
  if (diff < 10 && brightness > 30 && brightness < 60) return true;

  return false;
}

/**
 * Loads an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Second-pass border tightening: Trims empty Instagram background space
 * from edges of detected crops (e.g. empty grid slots, borders).
 */
function tightenCropBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { x: number; y: number; w: number; h: number } {
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const step = 4;

  let left = 0;
  for (let x = 0; x < width; x += step) {
    let bg = 0;
    let total = 0;
    for (let y = 0; y < height; y += step) {
      const idx = (y * width + x) * 4;
      if (isAppBackground(imgData[idx], imgData[idx + 1], imgData[idx + 2])) bg++;
      total++;
    }
    if (bg / total < 0.85) {
      left = Math.max(0, x - step);
      break;
    }
  }

  let right = width;
  for (let x = width - 1; x >= left; x -= step) {
    let bg = 0;
    let total = 0;
    for (let y = 0; y < height; y += step) {
      const idx = (y * width + x) * 4;
      if (isAppBackground(imgData[idx], imgData[idx + 1], imgData[idx + 2])) bg++;
      total++;
    }
    if (bg / total < 0.85) {
      right = Math.min(width, x + step);
      break;
    }
  }

  let top = 0;
  for (let y = 0; y < height; y += step) {
    let bg = 0;
    let total = 0;
    for (let x = left; x < right; x += step) {
      const idx = (y * width + x) * 4;
      if (isAppBackground(imgData[idx], imgData[idx + 1], imgData[idx + 2])) bg++;
      total++;
    }
    if (bg / total < 0.85) {
      top = Math.max(0, y - step);
      break;
    }
  }

  let bottom = height;
  for (let y = height - 1; y >= top; y -= step) {
    let bg = 0;
    let total = 0;
    for (let x = left; x < right; x += step) {
      const idx = (y * width + x) * 4;
      if (isAppBackground(imgData[idx], imgData[idx + 1], imgData[idx + 2])) bg++;
      total++;
    }
    if (bg / total < 0.85) {
      bottom = Math.min(height, y + step);
      break;
    }
  }

  return {
    x: left,
    y: top,
    w: Math.max(20, right - left),
    h: Math.max(20, bottom - top),
  };
}

/**
 * Calculates Color Harmony and Contrast metrics from pixel luminance and palette hues
 * Allows true scores ranging from 25 to 96 without artificial flattery floor.
 */
function calculatePhotoMetrics(
  pixelLuminances: number[],
  palette: ExtractedColor[]
): { harmonyScore: number; contrastScore: number } {
  let contrastScore = 60;
  if (pixelLuminances.length > 20) {
    const mean = pixelLuminances.reduce((a, b) => a + b, 0) / pixelLuminances.length;
    const variance =
      pixelLuminances.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pixelLuminances.length;
    const stdDev = Math.sqrt(variance);
    // stdDev typically ranges from 15 (flat/muddy) to 75 (dynamic high contrast)
    contrastScore = Math.min(95, Math.max(30, Math.round(25 + stdDev * 0.9)));
  }

  let harmonyScore = 65;
  if (palette.length >= 3) {
    const hsls = palette.map((c) => {
      const r = parseInt(c.hex.slice(1, 3), 16) / 255;
      const g = parseInt(c.hex.slice(3, 5), 16) / 255;
      const b = parseInt(c.hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0;
      let s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      return { h: h * 360, s, l };
    });

    let totalHueDiff = 0;
    let pairs = 0;
    for (let i = 0; i < hsls.length; i++) {
      for (let j = i + 1; j < hsls.length; j++) {
        let diff = Math.abs(hsls[i].h - hsls[j].h);
        if (diff > 180) diff = 360 - diff;
        totalHueDiff += diff;
        pairs++;
      }
    }
    const avgHueDiff = pairs > 0 ? totalHueDiff / pairs : 60;
    const satMean = hsls.reduce((a, b) => a + b.s, 0) / hsls.length;

    // 1. Monochromatic or tightly analogous hues (e.g. coffee, beige, warm earth)
    if (avgHueDiff < 45) {
      harmonyScore = Math.min(96, Math.max(82, Math.round(85 + (1 - avgHueDiff / 45) * 11)));
    }
    // 2. Cohesive coordinated hues with pleasant accents (e.g. forest + wood)
    else if (avgHueDiff >= 45 && avgHueDiff < 85) {
      harmonyScore = Math.min(84, Math.max(68, Math.round(80 - (avgHueDiff - 45) * 0.3)));
    }
    // 3. Uncoordinated everyday casual scatter (mixed colors, no clear theme)
    else if (avgHueDiff >= 85 && avgHueDiff < 125) {
      harmonyScore = Math.min(67, Math.max(48, Math.round(65 - (avgHueDiff - 85) * 0.42)));
    }
    // 4. Clashing / discordant colors (colors fighting across the color wheel)
    else {
      if (satMean > 0.35) {
        // High saturation clash penalty
        harmonyScore = Math.max(25, Math.round(45 - (avgHueDiff - 125) * 0.4));
      } else {
        // Muted clash
        harmonyScore = Math.max(38, Math.round(55 - (avgHueDiff - 125) * 0.28));
      }
    }
  }

  return { harmonyScore, contrastScore };
}

/**
 * Smartly extracts color DNA from uploaded screenshots:
 * 1. Uses AI bounding boxes (or heuristic crop) to isolate the post grid and avatar photos.
 * 2. Applies 2nd-pass Canvas border tightening to remove empty UI/dark-mode columns.
 * 3. Filters out pure white/black/gray Instagram UI background pixels.
 * 4. Extracts individual photo tiles for the gallery.
 * 5. Calculates Color Harmony & Contrast metrics.
 */
export async function extractColorDNA(
  files: File[],
  detectedBoxes?: BoundingBox[]
): Promise<ColorExtractionResult> {
  const defaultPalette: ExtractedColor[] = [
    { hex: "#e8dcc3", name: "Oat Milk" },
    { hex: "#9da77a", name: "Matcha" },
    { hex: "#6c4434", name: "Espresso" },
    { hex: "#d8a16f", name: "Warm Amber" },
  ];

  if (!files || files.length === 0) {
    return {
      palette: defaultPalette,
      croppedImages: [],
      metrics: { harmonyScore: 85, contrastScore: 80 },
    };
  }

  const croppedImages: string[] = [];
  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
  const sampledLuminances: number[] = [];

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    try {
      const img = await loadImage(files[fileIndex]);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      // Filter boxes for this specific file, or default to all if image_index is unspecified
      let boxes: BoundingBox[] = (detectedBoxes || []).filter(
        (b) => b.image_index === undefined || b.image_index === fileIndex
      );

      // Fallback heuristic if no valid boxes detected for this file
      if (boxes.length === 0) {
        boxes = [
          { ymin: 360, xmin: 0, ymax: 960, xmax: 1000, label: "post_grid" },
          { ymin: 80, xmin: 30, ymax: 260, xmax: 300, label: "avatar" },
        ];
      }

      for (const box of boxes) {
        const rawCropX = Math.max(0, Math.round((box.xmin / 1000) * w));
        const rawCropY = Math.max(0, Math.round((box.ymin / 1000) * h));
        const rawCropW = Math.min(w - rawCropX, Math.round(((box.xmax - box.xmin) / 1000) * w));
        const rawCropH = Math.min(h - rawCropY, Math.round(((box.ymax - box.ymin) / 1000) * h));

        if (rawCropW <= 20 || rawCropH <= 20) continue;

        // Draw initial region onto an intermediate canvas
        const rawCanvas = document.createElement("canvas");
        rawCanvas.width = rawCropW;
        rawCanvas.height = rawCropH;
        const rawCtx = rawCanvas.getContext("2d");
        if (!rawCtx) continue;

        rawCtx.drawImage(img, rawCropX, rawCropY, rawCropW, rawCropH, 0, 0, rawCropW, rawCropH);

        // 2nd-pass border tightening: trim empty background columns & rows
        const tight = tightenCropBounds(rawCtx, rawCropW, rawCropH);
        if (tight.w <= 20 || tight.h <= 20) continue;

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = tight.w;
        cropCanvas.height = tight.h;
        const cropCtx = cropCanvas.getContext("2d");
        if (!cropCtx) continue;

        cropCtx.drawImage(rawCanvas, tight.x, tight.y, tight.w, tight.h, 0, 0, tight.w, tight.h);

        // Slice into individual square tiles if it is a post grid
        if (box.label === "post_grid") {
          const ratio = tight.w / tight.h;
          // Determine number of columns based on aspect ratio
          let cols = 1;
          if (ratio >= 2.4) cols = 3;
          else if (ratio >= 1.4) cols = 2;

          const tileW = Math.floor(tight.w / cols);
          for (let c = 0; c < cols; c++) {
            const tileCanvas = document.createElement("canvas");
            tileCanvas.width = tileW;
            tileCanvas.height = Math.min(tight.h, tileW);
            const tileCtx = tileCanvas.getContext("2d");
            if (tileCtx) {
              tileCtx.drawImage(
                cropCanvas,
                c * tileW,
                0,
                tileW,
                tileCanvas.height,
                0,
                0,
                tileW,
                tileCanvas.height
              );
              try {
                croppedImages.push(tileCanvas.toDataURL("image/jpeg", 0.85));
              } catch {
                // Ignore
              }
            }
          }
        } else {
          // Avatar or standalone photo
          try {
            croppedImages.push(cropCanvas.toDataURL("image/jpeg", 0.85));
          } catch {
            // Ignore
          }
        }

        // Downsample for pixel color extraction & contrast measurement
        const sampleSize = 64;
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = sampleSize;
        sampleCanvas.height = sampleSize;
        const sampleCtx = sampleCanvas.getContext("2d");
        if (!sampleCtx) continue;

        sampleCtx.drawImage(cropCanvas, 0, 0, sampleSize, sampleSize);
        const imgData = sampleCtx.getImageData(0, 0, sampleSize, sampleSize).data;

        for (let i = 0; i < imgData.length; i += 16) {
          const a = imgData[i + 3];
          if (a < 128) continue;

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // Filter out Instagram UI background pixels
          if (isAppBackground(r, g, b)) {
            continue;
          }

          const lum = (r * 299 + g * 587 + b * 114) / 1000;
          sampledLuminances.push(lum);

          // Quantize into 32-step buckets
          const qR = Math.floor(r / 32) * 32;
          const qG = Math.floor(g / 32) * 32;
          const qB = Math.floor(b / 32) * 32;

          const key = `${qR},${qG},${qB}`;
          if (!colorBuckets[key]) {
            colorBuckets[key] = { r: qR, g: qG, b: qB, count: 0 };
          }
          colorBuckets[key].count++;
        }
      }
    } catch (err) {
      console.warn("Error processing image file for color DNA:", err);
    }
  }

  // Sort color buckets by frequency
  const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count);

  let selected: ExtractedColor[] = [];
  if (sorted.length > 0) {
    for (const item of sorted) {
      const hex = rgbToHex(item.r, item.g, item.b);
      const name = getAestheticColorName(item.r, item.g, item.b);

      const isTooClose = selected.some((s) => {
        const dr = Math.abs(parseInt(s.hex.slice(1, 3), 16) - item.r);
        const dg = Math.abs(parseInt(s.hex.slice(3, 5), 16) - item.g);
        const db = Math.abs(parseInt(s.hex.slice(5, 7), 16) - item.b);
        return dr + dg + db < 70;
      });

      // Avoid duplicate names in the palette (e.g. no duplicate "Charcoal Ink")
      const isDuplicateName = selected.some((s) => s.name === name);

      if (!isTooClose && !isDuplicateName) {
        selected.push({ hex, name });
      }
      if (selected.length >= 4) break;
    }
  }

  // Backfill with default colors ensuring distinct names and hexes
  for (const def of defaultPalette) {
    if (selected.length >= 4) break;
    if (
      !selected.some(
        (s) =>
          s.name === def.name ||
          s.hex.toLowerCase() === def.hex.toLowerCase()
      )
    ) {
      selected.push(def);
    }
  }

  const metrics = calculatePhotoMetrics(sampledLuminances, selected);

  return {
    palette: selected,
    croppedImages,
    metrics,
  };
}
