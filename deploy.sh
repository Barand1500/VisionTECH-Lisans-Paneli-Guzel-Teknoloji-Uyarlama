#!/bin/bash
# ==================================
# Guzel Teknoloji - Deploy Script
# CloudPanel sunucusuna git uzerinden deploy
# ==================================

set -e

echo "===== Guzel Teknoloji Deploy ====="

# 1. Frontend build
echo "[1/4] Frontend build ediliyor..."
npm run build

# 2. Git islemleri
echo "[2/4] Git commit & push..."
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || echo "Commit edilecek degisiklik yok."
git push origin main

# 3. Sunucuda calistir (SSH uzerinden)
# CloudPanel sunucu bilgilerini buraya girin:
SUNUCU_IP="${SUNUCU_IP:-SUNUCU_IP_ADRESI}"
SUNUCU_KULLANICI="${SUNUCU_KULLANICI:-root}"
PROJE_YOLU="${PROJE_YOLU:-/home/clp/htdocs/guzel-teknoloji}"

echo "[3/4] Sunucuya baglaniliyor..."
ssh ${SUNUCU_KULLANICI}@${SUNUCU_IP} << 'UZAK_KOMUT'
  cd ${PROJE_YOLU}
  echo "  -> Git pull..."
  git pull origin main
  echo "  -> Backend bagimliliklar..."
  cd backend
  npm install --production
  npx prisma generate
  npx prisma db push --accept-data-loss
  echo "  -> Backend yeniden baslatiliyor..."
  echo "  NOT: CloudPanel Node.js bu site icin aciksa PM2 kullanmayin (port cakismasi)."
  pm2 restart guzel-teknoloji || pm2 start sunucu.js --name guzel-teknoloji
  cd ..
  echo "  -> Deploy tamamlandi!"
UZAK_KOMUT

echo "[4/4] Deploy basarili!"
echo "=================================="
