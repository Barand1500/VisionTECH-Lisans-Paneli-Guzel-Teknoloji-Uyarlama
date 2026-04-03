/* ============================================= */
/*  Guzel Teknoloji - Ana Sunucu Dosyasi          */
/*  Express API Sunucusu                          */
/* ============================================= */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

/* ---- Veritabani (Prisma) ---- */
const { prisma } = require("./veritabani/prisma");

/* ---- Express Uygulamasi ---- */
const uygulama = express();
const PORT = process.env.PORT || 5000;

/* ---- Middleware ---- */
uygulama.use(cors());
uygulama.use(express.json({ limit: "50mb" }));
uygulama.use(express.urlencoded({ limit: "50mb", extended: true }));

/* ---- API Rotalari ---- */
uygulama.use("/api/yetki", require("./rotalar/yetki-rotalari"));
uygulama.use("/api/musteriler", require("./rotalar/musteri-rotalari"));
uygulama.use("/api/bayiler", require("./rotalar/bayi-rotalari"));
uygulama.use("/api/urunler", require("./rotalar/urun-rotalari"));
uygulama.use("/api/lisanslar", require("./rotalar/lisans-rotalari"));
uygulama.use("/api/lisans-tipleri", require("./rotalar/lisans-tipi-rotalari"));
uygulama.use("/api/notlar", require("./rotalar/not-rotalari"));
uygulama.use("/api/aktivite-loglar", require("./rotalar/aktivite-log-rotalari"));
uygulama.use("/api/dashboard", require("./rotalar/dashboard-rotalari"));
uygulama.use("/api/surumler", require("./rotalar/surum-rotalari"));
uygulama.use("/api/roller", require("./rotalar/rol-rotalari"));
uygulama.use("/api/raporlar", require("./rotalar/rapor-rotalari"));
uygulama.use("/api/yedekleme", require("./rotalar/yedekleme-rotalari"));
uygulama.use("/api/sektorler", require("./rotalar/sektor-rotalari"));
uygulama.use("/api/sablonlar", require("./rotalar/sablon-rotalari"));
uygulama.use("/api/paket-tipleri", require("./rotalar/paket-tipi-rotalari"));
uygulama.use("/api/bayiler", require("./rotalar/bayi-urun-rotalari"));
uygulama.use("/api/musteriler", require("./rotalar/dosya-rotalari"));
uygulama.use("/api/iletisim", require("./rotalar/iletisim-rotalari"));
uygulama.use("/api/kisiler", require("./rotalar/iletisim-kisileri-rotalari"));
uygulama.use("/api/cop-kutusu", require("./rotalar/cop-kutusu-rotalari"));

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
uygulama.get("/{*path}", (req, res) => {
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
