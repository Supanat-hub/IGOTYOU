import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHybridScore,
  calculateDegradedScore,
  getAestheticVerdict,
  buildUserGridImages,
} from "./analysisEngine";
import {
  isAppBackground,
  rgbToHex,
  getAestheticColorName,
  isTileActualPhoto,
  computeTileFingerprint,
  areTilesDuplicate,
  findExactGridStartY,
  findGridHorizontalBounds,
  refineGridColumns,
  findGridRowHeight,
  selectColorPaletteFromBuckets,
  ColorBucketItem,
  PixelBuffer,
} from "./colorExtractor";
import {
  parseYoloOutputTensor,
  evaluateYoloDetections,
} from "./yoloDetector";

test("calculateHybridScore computes weighted aesthetic score accurately", () => {
  // Test master curation
  const highScore = calculateHybridScore(95, 92, 90);
  assert.equal(highScore, 93); // 95*0.4 + 92*0.35 + 90*0.25 = 38 + 32.2 + 22.5 = 92.7 -> 93

  // Test minimum clamp at 25
  const minScore = calculateHybridScore(0, 0, 0);
  assert.equal(minScore, 25);

  // Test maximum clamp at 98
  const maxScore = calculateHybridScore(100, 100, 100);
  assert.equal(maxScore, 98);

  // Test realistic casual profile
  const casualScore = calculateHybridScore(55, 60, 50);
  assert.equal(casualScore, 56); // 22 + 21 + 12.5 = 55.5 -> 56
});

test("calculateDegradedScore computes pure pixel fallback score", () => {
  // Balanced calculation: 50% harmony + 50% contrast
  const score = calculateDegradedScore(70, 80);
  assert.equal(score, 75);

  // Minimum clamp at 25
  const minScore = calculateDegradedScore(0, 0);
  assert.equal(minScore, 25);

  // Maximum clamp at 95
  const maxScore = calculateDegradedScore(100, 100);
  assert.equal(maxScore, 95);
});

test("getAestheticVerdict returns correct Thai verdict for score tiers", () => {
  assert.equal(getAestheticVerdict(95), "คุมโทนระดับมาสเตอร์ สวยสะกดตา!");
  assert.equal(getAestheticVerdict(90), "คุมโทนระดับมาสเตอร์ สวยสะกดตา!");
  assert.equal(getAestheticVerdict(85), "คุมโทนสวยงาม มีรสนิยม!");
  assert.equal(getAestheticVerdict(78), "คุมโทนสวยงาม มีรสนิยม!");
  assert.equal(getAestheticVerdict(70), "โทนภาพดูดี เริ่มมีเอกลักษณ์");
  assert.equal(getAestheticVerdict(55), "ฟีดตามใจฉัน สไตล์ไลฟ์สไตล์ทั่วไป");
  assert.equal(getAestheticVerdict(40), "สีและแสงค่อนข้างตีกัน ยังขาดการคุมโทน");
  assert.equal(getAestheticVerdict(25), "สีและแสงค่อนข้างตีกัน ยังขาดการคุมโทน");
});

test("isAppBackground identifies Instagram UI elements and ignores photos", () => {
  // Pure white IG light mode background
  assert.equal(isAppBackground(255, 255, 255), true);
  assert.equal(isAppBackground(248, 248, 248), true);

  // Pure dark mode IG background
  assert.equal(isAppBackground(18, 18, 18), true);
  assert.equal(isAppBackground(24, 24, 24), true);

  // Neutral separator gray lines
  assert.equal(isAppBackground(220, 220, 220), true);

  // Real photos (should NOT be marked as app background)
  assert.equal(isAppBackground(180, 70, 50), false); // Terracotta
  assert.equal(isAppBackground(45, 90, 60), false); // Forest green
  assert.equal(isAppBackground(215, 175, 120), false); // Warm oat / amber
});

test("rgbToHex converts RGB values correctly to hex string", () => {
  assert.equal(rgbToHex(255, 255, 255), "#ffffff");
  assert.equal(rgbToHex(0, 0, 0), "#000000");
  assert.equal(rgbToHex(217, 255, 67), "#d9ff43"); // Acid Neon
  assert.equal(rgbToHex(119, 85, 217), "#7755d9"); // Brand Purple
});

test("getAestheticColorName provides appropriate color archetype names", () => {
  assert.equal(getAestheticColorName(245, 245, 245), "Cream Linen");
  assert.equal(getAestheticColorName(10, 10, 10), "Pitch Black");
  assert.equal(getAestheticColorName(30, 30, 30), "Charcoal Ink");
  assert.equal(getAestheticColorName(140, 140, 140), "Concrete Gray");
});

test("isTileActualPhoto distinguishes real photo content from empty slots", () => {
  // 1. Synthetic Real Photo (rich colors and contrast)
  const photoW = 100, photoH = 100;
  const photoData = new Uint8Array(photoW * photoH * 4);
  for (let y = 0; y < photoH; y++) {
    for (let x = 0; x < photoW; x++) {
      const idx = (y * photoW + x) * 4;
      photoData[idx] = (x * 2) % 256;      // R
      photoData[idx + 1] = (y * 3) % 256;  // G
      photoData[idx + 2] = 120;            // B
      photoData[idx + 3] = 255;
    }
  }
  const photoBuf: PixelBuffer = { width: photoW, height: photoH, data: photoData };
  assert.equal(isTileActualPhoto(photoBuf, 0, 0, photoW, photoH), true);

  // 2. Synthetic Empty Slot (Instagram Dark mode #12161A background)
  const emptyData = new Uint8Array(photoW * photoH * 4);
  for (let i = 0; i < emptyData.length; i += 4) {
    emptyData[i] = 18;
    emptyData[i + 1] = 22;
    emptyData[i + 2] = 26;
    emptyData[i + 3] = 255;
  }
  const emptyBuf: PixelBuffer = { width: photoW, height: photoH, data: emptyData };
  assert.equal(isTileActualPhoto(emptyBuf, 0, 0, photoW, photoH), false);
});

test("findExactGridStartY pinpoints where photo content begins", () => {
  const w = 300, h = 200;
  const data = new Uint8Array(w * h * 4);
  // Fill 0 to 49 with dark background
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      data[idx] = 18;
      data[idx + 1] = 20;
      data[idx + 2] = 24;
      data[idx + 3] = 255;
    }
  }
  // Fill y=50 downwards with colorful photo content
  for (let y = 50; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      data[idx] = (x * 5) % 250;
      data[idx + 1] = (y * 3) % 250;
      data[idx + 2] = 150;
      data[idx + 3] = 255;
    }
  }
  const buf: PixelBuffer = { width: w, height: h, data: data };
  const startY = findExactGridStartY(buf, 40);
  assert.equal(startY, 50);
});

test("computeTileFingerprint and areTilesDuplicate detect duplicate tiles", () => {
  const w = 60, h = 60;
  const data1 = new Uint8Array(w * h * 4);
  const data2 = new Uint8Array(w * h * 4);
  const data3 = new Uint8Array(w * h * 4);

  // Tile 1 & Tile 2 have identical sunset gradient
  for (let i = 0; i < w * h; i++) {
    const val = (i % 60) * 4;
    data1[i * 4] = val;
    data1[i * 4 + 1] = 80;
    data1[i * 4 + 2] = 40;
    data1[i * 4 + 3] = 255;

    data2[i * 4] = val;
    data2[i * 4 + 1] = 80;
    data2[i * 4 + 2] = 40;
    data2[i * 4 + 3] = 255;

    // Tile 3 is dark navy blue
    data3[i * 4] = 20;
    data3[i * 4 + 1] = 40;
    data3[i * 4 + 2] = 180;
    data3[i * 4 + 3] = 255;
  }

  const buf1: PixelBuffer = { width: w, height: h, data: data1 };
  const buf2: PixelBuffer = { width: w, height: h, data: data2 };
  const buf3: PixelBuffer = { width: w, height: h, data: data3 };

  const fp1 = computeTileFingerprint(buf1, 0, 0, w, h);
  const fp2 = computeTileFingerprint(buf2, 0, 0, w, h);
  const fp3 = computeTileFingerprint(buf3, 0, 0, w, h);

  assert.equal(areTilesDuplicate(fp1, fp2), true);
  assert.equal(areTilesDuplicate(fp1, fp3), false);
});

test("buildUserGridImages preserves authentic count of user real photos without duplicate padding", () => {
  // User with 2 real post photos
  const twoPhotos = ["data:image/jpeg;base64,photo1", "data:image/jpeg;base64,photo2"];
  const grid = buildUserGridImages(twoPhotos);

  assert.equal(grid.length, 2);
  assert.equal(grid[0], "data:image/jpeg;base64,photo1");
  assert.equal(grid[1], "data:image/jpeg;base64,photo2");

  // User with 9 photos gets first 6
  const manyPhotos = [
    "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"
  ];
  const slicedGrid = buildUserGridImages(manyPhotos);
  assert.equal(slicedGrid.length, 6);
  assert.deepEqual(slicedGrid, ["p1", "p2", "p3", "p4", "p5", "p6"]);
});

test("findGridHorizontalBounds detects letterboxing side pillars on tablets", () => {
  const w = 500, h = 300;
  const data = new Uint8Array(w * h * 4);

  // Fill left pillar (0..99) and right pillar (400..499) with dark background
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (x < 100 || x >= 400) {
        data[idx] = 18;
        data[idx + 1] = 20;
        data[idx + 2] = 24;
      } else {
        data[idx] = (x + y) % 256;
        data[idx + 1] = 150;
        data[idx + 2] = 100;
      }
      data[idx + 3] = 255;
    }
  }

  const buf: PixelBuffer = { width: w, height: h, data };
  const bounds = findGridHorizontalBounds(buf);
  assert.equal(bounds.left >= 98 && bounds.left <= 101, true);
  assert.equal(bounds.width >= 298 && bounds.width <= 302, true);
});

test("findGridHorizontalBounds preserves 3-column grid width when user has only 2 posts", () => {
  const w = 600, h = 400;
  const data = new Uint8Array(w * h * 4);

  // Tablet layout with 100px left rail, post 1 (100..249), post 2 (251..400), col 3 is empty background
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (x < 100 || x === 250 || x >= 401) {
        data[idx] = 18;
        data[idx + 1] = 20;
        data[idx + 2] = 24;
      } else {
        data[idx] = 160;
        data[idx + 1] = 120;
        data[idx + 2] = 90;
      }
      data[idx + 3] = 255;
    }
  }

  const buf: PixelBuffer = { width: w, height: h, data };
  const bounds = findGridHorizontalBounds(buf);
  // Column width is 150px, so 3 columns = 450px + gap
  assert.equal(bounds.left >= 98 && bounds.left <= 101, true);
  assert.equal(bounds.width >= 445 && bounds.width <= 460, true);
});

test("findGridRowHeight detects modern Instagram 3:4 portrait grid ratio", () => {
  const w = 300, h = 500;
  const colW = 100;
  const expectedRowH = 133; // 3:4 ratio = 100 * 1.333
  const data = new Uint8Array(w * h * 4);

  // Row 0 from y=50 to y=183
  // Row 1 from y=184 to y=317
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (y >= 50 && y < 183) {
        data[idx] = 200; // Bright photo 1
        data[idx + 1] = 50;
        data[idx + 2] = 50;
      } else if (y >= 184 && y < 317) {
        data[idx] = 30; // Dark photo 2
        data[idx + 1] = 180;
        data[idx + 2] = 220;
      } else {
        data[idx] = 18;
        data[idx + 1] = 20;
        data[idx + 2] = 24;
      }
      data[idx + 3] = 255;
    }
  }

  const buf: PixelBuffer = { width: w, height: h, data };
  const detectedH = findGridRowHeight(buf, 50, 0, colW, 0, 480);
  assert.equal(detectedH >= 132 && detectedH <= 134, true);
});


test("refineGridColumns recovers true column width when only 1 post is visible on a tablet", () => {
  const w = 683, h = 600;
  const data = new Uint8Array(w * h * 4);
  // Dark background, one 3:4 photo 178x237 at x=88,y=100
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const inPhoto = x >= 88 && x < 266 && y >= 100 && y < 337;
      data[idx] = inPhoto ? 120 + ((x * 7 + y * 3) % 80) : 12;
      data[idx + 1] = inPhoto ? 90 + ((x * 5) % 60) : 17;
      data[idx + 2] = inPhoto ? 70 + ((y * 5) % 60) : 21;
      data[idx + 3] = 255;
    }
  }
  const buf: PixelBuffer = { width: w, height: h, data };
  // Wrong base geometry (e.g. 3 cols assumed across a too-wide span)
  const refined = refineGridColumns(buf, 88, 596, 100, 1, 560);
  assert.notEqual(refined, null);
  assert.equal(Math.abs((refined as { colW: number }).colW - 178) <= 3, true);
  assert.equal(Math.abs((refined as { left: number }).left - 88) <= 2, true);
});

test("selectColorPaletteFromBuckets prioritizes chromatic colors over dominant uniform gray/concrete backgrounds", () => {
  // Simulate a profile where 85% of pixels are uniform shirt/skirt/concrete grays with massive raw counts
  const mockBuckets: ColorBucketItem[] = [
    // Dominant neutral grays with huge raw counts
    { r: 192, g: 192, b: 192, count: 80000, weight: 80000, isChromatic: false }, // Concrete Gray / Warm Oat
    { r: 160, g: 160, b: 160, count: 65000, weight: 65000, isChromatic: false },
    { r: 128, g: 128, b: 128, count: 50000, weight: 50000, isChromatic: false },
    { r: 64, g: 64, b: 64, count: 40000, weight: 40000, isChromatic: false },
    { r: 32, g: 32, b: 32, count: 30000, weight: 30000, isChromatic: false },
    // Chromatic mood colors with smaller raw counts but significant weight
    { r: 240, g: 216, b: 96, count: 8000, weight: 25000, isChromatic: true }, // Golden Mustard
    { r: 96, g: 192, b: 192, count: 7000, weight: 22000, isChromatic: true },  // Sage/Teal
    { r: 216, g: 120, b: 96, count: 6000, weight: 19000, isChromatic: true },  // Terracotta
  ];

  const palette = selectColorPaletteFromBuckets(mockBuckets);
  assert.equal(palette.length, 4);

  // Neutral colors must be capped at 1
  const neutralNames = ["Concrete Gray", "Charcoal Ink", "Deep Slate", "Obsidian Shadow", "Warm Oat", "Pitch Black"];
  const neutralCount = palette.filter((c) => neutralNames.includes(c.name)).length;
  assert.equal(neutralCount <= 1, true, `Expected <= 1 neutral, got ${neutralCount}`);

  // At least 3 chromatic colors should be selected
  const chromaticColors = palette.filter((c) => !neutralNames.includes(c.name));
  assert.equal(chromaticColors.length >= 3, true, `Expected >= 3 chromatic colors, got ${chromaticColors.length}`);
});

test("selectColorPaletteFromBuckets handles pure monochrome feeds gracefully", () => {
  // Pure B&W feed with only grays
  const mockMonochrome: ColorBucketItem[] = [
    { r: 216, g: 216, b: 216, count: 5000, weight: 5000, isChromatic: false },
    { r: 168, g: 168, b: 168, count: 4000, weight: 4000, isChromatic: false },
    { r: 120, g: 120, b: 120, count: 3000, weight: 3000, isChromatic: false },
    { r: 48, g: 48, b: 48, count: 2000, weight: 2000, isChromatic: false },
  ];

  const palette = selectColorPaletteFromBuckets(mockMonochrome);
  assert.equal(palette.length, 4);
  assert.ok(palette.every((c) => typeof c.hex === "string" && typeof c.name === "string"));
});

test("evaluateYoloDetections rejects non-IG images and detects 0-post/private profiles", () => {
  // 1. Non-IG image (e.g. bank slip / chat / standalone photo -> 0 detections)
  const rejected = evaluateYoloDetections([]);
  assert.equal(rejected.isValidProfile, false);
  assert.ok(rejected.invalidReason && rejected.invalidReason.length > 0);

  // 2. 0-post / Private IG profile (avatar + ig_stats_bar + empty_or_private, 0 post_tile)
  const zeroPost = evaluateYoloDetections([
    { label: "avatar", type: "avatar", confidence: 0.92, ymin: 120, xmin: 40, ymax: 260, xmax: 220 },
    { label: "ig_stats_bar", type: "ig_stats_bar", confidence: 0.89, ymin: 130, xmin: 280, ymax: 230, xmax: 920 },
    { label: "empty_or_private", type: "empty_or_private", confidence: 0.85, ymin: 550, xmin: 100, ymax: 850, xmax: 900 },
  ]);
  assert.equal(zeroPost.isValidProfile, true);
  assert.equal(zeroPost.isZeroPostOrPrivate, true);
  assert.equal(zeroPost.postCount, 0);
  assert.equal(zeroPost.boxes.some((b) => b.type === "empty_or_private"), true);

  // 3. Partial grid IG profile (e.g. 2 posts)
  const twoPostProfile = evaluateYoloDetections([
    { label: "avatar", type: "avatar", confidence: 0.95, ymin: 110, xmin: 40, ymax: 250, xmax: 210 },
    { label: "ig_tab_bar", type: "ig_tab_bar", confidence: 0.88, ymin: 420, xmin: 0, ymax: 480, xmax: 1000 },
    { label: "post_tile", type: "post_tile", confidence: 0.91, ymin: 485, xmin: 0, ymax: 720, xmax: 330 },
    { label: "post_tile", type: "post_tile", confidence: 0.90, ymin: 485, xmin: 335, ymax: 720, xmax: 665 },
  ]);
  assert.equal(twoPostProfile.isValidProfile, true);
  assert.equal(twoPostProfile.isZeroPostOrPrivate, false);
  assert.equal(twoPostProfile.postCount, 2);

  // 4. Non-IG 3-photo collage / Story card with wide gaps (> 12) and no IG header/tabs -> rejected
  const collageCard = evaluateYoloDetections([
    { label: "post_tile", type: "post_tile", confidence: 0.70, ymin: 261, xmin: 47, ymax: 422, xmax: 334 },
    { label: "post_tile", type: "post_tile", confidence: 0.70, ymin: 262, xmin: 351, ymax: 420, xmax: 637 },
    { label: "post_tile", type: "post_tile", confidence: 0.66, ymin: 262, xmin: 659, ymax: 420, xmax: 942 },
  ]);
  assert.equal(collageCard.isValidProfile, false);
});

test("parseYoloOutputTensor decodes [1, 9, N] tensor, applies NMS, and sorts post_tile in reading order", () => {
  const numAnchors = 5;
  const numClasses = 5;
  const numChannels = 4 + numClasses; // 9
  const outputData = new Float32Array(numChannels * numAnchors);

  // Helper to set anchor column
  const setAnchor = (anchorIdx: number, cx: number, cy: number, w: number, h: number, classId: number, score: number) => {
    outputData[0 * numAnchors + anchorIdx] = cx;
    outputData[1 * numAnchors + anchorIdx] = cy;
    outputData[2 * numAnchors + anchorIdx] = w;
    outputData[3 * numAnchors + anchorIdx] = h;
    outputData[(4 + classId) * numAnchors + anchorIdx] = score;
  };

  // Anchor 0: right-side post tile (col 2)
  setAnchor(0, 320, 400, 180, 220, 0, 0.91);
  // Anchor 1: left-side post tile (col 1)
  setAnchor(1, 120, 400, 180, 220, 0, 0.88);
  // Anchor 2: duplicate overlapping left-side post tile with lower confidence (should be suppressed by NMS)
  setAnchor(2, 122, 402, 180, 220, 0, 0.65);
  // Anchor 3: Story Highlight circle lower down (cy=320) with higher confidence (0.95)
  setAnchor(3, 150, 320, 70, 70, 1, 0.95);
  // Anchor 4: Main Profile Avatar at top-left (cy=110) with Note bubble lowering confidence to 0.39
  setAnchor(4, 100, 110, 95, 95, 1, 0.39);

  const detections = parseYoloOutputTensor(outputData, numAnchors, numClasses, 1, 0, 0, 640, 640);
  const postTiles = detections.filter((d) => d.label === "post_tile");
  const avatars = detections.filter((d) => d.label === "avatar");

  // Duplicate anchor 2 should be suppressed by NMS, leaving 2 post tiles
  assert.equal(postTiles.length, 2);
  // Post tiles should be sorted left-to-right even though anchor 0 was to the right of anchor 1
  assert.equal(postTiles[0].xmin < postTiles[1].xmin, true);
  assert.equal(postTiles[0].type, "post_tile");

  // Main profile avatar at top (ymin smaller) should be sorted BEFORE story highlight circle
  assert.equal(avatars.length, 2);
  assert.equal(avatars[0].ymin < avatars[1].ymin, true);
});

test("buildUserGridImages uses avatarImage instead of raw full screenshot when isZeroPostOrPrivate is true", () => {
  const avatarDataUrl = "data:image/jpeg;base64,avatarOnly";
  const gridWithAvatar = buildUserGridImages([], [], ["fallback"], true, avatarDataUrl);
  assert.deepEqual(gridWithAvatar, [avatarDataUrl]);

  const gridWithoutAvatar = buildUserGridImages([], [], ["fallback"], true, undefined);
  assert.deepEqual(gridWithoutAvatar, []);
});


