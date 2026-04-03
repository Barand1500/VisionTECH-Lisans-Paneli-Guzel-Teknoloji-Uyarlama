const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

function rastgeleLisansAnahtari() {
  return crypto.randomBytes(16).toString("hex").toUpperCase().replace(/(.{4})/g, "$1-").slice(0, -1);
}

/* ---- Tum Lisanslar ---- */
router.get("/", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, m.ad_soyad AS musteri_adi, m.sirket_adi, m.tur AS musteri_turu,
           u.ad AS urun_adi, p.ad AS paket_adi, b.ad AS bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    ORDER BY l.id DESC
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Musteriye Ait Lisanslar ---- */
router.get("/musteri/:musteriId", hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, u.ad AS urun_adi, p.ad AS paket_adi, b.ad AS bayi_adi
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.musteri_id = ?
    ORDER BY l.id DESC
  `, musteriId);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Tek Lisans ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await prisma.$queryRawUnsafe(`
    SELECT l.*, m.ad_soyad AS musteri_adi, m.sirket_adi, m.tur AS musteri_turu,
           u.ad AS urun_adi, p.ad AS paket_adi, b.ad AS bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.id = ?
  `, id);
  if (!row) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  res.json({ basarili: true, veri: temizle(row) });
}));

/* ---- Lisans Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const {
    musteri_id, urun_id, paket_id, bayi_id, lisans_tipi, baslangic_tarihi, bitis_tarihi,
    kullanim_gunu, durum, domain, fatura_no, fatura_tarihi, fatura_geldi,
    fiyat, indirim_orani, indirim_tutari, net_tutar,
    odeme_yontemi, odeme_durumu, odenen_tutar, kullanici_sayisi, ek_kullanici,
    mac_adresi, ip_adresi, moduller, otomatik_yenileme, bildirim_gun, notlar
  } = req.body;

  if (!musteri_id) return dogrulamaHatasi(res, "Musteri zorunludur.");
  if (!baslangic_tarihi || !bitis_tarihi) return dogrulamaHatasi(res, "Baslangic ve bitis tarihi zorunludur.");

  const brut = Number(fiyat) || 0;
  const indOran = Number(indirim_orani) || 0;
  const indTutar = Number(indirim_tutari) || 0;
  const hesaplananNet = net_tutar !== undefined ? Number(net_tutar) : brut - (brut * indOran / 100) - indTutar;

  const sonuc = await prisma.lisans.create({
    data: {
      musteri_id: Number(musteri_id),
      urun_id: urun_id ? Number(urun_id) : null,
      paket_id: paket_id ? Number(paket_id) : null,
      bayi_id: bayi_id ? Number(bayi_id) : null,
      lisans_anahtari: rastgeleLisansAnahtari(),
      lisans_tipi: lisans_tipi || "standart",
      baslangic_tarihi: new Date(baslangic_tarihi),
      bitis_tarihi: new Date(bitis_tarihi),
      kullanim_gunu: Number(kullanim_gunu) || 365,
      durum: durum || "aktif",
      domain: domain || null,
      fatura_no: fatura_no || null,
      fatura_tarihi: fatura_tarihi ? new Date(fatura_tarihi) : null,
      fatura_geldi: fatura_geldi ? 1 : 0,
      fiyat: brut,
      indirim_orani: indOran,
      indirim_tutari: indTutar,
      net_tutar: hesaplananNet,
      odeme_yontemi: odeme_yontemi || null,
      odeme_durumu: odeme_durumu || "odenmedi",
      odenen_tutar: Number(odenen_tutar) || 0,
      kullanici_sayisi: Number(kullanici_sayisi) || 1,
      ek_kullanici: Number(ek_kullanici) || 0,
      mac_adresi: mac_adresi || null,
      ip_adresi: ip_adresi || null,
      moduller: moduller || undefined,
      otomatik_yenileme: otomatik_yenileme ? 1 : 0,
      bildirim_gun: Number(bildirim_gun) || 30,
      notlar: notlar || null,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Lisans basariyla eklendi.", id: sonuc.id });
}));

/* ---- Lisans Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisans.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const {
    musteri_id, urun_id, paket_id, bayi_id, lisans_tipi, baslangic_tarihi, bitis_tarihi,
    kullanim_gunu, durum, domain, fatura_no, fatura_tarihi, fatura_geldi,
    fiyat, indirim_orani, indirim_tutari, net_tutar,
    odeme_yontemi, odeme_durumu, odenen_tutar, kullanici_sayisi, ek_kullanici,
    mac_adresi, ip_adresi, moduller, otomatik_yenileme, bildirim_gun, notlar
  } = req.body;

  const data = { guncelleme_tarihi: new Date() };
  if (musteri_id !== undefined) data.musteri_id = Number(musteri_id);
  if (urun_id !== undefined) data.urun_id = urun_id ? Number(urun_id) : null;
  if (paket_id !== undefined) data.paket_id = paket_id ? Number(paket_id) : null;
  if (bayi_id !== undefined) data.bayi_id = bayi_id ? Number(bayi_id) : null;
  if (lisans_tipi !== undefined) data.lisans_tipi = lisans_tipi;
  if (baslangic_tarihi !== undefined) data.baslangic_tarihi = new Date(baslangic_tarihi);
  if (bitis_tarihi !== undefined) data.bitis_tarihi = new Date(bitis_tarihi);
  if (kullanim_gunu !== undefined) data.kullanim_gunu = Number(kullanim_gunu) || 365;
  if (durum !== undefined) data.durum = durum;
  if (domain !== undefined) data.domain = domain || null;
  if (fatura_no !== undefined) data.fatura_no = fatura_no || null;
  if (fatura_tarihi !== undefined) data.fatura_tarihi = fatura_tarihi ? new Date(fatura_tarihi) : null;
  if (fatura_geldi !== undefined) data.fatura_geldi = fatura_geldi ? 1 : 0;
  if (odeme_yontemi !== undefined) data.odeme_yontemi = odeme_yontemi || null;
  if (odeme_durumu !== undefined) data.odeme_durumu = odeme_durumu;
  if (odenen_tutar !== undefined) data.odenen_tutar = Number(odenen_tutar) || 0;
  if (kullanici_sayisi !== undefined) data.kullanici_sayisi = Number(kullanici_sayisi) || 1;
  if (ek_kullanici !== undefined) data.ek_kullanici = Number(ek_kullanici) || 0;
  if (mac_adresi !== undefined) data.mac_adresi = mac_adresi || null;
  if (ip_adresi !== undefined) data.ip_adresi = ip_adresi || null;
  if (moduller !== undefined) data.moduller = moduller;
  if (otomatik_yenileme !== undefined) data.otomatik_yenileme = otomatik_yenileme ? 1 : 0;
  if (bildirim_gun !== undefined) data.bildirim_gun = Number(bildirim_gun) || 30;
  if (notlar !== undefined) data.notlar = notlar || null;

  /* Fiyat hesapla */
  if (fiyat !== undefined || indirim_orani !== undefined || indirim_tutari !== undefined || net_tutar !== undefined) {
    const brut = fiyat !== undefined ? Number(fiyat) : undefined;
    const indOran = indirim_orani !== undefined ? Number(indirim_orani) : undefined;
    const indTutar = indirim_tutari !== undefined ? Number(indirim_tutari) : undefined;

    if (brut !== undefined) data.fiyat = brut;
    if (indOran !== undefined) data.indirim_orani = indOran;
    if (indTutar !== undefined) data.indirim_tutari = indTutar;

    if (net_tutar !== undefined) {
      data.net_tutar = Number(net_tutar);
    } else if (brut !== undefined) {
      data.net_tutar = brut - (brut * (indOran || 0) / 100) - (indTutar || 0);
    }
  }

  await prisma.lisans.update({ where: { id }, data });
  res.json({ basarili: true, mesaj: "Lisans basariyla guncellendi." });
}));

/* ---- Lisans Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisans.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  await prisma.lisans.delete({ where: { id } });
  res.json({ basarili: true, mesaj: "Lisans basariyla silindi." });
}));

/* ---- Yeni Anahtar Uret ---- */
router.put("/:id/yeni-anahtar", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisans.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const yeniAnahtar = rastgeleLisansAnahtari();
  await prisma.lisans.update({ where: { id }, data: { lisans_anahtari: yeniAnahtar, guncelleme_tarihi: new Date() } });
  res.json({ basarili: true, mesaj: "Yeni lisans anahtari uretildi.", lisans_anahtari: yeniAnahtar });
}));

/* ---- Toplu Durum Guncelle ---- */
router.put("/durum-guncelle", hataYakala(async (_req, res) => {
  await prisma.$executeRawUnsafe(`UPDATE lisanslar SET durum = 'suresi-dolmus' WHERE bitis_tarihi < CURDATE() AND durum = 'aktif'`);
  await prisma.$executeRawUnsafe(`UPDATE lisanslar SET durum = 'aktif' WHERE baslangic_tarihi <= CURDATE() AND bitis_tarihi >= CURDATE() AND durum = 'suresi-dolmus'`);
  res.json({ basarili: true, mesaj: "Lisans durumlari guncellendi." });
}));

module.exports = router;
