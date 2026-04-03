const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Lisans Tiplerini Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const tipler = await prisma.lisansTipi.findMany({ orderBy: [{ sira: "asc" }, { id: "asc" }] });
  res.json({ basarili: true, veri: temizle(tipler) });
}));

/* ---- Sadece Aktif Lisans Tiplerini Listele ---- */
router.get("/aktif", hataYakala(async (req, res) => {
  const tipler = await prisma.lisansTipi.findMany({ where: { aktif: 1 }, orderBy: [{ sira: "asc" }, { id: "asc" }] });
  res.json({ basarili: true, veri: temizle(tipler) });
}));

/* ---- Tek Lisans Tipi Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const kayit = await prisma.lisansTipi.findUnique({ where: { id: Number(req.params.id) } });
  if (!kayit) return bulunamadiHatasi(res, "Lisans tipi bulunamadi.");
  res.json({ basarili: true, veri: temizle(kayit) });
}));

/* ---- Lisans Tipi Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { ad, kod, renk, gun, sira, aktif } = req.body;
  if (!ad || !kod) return dogrulamaHatasi(res, "Ad ve kod zorunludur.");

  const mevcut = await prisma.lisansTipi.findUnique({ where: { kod } });
  if (mevcut) return dogrulamaHatasi(res, "Bu kod zaten kullanilmaktadir.");

  const sonuc = await prisma.lisansTipi.create({
    data: {
      ad, kod,
      renk: renk || "blue",
      gun: parseInt(gun) || 365,
      sira: parseInt(sira) || 0,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Lisans tipi eklendi.", id: sonuc.id });
}));

/* ---- Lisans Tipi Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisansTipi.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans tipi bulunamadi.");

  const { ad, kod, renk, gun, sira, aktif } = req.body;

  if (kod) {
    const ayniKod = await prisma.lisansTipi.findFirst({ where: { kod, id: { not: id } } });
    if (ayniKod) return dogrulamaHatasi(res, "Bu kod zaten kullanilmaktadir.");
  }

  await prisma.lisansTipi.update({
    where: { id },
    data: {
      ad: ad || undefined,
      kod: kod || undefined,
      renk: renk || undefined,
      gun: gun !== undefined ? parseInt(gun) : undefined,
      sira: sira !== undefined ? parseInt(sira) : undefined,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : undefined,
    },
  });
  res.json({ basarili: true, mesaj: "Lisans tipi guncellendi." });
}));

/* ---- Lisans Tipi Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisansTipi.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans tipi bulunamadi.");

  const kullanan = await prisma.lisans.count({ where: { lisans_tipi: mevcut.kod } });
  if (kullanan > 0) {
    return dogrulamaHatasi(res, `Bu lisans tipi ${kullanan} lisansta kullanilmaktadir. Oncelikle bu lisanslarin tipini degistirin.`);
  }

  await prisma.lisansTipi.delete({ where: { id } });
  res.json({ basarili: true, mesaj: "Lisans tipi silindi." });
}));

module.exports = router;
