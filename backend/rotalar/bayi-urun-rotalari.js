const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Bayinin Urunlerini Listele ---- */
router.get("/:bayiId/urunler", hataYakala(async (req, res) => {
  const bayi_id = Number(req.params.bayiId);
  const kayitlar = await prisma.bayiUrun.findMany({
    where: { bayi_id },
    include: { urun: { select: { id: true, ad: true, aktif: true } } },
  });
  const urunler = kayitlar.map(k => k.urun);
  res.json({ basarili: true, veri: temizle(urunler) });
}));

/* ---- Bayiye Urun Ata ---- */
router.post("/:bayiId/urunler", hataYakala(async (req, res) => {
  const bayi_id = Number(req.params.bayiId);
  const { urun_ids } = req.body;
  if (!Array.isArray(urun_ids) || urun_ids.length === 0) return dogrulamaHatasi(res, "Urun listesi zorunludur.");

  // Mevcut atamalari temizle
  await prisma.bayiUrun.deleteMany({ where: { bayi_id } });

  // Yeni atamalari olustur
  const data = urun_ids.map(urun_id => ({ bayi_id, urun_id: Number(urun_id) }));
  await prisma.bayiUrun.createMany({ data, skipDuplicates: true });

  res.json({ basarili: true, mesaj: "Bayi urunleri guncellendi." });
}));

module.exports = router;
