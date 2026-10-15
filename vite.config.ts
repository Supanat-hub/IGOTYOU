import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

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

    if (req.method === "POST" && req.url === "/api/analyze") {
      // 1. Rate limiting per IP
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

      let bodyStr = "";
      let exceededLimit = false;
      const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

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
          res.end(JSON.stringify({ error: "ขนาดไฟล์หรือข้อมูลรูปภาพใหญ่เกิน 5MB" }));
          return;
        }

        try {
          const { prompt, images } = JSON.parse(bodyStr);
          const effectiveKey = (req.headers["x-gemini-key"] as string) || apiKey;

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

          // 2. Strict Input Validation
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

          if (!prompt || typeof prompt !== "string" || prompt.length > 25000) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "ข้อมูล Prompt ไม่ถูกต้องหรือยาวเกินกำหนด" }));
            return;
          }

          // 3. Reliable model fallback without 45s stalls
          const candidateModels = [
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
          ];

          let successData: any = null;
          let lastError = "";

          for (const model of candidateModels) {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 12000);

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
                const errText = await response.text().catch(() => "");
                console.warn(`[Proxy] Model ${model} returned ${status}: ${errText.slice(0, 150)}`);
                lastError = `โมเดล ${model} ตอบสนองด้วยรหัส ${status}`;
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
                error: "ไม่สามารถประมวลผลด้วย Gemini AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
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
        if (req.url === "/api/analyze") {
          handler(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/analyze") {
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
