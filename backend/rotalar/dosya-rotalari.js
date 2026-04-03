const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const IZIN_VERILEN_TIPLER = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"];

const depolama = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(file.originalname)),
});

const yukleme = multer({
  storage: depolama,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IZIN_VERILEN_TIPLER.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Desteklenmeyen dosya türü. Sadece PDF, PNG, JPG, GIF, WEBP yüklenebilir."));
  },
});

/* ---- Müşteri Dosyalarını Listele ---- */
router.get("/:musteriId/dosyalar", yetkiKontrol, hataYakala(async (req, res) => {
  const dosyalar = await prisma.musteriDosya.findMany({
    where: { musteri_id: Number(req.params.musteriId) },
    select: { id: true, dosya_adi: true, orijinal_ad: true, dosya_tipi: true, boyut: true, yuklenme_tarihi: true },
    orderBy: { yuklenme_tarihi: "desc" },
  });
  res.json({ basarili: true, veri: temizle(dosyalar) });
}));

/* ---- Dosya Yükle (çoklu) ---- */
router.post("/:musteriId/dosyalar", yetkiKontrol, yukleme.array("dosyalar", 10), hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  const musteri = await prisma.musteri.findUnique({ where: { id: musteriId }, select: { id: true } });
  if (!musteri) return bulunamadiHatasi(res, "Müşteri bulunamadı.");
  if (!req.files || req.files.length === 0) return dogrulamaHatasi(res, "Yüklenecek dosya bulunamadı.");

  const eklenen = [];
  for (const dosya of req.files) {
    const sonuc = await prisma.musteriDosya.create({
      data: { musteri_id: musteriId, dosya_adi: dosya.filename, orijinal_ad: dosya.originalname, dosya_tipi: dosya.mimetype, boyut: BigInt(dosya.size) },
    });
    eklenen.push({ id: sonuc.id, dosya_adi: dosya.filename, orijinal_ad: dosya.originalname });
  }
  res.status(201).json({ basarili: true, mesaj: `${eklenen.length} dosya yüklendi.`, veri: eklenen });
}));

/* ---- Dosya İndir ---- */
router.get("/:musteriId/dosyalar/:dosyaId/indir", yetkiKontrol, hataYakala(async (req, res) => {
  const dosya = await prisma.musteriDosya.findUnique({ where: { id: Number(req.params.dosyaId) }, select: { dosya_adi: true, orijinal_ad: true } });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadı.");
  const dosyaYolu = path.join(UPLOAD_DIR, dosya.dosya_adi);
  if (!fs.existsSync(dosyaYolu)) return bulunamadiHatasi(res, "Dosya sunucuda bulunamadı.");
  res.download(dosyaYolu, dosya.orijinal_ad);
}));

/* ---- Dosya Sil ---- */
router.delete("/:musteriId/dosyalar/:dosyaId", yetkiKontrol, hataYakala(async (req, res) => {
  const dosya = await prisma.musteriDosya.findUnique({ where: { id: Number(req.params.dosyaId) }, select: { dosya_adi: true } });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadı.");
  const dosyaYolu = path.join(UPLOAD_DIR, dosya.dosya_adi);
  if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu);
  await prisma.musteriDosya.delete({ where: { id: Number(req.params.dosyaId) } });
  res.json({ basarili: true, mesaj: "Dosya silindi." });
}));

/* =============================================
   BAYI DOSYALARI ENDPOINT'LERI
   ============================================= */

/* ---- Bayi Dosyalarını Listele ---- */
router.get("/bayi/:bayiId/dosyalar", yetkiKontrol, hataYakala(async (req, res) => {
  const dosyalar = await prisma.bayiDosya.findMany({
    where: { bayi_id: Number(req.params.bayiId) },
    select: { id: true, dosya_adi: true, orijinal_ad: true, dosya_tipi: true, boyut: true, yuklenme_tarihi: true },
    orderBy: { yuklenme_tarihi: "desc" },
  });
  res.json({ basarili: true, veri: temizle(dosyalar) });
}));

/* ---- Bayi Dosya Yükle (çoklu) ---- */
router.post("/bayi/:bayiId/dosyalar", yetkiKontrol, yukleme.array("dosyalar", 10), hataYakala(async (req, res) => {
  const bayiId = Number(req.params.bayiId);
  const bayi = await prisma.bayi.findUnique({ where: { id: bayiId }, select: { id: true } });
  if (!bayi) return bulunamadiHatasi(res, "Bayi bulunamadı.");
  if (!req.files || req.files.length === 0) return dogrulamaHatasi(res, "Yüklenecek dosya bulunamadı.");

  const eklenen = [];
  for (const dosya of req.files) {
    const sonuc = await prisma.bayiDosya.create({
      data: { bayi_id: bayiId, dosya_adi: dosya.filename, orijinal_ad: dosya.originalname, dosya_tipi: dosya.mimetype, boyut: BigInt(dosya.size) },
    });
    eklenen.push({ id: sonuc.id, dosya_adi: dosya.filename, orijinal_ad: dosya.originalname });
  }
  res.status(201).json({ basarili: true, mesaj: `${eklenen.length} dosya yüklendi.`, veri: eklenen });
}));

/* ---- Bayi Dosya İndir ---- */
router.get("/bayi/:bayiId/dosyalar/:dosyaId/indir", yetkiKontrol, hataYakala(async (req, res) => {
  const dosya = await prisma.bayiDosya.findUnique({ where: { id: Number(req.params.dosyaId) }, select: { dosya_adi: true, orijinal_ad: true } });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadı.");
  const dosyaYolu = path.join(UPLOAD_DIR, dosya.dosya_adi);
  if (!fs.existsSync(dosyaYolu)) return bulunamadiHatasi(res, "Dosya sunucuda bulunamadı.");
  res.download(dosyaYolu, dosya.orijinal_ad);
}));

/* ---- Bayi Dosya Sil ---- */
router.delete("/bayi/:bayiId/dosyalar/:dosyaId", yetkiKontrol, hataYakala(async (req, res) => {
  const dosya = await prisma.bayiDosya.findUnique({ where: { id: Number(req.params.dosyaId) }, select: { dosya_adi: true } });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadı.");
  const dosyaYolu = path.join(UPLOAD_DIR, dosya.dosya_adi);
  if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu);
  await prisma.bayiDosya.delete({ where: { id: Number(req.params.dosyaId) } });
  res.json({ basarili: true, mesaj: "Dosya silindi." });
}));

router.use((hata, req, res, next) => {
  if (hata instanceof multer.MulterError) {
    if (hata.code === "LIMIT_FILE_SIZE") return res.status(400).json({ basarili: false, mesaj: "Dosya boyutu 10 MB'ı aşamaz." });
    return res.status(400).json({ basarili: false, mesaj: hata.message });
  }
  if (hata) return res.status(400).json({ basarili: false, mesaj: hata.message });
  next();
});

module.exports = router;
