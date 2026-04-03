const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

function guvenliSayi(val, def = 0) {
  const n = Number(val);
  return isNaN(n) ? def : n;
}

/* ============================================================
   URUN TIPLERI
   ============================================================ */

router.get("/tipler", hataYakala(async (_req, res) => {
  const veriler = await prisma.urunTipi.findMany({
    where: { silinme_tarihi: null },
    include: { grup: { select: { ad: true } } },
    orderBy: { ad: "asc" },
  });
  const sonuc = veriler.map(({ grup, ...t }) => ({ ...t, grup_adi: grup?.ad || null }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

router.post("/tipler", hataYakala(async (req, res) => {
  const { ad, grup_id, aktif } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Tip adi zorunludur.");
  const sonuc = await prisma.urunTipi.create({ data: { ad, grup_id: grup_id || null, aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1 } });
  res.status(201).json({ basarili: true, mesaj: "Urun tipi eklendi.", id: sonuc.id });
}));

router.put("/tipler/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { ad, grup_id, aktif } = req.body;
  await prisma.urunTipi.update({
    where: { id },
    data: {
      ad: ad || undefined,
      grup_id: grup_id !== undefined ? (grup_id || null) : undefined,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : undefined,
    },
  });
  res.json({ basarili: true, mesaj: "Urun tipi guncellendi." });
}));

router.delete("/tipler/:id", hataYakala(async (req, res) => {
  await prisma.urunTipi.update({ where: { id: Number(req.params.id) }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
  res.json({ basarili: true, mesaj: "Urun tipi silindi." });
}));

/* ============================================================
   UYGULAMA TIPLERI
   ============================================================ */

router.get("/uygulama-tipler", hataYakala(async (_req, res) => {
  const veriler = await prisma.uygulamaTipi.findMany({
    where: { silinme_tarihi: null },
    include: { urunTipi: { select: { ad: true } } },
    orderBy: { ad: "asc" },
  });
  const sonuc = veriler.map(({ urunTipi, ...u }) => ({ ...u, urun_tipi_adi: urunTipi?.ad || null }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

router.post("/uygulama-tipler", hataYakala(async (req, res) => {
  const { ad, urun_tipi_id, aktif } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Uygulama tipi adi zorunludur.");
  const sonuc = await prisma.uygulamaTipi.create({ data: { ad, urun_tipi_id: urun_tipi_id || null, aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1 } });
  res.status(201).json({ basarili: true, mesaj: "Uygulama tipi eklendi.", id: sonuc.id });
}));

router.post("/uygulama-tipler/toplu", hataYakala(async (req, res) => {
  const { tipler } = req.body;
  if (!Array.isArray(tipler) || tipler.length === 0) return dogrulamaHatasi(res, "Tip listesi zorunludur.");

  const sonuclar = [];
  for (const tip of tipler) {
    if (!tip.ad) continue;
    const s = await prisma.uygulamaTipi.create({ data: { ad: tip.ad, urun_tipi_id: tip.urun_tipi_id || null, aktif: tip.aktif !== undefined ? (tip.aktif ? 1 : 0) : 1 } });
    sonuclar.push(s);
  }
  res.status(201).json({ basarili: true, mesaj: `${sonuclar.length} uygulama tipi eklendi.` });
}));

router.put("/uygulama-tipler/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { ad, urun_tipi_id, aktif } = req.body;
  await prisma.uygulamaTipi.update({
    where: { id },
    data: {
      ad: ad || undefined,
      urun_tipi_id: urun_tipi_id !== undefined ? (urun_tipi_id || null) : undefined,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : undefined,
    },
  });
  res.json({ basarili: true, mesaj: "Uygulama tipi guncellendi." });
}));

router.delete("/uygulama-tipler/:id", hataYakala(async (req, res) => {
  await prisma.uygulamaTipi.update({ where: { id: Number(req.params.id) }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
  res.json({ basarili: true, mesaj: "Uygulama tipi silindi." });
}));

/* ============================================================
   URUN GRUPLARI
   ============================================================ */

router.get("/gruplar", hataYakala(async (_req, res) => {
  const veriler = await prisma.urunGrubu.findMany({
    where: { silinme_tarihi: null },
    include: { _count: { select: { urunler: true } } },
    orderBy: { ad: "asc" },
  });
  const sonuc = veriler.map(({ _count, ...g }) => ({ ...g, urun_sayisi: _count.urunler }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

router.post("/gruplar", hataYakala(async (req, res) => {
  const { ad, aciklama, aktif } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Grup adi zorunludur.");
  const sonuc = await prisma.urunGrubu.create({ data: { ad, aciklama: aciklama || null, aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1 } });
  res.status(201).json({ basarili: true, mesaj: "Grup eklendi.", id: sonuc.id });
}));

router.put("/gruplar/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { ad, aciklama, aktif } = req.body;
  await prisma.urunGrubu.update({
    where: { id },
    data: {
      ad: ad || undefined,
      aciklama: aciklama !== undefined ? (aciklama || null) : undefined,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : undefined,
    },
  });
  res.json({ basarili: true, mesaj: "Grup guncellendi." });
}));

router.delete("/gruplar/:id", hataYakala(async (req, res) => {
  await prisma.urunGrubu.update({ where: { id: Number(req.params.id) }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
  res.json({ basarili: true, mesaj: "Grup silindi." });
}));

/* ============================================================
   URUNLER
   ============================================================ */

router.get("/", hataYakala(async (_req, res) => {
  const veriler = await prisma.urun.findMany({
    where: { silinme_tarihi: null },
    include: {
      grup: { select: { ad: true } },
      _count: { select: { paketler: true, lisanslar: true } },
    },
    orderBy: { id: "desc" },
  });
  const sonuc = veriler.map(({ grup, _count, ...u }) => ({
    ...u,
    grup_adi: grup?.ad || null,
    paket_sayisi: _count.paketler,
    lisans_sayisi: _count.lisanslar,
  }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

router.get("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const veri = await prisma.urun.findUnique({
    where: { id },
    include: { grup: { select: { ad: true } }, paketler: { where: { silinme_tarihi: null } } },
  });
  if (!veri || veri.silinme_tarihi) return bulunamadiHatasi(res, "Urun bulunamadi.");
  const { grup, ...urun } = veri;
  urun.grup_adi = grup?.ad || null;
  res.json({ basarili: true, veri: temizle(urun) });
}));

/* ---- Urunun Sablonunu Getir (paket olusturma icin) ---- */
router.get("/:id/sablon", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const urun = await prisma.urun.findUnique({ where: { id }, select: { sablon_id: true } });
  if (!urun || !urun.sablon_id) return res.json({ basarili: true, veri: null });

  const sablon = await prisma.urunSablon.findUnique({
    where: { id: urun.sablon_id },
    include: {
      ozellikler: { where: { aktif: 1 }, orderBy: { sira: "asc" } },
    },
  });
  res.json({ basarili: true, veri: sablon ? temizle(sablon) : null });
}));

router.post("/", hataYakala(async (req, res) => {
  const { ad, grup_id, urun_tipi, uygulama_tipi, varsayilan_gun, ozel_proje, aktif, aciklama, min_kullanici, max_kullanici, demo_gun, temel_fiyat, versiyon, logo_url, ozellikler } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Urun adi zorunludur.");

  const sonuc = await prisma.urun.create({
    data: {
      ad, grup_id: grup_id || null, urun_tipi: urun_tipi || null, uygulama_tipi: uygulama_tipi || null,
      varsayilan_gun: guvenliSayi(varsayilan_gun, 365), ozel_proje: ozel_proje ? 1 : 0,
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1, aciklama: aciklama || null,
      min_kullanici: guvenliSayi(min_kullanici, 1), max_kullanici: max_kullanici ? Number(max_kullanici) : null,
      demo_gun: guvenliSayi(demo_gun, 30), temel_fiyat: guvenliSayi(temel_fiyat, 0),
      versiyon: versiyon || null, logo_url: logo_url || null,
      ozellikler: ozellikler || undefined,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Urun basariyla eklendi.", id: sonuc.id });
}));

router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.urun.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Urun bulunamadi.");

  const { ad, grup_id, urun_tipi, uygulama_tipi, varsayilan_gun, ozel_proje, aktif, aciklama, min_kullanici, max_kullanici, demo_gun, temel_fiyat, versiyon, logo_url, ozellikler } = req.body;
  const data = {};
  if (ad) data.ad = ad;
  if (grup_id !== undefined) data.grup_id = grup_id || null;
  if (urun_tipi !== undefined) data.urun_tipi = urun_tipi || null;
  if (uygulama_tipi !== undefined) data.uygulama_tipi = uygulama_tipi || null;
  if (varsayilan_gun !== undefined) data.varsayilan_gun = guvenliSayi(varsayilan_gun, 365);
  if (ozel_proje !== undefined) data.ozel_proje = ozel_proje ? 1 : 0;
  if (aktif !== undefined) data.aktif = aktif ? 1 : 0;
  if (aciklama !== undefined) data.aciklama = aciklama || null;
  if (min_kullanici !== undefined) data.min_kullanici = guvenliSayi(min_kullanici, 1);
  if (max_kullanici !== undefined) data.max_kullanici = max_kullanici ? Number(max_kullanici) : null;
  if (demo_gun !== undefined) data.demo_gun = guvenliSayi(demo_gun, 30);
  if (temel_fiyat !== undefined) data.temel_fiyat = guvenliSayi(temel_fiyat, 0);
  if (versiyon !== undefined) data.versiyon = versiyon || null;
  if (logo_url !== undefined) data.logo_url = logo_url || null;
  if (ozellikler !== undefined) data.ozellikler = ozellikler;

  await prisma.urun.update({ where: { id }, data });
  res.json({ basarili: true, mesaj: "Urun basariyla guncellendi." });
}));

router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.urun.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Urun bulunamadi.");
  await prisma.urun.update({ where: { id }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
  res.json({ basarili: true, mesaj: "Urun basariyla silindi." });
}));

/* ============================================================
   PAKETLER
   ============================================================ */

router.get("/paketler/tumu", hataYakala(async (_req, res) => {
  const veriler = await prisma.paket.findMany({
    where: { silinme_tarihi: null },
    include: { urun: { select: { ad: true } } },
    orderBy: { id: "desc" },
  });
  const sonuc = veriler.map(({ urun, ...p }) => ({ ...p, urun_adi: urun?.ad || null }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

router.get("/:urunId/paketler", hataYakala(async (req, res) => {
  const urun_id = Number(req.params.urunId);
  const paketler = await prisma.paket.findMany({ where: { urun_id, silinme_tarihi: null }, orderBy: { id: "desc" } });
  res.json({ basarili: true, veri: temizle(paketler) });
}));

router.post("/paketler", hataYakala(async (req, res) => {
  const { urun_id, ad, tipi, kullanim_gunu, fiyat, kullanici_sayisi, aktif } = req.body;
  if (!urun_id || !ad) return dogrulamaHatasi(res, "Urun ve paket adi zorunludur.");

  const sonuc = await prisma.paket.create({
    data: {
      urun_id: Number(urun_id), ad, tipi: tipi || null,
      kullanim_gunu: guvenliSayi(kullanim_gunu, 365),
      fiyat: guvenliSayi(fiyat, 0),
      kullanici_sayisi: guvenliSayi(kullanici_sayisi, 1),
      aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Paket basariyla eklendi.", id: sonuc.id });
}));

router.put("/paketler/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { ad, tipi, kullanim_gunu, fiyat, kullanici_sayisi, aktif } = req.body;
  const data = {};
  if (ad) data.ad = ad;
  if (tipi !== undefined) data.tipi = tipi || null;
  if (kullanim_gunu !== undefined) data.kullanim_gunu = guvenliSayi(kullanim_gunu, 365);
  if (fiyat !== undefined) data.fiyat = guvenliSayi(fiyat, 0);
  if (kullanici_sayisi !== undefined) data.kullanici_sayisi = guvenliSayi(kullanici_sayisi, 1);
  if (aktif !== undefined) data.aktif = aktif ? 1 : 0;

  await prisma.paket.update({ where: { id }, data });
  res.json({ basarili: true, mesaj: "Paket basariyla guncellendi." });
}));

router.delete("/paketler/:id", hataYakala(async (req, res) => {
  await prisma.paket.update({ where: { id: Number(req.params.id) }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
  res.json({ basarili: true, mesaj: "Paket basariyla silindi." });
}));

module.exports = router;
