import React, { useEffect, useState } from "react";
import { ExternalLink, Copy, Check, Compass, AlertTriangle, X } from "lucide-react";
import { useBodyScrollLock } from "../utils/scrollLock";

export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string;
  isIOS: boolean;
  isAndroid: boolean;
  isLine: boolean;
}

/**
 * Detects common social & messaging In-App Browsers (WebViews)
 * that restrict <a download>, Blob URLs, or ClipboardItem APIs.
 */
export function detectInAppBrowser(uaString?: string): InAppBrowserInfo {
  const ua =
    uaString ?? (typeof navigator !== "undefined" ? navigator.userAgent || "" : "");

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const rules: { pattern: RegExp; name: string }[] = [
    { pattern: /\bInstagram\b/i, name: "Instagram" },
    { pattern: /\bLine\//i, name: "LINE" },
    { pattern: /\bFBAN\b|\bFBAV\b|\bFB_IAB\b/i, name: "Facebook" },
    { pattern: /\bMessenger\b|\bOrca-Android\b/i, name: "Messenger" },
    { pattern: /\bBytedanceWebview\b|\bmusical_ly\b|\bTikTok\b/i, name: "TikTok" },
    { pattern: /\bTwitter\b/i, name: "X (Twitter)" },
    { pattern: /\bMicroMessenger\b/i, name: "WeChat" },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(ua)) {
      return {
        isInApp: true,
        appName: rule.name,
        isIOS,
        isAndroid,
        isLine: rule.name === "LINE",
      };
    }
  }

  return {
    isInApp: false,
    appName: "",
    isIOS,
    isAndroid,
    isLine: false,
  };
}

export default function InAppBrowserModal() {
  const [browserInfo, setBrowserInfo] = useState<InAppBrowserInfo>({
    isInApp: false,
    appName: "",
    isIOS: false,
    isAndroid: false,
    isLine: false,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const info = detectInAppBrowser();
    setBrowserInfo(info);
    if (info.isInApp) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen || !browserInfo.isInApp) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const targetBrowserName = browserInfo.isIOS
    ? "Safari"
    : browserInfo.isAndroid
    ? "Chrome"
    : "เบราว์เซอร์หลัก";

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback textarea copy for restricted WebViews
      const input = document.createElement("textarea");
      input.value = currentUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleOpenExternal = () => {
    if (typeof window === "undefined") return;
    const urlObj = new URL(window.location.href);

    // LINE supports ?openExternalBrowser=1 to automatically launch Safari/Chrome
    if (browserInfo.isLine) {
      urlObj.searchParams.set("openExternalBrowser", "1");
      window.location.href = urlObj.toString();
      return;
    }

    // Android supports intent:// to jump straight out of WebView into Chrome
    if (browserInfo.isAndroid) {
      const cleanUrl = window.location.href.replace(/^https?:\/\//i, "");
      window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // On iOS IG/FB WebViews, copy link & guide user to tap "..." -> Open in external browser
    handleCopyUrl();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inapp-modal-title"
      className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="w-full max-w-[430px] bg-paper border-3 border-ink rounded-3xl p-5 sm:p-6 shadow-[8px_8px_0_var(--ink)] relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          aria-label="ปิดหน้าต่างแจ้งเตือน"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border-2 border-ink flex items-center justify-center text-ink hover:bg-acid transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Top warning badge */}
        <div className="inline-flex items-center gap-1.5 bg-acid border-2 border-ink rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider text-ink mb-3">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>IN-APP BROWSER DETECTED</span>
        </div>

        <h2
          id="inapp-modal-title"
          className="text-xl sm:text-2xl font-extrabold text-ink leading-tight m-0"
        >
          แนะนำให้เปิดใน {targetBrowserName} เพื่อการทำงานที่สมบูรณ์
        </h2>

        <p className="text-xs sm:text-sm text-muted mt-2 mb-4 leading-relaxed">
          คุณกำลังเปิดเว็บผ่านแอป <strong className="text-ink">{browserInfo.appName}</strong>{" "}
          ซึ่งไม่รองรับการบันทึกรูปภาพ
        </p>

        {/* Step-by-step instructions box */}
        <div className="bg-white border-2 border-ink rounded-2xl p-4 mb-4">
          <div className="text-xs font-extrabold text-ink mb-2.5 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-purple shrink-0" />
            <span>วิธีสลับไปเปิดใน {targetBrowserName} :</span>
          </div>
          <ol className="text-xs text-ink/85 space-y-2 pl-4 list-decimal m-0 leading-relaxed">
            <li>
              แตะปุ่มเมนู <strong className="bg-paper px-1.5 py-0.5 rounded border border-ink/30 font-mono">•••</strong>{" "}
              หรือไอคอนแชร์ที่มุมขวาบน/ล่างของหน้าจอ
            </li>
            <li>
              เลือกเมนู{" "}
              <strong className="text-purple font-extrabold">
                &ldquo;เปิดในเบราว์เซอร์เริ่มต้น&rdquo; (Open in External Browser / {targetBrowserName})
              </strong>
            </li>
            <li>หรือกดคัดลอกลิงก์ด้านล่างแล้วนำไปวางใน {targetBrowserName} ได้เลย</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {(browserInfo.isLine || browserInfo.isAndroid) && (
            <button
              onClick={handleOpenExternal}
              className="w-full bg-purple hover:bg-[#6643c7] text-white font-extrabold text-sm py-3 px-4 rounded-2xl border-2 border-ink shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>เปิดใน {targetBrowserName} ทันที</span>
            </button>
          )}

          <button
            onClick={handleCopyUrl}
            className="w-full bg-acid hover:bg-[#c8f22c] text-ink font-extrabold text-sm py-3 px-4 rounded-2xl border-2 border-ink shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>คัดลอกลิงก์แล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 shrink-0" />
                <span>คัดลอกลิงก์เพื่อเปิดใน {targetBrowserName}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-transparent hover:bg-black/5 text-muted hover:text-ink font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer mt-0.5"
          >
            ยืนยันจะใช้งานต่อ
          </button>
        </div>
      </div>
    </div>
  );
}
