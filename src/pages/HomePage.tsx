import React, { ChangeEvent, DragEvent, useRef } from "react";
import { Sparkles, Check, Upload, Image as ImageIcon, X, ArrowRight } from "lucide-react";

interface HomePageProps {
  files: File[];
  isDragging: boolean;
  isAnalyzing: boolean;
  onFilesChange: (files: File[]) => void;
  onDragStateChange: (dragging: boolean) => void;
  onAnalyze: () => void;
  onNavigateToHowItWorks: () => void;
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
  onFilesChange,
  onDragStateChange,
  onAnalyze,
  onNavigateToHowItWorks,
}: HomePageProps) {
  const fileInput = useRef<HTMLInputElement>(null);

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

        <div className="upload-card">
          <div className="card-heading flex justify-between items-start mb-5">
            <div>
              <span className="step-label text-purple text-xs font-bold tracking-wider">STEP 01</span>
              <h2 className="text-xl font-extrabold text-ink mt-1">ใส่ภาพโปรไฟล์ของคุณ</h2>
            </div>
            <span className="count-pill">{files.length}/3</span>
          </div>
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
            <div className="file-list">
              {files.map((file, index) => (
                <div className="file-item" key={`${file.name}-${index}`}>
                  <span className="file-icon">
                    <ImageIcon className="w-4 h-4 text-purple" />
                  </span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button
                    aria-label={`ลบ ${file.name}`}
                    className="icon-button hover:text-orange transition-colors"
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

          <p className="consent text-[11px] text-muted text-center mt-3 leading-relaxed">
            เมื่อใช้งานต่อ คุณยืนยันว่าเป็นภาพของคุณหรือได้รับอนุญาตแล้ว · ภาพจะถูกส่งไปประมวลผลชั่วคราวผ่าน Google Gemini Vision API โดยไม่มีการบันทึกภาพลงฐานข้อมูลของระบบ
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
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>แคปหน้าจอโปรไฟล์</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              ถ่ายภาพหน้าจอหน้าไบโอและกริดโพสต์ IG ส่วนตัวของคุณ 1 ถึง 3 ภาพเพื่อความแม่นยำ
            </p>
          </div>

          <div style={{ background: "var(--white)", border: "2px solid var(--ink)", borderRadius: "20px", padding: "28px", boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--acid)", border: "1.5px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px", marginBottom: "16px" }}>
              02
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>AI สกัดโทนสีและ Vibe</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              ระบบประมวลผลดึง Color DNA จากพิกเซลจริง และวิเคราะห์ฉายาประจำโปรไฟล์ของคุณในไม่กี่วินาที
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
