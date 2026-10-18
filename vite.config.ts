import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// Simple in-memory rate limiter per IP: max 12 requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string, limit = 12, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

function geminiAnalyzeProxyPlugin(apiKey: string): Plugin {
  const handler = async (req: any, res: any) => {
    // Standard security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (req.method === "POST" && req.url === "/api/scrape") {
      let bodyStr = "";
      req.on("data", (chunk: any) => {
        bodyStr += chunk;
      });
      req.on("end", async () => {
        try {
          const { username } = JSON.parse(bodyStr);
          if (!username || typeof username !== "string") {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "MISSING_USERNAME", message: "กรุณาระบุชื่อบัญชี Instagram" }));
            return;
          }
          const cleanUsername = username.trim().toLowerCase().replace(/^@+/, "");
          const scraperUrl = process.env.SCRAPER_ENDPOINT_URL || "http://localhost:3001";
          const scraperSecret = process.env.SCRAPER_API_SECRET || "";

          const targetUrl = scraperUrl.endsWith("/api/scrape")
            ? scraperUrl
            : `${scraperUrl.replace(/\/+$/, "")}/api/scrape`;
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (scraperSecret) headers["x-scraper-secret"] = scraperSecret;

          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000);
            const scraperRes = await fetch(targetUrl, {
              method: "POST",
              headers,
              body: JSON.stringify({ username: cleanUsername }),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            const data = await scraperRes.json().catch(() => null);
            res.statusCode = scraperRes.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data || { error: "INVALID_RESPONSE" }));
          } catch (e: any) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "SCRAPER_OFFLINE",
                message:
                  "เซิร์ฟเวอร์ Scraper ยังไม่ได้เปิดใช้งาน (หรือออฟไลน์อยู่) คุณสามารถสลับไปใช้วิธี 'อัปโหลดภาพหน้าจอ' แทนได้ทันที",
              })
            );
          }
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "INVALID_REQUEST", message: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" }));
        }
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/analyze") {
      // 1. Rate limiting per IP (keyed directly on socket remoteAddress to prevent X-Forwarded-For spoofing)
      const clientIp = req.socket?.remoteAddress || "127.0.0.1";

      if (!checkRateLimit(clientIp)) {
        res.statusCode = 429;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error: "คุณส่งคำขอถี่เกินไป เพื่อความปลอดภัย กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
          })
        );
        return;
      }

      let bodyStr = "";
      let exceededLimit = false;
      const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

      req.on("data", (chunk: any) => {
        bodyStr += chunk;
        if (bodyStr.length > MAX_BODY_BYTES) {
          exceededLimit = true;
          req.destroy();
        }
      });

      req.on("end", async () => {
        if (exceededLimit) {
          res.statusCode = 413;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ขนาดไฟล์หรือข้อมูลรูปภาพใหญ่เกิน 10MB" }));
          return;
        }

        try {
          const { images, scrapedProfile } = JSON.parse(bodyStr);
          let currentKey = apiKey;
          try {
            const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
            const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
            if (match && match[1]) {
              currentKey = match[1].trim();
            }
          } catch {
            // fallback to apiKey
          }
          const effectiveKey = currentKey || process.env.GEMINI_API_KEY || "";

          if (!effectiveKey) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY บนเซิร์ฟเวอร์",
              })
            );
            return;
          }

          // 2. Strict Input Validation (Images array: 1 to 3 or 12 for scrapedProfile)
          const maxImages = scrapedProfile ? 12 : 3;
          if (!images || !Array.isArray(images) || images.length === 0 || images.length > maxImages) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: `ต้องมีรูปภาพระหว่าง 1 ถึง ${maxImages} ภาพเท่านั้น` }));
            return;
          }

          for (const img of images) {
            if (
              !img.mimeType ||
              !["image/jpeg", "image/png", "image/webp"].includes(img.mimeType) ||
              !img.data ||
              typeof img.data !== "string"
            ) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "รูปแบบไฟล์รูปภาพไม่ถูกต้อง (รองรับ JPG, PNG, WEBP)" }));
              return;
            }
          }

          // 3. Fixed server-side prompt template (Prevents arbitrary prompt injection & proxy abuse)
          const screenshotPrompt = `You are IGOTYOU, an objective, insightful, culturally-attuned Instagram aesthetic & profile analyzer (like Spotify Wrapped, but for Instagram visual identity).
Analyze the provided screenshot(s).

TASKS:
0. CRITICAL PROFILE VALIDATION:
   First, inspect if the uploaded image is actually an Instagram profile screen (has handle/username, bio, avatar, or post grid).
   - If the image is completely unrelated (e.g. a payment slip/receipt, random meme, standalone landscape/food photo with no IG UI, chat screenshot, document, or non-Instagram picture):
     Set "isValidProfile": false,
     Set "invalidReason": "ภาพที่อัปโหลดไม่ตรงกับหน้าจอโปรไฟล์ Instagram (ไม่พบแถบชื่อผู้ใช้หรือกริดรูปภาพ) กรุณาแคปภาพหน้าโปรไฟล์ Instagram แล้วลองใหม่อีกครั้ง"
     You may leave other fields with minimal placeholder values.
   - If the image is a genuine Instagram profile screen:
     Set "isValidProfile": true, "invalidReason": ""

1. Extract exact username (@username). Look at the top handle text.
2. Read bio text, category, school/university, MBTI, interests, and photo mood carefully to understand their core vibe.
3. Extract stats: post count, followers count, following count, and calculate follower-to-following ratio (e.g. 1.1x).
4. For each image (indexed 0 to ${images.length - 1}), identify the active photo bounding boxes [ymin, xmin, ymax, xmax] (0 to 1000):
   - "post_grid": Bounding box of the 3-column post photo grid.
     * ymin MUST be strictly below the 3 tab icons (grid/reels/tag icons), exactly where the first photo pixels begin!
     * ymax MUST be strictly above the bottom navigation bar (home/search/reels/profile icons).
     * If the row has empty slots on the right, xmax should only cover the actual photos, NOT empty space!
   - "avatar": Bounding box [ymin, xmin, ymax, xmax] of the circular profile avatar photo.
   Include "image_index" (0 to ${images.length - 1}) in each detected box.

5. STRICT COMPOSITION & COHESION SCORING (NO FLATTERY BIAS):
   Evaluate compositionScore honestly on a 25 to 98 scale:
   - 90–98: Master curation (unified cohesive color story, consistent lighting/shadows, intentional grid flow).
   - 75–89: Good aesthetic taste, but has 1-2 photos with disjointed lighting or color deviation.
   - 55–74: Casual everyday uncurated feed (mixed subjects, random lighting, no deliberate color theme).
   - 35–54: Chaotic/clashing (mismatched neon vs dull tones, harsh conflicting lighting, jarring angles).
   - < 35: Extremely messy or cluttered visuals.

6. Persona title in Thai:
   - Create a witty, trendy, rhyming Spotify-Wrapped ARCHETYPE BADGE in Thai ("คำเฟี้ยวๆ สไตล์ตัวตึง ตัวแม่ ตัวพ่อ สัมผัสคล้องจอง จำง่าย ติดหู").
   - EXAMPLES OF GREAT PERSONAS (MUST BE PUNCHY & RHYMING):
     "เทสดีมีสไตล์ · คล้ายพี่ดารา"
     "ตัวตึงคุมโทน · โดดเด่นเกินต้าน"
     "สายแฟตัวแม่ · แคร์แค่แสงเงา"
     "มินิมอลตัวพ่อ · หล่อแบบนิ่งๆ"
     "สเปซคูลๆ · ดูดีทุกองศา"
     "อาร์ตตัวท็อป · ช็อตนี้ต้องหยุดดู"
     "เด็กสถาปัตย์ · ดึกดื่นตื่นมาคุมโทน"
     "สถาปนิกเงา · ผู้คุมมู้ดดาร์ก"
     "กวีแห่งแสงเงา · เล่าเรื่องด้วยมู้ด"
     "สโลว์ไลฟ์สายชิค · จิบคราฟต์กาแฟ"
   - STRICT PROHIBITION: NEVER simply join words from their bio, school acronyms, or MBTI with dots (DO NOT output things like "KMITL · INTP สายอาร์ต" or "Chula · ENFP สายเที่ยว")! That is robotic and lacks insight. Instead, synthesize their visual world, aesthetics, and lifestyle into a meaningful, witty persona title they will proudly share on IG Story.
   - Max 14-24 characters. Connect the 2 natural rhyming halves using " · " (so it displays crisply on a single line on the story card).
   - Tags: 2-3 creative aesthetic tags (e.g. "dark academia", "shadow play", "concrete poetry", "monochrome vibes"), NOT raw school acronyms.

7. Aesthetic score verdict & honest critique:
   - verdict: Short punchy phrase reflecting reality (e.g. "คุมโทนระดับมาสเตอร์", "โทนภาพมีเอกลักษณ์", "ฟีดตามใจฉัน สไตล์ไลฟ์สไตล์", "สีและแสงค่อนข้างตีกัน").
   - description: 1-2 thoughtful sentences explaining their visual harmony and color choice.
   - honestCritique: A truthful 1-sentence critique in Thai pointing out both what works and what reduced the score (e.g. "โทนสีสตรีทมีความดิบเท่ แต่ภาพที่มีแสงแฟลชสว่างโดดออกมาจากโทนรวม ทำให้ความกลมกลืนของกริดลดลง").

8. Top 3 content pillars in Thai (e.g. แสงเงาสตรีท · สถาปัตยกรรมมืด · มุมมองขาวดำ), AND rank the visible grid posts by visual quality:
   - Inspect all unique visible post photos in reading order (index 0 = top-left post, 1 = top-middle, 2 = top-right, 3 = second row left, etc.).
   - Return "topPostIndices": an array of 0-based post indices ordered from the MOST aesthetically striking, best-composed, well-lit, and color-cohesive photo (#1 best) down to the rest (e.g. [2, 0, 4, 1, 3, 5]). Prefer crisp, artistic, well-balanced photos over text-heavy screenshots, blurry frames, or cluttered shots.
9. A witty, poetic 1-line English bio remix with a clever Thai subtext.

Return ONLY valid JSON matching this exact structure:
{
  "isValidProfile": true,
  "invalidReason": "",
  "username": "@username",
  "detectedBoxes": [
    { "image_index": 0, "ymin": 150, "xmin": 0, "ymax": 950, "xmax": 660, "label": "post_grid" },
    { "image_index": 1, "ymin": 80, "xmin": 30, "ymax": 260, "xmax": 300, "label": "avatar" }
  ],
  "topPostIndices": [1, 0, 2],
  "persona": { "title": "...", "description": "ฉายาประจำโปรไฟล์ของคุณคือ", "tags": ["tag1", "tag2"] },
  "aestheticScore": { "verdict": "...", "description": "...", "honestCritique": "..." },
  "compositionScore": 72,
  "stats": { "followerRatio": "1.1×", "postDensity": "2", "ocrNote": "ประเมินจากภาพถ่ายหน้าจอ" },
  "topContent": { "category": "TOP CONTENT", "description": "..." },
  "bioRemix": { "text": "...", "subtext": "..." }
}`;

          const prompt = scrapedProfile
            ? `You are IGOTYOU, an objective, insightful, culturally-attuned Instagram aesthetic & profile analyzer (like Spotify Wrapped, but for Instagram visual identity).
You are analyzing the authentic Instagram profile data and post photos of @${scrapedProfile.username}.

PROFILE INFORMATION (100% VERIFIED ACCURATE):
- Username: @${scrapedProfile.username}
- Full Name: ${scrapedProfile.fullName || "-"}
- Biography: ${scrapedProfile.biography || "-"}
- Category: ${scrapedProfile.category || "-"}
- Verified Status: ${scrapedProfile.isVerified ? "Verified" : "Standard"}
- Stats: Posts: ${scrapedProfile.stats?.postsCount ?? 0}, Followers: ${scrapedProfile.stats?.followersCount ?? 0}, Following: ${scrapedProfile.stats?.followingCount ?? 0}, Follower Ratio: ${scrapedProfile.stats?.followerRatio ?? "1.0×"}

ATTACHED PHOTOS:
The attached images are the actual individual post photos (${images.length} photos) from this user's profile feed.

TASKS:
1. STRICT COMPOSITION & COHESION SCORING (NO FLATTERY BIAS):
   Evaluate compositionScore honestly on a 25 to 98 scale:
   - 90–98: Master curation (unified cohesive color story, consistent lighting/shadows, intentional grid flow).
   - 75–89: Good aesthetic taste, but has 1-2 photos with disjointed lighting or color deviation.
   - 55–74: Casual everyday uncurated feed (mixed subjects, random lighting, no deliberate color theme).
   - 35–54: Chaotic/clashing (mismatched neon vs dull tones, harsh conflicting lighting, jarring angles).
   - < 35: Extremely messy or cluttered visuals.

2. Persona title in Thai:
   - Create a witty, trendy, rhyming Spotify-Wrapped ARCHETYPE BADGE in Thai ("คำเฟี้ยวๆ สไตล์ตัวตึง ตัวแม่ ตัวพ่อ สัมผัสคล้องจอง จำง่าย ติดหู").
   - EXAMPLES OF GREAT PERSONAS (MUST BE PUNCHY & RHYMING):
     "เทสดีมีสไตล์ · คล้ายพี่ดารา"
     "ตัวตึงคุมโทน · โดดเด่นเกินต้าน"
     "สายแฟตัวแม่ · แคร์แค่แสงเงา"
     "มินิมอลตัวพ่อ · หล่อแบบนิ่งๆ"
     "สเปซคูลๆ · ดูดีทุกองศา"
     "อาร์ตตัวท็อป · ช็อตนี้ต้องหยุดดู"
     "เด็กสถาปัตย์ · ดึกดื่นตื่นมาคุมโทน"
     "สถาปนิกเงา · ผู้คุมมู้ดดาร์ก"
     "กวีแห่งแสงเงา · เล่าเรื่องด้วยมู้ด"
     "สโลว์ไลฟ์สายชิค · จิบคราฟต์กาแฟ"
   - STRICT PROHIBITION: NEVER simply join words from their bio, school acronyms, or MBTI with dots (DO NOT output things like "KMITL · INTP สายอาร์ต" or "Chula · ENFP สายเที่ยว")! That is robotic and lacks insight. Instead, synthesize their visual world, aesthetics, and lifestyle into a meaningful, witty persona title they will proudly share on IG Story.
   - Max 14-24 characters. Connect the 2 natural rhyming halves using " · " (so it displays crisply on a single line on the story card).
   - Tags: 2-3 creative aesthetic tags (e.g. "dark academia", "shadow play", "concrete poetry", "monochrome vibes"), NOT raw school acronyms.

3. Aesthetic score verdict & honest critique:
   - verdict: Short punchy phrase reflecting reality (e.g. "คุมโทนระดับมาสเตอร์", "โทนภาพมีเอกลักษณ์", "ฟีดตามใจฉัน สไตล์ไลฟ์สไตล์", "สีและแสงค่อนข้างตีกัน").
   - description: 1-2 thoughtful sentences explaining their visual harmony and color choice.
   - honestCritique: A truthful 1-sentence critique in Thai pointing out both what works and what reduced the score (e.g. "โทนสีสตรีทมีความดิบเท่ แต่ภาพที่มีแสงแฟลชสว่างโดดออกมาจากโทนรวม ทำให้ความกลมกลืนของกริดลดลง").

4. Top 3 content pillars in Thai (e.g. แสงเงาสตรีท · สถาปัตยกรรมมืด · มุมมองขาวดำ), AND rank the attached post photos by visual quality:
   - Return "topPostIndices": an array of 0-based image indices (0 to ${images.length - 1}) ordered from the MOST aesthetically striking, best-composed, well-lit, and color-cohesive photo (#1 best) down to the rest (e.g. [2, 0, 4, 1, 3, 5]).
5. A witty, poetic 1-line English bio remix with a clever Thai subtext.

Return ONLY valid JSON matching this exact structure:
{
  "isValidProfile": true,
  "invalidReason": "",
  "username": "@${scrapedProfile.username}",
  "topPostIndices": [0, 1, 2],
  "persona": { "title": "...", "description": "ฉายาประจำโปรไฟล์ของคุณคือ", "tags": ["tag1", "tag2"] },
  "aestheticScore": { "verdict": "...", "description": "...", "honestCritique": "..." },
  "compositionScore": 72,
  "stats": { "followerRatio": "${scrapedProfile.stats?.followerRatio || "1.0×"}", "postDensity": "${scrapedProfile.stats?.postsCount || "0"}", "ocrNote": "ข้อมูลสถิติแม่นยำดึงตรงจาก Instagram" },
  "topContent": { "category": "TOP CONTENT", "description": "..." },
  "bioRemix": { "text": "...", "subtext": "..." }
}`
            : screenshotPrompt;

          // 3. Reliable model fallback without 45s stalls (active v1beta models)
          const candidateModels = [
            "gemini-3.5-flash-lite",
            "gemini-3.8-flash",
            "gemini-flash-latest",
          ];

          let successData: any = null;
          let lastError = "";

          for (const model of candidateModels) {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 15000);

              // Header-based key transmission (prevents query param logging leaks)
              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": effectiveKey,
                  },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          { text: prompt },
                          ...images.map((img: any) => ({
                            inlineData: { mimeType: img.mimeType, data: img.data },
                          })),
                        ],
                      },
                    ],
                    generationConfig: { responseMimeType: "application/json" },
                  }),
                  signal: controller.signal,
                }
              );
              clearTimeout(timeout);

              if (response.ok) {
                const data = await response.json();
                const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (jsonText) {
                  successData = JSON.parse(jsonText);
                  break;
                }
              } else {
                const status = response.status;
                const errData = await response.json().catch(() => null);
                const errMsg = errData?.error?.message || (await response.text().catch(() => ""));
                console.warn(`[Proxy] Model ${model} returned ${status}: ${errMsg.slice(0, 150)}`);
                if (status === 429) {
                  lastError = "โควตา Gemini API เต็มชั่วคราว (Quota 429) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
                } else if (status === 403) {
                  lastError = "API Key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน (403 Forbidden)";
                } else {
                  lastError = `โมเดล ${model} ตอบสนองด้วยรหัส ${status}`;
                }
              }
            } catch (err: any) {
              console.warn(`[Proxy] Model ${model} failed: ${err.message}`);
              lastError = `การเชื่อมต่อไปยังโมเดลเกิดข้อผิดพลาด (${err.message})`;
            }
          }

          if (successData) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(successData));
          } else {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: lastError || "ไม่สามารถประมวลผลด้วย Gemini AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
              })
            );
          }
        } catch (e: any) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" }));
        }
      });
      return;
    }
  };

  return {
    name: "gemini-analyze-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/analyze" || req.url === "/api/scrape") {
          handler(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/analyze" || req.url === "/api/scrape") {
          handler(req, res);
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

  return {
    plugins: [react(), tailwindcss(), geminiAnalyzeProxyPlugin(apiKey)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});
