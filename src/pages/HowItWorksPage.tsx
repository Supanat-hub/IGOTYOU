import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Palette,
  LayoutGrid,
  Scale,
  Sparkles,
  ShieldCheck,
  Camera,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Lock,
  RefreshCw,
  Cpu,
  EyeOff,
  Globe,
  Server,
  UserCheck,
  HeartHandshake,
  AlertCircle,
} from "lucide-react";

interface HowItWorksPageProps {
  onBackToHome: () => void;
}

export default function HowItWorksPage({ onBackToHome }: HowItWorksPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const faqs = [
    {
      q: "IGOTYOU เข้าถึงรหัสผ่านหรือแชทส่วนตัวของฉันได้หรือไม่?",
      a: "ไม่ได้เด็ดขาด 100% ระบบของเราไม่มีการขอรหัสผ่าน, ไม่มีการขอ 2FA หรือการเชื่อมต่อ OAuth Token ใดๆ ทั้งสิ้น และไม่มีระบบสมาชิก บัญชีของคุณจึงปลอดภัย 100% ปราศจากความเสี่ยงด้านความปลอดภัย",
    },
    {
      q: "หากบัญชีของฉันเป็นส่วนตัว (Private Account) จะใช้งานได้อย่างไร?",
      a: "สามารถใช้งานได้เต็มรูปแบบ 100% โดยการสลับไปที่แท็บ 'อัปโหลดภาพหน้าจอ' เพียงแคปหน้าจอโปรไฟล์ของคุณแล้วนำมาวาง ระบบจะใช้โมเดล YOLO และ Canvas ภายในเบราว์เซอร์ของคุณเพื่อคัดแยกรูปและวิเคราะห์ โดยไม่ต้องเปิดบัญชีเป็นสาธารณะ",
    },
    {
      q: "รูปภาพในฟีดถูกคัดเลือกเป็นอันดับ #1–#3 บนการ์ด TOP CONTENT อย่างไร?",
      a: "ระบบใช้การประเมิน 2 ชั้น: ชั้นแรกวัดคุณภาพพิกเซลรายใบ (Per-Tile Aesthetic Score: มิติแสงเงา ความคมชัด และความกลมกลืนกับ Color DNA) และชั้นที่สองผสานมุมมององค์ประกอบภาพจาก Gemini Vision นอกจากนี้คุณยังมีอิสระในการกดสลับรูป หรือกด '+เพิ่มรูป' จากเครื่องเพื่อปรับแต่งการ์ดได้ตามใจชอบ 100%",
    },
    {
      q: "รูปภาพและข้อมูลของฉันจะถูกนำไปฝึกฝน (Train) โมเดล AI ต่อหรือไม่?",
      a: "ไม่มีการนำไปเทรนเด็ดขาด เราเชื่อมต่อกับ Google Gemini API ภายใต้นโยบายระดับ Enterprise & Developer Service ซึ่งมีสัญญาคุ้มครองข้อมูล Zero Data Retention ข้อมูลที่ส่งไปจะถูกประมวลผลแบบชั่วคราวในหน่วยความจำและทำลายทิ้งทันทีเมื่อส่งผลลัพธ์เสร็จสิ้น",
    },
    {
      q: "ทำไมคะแนน Aesthetic Score ของฉันจึงไม่เท่ากับเพื่อน?",
      a: "คะแนนคำนวณจากคุณสมบัติทางศิลปะจริง 3 ด้าน: ความกลมกลืนของสี (40%), จังหวะการจัดวางกริด (35%), และมิติความลึกของแสงเงา (25%) โดยมีระบบชดเชยค่าความอิ่มตัวสี (Saturation Fairness) เพื่อให้ภาพโทนสีสดใสมีชีวิตชีวาได้รับคะแนนที่ยุติธรรมเทียบเท่าฟีดมินิมอลแบบตะวันตก",
    },
    {
      q: "เกิดอะไรขึ้นหากบริการ AI ภายนอกขัดข้องหรือไม่สามารถเชื่อมต่อได้?",
      a: "ระบบจะเปิดใช้งาน 'Honest Degraded Mode' โดยอัตโนมัติ ซึ่งจะประมวลผลคะแนนจากข้อมูลพิกเซลบน Canvas ในเครื่องของคุณ 100% เพื่อให้คุณยังคงได้รับการ์ด Wrapped ที่มีข้อมูลสถิติและสีจริง โดยไม่มีการสร้างข้อมูลหรือคะแนนเท็จขึ้นมาหลอกผู้ใช้",
    },
  ];

  return (
    <section className="shell" style={{ paddingBlock: "40px 80px" }}>
      {/* Back button */}
      <div className="mb-6 sm:mb-7 max-w-[1100px] w-full mx-auto">
        <button
          onClick={onBackToHome}
          className="bg-white border-1.5 border-ink rounded-full px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:bg-paper transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับหน้าแรก</span>
        </button>
      </div>

      {/* Header & Trust Manifesto */}
      <div className="max-w-[1100px] w-full min-w-0 mb-10 sm:mb-12 mx-auto">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-purple/10 border border-purple/30 mb-3 max-w-full">
          <Sparkles className="w-3.5 h-3.5 text-purple shrink-0" />
          <span className="font-['Manrope'] font-bold text-[10px] sm:text-xs tracking-normal sm:tracking-wider text-purple uppercase break-words">
            INTERNATIONAL TRANSPARENCY & METHODOLOGY
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight my-2.5 sm:my-3 text-ink break-words">
          เบื้องหลังการทำงาน &<br className="hidden sm:inline" />ความโปร่งใสตามมาตรฐานสากล
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted leading-relaxed m-0 break-words">
          เรายึดมั่นในหลักการ <strong>Explainable AI (XAI)</strong> ตามกรอบมาตรฐานสากล NIST AI RMF และ ISO/IEC 42001
          ระบบต้องอธิบายที่มาของผลลัพธ์ได้อย่างชัดเจน ไม่ตัดสินอัตลักษณ์ส่วนบุคคล และเคารพความเป็นส่วนตัวของผู้ใช้ 100%
        </p>

        {/* 4 Quick Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 sm:mt-6 max-w-full">
          <div className="bg-white border-1.5 border-ink rounded-xl p-2.5 sm:p-3 text-center shadow-[3px_3px_0_var(--ink)] min-w-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green mx-auto mb-1 shrink-0" />
            <div className="font-bold text-[11px] sm:text-xs text-ink break-words leading-tight">Zero Retention</div>
            <div className="text-[9px] sm:text-[10px] text-muted break-words leading-tight mt-0.5">ไม่บันทึกภาพลงฐานข้อมูล</div>
          </div>
          <div className="bg-white border-1.5 border-ink rounded-xl p-2.5 sm:p-3 text-center shadow-[3px_3px_0_var(--ink)] min-w-0">
            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-purple mx-auto mb-1 shrink-0" />
            <div className="font-bold text-[11px] sm:text-xs text-ink break-words leading-tight">No Biometrics</div>
            <div className="text-[9px] sm:text-[10px] text-muted break-words leading-tight mt-0.5">ไม่ประเมินใบหน้าบุคคล</div>
          </div>
          <div className="bg-white border-1.5 border-ink rounded-xl p-2.5 sm:p-3 text-center shadow-[3px_3px_0_var(--ink)] min-w-0">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-orange mx-auto mb-1 shrink-0" />
            <div className="font-bold text-[11px] sm:text-xs text-ink break-words leading-tight">Client-Side First</div>
            <div className="text-[9px] sm:text-[10px] text-muted break-words leading-tight mt-0.5">สกัดสีบนเบราว์เซอร์คุณ</div>
          </div>
          <div className="bg-white border-1.5 border-ink rounded-xl p-2.5 sm:p-3 text-center shadow-[3px_3px_0_var(--ink)] min-w-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-acid-text mx-auto mb-1 shrink-0" />
            <div className="font-bold text-[11px] sm:text-xs text-ink break-words leading-tight">No Login Needed</div>
            <div className="text-[9px] sm:text-[10px] text-muted break-words leading-tight mt-0.5">ไม่ต้องกรอกรหัสผ่าน</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col gap-6 sm:gap-8 max-w-[1100px] w-full min-w-0 mx-auto">
        {/* Section 1: Dual Ingestion Architecture */}
        <div className="bg-white border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item w-full lg:w-[84%] lg:self-start">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-acid border-1.5 border-ink grid place-items-center font-extrabold text-xs sm:text-sm text-ink shrink-0">
              01
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-purple block font-['Manrope'] break-words leading-snug">
                DUAL INGESTION ARCHITECTURE
              </span>
              <h2 className="m-0 text-lg sm:text-xl font-bold text-ink break-words leading-snug">สถาปัตยกรรม 2 รูปแบบในการรับข้อมูล</h2>
            </div>
          </div>
          <p className="text-muted text-xs sm:text-sm leading-relaxed mb-5 break-words">
            เพื่อความยืดหยุ่นและความปลอดภัยสูงสุด ระบบรองรับ 2 ช่องทางในการประมวลผลข้อมูลโปรไฟล์ โดยผู้ใช้เป็นผู้เลือกเองอย่างโปร่งใส:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
            {/* Pipeline A: Direct Scraper */}
            <div className="border-2 border-ink rounded-2xl p-4 sm:p-5 bg-paper flex flex-col justify-between w-full min-w-0 overflow-hidden">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-xs sm:text-sm text-ink">
                    <Globe className="w-4 h-4 text-purple shrink-0" />
                    <span>วิธีที่ 1: พิมพ์ชื่อบัญชี IG</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple/15 text-purple border border-purple/30 shrink-0">
                    Direct Inspection
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-3 break-words">
                  สำหรับบัญชีสาธารณะ (Public) ระบบจะดึงข้อมูลโครงสร้าง JSON และสถิติจริง 100% จาก Instagram โดยตรง
                </p>
                <ul className="text-xs text-ink/80 space-y-1.5 pl-4 list-disc mb-4 break-words">
                  <li><strong>ตัวเลขสถิติแม่นยำ 100%:</strong> ผู้ติดตาม, กำลังติดตาม และจำนวนโพสต์ไม่คลาดเคลื่อน</li>
                  <li><strong>รูปภาพความละเอียดสูง:</strong> สกัด Avatar HD และโพสต์ล่าสุด 9–12 รูปภาพ</li>
                  <li><strong>ตรวจจับบัญชี Private อัตโนมัติ:</strong> หากเป็นบัญชีส่วนตัว ระบบจะแจ้งเตือนและแนะนำให้สลับไปใช้วิธีอัปโหลดภาพหน้าจอทันที ไม่มีการฝ่าฝืนสิทธิ์</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-ink/15 text-[11px] text-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green shrink-0" />
                <span>ประมวลผลแบบ In-Memory และทำลายทันที</span>
              </div>
            </div>

            {/* Pipeline B: On-Device Vision */}
            <div className="border-2 border-ink rounded-2xl p-4 sm:p-5 bg-paper flex flex-col justify-between w-full min-w-0 overflow-hidden">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-xs sm:text-sm text-ink">
                    <Camera className="w-4 h-4 text-green shrink-0" />
                    <span>วิธีที่ 2: อัปโหลดภาพหน้าจอ</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green/15 text-green border border-green/30 shrink-0">
                    On-Device Vision
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-3 break-words">
                  สำหรับทุกบัญชี (รองรับบัญชี Private 100%) หรือผู้ใช้ที่ไม่ต้องการเปิดเผยชื่อบัญชีในระบบเน็ตเวิร์ก
                </p>
                <ul className="text-xs text-ink/80 space-y-1.5 pl-4 list-disc mb-4 break-words">
                  <li><strong>ตรวจจับด้วย YOLO บนเบราว์เซอร์:</strong> รันโมเดล AI ผ่าน ONNX Runtime Web ในเครื่องคุณ 100%</li>
                  <li><strong>ตัดขอบภาพอัตโนมัติ:</strong> ตัดแยกเฉพาะภาพโพสต์และ Avatar ออกจาก UI ของ Instagram</li>
                  <li><strong>ปลอดภัยระดับเครื่องลูกข่าย:</strong> สกัดพิกเซลสีและวัดแสงเงาบน Browser Canvas โดยตรง</li>
                </ul>
              </div>
              <div className="pt-3 border-t border-ink/15 text-[11px] text-muted flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple shrink-0" />
                <span>สกัดสีและตัดภาพบนเครื่อง · ไร้การบันทึกลงฐานข้อมูล</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Scientific Scoring Metrics */}
        <div className="bg-white border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item w-full lg:w-[84%] lg:self-end">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs sm:text-sm shrink-0">
              02
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-green block font-['Manrope'] break-words leading-snug">
                SCIENTIFIC EVALUATION METRICS
              </span>
              <h2 className="m-0 text-lg sm:text-xl font-bold text-ink break-words leading-snug">ระบบประเมินคะแนน Aesthetic อย่างไร?</h2>
            </div>
          </div>
          <p className="text-muted text-xs sm:text-sm leading-relaxed mb-4 break-words">
            เราไม่ใช้โมเดลกล่องดำ (Black-Box) แต่คำนวณจากสัดส่วนคุณสมบัติทางศิลปะและวิทยาศาสตร์ของภาพถ่ายจริง (Visual Curation Metrics):
          </p>

          <div className="grid gap-3 sm:gap-3.5 w-full min-w-0">
            {/* Metric 1 */}
            <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4.5 bg-paper w-full min-w-0 overflow-hidden">
              <div className="flex justify-between items-start gap-2 font-bold text-xs sm:text-sm mb-1.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <Palette className="w-4 h-4 text-purple shrink-0" />
                  <span className="break-words">1. Color Harmony & Palette Cohesion (ความกลมกลืนของสี)</span>
                </span>
                <span className="text-purple font-extrabold text-sm sm:text-base shrink-0">40%</span>
              </div>
              <div className="h-2 bg-[#e0dcd2] rounded-full overflow-hidden mb-2">
                <div className="w-[40%] h-full bg-purple" />
              </div>
              <p className="m-0 text-xs text-muted leading-relaxed break-words">
                คำนวณจากความเข้ากันของกลุ่มเฉดสีบนภาพถ่ายจริงด้วย Browser Canvas ในระดับพิกเซล วัดการกระจายตัวของฮิว (Hue Dispersion) และความคงเส้นคงวาของความอิ่มสี (Saturation Consistency) เพื่อประเมินว่าฟีดของคุณคุมโทนได้สมดุลเพียงใด
              </p>
            </div>

            {/* Metric 2 */}
            <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4.5 bg-paper w-full min-w-0 overflow-hidden">
              <div className="flex justify-between items-start gap-2 font-bold text-xs sm:text-sm mb-1.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <LayoutGrid className="w-4 h-4 text-green shrink-0" />
                  <span className="break-words">2. Composition & Visual Rhythm (จังหวะการจัดวางกริด)</span>
                </span>
                <span className="text-green font-extrabold text-sm sm:text-base shrink-0">35%</span>
              </div>
              <div className="h-2 bg-[#e0dcd2] rounded-full overflow-hidden mb-2">
                <div className="w-[35%] h-full bg-green" />
              </div>
              <p className="m-0 text-xs text-muted leading-relaxed break-words">
                ประเมินจังหวะการจัดวางภาพบนตาราง 3×3 (Visual Rhythm) ตรวจสอบความสมดุลระหว่างภาพบุคคล (Portrait), ทิวทัศน์ (Landscape) และวัตถุ (Details) เพื่อให้ฟีดดูมีมิติน่าติดตาม ไม่ซ้ำซากจำเจ
              </p>
            </div>

            {/* Metric 3 */}
            <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4.5 bg-paper w-full min-w-0 overflow-hidden">
              <div className="flex justify-between items-start gap-2 font-bold text-xs sm:text-sm mb-1.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <Scale className="w-4 h-4 text-orange shrink-0" />
                  <span className="break-words">3. Contrast & Luminance Range (มิติแสงและเงา)</span>
                </span>
                <span className="text-orange font-extrabold text-sm sm:text-base shrink-0">25%</span>
              </div>
              <div className="h-2 bg-[#e0dcd2] rounded-full overflow-hidden mb-2">
                <div className="w-[25%] h-full bg-orange" />
              </div>
              <p className="m-0 text-xs text-muted leading-relaxed break-words">
                วัดค่าเบี่ยงเบนมาตรฐานของความสว่าง (Luminance Standard Deviation) ในระดับพิกเซลจริง เพื่อยืนยันว่าภาพถ่ายมี Dynamic Range ที่มีมิติ คมชัดสมบูรณ์ ไม่แบนหรือขาวซีดจนขาดรายละเอียด
              </p>
            </div>
          </div>

          {/* Graceful Degradation Note */}
          <div className="mt-4 p-3 sm:p-3.5 rounded-xl bg-purple/5 border border-purple/20 text-xs text-ink/80 flex items-start gap-2.5 w-full min-w-0">
            <RefreshCw className="w-4 h-4 text-purple shrink-0 mt-0.5" />
            <div className="leading-relaxed break-words">
              <strong>ความโปร่งใสระบบสำรอง (Honest Degradation):</strong> หากเซิร์ฟเวอร์ AI ภายนอกขัดข้อง ระบบจะปรับเข้าสู่โหมดคำนวณทางคณิตศาสตร์จากพิกเซล Canvas ในเครื่องของคุณโดยอัตโนมัติ โดยไม่มีการแต่งเติมหรือสุ่มคะแนนเท็จขึ้นมาหลอกผู้ใช้
            </div>
          </div>
        </div>

        {/* Section 3: TOP CONTENT & Human-in-the-Loop */}
        <div className="bg-white border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item w-full lg:w-[84%] lg:self-start">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs sm:text-sm shrink-0">
              03
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-purple block font-['Manrope'] break-words leading-snug">
                HUMAN-IN-THE-LOOP & USER AGENCY
              </span>
              <h2 className="m-0 text-lg sm:text-xl font-bold text-ink break-words leading-snug">การคัดเลือกรูป TOP CONTENT & สิทธิการควบคุมของผู้ใช้</h2>
            </div>
          </div>
          <div className="grid gap-4 text-xs sm:text-sm leading-relaxed text-muted w-full min-w-0">
            <p className="m-0 break-words">
              ตามหลักการ <strong>Human-in-the-Loop</strong> ผู้ใช้ต้องมีอำนาจในการควบคุมผลลัพธ์ของตัวเองเสมอ ระบบจึงออกแบบให้ AI ทำหน้าที่เป็นผู้ช่วยคัดสรรเบื้องต้น และให้คุณเป็นผู้ตัดสินใจขั้นสุดท้าย:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full min-w-0">
              <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4 bg-paper w-full min-w-0 overflow-hidden">
                <div className="font-extrabold text-ink text-xs sm:text-sm flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-purple shrink-0" />
                  <span>AI & Per-Tile Aesthetic Scoring</span>
                </div>
                <p className="m-0 text-xs text-muted leading-relaxed break-words">
                  ผสานการวิเคราะห์องค์ประกอบภาพจาก <strong>Gemini Vision</strong> เข้ากับคะแนนพิกเซลรายใบ (Per-Tile Aesthetic Score: มิติแสงเงา ความคมชัด และความเข้ากันกับ Color DNA) จัดอันดับรูปที่โดดเด่นที่สุดขึ้นเป็น <strong>#1, #2, #3</strong> โดยอัตโนมัติ
                </p>
              </div>

              <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4 bg-paper w-full min-w-0 overflow-hidden">
                <div className="font-extrabold text-ink text-xs sm:text-sm flex items-center gap-1.5 mb-1.5">
                  <UserCheck className="w-4 h-4 text-green shrink-0" />
                  <span>ปรับแต่ง สลับรูป และเพิ่มรูปได้อิสระ 100%</span>
                </div>
                <p className="m-0 text-xs text-muted leading-relaxed break-words">
                  คุณสามารถแตะสลับลำดับรูป <strong>#1–#3</strong> ได้อย่างอิสระบนการ์ดผลลัพธ์ หรือกดปุ่ม <strong>+เพิ่มรูปภาพ</strong> จากอุปกรณ์ของคุณโดยตรง เพื่อให้มั่นใจว่ารูปที่ปรากฏบนการ์ด Story สวยถูกใจคุณที่สุดก่อนส่งออก
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Ethical AI & Non-Biometric Assessment */}
        <div className="bg-white border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item w-full lg:w-[84%] lg:self-end">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs sm:text-sm shrink-0">
              04
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-orange block font-['Manrope'] break-words leading-snug">
                ETHICAL AI & RESPONSIBLE COMPUTING
              </span>
              <h2 className="m-0 text-lg sm:text-xl font-bold text-ink break-words leading-snug">จริยธรรม AI & การลดอคติเชิงอัลกอริทึม (Fairness)</h2>
            </div>
          </div>

          <div className="grid gap-3.5 text-xs sm:text-sm leading-relaxed text-muted w-full min-w-0">
            <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4.5 bg-paper w-full min-w-0 overflow-hidden">
              <div className="font-extrabold text-ink text-xs sm:text-sm flex items-center gap-2 mb-2">
                <EyeOff className="w-4 h-4 text-purple shrink-0" />
                <span>พันธสัญญาไม่ประเมินบุคคล (No Biometric / Facial Profiling)</span>
              </div>
              <p className="m-0 text-xs text-muted leading-relaxed break-words">
                ระบบของ IGOTYOU <strong>ไม่มีการสแกนใบหน้า ไม่ใช้เทคโนโลยีระบุตัวตนบุคคล และไม่ประเมินเพศ อายุ สีผิว รูปร่าง หรือชาติพันธุ์</strong> เราประเมินเฉพาะคุณสมบัติทางศิลปะของภาพถ่าย (ระดับแสงเงา ความสอดคล้องของเฉดสี และองค์ประกอบทางเรขาคณิต) เท่านั้น
              </p>
            </div>

            <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4.5 bg-paper w-full min-w-0 overflow-hidden">
              <div className="font-extrabold text-ink text-xs sm:text-sm flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-green shrink-0" />
                <span>การชดเชยค่าความอิ่มตัวสี (Saturation & Diversity Fairness)</span>
              </div>
              <p className="m-0 text-xs text-muted leading-relaxed break-words">
                โมเดล AI ส่วนใหญ่ในโลกมักถูกเทรนด้วยภาพถ่ายสไตล์ตะวันตกที่เน้นความขาวมินิมอลและสีเรียบ (Muted Tones) เราจึงพัฒนาฟังก์ชันชดเชยค่า Saturation เพื่อให้ภาพถ่ายที่มีสีสันสดใสแบบวัฒนธรรมเอเชีย (สตรีทฟู้ด คาเฟ่ ตลาดกลางคืน หรืองานเทศกาล) ได้รับคะแนนที่เป็นธรรมเทียบเท่าสไตล์มินิมอล
              </p>
            </div>

            <div className="border-1.5 border-ink rounded-2xl p-3.5 sm:p-4.5 bg-paper w-full min-w-0 overflow-hidden">
              <div className="font-extrabold text-ink text-xs sm:text-sm flex items-center gap-2 mb-2">
                <HeartHandshake className="w-4 h-4 text-orange shrink-0" />
                <span>จิตวิทยาเชิงบวกและการไม่กลั่นแกล้ง (Constructive Satire)</span>
              </div>
              <p className="m-0 text-xs text-muted leading-relaxed break-words">
                ระบบคำวิจารณ์ ไบโอรีมิกซ์ และฉายา ถูกออกแบบด้วยแนวคิด Positive Psychology เพื่อสร้างรอยยิ้ม ความสนุกสนาน และมุมมองใหม่ๆ ในการดูแลฟีดของตนเอง ไม่สนับสนุนการนำคะแนนไปเปรียบเทียบเพื่อตัดสินหรือกลั่นแกล้งผู้อื่น
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Data Privacy Lifecycle Matrix */}
        <div className="bg-white border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item w-full lg:w-[84%] lg:self-start">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-acid border-1.5 border-ink grid place-items-center font-extrabold text-xs sm:text-sm text-ink shrink-0">
              05
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-purple block font-['Manrope'] break-words leading-snug">
                DATA PRIVACY & SECURITY LIFECYCLE
              </span>
              <h2 className="m-0 text-lg sm:text-xl font-bold text-ink break-words leading-snug">ตารางวงจรชีวิตข้อมูลตามหลักสากล (GDPR / PDPA)</h2>
            </div>
          </div>
          <p className="text-muted text-xs sm:text-sm leading-relaxed mb-4 break-words">
            เราปฏิบัติตามหลักการ Data Minimization (เก็บข้อมูลน้อยที่สุดตามความจำเป็น) และ Zero-Retention (ทำลายทันทีหลังประมวลผล):
          </p>

          <div className="w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:hidden text-muted text-[11px] font-semibold">
              <span>👉 เลื่อนในแนวนอนเพื่อดูตารางทั้งหมด</span>
            </div>
            <div className="overflow-x-auto w-full max-w-full min-w-0 border-2 border-ink rounded-2xl">
              <table className="w-full min-w-[480px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-ink text-white font-['Manrope']">
                    <th className="p-3 border-r border-ink/20 font-extrabold">ชนิดข้อมูล (Data Type)</th>
                    <th className="p-3 border-r border-ink/20 font-extrabold">แหล่งที่มา</th>
                    <th className="p-3 border-r border-ink/20 font-extrabold">สถานที่ประมวลผล</th>
                    <th className="p-3 font-extrabold">ระยะเวลาจัดเก็บ (Retention)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/15 bg-white text-ink">
                  <tr>
                    <td className="p-3 font-bold border-r border-ink/15 bg-paper/50">
                      ชื่อบัญชี (@handle)
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      ผู้ใช้กรอก หรือ OCR จากภาพ
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      In-Memory Proxy ชั่วคราว
                    </td>
                    <td className="p-3 font-semibold text-green">
                      ทำลายทันที (0 วินาทีหลังวิเคราะห์)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold border-r border-ink/15 bg-paper/50">
                      ตัวเลขสถิติ (Posts, Followers)
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      Scraper หรือ OCR
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      Client Browser Session
                    </td>
                    <td className="p-3 font-semibold text-green">
                      คงอยู่เฉพาะตอนเปิดแท็บเบราว์เซอร์
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold border-r border-ink/15 bg-paper/50">
                      ภาพถ่ายโพสต์ & Avatar
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      IG Public หรือ ภาพแคปหน้าจอ
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      Browser Canvas / In-Memory API
                    </td>
                    <td className="p-3 font-semibold text-green">
                      ไม่บันทึกลงฮาร์ดดิสก์หรือฐานข้อมูลใดๆ
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold border-r border-ink/15 bg-paper/50">
                      ข้อมูลพิกเซลสี (Color DNA)
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      สกัดจากพิกเซลภาพ
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      เครื่องของผู้ใช้ 100% (Client-Side)
                    </td>
                    <td className="p-3 font-semibold text-green">
                      หายไปทันทีเมื่อรีเฟรชหน้าเว็บ
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold border-r border-ink/15 bg-paper/50">
                      รหัสผ่าน / แชท / ข้อมูลส่วนตัว
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      ไม่มีการเรียกหรือเข้าถึง
                    </td>
                    <td className="p-3 border-r border-ink/15 text-muted">
                      ไม่มีการแตะต้อง (N/A)
                    </td>
                    <td className="p-3 font-semibold text-purple">
                      ไม่จัดเก็บเด็ดขาด ปลอดภัย 100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 6: Interactive FAQ Accordion */}
        <div className="bg-white border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item w-full lg:w-[84%] lg:self-end">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs sm:text-sm shrink-0">
              06
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-green block font-['Manrope'] break-words leading-snug">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="m-0 text-lg sm:text-xl font-bold text-ink break-words leading-snug">คำถามที่พบบ่อย (FAQ)</h2>
            </div>
          </div>
          <p className="text-muted text-xs sm:text-sm leading-relaxed mb-4 break-words">
            รวบรวมข้อสงสัยยอดนิยมเกี่ยวกับความปลอดภัย การทำงานของระบบ และการนำผลลัพธ์ไปใช้งาน:
          </p>

          <div className="grid gap-2.5 sm:gap-3 w-full min-w-0">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border-1.5 border-ink rounded-2xl overflow-hidden bg-paper transition-colors w-full min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-3.5 sm:p-4 text-left font-bold text-xs sm:text-sm text-ink flex items-center justify-between gap-2.5 cursor-pointer hover:bg-paper/80 transition-colors"
                  >
                    <span className="flex items-start gap-2 min-w-0 flex-1">
                      <HelpCircle className="w-4 h-4 text-purple shrink-0 mt-0.5" />
                      <span className="break-words leading-snug">{faq.q}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-ink shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-purple" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 text-xs text-muted leading-relaxed border-t border-ink/10 animate-fadeIn break-words">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 7: Legal Disclaimer & Fair Use */}
        <div className="bg-paper border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-6 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item w-full lg:w-[84%] lg:self-start">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <AlertCircle className="w-5 h-5 text-purple shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs text-muted leading-relaxed min-w-0">
              <h3 className="m-0 text-xs sm:text-sm font-bold text-ink break-words">
                ข้อชี้แจงทางกฎหมายและเครื่องหมายการค้า (Legal Disclaimer & Fair Use Notice)
              </h3>
              <p className="m-0 break-words">
                <strong>Trademark Disclaimer:</strong> IGOTYOU เป็นโปรเจกต์อิสระที่สร้างขึ้นเพื่อการศึกษาและการวิเคราะห์เชิงศิลปะสร้างสรรค์ โดย<strong>ไม่มีส่วนเกี่ยวข้อง ไม่ได้รับการรับรอง และไม่ได้รับทุนสนับสนุนจาก Instagram, Meta Platforms, Inc.</strong> หรือบริษัทในเครือใดๆ ทั้งสิ้น เครื่องหมายการค้า Instagram และสัญลักษณ์ที่เกี่ยวข้องเป็นทรัพย์สินของ Meta Platforms, Inc.
              </p>
              <p className="m-0 break-words">
                <strong>Fair Use & Data Usage:</strong> การเข้าถึงข้อมูลโปรไฟล์สาธารณะดำเนินการภายใต้หลักการ Fair Use เพื่อการวิเคราะห์ทางศิลปะแบบ Real-time ข้อมูลทั้งหมดไม่มีการบันทึกหรือทำสำเนาลงฐานข้อมูลถาวร และไม่มีการนำข้อมูลไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาต
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tips Box */}
      <div className="mt-6 sm:mt-8 max-w-[1100px] w-full mx-auto bg-white border-2 border-ink rounded-[20px] sm:rounded-[22px] p-4 sm:p-6 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
        <div className="flex items-center gap-2 mb-2 font-extrabold text-ink text-sm sm:text-base">
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-purple shrink-0" />
          <span>ทริกการใช้งานเพื่อให้ได้ผลลัพธ์แม่นยำที่สุด</span>
        </div>
        <p className="text-muted text-xs sm:text-sm leading-relaxed m-0 break-words">
          • <strong>หากพิมพ์ชื่อ IG:</strong> ตรวจสอบว่าบัญชีของคุณตั้งค่าเป็นสาธารณะ (Public) และมีตัวสะกดถูกต้อง<br />
          • <strong>หากอัปโหลดภาพหน้าจอ:</strong> แคปหน้าจอโปรไฟล์ให้เห็น <strong>ชื่อบัญชี (@handle)</strong>, <strong>ยอดสถิติ</strong> และ <strong>กริดรูปภาพ 3–6 รูป</strong> (สำหรับบัญชี Private หรือบัญชีที่ยังไม่มีโพสต์ ระบบจะสกัดโทนสีจากรูป Avatar แทนโดยอัตโนมัติ)
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 sm:mt-10 max-w-[1100px] w-full mx-auto text-left scroll-reveal-item">
        <button
          onClick={onBackToHome}
          className="primary-button inline-flex items-center justify-center gap-2 w-auto px-6 sm:px-8 cursor-pointer hover:-translate-y-0.5 transition-all text-xs sm:text-sm"
        >
          <span>เริ่มต้นสร้าง Wrapped ของคุณเลย</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        </button>
      </div>
    </section>
  );
}
