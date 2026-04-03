const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol, sadaceAdmin } = require("../yardimcilar/yetki-middleware");

const GECERLI_IZINLER = [
  "ozet", "musteriler", "bayiler", "yonetim",
  "lisans_yonetimi", "raporlar", "takvim",
  "aktivite_logu", "yedekleme",
];

/* ---- Tum Rolleri Listele ---- */
router.get("/", yetkiKontrol, hataYakala(async (req, res) => {
  const roller = await prisma.rol.findMany({
    select: { id: true, ad: true, aciklama: true, izinler: true, varsayilan: true, aktif: true, olusturma_tarihi: true },
    orderBy: { id: "asc" },
  });
  res.json({ basarili: true, veri: temizle(roller) });
}));

/* ---- Tek Rol Getir ---- */
router.get("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const kayit = await prisma.rol.findUnique({ where: { id: Number(req.params.id) } });
  if (!kayit) return bulunamadiHatasi(res, "Rol bulunamadi.");
  res.json({ basarili: true, veri: temizle(kayit) });
}));

/* ---- Yeni Rol Ekle ---- */
router.post("/", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const { ad, aciklama, izinler } = req.body;
  if (!ad || !ad.trim()) return dogrulamaHatasi(res, "Rol adi zorunludur.");
  if (!Array.isArray(izinler)) return dogrulamaHatasi(res, "Izinler dizi olmalidir.");

  const gecersiz = izinler.filter(i => !GECERLI_IZINLER.includes(i));
  if (gecersiz.length > 0) return dogrulamaHatasi(res, "Gecersiz izin anahtarlari: " + gecersiz.join(", "));

  const mevcut = await prisma.rol.findUnique({ where: { ad: ad.trim().toLowerCase() } });
  if (mevcut) return dogrulamaHatasi(res, "Bu isimde bir rol zaten mevcut.");

  const sonuc = await prisma.rol.create({
    data: { ad: ad.trim().toLowerCase(), aciklama: aciklama || "", izinler },
  });
  res.status(201).json({ basarili: true, mesaj: "Rol basariyla eklendi.", id: sonuc.id });
}));

/* ---- Rol Guncelle ---- */
router.put("/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcutRol = await prisma.rol.findUnique({ where: { id } });
  if (!mevcutRol) return bulunamadiHatasi(res, "Rol bulunamadi.");

  const { ad, aciklama, izinler, aktif } = req.body;

  if (izinler !== undefined) {
    if (!Array.isArray(izinler)) return dogrulamaHatasi(res, "Izinler dizi olmalidir.");
    const gecersiz = izinler.filter(i => !GECERLI_IZINLER.includes(i));
    if (gecersiz.length > 0) return dogrulamaHatasi(res, "Gecersiz izin anahtarlari: " + gecersiz.join(", "));
  }

  if (ad) {
    const cakisan = await prisma.rol.findFirst({ where: { ad: ad.trim().toLowerCase(), id: { not: id } } });
    if (cakisan) return dogrulamaHatasi(res, "Bu isimde bir rol zaten mevcut.");
  }

  const guncelAd = ad ? ad.trim().toLowerCase() : mevcutRol.ad;
  const eskiAd = mevcutRol.ad;

  await prisma.rol.update({
    where: { id },
    data: {
      ad: guncelAd,
      aciklama: aciklama !== undefined ? aciklama : undefined,
      izinler: izinler || undefined,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : undefined,
    },
  });

  /* Eger rol adi degistiyse kullanicilar tablosunu da guncelle */
  if (ad && guncelAd !== eskiAd) {
    await prisma.kullanici.updateMany({ where: { rol: eskiAd }, data: { rol: guncelAd } });
  }

  res.json({ basarili: true, mesaj: "Rol basariyla guncellendi." });
}));

/* ---- Rol Sil ---- */
router.delete("/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcutRol = await prisma.rol.findUnique({ where: { id } });
  if (!mevcutRol) return bulunamadiHatasi(res, "Rol bulunamadi.");

  if (mevcutRol.varsayilan) return dogrulamaHatasi(res, "Varsayilan roller silinemez.");

  const kullananlar = await prisma.kullanici.count({ where: { rol: mevcutRol.ad } });
  if (kullananlar > 0) {
    return dogrulamaHatasi(res, "Bu rol " + kullananlar + " kullanici tarafindan kullaniliyor. Once kullanicilarin rolunu degistirin.");
  }

  await prisma.rol.delete({ where: { id } });
  res.json({ basarili: true, mesaj: "Rol basariyla silindi." });
}));

/* ---- Gecerli izin listesini dondur (frontend icin) ---- */
router.get("/meta/izinler", yetkiKontrol, hataYakala(async (req, res) => {
  res.json({
    basarili: true, veri: GECERLI_IZINLER.map(k => ({
      anahtar: k,
      etiket: {
        ozet: "Ozet Paneli", musteriler: "Musteriler", bayiler: "Bayiler",
        yonetim: "Yonetim", lisans_yonetimi: "Lisans Yonetimi", raporlar: "Raporlar",
        takvim: "Takvim", aktivite_logu: "Aktivite Logu", yedekleme: "Yedekleme",
      }[k] || k,
    })),
  });
}));

module.exports = router;
