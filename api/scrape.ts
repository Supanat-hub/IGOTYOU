// Vercel / Node Serverless function for /api/scrape
import type { IncomingMessage, ServerResponse } from "node:http";

// In-memory rate limiter per IP: max 10 requests per minute with active cleanup
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 500) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }
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

function getCorsOrigin(req: any): string {
  const origin = req.headers?.origin || "";
  if (!origin) return "";
  if (
    origin === "https://plazedez.online" ||
    origin === "https://www.plazedez.online" ||
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".pages.dev") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    return origin;
  }
  return "";
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  const allowOrigin = getCorsOrigin(req);
  if (allowOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" }));
    return;
  }

  const forwarded = req.headers["x-forwarded-for"];
  const clientIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "127.0.0.1";
  if (!checkRateLimit(clientIp)) {
    res.statusCode = 429;
    res.end(
      JSON.stringify({
        error: "RATE_LIMITED",
        message: "คุณส่งคำขอถี่เกินไป เพื่อความปลอดภัย กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
      })
    );
    return;
  }

  const { username } = req.body || {};
  if (!username || typeof username !== "string") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "MISSING_USERNAME", message: "กรุณาระบุชื่อบัญชี Instagram ที่ต้องการวิเคราะห์" }));
    return;
  }

  const cleanUsername = username.trim().toLowerCase().replace(/^@+/, "");
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleanUsername)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "INVALID_USERNAME", message: "รูปแบบชื่อบัญชี Instagram ไม่ถูกต้อง" }));
    return;
  }

  const scraperUrl =
    process.env.SCRAPER_ENDPOINT_URL ||
    "https://ig-scraper.plazedez.online";
  const scraperSecret = process.env.SCRAPER_API_SECRET || "";

  if (!scraperSecret) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: "CONFIGURATION_ERROR",
        message: "ระบบ Scraper ยังไม่ได้ตั้งค่าความปลอดภัย (SCRAPER_API_SECRET) กรุณาสลับไปใช้วิธีอัปโหลดภาพหน้าจอ",
      })
    );
    return;
  }

  if (!scraperUrl) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: "SCRAPER_OFFLINE",
        message: "ระบบดึงข้อมูลอัตโนมัติยังไม่เปิดให้บริการหรือเซิร์ฟเวอร์ยังไม่ได้เชื่อมต่อ คุณสามารถสลับไปใช้วิธี 'อัปโหลดภาพหน้าจอ' เพื่อวิเคราะห์ต่อได้ทันที",
      })
    );
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const targetUrl = scraperUrl.endsWith("/api/scrape")
      ? scraperUrl
      : `${scraperUrl.replace(/\/+$/, "")}/api/scrape`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (scraperSecret) {
      headers["x-scraper-secret"] = scraperSecret;
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ username: cleanUsername }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json().catch(() => null);
    res.statusCode = response.status;
    res.end(JSON.stringify(data || { error: "INVALID_RESPONSE", message: "ข้อมูลตอบกลับไม่ถูกต้อง" }));
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        error: isTimeout ? "SCRAPER_TIMEOUT" : "SCRAPER_UNAVAILABLE",
        message: isTimeout
          ? "เซิร์ฟเวอร์ Scraper ใช้เวลาประมวลผลนานเกินไป กรุณาสลับไปใช้วิธีอัปโหลดภาพหน้าจอ"
          : "ไม่สามารถเชื่อมต่อไปยังเซิร์ฟเวอร์ Scraper ได้ในขณะนี้ กรุณาสลับไปใช้วิธีอัปโหลดภาพหน้าจอ",
      })
    );
  }
}
