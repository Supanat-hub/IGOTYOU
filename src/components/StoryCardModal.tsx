import { useEffect, useRef, useState } from "react";
import { toCanvas } from "html-to-image";
import { Download, Copy, Check, Sun, Moon, Sparkles } from "lucide-react";
import { AnalysisResult } from "../utils/analysisEngine";
import { detectInAppBrowser } from "./InAppBrowserModal";
import { useBodyScrollLock } from "../utils/scrollLock";

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResult;
}

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}

export default function StoryCardModal({ isOpen, onClose, data }: StoryCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState<"paper" | "noir">("paper");
  const [photoRatio, setPhotoRatio] = useState<"3:4" | "1:1">("3:4");
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

  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const calculateScale = () => {
      // Allow at least 20px horizontal margin each side (40px total)
      const availW = window.innerWidth - 40;
      // Top controls (~44px) + 2-tier action buttons (~116px) + vertical gaps & safe areas (~50px)
      const availH = window.innerHeight - 210;

      const scaleW = availW / 360;
      const scaleH = availH / 640;

      const targetScale = Math.min(1, Math.min(scaleW, scaleH));
      // Clamp between 0.65 and 1.0 (crisp on mobile, doesn't over-stretch on desktop)
      setScale(Math.max(0.65, Math.min(1, targetScale)));
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background page scroll on mobile and desktop
  useBodyScrollLock(isOpen);

  if (!isOpen || data.isValidProfile === false) return null;

  const isNoir = theme === "noir";
  const previewImages = data.topContent?.images?.slice(0, 3) || [];

  /**
   * Renders the Story Card into a crisp 1080x1920 (or 900x1600) Blob:
   * 1. Renders DOM typography & layout via html-to-image with cacheBust: false.
   * 2. Directly composites the 3 real feed photos onto the Canvas 2D context
   *    to completely bypass iOS WebKit's <foreignObject> black-image decode bug.
   */
  const renderCardBlob = async (pixelRatio = 3): Promise<Blob> => {
    const cardEl = cardRef.current;
    if (!cardEl) throw new Error("Card element not mounted");

    // Measure photo slot positions in unscaled 360x640 card space before export
    const cardRect = cardEl.getBoundingClientRect();
    const scaleX = cardRect.width / 360 || 1;
    const scaleY = cardRect.height / 640 || 1;

    const slotEls = Array.from(
      cardEl.querySelectorAll<HTMLElement>("[data-story-photo-slot]")
    );
    const slotRects = slotEls.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: (r.left - cardRect.left) / scaleX,
        y: (r.top - cardRect.top) / scaleY,
        w: r.width / scaleX,
        h: r.height / scaleY,
      };
    });

    // Pre-decode all preview images in parallel
    const decodedPhotos = await Promise.all(
      previewImages.map((src) => loadImageElement(src).catch(() => null))
    );

    const baseCanvas = await toCanvas(cardEl, {
      cacheBust: false,
      pixelRatio,
      width: 360,
      height: 640,
      backgroundColor: isNoir ? "#171711" : "#f4f0e6",
    });

    const outW = 360 * pixelRatio;
    const outH = 640 * pixelRatio;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = outW;
    finalCanvas.height = outH;
    const ctx = finalCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // Fill clean background so outer corners never bleed black
    ctx.fillStyle = isNoir ? "#171711" : "#f4f0e6";
    ctx.fillRect(0, 0, outW, outH);

    // Draw base card layout & typography
    ctx.drawImage(baseCanvas, 0, 0, outW, outH);

    // Directly paint each photo on the 2D canvas (100% immune to iOS foreignObject black-box bug)
    for (let i = 0; i < slotRects.length; i++) {
      const photoImg = decodedPhotos[i];
      const slot = slotRects[i];
      if (!photoImg || !slot) continue;

      const sxBox = slot.x * pixelRatio;
      const syBox = slot.y * pixelRatio;
      const swBox = slot.w * pixelRatio;
      const shBox = slot.h * pixelRatio;
      const outerRadius = 10 * pixelRatio;

      // 1. Draw Neo-Brutalist frame base (2px top/left, 4px right/bottom)
      ctx.save();
      traceRoundedRect(ctx, sxBox, syBox, swBox, shBox, outerRadius);
      ctx.fillStyle = isNoir ? "rgba(0, 0, 0, 0.65)" : "#171711";
      ctx.fill();
      ctx.restore();

      const bTop = 2 * pixelRatio;
      const bLeft = 2 * pixelRatio;
      const bRight = 4 * pixelRatio;
      const bBottom = 4 * pixelRatio;

      const ix = sxBox + bLeft;
      const iy = syBox + bTop;
      const iw = Math.max(1, swBox - bLeft - bRight);
      const ih = Math.max(1, shBox - bTop - bBottom);
      const innerRadius = Math.max(2, 8 * pixelRatio);

      // 2. Clip inner photo area and paint high-res photo with object-fit: cover
      ctx.save();
      traceRoundedRect(ctx, ix, iy, iw, ih, innerRadius);
      ctx.clip();

      const imgW = photoImg.naturalWidth || photoImg.width;
      const imgH = photoImg.naturalHeight || photoImg.height;
      if (imgW > 0 && imgH > 0) {
        const targetRatio = iw / ih;
        const srcRatio = imgW / imgH;
        let cropW = imgW;
        let cropH = imgH;
        if (srcRatio > targetRatio) {
          cropW = imgH * targetRatio;
        } else {
          cropH = imgW / targetRatio;
        }
        const zoom = 1.02;
        const finalCropW = cropW / zoom;
        const finalCropH = cropH / zoom;
        const cropX = (imgW - finalCropW) / 2;
        const cropY = (imgH - finalCropH) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(photoImg, cropX, cropY, finalCropW, finalCropH, ix, iy, iw, ih);
      }
      ctx.restore();

      // 3. Crisp inner border for Dark Noir mode
      if (isNoir) {
        ctx.save();
        traceRoundedRect(
          ctx,
          sxBox + pixelRatio,
          syBox + pixelRatio,
          swBox - 2 * pixelRatio,
          shBox - 2 * pixelRatio,
          outerRadius - pixelRatio
        );
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.5 * pixelRatio;
        ctx.stroke();
        ctx.restore();
      }
    }

    return new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/png",
        1
      );
    });
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const blob = await renderCardBlob(3);
      const fileName = `igotyou-wrapped-${Date.now()}.png`;

      // If inside an In-App Browser (IG, LINE, FB) that supports Web Share API with files,
      // open native iOS/Android Share Sheet so "Save Image" works seamlessly
      const inAppInfo = detectInAppBrowser();
      if (inAppInfo.isInApp && typeof navigator.share === "function" && typeof File !== "undefined") {
        const file = new File([blob], fileName, { type: "image/png" });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "IGOTYOU Wrapped Card",
            });
            return;
          } catch (shareErr: any) {
            if (shareErr?.name === "AbortError") return;
          }
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error("Failed to export image:", err);
      alert("ไม่สามารถบันทึกภาพได้ แนะนำให้เปิดผ่าน Safari หรือ Chrome แล้วลองอีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  const copyCardImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
        // Pass Promise<Blob> directly to ClipboardItem so iOS Safari preserves user gesture
        const blobPromise = renderCardBlob(2.5);
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blobPromise }),
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="บันทึกการ์ด IG Story (9:16)"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(23, 23, 17, 0.88)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "max(14px, env(safe-area-inset-top, 14px)) max(18px, env(safe-area-inset-right, 18px)) max(20px, env(safe-area-inset-bottom, 20px)) max(18px, env(safe-area-inset-left, 18px))",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 9999,
        WebkitOverflowScrolling: "touch",
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          maxWidth: "100%",
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls: Theme Switcher & Ratio Switcher */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            width: "100%",
            maxWidth: `${Math.min(360, Math.max(280, Math.round(360 * scale)))}px`,
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
              <span>Neo</span>
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
              <span>Dark</span>
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
              สัดส่วน:
            </span>
            <button
              type="button"
              onClick={() => setPhotoRatio("3:4")}
              style={{
                padding: "3px 8px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                border: "none",
                background: photoRatio === "3:4" ? "var(--acid)" : "transparent",
                color: photoRatio === "3:4" ? "var(--ink)" : "white",
                transition: "all 0.15s ease",
              }}
              title="สัดส่วนแนวตั้ง 3:4 ตามฟีด IG ยุคใหม่ ไม่ตัดหัวตัดขา"
            >
              3:4
            </button>
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
              title="สัดส่วนจัตุรัส 1:1 แบบคลาสสิก"
            >
              1:1
            </button>
          </div>
        </div>

        {/* 9:16 Card Scaled Container */}
        <div
          style={{
            width: `${Math.round(360 * scale)}px`,
            height: `${Math.round(640 * scale)}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              borderRadius: "24px",
              boxShadow: isNoir
                ? "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 25px rgba(217, 255, 67, 0.08)"
                : "0 24px 48px -12px rgba(0, 0, 0, 0.45), 4px 4px 0 #171711",
            }}
          >
            <div
              ref={cardRef}
              style={{
                width: "360px",
                height: "640px",
                background: isNoir ? "#171711" : "#f4f0e6",
                border: isNoir ? "3px solid #2d2d24" : "3px solid #171711",
                borderRadius: "24px",
                padding: "20px 18px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "none",
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
                fontFamily: '"IBM Plex Sans Thai", sans-serif',
                color: isNoir ? "#fdfbf7" : "#171711",
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
                      background: isNoir ? "#d9ff43" : "#171711",
                      color: isNoir ? "#171711" : "#d9ff43",
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
                      color: isNoir ? "#fdfbf7" : "#171711",
                    }}
                  >
                    IGOTYOU WRAPPED
                  </span>
                </div>
                <span
                  style={{
                    background: "#d9ff43",
                    color: "#171711",
                    borderTop: "2px solid #171711",
                    borderLeft: "2px solid #171711",
                    borderRight: "4px solid #171711",
                    borderBottom: "4px solid #171711",
                    borderRadius: "99px",
                    padding: "4px 10px",
                    fontSize: "10px",
                    fontWeight: 800,
                    fontFamily: "Manrope, sans-serif",
                    letterSpacing: "0.02em",
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
                      color: isNoir ? "#d9ff43" : "#7755d9",
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
                      color: isNoir ? "rgba(255,255,255,0.7)" : "#6f6c62",
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
                    color: isNoir ? "#ffffff" : "#171711",
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
                        border: isNoir ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid #171711",
                        borderRadius: "99px",
                        padding: "2px 8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: isNoir ? "#23231b" : "#fffdf8",
                        color: isNoir ? "#fdfbf7" : "#171711",
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
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    height: photoRatio === "3:4" ? "136px" : "104px",
                    width: "100%",
                    zIndex: 1,
                  }}
                >
                  {previewImages.map((img, i) => (
                    <div
                      key={i}
                      data-story-photo-slot={i}
                      style={{
                        height: "100%",
                        aspectRatio: photoRatio === "3:4" ? "3 / 4" : "1 / 1",
                        borderRadius: "10px",
                        overflow: "hidden",
                        borderTop: isNoir ? "2px solid rgba(255,255,255,0.25)" : "2px solid #171711",
                        borderLeft: isNoir ? "2px solid rgba(255,255,255,0.25)" : "2px solid #171711",
                        borderRight: isNoir ? "4px solid rgba(0,0,0,0.65)" : "4px solid #171711",
                        borderBottom: isNoir ? "4px solid rgba(0,0,0,0.65)" : "4px solid #171711",
                        background: "#171711",
                        position: "relative",
                        flexShrink: 0,
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
                          transform: "scale(1.02)",
                          transformOrigin: "center",
                        }}
                      />
                      
                    </div>
                  ))}
                </div>
              )}

              {/* Aesthetic Score & Color DNA Showcase Panel */}
              <div
                style={{
                  background: isNoir ? "#202018" : "#fffdf8",
                  borderTop: isNoir ? "2px solid rgba(255,255,255,0.18)" : "2px solid #171711",
                  borderLeft: isNoir ? "2px solid rgba(255,255,255,0.18)" : "2px solid #171711",
                  borderRight: isNoir ? "5px solid rgba(0,0,0,0.65)" : "5px solid #171711",
                  borderBottom: isNoir ? "5px solid rgba(0,0,0,0.65)" : "5px solid #171711",
                  borderRadius: "16px",
                  padding: "11px 13px",
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
                        color: isNoir ? "#d9ff43" : "#7755d9",
                        letterSpacing: "0.08em",
                      }}
                    >
                      AESTHETIC AUDIT
                    </span>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: isNoir ? "#fdfbf7" : "#171711",
                        marginTop: "1px",
                      }}
                    >
                      {data.aestheticScore.verdict || "คุมโทนเก่งมาก!"}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#d9ff43",
                      color: "#171711",
                      borderTop: "2px solid #171711",
                      borderLeft: "2px solid #171711",
                      borderRight: "4px solid #171711",
                      borderBottom: "4px solid #171711",
                      borderRadius: "99px",
                      padding: "2px 9px",
                      display: "flex",
                      alignItems: "baseline",
                      gap: "2px",
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
                      display: "flex",
                      height: "26px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: isNoir ? "2px solid rgba(255,255,255,0.25)" : "2px solid #171711",
                      background: "#171711",
                    }}
                  >
                    {data.colorDNA.slice(0, 4).map((c, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: "100%",
                          background: c.hex,
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "4px",
                      marginTop: "6px",
                      width: "100%",
                    }}
                  >
                    {data.colorDNA.slice(0, 4).map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: 0,
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 800,
                            color: isNoir ? "rgba(255,255,255,0.9)" : "#171711",
                            width: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.2,
                          }}
                          title={c.name}
                        >
                          {c.name}
                        </span>
                        <span
                          style={{
                            fontSize: "8px",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: isNoir ? "rgba(255,255,255,0.5)" : "#6f6c62",
                            lineHeight: 1.1,
                            marginTop: "1px",
                          }}
                        >
                          {c.hex.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bio Remix Quote */}
              <div
                style={{
                  background: isNoir ? "#183324" : "#7755d9",
                  color: "white",
                  borderTop: isNoir ? "2px solid rgba(255,255,255,0.2)" : "2px solid #171711",
                  borderLeft: isNoir ? "2px solid rgba(255,255,255,0.2)" : "2px solid #171711",
                  borderRight: isNoir ? "5px solid rgba(0,0,0,0.65)" : "5px solid #171711",
                  borderBottom: isNoir ? "5px solid rgba(0,0,0,0.65)" : "5px solid #171711",
                  borderRadius: "16px",
                  padding: "11px 13px",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    opacity: 0.9,
                    letterSpacing: "0.1em",
                    fontWeight: 800,
                    color: isNoir ? "#d9ff43" : "rgba(255,255,255,0.9)",
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
                    background: isNoir ? "#202018" : "#fffdf8",
                    borderTop: isNoir ? "2px solid rgba(255,255,255,0.18)" : "2px solid #171711",
                    borderLeft: isNoir ? "2px solid rgba(255,255,255,0.18)" : "2px solid #171711",
                    borderRight: isNoir ? "4px solid rgba(0,0,0,0.6)" : "4px solid #171711",
                    borderBottom: isNoir ? "4px solid rgba(0,0,0,0.6)" : "4px solid #171711",
                    borderRadius: "12px",
                    padding: "7px 10px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      font: "800 15px/1 Manrope, sans-serif",
                      color: isNoir ? "#fdfbf7" : "#171711",
                    }}
                  >
                    {data.stats.followerRatio}
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      color: isNoir ? "rgba(255,255,255,0.6)" : "#6f6c62",
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
                    background: isNoir ? "#202018" : "#fffdf8",
                    borderTop: isNoir ? "2px solid rgba(255,255,255,0.18)" : "2px solid #171711",
                    borderLeft: isNoir ? "2px solid rgba(255,255,255,0.18)" : "2px solid #171711",
                    borderRight: isNoir ? "4px solid rgba(0,0,0,0.6)" : "4px solid #171711",
                    borderBottom: isNoir ? "4px solid rgba(0,0,0,0.6)" : "4px solid #171711",
                    borderRadius: "12px",
                    padding: "7px 10px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      font: "800 15px/1 Manrope, sans-serif",
                      color: isNoir ? "#fdfbf7" : "#171711",
                    }}
                  >
                    {data.stats.postDensity}
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      color: isNoir ? "rgba(255,255,255,0.6)" : "#6f6c62",
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
                  color: isNoir ? "rgba(255,255,255,0.5)" : "#6f6c62",
                  borderTop: isNoir ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(23, 23, 17, 0.14)",
                  paddingTop: "8px",
                  fontWeight: 600,
                  zIndex: 1,
                }}
              >
                <span>NO DATA STORED</span>
                <span
                  style={{
                    fontWeight: 800,
                    color: isNoir ? "#d9ff43" : "#171711",
                    letterSpacing: "0.05em",
                  }}
                >
                  igotyou.app
                </span>
                <span>#IGOTYOU</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Below the Card (2-tier mobile-optimized layout with safe area) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            maxWidth: `${Math.min(360, Math.max(280, Math.round(360 * scale)))}px`,
            paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
          }}
        >
          {/* Row 1: Save & Copy */}
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <button
              type="button"
              onClick={downloadCard}
              disabled={isExporting}
              style={{
                flex: 1.35,
                background: "var(--acid)",
                color: "var(--ink)",
                border: "2px solid var(--ink)",
                borderRadius: "14px",
                padding: "12px 14px",
                fontWeight: 800,
                fontSize: "14px",
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
              <span>{isExporting ? "กำลังสร้างภาพ..." : "บันทึกภาพ"}</span>
            </button>
            <button
              type="button"
              onClick={copyCardImage}
              disabled={isExporting}
              style={{
                flex: 1,
                background: "var(--white)",
                color: "var(--ink)",
                border: "2px solid var(--ink)",
                borderRadius: "14px",
                padding: "12px 14px",
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
          </div>

          {/* Row 2: Full-width Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.14)",
              color: "white",
              border: "1.5px solid rgba(255,255,255,0.35)",
              borderRadius: "14px",
              padding: "11px 14px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            ปิดหน้าต่างตัวอย่าง
          </button>
        </div>
      </div>
    </div>
  );
}
