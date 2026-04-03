const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

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

module.exports = router;
