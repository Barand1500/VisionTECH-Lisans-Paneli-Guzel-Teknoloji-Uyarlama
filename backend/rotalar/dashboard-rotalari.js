/* ============================================= */
/*  Dashboard Rotalari - Ozet Istatistikler       */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ---- Genel Ozet Istatistikleri ---- */
router.get("/ozet", hataYakala(async (req, res) => {
  const [[musteriSayisi]] = await havuz.query("SELECT COUNT(*) as sayi FROM musteriler WHERE silinme_tarihi IS NULL");
  const [[aktifBayiSayisi]] = await havuz.query("SELECT COUNT(*) as sayi FROM bayiler WHERE durum = 'aktif' AND silinme_tarihi IS NULL");
  const [[aktifLisansSayisi]] = await havuz.query("SELECT COUNT(*) as sayi FROM lisanslar WHERE durum = 'aktif'");

  /* Bu ay biten lisanslar */
  const [[buAyBiten]] = await havuz.query(`
    SELECT COUNT(*) as sayi FROM lisanslar
    WHERE bitis_tarihi BETWEEN CURDATE() AND LAST_DAY(CURDATE())
  `);

  res.json({
    basarili: true,
    veri: {
      toplamMusteri: musteriSayisi.sayi,
      aktifBayi: aktifBayiSayisi.sayi,
      aktifLisans: aktifLisansSayisi.sayi,
      buAyBitenLisans: buAyBiten.sayi,
    }
  });
}));

/* ---- Musteri Dagilimi (tur bazli) ---- */
router.get("/musteri-dagilimi", hataYakala(async (req, res) => {
  const [rows] = await havuz.query(`
    SELECT tur, COUNT(*) as deger FROM musteriler WHERE silinme_tarihi IS NULL GROUP BY tur
  `);
  const ETIKET = { gercek: "Gerçek", tuzel: "Tüzel", yabanci: "Yabancı" };
  const veri = rows.map(r => ({ ad: ETIKET[r.tur] || r.tur, deger: r.deger }));
  res.json({ basarili: true, veri });
}));

/* ---- Aylik Lisans Satislari (son 12 ay) ---- */
router.get("/aylik-lisanslar", hataYakala(async (req, res) => {
  const [rows] = await havuz.query(`
    SELECT DATE_FORMAT(olusturma_tarihi, '%Y-%m') as ay, COUNT(*) as satis
    FROM lisanslar
    WHERE olusturma_tarihi >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(olusturma_tarihi, '%Y-%m')
    ORDER BY ay ASC
  `);

  const AY_ISIMLERI = ["Oca","Sub","Mar","Nis","May","Haz","Tem","Agu","Eyl","Eki","Kas","Ara"];
  const veri = rows.map(r => {
    const ayIndex = parseInt(r.ay.split("-")[1], 10) - 1;
    return { ay: AY_ISIMLERI[ayIndex], satis: r.satis };
  });

  res.json({ basarili: true, veri });
}));

/* ---- Son Eklenen Musteriler ---- */
router.get("/son-musteriler", hataYakala(async (req, res) => {
  const [rows] = await havuz.query(`
    SELECT id, COALESCE(ad_soyad, sirket_adi) as ad, tur, kayit_tarihi as tarih
    FROM musteriler ORDER BY id DESC LIMIT 5
  `);
  const ETIKET = { gercek: "Gerçek", tuzel: "Tüzel", yabanci: "Yabancı" };
  const veri = rows.map(r => ({ ...r, tur: ETIKET[r.tur] || r.tur }));
  res.json({ basarili: true, veri });
}));

/* ---- Son Guncellenen Lisanslar ---- */
router.get("/son-lisanslar", hataYakala(async (req, res) => {
  const [rows] = await havuz.query(`
    SELECT l.id, COALESCE(m.ad_soyad, m.sirket_adi) as musteri,
      COALESCE(u.ad, 'Bilinmiyor') as paket,
      DATE_FORMAT(l.olusturma_tarihi, '%Y-%m-%d') as tarih,
      l.durum
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    ORDER BY l.olusturma_tarihi DESC
    LIMIT 5
  `);

  const DURUM_ISLEM = { aktif: "Oluşturuldu", yaklasan: "Yaklaşıyor", "suresi-dolmus": "Süresi Dolmuş" };
  const veri = rows.map(r => ({ ...r, islem: DURUM_ISLEM[r.durum] || r.durum }));
  res.json({ basarili: true, veri });
}));

module.exports = router;
