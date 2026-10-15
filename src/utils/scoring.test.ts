import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHybridScore,
  calculateDegradedScore,
  getAestheticVerdict,
} from "./analysisEngine";
import {
  isAppBackground,
  rgbToHex,
  getAestheticColorName,
} from "./colorExtractor";

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

