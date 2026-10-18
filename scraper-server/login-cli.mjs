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
          // Ctrl+C
          process.exit(1);
        } else if (char === "\b" || char === "\x7f") {
          // Backspace
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

async function runLogin() {
  console.log("====================================================");
  console.log("🔑 IGOTYOU Scraper: เครื่องมือล็อกอิน Instagram บัญชีสำรอง");
  console.log("   (ล็อกอินครั้งเดียว เก็บ Session ถาวรใน ./ig-session/)");
  console.log("====================================================\n");

  const username = await ask("👤 บัญชี IG (Username/Email): ");
  if (!username) {
    console.error("❌ ต้องระบุ Username");
    rl.close();
    process.exit(1);
  }

  const password = await ask("🔒 รหัสผ่าน (Password): ", true);
  if (!password) {
    console.error("❌ ต้องระบุ Password");
    rl.close();
    process.exit(1);
  }

  console.log("\n🚀 กำลังเปิดเบราว์เซอร์ Chromium บนเซิร์ฟเวอร์...");

  const proxyConfig = process.env.WARP_PROXY
    ? { server: process.env.WARP_PROXY }
    : undefined;

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: true,
    viewport: { width: 1280, height: 800 },
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

    await page.waitForTimeout(2000);

    // Dismiss Cookie Banner if present
    const cookieBtn = await page.$(
      'button:has-text("Decline optional cookies"), button:has-text("Allow all cookies"), button:has-text("Allow essential and optional cookies"), button:has-text("Only allow essential cookies"), button:has-text("ปฏิเสธคุกกี้ที่ไม่จำเป็น"), button:has-text("อนุญาตทั้งหมด")'
    );
    if (cookieBtn) {
      console.log("🍪 กำลังกดข้าม Cookie Consent...");
      await cookieBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Wait for username input
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    console.log("✍️ กำลังกรอกข้อมูลบัญชี...");

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

    // Wait 5 seconds to inspect what happens next
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
      
      // Check if there is a "Send Security Code" choice
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
        // Save screenshot for debugging
        const debugPath = path.resolve(process.cwd(), "login-debug.png");
        await page.screenshot({ path: debugPath, fullPage: true }).catch(() => {});
        console.warn(`📸 บันทึกภาพหน้าจอล็อกอินไว้ที่: ${debugPath}`);
        console.warn("อาจเกิดจาก:");
        console.warn("1. รหัสผ่านผิดพลาด หรือ");
        console.warn("2. Instagram ส่งข้อความแจ้งเตือน 'Was this you?' ไปยังแอปมือถือหรือ Email");
        console.warn("   (กรุณาเปิดแอป IG บนมือถือหรือเช็ค Email เพื่อกด 'This Was Me' / 'เป็นฉันเอง')");
      }
    }
  } catch (err) {
    console.error("\n❌ เกิดข้อผิดพลาดระหว่างล็อกอิน:", err.message);
  } finally {
    await context.close();
    rl.close();
  }
}

runLogin();
