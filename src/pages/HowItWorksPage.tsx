import React from "react";
import { ArrowLeft, ArrowRight, Palette, LayoutGrid, Scale, Sparkles } from "lucide-react";

interface HowItWorksPageProps {
  onBackToHome: () => void;
}

export default function HowItWorksPage({ onBackToHome }: HowItWorksPageProps) {
  return (
    <section className="shell" style={{ paddingBlock: "50px 90px" }}>
      {/* Back button */}
      <div className="mb-7">
        <button
          onClick={onBackToHome}
          className="bg-white border-1.5 border-ink rounded-full px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:bg-paper transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับหน้าแรก</span>
        </button>
      </div>

      {/* Header */}
      <div className="max-w-[780px] mb-12">
        <span className="font-['Manrope'] font-bold text-xs tracking-wider text-purple uppercase">
          TRANSPARENCY & METHODOLOGY
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight my-3 text-ink">
          เบื้องหลังการทำงาน &<br />ความโปร่งใสของ IGOTYOU
        </h1>
        <p className="text-lg text-muted leading-relaxed m-0">
          เราเชื่อว่าระบบ AI ที่ดีต้องอธิบายที่มาที่ไปได้ (Explainable AI) ไม่ตัดสินผู้ใช้จากรูปลักษณ์ และเคารพความเป็นส่วนตัว 100%
        </p>
      </div>

      {/* Main Pillars Grid */}
      <div className="grid gap-7 max-w-[900px]">
        {/* Pillar 1: Scoring Algorithm */}
        <div className="bg-white border-2 border-ink rounded-[20px] p-5 sm:p-8 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)]">
          <div className="flex items-center gap-3 mb-3.5">
            <span className="w-8 h-8 rounded-full bg-acid border-1.5 border-ink grid place-items-center font-extrabold text-sm text-ink">
              01
            </span>
            <h2 className="m-0 text-xl font-bold text-ink">ระบบประเมินคะแนน Aesthetic อย่างไร?</h2>
          </div>
          <p className="text-muted text-sm leading-relaxed mb-5">
            ระบบไม่ได้เดามั่วเป็น Black-box แต่ประเมินจากสัดส่วนคุณสมบัติทางศิลปะของภาพถ่าย (Visual Curation Metrics):
          </p>

          <div className="grid gap-3.5">
            <div className="border-1.5 border-ink rounded-2xl p-4 bg-paper">
              <div className="flex justify-between items-center font-bold text-sm mb-1.5">
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <Palette className="w-4 h-4 text-purple" />
                  <span>1. Color Harmony & Palette Cohesion</span>
                  {/* <span className="text-[10px] bg-white border border-ink px-2 py-0.5 rounded-full font-bold text-ink">
                    🔬 สกัดจากพิกเซลจริง (Client Canvas)
                  </span> */}
                </span>
                <span className="text-purple font-extrabold">40%</span>
              </div>
              <div className="h-2 bg-[#e0dcd2] rounded-full overflow-hidden">
                <div className="w-[40%] h-full bg-purple" />
              </div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                คำนวณจากความกลมกลืนของกลุ่มเฉดสีบนภาพถ่ายจริงด้วย Canvas (Hue Dispersion & Saturation Consistency) เพื่อดูความลงตัวของการคุมโทน
              </p>
            </div>

            <div className="border-1.5 border-ink rounded-2xl p-4 bg-paper">
              <div className="flex justify-between items-center font-bold text-sm mb-1.5">
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <LayoutGrid className="w-4 h-4 text-green" />
                  <span>2. Composition & Visual Rhythm</span>
                  {/* <span className="text-[10px] bg-acid border border-ink px-2 py-0.5 rounded-full font-bold text-ink">
                    🤖 ประเมินโดย AI (Gemini Vision)
                  </span> */}
                </span>
                <span className="text-green font-extrabold">35%</span>
              </div>
              <div className="h-2 bg-[#e0dcd2] rounded-full overflow-hidden">
                <div className="w-[35%] h-full bg-green" />
              </div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                AI มัลติโมดอลประเมินจังหวะการจัดวางภาพบนตารางกริด IG เช่น ความสมดุลระหว่างภาพวิว วัตถุ และภาพบุคคล
              </p>
            </div>

            <div className="border-1.5 border-ink rounded-2xl p-4 bg-paper">
              <div className="flex justify-between items-center font-bold text-sm mb-1.5">
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <Scale className="w-4 h-4 text-orange" />
                  <span>3. Contrast & Luminance Range</span>
                  {/* <span className="text-[10px] bg-white border border-ink px-2 py-0.5 rounded-full font-bold text-ink">
                    🔬 สกัดจากพิกเซลจริง (Client Canvas)
                  </span> */}
                </span>
                <span className="text-orange font-extrabold">25%</span>
              </div>
              <div className="h-2 bg-[#e0dcd2] rounded-full overflow-hidden">
                <div className="w-[25%] h-full bg-orange" />
              </div>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                วัดค่าเบี่ยงเบนมาตรฐานของความสว่าง (Luminance Standard Deviation) ในระดับพิกเซล เพื่อประเมินมิติและคอนทราสต์ของภาพ
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 2: AI Top Content Ranking & Card Customization */}
        <div className="bg-white border-2 border-ink rounded-[20px] p-5 sm:p-8 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)]">
          <div className="flex items-center gap-3 mb-3.5">
            <span className="w-8 h-8 rounded-full bg-green text-white border-1.5 border-ink grid place-items-center font-extrabold text-sm">
              02
            </span>
            <h2 className="m-0 text-xl font-bold text-ink">
              การคัดเลือกรูป TOP CONTENT & การปรับแต่งการ์ด
            </h2>
          </div>
          <div className="grid gap-4 text-sm leading-relaxed text-muted">
            <p className="m-0">
              แทนที่จะหยิบเพียง 3 รูปแรกสุดบนตารางฟีดแบบเรียงตามลำดับ ระบบจะคัดสรรและจัดอันดับรูปภาพที่โดดเด่นที่สุดของคุณผ่าน 2 ขั้นตอน:
            </p>
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="border-1.5 border-ink rounded-2xl p-4 bg-paper">
                <div className="font-extrabold text-ink text-sm flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-purple shrink-0" />
                  <span>1. AI & Pixel Aesthetic Ranking</span>
                </div>
                <p className="m-0 text-xs text-muted leading-relaxed">
                  ผสานการประเมินองค์ประกอบภาพจาก <strong>Gemini Vision</strong> เข้ากับค่าคุณภาพพิกเซลรายใบ (<strong>Per-Tile Aesthetic Score</strong>: มิติแสงเงา ความคมชัดตรงจุดโฟกัส และความเข้ากันกับพาเลตต์ Color DNA) เพื่อจัดอันดับรูปที่ดีที่สุดขึ้นเป็น <strong>#1, #2, #3</strong> โดยอัตโนมัติ
                </p>
              </div>
              <div className="border-1.5 border-ink rounded-2xl p-4 bg-paper">
                <div className="font-extrabold text-ink text-sm flex items-center gap-1.5 mb-1.5">
                  <LayoutGrid className="w-4 h-4 text-green shrink-0" />
                  <span>2. เลือกสลับและเพิ่มรูปในการ์ดได้เอง</span>
                </div>
                <p className="m-0 text-xs text-muted leading-relaxed">
                  คุณมีอิสระเต็มที่ในการปรับแต่งรูปที่จะนำไปโชว์บนการ์ด IG Story (9:16) สามารถแตะสลับลำดับรูป <strong>#1–#3</strong> ได้ทั้งบนการ์ด <strong>TOP CONTENT</strong> และในหน้าต่างตัวอย่างการ์ด หรือกด <strong>+เพิ่มรูป</strong> เพื่ออัปโหลดรูปโปรดจากเครื่องได้ทันที
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Aesthetic Diversity & Non-Bias */}
        <div className="bg-white border-2 border-ink rounded-[20px] p-5 sm:p-8 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)]">
          <div className="flex items-center gap-3 mb-3.5">
            <span className="w-8 h-8 rounded-full bg-purple text-white border-1.5 border-ink grid place-items-center font-extrabold text-sm">
              03
            </span>
            <h2 className="m-0 text-xl font-bold text-ink">ความหลากหลายของภาพ & การลดอคติ</h2>
          </div>
          <div className="grid gap-4 text-sm leading-relaxed text-muted">
            <p className="m-0">
              โมเดลคอมพิวเตอร์วิชันและ AI ส่วนใหญ่ในโลกมักถูกเทรนด้วยภาพถ่ายแบบตะวันตกที่เน้นความขาว มินิมอล และโทนสี Muted ซึ่งอาจมองข้ามเสน่ห์ของภาพถ่ายที่มีสีสันสดใสแบบวัฒนธรรมเอเชีย (เช่น สตรีทฟู้ด ตลาดกลางคืน หรืองานเทศกาล)
            </p>
            <div className="bg-[#f8f6f0] border-l-4 border-acid p-3.5 text-ink font-medium">
              <strong className="font-bold">การปรับสมดุลของเรา:</strong> ระบบของ IGOTYOU มีระบบชดเชยค่าความอิ่มตัวของสี (Saturation Fairness) เพื่อให้ฟีดสไตล์จัดจ้านและมีชีวิตชีวาได้รับคะแนนที่ยุติธรรมเทียบเท่าฟีดสายมินิมอล
            </div>
          </div>
        </div>

        {/* Pillar 4: Privacy First */}
        <div className="bg-white border-2 border-ink rounded-[20px] p-5 sm:p-8 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)]">
          <div className="flex items-center gap-3 mb-3.5">
            <span className="w-8 h-8 rounded-full bg-orange text-white border-1.5 border-ink grid place-items-center font-extrabold text-sm">
              04
            </span>
            <h2 className="m-0 text-xl font-bold text-ink inline-flex items-center gap-2">
              <span>นโยบายความเป็นส่วนตัว (Ephemeral Processing)</span>
            </h2>
          </div>
          <div className="grid gap-3.5 text-sm leading-relaxed text-muted">
            <p className="m-0">
              เราให้ความสำคัญสูงสุดกับความปลอดภัยและความเป็นส่วนตัวของผู้ใช้:
            </p>
            <ul className="m-0 pl-5 grid gap-2 list-disc">
              <li><strong>ตรวจจับและกรองภาพบนเครื่อง (Client-Side YOLOv11-Nano):</strong> โมเดลตรวจจับวัตถุทำงานในเบราว์เซอร์ของคุณโดยตรงเพื่อคัดกรองภาพที่ไม่ใช่โปรไฟล์ IG ออกทันที และตัดเฉพาะกรอบรูปโพสต์จริงทีละใบ (หากยังไม่มีรูปโพสต์ จะดึงสีจากรูป Avatar แทนโดยไม่ตัดพื้นที่ว่าง)</li>
              <li><strong>ประมวลผลชั่วคราว (Ephemeral Processing):</strong> ภาพหน้าจอที่ผ่านการย่อขนาดบนเบราว์เซอร์จะถูกส่งไปยัง Google Gemini API ชั่วคราวเพื่ออ่านข้อความไบโอและวิเคราะห์องค์ประกอบ แล้วทิ้งทันที</li>
              <li><strong>ไม่มีฐานข้อมูลจัดเก็บภาพ (Zero Retention):</strong> เราไม่มี Database ใดๆ ในการเก็บรูปหรือข้อมูลบัญชี Instagram ของคุณ ข้อมูลทั้งหมดประมวลผลแบบ In-Memory บนเครื่องของคุณ</li>
              <li><strong>สกัดพิกเซลสีบนเครื่องของคุณ (Client Canvas):</strong> การสกัด Color DNA และการวิเคราะห์มิติแสงเงาทำงานบน Browser Canvas ในเครื่องของคุณ 100%</li>
              <li><strong>เคารพผู้อื่น:</strong> โปรเจกต์นี้สร้างขึ้นเพื่อความสนุกสนานส่วนบุคคล ไม่สนับสนุนการนำโปรไฟล์ของผู้อื่นมาตัดสินหรือกลั่นแกล้ง</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 text-left">
        <button
          onClick={onBackToHome}
          className="primary-button inline-flex items-center justify-center gap-2 w-auto px-8 cursor-pointer"
        >
          <span>เริ่มต้นสร้าง Wrapped ของคุณเลย</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
