const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Desteklenen varlik tipleri ---- */
const VARLIK_TIPLERI = {
  musteri:      { model: "musteri",      adAlan: (r) => r.ad_soyad || r.sirket_adi || "Bilinmiyor", select: { id: true, ad_soyad: true, sirket_adi: true, silinme_tarihi: true } },
  bayi:         { model: "bayi",         adAlan: (r) => r.ad || r.sirket_adi || "Bilinmiyor", select: { id: true, ad: true, sirket_adi: true, silinme_tarihi: true } },
  urun:         { model: "urun",         adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  paket:        { model: "paket",        adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  lisans:       { model: "lisans",       adAlan: (r) => r.lisans_anahtari || `Lisans #${r.id}`, select: { id: true, lisans_anahtari: true, silinme_tarihi: true } },
  lisansTipi:   { model: "lisansTipi",   adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  urunTipi:     { model: "urunTipi",     adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  uygulamaTipi: { model: "uygulamaTipi", adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  urunGrubu:    { model: "urunGrubu",    adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  surum:        { model: "surum",        adAlan: (r) => `${r.urun_adi} v${r.surum}`, select: { id: true, urun_adi: true, surum: true, silinme_tarihi: true } },
  urunSablon:   { model: "urunSablon",   adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  rol:          { model: "rol",          adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  sektor:       { model: "sektor",       adAlan: (r) => r.ad, select: { id: true, ad: true, silinme_tarihi: true } },
  kullanici:    { model: "kullanici",    adAlan: (r) => r.ad_soyad || r.kullanici_adi, select: { id: true, ad_soyad: true, kullanici_adi: true, silinme_tarihi: true } },
};

/* ---- Tum Silinen Kayitlari Getir ---- */
router.get("/", hataYakala(async (_req, res) => {
  const tumSilinen = [];

  for (const [tip, cfg] of Object.entries(VARLIK_TIPLERI)) {
    const kayitlar = await prisma[cfg.model].findMany({
      where: { silinme_tarihi: { not: null } },
      select: cfg.select,
      orderBy: { silinme_tarihi: "desc" },
    });
    for (const k of kayitlar) {
      tumSilinen.push({ id: k.id, ad: cfg.adAlan(k), silinme_tarihi: k.silinme_tarihi, tip });
    }
  }

  tumSilinen.sort((a, b) => new Date(b.silinme_tarihi) - new Date(a.silinme_tarihi));
  res.json({ basarili: true, veri: temizle(tumSilinen) });
}));

/* ---- Geri Yukle (herhangi bir varlik) ---- */
router.post("/:tip/:id/geri-yukle", hataYakala(async (req, res) => {
  const { tip, id } = req.params;
  const cfg = VARLIK_TIPLERI[tip];
  if (!cfg) return res.status(400).json({ basarili: false, mesaj: "Gecersiz varlik tipi." });

  const data = { silinme_tarihi: null };
  // durum alanı olan modeller için aktif yap
  if (["musteri", "bayi", "urun", "paket", "lisansTipi", "urunTipi", "uygulamaTipi", "urunGrubu", "surum", "urunSablon", "rol", "sektor"].includes(tip)) {
    data.durum = "aktif";
  }
  if (tip === "lisans") data.durum = "aktif";
  if (tip === "kullanici") data.aktif = 1;
  if (tip === "urunSablon") data.aktif = 1;

  await prisma[cfg.model].update({ where: { id: Number(id) }, data });
  res.json({ basarili: true, mesaj: "Kayit geri yuklendi." });
}));

/* ---- Kalici Sil (herhangi bir varlik) ---- */
router.delete("/:tip/:id/kalici", hataYakala(async (req, res) => {
  const { tip, id } = req.params;
  const cfg = VARLIK_TIPLERI[tip];
  if (!cfg) return res.status(400).json({ basarili: false, mesaj: "Gecersiz varlik tipi." });

  await prisma[cfg.model].delete({ where: { id: Number(id) } });
  res.json({ basarili: true, mesaj: "Kayit kalici olarak silindi." });
}));

/* ---- Toplu Kalici Sil ---- */
router.post("/toplu-sil", hataYakala(async (req, res) => {
  const { kayitlar } = req.body; // [{ tip: "musteri", id: 1 }, { tip: "urun", id: 2 }, ...]
  
  if (!Array.isArray(kayitlar) || kayitlar.length === 0) {
    return res.status(400).json({ basarili: false, mesaj: "Silinecek kayit bulunamadi." });
  }

  let silinenSayisi = 0;
  const hatalar = [];

  for (const kayit of kayitlar) {
    const cfg = VARLIK_TIPLERI[kayit.tip];
    if (!cfg) {
      hatalar.push(`Gecersiz tip: ${kayit.tip}`);
      continue;
    }
    try {
      await prisma[cfg.model].delete({ where: { id: Number(kayit.id) } });
      silinenSayisi++;
    } catch (e) {
      hatalar.push(`${kayit.tip} #${kayit.id}: ${e.message}`);
    }
  }

  res.json({ 
    basarili: true, 
    mesaj: `${silinenSayisi} kayit kalici olarak silindi.`,
    silinenSayisi,
    hatalar: hatalar.length > 0 ? hatalar : undefined
  });
}));

module.exports = router;
