import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { AnalysisResult } from "../utils/analysisEngine";

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResult;
}

export default function StoryCardModal({ isOpen, onClose, data }: StoryCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Editable fields for user autonomy
  const [customTitle, setCustomTitle] = useState(data.persona.title);
  const [customHandle, setCustomHandle] = useState(data.username || "@my.profile");

  useEffect(() => {
    setCustomTitle(data.persona.title);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="บันทึกการ์ด IG Story (9:16)"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(23, 23, 17, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          maxHeight: "96vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 9:16 Card Container */}
        <div
          ref={cardRef}
          style={{
            width: "360px",
            height: "640px",
            background: "var(--paper)",
            border: "3px solid var(--ink)",
            borderRadius: "24px",
            padding: "22px 20px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "10px 10px 0 var(--ink)",
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            fontFamily: '"IBM Plex Sans Thai", sans-serif',
            color: "var(--ink)",
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
                  background: "var(--ink)",
                  color: "var(--acid)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                ✦
              </span>
              <span style={{ font: "800 16px/1 Manrope, sans-serif", letterSpacing: "-0.04em", color: "var(--ink)" }}>
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

          {/* Persona Hero Section */}
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", letterSpacing: "-0.01em" }}>
              {customHandle}
            </div>
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--purple)", letterSpacing: "0.1em" }}>
                YOUR PROFILE PERSONA
              </span>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setCustomTitle(e.currentTarget.innerText || "")}
                style={{
                  display: "block",
                  width: "100%",
                  fontSize: customTitle.length > 24 ? "20px" : customTitle.length > 16 ? "22px" : "25px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.18,
                  outline: "none",
                  fontFamily: '"IBM Plex Sans Thai", sans-serif',
                  wordBreak: "break-word",
                  whiteSpace: "pre-line",
                  margin: "3px 0 6px",
                  cursor: "text",
                }}
                title="คลิกเพื่อแก้ไขฉายา"
              >
                {customTitle}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {data.persona.tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    border: "1.5px solid var(--ink)",
                    borderRadius: "99px",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "var(--white)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Unified Aesthetic Score & Color DNA Showcase Panel */}
          <div
            style={{
              background: "var(--white)",
              border: "2px solid var(--ink)",
              borderRadius: "18px",
              padding: "12px 14px",
              boxShadow: "3px 3px 0 var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              zIndex: 1,
            }}
          >
            {/* Aesthetic Score Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--purple)", letterSpacing: "0.08em" }}>
                  AESTHETIC AUDIT
                </span>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)", marginTop: "1px" }}>
                  {data.aestheticScore.verdict || "คุมโทนเก่งมาก!"}
                </div>
              </div>
              <div
                style={{
                  background: "var(--acid)",
                  border: "1.5px solid var(--ink)",
                  borderRadius: "99px",
                  padding: "3px 10px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "2px",
                  boxShadow: "1.5px 1.5px 0 var(--ink)",
                }}
              >
                <span style={{ font: "800 18px/1 Manrope, sans-serif" }}>
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
                  height: "28px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1.5px solid var(--ink)",
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
                  color: "var(--muted)",
                  fontWeight: 700,
                  marginTop: "5px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {Array.from(new Set(data.colorDNA.map((c) => c.name))).slice(0, 3).join(" · ")}
              </div>
            </div>
          </div>

          {/* Bio Remix Quote */}
          <div
            style={{
              background: "var(--purple)",
              color: "white",
              border: "2px solid var(--ink)",
              borderRadius: "18px",
              padding: "13px 15px",
              boxShadow: "3px 3px 0 var(--ink)",
              zIndex: 1,
            }}
          >
            <div style={{ fontSize: "10px", opacity: 0.85, letterSpacing: "0.1em", fontWeight: 800 }}>
              BIO REMIX
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, margin: "3px 0 2px", lineHeight: 1.35 }}>
              "{data.bioRemix.text}"
            </div>
            <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: 1.3 }}>
              {data.bioRemix.subtext}
            </div>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              zIndex: 1,
            }}
          >
            <div
              style={{
                background: "var(--white)",
                border: "1.5px solid var(--ink)",
                borderRadius: "12px",
                padding: "8px 12px",
                textAlign: "center",
                boxShadow: "2px 2px 0 var(--ink)",
              }}
            >
              <div style={{ font: "800 16px/1 Manrope, sans-serif" }}>{data.stats.followerRatio}</div>
              <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 700, marginTop: "2px", textTransform: "uppercase" }}>
                Follower Ratio
              </div>
            </div>
            <div
              style={{
                background: "var(--white)",
                border: "1.5px solid var(--ink)",
                borderRadius: "12px",
                padding: "8px 12px",
                textAlign: "center",
                boxShadow: "2px 2px 0 var(--ink)",
              }}
            >
              <div style={{ font: "800 16px/1 Manrope, sans-serif" }}>{data.stats.postDensity}</div>
              <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 700, marginTop: "2px", textTransform: "uppercase" }}>
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
              color: "var(--muted)",
              borderTop: "1px solid var(--line)",
              paddingTop: "10px",
              fontWeight: 600,
              zIndex: 1,
            }}
          >
            <span>NO DATA STORED</span>
            <span style={{ fontWeight: 800, color: "var(--ink)", letterSpacing: "0.05em" }}>igotyou.app</span>
            <span>#IGOTYOU</span>
          </div>
        </div>

        {/* Action Buttons Below the Card */}
        <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "360px" }}>
          <button
            onClick={downloadCard}
            disabled={isExporting}
            style={{
              flex: 1,
              background: "var(--ink)",
              color: "var(--acid)",
              border: "2px solid var(--ink)",
              borderRadius: "12px",
              padding: "12px",
              fontWeight: 800,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "4px 4px 0 var(--ink)",
            }}
          >
            <Download className="w-4 h-4 text-acid" />
            <span>{isExporting ? "กำลังสร้างภาพ..." : "บันทึกการ์ด Story (PNG)"}</span>
          </button>
          <button
            onClick={onClose}
            style={{
              background: "var(--white)",
              color: "var(--ink)",
              border: "2px solid var(--ink)",
              borderRadius: "12px",
              padding: "12px 18px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "4px 4px 0 var(--ink)",
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

