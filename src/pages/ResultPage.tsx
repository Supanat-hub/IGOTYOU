import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { AnalysisResult } from "../utils/analysisEngine";

interface ResultPageProps {
  result: AnalysisResult;
  onUpdateResult: (updated: AnalysisResult) => void;
  onBackToHome: () => void;
  onOpenStoryModal: () => void;
  onOpenStoryPlayer?: () => void;
  onOpenHowItWorks: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  isAnalyzing?: boolean;
}

const LOADING_STEPS = [
  "1/3 สแกนพิกัดรูปถ่าย & แยกรูปกริดออกจากพื้นหลัง...",
  "2/3 วัดค่าความกลมกลืนของสี (Color DNA) & คอนทราสต์...",
  "3/3 ให้ AI ประมวลผลฉายา Persona & คัดสรร Bio Remix...",
];

function WrappedSkeletonGrid({ onCancel }: { onCancel?: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Live Loading Progress Bar */}
      <div className="loading-progress-banner" role="status" aria-live="polite">
        <div className="loading-status-ticker">
          <span className="loading-pulse-dot" />
          <div>
            <div className="font-extrabold font-['Manrope'] text-sm md:text-base tracking-tight text-ink">
              กำลังวิเคราะห์โปรไฟล์ด้วย AI...
            </div>
            <div className="text-xs md:text-sm text-muted mt-0.5">
              {LOADING_STEPS[stepIndex]}
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
          <div className="grid gap-2.5">
            <div className="skeleton-shimmer w-[65%] h-7" />
            <div className="skeleton-shimmer w-[95%] h-4" />
            <div className="skeleton-shimmer w-[80%] h-4" />
          </div>
          <div className="meter">
            <span className="skeleton-shimmer w-[60%] h-full block" />
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
            <span>ผู้ติดตาม ต่อ 1 โพสต์</span>
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
            <span>05</span>
          </div>
          <Wand2 className="w-7 h-7 text-acid justify-self-center" />
          <div className="grid gap-2.5">
            <div className="skeleton-shimmer-light w-[85%] h-6" />
            <div className="skeleton-shimmer-light w-[55%] h-4" />
          </div>
          <div className="skeleton-shimmer-light w-28 h-9 rounded-full justify-self-end" />
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
}: ResultPageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyBio = () => {
    navigator.clipboard?.writeText(result.bioRemix.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
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
    <section className="preview shell" style={{ paddingBlock: "50px 90px" }}>
      {/* Top Navigation & Action Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-3.5 mb-7 border-b border-ink/15 pb-4">
        <button
          onClick={onBackToHome}
          className="bg-white border-1.5 border-ink rounded-full px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:bg-paper transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>วิเคราะห์โปรไฟล์ใหม่</span>
        </button>

        <div className="flex gap-2.5 flex-wrap">
          {onOpenStoryPlayer && (
            <button
              className="action-btn bg-acid text-ink hover:bg-[#d5f822] inline-flex items-center gap-2 border-2 border-ink shadow-[3px_3px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 transition-all font-black cursor-pointer"
              onClick={onOpenStoryPlayer}
              disabled={isAnalyzing}
              style={isAnalyzing ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              title="เปิดดูเรื่องราว Wrapped แบบสไลด์ 9:16 เต็มจอ"
            >
              <Play className="w-4 h-4 fill-ink" />
              <span>ดูแบบ Story Wrapped</span>
            </button>
          )}
          <button
            className="action-btn action-btn-story inline-flex items-center gap-2"
            onClick={onOpenStoryModal}
            disabled={isAnalyzing}
            style={isAnalyzing ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            <Download className="w-4 h-4" />
            <span>{isAnalyzing ? "กำลังประมวลผล..." : "บันทึกการ์ด IG Story (9:16)"}</span>
          </button>
          <button
            className="action-btn action-btn-ethics inline-flex items-center gap-2"
            onClick={onOpenHowItWorks}
          >
            <HelpCircle className="w-4 h-4" />
            <span>วิธีคำนวณคะแนน ➜</span>
          </button>
        </div>
      </div>

      {/* When analyzing, render the full Skeleton UI */}
      {isAnalyzing ? (
        <WrappedSkeletonGrid onCancel={onCancel} />
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
            <div className="font-extrabold text-sm text-ink mb-2">📸 วิธีถ่ายภาพหน้าจอเพื่อผลวิเคราะห์ที่แม่นยำ:</div>
            <ul className="text-xs md:text-sm text-muted space-y-2 pl-4 list-disc">
              <li>เปิดแอป Instagram แล้วเข้าไปที่หน้า <strong>โปรไฟล์ส่วนตัวของคุณ</strong></li>
              <li>แคปภาพหน้าจอให้เห็น <strong>ชื่อผู้ใช้ (@handle), ยอดผู้ติดตาม</strong> และ <strong>กริดรูปภาพโพสต์</strong></li>
              <li>หากมีหลายภาพ สามารถอัปโหลดได้พร้อมกันสูงสุด 3 ภาพ</li>
            </ul>
          </div>

          <button
            onClick={onBackToHome}
            className="action-btn bg-acid text-ink hover:bg-[#d5f822] border-2 border-ink px-6 py-3.5 rounded-full font-black text-sm md:text-base inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไปอัปโหลดภาพหน้าโปรไฟล์ใหม่</span>
          </button>
        </div>
      ) : (
        <>
          {/* Degraded State Notice if AI analysis is offline */}
          {result.isAiDegraded && (
            <div className="bg-[#fff9e6] border-2 border-ink rounded-2xl p-4 md:p-5 mb-7 flex justify-between items-center flex-wrap gap-3.5 shadow-[4px_4px_0_var(--ink)]">
              <div>
                <div className="flex items-center gap-2 font-extrabold text-sm text-ink">
                  <span className="text-orange text-base">●</span>
                  <span>โหมดวิเคราะห์พิกเซลภาพถ่าย (AI ข้อความออฟไลน์)</span>
                </div>
                <p className="m-0 mt-1 text-xs md:text-sm text-muted max-w-[620px] leading-relaxed">
                  ระบบวัดค่า Color DNA และตัดรูปภาพจากโปรไฟล์จริงของคุณเรียบร้อยแล้ว หากต้องการให้ AI สรุปฉายาและตัวเลขใหม่อัตโนมัติ สามารถกดลองอีกครั้ง หรือแก้ไขข้อมูลบนการ์ดได้ทันที
                </p>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isAnalyzing}
                  className="bg-ink text-acid border-2 border-ink rounded-full px-4 py-2 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 hover:bg-purple hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>{isAnalyzing ? "กำลังวิเคราะห์..." : "ลองวิเคราะห์ AI อีกครั้ง"}</span>
                </button>
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
            {result.isPresetDemo && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple text-white font-extrabold text-xs rounded-full border border-ink shadow-[2px_2px_0_var(--ink)] my-1">
                <span>✦</span>
                <span>โหมดตัวอย่าง (Preset Demo) — ไม่ได้อัปโหลดภาพจริง</span>
              </div>
            )}
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
                className="w-full bg-transparent border border-dashed border-white/35 rounded-lg p-1 text-white text-3xl font-extrabold tracking-tight leading-none resize-none outline-none focus:border-acid"
                title="คลิกเพื่อแก้ไขฉายา"
              />
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
              <div className="grid gap-1.5">
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
                  className="bg-transparent border border-dashed border-ink/30 rounded px-1.5 py-0.5 text-2xl font-extrabold text-ink outline-none w-full focus:border-ink"
                  title="คลิกเพื่อแก้ไขคำตัดสิน"
                />
                <p>{result.aestheticScore.description}</p>
              </div>
              <div className="meter">
                <span style={{ width: `${result.aestheticScore.score}%` }} />
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
              <h3>โทนสีประจำตัว</h3>
              <div className="swatches">
                {result.colorDNA.map((c, i) => (
                  <span
                    key={i}
                    className={`swatch swatch-${i + 1}`}
                    style={{ background: c.hex }}
                    title={`${c.name} (${c.hex})`}
                  />
                ))}
              </div>
              <div className="palette-labels">
                {result.colorDNA.slice(0, 3).map((c, i) => (
                  <span key={i}>{c.name}</span>
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
                  aria-label="สถิติผู้ติดตามต่อหนึ่งโพสต์"
                  className="w-20 bg-transparent border border-dashed border-ink/30 rounded px-1.5 py-0.5 font-['Manrope'] font-extrabold text-4xl tracking-tighter outline-none focus:border-ink"
                  title="คลิกเพื่อแก้ไขตัวเลขโพสต์"
                />
                <span>ผู้ติดตาม ต่อ 1 โพสต์</span>
              </div>
              <div className="mini-note flex items-center justify-between mt-4 text-[10px] text-ink/70">
                <span>{result.stats.ocrNote}</span>
                <Sparkles className="w-3 h-3 text-ink/70" />
              </div>
            </article>

            {/* 05 Grid Card (Uses real uploaded images) */}
            <article className="grid-card">
              <div className="grid-images">
                {result.topContent.images.map((image, index) => (
                  <img alt={`ภาพที่วิเคราะห์ ${index + 1}`} key={index} src={image} />
                ))}
              </div>
              <div className="grid-caption">
                <div>
                  <span>{result.topContent.category}</span>
                  <strong>{result.topContent.description}</strong>
                </div>
                <span className="round-arrow">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </article>

            {/* 06 Bio Remix Card */}
            <article className="remix-card">
              <div className="card-topline">
                <span>BIO REMIX</span>
                <span>05</span>
              </div>
              <Wand2 className="w-7 h-7 text-acid justify-self-center" />
              <div className="grid gap-1.5">
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
                  className="w-full bg-transparent border border-dashed border-white/35 rounded px-2 py-1 text-white text-2xl font-bold tracking-tight outline-none focus:border-acid"
                  title="คลิกเพื่อแก้ไขคำแซวไบโอ"
                />
                <p className="text-white/80 text-xs md:text-sm">{result.bioRemix.subtext}</p>
              </div>
              <button
                onClick={handleCopyBio}
                className="inline-flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-acid" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "คัดลอกแล้ว" : "คัดลอกไบโอ"}</span>
              </button>
            </article>
          </div>

          {/* Bottom CTA to Action or Back */}
          <div className="mt-12 text-center flex justify-center gap-3 flex-wrap">
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
