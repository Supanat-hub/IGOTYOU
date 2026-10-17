import { useState, useEffect } from "react";
import { AnalysisResult } from "../utils/analysisEngine";
import { useBodyScrollLock } from "../utils/scrollLock";

interface EthicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData?: AnalysisResult["ethicsAudit"];
}

export default function EthicsModal({ isOpen, onClose, auditData }: EthicsModalProps) {
  useBodyScrollLock(isOpen);
  const [activeTab, setActiveTab] = useState<"xai" | "bias" | "privacy">("xai");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const weights = auditData?.weights || {
    colorHarmony: 40,
    composition: 35,
    contrast: 25,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ethics-modal-title"
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
          width: "min(680px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "clamp(18px, 4vw, 28px)",
          boxShadow: "clamp(5px, 2vw, 10px) clamp(5px, 2vw, 10px) 0 var(--ink)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px" }}>
          <div>
            <span style={{ font: "700 11px/1.2 Manrope, sans-serif", letterSpacing: "0.14em", color: "var(--purple)", textTransform: "uppercase" }}>
              HOW IT WORKS · ALGORITHM TRANSPARENCY
            </span>
            <h2 id="ethics-modal-title" style={{ margin: "6px 0 0", fontSize: "clamp(18px, 4.5vw, 24px)", letterSpacing: "-0.03em", lineHeight: 1.25 }}>
              💡 เบื้องหลังการทำงาน & ความโปร่งใสของ AI
            </h2>
          </div>
          <button
            aria-label="ปิดหน้าต่าง"
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              border: "1.5px solid var(--ink)",
              borderRadius: "50%",
              background: "var(--paper)",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: "18px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", borderBottom: "1.5px solid var(--line)", paddingBottom: "10px", overflowX: "auto" }}>
          <button
            onClick={() => setActiveTab("xai")}
            style={{
              padding: "7px clamp(10px, 2.5vw, 16px)",
              borderRadius: "99px",
              border: "1.5px solid var(--ink)",
              background: activeTab === "xai" ? "var(--ink)" : "var(--paper)",
              color: activeTab === "xai" ? "var(--acid)" : "var(--ink)",
              fontWeight: 700,
              fontSize: "clamp(11px, 2.8vw, 13px)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            1. วิธีคำนวณคะแนน
          </button>
          <button
            onClick={() => setActiveTab("bias")}
            style={{
              padding: "7px clamp(10px, 2.5vw, 16px)",
              borderRadius: "99px",
              border: "1.5px solid var(--ink)",
              background: activeTab === "bias" ? "var(--ink)" : "var(--paper)",
              color: activeTab === "bias" ? "var(--acid)" : "var(--ink)",
              fontWeight: 700,
              fontSize: "clamp(11px, 2.8vw, 13px)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            2. ความหลากหลายของภาพ
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            style={{
              padding: "7px clamp(10px, 2.5vw, 16px)",
              borderRadius: "99px",
              border: "1.5px solid var(--ink)",
              background: activeTab === "privacy" ? "var(--ink)" : "var(--paper)",
              color: activeTab === "privacy" ? "var(--acid)" : "var(--ink)",
              fontWeight: 700,
              fontSize: "clamp(11px, 2.8vw, 13px)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            3. นโยบายความเป็นส่วนตัว
          </button>
        </div>

        {/* Tab 1: Scoring Algorithm */}
        {activeTab === "xai" && (
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={{ padding: "16px", background: "#f8f6f0", borderRadius: "14px", border: "1px solid var(--line)" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "var(--ink)" }}>
                🎨 ระบบประเมิน Aesthetic Score อย่างไร?
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>
                เราไม่ใช้ระบบปิดที่ไม่ทราบที่มา แต่แสดงสัดส่วนเกณฑ์ที่ระบบนำมาประเมินความสอดคล้องทางสายตา (Visual Curation) อย่างชัดเจน:
              </p>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ border: "1px solid var(--ink)", borderRadius: "12px", padding: "12px 16px", background: "var(--white)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
                  <span>🎨 Color Harmony & Palette Cohesion</span>
                  <span style={{ color: "var(--purple)" }}>{weights.colorHarmony}%</span>
                </div>
                <div style={{ height: "8px", background: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${weights.colorHarmony}%`, height: "100%", background: "var(--purple)" }} />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  ความกลมกลืนของกลุ่มสีหลัก สุ่มตัวอย่างจากพิกเซลภาพถ่ายจริงที่ตัดแยกรายใบด้วยโมเดลตรวจจับวัตถุ (Client YOLOv11-Nano) โดยไม่เอาสีพื้นหลังแอปมาปน (หรือสกัดจากรูป Avatar โดยตรงหากเป็นโปรไฟล์ที่ยังไม่มีโพสต์)
                </p>
              </div>

              <div style={{ border: "1px solid var(--ink)", borderRadius: "12px", padding: "12px 16px", background: "var(--white)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
                  <span>📐 Composition & Grid Rhythm</span>
                  <span style={{ color: "var(--green)" }}>{weights.composition}%</span>
                </div>
                <div style={{ height: "8px", background: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${weights.composition}%`, height: "100%", background: "var(--green)" }} />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  จังหวะการจัดวางภาพบนฟีด เช่น การสลับภาพมุมกว้าง ภาพวัตถุ และภาพบุคคล
                </p>
              </div>

              <div style={{ border: "1px solid var(--ink)", borderRadius: "12px", padding: "12px 16px", background: "var(--white)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
                  <span>⚖️ Contrast & Visual Balance</span>
                  <span style={{ color: "var(--orange)" }}>{weights.contrast}%</span>
                </div>
                <div style={{ height: "8px", background: "#eee", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${weights.contrast}%`, height: "100%", background: "var(--orange)" }} />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  ความสมดุลระหว่างพื้นที่ว่าง แสง และความคมชัดของภาพ
                </p>
              </div>
            </div>

            <div style={{ background: "#fff5f2", border: "1px solid var(--orange)", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", lineHeight: 1.5 }}>
              💡 <strong>ข้อชี้แจง:</strong> ระบบประเมินเฉพาะคุณสมบัติทางศิลปะของภาพถ่ายเท่านั้น ไม่มีการประเมินใบหน้า รูปลักษณ์ หรือตัวตนบุคคล และจัดทำขึ้นเพื่อความสนุกสนาน
            </div>
          </div>
        )}

        {/* Tab 2: Style Diversity */}
        {activeTab === "bias" && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ background: "#faf8f2", border: "1px solid var(--ink)", borderRadius: "14px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "var(--ink)" }}>
                🌍 ทุกสไตล์มีความสวยงามในแบบของตัวเอง
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                โมเดลคอมพิวเตอร์วิชันในปัจจุบันมักถูกสอนด้วยภาพถ่ายสไตล์มินิมอลหรือเอิร์ธโทนเป็นหลัก แต่ในความเป็นจริง ภาพถ่ายที่มีสีสันจัดจ้าน เช่น ภาพแนวสตรีท ตลาด หรือเทศกาล ล้วนมีเสน่ห์และเอกลักษณ์เฉพาะตัว ระบบของเราจึงมีการปรับชดเชยเพื่อเปิดรับทุกสไตล์
              </p>
            </div>

            <div style={{ background: "#faf8f2", border: "1px solid var(--ink)", borderRadius: "14px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "var(--ink)" }}>
                ☕ ฟีดสวยไม่ได้วัดคุณค่าชีวิตจริง
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                คะแนนคุมโทนเป็นเพียงลูกเล่นสำหรับการจัดหน้าโปรไฟล์ ไม่ได้บ่งบอกถึงความสุขหรือความสำเร็จ ผลลัพธ์นี้สร้างขึ้นเพื่อให้คุณเห็นโปรไฟล์ในมุมมองใหม่ๆ สนุกๆ เท่านั้น
              </p>
            </div>

            <div style={{ background: "#faf8f2", border: "1px solid var(--ink)", borderRadius: "14px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "var(--ink)" }}>
                ✏️ คุณมีสิทธิ์ปรับแต่งผลลัพธ์ได้เสมอ
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                ในหน้าการ์ด Wrapped คุณสามารถกดคลิกเพื่อแก้ไขชื่อหรือฉายาได้ทันทีก่อนบันทึกภาพ เพราะตัวตนของคุณ คุณเป็นผู้กำหนดเองเสมอ
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Privacy */}
        {activeTab === "privacy" && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", background: "#f0f9f3", border: "1px solid var(--green)", borderRadius: "14px", padding: "16px" }}>
              <div style={{ fontSize: "28px" }}>🔒</div>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "var(--green)" }}>
                  รูปของคุณไม่ถูกเก็บไว้ (Zero-Retention)
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                  รูปภาพที่อัปโหลดจะถูกประมวลผลบนเบราว์เซอร์ของคุณโดยตรง (In-Memory) ด้วยโมเดลตรวจจับวัตถุและ Canvas ในเครื่อง และจะถูกเคลียร์ทันทีที่ปิดหน้าเว็บ ไม่มีการจัดเก็บภาพหรือข้อมูลส่วนตัวลงในเซิร์ฟเวอร์
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "14px", background: "#fff8eb", border: "1px solid #d8a16f", borderRadius: "14px", padding: "16px" }}>
              <div style={{ fontSize: "28px" }}>👥</div>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#8a5823" }}>
                  เคารพความเป็นส่วนตัวของผู้ใช้อื่น
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                  โปรดใช้ภาพหน้าจอโปรไฟล์ของตัวคุณเองหรือได้รับอนุญาตแล้ว ไม่นำรูปของผู้อื่นมาแกล้งหรือตัดสินในแง่ลบ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "var(--ink)",
              color: "var(--white)",
              border: 0,
              borderRadius: "10px",
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
