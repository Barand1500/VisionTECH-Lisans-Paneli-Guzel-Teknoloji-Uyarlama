/* ============================================= */
/*  Dosya Rotaları - Müşteri Dosya Yükleme        */
/* ============================================= */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

/* ---- Uploads klasörü ---- */
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ---- İzin verilen dosya türleri ---- */
const IZIN_VERILEN_TIPLER = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

const MAX_BOYUT = 10 * 1024 * 1024; // 10 MB

/* ---- Multer ayarlari ---- */
const depolama = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const benzersiz = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const uzanti = path.extname(file.originalname);
    cb(null, benzersiz + uzanti);
  },
});

const yukleme = multer({
  storage: depolama,
  limits: { fileSize: MAX_BOYUT },
  fileFilter: (_req, file, cb) => {
    if (IZIN_VERILEN_TIPLER.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Desteklenmeyen dosya türü. Sadece PDF, PNG, JPG, GIF, WEBP yüklenebilir."));
    }
  },
});

/* ---- Müşteri Dosyalarını Listele ---- */
router.get("/:musteriId/dosyalar", yetkiKontrol, hataYakala(async (req, res) => {
  const { musteriId } = req.params;
  const [dosyalar] = await havuz.query(
    "SELECT id, dosya_adi, orijinal_ad, dosya_tipi, boyut, yuklenme_tarihi FROM musteri_dosyalar WHERE musteri_id = ? ORDER BY yuklenme_tarihi DESC",
    [musteriId]
  );
  res.json({ basarili: true, veri: dosyalar });
}));

/* ---- Dosya Yükle (çoklu) ---- */
router.post("/:musteriId/dosyalar", yetkiKontrol, yukleme.array("dosyalar", 10), hataYakala(async (req, res) => {
  const { musteriId } = req.params;

  /* Müşteri var mı? */
  const [musteri] = await havuz.query("SELECT id FROM musteriler WHERE id = ?", [musteriId]);
  if (musteri.length === 0) return bulunamadiHatasi(res, "Müşteri bulunamadı.");

  if (!req.files || req.files.length === 0) {
    return dogrulamaHatasi(res, "Yüklenecek dosya bulunamadı.");
  }

  const eklenen = [];
  for (const dosya of req.files) {
    const [sonuc] = await havuz.query(
      "INSERT INTO musteri_dosyalar (musteri_id, dosya_adi, orijinal_ad, dosya_tipi, boyut) VALUES (?, ?, ?, ?, ?)",
      [musteriId, dosya.filename, dosya.originalname, dosya.mimetype, dosya.size]
    );
    eklenen.push({ id: sonuc.insertId, dosya_adi: dosya.filename, orijinal_ad: dosya.originalname });
  }

  res.status(201).json({ basarili: true, mesaj: `${eklenen.length} dosya yüklendi.`, veri: eklenen });
}));

/* ---- Dosya İndir ---- */
router.get("/:musteriId/dosyalar/:dosyaId/indir", yetkiKontrol, hataYakala(async (req, res) => {
  const { dosyaId } = req.params;
  const [satirlar] = await havuz.query("SELECT dosya_adi, orijinal_ad FROM musteri_dosyalar WHERE id = ?", [dosyaId]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Dosya bulunamadı.");

  const dosyaYolu = path.join(UPLOAD_DIR, satirlar[0].dosya_adi);
  if (!fs.existsSync(dosyaYolu)) return bulunamadiHatasi(res, "Dosya sunucuda bulunamadı.");

  res.download(dosyaYolu, satirlar[0].orijinal_ad);
}));

/* ---- Dosya Sil ---- */
router.delete("/:musteriId/dosyalar/:dosyaId", yetkiKontrol, hataYakala(async (req, res) => {
  const { dosyaId } = req.params;
  const [satirlar] = await havuz.query("SELECT dosya_adi FROM musteri_dosyalar WHERE id = ?", [dosyaId]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Dosya bulunamadı.");

  /* Diskten sil */
  const dosyaYolu = path.join(UPLOAD_DIR, satirlar[0].dosya_adi);
  if (fs.existsSync(dosyaYolu)) {
    fs.unlinkSync(dosyaYolu);
  }

  /* DB'den sil */
  await havuz.query("DELETE FROM musteri_dosyalar WHERE id = ?", [dosyaId]);
  res.json({ basarili: true, mesaj: "Dosya silindi." });
}));

/* ---- Multer hata yakalayıcı ---- */
router.use((hata, req, res, next) => {
  if (hata instanceof multer.MulterError) {
    if (hata.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ basarili: false, mesaj: "Dosya boyutu 10 MB'ı aşamaz." });
    }
    return res.status(400).json({ basarili: false, mesaj: hata.message });
  }
  if (hata) {
    return res.status(400).json({ basarili: false, mesaj: hata.message });
  }
  next();
});

module.exports = router;
