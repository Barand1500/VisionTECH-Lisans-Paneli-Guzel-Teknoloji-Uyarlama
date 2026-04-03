const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

/* ---- Musteriye Ait Notlari Listele ---- */
router.get("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const notlar = await prisma.noti.findMany({
    where: { musteri_id: Number(req.params.musteriId) },
    select: { id: true, musteri_id: true, metin: true, onemli: true, tarih: true },
    orderBy: { tarih: "desc" },
  });
  res.json({ basarili: true, veri: temizle(notlar) });
}));

/* ---- Bayiye Ait Notlari Listele ---- */
router.get("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const notlar = await prisma.noti.findMany({
    where: { bayi_id: Number(req.params.bayiId) },
    select: { id: true, bayi_id: true, metin: true, onemli: true, tarih: true },
    orderBy: { tarih: "desc" },
  });
  res.json({ basarili: true, veri: temizle(notlar) });
}));

/* ---- Tum Notlari Listele ---- */
router.get("/", yetkiKontrol, hataYakala(async (req, res) => {
  const notlar = await prisma.noti.findMany({
    include: {
      musteri: { select: { ad_soyad: true, sirket_adi: true } },
      bayi: { select: { sirket_adi: true } },
    },
    orderBy: { tarih: "desc" },
  });
  const sonuc = notlar.map(({ musteri, bayi, ...n }) => ({
    ...n,
    musteri_adi: musteri?.ad_soyad || musteri?.sirket_adi || null,
    bayi_adi: bayi?.sirket_adi || null,
  }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

/* ---- Musteri Notu Ekle ---- */
router.post("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const { metin, onemli } = req.body;
  if (!metin || !metin.trim()) return dogrulamaHatasi(res, "Not metni zorunludur.");

  const sonuc = await prisma.noti.create({
    data: { musteri_id: Number(req.params.musteriId), metin: metin.trim(), onemli: onemli ? 1 : 0 },
  });
  res.status(201).json({ basarili: true, mesaj: "Not basariyla eklendi.", id: sonuc.id });
}));

/* ---- Bayi Notu Ekle ---- */
router.post("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const { metin, onemli } = req.body;
  if (!metin || !metin.trim()) return dogrulamaHatasi(res, "Not metni zorunludur.");

  const sonuc = await prisma.noti.create({
    data: { bayi_id: Number(req.params.bayiId), metin: metin.trim(), onemli: onemli ? 1 : 0 },
  });
  res.status(201).json({ basarili: true, mesaj: "Not basariyla eklendi.", id: sonuc.id });
}));

/* ---- Not Ekle (eski uyumluluk) ---- */
router.post("/", yetkiKontrol, hataYakala(async (req, res) => {
  const { musteri_id, bayi_id, metin, onemli } = req.body;
  if (!musteri_id && !bayi_id) return dogrulamaHatasi(res, "Musteri veya Bayi ID zorunludur.");
  if (!metin || !metin.trim()) return dogrulamaHatasi(res, "Not metni zorunludur.");

  const sonuc = await prisma.noti.create({
    data: { musteri_id: musteri_id || null, bayi_id: bayi_id || null, metin: metin.trim(), onemli: onemli ? 1 : 0 },
  });
  res.status(201).json({ basarili: true, mesaj: "Not basariyla eklendi.", id: sonuc.id });
}));

/* ---- Not Guncelle ---- */
router.put("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.noti.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Not bulunamadi.");

  const { metin, onemli } = req.body;
  await prisma.noti.update({
    where: { id },
    data: { metin: metin || undefined, onemli: onemli !== undefined ? (onemli ? 1 : 0) : 0 },
  });
  res.json({ basarili: true, mesaj: "Not basariyla guncellendi." });
}));

/* ---- Not Sil ---- */
router.delete("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.noti.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Not bulunamadi.");

  await prisma.noti.delete({ where: { id } });
  res.json({ basarili: true, mesaj: "Not basariyla silindi." });
}));

module.exports = router;
