/* ============================================= */
/*  Rapor Rotalari - Lisans Bazli Raporlar        */
/*  Guncellenmis: Yeni lisans alanlari destegi   */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ---- Satislar (Tum Lisanslar) ---- */
router.get("/satislar", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, 
      COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(u.ad, '') as urun, 
      COALESCE(p.ad, '') as paket,
      COALESCE(l.domain, '') as domain,
      CONCAT(COALESCE(l.kullanici_sayisi, 1), 
        CASE WHEN l.ek_kullanici > 0 THEN CONCAT(' + ', l.ek_kullanici) ELSE '' END) as kullanici,
      COALESCE(l.net_tutar, l.fiyat, 0) as tutar,
      DATE_FORMAT(COALESCE(l.fatura_tarihi, l.olusturma_tarihi), '%Y-%m-%d') as tarih,
      CASE 
        WHEN l.odeme_durumu = 'odendi' THEN 'Tamamlandı'
        WHEN l.odeme_durumu = 'kismi' THEN 'Bekliyor'
        WHEN l.durum = 'iptal' THEN 'İptal'
        ELSE 'Bekliyor'
      END as durum,
      l.lisans_tipi,
      COALESCE(b.ad, '') as bayi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    ORDER BY l.olusturma_tarihi DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Aktif Paketler ---- */
router.get("/aktif-paketler", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, 
      COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(u.ad, '') as urun, 
      COALESCE(p.ad, l.lisans_tipi, '') as paketAdi,
      DATE_FORMAT(l.baslangic_tarihi, '%Y-%m-%d') as baslangic,
      DATE_FORMAT(l.bitis_tarihi, '%Y-%m-%d') as bitis,
      DATEDIFF(l.bitis_tarihi, CURDATE()) as kalanGun,
      COALESCE(l.kullanici_sayisi, 1) + COALESCE(l.ek_kullanici, 0) as kullaniciSayisi,
      l.domain,
      l.lisans_anahtari,
      l.otomatik_yenileme
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.durum = 'aktif' AND l.bitis_tarihi >= CURDATE()
    ORDER BY l.bitis_tarihi ASC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Aktif Cihazlar ---- */
router.get("/aktif-cihazlar", hataYakala(async (req, res) => {
  /* Cihazlar tablosu olusturuldu mu kontrol et */
  const [tables] = await havuz.query(`SHOW TABLES LIKE 'cihazlar'`);
  
  if (tables.length === 0) {
    /* Tablo yoksa lisanslardan MAC/IP bilgisi cek */
    const [satirlar] = await havuz.query(`
      SELECT l.id, 
        COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
        CONCAT('PC-', l.id) as bilgisayarAdi,
        COALESCE(l.ip_adresi, '-') as ipAdresi,
        COALESCE(l.mac_adresi, '-') as islemciNo,
        '1.0.0' as surum,
        DATE_FORMAT(l.baslangic_tarihi, '%d.%m.%Y %H:%i') as aktivasyonZamani,
        DATE_FORMAT(COALESCE(l.guncelleme_tarihi, l.olusturma_tarihi), '%d.%m.%Y %H:%i') as sonBaglanti,
        CASE WHEN l.durum = 'aktif' THEN 'Çevrimiçi' ELSE 'Çevrimdışı' END as durum
      FROM lisanslar l
      LEFT JOIN musteriler m ON l.musteri_id = m.id
      WHERE l.mac_adresi IS NOT NULL OR l.ip_adresi IS NOT NULL
      ORDER BY l.guncelleme_tarihi DESC
    `);
    return res.json({ basarili: true, veri: satirlar });
  }
  
  /* Cihazlar tablosu var - oradan cek */
  const [satirlar] = await havuz.query(`
    SELECT c.id, 
      COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      c.bilgisayar_adi as bilgisayarAdi,
      c.ip_adresi as ipAdresi,
      c.mac_adresi as islemciNo,
      c.surum,
      DATE_FORMAT(c.aktivasyon_tarihi, '%d.%m.%Y %H:%i') as aktivasyonZamani,
      DATE_FORMAT(c.son_baglanti, '%d.%m.%Y %H:%i') as sonBaglanti,
      CASE WHEN TIMESTAMPDIFF(MINUTE, c.son_baglanti, NOW()) <= 5 THEN 'Çevrimiçi' ELSE 'Çevrimdışı' END as durum
    FROM cihazlar c
    LEFT JOIN lisanslar l ON c.lisans_id = l.id
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    ORDER BY c.son_baglanti DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Suresi Yaklasanlar (bildirim gun kadar once) ---- */
router.get("/suresi-yaklasanlar", hataYakala(async (req, res) => {
  const gun = req.query.gun || 30;
  const [satirlar] = await havuz.query(`
    SELECT l.id, 
      COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      (SELECT mt.telefon FROM musteri_telefonlari mt WHERE mt.musteri_id = m.id LIMIT 1) as telefon,
      m.eposta as email,
      COALESCE(u.ad, '') as urun, 
      COALESCE(p.ad, l.lisans_tipi, '') as paket,
      DATE_FORMAT(l.bitis_tarihi, '%Y-%m-%d') as bitis,
      DATEDIFF(l.bitis_tarihi, CURDATE()) as kalanGun,
      l.otomatik_yenileme,
      l.bildirim_gun
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.durum = 'aktif' 
      AND l.bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY l.bitis_tarihi ASC
  `, [gun]);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Suresi Bitenler ---- */
router.get("/suresi-bitenler", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.id, l.musteri_id,
      COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      (SELECT mt.telefon FROM musteri_telefonlari mt WHERE mt.musteri_id = m.id LIMIT 1) as telefon,
      m.eposta as email,
      COALESCE(u.ad, '') as urun, 
      COALESCE(p.ad, l.lisans_tipi, '') as paket,
      DATE_FORMAT(l.bitis_tarihi, '%Y-%m-%d') as bitis,
      DATEDIFF(CURDATE(), l.bitis_tarihi) as gecenGun,
      l.lisans_anahtari,
      l.domain
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
    SELECT l.id, 
      COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
      COALESCE(l.fatura_no, '') as faturaNo,
      COALESCE(l.net_tutar, l.fiyat, 0) as tutar,
      COALESCE(l.odenen_tutar, 0) as odenenTutar,
      DATE_FORMAT(COALESCE(l.fatura_tarihi, l.olusturma_tarihi), '%Y-%m-%d') as odemeTarihi,
      CASE l.odeme_yontemi
        WHEN 'nakit' THEN 'Nakit'
        WHEN 'havale' THEN 'Havale'
        WHEN 'eft' THEN 'EFT'
        WHEN 'kredi_karti' THEN 'Kredi Kartı'
        WHEN 'cek' THEN 'Çek'
        WHEN 'senet' THEN 'Senet'
        ELSE 'Diğer'
      END as yontem,
      CASE l.odeme_durumu
        WHEN 'odendi' THEN 'Ödendi'
        WHEN 'kismi' THEN 'Kısmi'
        ELSE 'Bekliyor'
      END as durum,
      l.fatura_geldi,
      COALESCE(b.ad, 'Doğrudan') as bayi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.net_tutar > 0 OR l.fatura_no IS NOT NULL
    ORDER BY l.olusturma_tarihi DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Ozet Istatistikler ---- */
router.get("/ozet", hataYakala(async (req, res) => {
  const [[toplam]] = await havuz.query(`SELECT COUNT(*) as sayi FROM lisanslar`);
  const [[aktif]] = await havuz.query(`SELECT COUNT(*) as sayi FROM lisanslar WHERE durum = 'aktif' AND bitis_tarihi >= CURDATE()`);
  const [[bitecek]] = await havuz.query(`SELECT COUNT(*) as sayi FROM lisanslar WHERE durum = 'aktif' AND bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`);
  const [[biten]] = await havuz.query(`SELECT COUNT(*) as sayi FROM lisanslar WHERE bitis_tarihi < CURDATE()`);
  const [[ciro]] = await havuz.query(`SELECT COALESCE(SUM(net_tutar), 0) as toplam FROM lisanslar WHERE odeme_durumu = 'odendi'`);
  const [[bekleyen]] = await havuz.query(`SELECT COALESCE(SUM(net_tutar - COALESCE(odenen_tutar, 0)), 0) as toplam FROM lisanslar WHERE odeme_durumu != 'odendi'`);
  
  res.json({
    basarili: true,
    veri: {
      toplamLisans: toplam.sayi,
      aktifLisans: aktif.sayi,
      bitecekLisans: bitecek.sayi,
      bitenLisans: biten.sayi,
      toplamCiro: ciro.toplam,
      bekleyenTutar: bekleyen.toplam
    }
  });
}));

/* ---- Aylik Satis Grafiği ---- */
router.get("/aylik-satis", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT 
      DATE_FORMAT(olusturma_tarihi, '%Y-%m') as ay,
      COUNT(*) as satisSayisi,
      SUM(COALESCE(net_tutar, fiyat, 0)) as toplamTutar
    FROM lisanslar
    WHERE olusturma_tarihi >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(olusturma_tarihi, '%Y-%m')
    ORDER BY ay ASC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Urun Bazli Dagilim ---- */
router.get("/urun-dagilimi", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT 
      COALESCE(u.ad, 'Diğer') as urun,
      COUNT(*) as adet,
      SUM(COALESCE(l.net_tutar, l.fiyat, 0)) as tutar
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    GROUP BY l.urun_id, u.ad
    ORDER BY adet DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Bayi Bazli Satis ---- */
router.get("/bayi-satis", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT 
      COALESCE(b.ad, 'Doğrudan Satış') as bayi,
      COUNT(*) as satisSayisi,
      SUM(COALESCE(l.net_tutar, l.fiyat, 0)) as toplamTutar
    FROM lisanslar l
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    GROUP BY l.bayi_id, b.ad
    ORDER BY toplamTutar DESC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

module.exports = router;
