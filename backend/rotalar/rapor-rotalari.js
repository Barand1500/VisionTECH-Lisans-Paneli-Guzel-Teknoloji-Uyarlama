/* ============================================= */
/*  Rapor Rotalari - Lisans Bazli Raporlar        */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ---- Satislar (Tum Lisanslar) ---- */
router.get("/satislar", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(u.ad, '') as urun, COALESCE(p.ad, '') as paket,
      COALESCE(l.domain, '') as domain,
      COALESCE(l.kullanici_sayisi, '') as kullanici,
      COALESCE(l.fiyat, 0) as tutar,
      DATE_FORMAT(l.olusturma_tarihi, '%Y-%m-%d') as tarih,
      l.durum
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    ORDER BY l.olusturma_tarihi DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Aktif Paketler ---- */
router.get("/aktif-paketler", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(u.ad, '') as urun, COALESCE(p.ad, '') as paketAdi,
      DATE_FORMAT(l.baslangic_tarihi, '%Y-%m-%d') as baslangic,
      DATE_FORMAT(l.bitis_tarihi, '%Y-%m-%d') as bitis,
      DATEDIFF(l.bitis_tarihi, CURDATE()) as kalanGun,
      COALESCE(l.kullanici_sayisi, 1) as kullaniciSayisi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.durum = 'aktif' AND l.bitis_tarihi >= CURDATE()
    ORDER BY l.bitis_tarihi ASC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Aktif Cihazlar (henuz tablo yok - bos doner) ---- */
router.get("/aktif-cihazlar", hataYakala(async (req, res) => {
  res.json({ basarili: true, veri: [] });
}));

/* ---- Suresi Yaklasanlar (30 gun icinde bitecekler) ---- */
router.get("/suresi-yaklasanlar", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(u.ad, '') as urun, COALESCE(p.ad, '') as paket,
      DATE_FORMAT(l.bitis_tarihi, '%Y-%m-%d') as bitis,
      DATEDIFF(l.bitis_tarihi, CURDATE()) as kalanGun
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    ORDER BY l.bitis_tarihi ASC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Suresi Bitenler ---- */
router.get("/suresi-bitenler", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(u.ad, '') as urun, COALESCE(p.ad, '') as paket,
      DATE_FORMAT(l.bitis_tarihi, '%Y-%m-%d') as bitis,
      DATEDIFF(CURDATE(), l.bitis_tarihi) as gecenGun
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.bitis_tarihi < CURDATE()
    ORDER BY l.bitis_tarihi DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Tahsilatlar ---- */
router.get("/tahsilatlar", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(l.fatura_no, '') as faturaNo,
      COALESCE(l.fiyat, 0) as tutar,
      DATE_FORMAT(l.olusturma_tarihi, '%Y-%m-%d') as odemeTarihi,
      CASE WHEN l.fatura_geldi = 1 THEN 'Odendi' ELSE 'Bekliyor' END as durum
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    WHERE l.fiyat > 0 OR l.fatura_no IS NOT NULL
    ORDER BY l.olusturma_tarihi DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

module.exports = router;
