/* ============================================= */
/*  Bayi Rotalari - CRUD Islemleri                */
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

const IZIN_VERILEN_TIPLER = [
  "application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp",
];

const depolama = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const benzersiz = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, benzersiz + path.extname(file.originalname));
  },
});

const yukleme = multer({
  storage: depolama,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IZIN_VERILEN_TIPLER.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Desteklenmeyen dosya türü."));
  },
});

/* ---- Tum Bayileri Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [bayiler] = await havuz.query(
    "SELECT b.*, s.ad AS sektor_adi FROM bayiler b LEFT JOIN sektorler s ON s.id = b.sektor_id WHERE b.silinme_tarihi IS NULL ORDER BY b.id DESC"
  );
  res.json({ basarili: true, veri: bayiler });
}));

/* ---- Tek Bayi Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(
    "SELECT b.*, s.ad AS sektor_adi FROM bayiler b LEFT JOIN sektorler s ON s.id = b.sektor_id WHERE b.id = ? AND b.silinme_tarihi IS NULL",
    [Number(req.params.id)]
  );
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Bayi bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Bayi Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sektor_id, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi, notlar, etiketler } = req.body;

  if (!ad) return dogrulamaHatasi(res, "Bayi adi zorunludur.");

  const etiketlerStr = Array.isArray(etiketler) ? JSON.stringify(etiketler) : (etiketler || null);

  const [sonuc] = await havuz.query(
    `INSERT INTO bayiler (ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sektor_id, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi, notlar, etiketler)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ad, yetkili || null, eposta || null, telefon || null, vergi_no || null, vergi_dairesi || null, sektor_id || null, durum || "aktif", tur || "tuzel", ust_bayi_id || null, tc_kimlik_no || null, pasaport_no || null, ad_soyad || null, sirket_adi || null, notlar || null, etiketlerStr]
  );

  res.status(201).json({ basarili: true, mesaj: "Bayi basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Bayi Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM bayiler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Bayi bulunamadi.");

  const { ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sektor_id, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi, notlar, etiketler } = req.body;

  const etiketlerStr = etiketler !== undefined ? (Array.isArray(etiketler) ? JSON.stringify(etiketler) : etiketler) : undefined;

  await havuz.query(
    `UPDATE bayiler SET
      ad = COALESCE(?, ad), yetkili = ?, eposta = ?, telefon = ?,
      vergi_no = ?, vergi_dairesi = ?, sektor_id = ?, durum = COALESCE(?, durum),
      tur = COALESCE(?, tur), ust_bayi_id = ?, tc_kimlik_no = ?,
      pasaport_no = ?, ad_soyad = ?, sirket_adi = ?,
      notlar = COALESCE(?, notlar), etiketler = COALESCE(?, etiketler),
      guncelleme_tarihi = NOW()
    WHERE id = ?`,
    [ad || null, yetkili || null, eposta || null, telefon || null, vergi_no || null, vergi_dairesi || null, sektor_id !== undefined ? (sektor_id || null) : null, durum || null, tur || null, ust_bayi_id || null, tc_kimlik_no || null, pasaport_no || null, ad_soyad || null, sirket_adi || null, notlar !== undefined ? notlar : null, etiketlerStr !== undefined ? etiketlerStr : null, id]
  );

  res.json({ basarili: true, mesaj: "Bayi basariyla guncellendi." });
}));

/* ---- Bayi Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM bayiler WHERE id = ? AND silinme_tarihi IS NULL", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Bayi bulunamadi.");

  await havuz.query("UPDATE bayiler SET silinme_tarihi = NOW(), durum = 'pasif' WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Bayi basariyla silindi." });
}));

/* ============================================= */
/*  Bayi Dosya İşlemleri                          */
/* ============================================= */

/* ---- Bayi Dosyalarını Listele ---- */
router.get("/:bayiId/dosyalar", yetkiKontrol, hataYakala(async (req, res) => {
  const [dosyalar] = await havuz.query(
    "SELECT id, dosya_adi, orijinal_ad, dosya_tipi, boyut, yuklenme_tarihi FROM bayi_dosyalar WHERE bayi_id = ? ORDER BY yuklenme_tarihi DESC",
    [req.params.bayiId]
  );
  res.json({ basarili: true, veri: dosyalar });
}));

/* ---- Dosya Yükle (çoklu) ---- */
router.post("/:bayiId/dosyalar", yetkiKontrol, yukleme.array("dosyalar", 10), hataYakala(async (req, res) => {
  const bayiId = Number(req.params.bayiId);
  const [bayi] = await havuz.query("SELECT id FROM bayiler WHERE id = ?", [bayiId]);
  if (bayi.length === 0) return bulunamadiHatasi(res, "Bayi bulunamadı.");

  if (!req.files || req.files.length === 0) return dogrulamaHatasi(res, "Yüklenecek dosya bulunamadı.");

  const eklenen = [];
  for (const dosya of req.files) {
    const [sonuc] = await havuz.query(
      "INSERT INTO bayi_dosyalar (bayi_id, dosya_adi, orijinal_ad, dosya_tipi, boyut) VALUES (?, ?, ?, ?, ?)",
      [bayiId, dosya.filename, dosya.originalname, dosya.mimetype, dosya.size]
    );
    eklenen.push({ id: sonuc.insertId, dosya_adi: dosya.filename, orijinal_ad: dosya.originalname });
  }
  res.status(201).json({ basarili: true, mesaj: `${eklenen.length} dosya yüklendi.`, veri: eklenen });
}));

/* ---- Dosya İndir ---- */
router.get("/:bayiId/dosyalar/:dosyaId/indir", yetkiKontrol, hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query("SELECT dosya_adi, orijinal_ad FROM bayi_dosyalar WHERE id = ?", [req.params.dosyaId]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Dosya bulunamadı.");
  const dosyaYolu = path.join(UPLOAD_DIR, satirlar[0].dosya_adi);
  if (!fs.existsSync(dosyaYolu)) return bulunamadiHatasi(res, "Dosya sunucuda bulunamadı.");
  res.download(dosyaYolu, satirlar[0].orijinal_ad);
}));

/* ---- Dosya Sil ---- */
router.delete("/:bayiId/dosyalar/:dosyaId", yetkiKontrol, hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query("SELECT dosya_adi FROM bayi_dosyalar WHERE id = ?", [req.params.dosyaId]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Dosya bulunamadı.");
  const dosyaYolu = path.join(UPLOAD_DIR, satirlar[0].dosya_adi);
  if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu);
  await havuz.query("DELETE FROM bayi_dosyalar WHERE id = ?", [req.params.dosyaId]);
  res.json({ basarili: true, mesaj: "Dosya silindi." });
}));

/* ---- Multer hata yakalayıcı ---- */
router.use((hata, _req, res, _next) => {
  if (hata instanceof multer.MulterError) {
    if (hata.code === "LIMIT_FILE_SIZE") return res.status(400).json({ basarili: false, mesaj: "Dosya boyutu 10 MB'ı aşamaz." });
    return res.status(400).json({ basarili: false, mesaj: hata.message });
  }
  if (hata) return res.status(400).json({ basarili: false, mesaj: hata.message });
});

module.exports = router;
