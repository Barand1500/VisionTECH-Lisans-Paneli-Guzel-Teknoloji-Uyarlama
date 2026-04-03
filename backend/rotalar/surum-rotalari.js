const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Dosya Yükleme Ayarları ---- */
const SURUM_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "surumler");
if (!fs.existsSync(SURUM_UPLOAD_DIR)) fs.mkdirSync(SURUM_UPLOAD_DIR, { recursive: true });

const depolama = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SURUM_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uzanti = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + uzanti);
  },
});

const yukleme = multer({
  storage: depolama,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

/* ---- Tum Surumleri Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const surumler = await prisma.surum.findMany({ orderBy: [{ tarih: "desc" }, { id: "desc" }] });
  res.json({ basarili: true, veri: temizle(surumler) });
}));

/* ---- Tek Surum Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const kayit = await prisma.surum.findUnique({ where: { id: Number(req.params.id) } });
  if (!kayit) return bulunamadiHatasi(res, "Surum bulunamadi.");
  res.json({ basarili: true, veri: temizle(kayit) });
}));

/* ---- Surum Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { urun_id, urun_adi, surum, tarih, duzenlenenler, eklenenler, cikarilanlar, dosya_adi } = req.body;
  if (!urun_adi || !surum) return dogrulamaHatasi(res, "Urun adi ve surum numarasi zorunludur.");

  /* Mevcut aktif surumu pasif yap */
  await prisma.surum.updateMany({ where: { urun_adi, aktif: 1 }, data: { aktif: 0 } });

  const sonuc = await prisma.surum.create({
    data: {
      urun_id: urun_id || null,
      urun_adi,
      surum,
      tarih: tarih ? new Date(tarih) : new Date(),
      duzenlenenler: duzenlenenler || null,
      eklenenler: eklenenler || null,
      cikarilanlar: cikarilanlar || null,
      dosya_adi: dosya_adi || null,
      aktif: 1,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Surum basariyla eklendi.", id: sonuc.id });
}));

/* ---- Surum Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.surum.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Surum bulunamadi.");

  const { urun_id, urun_adi, surum, tarih, duzenlenenler, eklenenler, cikarilanlar, dosya_adi, aktif } = req.body;

  await prisma.surum.update({
    where: { id },
    data: {
      urun_id: urun_id || null,
      urun_adi: urun_adi || undefined,
      surum: surum || undefined,
      tarih: tarih ? new Date(tarih) : undefined,
      duzenlenenler: duzenlenenler || null,
      eklenenler: eklenenler || null,
      cikarilanlar: cikarilanlar || null,
      dosya_adi: dosya_adi || null,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1,
    },
  });
  res.json({ basarili: true, mesaj: "Surum basariyla guncellendi." });
}));

/* ---- Surum Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.surum.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Surum bulunamadi.");

  await prisma.surum.delete({ where: { id } });
  res.json({ basarili: true, mesaj: "Surum basariyla silindi." });
}));

/* ---- Sürüm Dosyası Yükle ---- */
router.post("/:id/dosya", yukleme.single("dosya"), hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.surum.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Surum bulunamadi.");
  if (!req.file) return dogrulamaHatasi(res, "Dosya bulunamadi.");

  // Eski dosyayı sil
  if (mevcut.dosya_adi) {
    const eskiYol = path.join(SURUM_UPLOAD_DIR, mevcut.dosya_adi);
    if (fs.existsSync(eskiYol)) fs.unlinkSync(eskiYol);
  }

  await prisma.surum.update({
    where: { id },
    data: { dosya_adi: req.file.filename },
  });

  res.json({ basarili: true, mesaj: "Dosya basariyla yuklendi.", dosya_adi: req.file.filename, orijinal_ad: req.file.originalname });
}));

/* ---- Sürüm Dosyası İndir ---- */
router.get("/:id/indir", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.surum.findUnique({ where: { id } });
  if (!mevcut || !mevcut.dosya_adi) return bulunamadiHatasi(res, "Dosya bulunamadi.");

  const dosyaYolu = path.join(SURUM_UPLOAD_DIR, mevcut.dosya_adi);
  if (!fs.existsSync(dosyaYolu)) return bulunamadiHatasi(res, "Dosya sunucuda bulunamadi.");

  res.download(dosyaYolu, mevcut.dosya_adi);
}));

/* ---- Sürüm Dosyası Sil ---- */
router.delete("/:id/dosya", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.surum.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Surum bulunamadi.");

  if (mevcut.dosya_adi) {
    const dosyaYolu = path.join(SURUM_UPLOAD_DIR, mevcut.dosya_adi);
    if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu);
  }

  await prisma.surum.update({ where: { id }, data: { dosya_adi: null } });
  res.json({ basarili: true, mesaj: "Dosya basariyla silindi." });
}));

module.exports = router;
