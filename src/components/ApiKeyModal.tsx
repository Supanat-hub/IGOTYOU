import { useState, useEffect } from "react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(() => {
    // Prefer sessionStorage; purge legacy localStorage if present
    const legacy = localStorage.getItem("IGOTYOU_GEMINI_KEY");
    if (legacy) {
      sessionStorage.setItem("IGOTYOU_GEMINI_KEY", legacy);
      localStorage.removeItem("IGOTYOU_GEMINI_KEY");
    }
    return sessionStorage.getItem("IGOTYOU_GEMINI_KEY") || "";
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      sessionStorage.setItem("IGOTYOU_GEMINI_KEY", trimmed);
    } else {
      sessionStorage.removeItem("IGOTYOU_GEMINI_KEY");
    }
    localStorage.removeItem("IGOTYOU_GEMINI_KEY");
    onSaved(trimmed);
    onClose();
  };

  const handleClear = () => {
    sessionStorage.removeItem("IGOTYOU_GEMINI_KEY");
    localStorage.removeItem("IGOTYOU_GEMINI_KEY");
    setApiKey("");
    onSaved("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(23, 23, 17, 0.75)",
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
          background: "var(--white)",
          border: "2px solid var(--ink)",
          borderRadius: "20px",
          width: "min(480px, 100%)",
          padding: "24px",
          boxShadow: "8px 8px 0 var(--ink)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 id="api-key-modal-title" style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
            🔑 ตั้งค่า Google Gemini API Key
          </h3>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่างตั้งค่า API Key"
            style={{
              width: "32px",
              height: "32px",
              border: "1.5px solid var(--ink)",
              borderRadius: "50%",
              background: "var(--paper)",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
          ใส่ Google Gemini API Key เพื่อเปิดใช้งานระบบ Multimodal Vision วิเคราะห์ข้อความในรูปภาพและบริบทไบโอจริง (คีย์จะถูกเก็บไว้ชั่วคราวใน Session ของแท็บนี้เท่านั้น ไม่เก็บลง Disk หรือบันทึกบนเซิร์ฟเวอร์)
        </p>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="gemini-api-key-input" style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "6px", color: "var(--purple)" }}>
            GEMINI API KEY (OPTIONAL)
          </label>
          <input
            id="gemini-api-key-input"
            aria-label="Google Gemini API Key"
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1.5px solid var(--ink)",
              borderRadius: "10px",
              fontFamily: "monospace",
              fontSize: "13px",
              outline: "none",
              background: "#faf8f2",
            }}
          />
          <small style={{ display: "block", marginTop: "6px", color: "var(--muted)", fontSize: "11px" }}>
            *หากไม่ได้ใส่ ระบบจะใช้ Smart Heuristics + Canvas Color Extraction ทำงานได้ 100%
          </small>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          {apiKey && (
            <button
              onClick={handleClear}
              style={{
                background: "transparent",
                border: "1px solid #d9534f",
                color: "#d9534f",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ล้างคีย์
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            style={{
              background: "var(--ink)",
              color: "var(--acid)",
              border: "1.5px solid var(--ink)",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

