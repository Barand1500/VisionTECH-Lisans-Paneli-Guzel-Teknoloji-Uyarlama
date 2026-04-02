/* ============================================= */
/*  Lisans Rotalari - CRUD Islemleri              */
/*  Genisletilmis versiyon: bayi, odeme, modul    */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Rastgele Lisans Anahtari Olustur ---- */
function rastgeleLisansAnahtari() {
  const karakterler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const gruplar = [];
  for (let g = 0; g < 4; g++) {
    let grup = "";
    for (let i = 0; i < 4; i++) {
      grup += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
    }
    gruplar.push(grup);
  }
  return gruplar.join("-");
}

/* ---- Tum Lisanslari Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [lisanslar] = await havuz.query(`
    SELECT l.*,
      COALESCE(m.ad_soyad, m.sirket_adi) as musteri_adi,
      m.eposta as musteri_eposta,
      u.ad as urun_adi,
      p.ad as paket_adi,
      b.ad as bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    ORDER BY l.id DESC
  `);
  res.json({ basarili: true, veri: lisanslar });
}));

/* ---- Tek Lisans Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.*,
      COALESCE(m.ad_soyad, m.sirket_adi) as musteri_adi,
      m.eposta as musteri_eposta,
      u.ad as urun_adi,
      p.ad as paket_adi,
      b.ad as bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.id = ?
  `, [Number(req.params.id)]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Musteriye Ait Lisanslari Getir ---- */
router.get("/musteri/:musteriId", hataYakala(async (req, res) => {
  const [lisanslar] = await havuz.query(`
    SELECT l.*,
      u.ad as urun_adi,
      p.ad as paket_adi,
      b.ad as bayi_adi
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.musteri_id = ?
    ORDER BY l.bitis_tarihi ASC
  `, [Number(req.params.musteriId)]);
  res.json({ basarili: true, veri: lisanslar });
}));

/* ---- Lisans Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const {
    musteri_id, urun_id, paket_id, bayi_id,
    lisans_anahtari, lisans_tipi,
    baslangic_tarihi, bitis_tarihi, kullanim_gunu, durum, domain,
    fatura_no, fatura_tarihi, fatura_geldi,
    fiyat, indirim_orani, indirim_tutari, net_tutar,
    odeme_yontemi, odeme_durumu, odenen_tutar,
    kullanici_sayisi, ek_kullanici, mac_adresi, ip_adresi,
    moduller, otomatik_yenileme, bildirim_gun, notlar
  } = req.body;

  if (!musteri_id) return dogrulamaHatasi(res, "Musteri ID zorunludur.");
  if (!baslangic_tarihi || !bitis_tarihi) return dogrulamaHatasi(res, "Baslangic ve bitis tarihleri zorunludur.");

  /* Lisans anahtari yoksa otomatik olustur */
  const anahtar = lisans_anahtari || rastgeleLisansAnahtari();

  /* Fiyat hesaplamalari */
  const brut = parseFloat(fiyat) || 0;
  const indOran = parseFloat(indirim_orani) || 0;
  const indTutar = parseFloat(indirim_tutari) || (brut * indOran / 100);
  const netFiyat = parseFloat(net_tutar) || (brut - indTutar);

  const [sonuc] = await havuz.query(
    `INSERT INTO lisanslar (
      musteri_id, urun_id, paket_id, bayi_id,
      lisans_anahtari, lisans_tipi,
      baslangic_tarihi, bitis_tarihi, kullanim_gunu, durum, domain,
      fatura_no, fatura_tarihi, fatura_geldi,
      fiyat, indirim_orani, indirim_tutari, net_tutar,
      odeme_yontemi, odeme_durumu, odenen_tutar,
      kullanici_sayisi, ek_kullanici, mac_adresi, ip_adresi,
      moduller, otomatik_yenileme, bildirim_gun, notlar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      musteri_id,
      urun_id || null,
      paket_id || null,
      bayi_id || null,
      anahtar,
      lisans_tipi || "standart",
      baslangic_tarihi,
      bitis_tarihi,
      parseInt(kullanim_gunu) || 365,
      durum || "aktif",
      domain || null,
      fatura_no || null,
      fatura_tarihi || null,
      fatura_geldi ? 1 : 0,
      brut,
      indOran,
      indTutar,
      netFiyat,
      odeme_yontemi || null,
      odeme_durumu || "odenmedi",
      parseFloat(odenen_tutar) || 0,
      parseInt(kullanici_sayisi) || 1,
      parseInt(ek_kullanici) || 0,
      mac_adresi || null,
      ip_adresi || null,
      moduller ? JSON.stringify(moduller) : null,
      otomatik_yenileme ? 1 : 0,
      parseInt(bildirim_gun) || 30,
      notlar || null
    ]
  );

  res.status(201).json({ basarili: true, mesaj: "Lisans basariyla eklendi.", id: sonuc.insertId, lisans_anahtari: anahtar });
}));

/* ---- Lisans Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM lisanslar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const {
    musteri_id, urun_id, paket_id, bayi_id,
    lisans_anahtari, lisans_tipi,
    baslangic_tarihi, bitis_tarihi, kullanim_gunu, durum, domain,
    fatura_no, fatura_tarihi, fatura_geldi,
    fiyat, indirim_orani, indirim_tutari, net_tutar,
    odeme_yontemi, odeme_durumu, odenen_tutar,
    kullanici_sayisi, ek_kullanici, mac_adresi, ip_adresi,
    moduller, otomatik_yenileme, bildirim_gun, notlar
  } = req.body;

  /* Fiyat hesaplamalari */
  const brut = fiyat !== undefined ? parseFloat(fiyat) : undefined;
  const indOran = indirim_orani !== undefined ? parseFloat(indirim_orani) : undefined;
  let indTutar = indirim_tutari !== undefined ? parseFloat(indirim_tutari) : undefined;
  let netFiyat = net_tutar !== undefined ? parseFloat(net_tutar) : undefined;

  /* Eger indirim_tutari verilmemis ama brut ve oran varsa hesapla */
  if (indTutar === undefined && brut !== undefined && indOran !== undefined) {
    indTutar = brut * indOran / 100;
  }
  if (netFiyat === undefined && brut !== undefined && indTutar !== undefined) {
    netFiyat = brut - indTutar;
  }

  await havuz.query(
    `UPDATE lisanslar SET
      musteri_id = COALESCE(?, musteri_id),
      urun_id = ?,
      paket_id = ?,
      bayi_id = ?,
      lisans_anahtari = COALESCE(?, lisans_anahtari),
      lisans_tipi = COALESCE(?, lisans_tipi),
      baslangic_tarihi = COALESCE(?, baslangic_tarihi),
      bitis_tarihi = COALESCE(?, bitis_tarihi),
      kullanim_gunu = COALESCE(?, kullanim_gunu),
      durum = COALESCE(?, durum),
      domain = ?,
      fatura_no = ?,
      fatura_tarihi = ?,
      fatura_geldi = COALESCE(?, fatura_geldi),
      fiyat = COALESCE(?, fiyat),
      indirim_orani = COALESCE(?, indirim_orani),
      indirim_tutari = COALESCE(?, indirim_tutari),
      net_tutar = COALESCE(?, net_tutar),
      odeme_yontemi = ?,
      odeme_durumu = COALESCE(?, odeme_durumu),
      odenen_tutar = COALESCE(?, odenen_tutar),
      kullanici_sayisi = COALESCE(?, kullanici_sayisi),
      ek_kullanici = COALESCE(?, ek_kullanici),
      mac_adresi = ?,
      ip_adresi = ?,
      moduller = ?,
      otomatik_yenileme = COALESCE(?, otomatik_yenileme),
      bildirim_gun = COALESCE(?, bildirim_gun),
      notlar = ?
    WHERE id = ?`,
    [
      musteri_id || null,
      urun_id !== undefined ? (urun_id || null) : undefined,
      paket_id !== undefined ? (paket_id || null) : undefined,
      bayi_id !== undefined ? (bayi_id || null) : undefined,
      lisans_anahtari || null,
      lisans_tipi || null,
      baslangic_tarihi || null,
      bitis_tarihi || null,
      kullanim_gunu !== undefined ? parseInt(kullanim_gunu) : null,
      durum || null,
      domain !== undefined ? domain : null,
      fatura_no !== undefined ? fatura_no : null,
      fatura_tarihi !== undefined ? fatura_tarihi : null,
      fatura_geldi !== undefined ? (fatura_geldi ? 1 : 0) : null,
      brut,
      indOran,
      indTutar,
      netFiyat,
      odeme_yontemi !== undefined ? odeme_yontemi : null,
      odeme_durumu || null,
      odenen_tutar !== undefined ? parseFloat(odenen_tutar) : null,
      kullanici_sayisi !== undefined ? parseInt(kullanici_sayisi) : null,
      ek_kullanici !== undefined ? parseInt(ek_kullanici) : null,
      mac_adresi !== undefined ? mac_adresi : null,
      ip_adresi !== undefined ? ip_adresi : null,
      moduller !== undefined ? (moduller ? JSON.stringify(moduller) : null) : undefined,
      otomatik_yenileme !== undefined ? (otomatik_yenileme ? 1 : 0) : null,
      bildirim_gun !== undefined ? parseInt(bildirim_gun) : null,
      notlar !== undefined ? notlar : null,
      id
    ]
  );

  res.json({ basarili: true, mesaj: "Lisans basariyla guncellendi." });
}));

/* ---- Lisans Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM lisanslar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  await havuz.query("DELETE FROM lisanslar WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Lisans basariyla silindi." });
}));

/* ---- Yeni Lisans Anahtari Olustur ---- */
router.post("/:id/yeni-anahtar", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM lisanslar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const yeniAnahtar = rastgeleLisansAnahtari();
  await havuz.query("UPDATE lisanslar SET lisans_anahtari = ? WHERE id = ?", [yeniAnahtar, id]);

  res.json({ basarili: true, mesaj: "Yeni lisans anahtari olusturuldu.", lisans_anahtari: yeniAnahtar });
}));

/* ---- Lisans Durumlarini Toplu Guncelle (Cron icin) ---- */
router.post("/durum-guncelle", hataYakala(async (req, res) => {
  /* Suresi dolanlari guncelle */
  await havuz.query(`
    UPDATE lisanslar SET durum = 'suresi-dolmus'
    WHERE bitis_tarihi < CURDATE() AND durum NOT IN ('suresi-dolmus', 'dondurulmus')
  `);
  
  /* Suresi yaklasanlari guncelle (30 gun icinde bitecekler) */
  await havuz.query(`
    UPDATE lisanslar SET durum = 'yaklasan'
    WHERE bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND durum = 'aktif'
  `);

  /* Hala suresi olan ama yaklasan isaretlileri duzelt */
  await havuz.query(`
    UPDATE lisanslar SET durum = 'aktif'
    WHERE bitis_tarihi > DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND durum = 'yaklasan'
  `);

  res.json({ basarili: true, mesaj: "Lisans durumlari guncellendi." });
}));

module.exports = router;
