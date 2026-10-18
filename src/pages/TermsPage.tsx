import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Scale,
  Lock,
  FileText,
  AlertTriangle,
  EyeOff,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Globe,
  HeartHandshake,
} from "lucide-react";

interface TermsPageProps {
  onBackToHome: () => void;
  onNavigateToHowItWorks?: () => void;
}

export default function TermsPage({
  onBackToHome,
  onNavigateToHowItWorks,
}: TermsPageProps) {
  return (
    <section className="shell" style={{ paddingBlock: "50px 90px" }}>
      {/* Back button */}
      <div className="mb-7">
        <button
          onClick={onBackToHome}
          className="bg-white border-1.5 border-ink rounded-full px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:bg-paper transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับหน้าแรก</span>
        </button>
      </div>

      {/* Header */}
      <div className="max-w-[840px] w-full min-w-0 mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple/10 border border-purple/30 mb-3.5 max-w-full">
          <FileText className="w-3.5 h-3.5 text-purple shrink-0" />
          <span className="font-['Manrope'] font-bold text-[10px] sm:text-xs tracking-normal sm:tracking-wider text-purple uppercase break-words">
            LEGAL & COMPLIANCE AGREEMENT
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight my-3 text-ink break-words">
          ข้อกำหนดและเงื่อนไขการใช้งาน<br className="hidden sm:inline" /> (Terms of Use)
        </h1>
        <p className="text-xs sm:text-sm text-muted font-['Manrope'] mb-2 font-semibold">
          มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2025 • ปรับปรุงล่าสุด: ตุลาคม 2025
        </p>
        <p className="text-sm sm:text-base text-muted leading-relaxed m-0 break-words">
          กรุณาอ่านข้อกำหนดและเงื่อนไขการใช้งานฉบับนี้ ("ข้อกำหนด") โดยละเอียดก่อนเข้าใช้งานเว็บไซต์ IGOTYOU การเข้าถึงหรือใช้งานบริการนี้ถือว่าคุณได้อ่าน เข้าใจ และตกลงที่จะผูกพันตามข้อกำหนดทั้งหมดนี้ หากคุณไม่เห็นด้วยกับข้อกำหนดใดๆ กรุณายุติการใช้งานบริการนี้ทันที
        </p>
      </div>

      {/* Quick Summary Cards for 1-minute read */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8 sm:mb-10 max-w-[920px]">
        <div className="bg-white border-2 border-ink rounded-2xl p-4 shadow-[4px_4px_0_var(--ink)]">
          <Sparkles className="w-5 h-5 text-purple mb-2 shrink-0" />
          <div className="font-extrabold text-sm text-ink mb-1">เพื่อความบันเทิงและศิลปะ</div>
          <div className="text-xs text-muted leading-relaxed">
            ผลคะแนนและคำวิจารณ์มาจาก AI เพื่อความสนุกสนานและสร้างแรงบันดาลใจ ไม่ใช่การตัดสินคุณค่าบุคคล
          </div>
        </div>

        <div className="bg-white border-2 border-ink rounded-2xl p-4 shadow-[4px_4px_0_var(--ink)]">
          <ShieldCheck className="w-5 h-5 text-green mb-2 shrink-0" />
          <div className="font-extrabold text-sm text-ink mb-1">ลิขสิทธิ์ภาพเป็นของคุณ 100%</div>
          <div className="text-xs text-muted leading-relaxed">
            คุณเป็นเจ้าของภาพถ่ายเสมอ เราไม่มีฐานข้อมูลบันทึกภาพ และทำลายข้อมูลในหน่วยความจำทันที (Zero Retention)
          </div>
        </div>

        <div className="bg-white border-2 border-ink rounded-2xl p-4 shadow-[4px_4px_0_var(--ink)]">
          <Globe className="w-5 h-5 text-orange mb-2 shrink-0" />
          <div className="font-extrabold text-sm text-ink mb-1">โปรเจกต์อิสระ ไม่เกี่ยวกับ Meta</div>
          <div className="text-xs text-muted leading-relaxed">
            IGOTYOU ไม่ได้มีความเกี่ยวข้อง ได้รับการสนับสนุน หรือเป็นพันธมิตรกับ Instagram หรือ Meta Platforms, Inc.
          </div>
        </div>

        <div className="bg-white border-2 border-ink rounded-2xl p-4 shadow-[4px_4px_0_var(--ink)]">
          <HeartHandshake className="w-5 h-5 text-acid-text mb-2 shrink-0" />
          <div className="font-extrabold text-sm text-ink mb-1">ห้ามนำไปกลั่นแกล้งผู้อื่น</div>
          <div className="text-xs text-muted leading-relaxed">
            ต้องวิเคราะห์โปรไฟล์ของตนเองหรือได้รับความยินยอม ห้ามนำผลคะแนนไปใช้เพื่อการคุกคามหรือดูหมิ่นผู้อื่น
          </div>
        </div>
      </div>

      {/* Main Legal Clauses */}
      <div className="grid gap-6 sm:gap-7 max-w-[920px]">
        {/* Clause 1 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-acid border-1.5 border-ink grid place-items-center font-extrabold text-xs text-ink shrink-0">
              01
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              คำจำกัดความและวัตถุประสงค์ของบริการ (Definitions & Service Scope)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              1.1 <strong>"บริการ" (Service)</strong> หมายถึง เว็บไซต์ แอปพลิเคชัน IGOTYOU รวมถึงฟีเจอร์การสกัดสี Color DNA, การคำนวณ Aesthetic Score, การคัดเลือก TOP CONTENT, การสร้างภาพสรุป Instagram Wrapped (9:16 Story Cards) และการประมวลผลอื่นใดที่จัดทำขึ้นภายใต้โดเมนนี้
            </p>
            <p className="m-0">
              1.2 <strong>"วัตถุประสงค์"</strong> บริการนี้พัฒนาขึ้นเพื่อการวิเคราะห์คุณสมบัติทางศิลปะของภาพถ่าย (Visual Curation), การศึกษาด้านโมเดลคอมพิวเตอร์วิชัน และความบันเทิงสร้างสรรค์ส่วนบุคคลเท่านั้น ไม่ใช่บริการประเมินความน่าเชื่อถือทางเครดิต การวินิจฉัยทางจิตวิทยา การตัดสินใจรับเข้าทำงาน หรือการประเมินสถานภาพทางสังคม
            </p>
          </div>
        </div>

        {/* Clause 2 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-purple text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs shrink-0">
              02
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              ความเป็นอิสระและเครื่องหมายการค้า (Trademark & Meta Disclaimer)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              2.1 คำว่า <strong>"Instagram", "IG"</strong> โลโก้ และเครื่องหมายการค้าที่เกี่ยวข้อง เป็นทรัพย์สินทางปัญญาและเครื่องหมายการค้าจดทะเบียนของ <strong>Meta Platforms, Inc.</strong>
            </p>
            <p className="m-0">
              2.2 IGOTYOU เป็นโปรเจกต์อิสระที่สร้างสรรค์ขึ้นโดยนักพัฒนาอิสระ <strong>โดยไม่ได้เป็นพันธมิตร ไม่ได้รับการรับรอง ไม่ได้รับการสนับสนุน และไม่มีความเกี่ยวข้องอย่างเป็นทางการใดๆ กับ Instagram, Meta Platforms, Inc.</strong> หรือบริษัทในเครือ
            </p>
            <p className="m-0">
              2.3 การเข้าถึงและแสดงผลข้อมูลโปรไฟล์สาธารณะ กระทำภายใต้หลักการเข้าถึงข้อมูลสาธารณะ (Public Information Access) และหลักการใช้งานโดยชอบธรรม (Fair Use) เพื่อประโยชน์ในการสร้างสรรค์งานศิลปะและการแสดงผลสรุปข้อมูลส่วนตัวของผู้ใช้งาน
            </p>
          </div>
        </div>

        {/* Clause 3 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-green text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs shrink-0">
              03
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              คุณสมบัติของผู้ใช้และข้อตกลงการใช้งานที่ยอมรับได้ (Acceptable Use Policy)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              3.1 คุณต้องมีอายุไม่ต่ำกว่า 13 ปีบริบูรณ์ (หรือเกณฑ์อายุขั้นต่ำในการใช้บริการโซเชียลมีเดียตามกฎหมายในเขตอำนาจศาลของคุณ) จึงจะมีสิทธิ์เข้าใช้งานบริการนี้ได้
            </p>
            <p className="m-0">
              3.2 <strong>การเป็นเจ้าของหรือความยินยอม:</strong> ในการพิมพ์ชื่อบัญชีหรืออัปโหลดภาพหน้าจอโปรไฟล์ คุณรับรองและยืนยันว่าคุณเป็นเจ้าของบัญชีดังกล่าว หรือได้รับความยินยอมโดยชอบด้วยกฎหมายจากเจ้าของบัญชีในการนำข้อมูลมาประมวลผล
            </p>
            <p className="m-0 font-bold text-ink">
              3.3 พฤติกรรมต้องห้ามเด็ดขาด (Strictly Prohibited Conduct):
            </p>
            <ul className="m-0 pl-5 list-disc space-y-1.5">
              <li>ห้ามนำผลการวิเคราะห์ คะแนน หรือคำวิจารณ์ไปใช้ในการกลั่นแกล้ง (Bullying), คุกคาม (Harassment), ข่มขู่, ดูหมิ่น หรือสร้างความอับอายแก่บุคคลอื่น</li>
              <li>ห้ามนำบริการนี้ไปใช้ในการสอดแนม (Stalking) หรือละเมิดความเป็นส่วนตัวของบุคคลที่ไม่ยินยอม</li>
              <li>ห้ามส่งคำขอในปริมาณที่ผิดปกติ (Spamming, Flooding, หรือ Denial-of-Service Attacks) เพื่อมุ่งหวังให้ระบบล่มหรือขัดข้อง</li>
              <li>ห้ามพยายามเจาะระบบ แก้ไข Reverse Engineer หรือดัดแปลงซอฟต์แวร์และ API ของบริการ</li>
              <li>ห้ามนำข้อมูลหรือผลลัพธ์ไปรวบรวมเป็นฐานข้อมูลขนาดใหญ่ (Scraping harvesting) เพื่อแสวงหาผลประโยชน์ทางการค้าหรือการตลาดโดยไม่ได้รับอนุญาต</li>
            </ul>
          </div>
        </div>

        {/* Clause 4 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-orange text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs shrink-0">
              04
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              ทรัพย์สินทางปัญญาและความเป็นส่วนตัวของข้อมูล (Intellectual Property & Privacy)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              4.1 <strong>กรรมสิทธิ์ในภาพถ่าย:</strong> คุณยังคงเป็นเจ้าของสิทธิในรูปภาพและเนื้อหาที่คุณนำมาประมวลผลทุกประการ IGOTYOU ไม่ได้อ้างสิทธิ์ในความเป็นเจ้าของภาพถ่ายหรือสถิติส่วนบุคคลของคุณ
            </p>
            <p className="m-0">
              4.2 <strong>นโยบายไร้การจัดเก็บข้อมูล (Zero Retention Policy):</strong> ข้อมูลรูปภาพ สถิติ และพิกเซลสีทั้งหมด จะถูกประมวลผลแบบชั่วคราว (Ephemeral In-Memory Processing) บนเครื่องของคุณและในหน่วยความจำเซิร์ฟเวอร์ชั่วคราวเท่านั้น โดยไม่มีการบันทึก ทำสำเนา หรือจัดเก็บลงในฐานข้อมูล (Database) หรือพื้นที่จัดเก็บถาวรใดๆ
            </p>
            <p className="m-0">
              4.3 <strong>การส่งออกและการแชร์:</strong> ภาพการ์ด Wrapped (Story Card 9:16) ที่คุณดาวน์โหลดเป็นไฟล์รูปภาพ ถือเป็นสิทธิ์ของคุณในการนำไปเผยแพร่หรือแชร์บนโซเชียลมีเดียส่วนตัวตามความประสงค์ของคุณเอง
            </p>
            <p className="m-0">
              4.4 ซอร์สโค้ด, เครื่องหมายการค้า IGOTYOU, งานออกแบบ UI, และอัลกอริทึมการคำนวณ ถือเป็นทรัพย์สินทางปัญญาของผู้พัฒนาแต่เพียงผู้เดียว
            </p>
          </div>
        </div>

        {/* Clause 5 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-acid border-1.5 border-ink grid place-items-center font-extrabold text-xs text-ink shrink-0">
              05
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              ข้อจำกัดความรับผิดชอบเกี่ยวกับปัญญาประดิษฐ์ (AI & Automated Content Disclaimer)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              5.1 คะแนน Aesthetic Score, ฉายา (Persona), คำวิจารณ์ (Critique), และคำแซวไบโอ (Bio Remix) เป็นข้อความที่สร้างขึ้นโดยโมเดลปัญญาประดิษฐ์ (Google Gemini API และอัลกอริทึมคณิตศาสตร์คอมพิวเตอร์วิชัน)
            </p>
            <p className="m-0">
              5.2 ข้อความและผลวิเคราะห์ทั้งหมดถูกสร้างขึ้นในเชิง <strong>สร้างสรรค์และขบขันเชิงล้อเลียน (Constructive Satirical & Creative Humor)</strong> เพื่อความเพลิดเพลินเท่านั้น โดยไม่ได้สะท้อนข้อเท็จจริง นิสัยใจคอ คุณค่าตัวบุคคล หรือความสามารถที่แท้จริงของผู้ใช้
            </p>
            <p className="m-0">
              5.3 ผู้พัฒนาไม่รับประกันว่าผลลัพธ์จาก AI จะปราศจากข้อผิดพลาด 100% และคุณมีสิทธิ์ในการแก้ไขข้อความ ฉายา และสลับรูปภาพก่อนการแชร์ได้ด้วยตนเอง
            </p>
          </div>
        </div>

        {/* Clause 6 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-purple text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs shrink-0">
              06
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              การปฏิเสธการรับประกัน (Disclaimer of Warranties - "AS-IS")
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              6.1 บริการนี้จัดเตรียมให้ในลักษณะ <strong>"ตามสภาพที่เป็นอยู่" (AS IS)</strong> และ <strong>"ตามที่มีอยู่" (AS AVAILABLE)</strong> โดยปราศจากการรับประกันใดๆ ไม่ว่าโดยชัดแจ้งหรือโดยปริยาย
            </p>
            <p className="m-0">
              6.2 ผู้พัฒนาไม่รับประกันว่า: (ก) บริการจะทำงานได้อย่างต่อเนื่อง รวดเร็ว ปราศจากข้อผิดพลาดตลอดเวลา (ข) ผลการดึงข้อมูลโปรไฟล์จาก Instagram จะทำงานได้ 100% ตลอดเวลา เนื่องจากขึ้นอยู่กับมาตรการทางเทคนิคและการเปลี่ยนแปลงโครงสร้างเว็บไซต์ของ Instagram ซึ่งอยู่นอกเหนือการควบคุมของผู้พัฒนา
            </p>
            <p className="m-0">
              6.3 บริการนี้ไม่ต้องใช้รหัสผ่าน จึงไม่มีความเสี่ยงต่อการถูกขโมยบัญชี แต่ผู้พัฒนาไม่รับผิดชอบต่อการกระทำใดๆ ของผู้ใช้ที่ส่งผลต่อบัญชีโซเชียลมีเดียส่วนบุคคล
            </p>
          </div>
        </div>

        {/* Clause 7 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-green text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs shrink-0">
              07
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              ข้อจำกัดความรับผิด (Limitation of Liability)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              7.1 ภายใต้ขอบเขตสูงสุดที่กฎหมายอนุญาต ผู้พัฒนาและทีมงานจะไม่รับผิดชอบต่อความเสียหายใดๆ ไม่ว่าจะเป็นความเสียหายโดยตรง ความเสียหายโดยอ้อม ความเสียหายสืบเนื่อง การสูญเสียข้อมูล ความเสียหายต่อชื่อเสียง หรือความไม่พึงพอใจต่อผลการวิเคราะห์ที่สร้างขึ้นโดย AI
            </p>
            <p className="m-0">
              7.2 หากคุณไม่พึงพอใจกับส่วนใดส่วนหนึ่งของบริการหรือข้อกำหนดนี้ การเยียวยาเพียงประการเดียวของคุณคือการยุติการใช้งานเว็บไซต์นี้ทันที
            </p>
          </div>
        </div>

        {/* Clause 8 */}
        <div className="bg-white border-2 border-ink rounded-[22px] p-4 sm:p-7 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-7 rounded-full bg-orange text-white border-1.5 border-ink grid place-items-center font-extrabold text-xs shrink-0">
              08
            </span>
            <h2 className="m-0 text-base sm:text-lg font-bold text-ink leading-snug">
              การแก้ไขข้อกำหนด การระงับบริการ และการติดต่อ (Modifications & Contact)
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-2.5">
            <p className="m-0">
              8.1 ผู้พัฒนาขอสงวนสิทธิ์ในการปรับปรุง แก้ไข หรือเปลี่ยนแปลงข้อกำหนดและเงื่อนไขนี้ได้ทุกเมื่อ โดยการประกาศบนหน้านี้พร้อมระบุวันที่ปรับปรุงล่าสุด การเข้าใช้งานบริการต่อไปหลังมีการแก้ไขจะถือว่าคุณยอมรับข้อกำหนดฉบับใหม่โดยปริยาย
            </p>
            <p className="m-0">
              8.2 <strong>การแจ้งปัญหาละเมิดลิขสิทธิ์ (DMCA / Takedown Notice):</strong> หากคุณเป็นเจ้าของลิขสิทธิ์และเชื่อว่าเนื้อหาใดบนบริการนี้ละเมิดสิทธิ์ของคุณ หรือประสงค์จะแจ้งปัญหาด้านความปลอดภัย สามารถแจ้งเรื่องผ่าน GitHub Repository ทางการของผู้พัฒนาเพื่อดำเนินการตรวจสอบทันที
            </p>
          </div>
        </div>
      </div>

      {/* Helpful Links Box */}
      <div className="mt-8 max-w-[920px] bg-paper border-2 border-ink rounded-[22px] p-4 sm:p-6 shadow-[5px_5px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] scroll-reveal-item flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-extrabold text-ink text-sm flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-purple shrink-0" />
            <span className="break-words">ต้องการศึกษาเบื้องหลังการทำงานและจริยธรรม AI?</span>
          </div>
          <p className="text-xs text-muted m-0 break-words">
            อ่านรายละเอียดการคำนวณคะแนน สถาปัตยกรรม Dual-Pipeline และตารางวงจรชีวิตข้อมูล
          </p>
        </div>
        <button
          onClick={onNavigateToHowItWorks || onBackToHome}
          className="border-1.5 border-ink bg-white rounded-full px-5 py-2 text-xs font-bold text-ink hover:bg-paper cursor-pointer shrink-0 transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <span>อ่าน How It Works →</span>
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 sm:mt-10 text-left scroll-reveal-item">
        <button
          onClick={onBackToHome}
          className="primary-button inline-flex items-center justify-center gap-2 w-auto px-6 sm:px-8 cursor-pointer hover:-translate-y-0.5 transition-all text-xs sm:text-sm"
        >
          <span>ยอมรับและเริ่มต้นสร้าง Wrapped ของคุณ</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        </button>
      </div>
    </section>
  );
}
