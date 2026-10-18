import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { LRUCache } from "lru-cache";
import { chromium } from "playwright";
import sharp from "sharp";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3001", 10);
const SCRAPER_API_SECRET = process.env.SCRAPER_API_SECRET || "";
const WARP_PROXY = process.env.WARP_PROXY || "";
const CACHE_TTL_MINUTES = parseInt(process.env.CACHE_TTL_MINUTES || "30", 10);

const SESSION_DIR = path.resolve(process.cwd(), "ig-session");
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// In-memory LRU Cache (30-minute default TTL)
const cache = new LRUCache({
  max: 500,
  ttl: CACHE_TTL_MINUTES * 60 * 1000,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Helper: parse human formatted numbers (e.g. "12.4K", "1.2M", "1,450" -> 12400)
function parseStatNumber(raw) {
  if (typeof raw === "number") return raw;
  if (!raw || typeof raw !== "string") return 0;
  const clean = raw.trim().replace(/,/g, "").toUpperCase();
  if (clean.endsWith("K")) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000);
  }
  if (clean.endsWith("M")) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000000);
  }
  if (clean.endsWith("B")) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000000000);
  }
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper: Download and optimize image to WebP/JPEG Base64
async function optimizeImageToBase64(buffer, maxWidth = 400) {
  try {
    const resized = await sharp(buffer)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (err) {
    // Fallback to original buffer as base64
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }
}

// Concurrency Queue: Execute one scraping task at a time
let isScrapingBusy = false;
const queue = [];

function enqueueScrape(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isScrapingBusy || queue.length === 0) return;
  isScrapingBusy = true;
  const { task, resolve, reject } = queue.shift();
  try {
    const res = await task();
    resolve(res);
  } catch (err) {
    reject(err);
  } finally {
    isScrapingBusy = false;
    // Human-like jitter delay between requests (1.5s - 3s)
    const jitter = Math.floor(Math.random() * 1500) + 1500;
    setTimeout(processQueue, jitter);
  }
}

// Core Instagram Scraper Logic via Playwright Persistent Context
async function scrapeInstagramProfile(targetUsername) {
  const cleanUsername = targetUsername.toLowerCase().trim().replace(/^@+/, "");

  const proxyConfig = WARP_PROXY ? { server: WARP_PROXY } : undefined;

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    proxy: proxyConfig,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await context.newPage();

  // Intercept internal Instagram web profile JSON response if triggered
  let capturedProfileJson = null;
  page.on("response", async (response) => {
    try {
      const url = response.url();
      if (
        url.includes("/api/v1/users/web_profile_info/") ||
        url.includes("user_profile_by_username")
      ) {
        const json = await response.json().catch(() => null);
        if (json?.data?.user) {
          capturedProfileJson = json.data.user;
        }
      }
    } catch {
      // Ignore background stream parsing errors
    }
  });

  try {
    const targetUrl = `https://www.instagram.com/${cleanUsername}/`;
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    // Wait a brief moment for hydration
    await page.waitForTimeout(2500);

    // 1. Check for 404 / User Not Found
    const pageText = await page.evaluate(() => document.body?.innerText || "");
    if (
      pageText.includes("Sorry, this page isn't available") ||
      pageText.includes("ขออภัย หน้านี้ไม่พร้อมใช้งาน") ||
      pageText.includes("The link you followed may be broken")
    ) {
      return {
        status: "NOT_FOUND",
        message: `ไม่พบบัญชี @${cleanUsername} ใน Instagram`,
      };
    }

    // 2. Check for Private Account indicator
    const isPrivateDOM = await page.evaluate(() => {
      const text = document.body?.innerText || "";
      return (
        text.includes("This Account is Private") ||
        text.includes("This account is private") ||
        text.includes("บัญชีนี้เป็นส่วนตัว")
      );
    });

    const isPrivate =
      capturedProfileJson?.is_private ?? isPrivateDOM;

    if (isPrivate) {
      // Extract whatever header stats are visible
      const headerStats = await page.evaluate(() => {
        const stats = {};
        const header = document.querySelector("header") || document.body;
        const text = header.innerText || "";
        const followersMatch = text.match(/([\d.,KMkm]+)\s*(?:followers|ผู้ติดตาม)/i);
        const postsMatch = text.match(/([\d.,KMkm]+)\s*(?:posts|โพสต์)/i);
        const followingMatch = text.match(/([\d.,KMkm]+)\s*(?:following|กำลังติดตาม)/i);
        if (followersMatch) stats.followers = followersMatch[1];
        if (postsMatch) stats.posts = postsMatch[1];
        if (followingMatch) stats.following = followingMatch[1];
        return stats;
      });

      return {
        status: "PRIVATE_ACCOUNT",
        message: "บัญชีนี้ตั้งค่าเป็นส่วนตัว (Private Account)",
        username: cleanUsername,
        isPrivate: true,
        stats: {
          followersCount: parseStatNumber(
            capturedProfileJson?.edge_followed_by?.count ?? headerStats.followers
          ),
          followingCount: parseStatNumber(
            capturedProfileJson?.edge_follow?.count ?? headerStats.following
          ),
          postsCount: parseStatNumber(
            capturedProfileJson?.edge_owner_to_timeline_media?.count ?? headerStats.posts
          ),
        },
      };
    }

    // 3. For Public Account: Extract structured data & post grid
    const rawData = await page.evaluate((cleanUser) => {
      // Find avatar
      let avatarUrl = "";
      const avatarImg =
        document.querySelector(`header img[alt*="${cleanUser}" i]`) ||
        document.querySelector("header img") ||
        document.querySelector("img[data-testid='user-avatar']");
      if (avatarImg) {
        avatarUrl = avatarImg.src || "";
      }

      // Find full name & bio
      let fullName = "";
      let biography = "";
      let category = "";
      let externalUrl = "";

      const header = document.querySelector("header") || document.body;
      const spans = Array.from(header.querySelectorAll("span, div, h1, h2"));

      for (const el of spans) {
        const t = (el.textContent || "").trim();
        if (!fullName && el.tagName.match(/^H[12]$/i) && t && !t.includes("@")) {
          fullName = t;
        }
      }

      // Check external link
      const extLink = header.querySelector("a[href*='l.instagram.com'], a[target='_blank']");
      if (extLink) externalUrl = extLink.textContent?.trim() || extLink.href;

      // Extract stats from text
      const fullText = header.innerText || "";
      const postsMatch = fullText.match(/([\d.,KMkm]+)\s*(?:posts|โพสต์)/i);
      const followersMatch = fullText.match(/([\d.,KMkm]+)\s*(?:followers|ผู้ติดตาม)/i);
      const followingMatch = fullText.match(/([\d.,KMkm]+)\s*(?:following|กำลังติดตาม)/i);

      // Find visible post tiles
      const postElements = Array.from(
        document.querySelectorAll("article a[href*='/p/'], article a[href*='/reel/'], a[href*='/p/']")
      ).slice(0, 12);

      const posts = [];
      for (const a of postElements) {
        const img = a.querySelector("img");
        if (img && img.src) {
          const isVideo = !!a.querySelector("svg[aria-label*='Clip'], svg[aria-label*='Reel'], svg[aria-label*='Video']");
          posts.push({
            postUrl: a.href,
            imageUrl: img.src,
            caption: img.alt || "",
            isVideo,
          });
        }
      }

      return {
        avatarUrl,
        fullName,
        biography: header.querySelector("section")?.innerText || "",
        category,
        externalUrl,
        stats: {
          posts: postsMatch ? postsMatch[1] : "0",
          followers: followersMatch ? followersMatch[1] : "0",
          following: followingMatch ? followingMatch[1] : "0",
        },
        posts,
      };
    }, cleanUsername);

    // Merge with captured JSON if available for maximum precision
    const finalPostsCount =
      capturedProfileJson?.edge_owner_to_timeline_media?.count ??
      parseStatNumber(rawData.stats.posts);

    const finalFollowersCount =
      capturedProfileJson?.edge_followed_by?.count ??
      parseStatNumber(rawData.stats.followers);

    const finalFollowingCount =
      capturedProfileJson?.edge_follow?.count ??
      parseStatNumber(rawData.stats.following);

    const followerRatio =
      finalFollowingCount > 0
        ? `${(finalFollowersCount / finalFollowingCount).toFixed(1)}×`
        : "1.0×";

    const finalAvatarUrl =
      capturedProfileJson?.profile_pic_url_hd ||
      capturedProfileJson?.profile_pic_url ||
      rawData.avatarUrl;

    const finalBio =
      capturedProfileJson?.biography || rawData.biography;

    const finalFullName =
      capturedProfileJson?.full_name || rawData.fullName;

    // Source post list
    let targetPosts = [];
    if (capturedProfileJson?.edge_owner_to_timeline_media?.edges?.length) {
      targetPosts = capturedProfileJson.edge_owner_to_timeline_media.edges
        .slice(0, 12)
        .map((edge, idx) => ({
          id: edge.node?.id || String(idx),
          imageUrl: edge.node?.display_url || edge.node?.thumbnail_src,
          caption: edge.node?.edge_media_to_caption?.edges?.[0]?.node?.text || "",
          likes: edge.node?.edge_liked_by?.count || edge.node?.edge_media_preview_like?.count || 0,
          comments: edge.node?.edge_media_to_comment?.count || 0,
          isVideo: !!edge.node?.is_video,
          timestamp: edge.node?.taken_at_timestamp || 0,
        }));
    } else {
      targetPosts = rawData.posts.map((p, idx) => ({
        id: String(idx),
        imageUrl: p.imageUrl,
        caption: p.caption,
        likes: 0,
        comments: 0,
        isVideo: p.isVideo,
        timestamp: 0,
      }));
    }

    // Download & optimize images using Playwright context to bypass CORS/hotlink protection
    console.log(`[Scraper] Downloading & optimizing avatar + ${targetPosts.length} posts for @${cleanUsername}...`);

    let avatarBase64 = "";
    if (finalAvatarUrl) {
      try {
        const avatarRes = await page.request.get(finalAvatarUrl);
        if (avatarRes.ok()) {
          const buf = await avatarRes.body();
          avatarBase64 = await optimizeImageToBase64(buf, 300);
        }
      } catch (e) {
        console.warn(`[Scraper] Failed to download avatar: ${e.message}`);
      }
    }

    const processedPosts = [];
    for (const post of targetPosts) {
      if (!post.imageUrl) continue;
      try {
        const postRes = await page.request.get(post.imageUrl);
        if (postRes.ok()) {
          const buf = await postRes.body();
          const imageBase64 = await optimizeImageToBase64(buf, 400);
          processedPosts.push({
            id: post.id,
            imageBase64,
            caption: post.caption,
            likes: post.likes,
            comments: post.comments,
            isVideo: post.isVideo,
            timestamp: post.timestamp,
          });
        }
      } catch (err) {
        console.warn(`[Scraper] Failed to download post image ${post.id}: ${err.message}`);
      }
    }

    return {
      status: "PUBLIC",
      data: {
        username: cleanUsername,
        fullName: finalFullName,
        biography: finalBio,
        category: capturedProfileJson?.category_name || rawData.category || "",
        externalUrl: capturedProfileJson?.external_url || rawData.externalUrl || "",
        isVerified: !!capturedProfileJson?.is_verified,
        stats: {
          postsCount: finalPostsCount,
          followersCount: finalFollowersCount,
          followingCount: finalFollowingCount,
          followerRatio,
        },
        avatarBase64,
        posts: processedPosts,
      },
    };
  } finally {
    await context.close().catch(() => {});
  }
}

// Security Middleware: Validate SCRAPER_API_SECRET
function requireAuth(req, res, next) {
  if (!SCRAPER_API_SECRET) return next();
  const authHeader = req.headers["x-scraper-secret"] || req.query.secret;
  if (!authHeader || authHeader !== SCRAPER_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing x-scraper-secret" });
  }
  next();
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    cacheSize: cache.size,
    queueLength: queue.length,
    isScrapingBusy,
  });
});

// Main Scrape Endpoint
app.post("/api/scrape", requireAuth, async (req, res) => {
  const { username } = req.body || {};
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "กรุณาระบุ username ที่ต้องการดึงข้อมูล" });
  }

  const cleanUsername = username.toLowerCase().trim().replace(/^@+/, "");
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleanUsername)) {
    return res.status(400).json({ error: "รูปแบบชื่อผู้ใช้ Instagram ไม่ถูกต้อง" });
  }

  // Check cache first
  const cached = cache.get(cleanUsername);
  if (cached) {
    console.log(`[Cache Hit] Returning cached profile for @${cleanUsername}`);
    return res.json({ ...cached, fromCache: true });
  }

  console.log(`[Queue] Enqueuing scrape for @${cleanUsername}... (Queue length: ${queue.length})`);

  try {
    const result = await enqueueScrape(() => scrapeInstagramProfile(cleanUsername));

    if (result.status === "NOT_FOUND") {
      return res.status(404).json(result);
    }

    if (result.status === "PUBLIC") {
      cache.set(cleanUsername, result);
    }

    return res.json(result);
  } catch (err) {
    console.error(`[Scraper Error] Failed for @${cleanUsername}:`, err);
    return res.status(500).json({
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์",
      message: err.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("====================================================");
  console.log(`🚀 IGOTYOU Scraper Server running on port ${PORT}`);
  console.log(`🔒 Authentication: ${SCRAPER_API_SECRET ? "Enabled" : "Disabled"}`);
  console.log(`🌐 WARP Proxy: ${WARP_PROXY || "None"}`);
  console.log(`📁 Session directory: ${SESSION_DIR}`);
  console.log("====================================================");
});
