const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

function rastgeleLisansAnahtari() {
  return crypto.randomBytes(16).toString("hex").toUpperCase().replace(/(.{4})/g, "$1-").slice(0, -1);
}

/* ---- Tum Lisanslar (bayi_id filtresi destekli) ---- */
router.get("/", hataYakala(async (req, res) => {
  const { bayi_id } = req.query;
  let whereClause = "WHERE l.silinme_tarihi IS NULL";
  const params = [];
  
  if (bayi_id) {
    whereClause += " AND l.bayi_id = ?";
    params.push(Number(bayi_id));
  }
  
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, m.ad_soyad AS musteri_adi, m.sirket_adi, m.tur AS musteri_turu,
           u.ad AS urun_adi, u.sablon_id, p.ad AS paket_adi, b.ad AS bayi_adi,
           lt.ad AS lisans_tipi_adi, lt.renk AS lisans_tipi_renk, lt.gun AS lisans_tipi_gun
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    LEFT JOIN lisans_tipleri lt ON l.lisans_tipi = lt.kod
    ${whereClause}
    ORDER BY l.id DESC
  `, ...params);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Musteriye Ait Lisanslar ---- */
router.get("/musteri/:musteriId", hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, u.ad AS urun_adi, u.sablon_id, p.ad AS paket_adi, b.ad AS bayi_adi,
           lt.ad AS lisans_tipi_adi, lt.renk AS lisans_tipi_renk, lt.gun AS lisans_tipi_gun
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    LEFT JOIN lisans_tipleri lt ON l.lisans_tipi = lt.kod
    WHERE l.musteri_id = ?
    AND l.silinme_tarihi IS NULL
    ORDER BY l.id DESC
  `, musteriId);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Bayinin Lisansları ---- */
router.get("/bayi/:bayiId", hataYakala(async (req, res) => {
  const bayiId = Number(req.params.bayiId);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, u.ad AS urun_adi, u.sablon_id, p.ad AS paket_adi, m.ad_soyad AS musteri_adi,
           m.sirket_adi, lt.ad AS lisans_tipi_adi, lt.renk AS lisans_tipi_renk, lt.gun AS lisans_tipi_gun
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN lisans_tipleri lt ON l.lisans_tipi = lt.kod
    WHERE l.bayi_id = ?
    AND l.silinme_tarihi IS NULL
    ORDER BY l.id DESC
  `, bayiId);
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
    AND l.silinme_tarihi IS NULL
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
    mac_adresi, ip_adresi, moduller, sablon_verileri, otomatik_yenileme, bildirim_gun, notlar,
    suresiz
  } = req.body;

  if (!musteri_id) return dogrulamaHatasi(res, "Musteri zorunludur.");
  if (!baslangic_tarihi) return dogrulamaHatasi(res, "Baslangic tarihi zorunludur.");
  if (!suresiz && !bitis_tarihi) return dogrulamaHatasi(res, "Bitis tarihi zorunludur (suresiz degilse).");

  const brut = Number(fiyat) || 0;
  const indOran = Number(indirim_orani) || 0;
  const indTutar = Number(indirim_tutari) || 0;
  const hesaplananNet = net_tutar !== undefined ? Number(net_tutar) : brut - (brut * indOran / 100) - indTutar;

  /* Şablon verilerini moduller alanına birleştir */
  let birlesikModuller = moduller || {};
  if (sablon_verileri && typeof sablon_verileri === "object") {
    birlesikModuller = { ...birlesikModuller, sablon_verileri };
  }

  const sonuc = await prisma.lisans.create({
    data: {
      musteri_id: Number(musteri_id),
      urun_id: urun_id ? Number(urun_id) : null,
      paket_id: paket_id ? Number(paket_id) : null,
      bayi_id: bayi_id ? Number(bayi_id) : null,
      lisans_anahtari: rastgeleLisansAnahtari(),
      lisans_tipi: lisans_tipi || "standart",
      suresiz: suresiz ? 1 : 0,
      baslangic_tarihi: new Date(baslangic_tarihi),
      bitis_tarihi: suresiz ? null : new Date(bitis_tarihi),
      kullanim_gunu: suresiz ? 0 : (Number(kullanim_gunu) || 365),
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
      moduller: Object.keys(birlesikModuller).length > 0 ? birlesikModuller : undefined,
      otomatik_yenileme: otomatik_yenileme ? 1 : 0,
      bildirim_gun: Number(bildirim_gun) || 30,
      notlar: notlar || null,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Lisans basariyla eklendi.", id: sonuc.id, lisans_anahtari: sonuc.lisans_anahtari });
}));

/* ---- Lisans Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisans.findUnique({ where: { id }, select: { id: true, moduller: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const {
    musteri_id, urun_id, paket_id, bayi_id, lisans_tipi, baslangic_tarihi, bitis_tarihi,
    kullanim_gunu, durum, domain, fatura_no, fatura_tarihi, fatura_geldi,
    fiyat, indirim_orani, indirim_tutari, net_tutar,
    odeme_yontemi, odeme_durumu, odenen_tutar, kullanici_sayisi, ek_kullanici,
    mac_adresi, ip_adresi, moduller, sablon_verileri, otomatik_yenileme, bildirim_gun, notlar,
    suresiz
  } = req.body;

  const data = { guncelleme_tarihi: new Date() };
  if (musteri_id !== undefined) data.musteri_id = Number(musteri_id);
  if (urun_id !== undefined) data.urun_id = urun_id ? Number(urun_id) : null;
  if (paket_id !== undefined) data.paket_id = paket_id ? Number(paket_id) : null;
  if (bayi_id !== undefined) data.bayi_id = bayi_id ? Number(bayi_id) : null;
  if (lisans_tipi !== undefined) data.lisans_tipi = lisans_tipi;
  if (suresiz !== undefined) data.suresiz = suresiz ? 1 : 0;
  if (baslangic_tarihi !== undefined) data.baslangic_tarihi = new Date(baslangic_tarihi);
  if (bitis_tarihi !== undefined) data.bitis_tarihi = bitis_tarihi ? new Date(bitis_tarihi) : null;
  if (kullanim_gunu !== undefined) data.kullanim_gunu = Number(kullanim_gunu) || 0;
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
  if (otomatik_yenileme !== undefined) data.otomatik_yenileme = otomatik_yenileme ? 1 : 0;
  if (bildirim_gun !== undefined) data.bildirim_gun = Number(bildirim_gun) || 30;
  if (notlar !== undefined) data.notlar = notlar || null;

  /* Şablon verilerini moduller alanına birleştir */
  if (moduller !== undefined || sablon_verileri !== undefined) {
    let birlesikModuller = mevcut.moduller || {};
    if (moduller !== undefined) birlesikModuller = { ...birlesikModuller, ...moduller };
    if (sablon_verileri !== undefined && typeof sablon_verileri === "object") {
      birlesikModuller = { ...birlesikModuller, sablon_verileri };
    }
    data.moduller = Object.keys(birlesikModuller).length > 0 ? birlesikModuller : null;
  }

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
  await prisma.lisans.update({ where: { id }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
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
  await prisma.$executeRawUnsafe(`UPDATE lisanslar SET durum = 'suresi-dolmus' WHERE bitis_tarihi < CURDATE() AND bitis_tarihi IS NOT NULL AND suresiz = 0 AND durum = 'aktif' AND silinme_tarihi IS NULL`);
  await prisma.$executeRawUnsafe(`UPDATE lisanslar SET durum = 'aktif' WHERE baslangic_tarihi <= CURDATE() AND (bitis_tarihi >= CURDATE() OR suresiz = 1) AND durum = 'suresi-dolmus' AND silinme_tarihi IS NULL`);
  res.json({ basarili: true, mesaj: "Lisans durumlari guncellendi." });
}));

module.exports = router;
