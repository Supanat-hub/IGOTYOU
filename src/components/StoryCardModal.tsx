import { useEffect, useRef, useState } from "react";
import { toPng, toBlob } from "html-to-image";
import { Download, Copy, Check, Sun, Moon, Sparkles } from "lucide-react";
import { AnalysisResult } from "../utils/analysisEngine";

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResult;
}

export default function StoryCardModal({ isOpen, onClose, data }: StoryCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState<"paper" | "noir">("paper");
  const [photoRatio, setPhotoRatio] = useState<"1:1" | "4:3">("1:1");
  const [copiedImage, setCopiedImage] = useState(false);

  const formatSingleLine = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\\n|\r?\n/g, " · ")
      .replace(/\s+·\s+/g, " · ")
      .replace(/·\s*·+/g, "·")
      .trim();
  };

  // Editable fields for user autonomy
  const [customTitle, setCustomTitle] = useState(() => formatSingleLine(data.persona.title));
  const [customHandle, setCustomHandle] = useState(data.username || "@my.profile");

  useEffect(() => {
    setCustomTitle(formatSingleLine(data.persona.title));
    setCustomHandle(data.username || "@my.profile");
  }, [data.persona.title, data.username]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Crisp 1080x1920 native Instagram Story resolution
      });
      const link = document.createElement("a");
      link.download = `igotyou-wrapped-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
      alert("ไม่สามารถบันทึกภาพได้ โปรดลองอีกครั้งหรือถ่ายภาพหน้าจอ");
    } finally {
      setIsExporting(false);
    }
  };

  const copyCardImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        await downloadCard();
      }
    } catch (err) {
      console.warn("Clipboard copy not supported, downloading instead:", err);
      await downloadCard();
    } finally {
      setIsExporting(false);
    }
  };

  const isNoir = theme === "noir";
  const previewImages = data.topContent?.images?.slice(0, 3) || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="บันทึกการ์ด IG Story (9:16)"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(23, 23, 17, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 8px",
        overflowY: "auto",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          maxHeight: "96vh",
          maxWidth: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls: Theme Switcher & Ratio Switcher */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            width: "100%",
            maxWidth: "360px",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setTheme("paper")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 11px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                border: "1.5px solid var(--ink)",
                background: !isNoir ? "var(--acid)" : "rgba(255,255,255,0.15)",
                color: !isNoir ? "var(--ink)" : "white",
                boxShadow: !isNoir ? "2px 2px 0 var(--ink)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Neo-Paper</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("noir")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 11px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                border: "1.5px solid var(--ink)",
                background: isNoir ? "var(--acid)" : "rgba(255,255,255,0.15)",
                color: isNoir ? "var(--ink)" : "white",
                boxShadow: isNoir ? "2px 2px 0 var(--ink)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark Noir</span>
            </button>
          </div>

          {/* Ratio toggle: 1:1 vs 4:3 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              background: "rgba(255,255,255,0.12)",
              padding: "3px 4px",
              borderRadius: "99px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", fontWeight: 700, paddingLeft: "6px" }}>
              สัดส่วนรูป:
            </span>
            <button
              type="button"
              onClick={() => setPhotoRatio("1:1")}
              style={{
                padding: "3px 8px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                border: "none",
                background: photoRatio === "1:1" ? "var(--acid)" : "transparent",
                color: photoRatio === "1:1" ? "var(--ink)" : "white",
                transition: "all 0.15s ease",
              }}
              title="สัดส่วนจัตุรัส 1:1 ตามกริด IG โชว์องค์ประกอบเต็มภาพไม่โดนตัด"
            >
              1:1
            </button>
            <button
              type="button"
              onClick={() => setPhotoRatio("4:3")}
              style={{
                padding: "3px 8px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                border: "none",
                background: photoRatio === "4:3" ? "var(--acid)" : "transparent",
                color: photoRatio === "4:3" ? "var(--ink)" : "white",
                transition: "all 0.15s ease",
              }}
              title="สัดส่วน 4:3"
            >
              4:3
            </button>
          </div>
        </div>

        {/* 9:16 Card Container */}
        <div
          ref={cardRef}
          style={{
            width: "360px",
            height: "640px",
            background: isNoir ? "#171711" : "var(--paper)",
            border: isNoir ? "3px solid #2d2d24" : "3px solid var(--ink)",
            borderRadius: "24px",
            padding: "20px 18px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: isExporting
              ? "none"
              : isNoir
              ? "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 25px rgba(217, 255, 67, 0.08)"
              : "0 24px 48px -12px rgba(0, 0, 0, 0.45), 4px 4px 0 var(--ink)",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            fontFamily: '"IBM Plex Sans Thai", sans-serif',
            color: isNoir ? "#fdfbf7" : "var(--ink)",
            transition: "background 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          {/* Top Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: isNoir ? "var(--acid)" : "var(--ink)",
                  color: isNoir ? "var(--ink)" : "var(--acid)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                ✦
              </span>
              <span
                style={{
                  font: "800 16px/1 Manrope, sans-serif",
                  letterSpacing: "-0.04em",
                  color: isNoir ? "#fdfbf7" : "var(--ink)",
                }}
              >
                IGOTYOU WRAPPED
              </span>
            </div>
            <span
              style={{
                background: "var(--acid)",
                color: "var(--ink)",
                border: "1.5px solid var(--ink)",
                borderRadius: "99px",
                padding: "4px 10px",
                fontSize: "10px",
                fontWeight: 800,
                fontFamily: "Manrope, sans-serif",
                letterSpacing: "0.02em",
                boxShadow: "2px 2px 0 var(--ink)",
              }}
            >
              2026 EDITION
            </span>
          </div>

          {/* Persona Hero Section - Single Line Compact Layout */}
          <div style={{ zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: isNoir ? "var(--acid)" : "var(--purple)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                PROFILE PERSONA
              </span>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setCustomHandle(e.currentTarget.innerText || "")}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isNoir ? "rgba(255,255,255,0.7)" : "var(--muted)",
                  letterSpacing: "-0.01em",
                  outline: "none",
                  cursor: "text",
                  textAlign: "right",
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title="คลิกเพื่อแก้ไขชื่อบัญชี IG"
              >
                {customHandle}
              </div>
            </div>

            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setCustomTitle(formatSingleLine(e.currentTarget.innerText || ""))}
              style={{
                display: "block",
                width: "100%",
                fontSize:
                  customTitle.length > 26
                    ? "17px"
                    : customTitle.length > 20
                    ? "18px"
                    : customTitle.length > 15
                    ? "20px"
                    : "22px",
                fontWeight: 800,
                color: isNoir ? "#ffffff" : "var(--ink)",
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
                outline: "none",
                fontFamily: '"IBM Plex Sans Thai", sans-serif',
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                margin: "4px 0 6px",
                cursor: "text",
              }}
              title="คลิกเพื่อแก้ไขฉายา (แสดงผลบรรทัดเดียว)"
            >
              {customTitle}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {data.persona.tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    border: isNoir ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid var(--ink)",
                    borderRadius: "99px",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: isNoir ? "#23231b" : "var(--white)",
                    color: isNoir ? "#fdfbf7" : "var(--ink)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Mini Photo Strip (Real uploaded photos) */}
          {previewImages.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${previewImages.length}, 1fr)`,
                gap: "8px",
                zIndex: 1,
              }}
            >
              {previewImages.map((img, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: photoRatio === "1:1" ? "1 / 1" : "4 / 3",
                    width: "100%",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: isNoir ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid var(--ink)",
                    boxShadow: isNoir ? "2px 2px 0 rgba(0,0,0,0.4)" : "2px 2px 0 var(--ink)",
                    background: isNoir ? "#202018" : "#f0ede6",
                    transition: "aspect-ratio 0.2s ease",
                  }}
                >
                  <img
                    src={img}
                    alt={`IG Feed photo ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Aesthetic Score & Color DNA Showcase Panel */}
          <div
            style={{
              background: isNoir ? "#202018" : "var(--white)",
              border: isNoir ? "2px solid rgba(255,255,255,0.18)" : "2px solid var(--ink)",
              borderRadius: "16px",
              padding: "11px 13px",
              boxShadow: isNoir ? "3px 3px 0 rgba(0,0,0,0.5)" : "3px 3px 0 var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              zIndex: 1,
            }}
          >
            {/* Aesthetic Score Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    color: isNoir ? "var(--acid)" : "var(--purple)",
                    letterSpacing: "0.08em",
                  }}
                >
                  AESTHETIC AUDIT
                </span>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: isNoir ? "#fdfbf7" : "var(--ink)",
                    marginTop: "1px",
                  }}
                >
                  {data.aestheticScore.verdict || "คุมโทนเก่งมาก!"}
                </div>
              </div>
              <div
                style={{
                  background: "var(--acid)",
                  color: "var(--ink)",
                  border: "1.5px solid var(--ink)",
                  borderRadius: "99px",
                  padding: "2px 9px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "2px",
                  boxShadow: "1.5px 1.5px 0 var(--ink)",
                }}
              >
                <span style={{ font: "800 17px/1 Manrope, sans-serif" }}>
                  {data.aestheticScore.score}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700 }}>/100</span>
              </div>
            </div>

            {/* Color DNA Swatches */}
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  height: "26px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: isNoir ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid var(--ink)",
                }}
              >
                {data.colorDNA.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ background: c.hex }} title={c.name} />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "9px",
                  color: isNoir ? "rgba(255,255,255,0.6)" : "var(--muted)",
                  fontWeight: 700,
                  marginTop: "4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {data.colorDNA.slice(0, 4).map((c) => c.name).join(" · ")}
              </div>
            </div>
          </div>

          {/* Bio Remix Quote */}
          <div
            style={{
              background: isNoir ? "#183324" : "var(--purple)",
              color: "white",
              border: isNoir ? "2px solid rgba(255,255,255,0.2)" : "2px solid var(--ink)",
              borderRadius: "16px",
              padding: "11px 13px",
              boxShadow: isNoir ? "3px 3px 0 rgba(0,0,0,0.5)" : "3px 3px 0 var(--ink)",
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: "9px",
                opacity: 0.9,
                letterSpacing: "0.1em",
                fontWeight: 800,
                color: isNoir ? "var(--acid)" : "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>BIO REMIX</span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, margin: "3px 0 2px", lineHeight: 1.3 }}>
              "{data.bioRemix.text}"
            </div>
            <div style={{ fontSize: "10px", opacity: 0.8, lineHeight: 1.25 }}>
              {data.bioRemix.subtext}
            </div>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: isNoir ? "#202018" : "var(--white)",
                border: isNoir ? "1.5px solid rgba(255,255,255,0.18)" : "1.5px solid var(--ink)",
                borderRadius: "12px",
                padding: "7px 10px",
                textAlign: "center",
                boxShadow: isNoir ? "2px 2px 0 rgba(0,0,0,0.4)" : "2px 2px 0 var(--ink)",
              }}
            >
              <div
                style={{
                  font: "800 15px/1 Manrope, sans-serif",
                  color: isNoir ? "#fdfbf7" : "var(--ink)",
                }}
              >
                {data.stats.followerRatio}
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: isNoir ? "rgba(255,255,255,0.6)" : "var(--muted)",
                  fontWeight: 700,
                  marginTop: "2px",
                  textTransform: "uppercase",
                }}
              >
                Follower Ratio
              </div>
            </div>
            <div
              style={{
                background: isNoir ? "#202018" : "var(--white)",
                border: isNoir ? "1.5px solid rgba(255,255,255,0.18)" : "1.5px solid var(--ink)",
                borderRadius: "12px",
                padding: "7px 10px",
                textAlign: "center",
                boxShadow: isNoir ? "2px 2px 0 rgba(0,0,0,0.4)" : "2px 2px 0 var(--ink)",
              }}
            >
              <div
                style={{
                  font: "800 15px/1 Manrope, sans-serif",
                  color: isNoir ? "#fdfbf7" : "var(--ink)",
                }}
              >
                {data.stats.postDensity}
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: isNoir ? "rgba(255,255,255,0.6)" : "var(--muted)",
                  fontWeight: 700,
                  marginTop: "2px",
                  textTransform: "uppercase",
                }}
              >
                Posts Analyzed
              </div>
            </div>
          </div>

          {/* Footer Card Notice */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "9px",
              color: isNoir ? "rgba(255,255,255,0.5)" : "var(--muted)",
              borderTop: isNoir ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--line)",
              paddingTop: "8px",
              fontWeight: 600,
              zIndex: 1,
            }}
          >
            <span>NO DATA STORED</span>
            <span
              style={{
                fontWeight: 800,
                color: isNoir ? "var(--acid)" : "var(--ink)",
                letterSpacing: "0.05em",
              }}
            >
              igotyou.app
            </span>
            <span>#IGOTYOU</span>
          </div>
        </div>

        {/* Action Buttons Below the Card */}
        <div style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "360px" }}>
          <button
            type="button"
            onClick={downloadCard}
            disabled={isExporting}
            style={{
              flex: 1,
              background: "var(--acid)",
              color: "var(--ink)",
              border: "2px solid var(--ink)",
              borderRadius: "12px",
              padding: "11px 14px",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "3px 3px 0 var(--ink)",
              transition: "all 0.15s ease",
            }}
          >
            <Download className="w-4 h-4 text-ink" />
            <span>{isExporting ? "กำลังสร้างภาพ..." : "บันทึกภาพ IG Story"}</span>
          </button>
          <button
            type="button"
            onClick={copyCardImage}
            disabled={isExporting}
            style={{
              background: "var(--white)",
              color: "var(--ink)",
              border: "2px solid var(--ink)",
              borderRadius: "12px",
              padding: "11px 14px",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "3px 3px 0 var(--ink)",
              transition: "all 0.15s ease",
            }}
            title="คัดลอกรูปภาพลง Clipboard เพื่อนำไปแปะใน Story ทันที"
          >
            {copiedImage ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4 text-ink" />}
            <span>{copiedImage ? "คัดลอกแล้ว!" : "คัดลอกรูป"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "2px solid rgba(255,255,255,0.4)",
              borderRadius: "12px",
              padding: "11px 14px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
