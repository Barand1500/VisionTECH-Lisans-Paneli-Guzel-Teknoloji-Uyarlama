const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

/* ---- Tüm Sektörleri Listele (müşteri/bayi sayıları ile) ---- */
router.get("/", yetkiKontrol, hataYakala(async (req, res) => {
  const sektorler = await prisma.sektor.findMany({
    include: {
      _count: {
        select: {
          musteriler: { where: { silinme_tarihi: null } },
          bayiler: { where: { silinme_tarihi: null } },
        },
      },
    },
    orderBy: { ad: "asc" },
  });
  const sonuc = sektorler.map(({ _count, ...s }) => ({
    ...s,
    musteri_sayisi: _count.musteriler,
    bayi_sayisi: _count.bayiler,
  }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

/* ---- Yeni Sektör Ekle ---- */
router.post("/", yetkiKontrol, hataYakala(async (req, res) => {
  const { ad } = req.body;
  if (!ad || !ad.trim()) return dogrulamaHatasi(res, "Sektör adı zorunludur.");

  const mevcut = await prisma.sektor.findUnique({ where: { ad: ad.trim() } });
  if (mevcut) return dogrulamaHatasi(res, "Bu isimde bir sektör zaten mevcut.");

  const sonuc = await prisma.sektor.create({ data: { ad: ad.trim() } });
  res.status(201).json({ basarili: true, mesaj: "Sektör eklendi.", id: sonuc.id });
}));

/* ---- Sektör Güncelle ---- */
router.put("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const { ad, aktif } = req.body;
  const id = Number(req.params.id);

  const mevcut = await prisma.sektor.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Sektör bulunamadı.");

  if (ad !== undefined) {
    if (!ad.trim()) return dogrulamaHatasi(res, "Sektör adı boş olamaz.");
    const ayniAd = await prisma.sektor.findFirst({ where: { ad: ad.trim(), id: { not: id } } });
    if (ayniAd) return dogrulamaHatasi(res, "Bu isimde bir sektör zaten mevcut.");
  }

  const data = {};
  if (ad !== undefined) data.ad = ad.trim();
  if (aktif !== undefined) data.aktif = aktif ? 1 : 0;

  if (Object.keys(data).length === 0) return dogrulamaHatasi(res, "Güncellenecek alan belirtilmedi.");

  await prisma.sektor.update({ where: { id }, data });
  res.json({ basarili: true, mesaj: "Sektör güncellendi." });
}));

/* ---- Sektör Sil ---- */
router.delete("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.sektor.findUnique({ where: { id } });
  if (!mevcut) return bulunamadiHatasi(res, "Sektör bulunamadı.");

  await prisma.sektor.delete({ where: { id } });
  res.json({ basarili: true, mesaj: "Sektör silindi." });
}));

module.exports = router;
