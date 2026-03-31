/* ============================================= */
/*  Guzel Teknoloji - Ana Sunucu Dosyasi          */
/*  Express API Sunucusu                          */
/* ============================================= */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

/* ---- Veritabani Kurulumu ---- */
const { tablolariOlustur, ornekVerileriEkle } = require("./veritabani/sema");

/* ---- Express Uygulamasi ---- */
const uygulama = express();
const PORT = process.env.PORT || 5000;

/* ---- Middleware ---- */
uygulama.use(cors());
uygulama.use(express.json());

/* ---- API Rotalari ---- */
uygulama.use("/api/yetki", require("./rotalar/yetki-rotalari"));
uygulama.use("/api/musteriler", require("./rotalar/musteri-rotalari"));
uygulama.use("/api/bayiler", require("./rotalar/bayi-rotalari"));
uygulama.use("/api/urunler", require("./rotalar/urun-rotalari"));
uygulama.use("/api/lisanslar", require("./rotalar/lisans-rotalari"));
uygulama.use("/api/notlar", require("./rotalar/not-rotalari"));
uygulama.use("/api/aktivite-loglar", require("./rotalar/aktivite-log-rotalari"));
uygulama.use("/api/dashboard", require("./rotalar/dashboard-rotalari"));
uygulama.use("/api/surumler", require("./rotalar/surum-rotalari"));
uygulama.use("/api/roller", require("./rotalar/rol-rotalari"));
uygulama.use("/api/raporlar", require("./rotalar/rapor-rotalari"));
uygulama.use("/api/yedekleme", require("./rotalar/yedekleme-rotalari"));

/* ---- Kok Rota ---- */
uygulama.get("/", (req, res) => {
  res.json({
    basarili: true,
    mesaj: "Guzel Teknoloji API Sunucusu calisiyor. Frontend icin http://localhost:5173 adresini kullanin.",
  });
});

/* ---- Saglik Kontrolu ---- */
uygulama.get("/api/durum", (req, res) => {
  res.json({
    basarili: true,
    mesaj: "Guzel Teknoloji API calisiyor.",
    zaman: new Date().toISOString(),
  });
});

/* ---- 404 Yakalayici ---- */
uygulama.use((req, res) => {
  res.status(404).json({ basarili: false, mesaj: "Rota bulunamadi." });
});

/* ---- Genel Hata Yakalayici ---- */
uygulama.use((hata, req, res, _next) => {
  console.error("[Sunucu Hatasi]", hata.message);
  res.status(500).json({
    basarili: false,
    mesaj: "Beklenmeyen bir sunucu hatasi olustu.",
  });
});

/* ---- Sunucuyu Baslat (async — MySQL tablolar olusturulduktan sonra) ---- */
(async () => {
  try {
    await tablolariOlustur();
    await ornekVerileriEkle();
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
