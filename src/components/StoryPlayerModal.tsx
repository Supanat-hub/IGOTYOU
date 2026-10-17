import React, { useEffect, useState, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
  Wand2,
  Palette,
  Camera,
} from "lucide-react";
import { AnalysisResult } from "../utils/analysisEngine";
import { useBodyScrollLock } from "../utils/scrollLock";

interface StoryPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisResult;
  onOpenStoryCardModal: () => void;
}

const TOTAL_SLIDES = 6;
const SLIDE_DURATION_MS = 5000;

export default function StoryPlayerModal({
  isOpen,
  onClose,
  data,
  onOpenStoryCardModal,
}: StoryPlayerModalProps) {
  useBodyScrollLock(isOpen);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100 for current slide
  const [isPaused, setIsPaused] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const lastTouchTimeRef = useRef<number>(0);
  const lastNavTimeRef = useRef<number>(0);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " ") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSlide]);

  // Auto-advancing timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    // Do not auto-advance on the last slide so user can read / click download
    if (currentSlide === TOTAL_SLIDES - 1) {
      setProgress(100);
      return;
    }

    const intervalMs = 40;
    const step = (intervalMs / SLIDE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          setCurrentSlide((curr) => Math.min(curr + 1, TOTAL_SLIDES - 1));
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentSlide]);

  if (!isOpen || data.isValidProfile === false) return null;

  const handleNext = () => {
    const now = Date.now();
    // Guard against double skip from simultaneous touch + synthetic mouse clicks
    if (now - lastNavTimeRef.current < 280) return;
    lastNavTimeRef.current = now;

    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((prev) => prev + 1);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    const now = Date.now();
    // Guard against double skip from simultaneous touch + synthetic mouse clicks
    if (now - lastNavTimeRef.current < 280) return;
    lastNavTimeRef.current = now;

    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleRestart = () => {
    setCurrentSlide(0);
    setProgress(0);
    setIsPaused(false);
  };

  const handleTouchStart = () => {
    lastTouchTimeRef.current = Date.now();
    isHoldingRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      isHoldingRef.current = true;
      setIsPaused(true);
    }, 200);
  };

  const handleTouchEnd = (tapSide: "left" | "right") => {
    lastTouchTimeRef.current = Date.now();
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    if (isHoldingRef.current) {
      setIsPaused(false);
      isHoldingRef.current = false;
      return;
    }
    setIsPaused(false);
    if (tapSide === "left") handlePrev();
    else handleNext();
  };

  const handleMouseDown = () => {
    // If a touch event was fired in the last 650ms, ignore synthetic mouse event
    if (Date.now() - lastTouchTimeRef.current < 650) return;
    isHoldingRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      isHoldingRef.current = true;
      setIsPaused(true);
    }, 200);
  };

  const handleMouseUp = (tapSide: "left" | "right") => {
    // If a touch event was fired in the last 650ms, ignore synthetic mouse event
    if (Date.now() - lastTouchTimeRef.current < 650) return;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    if (isHoldingRef.current) {
      setIsPaused(false);
      isHoldingRef.current = false;
      return;
    }
    setIsPaused(false);
    if (tapSide === "left") handlePrev();
    else handleNext();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Story Wrapped Full-Screen Player"
      className="fixed inset-0 z-[9999] bg-ink/90 backdrop-blur-md flex items-center justify-center p-0 md:p-6 select-none"
      onClick={onClose}
    >
      {/* 9:16 Story Frame Container */}
      <div
        className="w-full h-[100dvh] md:w-[420px] md:h-[840px] md:max-h-[94vh] bg-paper rounded-none md:rounded-[28px] border-0 md:border-3 border-ink relative overflow-hidden flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 2px var(--ink)",
        }}
      >
        {/* Top Progress Segment Bars */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 pt-5 bg-gradient-to-b from-black/60 via-black/20 to-transparent">
          <div className="flex gap-1.5 h-1.5 w-full">
            {Array.from({ length: TOTAL_SLIDES }).map((_, index) => {
              let fillWidth = "0%";
              if (index < currentSlide) fillWidth = "100%";
              else if (index === currentSlide) fillWidth = `${progress}%`;

              return (
                <div
                  key={index}
                  className="flex-1 h-full bg-white/35 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-acid rounded-full transition-all duration-75 ease-linear"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Bar Header Controls */}
          <div className="flex items-center justify-between mt-3 text-white">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-ink border border-acid grid place-items-center">
                <Sparkles className="w-3.5 h-3.5 text-acid fill-acid" />
              </span>
              <span className="font-extrabold text-xs tracking-wider font-['Manrope']">
                IGOTYOU WRAPPED
              </span>
              <span className="text-[10px] text-white/70">
                · {data.username || "@my.profile"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPaused((prev) => !prev)}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white grid place-items-center cursor-pointer transition-colors"
                title={isPaused ? "เล่นต่อ" : "หยุดชั่วคราว"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white grid place-items-center cursor-pointer transition-colors"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Left & Right Tap Zones for Story Navigation */}
        <div
          className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer select-none touch-none"
          onMouseDown={handleMouseDown}
          onMouseUp={() => handleMouseUp("left")}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouchEnd("left");
          }}
        />
        <div
          className="absolute inset-y-16 right-0 w-2/3 z-20 cursor-pointer select-none touch-none"
          onMouseDown={handleMouseDown}
          onMouseUp={() => handleMouseUp("right")}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleTouchEnd("right");
          }}
        />

        {/* Slide Canvas Content */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {/* SLIDE 0: PERSONA REVEAL */}
          {currentSlide === 0 && (
            <div className="w-full h-full bg-purple text-white p-5 pt-20 pb-12 sm:p-7 sm:pt-24 sm:pb-20 flex flex-col justify-between animate-fadeIn">
              <div>
                <span className="text-[11px] font-extrabold text-acid tracking-widest uppercase font-['Manrope']">
                  SLIDE 01 / PROFILE PERSONA
                </span>
                <div className="text-white/75 text-xs sm:text-sm mt-1">{data.persona.description}</div>
              </div>

              <div className="my-auto text-center flex flex-col items-center">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/25 relative flex items-center justify-center my-4 sm:my-6">
                  <div className="absolute inset-[-8px] sm:inset-[-10px] rounded-full border border-dashed border-acid/50 animate-spin" style={{ animationDuration: "16s" }} />
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-acid fill-acid animate-pulse" />
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight whitespace-pre-line text-white mt-2">
                  {data.persona.title}
                </h1>

                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-5">
                  {data.persona.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="border border-white/40 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold bg-white/10 backdrop-blur-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-center text-xs text-white/60">
                แตะขวาเพื่อดูคะแนน Aesthetic ➜
              </div>
            </div>
          )}

          {/* SLIDE 1: AESTHETIC SCORE */}
          {currentSlide === 1 && (
            <div className="w-full h-full bg-acid text-ink p-5 pt-20 pb-12 sm:p-7 sm:pt-24 sm:pb-20 flex flex-col justify-between animate-fadeIn">
              <div>
                <span className="text-[11px] font-extrabold text-purple tracking-widest uppercase font-['Manrope']">
                  SLIDE 02 / AESTHETIC AUDIT
                </span>
                <div className="text-ink/75 text-xs sm:text-sm mt-1">คะแนนการคุมโทนภาพถ่ายและองค์ประกอบ</div>
              </div>

              <div className="my-auto flex flex-col items-center text-center">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-6 sm:border-8 border-ink flex flex-col items-center justify-center shadow-[5px_5px_0_var(--ink)] sm:shadow-[6px_6px_0_var(--ink)] bg-white my-4 sm:my-6">
                  <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">Aesthetic</span>
                  <div className="font-extrabold text-5xl sm:text-6xl font-['Manrope'] tracking-tighter text-ink leading-none mt-1">
                    {data.aestheticScore.score}
                  </div>
                  <span className="text-[11px] sm:text-xs font-extrabold text-purple mt-0.5 sm:mt-1">/ 100</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1 sm:mt-2">
                  "{data.aestheticScore.verdict}"
                </h2>
                <p className="text-xs sm:text-sm text-ink/80 max-w-xs mt-2 sm:mt-3 leading-relaxed">
                  {data.aestheticScore.description}
                </p>

                {/* Score breakdown pills */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-4 sm:mt-6 text-center">
                  <div className="bg-white border border-ink rounded-xl p-2 sm:p-2.5 shadow-[2px_2px_0_var(--ink)]">
                    <div className="text-[9px] sm:text-[10px] font-bold text-muted">HARMONY</div>
                    <div className="font-extrabold text-sm sm:text-base text-purple mt-0.5">
                      {data.aestheticScore.breakdown?.colorHarmony ?? 75}%
                    </div>
                  </div>
                  <div className="bg-white border border-ink rounded-xl p-2 sm:p-2.5 shadow-[2px_2px_0_var(--ink)]">
                    <div className="text-[9px] sm:text-[10px] font-bold text-muted">COHESION</div>
                    <div className="font-extrabold text-sm sm:text-base text-green mt-0.5">
                      {data.aestheticScore.breakdown?.gridCohesion ?? 70}%
                    </div>
                  </div>
                  <div className="bg-white border border-ink rounded-xl p-2 sm:p-2.5 shadow-[2px_2px_0_var(--ink)]">
                    <div className="text-[9px] sm:text-[10px] font-bold text-muted">CONTRAST</div>
                    <div className="font-extrabold text-sm sm:text-base text-orange mt-0.5">
                      {data.aestheticScore.breakdown?.contrast ?? 65}%
                    </div>
                  </div>
                </div>

                {data.aestheticScore.honestCritique && (
                  <div className="mt-3 sm:mt-4 bg-white/90 border border-ink rounded-xl p-2 sm:p-2.5 text-xs text-ink/90 max-w-xs shadow-[2px_2px_0_var(--ink)] text-left">
                    <span className="font-extrabold text-purple block mb-0.5">💡 คำแนะนำคุมโทน:</span>
                    <span className="line-clamp-2">{data.aestheticScore.honestCritique}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-ink/60">
                แตะขวาเพื่อดู Color DNA ประจำตัว ➜
              </div>
            </div>
          )}

          {/* SLIDE 2: COLOR DNA */}
          {currentSlide === 2 && (
            <div className="w-full h-full bg-white text-ink p-5 pt-20 pb-12 sm:p-7 sm:pt-24 sm:pb-20 flex flex-col justify-between animate-fadeIn">
              <div>
                <span className="text-[11px] font-extrabold text-purple tracking-widest uppercase font-['Manrope']">
                  SLIDE 03 / SIGNATURE PALETTE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
                  โทนสีประจำตัวของคุณ
                </h2>
                <p className="text-muted text-xs mt-1">สกัดพิกเซลจริงจากรูปถ่าย IG ของคุณ</p>
              </div>

              <div className="my-auto grid gap-2.5 sm:gap-3 my-3 sm:my-4">
                {data.colorDNA.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl border-2 border-ink shadow-[3px_3px_0_var(--ink)] sm:shadow-[4px_4px_0_var(--ink)] bg-paper transition-transform hover:scale-[1.02]"
                  >
                    <div
                      className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl border-1.5 border-ink flex-shrink-0"
                      style={{ background: color.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-[11px] font-bold text-muted uppercase tracking-wider">
                        COLOR #{idx + 1}
                      </div>
                      <div className="font-extrabold text-lg sm:text-xl text-ink tracking-tight truncate">
                        {color.name}
                      </div>
                      <div className="font-mono text-xs text-muted font-bold mt-0.5">
                        {color.hex.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center text-xs text-muted">
                แตะขวาเพื่อดูสถิติและรูปภาพจริง ➜
              </div>
            </div>
          )}

          {/* SLIDE 3: STATS & PHOTO GRID */}
          {currentSlide === 3 && (
            <div className="w-full h-full bg-paper text-ink p-5 pt-20 pb-12 sm:p-7 sm:pt-24 sm:pb-20 flex flex-col justify-between animate-fadeIn">
              <div>
                <span className="text-[11px] font-extrabold text-purple tracking-widest uppercase font-['Manrope']">
                  SLIDE 04 / CURATION & NUMBERS
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mt-1">
                  ภาพถ่าย & จังหวะฟีด
                </h2>
              </div>

              <div className="my-auto">
                {/* 2 Big Stat Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="bg-orange text-white border-2 border-ink rounded-2xl p-3 sm:p-4 shadow-[3px_3px_0_var(--ink)] sm:shadow-[4px_4px_0_var(--ink)]">
                    <div className="text-2xl sm:text-3xl font-extrabold font-['Manrope'] leading-none">
                      {data.stats.followerRatio}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold opacity-85 mt-1">อัตราส่วนผู้ติดตาม</div>
                  </div>
                  <div className="bg-white text-ink border-2 border-ink rounded-2xl p-3 sm:p-4 shadow-[3px_3px_0_var(--ink)] sm:shadow-[4px_4px_0_var(--ink)]">
                    <div className="text-2xl sm:text-3xl font-extrabold font-['Manrope'] leading-none text-purple">
                      {data.stats.postDensity}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-muted mt-1">จำนวนโพสต์ที่วัดผล</div>
                  </div>
                </div>

                {/* Cropped Photo Grid Preview */}
                <div className="border-2 border-ink rounded-2xl overflow-hidden shadow-[4px_4px_0_var(--ink)] sm:shadow-[5px_5px_0_var(--ink)] bg-ink">
                  <div
                    className="grid gap-1 p-1 justify-center"
                    style={{
                      gridTemplateColumns:
                        data.topContent.images.length === 1
                          ? "minmax(0, 160px)"
                          : data.topContent.images.length === 2
                          ? "repeat(2, minmax(0, 140px))"
                          : "repeat(3, 1fr)",
                    }}
                  >
                    {data.topContent.images.slice(0, 6).map((img, idx) => (
                      <div key={idx} className="aspect-[3/4] overflow-hidden bg-black/40 rounded-lg">
                        <img
                          src={img}
                          alt="post"
                          className="w-full h-full object-cover saturate-[.85] hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 sm:p-3 bg-ink text-white flex justify-between items-center text-xs">
                    <span className="font-bold text-acid text-[11px] sm:text-xs">{data.topContent.category}</span>
                    <span className="text-white/70 truncate ml-2 text-[10px] sm:text-xs">{data.topContent.description}</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-muted">
                แตะขวาเพื่อรับ Bio Remix ➜
              </div>
            </div>
          )}

          {/* SLIDE 4: BIO REMIX */}
          {currentSlide === 4 && (
            <div className="w-full h-full bg-green text-white p-5 pt-20 pb-12 sm:p-7 sm:pt-24 sm:pb-20 flex flex-col justify-between animate-fadeIn">
              <div>
                <span className="text-[11px] font-extrabold text-acid tracking-widest uppercase font-['Manrope']">
                  SLIDE 05 / BIO REMIX
                </span>
                <div className="text-white/75 text-xs sm:text-sm mt-1">คำแซว & สรุปตัวตนแบบติดแกลม</div>
              </div>

              <div className="my-auto text-center flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border-2 border-acid flex items-center justify-center mb-4 sm:mb-6 shadow-[3px_3px_0_var(--ink)] sm:shadow-[4px_4px_0_var(--ink)]">
                  <Wand2 className="w-7 h-7 sm:w-8 sm:h-8 text-acid" />
                </div>

                <div className="font-['Manrope'] text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug tracking-tight text-white max-w-xs">
                  "{data.bioRemix.text}"
                </div>

                <div className="text-xs sm:text-sm text-white/80 mt-3 sm:mt-4 max-w-xs">
                  {data.bioRemix.subtext}
                </div>
              </div>

              <div className="text-center text-xs text-white/60">
                แตะขวาเพื่อดูการ์ดสรุปสำหรับแชร์ ➜
              </div>
            </div>
          )}

          {/* SLIDE 5: FINAL SUMMARY & DOWNLOAD */}
          {currentSlide === 5 && (
            <div className="w-full h-full bg-paper text-ink p-5 pt-20 pb-8 sm:p-6 sm:pt-24 sm:pb-8 flex flex-col justify-between animate-fadeIn overflow-y-auto">
              <div className="text-center">
                <span className="text-[11px] font-extrabold text-purple tracking-widest uppercase font-['Manrope']">
                  SLIDE 06 / YOUR WRAPPED CARD
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
                  การ์ด Wrapped ประจำปี 2026
                </h2>
                <p className="text-xs text-muted mt-0.5">พร้อมบันทึกลงเครื่องและแชร์ลง IG Story</p>
              </div>

              {/* Mini Card Preview Container */}
              <div className="my-auto p-3.5 sm:p-4 bg-white border-2 border-ink rounded-2xl shadow-[4px_4px_0_var(--ink)] sm:shadow-[6px_6px_0_var(--ink)]">
                <div className="flex justify-between items-center pb-2 border-b border-ink/10 text-xs">
                  <span className="font-extrabold font-['Manrope'] text-purple">
                    {data.username || "@my.profile"}
                  </span>
                  <span className="bg-acid px-2 py-0.5 rounded-full border border-ink font-bold text-[10px]">
                    {data.aestheticScore.score}/100
                  </span>
                </div>

                <div className="py-2.5 sm:py-3 text-center">
                  <div className="text-lg sm:text-xl font-extrabold text-ink leading-tight">
                    {data.persona.title}
                  </div>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {data.colorDNA.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border border-ink"
                        style={{ background: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-paper p-2.5 rounded-xl border border-ink/15 text-xs text-center font-medium italic text-muted">
                  "{data.bioRemix.text}"
                </div>
              </div>

              {/* Action Buttons on Final Slide */}
              <div className="grid gap-2 sm:gap-2.5 z-30 relative mt-2 sm:mt-0">
                <button
                  onClick={() => {
                    onClose();
                    onOpenStoryCardModal();
                  }}
                  className="w-full bg-ink text-acid border-2 border-ink rounded-xl py-3 sm:py-3.5 px-4 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_var(--ink)] sm:shadow-[4px_4px_0_var(--ink)] hover:bg-purple hover:text-white transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>บันทึกรูป Story (PNG 9:16)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleRestart}
                    className="flex-1 bg-white text-ink border-2 border-ink rounded-xl py-2 sm:py-2.5 px-3 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:bg-paper"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>เล่นซ้ำ</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-white text-ink border-2 border-ink rounded-xl py-2 sm:py-2.5 px-3 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0_var(--ink)] hover:bg-paper"
                  >
                    <span>ดูแบบตารางสรุป</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Navigation Arrows for Desktop */}
        <div className="hidden md:flex absolute bottom-4 inset-x-6 z-30 justify-between pointer-events-none">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="pointer-events-auto w-10 h-10 rounded-full bg-white/90 hover:bg-white text-ink border-2 border-ink grid place-items-center shadow-[2px_2px_0_var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            title="สไลด์ก่อนหน้า"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            className="pointer-events-auto w-10 h-10 rounded-full bg-white/90 hover:bg-white text-ink border-2 border-ink grid place-items-center shadow-[2px_2px_0_var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            title="สไลด์ถัดไป"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

