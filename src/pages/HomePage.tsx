import React, { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Sparkles, Check, Upload, Image as ImageIcon, X, ArrowRight, AlertCircle, HelpCircle } from "lucide-react";
import { extractInstagramUsername } from "../utils/analysisEngine";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface HomePageProps {
  files: File[];
  isDragging: boolean;
  isAnalyzing: boolean;
  isTestMode?: boolean;
  onFilesChange: (files: File[]) => void;
  onDragStateChange: (dragging: boolean) => void;
  onAnalyze: () => void;
  onAnalyzeScraped?: (username: string) => void;
  onNavigateToHowItWorks: () => void;
  isScrapingLoading?: boolean;
  scraperAlert?: { message: string; allowFallback: boolean } | null;
  onClearScraperAlert?: () => void;
}

const MARQUEE_ITEMS = [
  "PROFILE VIBE",
  "COLOR DNA",
  "GRID MOOD",
  "BIO REMIX",
  "AESTHETIC SCORE",
  "SPOTIFY-WRAPPED VIBE",
  "9:16 STORY CARD",
  "COMPOSITION AUDIT",
  "HONEST CRITIQUE",
];

export default function HomePage({
  files,
  isDragging,
  isAnalyzing,
  isTestMode = true,
  onFilesChange,
  onDragStateChange,
  onAnalyze,
  onAnalyzeScraped,
  onNavigateToHowItWorks,
  isScrapingLoading = false,
  scraperAlert = null,
  onClearScraperAlert,
}: HomePageProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"username" | "upload">("username");
  const [usernameInput, setUsernameInput] = useState("");

  const addFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter((file) => file.type.startsWith("image/"));
    onFilesChange([...files, ...imageFiles].slice(0, 3));
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragStateChange(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <>
      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow flex items-center gap-2 text-purple font-bold">
            <Sparkles className="w-3.5 h-3.5 fill-purple text-purple" />
            <span>YOUR PROFILE, UNWRAPPED</span>
          </div>
          <h1 className="text-ink font-extrabold">
            ไบโอของคุณ<br />
            บอกอะไรได้บ้าง?
          </h1>
          <p className="hero-lead text-muted text-lg">
            อัปโหลดภาพโปรไฟล์ แล้วให้ AI สรุปตัวตนบนโซเชียลของคุณ
            เป็นการ์ด Wrapped สนุกๆ ในไม่กี่วินาที
          </p>
          <div className="benefit-row">
            <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
              <Check className="w-4 h-4 text-purple stroke-[2.5]" />
              อ่านไบโอ & ตัวเลข
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
              <Check className="w-4 h-4 text-purple stroke-[2.5]" />
              วิเคราะห์โทนสีจริง
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
              <Check className="w-4 h-4 text-purple stroke-[2.5]" />
              สร้างการ์ด 9:16
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
              <Check className="w-4 h-4 text-purple stroke-[2.5]" />
              ปลอดภัย ไม่เก็บรูป
            </span>
          </div>
        </div>

        <div className="upload-card min-w-0 max-w-full overflow-hidden">
          <div className="card-heading flex justify-between items-start mb-4">
            <div>
              <span className="step-label text-purple text-xs font-bold tracking-wider">STEP 01</span>
              <h2 className="text-xl font-extrabold text-ink mt-1">
                {isTestMode && activeTab === "username" ? "ระบุชื่อโปรไฟล์ Instagram" : "ใส่ภาพโปรไฟล์ของคุณ"}
              </h2>
            </div>
            {(!isTestMode || activeTab === "upload") && (
              <span className="count-pill">{files.length}/3</span>
            )}
          </div>

          {/* Test Mode Smooth Segmented Tab Switcher with Sliding Indicator */}
          {isTestMode && (
            <div className="relative flex p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl mb-4 border border-black/5 dark:border-white/5 select-none overflow-hidden">
              {/* Smooth Gliding Pill Indicator */}
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                style={{
                  left: "4px",
                  transform: activeTab === "username" ? "translateX(0)" : "translateX(100%)",
                }}
              />

              <button
                type="button"
                className={`relative z-10 flex-1 py-2 px-3 font-bold text-xs sm:text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "username"
                    ? "text-ink"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => {
                  setActiveTab("username");
                  onClearScraperAlert?.();
                }}
              >
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>ชื่อบัญชี / Url</span>
              </button>
              <button
                type="button"
                className={`relative z-10 flex-1 py-2 px-3 font-bold text-xs sm:text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "upload"
                    ? "text-ink"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => {
                  setActiveTab("upload");
                  onClearScraperAlert?.();
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลดภาพ</span>
              </button>
            </div>
          )}

          {/* Tab 1: Username Input (Only when isTestMode && activeTab === "username") */}
          {isTestMode && activeTab === "username" ? (
            <div key="username-panel" className="username-panel flex flex-col tab-pane-animate">
              <div className="relative flex items-center mb-3">
                <span className="absolute left-3.5 text-muted flex items-center justify-center select-none pointer-events-none">
                  <InstagramIcon className="w-4 h-4 text-muted" />
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    if (scraperAlert) onClearScraperAlert?.();
                  }}
                  placeholder="ชื่อบัญชี หรือ ลิงก์ IG (เช่น instagram.com/name)"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 focus:outline-none focus:border-purple font-semibold text-ink text-sm sm:text-base transition-colors"
                  disabled={isAnalyzing || isScrapingLoading}
                  onKeyDown={(e) => {
                    const clean = extractInstagramUsername(usernameInput);
                    if (e.key === "Enter" && clean && !isAnalyzing && !isScrapingLoading) {
                      onAnalyzeScraped?.(clean);
                    }
                  }}
                />
              </div>

              {scraperAlert && (
                <div className="p-3.5 mb-3.5 rounded-xl bg-orange/10 border border-orange/30 text-xs text-ink flex flex-col gap-2 animate-fadeIn shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-semibold">{scraperAlert.message}</span>
                  </div>
                  {scraperAlert.allowFallback && (
                    <button
                      type="button"
                      className="self-start text-xs font-bold text-purple hover:text-purple/80 cursor-pointer pl-6 inline-flex items-center gap-1 underline underline-offset-2"
                      onClick={() => {
                        setActiveTab("upload");
                        onClearScraperAlert?.();
                      }}
                    >
                      <span>👉 สลับไปใช้วิธีอัปโหลดภาพแทน (รองรับบัญชี Private 100%)</span>
                    </button>
                  )}
                </div>
              )}

              <button
                className="primary-button cursor-pointer flex items-center justify-center gap-2 mb-1"
                disabled={!extractInstagramUsername(usernameInput) || isAnalyzing || isScrapingLoading}
                onClick={() => {
                  const clean = extractInstagramUsername(usernameInput);
                  if (clean) onAnalyzeScraped?.(clean);
                }}
              >
                {isScrapingLoading ? (
                  <>
                    <span className="loader" />
                    <span>กำลังดึงข้อมูลจาก Instagram...</span>
                  </>
                ) : (
                  <>
                    <span>วิเคราะห์โปรไฟล์</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-muted text-[11px] mt-2 justify-center">
                <HelpCircle className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>รองรับบัญชีสาธารณะ (Public Profile) เท่านั้น</span>
              </div>
            </div>
          ) : (
            <div key="upload-panel" className="tab-pane-animate">
              <div
                className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
                onClick={() => fileInput.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  onDragStateChange(true);
                }}
                onDragLeave={() => onDragStateChange(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => event.key === "Enter" && fileInput.current?.click()}
              >
                <input
                  ref={fileInput}
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  multiple
                  onChange={handleFiles}
                  type="file"
                  aria-label="อัปโหลดภาพหน้าจอ Instagram (สูงสุด 3 ภาพ)"
                />
                <span className="upload-icon flex items-center justify-center">
                  <Upload className="w-6 h-6 text-ink" />
                </span>
                <strong className="text-base text-ink">ลากรูปมาวาง หรือคลิกเพื่อเลือก</strong>
                <span className="text-muted text-sm mt-1">หน้าไบโอ · กริดโพสต์ · ไฮไลต์</span>
                <small className="text-xs text-ink font-semibold mt-4">JPG, PNG หรือ WEBP · สูงสุด 3 ภาพ</small>
              </div>

              {files.length > 0 && (
                <div className="file-list min-w-0 max-w-full overflow-hidden">
                  {files.map((file, index) => (
                    <div className="file-item min-w-0 max-w-full overflow-hidden flex items-center gap-2" key={`${file.name}-${index}`}>
                      <span className="file-icon shrink-0">
                        <ImageIcon className="w-4 h-4 text-purple" />
                      </span>
                      <span className="file-name min-w-0 flex-1 truncate text-xs sm:text-sm font-semibold">{file.name}</span>
                      <span className="file-size shrink-0 text-[11px] text-muted whitespace-nowrap">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button
                        aria-label={`ลบ ${file.name}`}
                        className="icon-button shrink-0 hover:text-orange transition-colors"
                        onClick={() => onFilesChange(files.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="primary-button cursor-pointer flex items-center justify-center gap-2"
                disabled={isAnalyzing}
                onClick={onAnalyze}
              >
                {isAnalyzing ? (
                  <>
                    <span className="loader" />
                    <span>กำลังประมวลผลโทนสีและ Vibe...</span>
                  </>
                ) : (
                  <>
                    <span>{files.length ? "วิเคราะห์โปรไฟล์ของฉัน" : "เลือกภาพเพื่อเริ่มต้น"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          <p className="consent text-[11px] text-muted text-center mt-3 leading-relaxed">
            เมื่อใช้งานต่อ คุณยืนยันว่าเป็นภาพของคุณหรือได้รับอนุญาตแล้ว · ประมวลผลชั่วคราวอย่างปลอดภัยบนเบราว์เซอร์และ Google Gemini Vision โดยไม่มีการบันทึกภาพลงฐานข้อมูลของระบบ
          </p>
        </div>
      </section>

      <section className="marquee-banner" aria-label="คุณสมบัติเด่นของ IGOTYOU">
        <div className="marquee-wrapper">
          <div className="marquee-track" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, idx) => (
              <span key={`t1-${idx}`} className="marquee-item">
                <span className="marquee-text">{item}</span>
                <span className="marquee-star">✦</span>
              </span>
            ))}
          </div>
          <div className="marquee-track" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, idx) => (
              <span key={`t2-${idx}`} className="marquee-item">
                <span className="marquee-text">{item}</span>
                <span className="marquee-star">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Step Feature Highlights */}
      <section className="shell" style={{ paddingBlock: "80px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }} className="scroll-reveal-item">
          <span style={{ font: "700 11px/1.2 Manrope, sans-serif", letterSpacing: "0.14em", color: "var(--purple)", textTransform: "uppercase" }}>
            HOW IT WORKS
          </span>
          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", margin: "8px 0 0", letterSpacing: "-0.04em" }}>
            3 ขั้นตอนง่ายๆ สู่การ์ด Wrapped ของคุณ
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div className="scroll-reveal-item scroll-reveal-stagger-1" style={{ background: "var(--white)", border: "2px solid var(--ink)", borderRadius: "20px", padding: "28px", boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--paper)", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
              01
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>แคปหน้าจอ หรือใส่ชื่อโปรไฟล์</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              ถ่ายภาพหน้าจอโปรไฟล์ IG ให้เห็นชื่อบัญชีและรูปโพสต์ หรือกรอกชื่อ @handle (รองรับทั้งมือถือ แท็บเล็ต บัญชี Private หรือคนที่มีรูปน้อย)
            </p>
          </div>

          <div className="scroll-reveal-item scroll-reveal-stagger-2" style={{ background: "var(--white)", border: "2px solid var(--ink)", borderRadius: "20px", padding: "28px", boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--acid)", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
              02
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>AI สกัด Color DNA & วิเคราะห์ Vibe</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              ระบบตัดเฉพาะรูปโพสต์จริงรายใบเพื่อสกัดชุดสี Color DNA จากพิกเซล ประเมินคะแนน Aesthetic ฟีด และให้ AI คิดฉายา Persona ในไม่กี่วินาที
            </p>
          </div>

          <div className="scroll-reveal-item scroll-reveal-stagger-3" style={{ background: "var(--white)", border: "2px solid var(--ink)", borderRadius: "20px", padding: "28px", boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--purple)", color: "white", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
              03
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>เปิดดู Wrapped & แชร์ลง IG Story</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              สัมผัสประสบการณ์แบบ Spotify Story Player เลื่อนดูทีละหน้า หรือบันทึกการ์ด 9:16 สุดชิค ปรับแต่งรูปและข้อความได้อิสระก่อนแชร์อวดเพื่อน
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={onNavigateToHowItWorks}
            className="inline-flex items-center gap-2 bg-transparent border-1.5 border-ink rounded-full px-5 py-2.5 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
          >
            <span>อ่านวิธีที่ AI คำนวณคะแนน & ความโปร่งใสเพิ่มเติม</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </>
  );
}
