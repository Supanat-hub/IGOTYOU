import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Download, Copy, Check, Sun, Moon, Sparkles, ImagePlus, RotateCcw } from "lucide-react";
import { AnalysisResult } from "../utils/analysisEngine";
import { detectInAppBrowser } from "./InAppBrowserModal";
import { useBodyScrollLock } from "../utils/scrollLock";

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResult;
  onUpdateData?: (updated: AnalysisResult) => void;
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

function drawNeoBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  bgColor: string,
  isNoir: boolean,
  bRightBottom = 4,
  noirBorderAlpha = 0.2
) {
  const bTopLeft = 2;
  ctx.save();
  traceRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = isNoir ? "rgba(0, 0, 0, 0.65)" : "#171711";
  ctx.fill();

  const ix = x + bTopLeft;
  const iy = y + bTopLeft;
  const iw = Math.max(1, w - bTopLeft - bRightBottom);
  const ih = Math.max(1, h - bTopLeft - bRightBottom);
  const ir = Math.max(2, r - bTopLeft);

  traceRoundedRect(ctx, ix, iy, iw, ih, ir);
  ctx.fillStyle = bgColor;
  ctx.fill();

  if (isNoir) {
    traceRoundedRect(
      ctx,
      x + 1,
      y + 1,
      Math.max(2, w - bRightBottom),
      Math.max(2, h - bRightBottom),
      Math.max(2, r - 1)
    );
    ctx.strokeStyle = `rgba(255, 255, 255, ${noirBorderAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function fitTextWithEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "...";
  let trimmed = text;
  while (trimmed.length > 0 && ctx.measureText(trimmed + ellipsis).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + ellipsis;
}

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2
): string[] {
  if (!text) return [""];
  if (ctx.measureText(text).width <= maxWidth) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        if (lines.length >= maxLines) {
          lines[maxLines - 1] = fitTextWithEllipsis(
            ctx,
            `${lines[maxLines - 1]} ${word}`,
            maxWidth
          );
          return lines;
        }
      }
      if (ctx.measureText(word).width > maxWidth) {
        let chunk = "";
        for (const ch of Array.from(word)) {
          if (ctx.measureText(chunk + ch).width <= maxWidth) {
            chunk += ch;
          } else {
            lines.push(chunk);
            if (lines.length >= maxLines) {
              lines[maxLines - 1] = fitTextWithEllipsis(ctx, chunk + ch, maxWidth);
              return lines;
            }
            chunk = ch;
          }
        }
        currentLine = chunk;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.slice(0, maxLines);
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

function fileToCompressedDataUrl(file: File, maxDim = 960): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load custom photo"));
    };
    img.src = url;
  });
}

export default function StoryCardModal({
  isOpen,
  onClose,
  data,
  onUpdateData,
}: StoryCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const customPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState<"paper" | "noir">("paper");
  const [photoRatio, setPhotoRatio] = useState<"3:4" | "1:1">("3:4");
  const [copiedImage, setCopiedImage] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const formatSingleLine = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\\n|\r?\n/g, " · ")
      .replace(/\s+·\s+/g, " · ")
      .replace(/·\s*·+/g, "·")
      .trim();
  };

  // Editable fields for user autonomy (two-way synced with parent ResultPage)
  const [customTitle, setCustomTitle] = useState(() => formatSingleLine(data.persona.title));
  const [customHandle, setCustomHandle] = useState(data.username || "@my.profile");
  const [customVerdict, setCustomVerdict] = useState(
    data.aestheticScore.verdict || "คุมโทนเก่งมาก!"
  );
  const [customBioText, setCustomBioText] = useState(data.bioRemix.text || "");
  const [customBioSubtext, setCustomBioSubtext] = useState(data.bioRemix.subtext || "");
  const [customFollowerRatio, setCustomFollowerRatio] = useState(
    data.stats.followerRatio || "1.0x"
  );
  const [customPostDensity, setCustomPostDensity] = useState(
    data.stats.postDensity || "0"
  );

  // Local fallback state in case parent doesn't pass onUpdateData
  const [localCardImages, setLocalCardImages] = useState<string[]>(() =>
    (data.topContent?.cardImages && data.topContent.cardImages.length > 0
      ? data.topContent.cardImages
      : data.topContent?.images || []
    ).slice(0, 3)
  );
  const [localAllImages, setLocalAllImages] = useState<string[]>(() =>
    data.topContent?.allImages && data.topContent.allImages.length > 0
      ? data.topContent.allImages
      : data.topContent?.images || []
  );

  useEffect(() => {
    setCustomTitle(formatSingleLine(data.persona.title));
  }, [data.persona.title]);

  useEffect(() => {
    setCustomHandle(data.username || "@my.profile");
  }, [data.username]);

  useEffect(() => {
    setCustomVerdict(data.aestheticScore.verdict || "คุมโทนเก่งมาก!");
  }, [data.aestheticScore.verdict]);

  useEffect(() => {
    setCustomBioText(data.bioRemix.text || "");
    setCustomBioSubtext(data.bioRemix.subtext || "");
  }, [data.bioRemix.text, data.bioRemix.subtext]);

  useEffect(() => {
    setCustomFollowerRatio(data.stats.followerRatio || "1.0x");
    setCustomPostDensity(data.stats.postDensity || "0");
  }, [data.stats.followerRatio, data.stats.postDensity]);

  const handleUpdateHandle = (val: string) => {
    const clean = val.replace(/\r?\n/g, "");
    setCustomHandle(clean);
    onUpdateData?.({
      ...data,
      username: clean,
    });
  };

  const handleUpdateTitle = (val: string, shouldTrim = false) => {
    const clean = shouldTrim
      ? formatSingleLine(val)
      : val.replace(/\\n|\r?\n/g, " · ");
    setCustomTitle(clean);
    onUpdateData?.({
      ...data,
      persona: {
        ...data.persona,
        title: clean,
      },
    });
  };

  const handleUpdateVerdict = (val: string) => {
    const clean = val.replace(/\r?\n/g, "");
    setCustomVerdict(clean);
    onUpdateData?.({
      ...data,
      aestheticScore: {
        ...data.aestheticScore,
        verdict: clean,
      },
    });
  };

  const handleUpdateBioText = (val: string) => {
    const clean = val.replace(/\r?\n/g, "");
    setCustomBioText(clean);
    onUpdateData?.({
      ...data,
      bioRemix: {
        ...data.bioRemix,
        text: clean,
      },
    });
  };

  const handleUpdateBioSubtext = (val: string) => {
    const clean = val.replace(/\r?\n/g, "");
    setCustomBioSubtext(clean);
    onUpdateData?.({
      ...data,
      bioRemix: {
        ...data.bioRemix,
        subtext: clean,
      },
    });
  };

  const handleUpdateFollowerRatio = (val: string) => {
    const clean = val.replace(/\r?\n/g, "");
    setCustomFollowerRatio(clean);
    onUpdateData?.({
      ...data,
      stats: {
        ...data.stats,
        followerRatio: clean,
      },
    });
  };

  const handleUpdatePostDensity = (val: string) => {
    const clean = val.replace(/\r?\n/g, "");
    setCustomPostDensity(clean);
    onUpdateData?.({
      ...data,
      stats: {
        ...data.stats,
        postDensity: clean,
      },
    });
  };

  useEffect(() => {
    const nextCard = (
      data.topContent?.cardImages && data.topContent.cardImages.length > 0
        ? data.topContent.cardImages
        : data.topContent?.images || []
    ).slice(0, 3);
    const nextAll =
      data.topContent?.allImages && data.topContent.allImages.length > 0
        ? data.topContent.allImages
        : data.topContent?.images || [];
    setLocalCardImages(nextCard);
    setLocalAllImages(nextAll);
    setActiveSlot(null);
  }, [data.topContent?.cardImages, data.topContent?.allImages, data.topContent?.images]);

  const [scale, setScale] = useState(1);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    if (!isOpen) return;
    const calculateScale = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);

      if (desktop) {
        // On desktop, available height is viewport height minus padding & breathing room (~80px)
        const availH = window.innerHeight - 80;
        const scaleH = availH / 640;
        // Clamp scale between 0.72 and 1.0 (so card is crisp, large, and comfortably fits viewport)
        setScale(Math.max(0.72, Math.min(1.0, scaleH)));
      } else {
        // Mobile calculation:
        // Allow at least 20px horizontal margin each side (40px total)
        const availW = window.innerWidth - 40;
        // Top controls (~40px) + Photo strip (~64px) + 2-tier action buttons (~112px) + gaps (~44px)
        const availH = window.innerHeight - 260;

        const scaleW = availW / 360;
        const scaleH = availH / 640;

        const targetScale = Math.min(1, Math.min(scaleW, scaleH));
        // Clamp between 0.62 and 1.0 (crisp on mobile, doesn't over-stretch on desktop)
        setScale(Math.max(0.62, Math.min(1, targetScale)));
      }
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
  const allCandidates = localAllImages;
  const previewImages = localCardImages.slice(0, 3);

  const commitPhotoSelection = (nextCard: string[], nextAll: string[] = allCandidates) => {
    const trimmedCard = nextCard.slice(0, 3);
    setLocalCardImages(trimmedCard);
    setLocalAllImages(nextAll);
    if (onUpdateData) {
      // Also keep topContent.images in sync so ResultPage reflects custom additions
      const mergedGrid = [
        ...trimmedCard,
        ...nextAll.filter((img) => !trimmedCard.includes(img)),
      ].slice(0, Math.max(6, data.topContent.images.length));
      onUpdateData({
        ...data,
        topContent: {
          ...data.topContent,
          images: mergedGrid,
          allImages: nextAll,
          cardImages: trimmedCard,
        },
      });
    }
  };

  const handleCandidateClick = (imgUrl: string) => {
    const existingIdx = previewImages.indexOf(imgUrl);

    // If user clicked a specific slot (#1, #2, #3) on the card first to swap into that slot
    if (activeSlot !== null && activeSlot < previewImages.length) {
      const next = [...previewImages];
      if (existingIdx !== -1 && existingIdx !== activeSlot) {
        // Swap the two slots
        const temp = next[activeSlot];
        next[activeSlot] = next[existingIdx];
        next[existingIdx] = temp;
      } else {
        next[activeSlot] = imgUrl;
      }
      commitPhotoSelection(next);
      setActiveSlot(null);
      return;
    }

    // Standard toggle/select mode:
    if (existingIdx !== -1) {
      // Deselect if more than 1 photo is currently on the card
      if (previewImages.length > 1) {
        const next = previewImages.filter((_, i) => i !== existingIdx);
        commitPhotoSelection(next);
      }
    } else {
      if (previewImages.length < 3) {
        commitPhotoSelection([...previewImages, imgUrl]);
      } else {
        // Replace slot #3 with the newly tapped photo
        commitPhotoSelection([previewImages[0], previewImages[1], imgUrl]);
      }
    }
  };

  const handleCustomPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    e.target.value = "";
    if (incoming.length === 0) return;

    try {
      const newUrls = await Promise.all(
        incoming.slice(0, 3).map((file) => fileToCompressedDataUrl(file))
      );
      const nextAll = [...allCandidates, ...newUrls];
      let nextCard = [...previewImages];

      for (const url of newUrls) {
        if (activeSlot !== null && activeSlot < nextCard.length) {
          nextCard[activeSlot] = url;
          setActiveSlot(null);
        } else if (nextCard.length < 3) {
          nextCard.push(url);
        } else {
          nextCard = [nextCard[0], nextCard[1], url];
        }
      }

      commitPhotoSelection(nextCard, nextAll);
    } catch (err) {
      console.warn("Failed to read custom photo:", err);
    }
  };

  const handleResetToAiBest = () => {
    if (allCandidates.length === 0) return;
    setActiveSlot(null);
    commitPhotoSelection(allCandidates.slice(0, 3), allCandidates);
  };

  /**
   * Renders the Story Card into a crisp 1080x1920 (or 900x1600) PNG Blob using
   * a pure Native HTML5 Canvas 2D vector & typography renderer:
   * - Uses document.fonts (Manrope & IBM Plex Sans Thai) directly without SVG <foreignObject>
   *   sandboxing or html-to-image getComputedStyle width-locking bugs.
   * - Never wraps single-line labels or truncates @handle when horizontal space is available.
   * - 100% immune to iOS WebKit <foreignObject> black-image bugs.
   */
  const renderCardBlob = async (pixelRatio = 3): Promise<Blob> => {
    const cardEl = cardRef.current;
    if (!cardEl) throw new Error("Card element not mounted");

    if (typeof document !== "undefined" && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Proceed if font readiness promise fails
      }
    }

    // Measure container section positions in unscaled 360x640 card space
    const cardRect = cardEl.getBoundingClientRect();
    const scaleX = cardRect.width / 360 || 1;
    const scaleY = cardRect.height / 640 || 1;

    const getBox = (selector: string, fallback: { x: number; y: number; w: number; h: number }) => {
      const el = cardEl.querySelector<HTMLElement>(selector);
      if (!el) return fallback;
      const r = el.getBoundingClientRect();
      return {
        x: (r.left - cardRect.left) / scaleX,
        y: (r.top - cardRect.top) / scaleY,
        w: r.width / scaleX,
        h: r.height / scaleY,
      };
    };

    const headerBox = getBox("[data-card-header]", { x: 21, y: 23, w: 318, h: 28 });
    const personaBox = getBox("[data-card-persona]", { x: 21, y: 62, w: 318, h: 72 });
    const titleBox = getBox("[data-card-title]", { x: 21, y: 80, w: 318, h: 28 });
    const tagsBox = getBox("[data-card-tags]", { x: 21, y: 114, w: 318, h: 22 });
    const aestheticBox = getBox("[data-card-aesthetic]", { x: 21, y: 298, w: 318, h: 118 });
    const swatchesBox = getBox("[data-card-swatches]", { x: 36, y: 348, w: 288, h: 26 });
    const bioBox = getBox("[data-card-bio]", { x: 21, y: 428, w: 318, h: 86 });
    const statLeftBox = getBox("[data-card-stat-left]", { x: 21, y: 526, w: 155, h: 48 });
    const statRightBox = getBox("[data-card-stat-right]", { x: 184, y: 526, w: 155, h: 48 });
    const footerBox = getBox("[data-card-footer]", { x: 21, y: 586, w: 318, h: 24 });

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

    const outW = 360 * pixelRatio;
    const outH = 640 * pixelRatio;
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = outW;
    finalCanvas.height = outH;
    const ctx = finalCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);

    // 0. Fill outer background & clip to 360x640 rounded card
    const bgMain = isNoir ? "#171711" : "#f4f0e6";
    ctx.fillStyle = bgMain;
    ctx.fillRect(0, 0, 360, 640);

    ctx.save();
    traceRoundedRect(ctx, 0, 0, 360, 640, 24);
    ctx.clip();
    ctx.fillStyle = bgMain;
    ctx.fillRect(0, 0, 360, 640);

    // 1. Top Header ("✦ IGOTYOU WRAPPED" + "2026 EDITION" pill)
    const headerCy = headerBox.y + headerBox.h / 2;
    ctx.beginPath();
    ctx.arc(21 + 14, headerCy, 14, 0, Math.PI * 2);
    ctx.fillStyle = isNoir ? "#d9ff43" : "#171711";
    ctx.fill();

    ctx.font = '800 14px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "#171711" : "#d9ff43";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", 21 + 14, headerCy + 0.5);

    ctx.font = '800 16px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "#fdfbf7" : "#171711";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("IGOTYOU WRAPPED", 21 + 28 + 8, headerCy + 0.5);

    const editionText = "2026 EDITION";
    ctx.font = '800 10px "Manrope", sans-serif';
    const editionTw = ctx.measureText(editionText).width;
    const editionW = Math.ceil(editionTw + 22);
    const editionH = 24;
    const editionX = 339 - editionW;
    const editionY = headerCy - editionH / 2;
    drawNeoBox(ctx, editionX, editionY, editionW, editionH, 99, "#d9ff43", false, 4);
    ctx.font = '800 10px "Manrope", sans-serif';
    ctx.fillStyle = "#171711";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(editionText, editionX + 2 + (editionW - 6) / 2, editionY + 2 + (editionH - 6) / 2 + 0.5);

    // 2. Persona Hero Section ("PROFILE PERSONA", @handle, Title, #tags)
    const personaRowY = personaBox.y + 11;
    ctx.font = '800 10px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "#d9ff43" : "#7755d9";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("PROFILE PERSONA", 21, personaRowY);

    const handleDisplay = (customHandle || "@my.profile").trim();
    ctx.font = '700 12px "Manrope", "IBM Plex Sans Thai", sans-serif';
    ctx.fillStyle = isNoir ? "rgba(255, 255, 255, 0.72)" : "#6f6c62";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(fitTextWithEllipsis(ctx, handleDisplay, 195), 339, personaRowY);

    const titleDisplay = formatSingleLine(customTitle) || "มีสไตล์เป็นของตัวเอง";
    const titleFontSize =
      titleDisplay.length > 26
        ? 17
        : titleDisplay.length > 20
        ? 18
        : titleDisplay.length > 15
        ? 20
        : 22;
    ctx.font = `700 ${titleFontSize}px "IBM Plex Sans Thai", "Manrope", sans-serif`;
    ctx.fillStyle = isNoir ? "#ffffff" : "#171711";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const fittedTitle = fitTextWithEllipsis(ctx, titleDisplay, 318);
    const titleCy = titleBox.y + titleBox.h / 2;
    ctx.fillText(fittedTitle, 21, titleCy);
    // Subtle synthetic extra-bold pass to match fontWeight: 800 on Thai glyphs
    ctx.fillText(fittedTitle, 21.35, titleCy);

    // #tags row
    let tagX = 21;
    const tagY = tagsBox.y;
    const tagH = 20;
    ctx.font = '700 10px "IBM Plex Sans Thai", "Manrope", sans-serif';
    for (const rawTag of data.persona.tags) {
      const tagLabel = `#${rawTag}`;
      const tw = ctx.measureText(tagLabel).width;
      const pillW = Math.ceil(tw + 17);
      if (tagX + pillW > 339 && tagX > 21) break;

      ctx.save();
      traceRoundedRect(ctx, tagX, tagY, pillW, tagH, 99);
      ctx.fillStyle = isNoir ? "#23231b" : "#fffdf8";
      ctx.fill();
      ctx.strokeStyle = isNoir ? "rgba(255, 255, 255, 0.22)" : "#171711";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isNoir ? "#fdfbf7" : "#171711";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tagLabel, tagX + pillW / 2, tagY + tagH / 2 + 0.5);
      tagX += pillW + 5;
    }

    // 3. Mini Photo Strip (High-res photos in Neo-Brutalist frames)
    for (let i = 0; i < slotRects.length; i++) {
      const photoImg = decodedPhotos[i];
      const slot = slotRects[i];
      if (!photoImg || !slot) continue;

      const outerRadius = 10;
      ctx.save();
      traceRoundedRect(ctx, slot.x, slot.y, slot.w, slot.h, outerRadius);
      ctx.fillStyle = isNoir ? "rgba(0, 0, 0, 0.65)" : "#171711";
      ctx.fill();
      ctx.restore();

      const bTop = 2;
      const bLeft = 2;
      const bRight = 4;
      const bBottom = 4;
      const ix = slot.x + bLeft;
      const iy = slot.y + bTop;
      const iw = Math.max(1, slot.w - bLeft - bRight);
      const ih = Math.max(1, slot.h - bTop - bBottom);
      const innerRadius = 8;

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

      if (isNoir) {
        ctx.save();
        traceRoundedRect(ctx, slot.x + 1, slot.y + 1, slot.w - 2, slot.h - 2, outerRadius - 1);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Aesthetic Score & Color DNA Showcase Panel
    drawNeoBox(
      ctx,
      aestheticBox.x,
      aestheticBox.y,
      aestheticBox.w,
      aestheticBox.h,
      16,
      isNoir ? "#202018" : "#fffdf8",
      isNoir,
      5,
      0.18
    );

    const aesLeftX = aestheticBox.x + 15;
    const aesTopY = aestheticBox.y + 13;

    ctx.font = '800 9px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "#d9ff43" : "#7755d9";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("AESTHETIC AUDIT", aesLeftX, aesTopY + 8);

    // Score Pill on right of Aesthetic Row
    const scoreStr = String(data.aestheticScore.score);
    ctx.font = '800 17px "Manrope", sans-serif';
    const scoreNumW = ctx.measureText(scoreStr).width;
    ctx.font = '700 10px "Manrope", sans-serif';
    const outOfW = ctx.measureText("/100").width;
    const scorePillW = Math.ceil(scoreNumW + outOfW + 22);
    const scorePillH = 26;
    const scorePillX = aestheticBox.x + aestheticBox.w - 5 - 12 - scorePillW;
    const scorePillY = aesTopY;
    drawNeoBox(ctx, scorePillX, scorePillY, scorePillW, scorePillH, 99, "#d9ff43", false, 4);

    const scoreInnerX = scorePillX + 2 + (scorePillW - 6 - (scoreNumW + 2 + outOfW)) / 2;
    const scoreBaselineY = scorePillY + 2 + (scorePillH - 6) / 2 + 5;
    ctx.font = '800 17px "Manrope", sans-serif';
    ctx.fillStyle = "#171711";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(scoreStr, scoreInnerX, scoreBaselineY);
    ctx.font = '700 10px "Manrope", sans-serif';
    ctx.fillText("/100", scoreInnerX + scoreNumW + 2, scoreBaselineY - 1);

    // Verdict text (single line with generous width up to score pill)
    const verdictDisplay = (customVerdict || data.aestheticScore.verdict || "คุมโทนเก่งมาก!").trim();
    const maxVerdictW = Math.max(140, scorePillX - aesLeftX - 8);
    ctx.font = '700 12px "IBM Plex Sans Thai", "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "#fdfbf7" : "#171711";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const fittedVerdict = fitTextWithEllipsis(ctx, verdictDisplay, maxVerdictW);
    ctx.fillText(fittedVerdict, aesLeftX, aesTopY + 24);
    ctx.fillText(fittedVerdict, aesLeftX + 0.25, aesTopY + 24);

    // Color DNA Swatches Bar
    const swatches = data.colorDNA.slice(0, 4);
    if (swatches.length > 0) {
      const swX = swatchesBox.x;
      const swY = swatchesBox.y;
      const swW = swatchesBox.w;
      const swH = swatchesBox.h;
      const colW = swW / swatches.length;

      ctx.save();
      traceRoundedRect(ctx, swX, swY, swW, swH, 8);
      ctx.clip();
      swatches.forEach((c, i) => {
        ctx.fillStyle = c.hex;
        ctx.fillRect(swX + i * colW, swY, Math.ceil(colW + 0.5), swH);
      });
      ctx.restore();

      ctx.save();
      traceRoundedRect(ctx, swX + 1, swY + 1, swW - 2, swH - 2, 7);
      ctx.strokeStyle = isNoir ? "rgba(255, 255, 255, 0.25)" : "#171711";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Swatch names & HEX labels
      swatches.forEach((c, i) => {
        const cx = swX + i * colW + colW / 2;
        ctx.font = '800 8.5px "Manrope", "IBM Plex Sans Thai", sans-serif';
        ctx.fillStyle = isNoir ? "rgba(255, 255, 255, 0.9)" : "#171711";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(fitTextWithEllipsis(ctx, c.name, colW - 3), cx, swY + swH + 13);

        ctx.font = "700 8px monospace";
        ctx.fillStyle = isNoir ? "rgba(255, 255, 255, 0.5)" : "#6f6c62";
        ctx.fillText(c.hex.toUpperCase(), cx, swY + swH + 23);
      });
    }

    // 5. Bio Remix Quote Box
    drawNeoBox(
      ctx,
      bioBox.x,
      bioBox.y,
      bioBox.w,
      bioBox.h,
      16,
      isNoir ? "#183324" : "#7755d9",
      isNoir,
      5,
      0.2
    );

    const bioInnerX = bioBox.x + 15;
    const bioInnerW = bioBox.w - 30;
    const bioTopY = bioBox.y + 13;

    ctx.font = '800 9px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "#d9ff43" : "rgba(255, 255, 255, 0.92)";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("✦ BIO REMIX", bioInnerX, bioTopY + 8);

    const bioQuoteStr = `"${(customBioText || data.bioRemix.text || "").trim()}"`;
    ctx.font = '700 13px "IBM Plex Sans Thai", "Manrope", sans-serif';
    ctx.fillStyle = "#ffffff";
    const quoteLines = wrapCanvasLines(ctx, bioQuoteStr, bioInnerW, 2);
    let bioCurY = bioTopY + 25;
    for (const line of quoteLines) {
      ctx.fillText(line, bioInnerX, bioCurY);
      bioCurY += 16.5;
    }

    const bioSubStr = (customBioSubtext || data.bioRemix.subtext || "").trim();
    if (bioSubStr) {
      ctx.font = '500 10px "IBM Plex Sans Thai", "Manrope", sans-serif';
      ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
      const subLines = wrapCanvasLines(ctx, bioSubStr, bioInnerW, 2);
      for (const line of subLines) {
        ctx.fillText(line, bioInnerX, bioCurY - 2);
        bioCurY += 13;
      }
    }

    // 6. Stats Bar (2 columns)
    const drawStatCard = (
      box: { x: number; y: number; w: number; h: number },
      val: string,
      label: string
    ) => {
      drawNeoBox(
        ctx,
        box.x,
        box.y,
        box.w,
        box.h,
        12,
        isNoir ? "#202018" : "#fffdf8",
        isNoir,
        4,
        0.18
      );
      const cx = box.x + 2 + (box.w - 6) / 2;
      ctx.font = '800 15px "Manrope", "IBM Plex Sans Thai", sans-serif';
      ctx.fillStyle = isNoir ? "#fdfbf7" : "#171711";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(fitTextWithEllipsis(ctx, val, box.w - 16), cx, box.y + 22);

      ctx.font = '700 8px "Manrope", sans-serif';
      ctx.fillStyle = isNoir ? "rgba(255, 255, 255, 0.6)" : "#6f6c62";
      ctx.fillText(label, cx, box.y + 34);
    };

    drawStatCard(
      statLeftBox,
      (customFollowerRatio || data.stats.followerRatio || "1.0x").trim(),
      "FOLLOWER RATIO"
    );
    drawStatCard(
      statRightBox,
      (customPostDensity || data.stats.postDensity || "0").trim(),
      "POSTS ANALYZED"
    );

    // 7. Footer Card Notice
    ctx.beginPath();
    ctx.moveTo(footerBox.x, footerBox.y);
    ctx.lineTo(footerBox.x + footerBox.w, footerBox.y);
    ctx.strokeStyle = isNoir ? "rgba(255, 255, 255, 0.15)" : "rgba(23, 23, 17, 0.14)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const footerTextY = footerBox.y + footerBox.h - 3;
    ctx.font = '600 9px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "rgba(255, 255, 255, 0.5)" : "#6f6c62";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("NO DATA STORED", footerBox.x, footerTextY);

    ctx.font = '800 9px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "#d9ff43" : "#171711";
    ctx.textAlign = "center";
    ctx.fillText("igotyou.app", 180, footerTextY);

    ctx.font = '600 9px "Manrope", sans-serif';
    ctx.fillStyle = isNoir ? "rgba(255, 255, 255, 0.5)" : "#6f6c62";
    ctx.textAlign = "right";
    ctx.fillText("#IGOTYOU", footerBox.x + footerBox.w, footerTextY);

    ctx.restore(); // end card clip

    // Outer 3px card border
    ctx.save();
    traceRoundedRect(ctx, 1.5, 1.5, 357, 637, 22.5);
    ctx.strokeStyle = isNoir ? "#2d2d24" : "#171711";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // end scale(pixelRatio, pixelRatio)

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
      className="modal-backdrop-animate"
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
        className="modal-dialog-animate"
        style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isDesktop ? "36px" : "12px",
          maxWidth: isDesktop ? "960px" : "100%",
          width: isDesktop ? "auto" : undefined,
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Custom Photo Upload */}
        <input
          ref={customPhotoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          aria-hidden="true"
          onChange={handleCustomPhotoUpload}
        />
        {/* Top Controls: Theme Switcher & Ratio Switcher (Mobile only) */}
        {!isDesktop && (
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
        )}

        {/* Card Column: Left on Desktop, Center on Mobile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
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
              <div
                data-card-header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
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
                      flexShrink: 0,
                    }}
                  >
                    ✦
                  </span>
                  <span
                    style={{
                      font: "800 16px/1 Manrope, sans-serif",
                      letterSpacing: "-0.04em",
                      color: isNoir ? "#fdfbf7" : "#171711",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
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
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  2026 EDITION
                </span>
              </div>

              {/* Persona Hero Section - Single Line Compact Layout */}
              <div data-card-persona style={{ zIndex: 1 }}>
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
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    PROFILE PERSONA
                  </span>
                  <input
                    type="text"
                    value={customHandle}
                    onChange={(e) => handleUpdateHandle(e.target.value)}
                    aria-label="แก้ไขชื่อบัญชี IG บนการ์ด"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isNoir ? "rgba(255,255,255,0.72)" : "#6f6c62",
                      letterSpacing: "-0.01em",
                      outline: "none",
                      cursor: "text",
                      textAlign: "right",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title="คลิกเพื่อแก้ไขชื่อบัญชี IG"
                  />
                </div>

                <input
                  data-card-title
                  type="text"
                  value={customTitle}
                  onChange={(e) => handleUpdateTitle(e.target.value, false)}
                  onBlur={(e) => handleUpdateTitle(e.target.value, true)}
                  aria-label="แก้ไขฉายา Persona บนการ์ด"
                  style={{
                    display: "block",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: 0,
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
                />

                <div
                  data-card-tags
                  style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}
                >
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
                        whiteSpace: "nowrap",
                        flexShrink: 0,
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
                      onClick={() => setActiveSlot(activeSlot === i ? null : i)}
                      title={`แตะเพื่อเปลี่ยนรูปช่อง #${i + 1}`}
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
                        cursor: "pointer",
                        outline:
                          !isExporting && activeSlot === i
                            ? "3px solid #d9ff43"
                            : "none",
                        outlineOffset: "1px",
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
                data-card-aesthetic
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "9px",
                        fontWeight: 800,
                        color: isNoir ? "#d9ff43" : "#7755d9",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      AESTHETIC AUDIT
                    </span>
                    <input
                      type="text"
                      value={customVerdict}
                      onChange={(e) => handleUpdateVerdict(e.target.value)}
                      aria-label="แก้ไขคำตัดสินโทนภาพบนการ์ด"
                      style={{
                        display: "block",
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        fontSize: "12px",
                        fontWeight: 800,
                        color: isNoir ? "#fdfbf7" : "#171711",
                        marginTop: "1px",
                        outline: "none",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "text",
                      }}
                      title="คลิกเพื่อแก้ไขคำตัดสินโทนภาพ"
                    />
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
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ font: "800 17px/1 Manrope, sans-serif", whiteSpace: "nowrap" }}>
                      {data.aestheticScore.score}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>/100</span>
                  </div>
                </div>

                {/* Color DNA Swatches */}
                <div>
                  <div
                    data-card-swatches
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
                            whiteSpace: "nowrap",
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
                data-card-bio
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
                    whiteSpace: "nowrap",
                  }}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span style={{ whiteSpace: "nowrap" }}>BIO REMIX</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    margin: "3px 0 2px",
                    lineHeight: 1.3,
                  }}
                >
                  <span>"</span>
                  <input
                    type="text"
                    value={customBioText}
                    onChange={(e) => handleUpdateBioText(e.target.value)}
                    aria-label="แก้ไขคำคม Bio Remix บนการ์ด"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1.3,
                      outline: "none",
                      cursor: "text",
                    }}
                    title="คลิกเพื่อแก้ไขคำคมไบโอ"
                  />
                  <span>"</span>
                </div>
                <input
                  type="text"
                  value={customBioSubtext}
                  onChange={(e) => handleUpdateBioSubtext(e.target.value)}
                  aria-label="แก้ไขคำแซวเสริม Bio Remix บนการ์ด"
                  style={{
                    display: "block",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.82)",
                    lineHeight: 1.25,
                    outline: "none",
                    cursor: "text",
                  }}
                  title="คลิกเพื่อแก้ไขคำแซวไบโอ"
                />
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
                  data-card-stat-left
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
                  <input
                    type="text"
                    value={customFollowerRatio}
                    onChange={(e) => handleUpdateFollowerRatio(e.target.value)}
                    aria-label="แก้ไขตัวเลข Follower Ratio บนการ์ด"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      textAlign: "center",
                      font: "800 15px/1 Manrope, sans-serif",
                      color: isNoir ? "#fdfbf7" : "#171711",
                      outline: "none",
                      cursor: "text",
                    }}
                    title="คลิกเพื่อแก้ไขตัวเลข Follower Ratio"
                  />
                  <div
                    style={{
                      fontSize: "8px",
                      color: isNoir ? "rgba(255,255,255,0.6)" : "#6f6c62",
                      fontWeight: 700,
                      marginTop: "2px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Follower Ratio
                  </div>
                </div>
                <div
                  data-card-stat-right
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
                  <input
                    type="text"
                    value={customPostDensity}
                    onChange={(e) => handleUpdatePostDensity(e.target.value)}
                    aria-label="แก้ไขตัวเลข Posts Analyzed บนการ์ด"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      textAlign: "center",
                      font: "800 15px/1 Manrope, sans-serif",
                      color: isNoir ? "#fdfbf7" : "#171711",
                      outline: "none",
                      cursor: "text",
                    }}
                    title="คลิกเพื่อแก้ไขจำนวนโพสต์"
                  />
                  <div
                    style={{
                      fontSize: "8px",
                      color: isNoir ? "rgba(255,255,255,0.6)" : "#6f6c62",
                      fontWeight: 700,
                      marginTop: "2px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Posts Analyzed
                  </div>
                </div>
              </div>

              {/* Footer Card Notice */}
              <div
                data-card-footer
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
                <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>NO DATA STORED</span>
                <span
                  style={{
                    fontWeight: 800,
                    color: isNoir ? "#d9ff43" : "#171711",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  igotyou.app
                </span>
                <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>#IGOTYOU</span>
              </div>
            </div>
          </div>
        </div>
        {isDesktop && (
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.65)",
                marginTop: "12px",
                textAlign: "center",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>💡</span>
              <span>คลิกข้อความหรือช่องรูปบนการ์ดเพื่อแก้ไขได้โดยตรง</span>
            </span>
          )}
        </div>

        {/* Mobile-Only Bottom Controls */}
        {!isDesktop && (
          <>
            {/* Interactive Photo Selector & Custom Upload Strip */}
            <div
              style={{
                width: "100%",
                maxWidth: `${Math.min(360, Math.max(280, Math.round(360 * scale)))}px`,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1.5px solid rgba(255, 255, 255, 0.22)",
                borderRadius: "14px",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: activeSlot !== null ? "#d9ff43" : "rgba(255, 255, 255, 0.92)",
                  }}
                >
                  {activeSlot !== null
                    ? `กำลังเปลี่ยนรูปช่อง #${activeSlot + 1} (แตะรูปด้านล่างเพื่อแทนที่)`
                    : `เลือกรูปในการ์ด (${previewImages.length}/3) · แตะเพื่อสลับลำดับ`}
                </span>
                {allCandidates.length > 1 && (
                  <button
                    type="button"
                    onClick={handleResetToAiBest}
                    style={{
                      background: "rgba(255, 255, 255, 0.14)",
                      color: "#d9ff43",
                      border: "1px solid rgba(217, 255, 67, 0.4)",
                      borderRadius: "99px",
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                    }}
                    title="เรียงลำดับรูปที่ดีที่สุดตามที่ AI คัดเลือก"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>AI แนะนำ</span>
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  overflowX: "auto",
                  paddingBottom: "2px",
                  scrollbarWidth: "thin",
                }}
              >
                {allCandidates.map((candidateImg, idx) => {
                  const selectedRank = previewImages.indexOf(candidateImg);
                  const isSelected = selectedRank !== -1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCandidateClick(candidateImg)}
                      title={
                        isSelected
                          ? `รูปที่ #${selectedRank + 1} ในการ์ด (แตะเพื่อเอาออก/สลับ)`
                          : "แตะเพื่อนำรูปนี้เข้าการ์ด"
                      }
                      style={{
                        width: "44px",
                        height: "54px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        position: "relative",
                        flexShrink: 0,
                        padding: 0,
                        cursor: "pointer",
                        background: "#171711",
                        border: isSelected
                          ? "2px solid #d9ff43"
                          : "1.5px solid rgba(255,255,255,0.3)",
                        opacity: isSelected ? 1 : 0.72,
                        transform: isSelected ? "scale(1)" : "scale(0.96)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <img
                        src={candidateImg}
                        alt={`ตัวเลือกรูปที่ ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      {isSelected && (
                        <span
                          style={{
                            position: "absolute",
                            top: "3px",
                            left: "3px",
                            background: "#d9ff43",
                            color: "#171711",
                            border: "1.5px solid #171711",
                            borderRadius: "99px",
                            fontSize: "9px",
                            fontWeight: 900,
                            fontFamily: "Manrope, sans-serif",
                            padding: "0px 4px",
                            lineHeight: 1.35,
                          }}
                        >
                          #{selectedRank + 1}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Upload custom photo button */}
                <button
                  type="button"
                  onClick={() => customPhotoInputRef.current?.click()}
                  title="อัปโหลดรูปภาพเพิ่มเติมจากเครื่องเพื่อใส่ในการ์ด"
                  style={{
                    width: "48px",
                    height: "54px",
                    borderRadius: "8px",
                    border: "1.5px dashed rgba(217, 255, 67, 0.7)",
                    background: "rgba(217, 255, 67, 0.12)",
                    color: "#d9ff43",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    flexShrink: 0,
                    cursor: "pointer",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px",
                  }}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>+เพิ่มรูป</span>
                </button>
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
                  <span>{isExporting ? "กำลังสร้าง..." : "บันทึกภาพ"}</span>
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
                  <span>{copiedImage ? "Copied!" : "คัดลอกรูป"}</span>
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
          </>
        )}

        {/* Desktop-Only 2nd Column Sidebar Controls */}
        {isDesktop && (
          <div
            style={{
              width: "400px",
              background: "rgba(23, 23, 17, 0.92)",
              backdropFilter: "blur(20px)",
              border: "2px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.6), 4px 4px 0 rgba(0, 0, 0, 0.3)",
              maxHeight: `${Math.max(580, Math.round(640 * scale))}px`,
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            {/* Header with Close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "var(--acid)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  STORY EXPORT (9:16)
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "white",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  ตัวอย่างการ์ด IG Story
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                  ปรับแต่งธีม รูปภาพ และข้อความก่อนบันทึก
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 800,
                  transition: "all 0.15s ease",
                }}
                title="ปิดหน้าต่าง (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Theme & Ratio Switchers */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                สไตล์และการแสดงผล:
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setTheme("paper")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "99px",
                      fontSize: "12px",
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
                    <span>Neo (สว่าง)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("noir")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "99px",
                      fontSize: "12px",
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
                    <span>Dark (มืด)</span>
                  </button>
                </div>

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
                      padding: "4px 9px",
                      borderRadius: "99px",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: "none",
                      background: photoRatio === "3:4" ? "var(--acid)" : "transparent",
                      color: photoRatio === "3:4" ? "var(--ink)" : "white",
                      transition: "all 0.15s ease",
                    }}
                    title="สัดส่วนแนวตั้ง 3:4 ตามฟีด IG ยุคใหม่"
                  >
                    3:4
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoRatio("1:1")}
                    style={{
                      padding: "4px 9px",
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
            </div>

            {/* Text Inputs for Handle, Persona, Verdict & Bio */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                ข้อความบนการ์ด (หรือคลิกแก้บนการ์ดโดยตรง):
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>ชื่อบัญชี IG</label>
                  <input
                    type="text"
                    value={customHandle}
                    onChange={(e) => handleUpdateHandle(e.target.value)}
                    placeholder="@username"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "white",
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>ฉายา Persona</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => handleUpdateTitle(e.target.value, false)}
                    onBlur={(e) => handleUpdateTitle(e.target.value, true)}
                    placeholder="ฉายาโปรไฟล์"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "white",
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>คำตัดสินโทนภาพ</label>
                  <input
                    type="text"
                    value={customVerdict}
                    onChange={(e) => handleUpdateVerdict(e.target.value)}
                    placeholder="คุมโทนเก่งมาก!"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "white",
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>คำคม Bio Remix</label>
                  <input
                    type="text"
                    value={customBioText}
                    onChange={(e) => handleUpdateBioText(e.target.value)}
                    placeholder="คำคมประจำโปรไฟล์"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      color: "white",
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Photo Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: activeSlot !== null ? "var(--acid)" : "rgba(255, 255, 255, 0.92)",
                  }}
                >
                  {activeSlot !== null
                    ? `กำลังเปลี่ยนรูปช่อง #${activeSlot + 1} (คลิกรูปด้านล่าง)`
                    : `เลือกรูปในการ์ด (${previewImages.length}/3)`}
                </span>
                {allCandidates.length > 1 && (
                  <button
                    type="button"
                    onClick={handleResetToAiBest}
                    style={{
                      background: "rgba(255, 255, 255, 0.14)",
                      color: "var(--acid)",
                      border: "1px solid rgba(217, 255, 67, 0.4)",
                      borderRadius: "99px",
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="เรียงลำดับรูปที่ดีที่สุดตามที่ AI คัดเลือก"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>AI แนะนำ</span>
                  </button>
                )}
              </div>

              {/* Photo Thumbnails */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                  scrollbarWidth: "thin",
                }}
              >
                {allCandidates.map((candidateImg, idx) => {
                  const selectedRank = previewImages.indexOf(candidateImg);
                  const isSelected = selectedRank !== -1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCandidateClick(candidateImg)}
                      title={
                        isSelected
                          ? `รูปที่ #${selectedRank + 1} ในการ์ด (คลิกเพื่อเอาออก/สลับ)`
                          : "คลิกเพื่อนำรูปนี้เข้าการ์ด"
                      }
                      style={{
                        width: "52px",
                        height: "64px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        position: "relative",
                        flexShrink: 0,
                        padding: 0,
                        cursor: "pointer",
                        background: "#171711",
                        border: isSelected
                          ? "2px solid var(--acid)"
                          : "1.5px solid rgba(255,255,255,0.3)",
                        opacity: isSelected ? 1 : 0.72,
                        transform: isSelected ? "scale(1)" : "scale(0.96)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <img
                        src={candidateImg}
                        alt={`ตัวเลือกรูปที่ ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      {isSelected && (
                        <span
                          style={{
                            position: "absolute",
                            top: "3px",
                            left: "3px",
                            background: "var(--acid)",
                            color: "#171711",
                            border: "1.5px solid #171711",
                            borderRadius: "99px",
                            fontSize: "9px",
                            fontWeight: 900,
                            fontFamily: "Manrope, sans-serif",
                            padding: "0px 4px",
                            lineHeight: 1.35,
                          }}
                        >
                          #{selectedRank + 1}
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => customPhotoInputRef.current?.click()}
                  title="อัปโหลดรูปภาพเพิ่มเติมจากเครื่องเพื่อใส่ในการ์ด"
                  style={{
                    width: "52px",
                    height: "64px",
                    borderRadius: "10px",
                    border: "1.5px dashed rgba(217, 255, 67, 0.7)",
                    background: "rgba(217, 255, 67, 0.12)",
                    color: "var(--acid)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                    flexShrink: 0,
                    cursor: "pointer",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px",
                  }}
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>+เพิ่มรูป</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
              <button
                type="button"
                onClick={downloadCard}
                disabled={isExporting}
                style={{
                  width: "100%",
                  background: "var(--acid)",
                  color: "var(--ink)",
                  border: "2px solid var(--ink)",
                  borderRadius: "14px",
                  padding: "13px 16px",
                  fontWeight: 800,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "3px 3px 0 var(--ink)",
                  transition: "all 0.15s ease",
                }}
              >
                <Download className="w-4 h-4 text-ink" />
                <span>{isExporting ? "กำลังสร้าง..." : "บันทึกภาพ PNG (1080x1920)"}</span>
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={copyCardImage}
                  disabled={isExporting}
                  style={{
                    flex: 1,
                    background: "var(--white)",
                    color: "var(--ink)",
                    border: "2px solid var(--ink)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "2px 2px 0 var(--ink)",
                    transition: "all 0.15s ease",
                  }}
                  title="คัดลอกรูปภาพลง Clipboard เพื่อนำไปแปะใน Story ทันที"
                >
                  {copiedImage ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5 text-ink" />}
                  <span>{copiedImage ? "คัดลอกแล้ว!" : "คัดลอกรูป"}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.14)",
                    color: "white",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
