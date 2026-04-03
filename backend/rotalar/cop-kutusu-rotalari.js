const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");

/* ---- Tüm Silinen Kayıtları Getir ---- */
router.get("/", async (req, res, next) => {
  try {
    const musteriler = await prisma.musteri.findMany({
      where: { silinme_tarihi: { not: null } },
      select: { id: true, ad_soyad: true, sirket_adi: true, silinme_tarihi: true },
      orderBy: { silinme_tarihi: "desc" },
    });
    const bayiler = await prisma.bayi.findMany({
      where: { silinme_tarihi: { not: null } },
      select: { id: true, ad: true, silinme_tarihi: true },
      orderBy: { silinme_tarihi: "desc" },
    });

    const tumSilinen = [
      ...musteriler.map(m => ({ id: m.id, ad: m.ad_soyad || m.sirket_adi || "Bilinmiyor", silinme_tarihi: m.silinme_tarihi, tip: "musteri" })),
      ...bayiler.map(b => ({ id: b.id, ad: b.ad, silinme_tarihi: b.silinme_tarihi, tip: "bayi" })),
    ].sort((a, b) => new Date(b.silinme_tarihi) - new Date(a.silinme_tarihi));

    res.json({ basarili: true, veri: temizle(tumSilinen) });
  } catch (hata) { next(hata); }
});

/* ---- Müşteriyi Geri Yükle ---- */
router.post("/musteriler/:id/geri-yukle", async (req, res, next) => {
  try {
    await prisma.musteri.update({ where: { id: Number(req.params.id) }, data: { silinme_tarihi: null, durum: "aktif" } });
    res.json({ basarili: true, mesaj: "Müşteri geri yüklendi" });
  } catch (hata) { next(hata); }
});

/* ---- Bayiyi Geri Yükle ---- */
router.post("/bayiler/:id/geri-yukle", async (req, res, next) => {
  try {
    await prisma.bayi.update({ where: { id: Number(req.params.id) }, data: { silinme_tarihi: null, durum: "aktif" } });
    res.json({ basarili: true, mesaj: "Bayi geri yüklendi" });
  } catch (hata) { next(hata); }
});

/* ---- Musteriyi Kalici Sil ---- */
router.delete("/musteriler/:id/kalici", async (req, res, next) => {
  try {
    await prisma.musteri.delete({ where: { id: Number(req.params.id) } });
    res.json({ basarili: true, mesaj: "Musteri kalici olarak silindi" });
  } catch (hata) { next(hata); }
});

/* ---- Bayiyi Kalıcı Sil ---- */
router.delete("/bayiler/:id/kalici", async (req, res, next) => {
  try {
    await prisma.bayi.delete({ where: { id: Number(req.params.id) } });
    res.json({ basarili: true, mesaj: "Bayi kalıcı olarak silindi" });
  } catch (hata) { next(hata); }
});

module.exports = router;
