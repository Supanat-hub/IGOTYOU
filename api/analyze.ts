// Vercel Serverless Function for /api/analyze

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

export default async function handler(req: any, res: any) {
  // CORS & Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Rate limiting per IP
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

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

  // Parse body
  let body: any = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" }));
      return;
    }
  } else if (!body) {
    // If body parser didn't run, read stream
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString();
      body = JSON.parse(data);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" }));
      return;
    }
  }

  const { images } = body || {};
  const effectiveKey = process.env.GEMINI_API_KEY || "";

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

  if (!images || !Array.isArray(images) || images.length === 0 || images.length > 3) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "ต้องมีรูปภาพระหว่าง 1 ถึง 3 ภาพเท่านั้น" }));
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

  const prompt = `You are IGOTYOU, an objective, insightful, culturally-attuned Instagram aesthetic & profile analyzer (like Spotify Wrapped, but for Instagram visual identity).
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
   - "post_grid": bounding box of the actual photos in the post grid. If a row has only 1 or 2 posts, xmax MUST only cover the actual photos, NOT empty space!
   - "avatar": bounding box of the circular profile avatar.
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

8. Top 3 content pillars in Thai (e.g. แสงเงาสตรีท · สถาปัตยกรรมมืด · มุมมองขาวดำ).
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
  "persona": { "title": "...", "description": "ฉายาประจำโปรไฟล์ของคุณคือ", "tags": ["tag1", "tag2"] },
  "aestheticScore": { "verdict": "...", "description": "...", "honestCritique": "..." },
  "compositionScore": 72,
  "stats": { "followerRatio": "1.1×", "postDensity": "2", "ocrNote": "ประเมินจากภาพถ่ายหน้าจอ" },
  "topContent": { "category": "TOP CONTENT", "description": "..." },
  "bioRemix": { "text": "...", "subtext": "..." }
}`;

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
        console.warn(`[API] Model ${model} returned ${status}: ${errMsg.slice(0, 150)}`);
        if (status === 429) {
          lastError = "โควตา Gemini API เต็มชั่วคราว (Quota 429) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
        } else if (status === 403) {
          lastError = "API Key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน (403 Forbidden)";
        } else {
          lastError = `โมเดล ${model} ตอบสนองด้วยรหัส ${status}`;
        }
      }
    } catch (err: any) {
      console.warn(`[API] Model ${model} failed: ${err.message}`);
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
}
