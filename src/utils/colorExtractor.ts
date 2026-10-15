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
  avatarImage?: string;
  metrics: {
    harmonyScore: number;
    contrastScore: number;
  };
}

export interface PixelBuffer {
  width: number;
  height: number;
  data: ArrayLike<number>;
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

  // Instagram Light mode background / headers / cards
  if (brightness > 240 && diff < 18) return true;
  if (brightness > 210 && brightness <= 240 && diff < 12) return true;

  // Instagram Dark mode background / headers
  if (brightness < 36 && diff < 16) return true;
  if (brightness >= 36 && brightness < 58 && diff < 12) return true;

  return false;
}

/**
 * Detects horizontal content boundaries of the Instagram grid.
 * Handles tablet / foldable / iPad letterboxing pillars automatically.
 */
export function findGridHorizontalBounds(
  buf: PixelBuffer,
  approxXmin?: number,
  approxXmax?: number
): { left: number; width: number } {
  const w = buf.width;
  const h = buf.height;

  // If Gemini provided valid horizontal bounds covering the grid
  if (
    typeof approxXmin === "number" &&
    typeof approxXmax === "number" &&
    approxXmax - approxXmin > 120
  ) {
    const rawLeft = Math.max(0, Math.round((approxXmin / 1000) * w));
    const rawRight = Math.min(w, Math.round((approxXmax / 1000) * w));
    return { left: rawLeft, width: rawRight - rawLeft };
  }

  // Scan left in expected grid area: y in [0.40*h .. 0.85*h]
  // We look for continuous width >= 20px of non-background to avoid navigation rail icons
  let left = 0;
  for (let x = 0; x < Math.floor(w * 0.45); x += 2) {
    let continuousRunsTotal = 0;
    let count = 0;
    for (let y = Math.floor(h * 0.4); y < Math.floor(h * 0.85); y += 12) {
      let run = 0;
      for (let dx = 0; dx < Math.min(120, w - x); dx += 2) {
        const idx = (y * w + (x + dx)) * 4;
        if (!isAppBackground(buf.data[idx], buf.data[idx + 1], buf.data[idx + 2])) {
          run += 2;
        } else {
          break;
        }
      }
      continuousRunsTotal += run;
      count++;
    }
    const avgRun = count > 0 ? continuousRunsTotal / count : 0;
    if (avgRun >= 20) {
      left = Math.max(0, x - 1);
      break;
    }
  }

  // Scan right from w - 1 inward
  let right = w;
  for (let x = w - 1; x >= Math.floor(w * 0.45); x -= 2) {
    let continuousRunsTotal = 0;
    let count = 0;
    for (let y = Math.floor(h * 0.4); y < Math.floor(h * 0.85); y += 12) {
      let run = 0;
      for (let dx = 0; dx < Math.min(120, x); dx += 2) {
        const idx = (y * w + (x - dx)) * 4;
        if (!isAppBackground(buf.data[idx], buf.data[idx + 1], buf.data[idx + 2])) {
          run += 2;
        } else {
          break;
        }
      }
      continuousRunsTotal += run;
      count++;
    }
    const avgRun = count > 0 ? continuousRunsTotal / count : 0;
    if (avgRun >= 20) {
      right = Math.min(w, x + 1);
      break;
    }
  }

  const rightPillar = w - right;

  // Phone screen check:
  // On mobile phone screens, Instagram grid is always edge-to-edge full width.
  if (left < 24) {
    left = 0;
    right = w;
  } else if (Math.abs(left - rightPillar) <= Math.max(left, rightPillar) * 0.35) {
    // Symmetrical tablet pillars (e.g. iPad layout with equal margins on both sides)
    // Keep detected left and right
  } else {
    // Asymmetric bounds (e.g. tablet with left navigation rail where column 2 or 3 is empty background)
    const span = right - left;
    const mid = Math.floor((left + right) / 2);
    let gapDetected = false;
    for (let mx = mid - 8; mx <= mid + 8; mx++) {
      let bgCount = 0;
      let total = 0;
      for (let y = Math.floor(h * 0.45); y < Math.floor(h * 0.85); y += 8) {
        const idx = (y * w + mx) * 4;
        if (isAppBackground(buf.data[idx], buf.data[idx + 1], buf.data[idx + 2])) {
          bgCount++;
        }
        total++;
      }
      if (total > 0 && bgCount / total > 0.3) {
        gapDetected = true;
        break;
      }
    }

    if (gapDetected || (span / w >= 0.45 && span / w <= 0.65)) {
      // 2 columns detected: span is 2 columns out of 3
      const colW = Math.floor(span / 2);
      right = Math.min(w, left + colW * 3 + 4);
    }
  }

  return { left, width: Math.max(80, right - left) };
}

/**
 * Automatic Grid Start Detection:
 * Pinpoints the exact vertical Y row where Instagram tab icons end and photo pixels begin.
 */
export function findExactGridStartY(
  buf: PixelBuffer,
  approxY?: number,
  gridLeft: number = 0,
  colWidth?: number
): number {
  const width = buf.width;
  const height = buf.height;
  const colW = colWidth || Math.floor(width / 3);

  const startScanY = Math.max(
    Math.round(height * 0.22),
    typeof approxY === "number" && approxY > 20
      ? Math.round(approxY) - 50
      : Math.round(height * 0.3)
  );

  const maxScanY = Math.min(
    Math.round(height * 0.82),
    typeof approxY === "number" && approxY > 20
      ? Math.round(approxY) + 160
      : Math.round(height * 0.78)
  );

  // Post photos have sustained continuous content for at least colW * 0.45 px vertically,
  // whereas UI buttons and highlights have short heights (< 40px) or background gaps.
  const checkH = Math.max(28, Math.round(colW * 0.45));

  for (let y = startScanY; y < maxScanY; y++) {
    let hasGap = false;
    let nonBgRowCount = 0;
    let steps = 0;

    for (let dy = 0; dy < checkH; dy += 4) {
      const curY = y + dy;
      if (curY >= height) {
        hasGap = true;
        break;
      }

      let c0 = 0;
      let t0 = 0;
      for (let x = gridLeft + 15; x < gridLeft + colW - 15; x += 3) {
        if (x >= width) break;
        const idx = (curY * width + x) * 4;
        if (!isAppBackground(buf.data[idx], buf.data[idx + 1], buf.data[idx + 2])) c0++;
        t0++;
      }

      let c1 = 0;
      let t1 = 0;
      for (let x = gridLeft + colW + 15; x < gridLeft + colW * 2 - 15; x += 3) {
        if (x >= width) break;
        const idx = (curY * width + x) * 4;
        if (!isAppBackground(buf.data[idx], buf.data[idx + 1], buf.data[idx + 2])) c1++;
        t1++;
      }

      const r0 = t0 > 0 ? c0 / t0 : 0;
      const r1 = t1 > 0 ? c1 / t1 : 0;
      const maxR = Math.max(r0, r1);

      if (maxR < 0.2) {
        hasGap = true;
        break;
      }
      if (maxR >= 0.55) {
        nonBgRowCount++;
      }
      steps++;
    }

    if (!hasGap && steps > 0 && nonBgRowCount >= steps * 0.75) {
      return y;
    }
  }

  return approxY && approxY > 0 ? approxY : Math.round(height * 0.38);
}

/**
 * Adaptive Row Height & Aspect Ratio Detection:
 * Automatically detects whether the Instagram grid is Modern Vertical (3:4 or 4:5 portrait)
 * or Legacy Square (1:1), and locks in the exact row height in pixels.
 */
export function findGridRowHeight(
  buf: PixelBuffer,
  gridStartY: number,
  gridLeft: number,
  colWidth: number,
  gap: number,
  maxAllowedY: number
): number {
  const w = buf.width;
  const h = buf.height;

  const minDy = Math.round(colWidth * 0.88);
  const maxDy = Math.min(
    maxAllowedY - gridStartY - 10,
    h - gridStartY - 10,
    Math.round(colWidth * 1.45)
  );

  let bestDy = 0;
  let maxDiff = -1;

  for (let dy = minDy; dy <= maxDy; dy++) {
    const y = gridStartY + dy;
    if (y + 1 >= h) break;

    let totalDiff = 0;
    let validCols = 0;

    for (let c = 0; c < 3; c++) {
      const x0 = gridLeft + c * (colWidth + gap) + 12;
      const x1 = x0 + colWidth - 24;
      if (x1 >= w) continue;

      let colDiff = 0;
      let count = 0;
      for (let x = x0; x < x1; x += 4) {
        const idx1 = (y * w + x) * 4;
        const idx2 = ((y + 1) * w + x) * 4;
        const d =
          Math.abs(buf.data[idx1] - buf.data[idx2]) +
          Math.abs(buf.data[idx1 + 1] - buf.data[idx2 + 1]) +
          Math.abs(buf.data[idx1 + 2] - buf.data[idx2 + 2]);
        colDiff += d;
        count++;
      }
      if (count > 0) {
        totalDiff += colDiff / count;
        validCols++;
      }
    }

    const avgDiff = validCols > 0 ? totalDiff / validCols : 0;
    if (avgDiff > maxDiff) {
      maxDiff = avgDiff;
      bestDy = dy;
    }
  }

  // If a distinct horizontal row boundary is detected across the columns
  if (maxDiff > 24 && bestDy >= minDy) {
    return bestDy;
  }

  // If only 1 row is visible in screenshot or boundary was blurry:
  // Check available height: if space allows modern vertical grid (3:4 ratio = 1.333), use 3:4!
  const availableSpace = maxAllowedY - gridStartY;
  if (availableSpace >= colWidth * 1.25) {
    return Math.min(Math.round(colWidth * 1.333), availableSpace - 5);
  }

  // Classic 1:1 square fallback
  return Math.min(colWidth, availableSpace);
}

/**
 * Quality Verification:
 * Checks if a candidate tile contains a real photo, or is an empty/blank grid slot.
 */
export function isTileActualPhoto(
  buf: PixelBuffer,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): boolean {
  if (cropW < 24 || cropH < 24) return false;

  const insetX = Math.round(cropW * 0.12);
  const insetY = Math.round(cropH * 0.12);
  const usableW = cropW - 2 * insetX;
  const usableH = cropH - 2 * insetY;

  const stepX = Math.max(2, Math.floor(usableW / 8));
  const stepY = Math.max(2, Math.floor(usableH / 8));

  let bgCount = 0;
  let totalCount = 0;
  const luminances: number[] = [];

  for (let dy = insetY; dy < cropH - insetY; dy += stepY) {
    for (let dx = insetX; dx < cropW - insetX; dx += stepX) {
      const px = cropX + dx;
      const py = cropY + dy;
      if (px >= buf.width || py >= buf.height) continue;

      const idx = (py * buf.width + px) * 4;
      const r = buf.data[idx];
      const g = buf.data[idx + 1];
      const b = buf.data[idx + 2];

      if (isAppBackground(r, g, b)) {
        bgCount++;
      }

      const lum = (r * 299 + g * 587 + b * 114) / 1000;
      luminances.push(lum);
      totalCount++;
    }
  }

  if (totalCount < 10) return false;

  // If >= 65% is Instagram background color, it's an empty grid slot
  if (bgCount / totalCount >= 0.65) return false;

  // Calculate standard deviation of luminance (solid color boxes have std < 5)
  const meanLum = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance =
    luminances.reduce((a, b) => a + Math.pow(b - meanLum, 2), 0) / luminances.length;
  const stdDev = Math.sqrt(variance);

  return stdDev >= 8;
}

/**
 * Computes a downsampled 6x6 average color fingerprint for deduplicating overlapping screenshots.
 */
export function computeTileFingerprint(
  buf: PixelBuffer,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): number[] {
  const grid = 6;
  const stepX = Math.floor(cropW / grid);
  const stepY = Math.floor(cropH / grid);
  const fp: number[] = [];

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      let rTotal = 0;
      let gTotal = 0;
      let bTotal = 0;
      let count = 0;
      const startX = cropX + gx * stepX;
      const startY = cropY + gy * stepY;

      for (let y = startY; y < startY + stepY; y += 3) {
        for (let x = startX; x < startX + stepX; x += 3) {
          if (x >= buf.width || y >= buf.height) continue;
          const idx = (y * buf.width + x) * 4;
          rTotal += buf.data[idx];
          gTotal += buf.data[idx + 1];
          bTotal += buf.data[idx + 2];
          count++;
        }
      }
      fp.push(count > 0 ? Math.round((rTotal + gTotal + bTotal) / (3 * count)) : 0);
    }
  }
  return fp;
}

/**
 * Compares two tile fingerprints. Returns true if they represent the same photo.
 */
export function areTilesDuplicate(fp1: number[], fp2: number[], threshold: number = 10): boolean {
  if (fp1.length !== fp2.length || fp1.length === 0) return false;
  let totalDiff = 0;
  for (let i = 0; i < fp1.length; i++) {
    totalDiff += Math.abs(fp1[i] - fp2[i]);
  }
  return totalDiff / fp1.length < threshold;
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
 * Calculates Color Harmony and Contrast metrics from pixel luminance and palette hues
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

    if (avgHueDiff < 45) {
      harmonyScore = Math.min(96, Math.max(82, Math.round(85 + (1 - avgHueDiff / 45) * 11)));
    } else if (avgHueDiff >= 45 && avgHueDiff < 85) {
      harmonyScore = Math.min(84, Math.max(68, Math.round(80 - (avgHueDiff - 45) * 0.3)));
    } else if (avgHueDiff >= 85 && avgHueDiff < 125) {
      harmonyScore = Math.min(67, Math.max(48, Math.round(65 - (avgHueDiff - 85) * 0.42)));
    } else {
      if (satMean > 0.35) {
        harmonyScore = Math.max(25, Math.round(45 - (avgHueDiff - 125) * 0.4));
      } else {
        harmonyScore = Math.max(38, Math.round(55 - (avgHueDiff - 125) * 0.28));
      }
    }
  }

  return { harmonyScore, contrastScore };
}

/**
 * Fully Automatic Adaptive Instagram Grid Cropper & Color DNA Extractor:
 * 1. Supports modern Instagram vertical grids (3:4 / 4:5 portrait) as well as classic 1:1 squares.
 * 2. Automatically trims tablet / iPad / foldable letterboxing side margins.
 * 3. Automatically finds exact vertical grid start Y.
 * 4. Detects true row height and aspect ratio so no photos are cut off.
 * 5. Skips empty grid slots in the final row.
 * 6. Deduplicates overlapping photos across scrolled screenshots.
 * 7. Samples Color DNA purely from extracted real photos (zero UI background pollution).
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
  const existingFingerprints: number[][] = [];
  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
  const sampledLuminances: number[] = [];
  let avatarImage: string | undefined;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    try {
      const img = await loadImage(files[fileIndex]);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      if (w <= 20 || h <= 20) continue;

      // Render full image to an offscreen canvas to extract pixel buffer
      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = w;
      fullCanvas.height = h;
      const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
      if (!fullCtx) continue;

      fullCtx.drawImage(img, 0, 0, w, h);
      const fullImgData = fullCtx.getImageData(0, 0, w, h);
      const buf: PixelBuffer = { width: w, height: h, data: fullImgData.data };

      // Filter boxes for this specific file
      const boxes: BoundingBox[] = (detectedBoxes || []).filter(
        (b) => b.image_index === undefined || b.image_index === fileIndex
      );

      // 1. Avatar Extraction if detected
      const avatarBox = boxes.find((b) => b.label === "avatar");
      if (avatarBox && !avatarImage) {
        const aX = Math.max(0, Math.round((avatarBox.xmin / 1000) * w));
        const aY = Math.max(0, Math.round((avatarBox.ymin / 1000) * h));
        const aW = Math.min(w - aX, Math.round(((avatarBox.xmax - avatarBox.xmin) / 1000) * w));
        const aH = Math.min(h - aY, Math.round(((avatarBox.ymax - avatarBox.ymin) / 1000) * h));
        const aSize = Math.min(aW, aH);

        if (aSize >= 24) {
          const aCanvas = document.createElement("canvas");
          aCanvas.width = 240;
          aCanvas.height = 240;
          const aCtx = aCanvas.getContext("2d");
          if (aCtx) {
            aCtx.imageSmoothingEnabled = true;
            aCtx.imageSmoothingQuality = "high";
            aCtx.drawImage(img, aX, aY, aSize, aSize, 0, 0, 240, 240);
            try {
              avatarImage = aCanvas.toDataURL("image/jpeg", 0.9);
            } catch {
              // Ignore
            }
          }
        }
      }

      // 2. Locate Horizontal Content Bounds (trims tablet letterboxing)
      const gridBox = boxes.find((b) => b.label === "post_grid");
      const hBounds = findGridHorizontalBounds(buf, gridBox?.xmin, gridBox?.xmax);
      const gridLeft = hBounds.left;
      const gridWidth = hBounds.width;

      const gap = Math.max(1, Math.round(gridWidth * 0.002));
      const colWidth = Math.floor((gridWidth - 2 * gap) / 3);

      // 3. Locate Post Grid Start Y & Max Allowed Y
      const approxY = gridBox ? Math.round((gridBox.ymin / 1000) * h) : Math.round(h * 0.38);
      const gridStartY = findExactGridStartY(buf, approxY, gridLeft, colWidth);
      const maxAllowedY = gridBox?.ymax
        ? Math.min(h * 0.94, Math.round((gridBox.ymax / 1000) * h))
        : Math.round(h * 0.935);

      // 4. Adaptive Row Height (Modern 3:4 portrait or classic 1:1)
      const rowHeight = findGridRowHeight(buf, gridStartY, gridLeft, colWidth, gap, maxAllowedY);

      // 5. Multi-Row Slicing
      const maxRows = 6;
      for (let r = 0; r < maxRows; r++) {
        const rowY = gridStartY + r * (rowHeight + gap);

        // Stop if reaching bottom navigation bar or screen end
        if (rowY + rowHeight * 0.65 > maxAllowedY || rowY + rowHeight * 0.65 > h) {
          break;
        }

        for (let c = 0; c < 3; c++) {
          const tileX = gridLeft + c * (colWidth + gap);

          // Verify if this slot is a real photo (skips blank slots on the right)
          const isPhoto = isTileActualPhoto(buf, tileX, rowY, colWidth, rowHeight);
          if (!isPhoto) continue;

          // Deduplicate overlapping photos from scrolled screenshots
          const fp = computeTileFingerprint(buf, tileX, rowY, colWidth, rowHeight);
          const isDuplicate = existingFingerprints.some((prev) => areTilesDuplicate(fp, prev));
          if (isDuplicate) continue;
          existingFingerprints.push(fp);

          // Draw crisp tile preserving the true aspect ratio (e.g. 300x400 for 3:4)
          const targetW = 320;
          const targetH = Math.round(320 * (rowHeight / colWidth));
          const tileCanvas = document.createElement("canvas");
          tileCanvas.width = targetW;
          tileCanvas.height = targetH;
          const tileCtx = tileCanvas.getContext("2d");
          if (!tileCtx) continue;

          tileCtx.imageSmoothingEnabled = true;
          tileCtx.imageSmoothingQuality = "high";
          tileCtx.drawImage(
            img,
            tileX,
            rowY,
            colWidth,
            Math.min(rowHeight, h - rowY),
            0,
            0,
            targetW,
            targetH
          );

          try {
            croppedImages.push(tileCanvas.toDataURL("image/jpeg", 0.88));
          } catch {
            // Ignore
          }

          // Sample pixels directly from this authentic photo tile for Color DNA
          const sampleCanvas = document.createElement("canvas");
          sampleCanvas.width = 64;
          sampleCanvas.height = 64;
          const sampleCtx = sampleCanvas.getContext("2d");
          if (sampleCtx) {
            sampleCtx.drawImage(tileCanvas, 0, 0, 64, 64);
            const sampleData = sampleCtx.getImageData(0, 0, 64, 64).data;

            for (let i = 0; i < sampleData.length; i += 16) {
              const a = sampleData[i + 3];
              if (a < 128) continue;
              const r = sampleData[i];
              const g = sampleData[i + 1];
              const b = sampleData[i + 2];

              if (isAppBackground(r, g, b)) continue;

              const lum = (r * 299 + g * 587 + b * 114) / 1000;
              sampledLuminances.push(lum);

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
        }
      }
    } catch (err) {
      console.warn("Error processing image file for automatic cropping:", err);
    }
  }

  // Fallback: If 0 photos were extracted (e.g. non-grid profile top), check avatar
  if (croppedImages.length === 0 && avatarImage) {
    croppedImages.push(avatarImage);
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
    avatarImage,
    metrics,
  };
}
