import React, { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Sparkles, Check, Upload, Image as ImageIcon, X, ArrowRight, AtSign, AlertCircle, HelpCircle, Zap, ShieldCheck } from "lucide-react";

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
            ระบุชื่อบัญชี IG หรืออัปโหลดภาพหน้าจอ แล้วให้ AI สรุปตัวตนบนโซเชียลของคุณ
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
          <div className="card-heading flex justify-between items-start mb-3">
            <div>
              <span className="step-label text-purple text-xs font-bold tracking-wider">
                STEP 01 · {activeTab === "username" ? "AUTO-FETCH" : "SCREENSHOT"}
              </span>
              <h2 className="text-xl font-extrabold text-ink mt-1">
                {isTestMode && activeTab === "username" ? "วิเคราะห์สไตล์ IG ทันที" : "ใส่ภาพโปรไฟล์ของคุณ"}
              </h2>
              <p className="text-xs text-muted mt-1 leading-normal">
                {isTestMode && activeTab === "username"
                  ? "ดึงรูปกริดและถอด Color DNA อัตโนมัติ ไม่ต้องแคปหน้าจอ"
                  : "ลากภาพหน้าจอโปรไฟล์ 1-3 ภาพมาวางเพื่อเริ่มต้น"}
              </p>
            </div>
            {(!isTestMode || activeTab === "upload") && (
              <span className="count-pill">{files.length}/3</span>
            )}
          </div>

          {/* Mode Switcher */}
          {isTestMode && (
            <div className="p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/5 flex gap-1 mb-4">
              <button
                type="button"
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "username"
                    ? "bg-white dark:bg-zinc-800 text-ink shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => {
                  setActiveTab("username");
                  onClearScraperAlert?.();
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple fill-purple shrink-0" />
                <span>ค้นหาด้วยชื่อ IG</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple/10 text-purple hidden sm:inline-block">เร็วสุด</span>
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-white dark:bg-zinc-800 text-ink shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
                onClick={() => {
                  setActiveTab("upload");
                  onClearScraperAlert?.();
                }}
              >
                <Upload className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>อัปโหลดภาพหน้าจอ</span>
              </button>
            </div>
          )}

          {/* Tab 1: Username Input (Only when isTestMode && activeTab === "username") */}
          {isTestMode && activeTab === "username" ? (
            <div className="username-panel flex flex-col">
              <div className="relative flex items-center p-1.5 pl-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border-2 border-black/10 dark:border-white/10 focus-within:border-purple focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:shadow-[0_0_0_4px_rgba(142,84,233,0.12)] transition-all gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <AtSign className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider leading-none mb-0.5">
                    Instagram Handle
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      if (scraperAlert) onClearScraperAlert?.();
                    }}
                    placeholder="เช่น igot_chu69, natgeo"
                    className="w-full bg-transparent border-0 outline-none p-0 font-bold text-ink text-sm sm:text-base placeholder:text-muted/40 placeholder:font-normal"
                    disabled={isAnalyzing || isScrapingLoading}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && usernameInput.trim() && !isAnalyzing && !isScrapingLoading) {
                        onAnalyzeScraped?.(usernameInput.trim().replace(/^@/, ""));
                      }
                    }}
                  />
                </div>
                {usernameInput.trim() && (
                  <button
                    type="button"
                    onClick={() => setUsernameInput("")}
                    className="p-1.5 mr-1 text-muted hover:text-ink rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="ล้างข้อความ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dynamic status preview or example chips */}
              {usernameInput.trim() ? (
                <div className="flex items-center justify-between text-xs px-2 pt-2 text-muted">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="font-mono text-ink font-semibold">instagram.com/{usernameInput.trim().replace(/^@/, "")}</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple shrink-0">กด Enter ↵</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-1 pt-2 flex-wrap">
                  <span className="text-[11px] text-muted font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple" />
                    ตัวอย่าง:
                  </span>
                  {["natgeo", "zuck", "design"].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => setUsernameInput(handle)}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-purple/10 hover:text-purple text-ink transition-colors cursor-pointer border border-black/5 dark:border-white/5"
                    >
                      @{handle}
                    </button>
                  ))}
                </div>
              )}

              {/* 3 Value Proposition Feature Cards */}
              <div className="grid grid-cols-3 gap-2 my-3.5 pt-0.5">
                <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                  <Zap className="w-4 h-4 text-purple mb-1 shrink-0" />
                  <span className="text-[11px] font-bold text-ink leading-tight">ดึง 12 รูปจริง</span>
                  <span className="text-[9px] text-muted leading-tight mt-0.5">ไม่ต้องแคปจอ</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                  <Sparkles className="w-4 h-4 text-[#dc2743] mb-1 shrink-0" />
                  <span className="text-[11px] font-bold text-ink leading-tight">Color DNA</span>
                  <span className="text-[9px] text-muted leading-tight mt-0.5">โทนสีพิกเซลจริง</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1 shrink-0" />
                  <span className="text-[11px] font-bold text-ink leading-tight">ปลอดภัย 100%</span>
                  <span className="text-[9px] text-muted leading-tight mt-0.5">ไม่ต้องล็อกอิน</span>
                </div>
              </div>

              {scraperAlert && (
                <div className="p-3 mb-3.5 rounded-xl bg-orange/10 border border-orange/20 text-xs text-ink flex flex-col gap-1.5 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{scraperAlert.message}</span>
                  </div>
                  {scraperAlert.allowFallback && (
                    <button
                      type="button"
                      className="self-start text-xs font-bold text-purple underline hover:text-purple/80 cursor-pointer pl-6"
                      onClick={() => {
                        setActiveTab("upload");
                        onClearScraperAlert?.();
                      }}
                    >
                      สลับไปใช้วิธีอัปโหลดภาพหน้าจอแทน
                    </button>
                  )}
                </div>
              )}

              <button
                className="primary-button cursor-pointer flex items-center justify-center gap-2 mb-2"
                disabled={!usernameInput.trim() || isAnalyzing || isScrapingLoading}
                onClick={() => onAnalyzeScraped?.(usernameInput.trim().replace(/^@/, ""))}
              >
                {isScrapingLoading ? (
                  <>
                    <span className="loader" />
                    <span>กำลังดึงข้อมูล & วิเคราะห์โปรไฟล์...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>สร้างการ์ด Wrapped เลย</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-muted text-[11px] mt-1 justify-center">
                <HelpCircle className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>รองรับบัญชีสาธารณะ (Public Profile) เท่านั้น</span>
              </div>
            </div>
          ) : (
            <>
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
            </>
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
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ font: "700 11px/1.2 Manrope, sans-serif", letterSpacing: "0.14em", color: "var(--purple)", textTransform: "uppercase" }}>
            HOW IT WORKS
          </span>
          <h2 style={{ fontSize: "clamp(30px, 4.5vw, 46px)", margin: "8px 0 0", letterSpacing: "-0.04em" }}>
            3 ขั้นตอนง่ายๆ สู่การ์ด Wrapped ของคุณ
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div style={{ background: "var(--white)", border: "2px solid var(--ink)", borderRadius: "20px", padding: "28px", boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--paper)", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
              01
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>ระบุชื่อ IG หรืออัปโหลดภาพ</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              พิมพ์ชื่อบัญชีเพื่อดึงรูปและโพสต์อัตโนมัติ หรือถ่ายภาพหน้าจอโปรไฟล์ 1 ถึง 3 ภาพเพื่อเริ่มวิเคราะห์
            </p>
          </div>

          <div style={{ background: "var(--white)", border: "2px solid var(--ink)", borderRadius: "20px", padding: "28px", boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--acid)", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
              02
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>AI สกัดโทนสีและ Vibe</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              โมเดลตรวจจับวัตถุตัดเฉพาะรูปโพสต์จริงรายใบ และสกัด Color DNA จากพิกเซลจริง พร้อมให้ AI คิดฉายา Persona ในไม่กี่วินาที
            </p>
          </div>

          <div style={{ background: "var(--white)", border: "2px solid var(--ink)", borderRadius: "20px", padding: "28px", boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--purple)", color: "white", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
              03
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>รับการ์ดแชร์ลง Story</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              ดาวน์โหลดการ์ดอัตราส่วน 9:16 ที่ปรับแต่งได้เพื่อแชร์ลง Instagram Story หรือกดคัดลอก Bio Remix
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
