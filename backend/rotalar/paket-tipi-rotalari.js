const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Paket Tiplerini Listele ---- */
router.get("/", hataYakala(async (_req, res) => {
  const tipler = await prisma.paketTipi.findMany({
    where: { silinme_tarihi: null },
    orderBy: [{ sira: "asc" }, { ad: "asc" }],
  });
  res.json({ basarili: true, veri: temizle(tipler) });
}));

/* ---- Paket Tipi Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { ad, sira } = req.body;
  if (!ad || !ad.trim()) return dogrulamaHatasi(res, "Paket tipi adi zorunludur.");

  const mevcut = await prisma.paketTipi.findFirst({ where: { ad: ad.trim(), silinme_tarihi: null } });
  if (mevcut) return dogrulamaHatasi(res, "Bu isimde bir paket tipi zaten mevcut.");

  const sonuc = await prisma.paketTipi.create({
    data: { ad: ad.trim(), sira: parseInt(sira) || 0 },
  });
  res.status(201).json({ basarili: true, mesaj: "Paket tipi eklendi.", id: sonuc.id });
}));

/* ---- Paket Tipi Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { ad, aktif, sira } = req.body;
  const data = {};
  if (ad) data.ad = ad.trim();
  if (aktif !== undefined) data.aktif = aktif ? 1 : 0;
  if (sira !== undefined) data.sira = parseInt(sira) || 0;

  await prisma.paketTipi.update({ where: { id }, data });
  res.json({ basarili: true, mesaj: "Paket tipi guncellendi." });
}));

/* ---- Paket Tipi Sil (soft) ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.paketTipi.update({ where: { id }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
  res.json({ basarili: true, mesaj: "Paket tipi silindi." });
}));

module.exports = router;