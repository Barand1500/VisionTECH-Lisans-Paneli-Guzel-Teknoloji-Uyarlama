const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ---- Ozet Kartlar ---- */
router.get("/ozet", hataYakala(async (_req, res) => {
  const [musteriler] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as toplam FROM musteriler WHERE silinme_tarihi IS NULL`);
  const [bayiler] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as toplam FROM bayiler WHERE silinme_tarihi IS NULL`);
  const [aktifLisanslar] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as toplam FROM lisanslar WHERE durum = 'aktif'`);
  const [urunler] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as toplam FROM urunler WHERE aktif = 1`);

  const [aylikGelir] = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(SUM(net_tutar), 0) as toplam FROM lisanslar
    WHERE MONTH(olusturma_tarihi) = MONTH(CURDATE()) AND YEAR(olusturma_tarihi) = YEAR(CURDATE())
  `);

  const [yaklasanLisans] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as toplam FROM lisanslar
    WHERE durum = 'aktif' AND suresiz = 0 AND bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  `);

  res.json({
    basarili: true,
    veri: temizle({
      toplamMusteri: musteriler.toplam,
      aktifBayi: bayiler.toplam,
      aktifLisans: aktifLisanslar.toplam,
      toplamUrun: urunler.toplam,
      aylikGelir: aylikGelir.toplam,
      buAyBitenLisans: yaklasanLisans.toplam,
    }),
  });
}));

/* ---- Musteri Dagilimi (Sektore gore) ---- */
router.get("/musteri-dagilimi", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(s.ad, 'Belirtilmemiş') as ad, COUNT(*) as deger
    FROM musteriler m LEFT JOIN sektorler s ON m.sektor_id = s.id
    WHERE m.silinme_tarihi IS NULL
    GROUP BY s.ad ORDER BY deger DESC LIMIT 10
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Aylik Lisanslar ---- */
router.get("/aylik-lisanslar", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT DATE_FORMAT(olusturma_tarihi, '%Y-%m') as ay, COUNT(*) as sayi,
           COALESCE(SUM(net_tutar), 0) as toplam_tutar
    FROM lisanslar
    WHERE olusturma_tarihi >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY ay ORDER BY ay ASC
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Son Eklenen Musteriler ---- */
router.get("/son-musteriler", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT m.id, m.tur,
           COALESCE(m.ad_soyad, m.sirket_adi, '') as ad,
           m.eposta, m.durum, m.kayit_tarihi as tarih,
           COALESCE(s.ad, '') as sektor_adi
    FROM musteriler m LEFT JOIN sektorler s ON m.sektor_id = s.id
    WHERE m.silinme_tarihi IS NULL
    ORDER BY m.id DESC LIMIT 10
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Son Eklenen Lisanslar ---- */
router.get("/son-lisanslar", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.lisans_anahtari, l.durum as islem,
           l.baslangic_tarihi, l.bitis_tarihi, l.net_tutar,
           l.olusturma_tarihi as tarih,
           COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
           COALESCE(u.ad, '') as paket
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    ORDER BY l.id DESC LIMIT 10
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Yaklasan Lisanslar (dinamik gun araligi) ---- */
router.get("/yaklasan-lisanslar", hataYakala(async (req, res) => {
  const gun = parseInt(req.query.gun) || 30;
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.lisans_anahtari, l.bitis_tarihi, l.durum,
           DATEDIFF(l.bitis_tarihi, CURDATE()) as kalan_gun,
           COALESCE(m.ad_soyad, m.sirket_adi, '') as musteri,
           COALESCE(u.ad, '') as urun
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    WHERE l.durum = 'aktif' AND l.suresiz = 0 AND l.bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY l.bitis_tarihi ASC
  `, gun);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Aylik Musteri Kazanimi ---- */
router.get("/aylik-musteriler", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT DATE_FORMAT(kayit_tarihi, '%Y-%m') as ay, COUNT(*) as sayi
    FROM musteriler
    WHERE silinme_tarihi IS NULL AND kayit_tarihi >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY ay ORDER BY ay ASC
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Aylik Bayi Kazanimi ---- */
router.get("/aylik-bayiler", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT DATE_FORMAT(kayit_tarihi, '%Y-%m') as ay, COUNT(*) as sayi
    FROM bayiler
    WHERE silinme_tarihi IS NULL AND kayit_tarihi >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY ay ORDER BY ay ASC
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

module.exports = router;
