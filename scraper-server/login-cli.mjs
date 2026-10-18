#!/usr/bin/env node
import readline from "node:readline";
import path from "node:path";
import fs from "node:fs";
import { chromium } from "playwright";
import dotenv from "dotenv";

dotenv.config();

const SESSION_DIR = path.resolve(process.cwd(), "ig-session");
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, isPassword = false) {
  return new Promise((resolve) => {
    if (!isPassword) {
      rl.question(question, (answer) => resolve(answer.trim()));
    } else {
      process.stdout.write(question);
      let pass = "";
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding("utf8");

      const onData = (char) => {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(pass.trim());
        } else if (char === "\u0003") {
          process.exit(1);
        } else if (char === "\b" || char === "\x7f") {
          if (pass.length > 0) {
            pass = pass.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          pass += char;
          process.stdout.write("*");
        }
      };

      stdin.on("data", onData);
    }
  });
}

// Option 1: Direct Cookie Paste (100% Reliable, Bypasses all bot-detection)
async function handleDirectCookie(cookieInput) {
  let sessionId = cookieInput.trim();
  // If user pasted full cookie header e.g. "sessionid=xyz; ds_user_id=123"
  if (sessionId.includes("sessionid=")) {
    const match = sessionId.match(/sessionid=([^;]+)/);
    if (match) sessionId = match[1];
  }

  if (!sessionId) {
    console.error("❌ ไม่พบค่า sessionid ที่ถูกต้อง");
    return false;
  }

  console.log("\n🍪 กำลังนำเข้า sessionid cookie เข้าสู่ระบบ...");

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    await context.addCookies([
      {
        name: "sessionid",
        value: sessionId,
        domain: ".instagram.com",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "None",
      },
    ]);

    const page = await context.newPage();
    console.log("🌐 กำลังทดสอบเข้าสู่ระบบ Instagram ด้วย Cookie...");
    await page.goto("https://www.instagram.com/", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });
    await page.waitForTimeout(3000);

    const cookies = await context.cookies();
    const hasSession = cookies.some((c) => c.name === "sessionid" && c.value);
    const currentUrl = page.url();

    if (hasSession && !currentUrl.includes("/accounts/login/")) {
      console.log("\n====================================================");
      console.log("🎉 นำเข้า Session Cookie สำเร็จเรียบร้อย 100%!");
      console.log(`📁 เซฟ Session ลงใน: ${SESSION_DIR}`);
      console.log("🍪 ระบบ Scraper พร้อมทำงานได้ทันที");
      console.log("====================================================\n");
      return true;
    } else {
      console.warn("\n⚠️ ไม่สามารถยืนยัน Cookie ได้ (URL:", currentUrl, ")");
      console.warn("อาจเป็น Cookie ที่หมดอายุแล้ว กรุณาลองคัดลอกใหม่อีกครั้ง");
      return false;
    }
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err.message);
    return false;
  } finally {
    await context.close();
  }
}

// Option 2: Automated Browser Login
async function handleAutoLogin() {
  const username = await ask("👤 บัญชี IG (Username): ");
  if (!username) {
    console.error("❌ ต้องระบุ Username");
    return;
  }

  const password = await ask("🔒 รหัสผ่าน (Password): ", true);
  if (!password) {
    console.error("❌ ต้องระบุ Password");
    return;
  }

  console.log("\n🚀 กำลังเปิดเบราว์เซอร์ Chromium บนเซิร์ฟเวอร์...");

  const proxyConfig = process.env.WARP_PROXY
    ? { server: process.env.WARP_PROXY }
    : undefined;

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

  try {
    console.log("🌐 กำลังเชื่อมต่อไปยังหน้า Login ของ Instagram...");
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForTimeout(2500);

    // Dismiss Cookie Banner if present (Supports English, Japanese, Thai)
    const cookieDismissSelectors = [
      'button:has-text("Decline optional cookies")',
      'button:has-text("Allow all cookies")',
      'button:has-text("Only allow essential cookies")',
      'button:has-text("すべて許可")',
      'button:has-text("オプションのCookieを拒否")',
      'button:has-text("必須のCookieのみ許可")',
      'button:has-text("許可")',
      'div[role="dialog"] button',
    ];

    for (const sel of cookieDismissSelectors) {
      const btn = await page.$(sel).catch(() => null);
      if (btn) {
        console.log(`🍪 กำลังกดข้าม Cookie Consent (${sel})...`);
        await btn.click().catch(() => {});
        await page.waitForTimeout(1000);
        break;
      }
    }

    // Wait for username input (attached)
    console.log("✍️ กำลังค้นหาช่องกรอกข้อมูล...");
    const usernameInput = await page.waitForSelector('input[name="username"]', {
      timeout: 20000,
      state: "attached",
    });

    await usernameInput.scrollIntoViewIfNeeded().catch(() => {});
    await page.fill('input[name="username"]', username);
    await page.waitForTimeout(600);
    await page.fill('input[name="password"]', password);
    await page.waitForTimeout(600);

    console.log("📤 กำลังส่งคำขอล็อกอิน...");
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press("Enter");
    }

    await page.waitForTimeout(5000);

    // Check for explicit error message from Instagram
    const alertMsg = await page
      .$eval(
        '#slfErrorAlert, [role="alert"], div[aria-label="Alert"]',
        (el) => el.textContent.trim()
      )
      .catch(() => null);
    if (alertMsg) {
      console.log(`\n🚨 Instagram แจ้งข้อความ: "${alertMsg}"`);
    }

    // Check if challenge / checkpoint page
    let currentUrl = page.url();
    if (currentUrl.includes("/challenge/")) {
      console.log("\n🛡️ Instagram ขอให้ยืนยันตัวตน (Security Challenge / Checkpoint)");
      const sendCodeBtn = await page.$(
        'button:has-text("Send Security Code"), button:has-text("ส่งรหัสความปลอดภัย"), button:has-text("Send Code"), button:has-text("ต่อไป")'
      );
      if (sendCodeBtn) {
        console.log("📨 กำลังกดขอรับรหัสยืนยันความปลอดภัย...");
        await sendCodeBtn.click().catch(() => {});
        await page.waitForTimeout(3000);
      }
    }

    // Check if 2FA or Security Code verification input is requested
    const twoFactorInput = await page.$(
      'input[name="verificationCode"], input[name="security_code"], input[aria-label*="Security Code"], input[placeholder*="Security Code"], input[type="tel"]'
    );
    if (twoFactorInput) {
      console.log("\n🛡️ Instagram ต้องการรหัสยืนยันความปลอดภัย 6 หลัก (จาก SMS/Email/2FA)");
      const code = await ask("🔢 กรุณากรอกรหัสยืนยัน (6 หลัก): ");
      await twoFactorInput.fill(code);
      await page.waitForTimeout(500);

      const confirmBtn = await page.$(
        'button:has-text("Confirm"), button:has-text("Submit"), button[type="button"], button[type="submit"]'
      );
      if (confirmBtn) {
        await confirmBtn.click();
      } else {
        await page.keyboard.press("Enter");
      }
      await page.waitForTimeout(6000);
    }

    // Check for "Save Your Login Info" prompt
    const saveInfoBtn = await page.$(
      'button:has-text("Save Info"), button:has-text("Save info"), button:has-text("บันทึกข้อมูล"), button:has-text("Save information")'
    );
    if (saveInfoBtn) {
      console.log("💾 กดบันทึกข้อมูลการเข้าสู่ระบบ (Save Login Info)...");
      await saveInfoBtn.click().catch(() => {});
      await page.waitForTimeout(3000);
    }

    // Check for "Turn on Notifications" prompt
    const notNowBtn = await page.$(
      'button:has-text("Not Now"), button:has-text("ไม่ใช่ตอนนี้"), button:has-text("Not now")'
    );
    if (notNowBtn) {
      await notNowBtn.click().catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Verify cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "sessionid");

    if (sessionCookie && sessionCookie.value) {
      console.log("\n====================================================");
      console.log("🎉 เข้าสู่ระบบสำเร็จแล้ว 100%!");
      console.log(`📁 เซฟ Session ลงใน: ${SESSION_DIR}`);
      console.log("🍪 พบ sessionid Token เรียบร้อยแล้ว (จะต่ออายุอัตโนมัติ)");
      console.log("====================================================\n");
    } else {
      currentUrl = page.url();
      if (
        !currentUrl.includes("/accounts/login/") &&
        !currentUrl.includes("challenge")
      ) {
        console.log("\n====================================================");
        console.log("✅ เข้าสู่ระบบสำเร็จ (URL ปัจจุบัน:", currentUrl, ")");
        console.log(`📁 เซฟ Session ลงใน: ${SESSION_DIR}`);
        console.log("====================================================\n");
      } else {
        console.warn("\n⚠️ ยังอยู่ในหน้า:", currentUrl);
        const debugPath = path.resolve(process.cwd(), "login-debug.png");
        await page.screenshot({ path: debugPath, fullPage: true }).catch(() => {});
        console.warn(`📸 บันทึกภาพหน้าจอล็อกอินไว้ที่: ${debugPath}`);
        console.warn("แนะนำ: หาก Instagram ป้องกันการล็อกอินผ่านเซิร์ฟเวอร์ ให้เลือกเมนู [2] วาง sessionid cookie โดยตรง");
      }
    }
  } catch (err) {
    console.error("\n❌ เกิดข้อผิดพลาดระหว่างล็อกอิน:", err.message);
    const debugPath = path.resolve(process.cwd(), "login-debug.png");
    await page.screenshot({ path: debugPath, fullPage: true }).catch(() => {});
    console.warn(`📸 บันทึกภาพหน้าจอตรวจสอบไว้ที่: ${debugPath}`);
  } finally {
    await context.close();
  }
}

async function main() {
  console.log("====================================================");
  console.log("🔑 IGOTYOU Scraper: จัดการ Session Instagram บัญชีสำรอง");
  console.log("====================================================\n");
  console.log("เลือกวิธีเข้าสู่ระบบ:");
  console.log("  [1] ล็อกอินอัตโนมัติผ่านเบราว์เซอร์ (Auto-Login)");
  console.log("  [2] วาง sessionid Cookie โดยตรง (แนะนำมากที่สุด! ไว 100% ไม่ติดตรวจจับ)");
  console.log("");

  const choice = await ask("👉 เลือกหมายเลข (1 หรือ 2): ");
  if (choice === "2") {
    console.log("\n💡 วิธีเอา sessionid Cookie ใน 10 วินาที:");
    console.log("   1. เปิดเว็บ instagram.com บนคอมของคุณ (ที่ล็อกอินบัญชีไว้อยู่แล้ว)");
    console.log("   2. กดปุ่ม F12 บนคีย์บอร์ด -> ไปที่แท็บ 'Application' (หรือ Storage)");
    console.log("   3. ในเมนูด้านซ้ายขยาย 'Cookies' -> เลือก 'https://www.instagram.com'");
    console.log("   4. ดับเบิ้ลคลิกคัดลอกค่าในแถว 'sessionid'");
    console.log("   (หรือเปิดแท็บ Console แล้วพิมพ์: document.cookie แล้วคัดลอกค่ามา)\n");

    const cookieVal = await ask("📋 วางค่า sessionid ที่นี่: ");
    if (cookieVal) {
      await handleDirectCookie(cookieVal);
    }
  } else {
    await handleAutoLogin();
  }

  rl.close();
}

main();
