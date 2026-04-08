/* ============================================= */
/*  Guzel Teknoloji - Ana Sunucu Dosyasi          */
/*  Express API Sunucusu                          */
/* ============================================= */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

/* ---- Veritabani (Prisma) ---- */
const { prisma } = require("./veritabani/prisma");
const { yetkiKontrol, sadaceAdmin } = require("./yardimcilar/yetki-middleware");

/* ---- Express Uygulamasi ---- */
const uygulama = express();
const PORT = process.env.PORT || 5000;

/* ---- Rate Limiting ---- */
// Genel API limiti: 15 dakikada 200 istek
const genelLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { basarili: false, mesaj: "Çok fazla istek gönderildi. Lütfen biraz bekleyin." },
});
// Login/Auth limiti: 15 dakikada 15 deneme (brute force koruması)
const yetkiLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { basarili: false, mesaj: "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin." },
});

/* ---- Middleware ---- */
uygulama.use(cors());
uygulama.use(express.json({ limit: "50mb" }));
uygulama.use(express.urlencoded({ limit: "50mb", extended: true }));
uygulama.use("/api", genelLimit);

/* ---- Global Auth Middleware ---- */
/* Giris, sifre sifirlama ve durum haric tum API rotalari icin token zorunlu */
const acikRotalar = [
  "/api/yetki/giris",
  "/api/yetki/sifre-sifirla",
  "/api/iletisim/sifremi-unuttum",
  "/api/durum",
];
uygulama.use("/api", (req, res, next) => {
  if (acikRotalar.some((r) => req.path === r || req.originalUrl === r)) return next();
  yetkiKontrol(req, res, next);
});

/* ---- API Rotalari ---- */
uygulama.use("/api/yetki", yetkiLimit, require("./rotalar/yetki-rotalari"));
uygulama.use("/api/musteriler", require("./rotalar/musteri-rotalari"));
uygulama.use("/api/bayiler", require("./rotalar/bayi-rotalari"));
uygulama.use("/api/bayi-urunler", require("./rotalar/bayi-urun-rotalari")); // Ayri endpoint
uygulama.use("/api/urunler", require("./rotalar/urun-rotalari"));
uygulama.use("/api/lisanslar", require("./rotalar/lisans-rotalari"));
uygulama.use("/api/lisans-tipleri", require("./rotalar/lisans-tipi-rotalari"));
uygulama.use("/api/notlar", require("./rotalar/not-rotalari"));
uygulama.use("/api/aktivite-loglar", require("./rotalar/aktivite-log-rotalari"));
uygulama.use("/api/dashboard", require("./rotalar/dashboard-rotalari"));
uygulama.use("/api/surumler", require("./rotalar/surum-rotalari"));
uygulama.use("/api/roller", require("./rotalar/rol-rotalari"));
uygulama.use("/api/raporlar", require("./rotalar/rapor-rotalari"));
uygulama.use("/api/yedekleme", sadaceAdmin, require("./rotalar/yedekleme-rotalari"));
uygulama.use("/api/sektorler", require("./rotalar/sektor-rotalari"));
uygulama.use("/api/sablonlar", require("./rotalar/sablon-rotalari"));
uygulama.use("/api/paket-tipleri", require("./rotalar/paket-tipi-rotalari"));
uygulama.use("/api/dosyalar", require("./rotalar/dosya-rotalari"));
uygulama.use("/api/iletisim", require("./rotalar/iletisim-rotalari"));
uygulama.use("/api/kisiler", require("./rotalar/iletisim-kisileri-rotalari"));
uygulama.use("/api/cop-kutusu", sadaceAdmin, require("./rotalar/cop-kutusu-rotalari"));

/* ---- Statik dosya servisi (uploads) ---- */
uygulama.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---- Frontend Statik Dosyalari (Production) ---- */
const distYolu = path.join(__dirname, "..", "Frontend");
uygulama.use(express.static(distYolu));

/* ---- Saglik Kontrolu ---- */
uygulama.get("/api/durum", (req, res) => {
  res.json({
    basarili: true,
    mesaj: "Guzel Teknoloji API calisiyor.",
    zaman: new Date().toISOString(),
  });
});

/* ---- SPA Fallback (React Router icin) ---- */
uygulama.get("/{*splat}", (req, res) => {
  // API isteklerini atla
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ basarili: false, mesaj: "API rotasi bulunamadi." });
  }
  const indexDosya = path.join(__dirname, "..", "Frontend", "index.html");
  const fs = require("fs");
  if (fs.existsSync(indexDosya)) {
    res.sendFile(indexDosya);
  } else {
    res.status(404).json({ basarili: false, mesaj: "Rota bulunamadi." });
  }
});

/* ---- Genel Hata Yakalayici ---- */
uygulama.use((hata, req, res, _next) => {
  console.error("[Sunucu Hatasi]", hata.message);
  res.status(500).json({
    basarili: false,
    mesaj: "Beklenmeyen bir sunucu hatasi olustu.",
  });
});

/* ---- Sunucuyu Baslat (Prisma baglantisi ile) ---- */
(async () => {
  try {
    await prisma.$connect();
    console.log("Prisma veritabani baglantisi basarili.");
    uygulama.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  Guzel Teknoloji API Sunucusu`);
      console.log(`  Port: ${PORT}`);
      console.log(`  Ortam: ${process.env.NODE_ENV || "production"}`);
      console.log(`  API:  http://localhost:${PORT}/api`);
      console.log(`  ----------------------------------------`);
      console.log(`  Frontend: http://localhost:5173`);
      console.log(`========================================\n`);
    });
  } catch (hata) {
    console.error("Sunucu baslatma hatasi:", hata.message);
    process.exit(1);
  }
})();
