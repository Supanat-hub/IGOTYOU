# 🚀 IGOTYOU Instagram Scraper Server (Azure VM)

เซิร์ฟเวอร์สกัดข้อมูลโปรไฟล์ Instagram (Structured Data + ภาพโพสต์ปลอด CORS) สำหรับเชื่อมต่อกับเว็บแอปพลิเคชัน **IGOTYOU** โดยรันบน **Azure Ubuntu Linux VM** (ใช้สิทธิ์ Azure for Students ฟรี)

---

## 🛠️ คุณสมบัติเด่น (Features)
- **สกัดข้อมูลตรง (Direct Structured Data)**: ได้สถิติตัวเลขผู้ติดตาม/โพสต์/กำลังติดตาม และข้อความไบโอแบบ 100% เที่ยงตรง ไม่ต้องพึ่ง OCR
- **บีบอัดรูปภาพฝั่งเซิร์ฟเวอร์ (Server-side Image Optimization)**: ดาวน์โหลดรูปโปรไฟล์ HD และรูปโพสต์ล่าสุด 9–12 รูป บีบอัดเป็น WebP/JPEG Base64 ก้อนเดียว ปลอดปัญหาติด CORS เมื่อวาดลง Canvas และหมดปัญหาลิงก์ CDN ของ Instagram หมดอายุ
- **ระบบจำ Session อัตโนมัติ (Persistent Context)**: ล็อกอินผ่านคำสั่ง Terminal ใน SSH เพียงครั้งเดียว (`npm run login`) ระบบจะเก็บและต่ออายุ Session Token ให้อัตโนมัติ ไม่ต้องคอยเปลี่ยนคุกกี้
- **ความปลอดภัยสูงสุด**: ไม่เปิดหน้าเว็บแอดมินใดๆ สื่อสารผ่าน Cloudflare Tunnel โดยไม่ต้องเปิด Inbound Port ใดๆ บน Azure Firewall
- **ซ่อน IP Data Center**: รองรับ Cloudflare WARP SOCKS5 Proxy ในตัว
- **ระบบคิวเดี่ยว + แคช 30 นาที**: ป้องกัน Instagram ตรวจจับบอท และประหยัดทรัพยากรเครื่อง

---

## 📋 ขั้นตอนการติดตั้งบน Azure VM (Ubuntu 24.04 LTS)

### ขั้นที่ 1: เข้า SSH ไปยังเครื่อง Azure VM ของคุณ
```bash
ssh azureuser@<YOUR_VM_PUBLIC_IP>
```

### ขั้นที่ 2: Clone โปรเจกต์ หรือคัดลอกโฟลเดอร์ `scraper-server/` มายังเครื่อง
```bash
git clone -b feature/scraper-test https://github.com/PONGTHAKORN2007/IGOTYOU.git
cd IGOTYOU/scraper-server
```

### ขั้นที่ 3: รันสคริปต์ติดตั้งระบบอัตโนมัติ (คำสั่งเดียว)
```bash
chmod +x setup-azure.sh
bash setup-azure.sh
```

### ขั้นที่ 4: ตั้งค่า Environment Variables
สร้างไฟล์ `.env` จากตัวอย่าง:
```bash
cp .env.example .env
nano .env
```
กำหนดค่า:
```env
PORT=3001
SCRAPER_API_SECRET=your_secret_password_here
WARP_PROXY=socks5://127.0.0.1:40000
CACHE_TTL_MINUTES=30
```
*(กด `Ctrl+O` แล้ว `Enter` เพื่อบันทึก และ `Ctrl+X` เพื่อออก)*

### ขั้นที่ 5: ล็อกอิน Instagram บัญชีสำรองผ่าน Terminal (ทำครั้งเดียว)
```bash
npm run login
```
- ระบบจะถาม Username และ Password ของบัญชี IG สำรอง
- หากมีรหัส 2FA หรือยืนยันตัวตน ให้พิมพ์รหัส 6 หลักใน Terminal
- เมื่อเสร็จสิ้น จะขึ้นข้อความ `🎉 เข้าสู่ระบบสำเร็จแล้ว 100%!`

### ขั้นที่ 6: สั่งให้เซิร์ฟเวอร์ทำงานตลอดเวลาผ่าน PM2
```bash
pm2 start index.mjs --name igotyou-scraper
pm2 save
pm2 startup
```

### ขั้นที่ 7: เปิด Cloudflare Tunnel ให้ระบบเชื่อมต่อแบบ HTTPS
```bash
cloudflared tunnel --url http://localhost:3001
```
คุณจะได้ URL ปลอดภัย เช่น:
`https://random-subdomain.trycloudflare.com`

นำ URL นี้และรหัส `SCRAPER_API_SECRET` ไปใส่ใน Environment Variables ของ Cloudflare Pages (หรือ `.env.local` ในเครื่องของคุณ):
- `SCRAPER_ENDPOINT_URL=https://random-subdomain.trycloudflare.com/api/scrape`
- `SCRAPER_API_SECRET=your_secret_password_here`
