#!/usr/bin/env bash
set -e

# ==============================================================================
# IGOTYOU - Azure Ubuntu 24.04 Scraper Server Automated Setup Script
# ==============================================================================

echo "=================================================================="
echo "🚀 เริ่มต้นการติดตั้งระบบ IGOTYOU Scraper บน Azure Ubuntu VM"
echo "=================================================================="

# 1. Setup 2GB Swap Memory (ป้องกัน Out-Of-Memory บนเครื่อง RAM 1GB / B1s)
echo "📦 [1/7] กำลังตั้งค่า Swap Memory 2GB บน SSD..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=20
    echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
    echo "✅ สร้าง Swap 2GB เรียบร้อยแล้ว"
else
    echo "ℹ️ พบ Swap file อยู่แล้ว ข้ามขั้นตอนนี้"
fi

# 2. Update Packages & Prerequisites
echo "🔄 [2/7] กำลังอัปเดตระบบปฏิบัติการและติดตั้งเครื่องมือพื้นฐาน..."
sudo apt-get update -y
sudo apt-get install -y curl wget gnupg git ca-certificates build-essential lsb-release

# 3. Install Node.js 22 LTS
echo "🟢 [3/7] กำลังติดตั้ง Node.js 22 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 4. Install PM2 process manager
echo "⚡ [4/7] กำลังติดตั้ง PM2..."
sudo npm install -g pm2

# 5. Install Playwright OS Dependencies for Chromium
echo "🎭 [5/7] กำลังติดตั้ง Dependencies สำหรับ Headless Chromium..."
sudo apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2t64 libpango-1.0-0 libcairo2

# 6. Install Cloudflare WARP (SOCKS5 Proxy เพื่อซ่อน Data Center IP)
echo "🛡️ [6/7] กำลังติดตั้ง Cloudflare WARP..."
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
sudo apt-get update -y
sudo apt-get install -y cloudflare-warp

# Configure WARP to Proxy mode (port 40000)
echo "⚙️ ตั้งค่า WARP ในโหมด SOCKS5 Proxy (127.0.0.1:40000)..."
warp-cli --accept-tos registration new || true
warp-cli --accept-tos mode proxy
warp-cli --accept-tos proxy port 40000
warp-cli --accept-tos connect || true

# 7. Install Cloudflare Tunnel (cloudflared)
echo "🚇 [7/7] กำลังติดตั้ง Cloudflare Tunnel (cloudflared)..."
if ! command -v cloudflared &> /dev/null; then
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
    sudo dpkg -i cloudflared.deb
    rm cloudflared.deb
fi

# Install npm packages in scraper-server
echo "📦 กำลังติดตั้ง npm dependencies ใน scraper-server..."
npm install
npx playwright install chromium

echo ""
echo "=================================================================="
echo "🎉 การติดตั้งระบบพื้นฐานบน Azure VM เสร็จสมบูรณ์แล้ว!"
echo "=================================================================="
echo ""
echo "📌 ขั้นตอนถัดไปในการเริ่มใช้งาน:"
echo ""
echo "1. สร้างไฟล์ .env จากตัวอย่าง:"
echo "   cp .env.example .env"
echo "   nano .env   (ตั้งค่า SCRAPER_API_SECRET เป็นรหัสลับของคุณ)"
echo ""
echo "2. ล็อกอิน IG บัญชีสำรองผ่านคำสั่งแบบ Interactive (ทำครั้งเดียว):"
echo "   npm run login"
echo ""
echo "3. สั่งให้เซิร์ฟเวอร์รันเป็น Background Service ผ่าน PM2:"
echo "   pm2 start index.mjs --name igotyou-scraper"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. เชื่อมต่อ Cloudflare Tunnel:"
echo "   cloudflared tunnel --url http://localhost:3001"
echo "   (นำ URL ที่ได้ เช่น https://xxxx.trycloudflare.com ไปใส่ใน Cloudflare Pages)"
echo "=================================================================="
