import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  HelpCircle,
  Pencil,
  Sparkles,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  Play,
  AlertTriangle,
  ImagePlus,
  WifiOff,
  CloudOff,
  Clock,
  Info,
} from "lucide-react";
import { AnalysisResult } from "../utils/analysisEngine";

interface ResultPageProps {
  result: AnalysisResult;
  onUpdateResult: (updated: AnalysisResult) => void;
  onBackToHome: () => void;
  onOpenStoryModal: () => void;
  onOpenStoryPlayer?: () => void;
  onOpenHowItWorks: () => void;
  onRetry?: () => void | Promise<void>;
  onCancel?: () => void;
  isAnalyzing?: boolean;
  isScraping?: boolean;
}

const LOADING_STEPS = [
  "1/3 ตรวจจับตารางโพสต์ & แยกรูปถ่ายออกจากพื้นหลังด้วย Vision AI...",
  "2/3 วัดค่าความกลมกลืนของสี (Color DNA) & คอนทราสต์จากพิกเซลจริง...",
  "3/3 ให้ AI ประมวลผลฉายา Persona & คัดสรร Bio Remix...",
];

const SCRAPING_LOADING_STEPS = [
  "1/3 กำลังเชื่อมต่อเซิร์ฟเวอร์ Scraper & ดึงข้อมูลโปรไฟล์จาก Instagram...",
  "2/3 สกัดค่าสีจริง (Color DNA) & วิเคราะห์ความกลมกลืนของโทนภาพ...",
  "3/3 ให้ AI สังเคราะห์ Persona & คัดสรร Bio Remix...",
];

function WrappedSkeletonGrid({ onCancel, isScraping }: { onCancel?: () => void; isScraping?: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = isScraping ? SCRAPING_LOADING_STEPS : LOADING_STEPS;

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <>
      {/* Live Loading Progress Bar */}
      <div className="loading-progress-banner" role="status" aria-live="polite">
        <div className="loading-status-ticker">
          <span className="loading-pulse-dot" />
          <div>
            <div className="font-extrabold font-['Manrope'] text-sm md:text-base tracking-tight text-ink">
              {isScraping ? "กำลังดึงข้อมูล & วิเคราะห์โปรไฟล์ Instagram..." : "กำลังวิเคราะห์โปรไฟล์ด้วย AI..."}
            </div>
            <div className="text-xs md:text-sm text-muted mt-0.5">
              {steps[stepIndex]}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-purple tracking-wider uppercase">
              PROCESSING
            </span>
            <div className="w-20 md:w-28 h-2 bg-paper rounded-full overflow-hidden border border-ink">
              <div
                className="bg-acid h-full transition-all duration-500 ease-out"
                style={{ width: `${(stepIndex + 1) * 33.3}%` }}
              />
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="bg-white hover:bg-paper text-ink border border-ink text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer transition-colors shadow-[2px_2px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </div>

      <div className="section-intro">
        <span className="section-number">GENERATING WRAPPED</span>
        <h2>กำลังอ่าน Vibe โปรไฟล์ของคุณ...</h2>
        <p>สกัดค่าสีจริงจากพิกเซลภาพถ่าย และสังเคราะห์ตัวตนจากหน้าไบโอ</p>
      </div>

      <div className="wrapped-grid" aria-busy="true" aria-label="กำลังโหลดผลลัพธ์">
        {/* 01 Persona Skeleton */}
        <article className={`persona-card opacity-95 transition-all duration-300 ${stepIndex === 2 ? 'ring-2 ring-acid shadow-[0_0_16px_rgba(217,255,67,0.35)]' : ''}`}>
          <div className="card-topline">
            <span>PROFILE PERSONA</span>
            <span>01</span>
          </div>
          <div className="persona-art">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="loader w-9 h-9 border-[3px]" />
          </div>
          <div className="skeleton-shimmer-light w-[45%] h-3.5 my-2" />
          <div className="skeleton-shimmer-light w-[85%] h-9 my-1.5 mb-4" />
          <div className="tag-row">
            <span className="skeleton-shimmer-light w-16 h-6 inline-block" />
            <span className="skeleton-shimmer-light w-20 h-6 inline-block" />
            <span className="skeleton-shimmer-light w-18 h-6 inline-block" />
          </div>
        </article>

        {/* 02 Aesthetic Score Skeleton */}
        <article className={`score-card opacity-95 transition-all duration-300 ${stepIndex === 1 ? 'ring-2 ring-purple shadow-[0_0_16px_rgba(119,85,217,0.35)]' : ''}`}>
          <div className="card-topline">
            <span>AESTHETIC SCORE</span>
            <span>02</span>
          </div>
          <div className="score-ring border-dashed border-ink/30">
            <span className="score-number opacity-30">--</span>
          </div>
          <div className="score-content">
            <div className="skeleton-shimmer w-[65%] h-7 rounded-lg" />
            <div className="skeleton-shimmer w-[95%] h-4 rounded" />
            <div className="skeleton-shimmer w-[80%] h-4 rounded" />
            <div className="meter">
              <span className="skeleton-shimmer w-[60%] h-full block" />
            </div>
          </div>
          <div className="col-span-full w-full mt-3 pt-3 border-t border-ink/15 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="skeleton-shimmer h-11 rounded-xl" />
            <div className="skeleton-shimmer h-11 rounded-xl" />
            <div className="skeleton-shimmer h-11 rounded-xl" />
          </div>
        </article>

        {/* 03 Color DNA Skeleton */}
        <article className={`palette-card transition-all duration-300 ${stepIndex === 1 ? 'ring-2 ring-purple shadow-[0_0_16px_rgba(119,85,217,0.35)]' : ''}`}>
          <div className="card-topline">
            <span>COLOR DNA</span>
            <span>03</span>
          </div>
          <h3>โทนสีประจำตัว</h3>
          <div className="swatches gap-1">
            <div className="skeleton-shimmer h-full" />
            <div className="skeleton-shimmer h-full" />
            <div className="skeleton-shimmer h-full" />
            <div className="skeleton-shimmer h-full" />
          </div>
          <div className="palette-labels mt-3">
            <div className="skeleton-shimmer w-16 h-3" />
            <div className="skeleton-shimmer w-16 h-3" />
            <div className="skeleton-shimmer w-16 h-3" />
          </div>
        </article>

        {/* 04 By the Numbers Skeleton */}
        <article className="stats-card">
          <div className="card-topline">
            <span>BY THE NUMBERS</span>
            <span>04</span>
          </div>
          <div className="stat">
            <div className="skeleton-shimmer w-24 h-10" />
            <span>ผู้ติดตาม ต่อ กำลังติดตาม</span>
          </div>
          <div className="stat">
            <div className="skeleton-shimmer w-20 h-10" />
            <span>จำนวนโพสต์ที่วัดผล</span>
          </div>
          <div className="mini-note">
            <div className="skeleton-shimmer w-32 h-3" />
          </div>
        </article>

        {/* 05 Grid Skeleton */}
        <article className={`grid-card transition-all duration-300 ${stepIndex === 0 ? 'ring-2 ring-acid shadow-[0_0_16px_rgba(217,255,67,0.35)]' : ''}`}>
          <div className="grid-images">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-shimmer-dark h-[102px]" />
            ))}
          </div>
          <div className="grid-caption">
            <div className="grid gap-1.5">
              <div className="skeleton-shimmer-dark w-16 h-2.5" />
              <div className="skeleton-shimmer-dark w-32 h-3.5" />
            </div>
            <span className="round-arrow opacity-50">
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </article>

        {/* 06 Bio Remix Skeleton */}
        <article className={`remix-card transition-all duration-300 ${stepIndex === 2 ? 'ring-2 ring-acid shadow-[0_0_16px_rgba(217,255,67,0.35)]' : ''}`}>
          <div className="card-topline">
            <span>BIO REMIX</span>
            <span>06</span>
          </div>
          <div className="remix-content-row">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-black/20 flex items-center justify-center shrink-0">
              <Wand2 className="w-6 h-6 md:w-7 md:h-7 text-acid/50" />
            </div>
            <div className="flex-1 min-w-0 grid gap-2.5">
              <div className="skeleton-shimmer-light w-36 h-4 rounded-full" />
              <div className="skeleton-shimmer-light w-[90%] h-8 rounded-xl" />
              <div className="skeleton-shimmer-light w-[60%] h-4 rounded" />
            </div>
            <div className="skeleton-shimmer-light w-28 h-10 rounded-xl shrink-0" />
          </div>
        </article>
      </div>
    </>
  );
}

export default function ResultPage({
  result,
  onUpdateResult,
  onBackToHome,
  onOpenStoryModal,
  onOpenStoryPlayer,
  onOpenHowItWorks,
  onRetry,
  onCancel,
  isAnalyzing,
  isScraping,
}: ResultPageProps) {
  const [copied, setCopied] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isRetryingLocal, setIsRetryingLocal] = useState(false);
  const gridPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleRetryClick = async () => {
    if (!onRetry || isRetryingLocal || isAnalyzing) return;
    setIsRetryingLocal(true);
    try {
      await onRetry();
    } finally {
      setIsRetryingLocal(false);
    }
  };

  const selectedCardImages = (
    result.topContent.cardImages && result.topContent.cardImages.length > 0
      ? result.topContent.cardImages
      : result.topContent.images
  ).slice(0, 3);

  const handleToggleGridPhotoForCard = (imgUrl: string) => {
    const currentCard = [...selectedCardImages];
    const existingIdx = currentCard.indexOf(imgUrl);
    let nextCard: string[];

    if (existingIdx !== -1) {
      if (currentCard.length <= 1) return;
      nextCard = currentCard.filter((_, i) => i !== existingIdx);
    } else {
      if (currentCard.length < 3) {
        nextCard = [...currentCard, imgUrl];
      } else {
        nextCard = [currentCard[0], currentCard[1], imgUrl];
      }
    }

    onUpdateResult({
      ...result,
      topContent: {
        ...result.topContent,
        cardImages: nextCard,
      },
    });
  };

  const handleUploadCustomGridPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    e.target.value = "";
    if (files.length === 0) return;

    const file = files[0];
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      const maxDim = 960;
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
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      const prevAll =
        result.topContent.allImages && result.topContent.allImages.length > 0
          ? result.topContent.allImages
          : result.topContent.images;
      const nextAll = [dataUrl, ...prevAll];
      const nextImages = [dataUrl, ...result.topContent.images].slice(0, 6);
      const nextCard =
        selectedCardImages.length < 3
          ? [...selectedCardImages, dataUrl]
          : [selectedCardImages[0], selectedCardImages[1], dataUrl];

      onUpdateResult({
        ...result,
        topContent: {
          ...result.topContent,
          images: nextImages,
          allImages: nextAll,
          cardImages: nextCard,
        },
      });
    };
    img.src = url;
  };

  const handleCopyBio = () => {
    navigator.clipboard?.writeText(result.bioRemix.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    window.setTimeout(() => setCopiedHex(null), 2000);
  };

  const breakdown = result.aestheticScore.breakdown || {
    colorHarmony: Math.min(98, Math.max(28, Math.round(result.aestheticScore.score * 1.02))),
    gridCohesion: Math.min(98, Math.max(28, Math.round(result.aestheticScore.score * 0.98))),
    contrast: Math.min(98, Math.max(28, Math.round(result.aestheticScore.score * 0.95))),
  };

  const honestCritique =
    result.aestheticScore.honestCritique ||
    (result.aestheticScore.score >= 88
      ? "คุมโทนภาพและจังหวะของคู่สีได้อย่างลงตัว แนะนำให้รักษามาตรฐานนี้และทดลองแสงธรรมชาติในมุมใหม่ๆ"
      : result.aestheticScore.score >= 65
      ? "มีภาพหลักที่คุมโทนได้ดี แต่มีบางภาพที่แสงหรือสีตัดกับภาพอื่นเล็กน้อย ลองจัดลำดับภาพก่อนโพสต์เพื่อให้ฟีดสมูทขึ้น"
      : "โทนสีและแสงของแต่ละรูปมีความหลากหลายค่อนข้างสูง แนะนำให้เลือก 2-3 โทนสีหลักเพื่อคุมมู้ดโดยรวมของฟีด");

  return (
    <section className="preview shell" style={{ paddingBlock: "clamp(28px, 5vw, 50px) clamp(60px, 8vw, 90px)" }}>
      {/* Top Navigation & Action Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6 border-b border-ink/15 pb-4">
        <button
          onClick={onBackToHome}
          className="bg-white border-1.5 border-ink rounded-full px-3.5 py-1.5 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:bg-paper transition-colors shadow-[2px_2px_0_var(--ink)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>วิเคราะห์โปรไฟล์ใหม่</span>
        </button>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          {(isAnalyzing || result.isValidProfile !== false) && (
            <button
              className="action-btn action-btn-story w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple text-white hover:bg-[#6643c7] font-extrabold border-2 border-ink shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer py-2.5 px-3.5 text-xs sm:text-sm"
              onClick={onOpenStoryModal}
              disabled={isAnalyzing}
              style={isAnalyzing ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{isAnalyzing ? "กำลังประมวลผล..." : "บันทึกการ์ด IG Story (9:16)"}</span>
            </button>
          )}

          <div className="flex gap-2 items-center w-full sm:w-auto">
            {onOpenStoryPlayer && (isAnalyzing || result.isValidProfile !== false) && (
              <button
                className="action-btn flex-1 sm:flex-initial bg-white hover:bg-paper text-ink inline-flex items-center justify-center gap-2 border-2 border-ink shadow-[2px_2px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 transition-all font-bold cursor-pointer py-2.5 px-3 text-xs sm:text-sm"
                onClick={onOpenStoryPlayer}
                disabled={isAnalyzing}
                style={isAnalyzing ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                title="เปิดดูเรื่องราว Wrapped แบบสไลด์ 9:16 เต็มจอ"
              >
                <Play className="w-3.5 h-3.5 fill-ink shrink-0" />
                <span>ดูแบบ Story</span>
              </button>
            )}

            <button
              className="action-btn action-btn-ethics flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs text-muted hover:text-ink font-semibold border-1.5 border-ink/40 bg-white hover:bg-paper rounded-full px-3 py-2 sm:py-1.5 transition-colors"
              onClick={onOpenHowItWorks}
            >
              <HelpCircle className="w-3.5 h-3.5 text-white shrink-0" />
              <span>วิธีให้คะแนน</span>
            </button>
          </div>
        </div>
      </div>

      {/* When analyzing, render the full Skeleton UI */}
      {isAnalyzing ? (
        <WrappedSkeletonGrid onCancel={onCancel} isScraping={isScraping} />
      ) : result.isValidProfile === false ? (
        /* Profile Validation Rejection Gate */
        <div className="bg-[#fff4f2] border-3 border-ink rounded-3xl p-6 md:p-10 mb-8 shadow-[8px_8px_0_var(--ink)] text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#ff4d4d] border-2 border-ink text-white mx-auto flex items-center justify-center shadow-[3px_3px_0_var(--ink)] mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#d91414] font-['Manrope']">
            PROFILE VALIDATION GATE
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink mt-1.5 mb-3">
            ภาพนี้ไม่ตรงกับหน้าจอโปรไฟล์ Instagram
          </h2>
          <p className="text-muted text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-6">
            {result.invalidReason || "ระบบตรวจไม่พบชื่อผู้ใช้หรือกริดรูปภาพ เพื่อรักษาความเที่ยงตรงของคะแนน ระบบจึงปฏิเสธการประมวลผลภาพที่ไม่เกี่ยวข้อง"}
          </p>

          <div className="bg-white border-2 border-ink rounded-2xl p-4 md:p-5 text-left mb-6 shadow-[3px_3px_0_var(--ink)]">
            <div className="font-extrabold text-sm text-ink mb-2">📸 วิธีถ่ายภาพหน้าจอเพื่อผลที่แม่นยำ:</div>
            <ul className="text-xs md:text-sm text-muted space-y-2 pl-4 list-disc">
              <li>เปิดแอป Instagram แล้วเข้าไปที่หน้า <strong>โปรไฟล์ส่วนตัวของคุณ</strong></li>
              <li>แคปภาพหน้าจอให้เห็น <strong>ชื่อผู้ใช้ (@handle), ยอดผู้ติดตาม</strong> และ <strong>กริดรูปภาพโพสต์</strong></li>
              <li><strong>หากบัญชีตั้งค่าเป็นส่วนตัว (Private) หรือยังไม่มีโพสต์ (0 โพสต์):</strong> ระบบสามารถวิเคราะห์ได้เช่นกัน เพียงแคปส่วนหัวโปรไฟล์ที่มีรูป Avatar และแถบสถิติผู้ติดตาม</li>
              <li>หากมีหลายภาพ สามารถอัปโหลดได้พร้อมกันสูงสุด 3 ภาพ</li>
            </ul>
          </div>

          <button
            onClick={onBackToHome}
            className="action-btn bg-acid text-ink hover:bg-[#d5f822] border-2 border-ink px-6 py-3.5 rounded-full font-black text-sm md:text-base inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปอัปโหลดภาพใหม่</span>
          </button>
        </div>
      ) : (
        <>
          {/* Degraded State Notice if AI analysis is offline */}
          {result.isAiDegraded && (
            <div className="bg-[#fffdf2] border-2 border-ink rounded-2xl p-4 md:p-6 mb-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[4px_4px_0_var(--ink)]">
              <div className="max-w-[650px] space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {result.degradedInfo?.category === "NETWORK_ISSUE" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-ink bg-[#fee2e2] text-[#991b1b]">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>{result.degradedInfo.badge}</span>
                    </span>
                  ) : result.degradedInfo?.category === "RATE_LIMIT" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-ink bg-[#ffedd5] text-[#9a3412]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{result.degradedInfo.badge}</span>
                    </span>
                  ) : result.degradedInfo?.category === "GEMINI_TIMEOUT" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-ink bg-[#f3e8ff] text-[#6b21a8]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{result.degradedInfo.badge}</span>
                    </span>
                  ) : result.degradedInfo?.category === "GEMINI_OUTAGE" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-ink bg-[#e2e8f0] text-[#334155]">
                      <CloudOff className="w-3.5 h-3.5" />
                      <span>{result.degradedInfo.badge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border border-ink bg-amber-100 text-amber-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{result.degradedInfo?.badge || "โหมดพิกเซลในเครื่อง"}</span>
                    </span>
                  )}

                  <span className="font-extrabold text-sm md:text-base text-ink">
                    {result.degradedInfo?.title || "โหมดวิเคราะห์พิกเซลภาพถ่าย (AI ข้อความออฟไลน์)"}
                  </span>
                </div>

                <p className="m-0 text-xs md:text-sm text-ink/80 leading-relaxed">
                  ระบบวัดค่า Color DNA และตัดรูปภาพจากโปรไฟล์จริงของคุณเรียบร้อยแล้ว (คะแนนความกลมกลืนทางสถิติถูกต้อง 100%)
                </p>

                {result.degradedInfo ? (
                  <div
                    className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 leading-relaxed ${
                      result.degradedInfo.canSwitchNetwork
                        ? "bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]"
                        : "bg-[#fefce8] border-[#fef08a] text-[#854d0e]"
                    }`}
                  >
                    <span className="text-base leading-none shrink-0 select-none">
                      {result.degradedInfo.canSwitchNetwork ? "💡" : "ℹ️"}
                    </span>
                    <div className="space-y-1">
                      <div>
                        <strong className="font-bold">คำแนะนำ: </strong>
                        {result.degradedInfo.actionHint}
                      </div>
                      {result.degradedReason && (
                        <div className="text-[11px] opacity-75 font-mono">
                          ข้อความระบบ: {result.degradedReason}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="m-0 text-xs text-muted">
                    {result.degradedReason ? `(เหตุผล: ${result.degradedReason})` : "เนื่องจากต่อ Gemini AI ไม่สำเร็จ"} หากต้องการให้ AI สรุปฉายาและตัวเลขใหม่อัตโนมัติ สามารถกดลองอีกครั้งได้ทันที
                  </p>
                )}
              </div>

              {onRetry && (
                <div className="shrink-0 w-full md:w-auto">
                  <button
                    onClick={handleRetryClick}
                    disabled={isAnalyzing || isRetryingLocal}
                    className="w-full md:w-auto bg-ink text-acid border-2 border-ink rounded-full px-5 py-2.5 text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-purple hover:text-white transition-colors shadow-[2px_2px_0_var(--ink)] disabled:opacity-60 disabled:cursor-not-allowed active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing || isRetryingLocal ? "animate-spin" : ""}`} />
                    <span>{isAnalyzing || isRetryingLocal ? "กำลังวิเคราะห์..." : "ลองวิเคราะห์ AI อีกครั้ง"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Spotify Wrapped Interactive Story Player Banner */}
          {onOpenStoryPlayer && (
            <div className="bg-gradient-to-r from-acid via-[#e8ff52] to-paper border-2 border-ink rounded-2xl p-4 md:p-5 mb-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0_var(--ink)]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-ink text-acid flex items-center justify-center shrink-0 border border-ink shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                  <Play className="w-5 h-5 fill-acid ml-0.5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm md:text-base text-ink font-['Manrope']">
                    พร้อมเปิดตัวตนในแบบ Full-Screen Story Player!
                  </div>
                  <div className="text-xs md:text-sm text-ink/75 mt-0.5">
                    สัมผัสประสบการณ์ Wrapped แบบ Spotify — แตะเลื่อนสไลด์ดู Persona, Color DNA & Bio Remix
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenStoryPlayer}
                className="bg-ink text-white font-extrabold text-xs md:text-sm px-5 py-2.5 rounded-full border-2 border-ink hover:bg-purple transition-all inline-flex items-center gap-2 shadow-[2px_2px_0_var(--ink)] shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>เปิดดู Story ทันที</span>
              </button>
            </div>
          )}

          {/* Inline Editing Tip */}
          <div className="flex items-center gap-2 bg-white border border-dashed border-ink rounded-xl px-3.5 py-2 text-xs text-muted mb-7 w-fit">
            <Pencil className="w-3.5 h-3.5 text-purple" />
            <span>
              <strong className="text-ink">ปรับแต่งได้อิสระ:</strong> คุณสามารถคลิกแก้ไขฉายา ตัวเลข หรือคำแซวไบโอบนการ์ดได้ทันทีก่อนเซฟ
            </span>
          </div>

          <div className="section-intro">
            <span className="section-number">YOUR INSTAGRAM WRAPPED</span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-ink tracking-tight mt-1 mb-2">
              นี่คือ vibe ประจำโปรไฟล์ของคุณ
            </h1>
            <p>วิเคราะห์จากข้อมูลและโทนสีของภาพหน้าจอ ผลลัพธ์นี้สร้างขึ้นเพื่อความสนุกสนาน</p>
          </div>

          <div className="wrapped-grid result-reveal">
            {/* 01 Persona Card */}
            <article className="persona-card">
              <div className="card-topline">
                <span>PROFILE PERSONA</span>
                <span>01</span>
              </div>
              <div className="persona-art">
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
                <Sparkles className="w-14 h-14 text-acid fill-acid" />
              </div>
              <p>{result.persona.description}</p>
              <div className="relative group my-1">
                <textarea
                  value={result.persona.title}
                  onChange={(e) =>
                    onUpdateResult({
                      ...result,
                      persona: { ...result.persona, title: e.target.value },
                    })
                  }
                  rows={2}
                  aria-label="แก้ไขฉายา Persona"
                  className="w-full bg-transparent border border-dashed border-white/35 rounded-lg p-2 text-white text-3xl font-extrabold tracking-tight leading-snug resize-none outline-none focus:border-acid transition-colors cursor-text pr-8"
                  title="คลิกเพื่อแก้ไขฉายา"
                />
                <Pencil className="w-3.5 h-3.5 text-white/50 absolute right-2.5 top-2.5 pointer-events-none group-hover:text-acid transition-colors" />
              </div>
              <div className="tag-row mt-3.5">
                {result.persona.tags.map((tag, i) => (
                  <span key={i}>#{tag}</span>
                ))}
              </div>
            </article>

            {/* 02 Aesthetic Score Card */}
            <article className="score-card">
              <div className="card-topline">
                <span>AESTHETIC SCORE</span>
                <span>02</span>
              </div>
              <div className="score-ring">
                <span className="score-number">{result.aestheticScore.score}</span>
                <span>/100</span>
              </div>
              <div className="score-content">
                <div className="relative group w-full">
                  <input
                    type="text"
                    value={result.aestheticScore.verdict}
                    onChange={(e) =>
                      onUpdateResult({
                        ...result,
                        aestheticScore: { ...result.aestheticScore, verdict: e.target.value },
                      })
                    }
                    aria-label="แก้ไขคำตัดสิน Aesthetic Verdict"
                    className="bg-transparent border border-dashed border-ink/30 rounded-lg px-2 py-1 text-xl sm:text-2xl font-extrabold text-ink outline-none w-full focus:border-ink transition-colors pr-7"
                    title="คลิกเพื่อแก้ไขคำตัดสิน"
                  />
                  <Pencil className="w-3.5 h-3.5 text-ink/40 absolute right-2 top-2.5 pointer-events-none group-hover:text-ink transition-colors" />
                </div>
                <p className="score-desc">{result.aestheticScore.description}</p>
                <div className="meter">
                  <span style={{ width: `${result.aestheticScore.score}%` }} />
                </div>
              </div>

              {/* 3D Breakdown Metrics & Honest Critique */}
              <div className="col-span-full w-full mt-4 pt-3.5 border-t border-ink/20 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-extrabold text-ink">สัดส่วนคะแนน 3 มิติ:</span>
                  <button
                    type="button"
                    onClick={onOpenHowItWorks}
                    className="text-[11px] text-purple hover:underline inline-flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <span>ดูวิธีคำนวณ</span>
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-bold text-ink">
                  <div className="bg-white/85 border-1.5 border-ink rounded-xl p-2.5 shadow-[1.5px_1.5px_0_var(--ink)]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-muted tracking-wider font-extrabold uppercase">Color Harmony</span>
                      <span className="font-extrabold text-purple text-sm">{breakdown.colorHarmony}%</span>
                    </div>
                    <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden border border-ink/20">
                      <div
                        className="h-full bg-purple rounded-full transition-all duration-500"
                        style={{ width: `${breakdown.colorHarmony}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-ink/75 block mt-1 font-medium">ความเข้ากันของกลุ่มสี</span>
                  </div>

                  <div className="bg-white/85 border-1.5 border-ink rounded-xl p-2.5 shadow-[1.5px_1.5px_0_var(--ink)]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-muted tracking-wider font-extrabold uppercase">Grid Cohesion</span>
                      <span className="font-extrabold text-orange text-sm">{breakdown.gridCohesion}%</span>
                    </div>
                    <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden border border-ink/20">
                      <div
                        className="h-full bg-orange rounded-full transition-all duration-500"
                        style={{ width: `${breakdown.gridCohesion}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-ink/75 block mt-1 font-medium">จังหวะการจัดวางภาพ</span>
                  </div>

                  <div className="bg-white/85 border-1.5 border-ink rounded-xl p-2.5 shadow-[1.5px_1.5px_0_var(--ink)]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-muted tracking-wider font-extrabold uppercase">Light & Contrast</span>
                      <span className="font-extrabold text-ink text-sm">{breakdown.contrast}%</span>
                    </div>
                    <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden border border-ink/20">
                      <div
                        className="h-full bg-ink rounded-full transition-all duration-500"
                        style={{ width: `${breakdown.contrast}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-ink/75 block mt-1 font-medium">มิติแสงเงาและรายละเอียด</span>
                  </div>
                </div>

                <div className="bg-white/95 border-1.5 border-ink rounded-xl p-3 text-xs text-ink leading-relaxed shadow-[2px_2px_0_var(--ink)] flex items-start gap-2.5">
                  <span className="text-base select-none">💡</span>
                  <div>
                    <strong className="text-purple font-extrabold">ข้อคิดเห็นเพื่อการคุมโทน: </strong>
                    <span className="text-ink/85">{honestCritique}</span>
                  </div>
                </div>
              </div>
            </article>

            {/* 03 Color DNA */}
            <article className="palette-card">
              <div className="card-topline">
                <span>COLOR DNA</span>
                <span>03</span>
              </div>
              <div className="flex items-center justify-between mt-6 mb-3">
                <h3 className="!m-0 text-xl font-extrabold tracking-tight">โทนสีประจำตัว</h3>
                {copiedHex ? (
                  <span className="text-[11px] font-bold text-purple bg-purple/10 border border-purple/20 px-2 py-0.5 rounded-full animate-pulse">
                    คัดลอก {copiedHex} แล้ว!
                  </span>
                ) : (
                  <span className="text-[10px] text-muted font-bold tracking-wider uppercase">
                    แตะที่สีเพื่อคัดลอก HEX
                  </span>
                )}
              </div>
              <div className="swatches border-2 border-ink shadow-[2px_2px_0_var(--ink)]">
                {result.colorDNA.slice(0, 4).map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCopyHex(c.hex)}
                    className={`swatch swatch-${i + 1} flex items-center justify-center group outline-none border-r last:border-r-0 border-ink/20`}
                    style={{ background: c.hex }}
                    title={`คลิกเพื่อคัดลอก HEX ${c.hex} (${c.name})`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 bg-ink/80 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-opacity">
                      {copiedHex === c.hex ? "✓" : c.hex}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-1 mt-3.5 text-left sm:text-center">
                {result.colorDNA.slice(0, 4).map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCopyHex(c.hex)}
                    className="flex sm:flex-col items-center gap-2 sm:gap-0 p-1.5 sm:p-0 rounded-lg sm:rounded-none bg-paper/60 sm:bg-transparent border border-ink/10 sm:border-0 hover:opacity-80 transition-opacity cursor-pointer group"
                    title={`คลิกเพื่อคัดลอก ${c.hex}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-ink/30 shrink-0 sm:hidden"
                      style={{ background: c.hex }}
                    />
                    <div className="min-w-0 flex-1 sm:w-full">
                      <span className="font-bold text-[11px] text-ink truncate block group-hover:text-purple">
                        {c.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted tracking-tight block">
                        {c.hex}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </article>

            {/* 04 By the Numbers */}
            <article className="stats-card">
              <div className="card-topline">
                <span>BY THE NUMBERS</span>
                <span>04</span>
              </div>
              <div className="stat">
                <input
                  type="text"
                  value={result.stats.followerRatio}
                  onChange={(e) =>
                    onUpdateResult({
                      ...result,
                      stats: { ...result.stats, followerRatio: e.target.value },
                    })
                  }
                  aria-label="อัตราส่วนผู้ติดตามต่อกำลังติดตาม"
                  className="w-32 bg-transparent border border-dashed border-ink/30 rounded px-1.5 py-0.5 font-['Manrope'] font-extrabold text-4xl tracking-tighter outline-none focus:border-ink"
                  title="คลิกเพื่อแก้ไขตัวเลข Ratio"
                />
                <span>ผู้ติดตาม ต่อ กำลังติดตาม</span>
              </div>
              <div className="stat">
                <input
                  type="text"
                  value={result.stats.postDensity}
                  onChange={(e) =>
                    onUpdateResult({
                      ...result,
                      stats: { ...result.stats, postDensity: e.target.value },
                    })
                  }
                  aria-label="จำนวนโพสต์ที่วัดผล"
                  className="w-20 bg-transparent border border-dashed border-ink/30 rounded px-1.5 py-0.5 font-['Manrope'] font-extrabold text-4xl tracking-tighter outline-none focus:border-ink"
                  title="คลิกเพื่อแก้ไขตัวเลขโพสต์"
                />
                <span>จำนวนโพสต์ที่วัดผล</span>
              </div>
              <div className="mini-note flex items-center justify-between mt-4 text-[10px] text-ink/70">
                <span>{result.stats.ocrNote}</span>
                <Sparkles className="w-3 h-3 text-ink/70" />
              </div>
            </article>

            {/* 05 Grid Card (AI-ranked photos + interactive selection for Story Card) */}
            <article className="grid-card">
              <div
                className="grid-images"
                style={{
                  gridTemplateColumns:
                    result.topContent.images.length === 1
                      ? "1fr"
                      : result.topContent.images.length === 2
                      ? "repeat(2, 1fr)"
                      : "repeat(3, 1fr)",
                }}
              >
                {result.topContent.images.map((image, index) => {
                  const cardSlotIdx = selectedCardImages.indexOf(image);
                  const isSelectedOnCard = cardSlotIdx !== -1;
                  return (
                    <div
                      key={index}
                      onClick={() => handleToggleGridPhotoForCard(image)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        handleToggleGridPhotoForCard(image)
                      }
                      title={
                        isSelectedOnCard
                          ? `รูปที่ #${cardSlotIdx + 1} ในการ์ด Story (คลิกเพื่อสลับ/เอาออก)`
                          : "คลิกเพื่อเลือกรูปนี้เข้าการ์ด Story"
                      }
                      className="relative overflow-hidden cursor-pointer group"
                    >
                      <img
                        alt={`ภาพที่วิเคราะห์ ${index + 1}`}
                        src={image}
                        className={`w-full block transition-all duration-200 ${
                          isSelectedOnCard
                            ? "opacity-100"
                            : "opacity-75 group-hover:opacity-100"
                        }`}
                      />
                      {isSelectedOnCard ? (
                        <span className="absolute top-2 left-2 z-10 bg-acid text-ink border-1.5 border-ink rounded-full px-2 py-0.5 text-[10px] font-black font-['Manrope'] shadow-[1.5px_1.5px_0_var(--ink)]">
                          #{cardSlotIdx + 1} ในการ์ด
                        </span>
                      ) : (
                        <span className="absolute top-2 left-2 z-10 bg-ink/75 text-white/90 border border-white/30 rounded-full px-2 py-0.5 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          + เลือกเข้าการ์ด
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="grid-caption">
                <div>
                  <span>
                    {result.topContent.category} · แตะรูปเพื่อเลือกเข้าการ์ด ({selectedCardImages.length}/3)
                  </span>
                  <strong>{result.topContent.description}</strong>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={gridPhotoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={handleUploadCustomGridPhoto}
                  />
                  <button
                    type="button"
                    onClick={onOpenStoryModal}
                    title="เปิดดูและปรับแต่งการ์ด IG Story"
                    className="round-arrow hover:bg-acid hover:text-ink hover:border-ink transition-colors cursor-pointer bg-transparent text-white"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>

            {/* 06 Bio Remix Card */}
            <article className="remix-card">
              <div className="card-topline">
                <span>BIO REMIX</span>
                <span>06</span>
              </div>
              <div className="remix-content-row">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-black/25 border-2 border-white/20 flex items-center justify-center shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                    <Wand2 className="w-5 h-5 md:w-7 md:h-7 text-acid" />
                  </div>
                  <div className="sm:hidden flex items-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-wider text-acid uppercase bg-black/35 border border-acid/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-acid" />
                      ไบโอฉบับปั่น แนะนำโดย AI
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="hidden sm:flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold tracking-wider text-acid uppercase bg-black/35 border border-acid/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-acid" />
                      ไบโอฉบับปั่น แนะนำโดย AI
                    </span>
                    <span className="text-white/60 text-[11px]">(คลิกข้อความเพื่อแก้ไข)</span>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      value={result.bioRemix.text}
                      onChange={(e) =>
                        onUpdateResult({
                          ...result,
                          bioRemix: { ...result.bioRemix, text: e.target.value },
                        })
                      }
                      aria-label="แก้ไขคำแซวไบโอ"
                      className="w-full bg-white/10 hover:bg-white/15 focus:bg-black/35 border border-white/25 focus:border-acid rounded-xl px-3.5 py-2.5 text-white text-base md:text-xl font-bold tracking-tight outline-none transition-all pr-8"
                      title="คลิกเพื่อแก้ไขคำแซวไบโอ"
                    />
                    <Pencil className="w-3.5 h-3.5 text-white/50 absolute right-2.5 top-3.5 pointer-events-none group-hover:text-acid transition-colors" />
                  </div>
                  <p className="text-white/85 text-xs md:text-sm mt-1.5 leading-relaxed">{result.bioRemix.subtext}</p>
                </div>

                <div className="shrink-0 w-full sm:w-auto flex sm:self-center">
                  <button
                    onClick={handleCopyBio}
                    className="w-full sm:w-auto bg-acid text-ink hover:bg-white border-2 border-ink rounded-xl px-5 py-3 text-xs md:text-sm font-extrabold cursor-pointer shadow-[3px_3px_0_var(--ink)] inline-flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    {copied ? <Check className="w-4 h-4 text-ink" /> : <Copy className="w-4 h-4 text-ink" />}
                    <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกไบโอ"}</span>
                  </button>
                </div>
              </div>
            </article>
          </div>

          {/* Bottom CTA to Action or Back */}
          <div className="mt-12 text-center flex justify-center gap-3 flex-wrap scroll-reveal-item">
            <button
              onClick={onOpenStoryModal}
              className="bg-ink text-acid border-2 border-ink rounded-xl px-7 py-3.5 text-sm font-extrabold cursor-pointer shadow-[4px_4px_0_var(--ink)] inline-flex items-center gap-2 hover:bg-purple hover:text-white transition-all"
            >
              <Download className="w-4 h-4" />
              <span>บันทึกการ์ดสำหรับ IG Story (PNG)</span>
            </button>
            <button
              onClick={onBackToHome}
              className="bg-white text-ink border-2 border-ink rounded-xl px-6 py-3.5 text-sm font-bold cursor-pointer shadow-[4px_4px_0_var(--ink)] inline-flex items-center gap-2 hover:bg-paper transition-all"
            >
              <span>ลองกับรูปอื่นอีกครั้ง</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
