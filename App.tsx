import { ChangeEvent, DragEvent, useRef, useState } from "react";

type IconName =
  | "sparkle"
  | "upload"
  | "image"
  | "shield"
  | "arrow"
  | "close"
  | "check"
  | "lock"
  | "wand";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    sparkle: <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 14v5h14v-5" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m4 17 4-4 3 3 3-3 6 6" /></>,
    shield: <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Zm-3-10 2 2 4-5" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    close: <path d="m7 7 10 10M17 7 7 17" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    wand: <><path d="m15 4 5 5L8 21l-5-5L15 4Z" /><path d="M6 4V1m-1 2H2m18 12v-3m-1 2h-3" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill={name === "sparkle" ? "currentColor" : "none"}
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}

const gallery = [
  "https://images.unsplash.com/photo-1608376156820-56656bddfd10?auto=format&fit=crop&w=500&q=82",
  "https://images.unsplash.com/photo-1604599939460-925db5dbdd36?auto=format&fit=crop&w=500&q=82",
  "https://images.unsplash.com/photo-1608387802568-0c0e0d89d815?auto=format&fit=crop&w=500&q=82",
  "https://images.unsplash.com/photo-1572626917711-324f76366bc0?auto=format&fit=crop&w=500&q=82",
  "https://images.unsplash.com/photo-1563946417-e0f5e085bd12?auto=format&fit=crop&w=500&q=82",
  "https://images.unsplash.com/photo-1667757043423-382c3ff73282?auto=format&fit=crop&w=500&q=82",
];

function App() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const addFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter((file) => file.type.startsWith("image/"));
    setFiles((current) => [...current, ...imageFiles].slice(0, 3));
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const analyze = () => {
    if (!files.length) {
      fileInput.current?.click();
      return;
    }
    setIsAnalyzing(true);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
      window.setTimeout(() => document.querySelector("#result")?.scrollIntoView({ behavior: "smooth" }), 50);
    }, 1100);
  };

  return (
    <main>
      <nav className="nav shell" aria-label="เมนูหลัก">
        <a className="brand" href="#top" aria-label="IGOTYOU หน้าแรก">
          <span className="brand-mark"><Icon name="sparkle" size={18} /></span>
          <span>IGOTYOU</span>
        </a>
        <div className="nav-note">
          <Icon name="lock" size={15} />
          รูปของคุณไม่ถูกเก็บไว้
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><Icon name="sparkle" size={14} /> YOUR PROFILE, UNWRAPPED</div>
          <h1>ไบโอของคุณ<br />บอกอะไรได้บ้าง?</h1>
          <p className="hero-lead">
            อัปโหลดภาพโปรไฟล์ แล้วให้ AI สรุปตัวตนบนโซเชียลของคุณ
            เป็นการ์ด Wrapped สนุกๆ ในไม่กี่วินาที
          </p>
          <div className="benefit-row">
            <span><Icon name="check" size={16} /> อ่านไบโอ</span>
            <span><Icon name="check" size={16} /> วิเคราะห์ฟีด</span>
            <span><Icon name="check" size={16} /> สร้าง Wrapped</span>
          </div>
        </div>

        <div className="upload-card">
          <div className="card-heading">
            <div>
              <span className="step-label">STEP 01</span>
              <h2>ใส่ภาพโปรไฟล์ของคุณ</h2>
            </div>
            <span className="count-pill">{files.length}/3</span>
          </div>
          <div
            className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
            onClick={() => fileInput.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => event.key === "Enter" && fileInput.current?.click()}
          >
            <input
              ref={fileInput}
              accept="image/png,image/jpeg,image/webp"
              hidden
              multiple
              onChange={handleFiles}
              type="file"
            />
            <span className="upload-icon"><Icon name="upload" size={25} /></span>
            <strong>ลากรูปมาวาง หรือคลิกเพื่อเลือก</strong>
            <span>หน้าไบโอ · กริดโพสต์ · ไฮไลต์</span>
            <small>JPG, PNG หรือ WEBP · สูงสุด 3 ภาพ</small>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, index) => (
                <div className="file-item" key={`${file.name}-${index}`}>
                  <span className="file-icon"><Icon name="image" size={18} /></span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button
                    aria-label={`ลบ ${file.name}`}
                    className="icon-button"
                    onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Icon name="close" size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button className="primary-button" disabled={isAnalyzing} onClick={analyze}>
            {isAnalyzing ? <><span className="loader" /> กำลังอ่าน vibe ของคุณ...</> : (
              <>{files.length ? "วิเคราะห์โปรไฟล์ของฉัน" : "เลือกภาพเพื่อเริ่มต้น"} <Icon name="arrow" size={19} /></>
            )}
          </button>
          <p className="consent">
            เมื่อใช้งานต่อ คุณยืนยันว่าเป็นภาพของคุณหรือได้รับอนุญาตให้ใช้แล้ว
          </p>
        </div>
      </section>

      <section className="marquee" aria-label="คุณสมบัติ">
        <div>PROFILE VIBE <span>✦</span> COLOR DNA <span>✦</span> GRID MOOD <span>✦</span> BIO REMIX <span>✦</span> AESTHETIC SCORE <span>✦</span> PROFILE VIBE</div>
      </section>

      <section className="preview shell" id="result">
        <div className="section-intro">
          <span className="section-number">02 / YOUR WRAPPED</span>
          <h2>{showResult ? "นี่คือ vibe ของคุณ" : "ผลลัพธ์ที่คุณจะได้"}</h2>
          <p>{showResult ? "วิเคราะห์จากภาพที่อัปโหลด ผลลัพธ์นี้สร้างเพื่อความสนุก" : "เปลี่ยนภาพหน้าจอธรรมดา ให้เป็นเรื่องราวของคุณ"}</p>
        </div>

        <div className={`wrapped-grid ${showResult ? "result-reveal" : ""}`}>
          <article className="persona-card">
            <div className="card-topline"><span>PROFILE PERSONA</span><span>01</span></div>
            <div className="persona-art">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <Icon name="sparkle" size={62} />
            </div>
            <p>ฉายาประจำโปรไฟล์ของคุณคือ</p>
            <h3>สายคาเฟ่<br />มินิมอล</h3>
            <div className="tag-row"><span>slow life</span><span>cafe hopping</span></div>
          </article>

          <article className="score-card">
            <div className="card-topline"><span>AESTHETIC SCORE</span><span>02</span></div>
            <div className="score-ring">
              <span className="score-number">92</span>
              <span>/100</span>
            </div>
            <h3>คุมโทนเก่งมาก!</h3>
            <p>สีอบอุ่น แสงธรรมชาติ และองค์ประกอบเรียบง่าย ทำให้ฟีดของคุณน่ามองแบบไม่ต้องพยายาม</p>
            <div className="meter"><span /></div>
          </article>

          <article className="palette-card">
            <div className="card-topline"><span>COLOR DNA</span><span>03</span></div>
            <h3>โทนสีประจำตัว</h3>
            <div className="swatches">
              <span className="swatch swatch-1" />
              <span className="swatch swatch-2" />
              <span className="swatch swatch-3" />
              <span className="swatch swatch-4" />
            </div>
            <div className="palette-labels"><span>Oat milk</span><span>Matcha</span><span>Espresso</span></div>
          </article>

          <article className="stats-card">
            <div className="card-topline"><span>BY THE NUMBERS</span><span>04</span></div>
            <div className="stat"><strong>12.4×</strong><span>ผู้ติดตาม ต่อ กำลังติดตาม</span></div>
            <div className="stat"><strong>27</strong><span>ผู้ติดตาม ต่อ 1 โพสต์</span></div>
            <div className="mini-note">ตัวเลขอาจคลาดเคลื่อนจาก OCR <Icon name="sparkle" size={13} /></div>
          </article>

          <article className="grid-card">
            <div className="grid-images">
              {gallery.map((image, index) => (
                <img alt={`ตัวอย่างภาพไลฟ์สไตล์โทนอุ่น ${index + 1}`} key={image} src={image} />
              ))}
            </div>
            <div className="grid-caption">
              <div><span>TOP CONTENT</span><strong>กาแฟ · อาหาร · วันสบายๆ</strong></div>
              <span className="round-arrow"><Icon name="arrow" size={18} /></span>
            </div>
          </article>

          <article className="remix-card">
            <div className="card-topline"><span>BIO REMIX</span><span>05</span></div>
            <Icon name="wand" size={28} />
            <h3>slow mornings,<br />good coffee & tiny joys.</h3>
            <p>Bangkok · collecting moments</p>
            <button onClick={() => navigator.clipboard?.writeText("slow mornings, good coffee & tiny joys. ☕")}>
              คัดลอกไบโอ <Icon name="arrow" size={17} />
            </button>
          </article>
        </div>
      </section>

      <section className="privacy shell">
        <div className="privacy-icon"><Icon name="shield" size={28} /></div>
        <div>
          <span className="step-label">GOOD VIBES, SAFE SPACE</span>
          <h2>สนุกได้ โดยไม่ล้ำเส้น</h2>
          <p>เราไม่เดาบุคลิก สุขภาพจิต ศาสนา เพศวิถี หรือฐานะจากภาพ และไม่ควรใช้ผลลัพธ์นี้ตัดสินตัวตนจริงของใคร</p>
        </div>
        <div className="privacy-points">
          <span><Icon name="check" size={17} /> ใช้ภาพของตัวเอง</span>
          <span><Icon name="check" size={17} /> ตรวจข้อความ OCR อีกครั้ง</span>
          <span><Icon name="check" size={17} /> ผลลัพธ์เพื่อความบันเทิง</span>
        </div>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top"><span className="brand-mark"><Icon name="sparkle" size={18} /></span><span>IGOTYOU</span></a>
        <p>See yourself, a little differently.</p>
        <span>Made for fun, not for judgment.</span>
      </footer>
    </main>
  );
}

export default App;
