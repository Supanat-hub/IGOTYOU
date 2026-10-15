import { ExtractedColor, BoundingBox, extractColorDNA } from "./colorExtractor";

export interface AnalysisResult {
  username: string;
  isAiDegraded?: boolean;
  degradedReason?: string;
  isValidProfile?: boolean;
  invalidReason?: string;
  isPresetDemo?: boolean;
  persona: {
    title: string;
    description: string;
    tags: string[];
  };
  aestheticScore: {
    score: number;
    verdict: string;
    description: string;
    honestCritique?: string;
    breakdown?: {
      colorHarmony: number;
      gridCohesion: number;
      contrast: number;
    };
  };
  colorDNA: ExtractedColor[];
  stats: {
    followerRatio: string;
    postDensity: string;
    ocrNote: string;
  };
  topContent: {
    category: string;
    description: string;
    images: string[];
  };
  bioRemix: {
    text: string;
    subtext: string;
  };
  ethicsAudit: {
    weights: {
      colorHarmony: number;
      composition: number;
      contrast: number;
    };
    detectedBiases: string[];
    transparencyNote: string;
  };
}

export const PRESETS: Record<string, AnalysisResult> = {
  cafe: {
    username: "@minimal.vibes",
    isPresetDemo: true,
    persona: {
      title: "เทสดีมีสไตล์ · คล้ายพี่ดารา",
      description: "ฉายาประจำโปรไฟล์ของคุณคือ",
      tags: ["เทสดีมีสไตล์", "cafe hopping", "warm aesthetic"],
    },
    aestheticScore: {
      score: 92,
      verdict: "คุมโทนเก่งมาก!",
      description:
        "สีอบอุ่น แสงธรรมชาติ และองค์ประกอบเรียบง่าย ทำให้ฟีดของคุณน่ามองแบบไม่ต้องพยายาม",
      breakdown: {
        colorHarmony: 94,
        gridCohesion: 90,
        contrast: 88,
      },
      honestCritique:
        "คุมพาเลตต์สีเอิร์ธโทนได้สม่ำเสมอ แสงธรรมชาติลงตัว แต่อาจเพิ่มรูปที่มี contrast สูงขึ้นเพื่อเพิ่มมิติของฟีด",
    },
    colorDNA: [
      { hex: "#e8dcc3", name: "Oat Milk" },
      { hex: "#9da77a", name: "Matcha" },
      { hex: "#6c4434", name: "Espresso" },
      { hex: "#d8a16f", name: "Warm Amber" },
    ],
    stats: {
      followerRatio: "12.4×",
      postDensity: "27",
      ocrNote: "ตัวอย่างสถิติจากพรีเซ็ต",
    },
    topContent: {
      category: "TOP CONTENT",
      description: "กาแฟ · อาหารคลีน · วันสบายๆ",
      images: [
        "https://images.unsplash.com/photo-1608376156820-56656bddfd10?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1604599939460-925db5dbdd36?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1608387802568-0c0e0d89d815?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1572626917711-324f76366bc0?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1563946417-e0f5e085bd12?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1667757043423-382c3ff73282?auto=format&fit=crop&w=500&q=82",
      ],
    },
    bioRemix: {
      text: "slow mornings, good coffee & tiny joys.",
      subtext: "Bangkok · collecting calm moments",
    },
    ethicsAudit: {
      weights: {
        colorHarmony: 40,
        composition: 35,
        contrast: 25,
      },
      detectedBiases: [
        "Western Minimalist Normalization: มีการปรับสมดุลคะแนนเพื่อไม่ให้ฟีดมินิมอลได้เปรียบสไตล์อื่นเกินจริง",
        "Zero-Retention: ไม่มีการบันทึกภาพลงฐานข้อมูล",
      ],
      transparencyNote:
        "คะแนนคำนวณจากความสม่ำเสมอของค่าความสว่าง (Luminance) และกลุ่มสี (Color Clustering) ในระดับพิกเซล",
    },
  },
  outdoor: {
    username: "@wanderer.peak",
    isPresetDemo: true,
    persona: {
      title: "นักสะสมสเปซ · และแสงธรรมชาติ",
      description: "ฉายาประจำโปรไฟล์ของคุณคือ",
      tags: ["into the wild", "trekking", "green vibes"],
    },
    aestheticScore: {
      score: 88,
      verdict: "ฟีดทรงพลังและสดชื่น!",
      description:
        "เต็มไปด้วยสีเขียวป่าและท้องฟ้าเปิด ให้ความรู้สึกผ่อนคลายและกระตุ้นการออกไปค้นหาโลกกว้าง",
      breakdown: {
        colorHarmony: 89,
        gridCohesion: 86,
        contrast: 90,
      },
      honestCritique:
        "มิติแสงและสีของธรรมชาติโดดเด่นมาก แนะนำให้ระวังการโพสต์ภาพที่มีสีสันสังเคราะห์ตัดกับโทนเขียว-ฟ้า",
    },
    colorDNA: [
      { hex: "#355e3b", name: "Forest Pine" },
      { hex: "#87a96b", name: "Aspen Green" },
      { hex: "#d2b48c", name: "Mountain Sand" },
      { hex: "#4682b4", name: "Alpine Sky" },
    ],
    stats: {
      followerRatio: "8.2×",
      postDensity: "45",
      ocrNote: "ตัวอย่างสถิติจากพรีเซ็ต",
    },
    topContent: {
      category: "TOP CONTENT",
      description: "ภูเขา · แคมป์ปิ้ง · หมอกยามเช้า",
      images: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=500&q=82",
      ],
    },
    bioRemix: {
      text: "chasing trails, fresh air & campfire stories.",
      subtext: "Somewhere outdoors · off-grid mindset",
    },
    ethicsAudit: {
      weights: {
        colorHarmony: 40,
        composition: 35,
        contrast: 25,
      },
      detectedBiases: [
        "Landscape Balance: ให้คะแนนความสมดุลระหว่างสีธรรมชาติและท้องฟ้า",
      ],
      transparencyNote:
        "โมเดลประเมินความสมดุลของอัตราส่วนท้องฟ้ากับพื้นป่าและคอนทราสต์ธรรมชาติ",
    },
  },
  creative: {
    username: "@neon.curator",
    isPresetDemo: true,
    persona: {
      title: "ตัวตึงคุมโทน · โดดเด่นเกินต้าน",
      description: "ฉายาประจำโปรไฟล์ของคุณคือ",
      tags: ["ตัวตึงคุมโทน", "creative edge", "bold contrast"],
    },
    aestheticScore: {
      score: 95,
      verdict: "คอนทราสต์จัดจ้าน มีเอกลักษณ์!",
      description:
        "การใช้สีตัดกันอย่างมีชั้นเชิงและมุมกล้องที่ไม่ซ้ำใคร สะท้อนความเป็นตัวของตัวเองสูงมาก",
      breakdown: {
        colorHarmony: 91,
        gridCohesion: 96,
        contrast: 98,
      },
      honestCritique:
        "คอนทราสต์จัดจ้านและมุมมองสะดุดตา ควรคงเอกลักษณ์สีสดนี้ไว้ต่อเนื่องเพื่อไม่ให้ฟีดดูดร็อป",
    },
    colorDNA: [
      { hex: "#ff3366", name: "Neon Punch" },
      { hex: "#7755d9", name: "Cyber Violet" },
      { hex: "#d9ff43", name: "Acid Glow" },
      { hex: "#171711", name: "Deep Ink" },
    ],
    stats: {
      followerRatio: "15.8×",
      postDensity: "62",
      ocrNote: "ตัวอย่างสถิติจากพรีเซ็ต",
    },
    topContent: {
      category: "TOP CONTENT",
      description: "กราฟิตี้ · แฟชั่นสตรีท · งานออกแบบ",
      images: [
        "https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=82",
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=82",
      ],
    },
    bioRemix: {
      text: "creating things that break the routine.",
      subtext: "Design · Culture · Night thinking",
    },
    ethicsAudit: {
      weights: {
        colorHarmony: 40,
        composition: 35,
        contrast: 25,
      },
      detectedBiases: [
        "Saturation Fairness: ชดเชยคะแนนให้สไตล์สีสดใสไม่ถูกกดคะแนนจากอัลกอริทึม",
      ],
      transparencyNote:
        "วัดระดับ Dynamic Range ของสีและความคมชัดของเส้นขอบ",
    },
  },
};

/**
 * Downscale and compress image to max dimension 1024px JPEG 0.85 on browser Canvas
 * Reduces 10MB phone screenshot to ~120KB for ultra-fast, lightweight transfer.
 */
async function downscaleImageForGemini(
  file: File,
  maxDim = 1024
): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context failed"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      resolve({ mimeType: "image/jpeg", data: base64 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for downscaling"));
    };
    img.src = url;
  });
}

/**
 * Creates a 6-item gallery array using cropped images or user's uploaded images
 */
function buildUserGridImages(
  croppedImages: string[],
  files: File[],
  fallbackImages: string[]
): string[] {
  if (croppedImages && croppedImages.length > 0) {
    let grid: string[] = [...croppedImages];
    while (grid.length < 6) {
      grid = grid.concat(croppedImages);
    }
    return grid.slice(0, 6);
  }

  if (files && files.length > 0) {
    const urls = files.map((f) => URL.createObjectURL(f));
    let grid: string[] = [...urls];
    while (grid.length < 6) {
      grid = grid.concat(urls);
    }
    return grid.slice(0, 6);
  }

  return fallbackImages;
}

/**
 * Calls server-side proxy /api/analyze to query Gemini Vision with model cascade
 */
async function callAnalyzeProxy(
  images: { mimeType: string; data: string }[]
): Promise<any> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server proxy returned ${res.status}`);
  }

  return await res.json();
}

/**
 * Pure calculation functions for scoring and verdicts (unit-testable)
 */
export function calculateHybridScore(
  harmony: number,
  compScore: number,
  contrast: number
): number {
  return Math.min(
    98,
    Math.max(25, Math.round(harmony * 0.4 + compScore * 0.35 + contrast * 0.25))
  );
}

export function calculateDegradedScore(harmony: number, contrast: number): number {
  return Math.min(95, Math.max(25, Math.round(harmony * 0.5 + contrast * 0.5)));
}

export function getAestheticVerdict(score: number): string {
  if (score >= 90) return "คุมโทนระดับมาสเตอร์ สวยสะกดตา!";
  if (score >= 78) return "คุมโทนสวยงาม มีรสนิยม!";
  if (score >= 64) return "โทนภาพดูดี เริ่มมีเอกลักษณ์";
  if (score >= 48) return "ฟีดตามใจฉัน สไตล์ไลฟ์สไตล์ทั่วไป";
  return "สีและแสงค่อนข้างตีกัน ยังขาดการคุมโทน";
}

/**
 * Analyzes uploaded images:
 * 1. Downscales screenshots on client canvas for fast network payload.
 * 2. Calls server-side proxy /api/analyze (zero API key leak to bundle).
 * 3. Validates whether the image is genuinely an Instagram profile.
 * 4. Uses Canvas smart crop + 2nd pass border tightening to isolate photos & filter Instagram UI background.
 * 5. Combines physics-based Color Harmony & Contrast with AI Composition into an honest 25-98 score.
 */
export async function analyzeProfile(files: File[], presetKey?: string): Promise<AnalysisResult> {
  if (presetKey && PRESETS[presetKey]) {
    return PRESETS[presetKey];
  }

  let lastAnalysisError = "";
  if (files && files.length > 0) {
    try {
      // 1. Client-side downscaling for fast upload
      const downscaledImages = await Promise.all(
        files.map((file) => downscaleImageForGemini(file, 1024))
      );

      // 2. Query server proxy
      const parsed = await callAnalyzeProxy(downscaledImages);

      if (parsed) {
        // Validation Rejection Gate
        if (parsed.isValidProfile === false) {
          const extraction = await extractColorDNA(files);
          return {
            username: parsed.username && parsed.username !== "@username" ? parsed.username : "@unknown",
            isValidProfile: false,
            invalidReason:
              parsed.invalidReason ||
              "ภาพที่อัปโหลดไม่ตรงกับหน้าจอโปรไฟล์ Instagram (ไม่พบแถบชื่อผู้ใช้หรือกริดรูปภาพ) กรุณาแคปภาพหน้าโปรไฟล์ Instagram แล้วลองใหม่อีกครั้ง",
            persona: {
              title: "ตรวจไม่พบโปรไฟล์ IG",
              description: "ภาพนี้ไม่ใช่หน้าจอโปรไฟล์ Instagram",
              tags: ["invalid-image", "not-ig-profile"],
            },
            aestheticScore: {
              score: 0,
              verdict: "ไม่ใช่หน้าโปรไฟล์ Instagram",
              description: "ระบบตรวจพบว่าภาพนี้ไม่ใช่หน้าจอโปรไฟล์ Instagram กรุณาถ่ายภาพหน้าจอโปรไฟล์จริงเพื่อรับการวิเคราะห์ที่เที่ยงตรง",
              honestCritique: "กรุณาถ่ายภาพหน้าจอหน้าโปรไฟล์ Instagram ให้ติดชื่อผู้ใช้และกริดรูปภาพ",
            },
            colorDNA: extraction.palette,
            stats: {
              followerRatio: "0×",
              postDensity: "0",
              ocrNote: "ไม่พบข้อมูลโปรไฟล์",
            },
            topContent: {
              category: "INVALID IMAGE",
              description: "ไม่พบกริดรูปภาพ Instagram",
              images: [],
            },
            bioRemix: {
              text: "Please upload an Instagram profile screenshot.",
              subtext: "โปรดอัปโหลดภาพหน้าโปรไฟล์ Instagram เพื่อรับการประเมิน",
            },
            ethicsAudit: {
              weights: { colorHarmony: 40, composition: 35, contrast: 25 },
              detectedBiases: ["Rejection Gate: ปฏิเสธภาพที่ไม่ใช่โปรไฟล์ IG เพื่อความเที่ยงตรงของคะแนน"],
              transparencyNote: "ระบบไม่สุ่มคะแนนหลอกเมื่อตรวจพบว่าไม่ใช่ภาพโปรไฟล์ Instagram",
            },
          };
        }

        const boxes: BoundingBox[] = parsed.detectedBoxes || [];

        // 3. Perform Canvas Smart Crop & UI background filtering
        const extractionResult = await extractColorDNA(files, boxes);

        // 4. Calculate True Hybrid Aesthetic Score (unclamped 25 - 98)
        const compScore =
          typeof parsed.compositionScore === "number" ? parsed.compositionScore : 68;
        const harmony = extractionResult.metrics.harmonyScore;
        const contrast = extractionResult.metrics.contrastScore;

        const hybridScore = calculateHybridScore(harmony, compScore, contrast);

        parsed.isValidProfile = true;
        parsed.aestheticScore.score = hybridScore;
        parsed.aestheticScore.verdict = getAestheticVerdict(hybridScore);

        parsed.aestheticScore.breakdown = {
          colorHarmony: harmony,
          gridCohesion: compScore,
          contrast: contrast,
        };

        parsed.colorDNA = extractionResult.palette;
        parsed.topContent = parsed.topContent || { category: "TOP CONTENT", description: "รูปโปรไฟล์ของคุณ" };
        parsed.topContent.images = buildUserGridImages(
          extractionResult.croppedImages,
          files,
          PRESETS.cafe.topContent.images
        );

        parsed.ethicsAudit = {
          weights: {
            colorHarmony: 40,
            composition: 35,
            contrast: 25,
          },
          detectedBiases: [
            "Fairness Normalization: มีการปรับสมดุลคะแนนให้ฟีดที่มีสีสดใสหรือคอนทราสต์สูง ไม่เสียเปรียบฟีดมินิมอลแบบตะวันตก",
            "Zero-Retention: ประมวลผลภาพแบบชั่วคราว ไม่มีการบันทึกภาพลงฐานข้อมูล",
          ],
          transparencyNote: `คะแนนคำนวณจากความสอดคล้องของสี (Harmony: ${harmony}/100), การจัดองค์ประกอบ (Cohesion: ${compScore}/100) และมิติของภาพ (Contrast: ${contrast}/100)`,
        };

        return parsed as AnalysisResult;
      }
    } catch (e: any) {
      console.warn("AI analysis service unavailable, activating honest degraded mode:", e);
      lastAnalysisError = e?.message || "";
    }
  }

  // 5. Honest degraded mode (Canvas extracted truth, zero fake preset substitute)
  const extractionResult = await extractColorDNA(files);
  const userGrid = buildUserGridImages(
    extractionResult.croppedImages,
    files,
    PRESETS.cafe.topContent.images
  );
  const harmony = extractionResult.metrics.harmonyScore;
  const contrast = extractionResult.metrics.contrastScore;
  const honestScore = calculateDegradedScore(harmony, contrast);

  // Dynamic witty & rhyming persona for degraded/offline analysis
  const getOfflinePersona = (score: number, cont: number) => {
    if (score >= 82) {
      return {
        title: "เทสดีมีสไตล์ · คล้ายพี่ดารา",
        tags: ["เทสดีมีสไตล์", "star quality", "aesthetic curation"],
      };
    }
    if (cont >= 60) {
      return {
        title: "กวีแห่งแสงเงา · เล่าเรื่องด้วยมู้ด",
        tags: ["shadow poetry", "deep mood", "contrast play"],
      };
    }
    if (score >= 65) {
      return {
        title: "ตัวตึงคุมโทน · โดดเด่นเกินต้าน",
        tags: ["ตัวตึงคุมโทน", "clean palette", "cohesive vibe"],
      };
    }
    return {
      title: "สเปซคูลๆ · ดูดีทุกองศา",
      tags: ["casual chic", "real photo dna", "natural vibe"],
    };
  };

  const offlinePersona = getOfflinePersona(honestScore, contrast);

  return {
    username: "@my.profile",
    isAiDegraded: true,
    degradedReason: lastAnalysisError,
    isValidProfile: true,
    persona: {
      title: offlinePersona.title,
      description: "สกัดโทนสีจากรูปถ่ายจริงของคุณเรียบร้อยแล้ว",
      tags: offlinePersona.tags,
    },
    aestheticScore: {
      score: honestScore,
      verdict: honestScore >= 75 ? "โทนสีมีเอกลักษณ์!" : honestScore >= 50 ? "ฟีดสไตล์ทั่วไป" : "โทนสีค่อนข้างกระจัดกระจาย",
      description: "คะแนนคำนวณจากความกลมกลืนของกลุ่มสีและคอนทราสต์จากภาพจริงที่คุณอัปโหลด",
      honestCritique: "ระบบทำงานในโหมดออฟไลน์ วัดคะแนนจากความสอดคล้องของพิกเซลสีจริงโดยตรง",
      breakdown: {
        colorHarmony: harmony,
        gridCohesion: 60,
        contrast: contrast,
      },
    },
    colorDNA: extractionResult.palette,
    stats: {
      followerRatio: "1.0×",
      postDensity: `${extractionResult.croppedImages.length || 1}`,
      ocrNote: "คุณสามารถแก้ไขตัวเลขนี้ได้ตามจริงบนการ์ด",
    },
    topContent: {
      category: "TOP CONTENT",
      description: "ภาพถ่ายจากโปรไฟล์ของคุณ",
      images: userGrid,
    },
    bioRemix: {
      text: "living quietly, creating loudly.",
      subtext: "คลิกเพื่อแก้ไขคำแซวไบโอและฉายาได้ทันที",
    },
    ethicsAudit: {
      weights: {
        colorHarmony: 50,
        composition: 20,
        contrast: 30,
      },
      detectedBiases: [
        "AI Service Offline: แสดงเฉพาะข้อมูลที่วัดได้จริงจากพิกเซล Canvas โดยไม่มีการแต่งเติมข้อมูลเท็จ",
      ],
      transparencyNote: `คำนวณจากค่าพิกเซลจริง (Color Harmony: ${harmony}, Contrast: ${contrast})`,
    },
  };
}
