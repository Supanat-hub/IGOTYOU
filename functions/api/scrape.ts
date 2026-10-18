// Cloudflare Pages Function for /api/scrape

interface Env {
  SCRAPER_ENDPOINT_URL?: string;
  SCRAPER_API_SECRET?: string;
}

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

function getCorsOrigin(request: Request): string {
  const origin = request.headers.get("origin") || "";
  if (!origin) return "";
  if (
    origin === "https://plazedez.online" ||
    origin === "https://www.plazedez.online" ||
    origin.endsWith(".pages.dev") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    return origin;
  }
  return "";
}

export const onRequestOptions = async (context: { request: Request }) => {
  const allowOrigin = getCorsOrigin(context.request);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
    headers["Vary"] = "Origin";
  }
  return new Response(null, {
    status: 204,
    headers,
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const allowOrigin = getCorsOrigin(request);
  const securityHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
  if (allowOrigin) {
    securityHeaders["Access-Control-Allow-Origin"] = allowOrigin;
    securityHeaders["Vary"] = "Origin";
  }

  const clientIp = request.headers.get("cf-connecting-ip") || "127.0.0.1";
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        error: "RATE_LIMITED",
        message: "คุณส่งคำขอถี่เกินไป เพื่อความปลอดภัย กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
      }),
      { status: 429, headers: securityHeaders }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "INVALID_REQUEST", message: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" }),
      { status: 400, headers: securityHeaders }
    );
  }

  const { username } = body || {};
  if (!username || typeof username !== "string") {
    return new Response(
      JSON.stringify({ error: "MISSING_USERNAME", message: "กรุณาระบุชื่อบัญชี Instagram ที่ต้องการวิเคราะห์" }),
      { status: 400, headers: securityHeaders }
    );
  }

  const cleanUsername = username.trim().toLowerCase().replace(/^@+/, "");
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleanUsername)) {
    return new Response(
      JSON.stringify({ error: "INVALID_USERNAME", message: "รูปแบบชื่อบัญชี Instagram ไม่ถูกต้อง" }),
      { status: 400, headers: securityHeaders }
    );
  }

  const scraperUrl =
    env.SCRAPER_ENDPOINT_URL ||
    "https://ig-scraper.plazedez.online";
  const scraperSecret = env.SCRAPER_API_SECRET || "";

  if (!scraperSecret) {
    return new Response(
      JSON.stringify({
        error: "CONFIGURATION_ERROR",
        message: "ระบบ Scraper ยังไม่ได้ตั้งค่าความปลอดภัย (SCRAPER_API_SECRET) กรุณาสลับไปใช้วิธีอัปโหลดภาพหน้าจอ",
      }),
      { status: 500, headers: securityHeaders }
    );
  }

  if (!scraperUrl) {
    return new Response(
      JSON.stringify({
        error: "SCRAPER_OFFLINE",
        message: "ระบบดึงข้อมูลอัตโนมัติยังไม่เปิดให้บริการหรือเซิร์ฟเวอร์ยังไม่ได้เชื่อมต่อ คุณสามารถสลับไปใช้วิธี 'อัปโหลดภาพหน้าจอ' เพื่อวิเคราะห์ต่อได้ทันที",
      }),
      { status: 503, headers: securityHeaders }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for scraping queue

    const targetUrl = scraperUrl.endsWith("/api/scrape")
      ? scraperUrl
      : `${scraperUrl.replace(/\/+$/, "")}/api/scrape`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
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

    const responseData = await response.json().catch(() => null);

    // Normalize: If scraper returned PUBLIC but postsCount > 0 and 0 posts exist, account is private
    if (
      responseData &&
      responseData.status === "PUBLIC" &&
      responseData.data?.stats?.postsCount > 0 &&
      (!responseData.data?.posts || responseData.data.posts.length === 0)
    ) {
      responseData.status = "PRIVATE_ACCOUNT";
      responseData.message = "🔒 บัญชีนี้ตั้งค่าเป็นส่วนตัว (Private Account) ทำให้ระบบไม่สามารถเข้าถึงรูปภาพได้";
      if (responseData.data) {
        responseData.data.isPrivate = true;
      }
    }

    return new Response(
      JSON.stringify(
        responseData || {
          error: "INVALID_RESPONSE",
          message: "เซิร์ฟเวอร์ Scraper ตอบสนองด้วยข้อมูลที่ไม่ถูกต้อง",
        }
      ),
      {
        status: response.status,
        headers: securityHeaders,
      }
    );
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    return new Response(
      JSON.stringify({
        error: isTimeout ? "SCRAPER_TIMEOUT" : "SCRAPER_UNAVAILABLE",
        message: isTimeout
          ? "เซิร์ฟเวอร์ Scraper ใช้เวลาประมวลผลนานเกินไป กรุณาลองใหม่อีกครั้งหรือสลับไปใช้วิธีอัปโหลดภาพหน้าจอ"
          : "ไม่สามารถเชื่อมต่อไปยังเซิร์ฟเวอร์ Scraper ได้ในขณะนี้ กรุณาสลับไปใช้วิธีอัปโหลดภาพหน้าจอ",
      }),
      { status: 502, headers: securityHeaders }
    );
  }
};
