/* ============================================= */
/*  Yedekleme Rotalari - Veri Yedekleme/Yukleme   */
/*  + Yedekleme Log Kayitlari                     */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");
const jwt = require("jsonwebtoken");

/* ---- Tablolarin sirasi (FK bagimliliklarina gore) ---- */
const TABLO_SIRASI = [
  "roller",
  "sektorler",
  "kullanicilar",
  "musteriler",
  "musteri_telefonlari",
  "musteri_adresleri",
  "musteri_dosyalar",
  "bayiler",
  "bayi_dosyalar",
  "urun_gruplari",
  "urunler",
  "paketler",
  "lisanslar",
  "surumler",
  "notlar",
  "iletisim_kayitlari",
  "aktivite_loglari",
  "yedekleme_loglari",
];

/* ---- Token'dan kullanici bilgisi cikar (opsiyonel) ---- */
function kullaniciBilgisiAl(req) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return { id: null, eposta: null };
    const decoded = jwt.verify(token, process.env.JWT_GIZLI || "guzel-teknoloji-gizli-anahtar-2026");
    return { id: decoded.id || null, eposta: decoded.eposta || null };
  } catch { return { id: null, eposta: null }; }
}

/* ---- Tum Verileri Yedekle ---- */
router.get("/indir", hataYakala(async (req, res) => {
  const kullanici = kullaniciBilgisiAl(req);
  const yedek = { olusturma_zamani: new Date().toISOString(), tablolar: {} };
  let toplamKayit = 0;

  for (const tablo of TABLO_SIRASI) {
    const [satirlar] = await havuz.query(`SELECT * FROM \`${tablo}\``);
    yedek.tablolar[tablo] = satirlar;
    toplamKayit += satirlar.length;
  }

  const jsonStr = JSON.stringify({ basarili: true, veri: yedek });
  const dosyaAdi = `guzel_teknoloji_yedek_${new Date().toISOString().slice(0, 10)}.json`;

  /* Log kaydet */
  await havuz.query(
    `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, dosya_adi, dosya_boyutu, tablo_sayisi, kayit_sayisi, durum, detay) VALUES (?, ?, 'yedek_alma', ?, ?, ?, ?, 'basarili', ?)`,
    [kullanici.id, kullanici.eposta, dosyaAdi, Buffer.byteLength(jsonStr, "utf8"), TABLO_SIRASI.length, toplamKayit, `${TABLO_SIRASI.length} tablo, ${toplamKayit} kayit yedeklendi.`]
  );

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=${dosyaAdi}`);
  res.send(jsonStr);
}));

/* ---- Yedegi Yukle (Geri Yukleme) ---- */
router.post("/yukle", hataYakala(async (req, res) => {
  const kullanici = kullaniciBilgisiAl(req);
  const { veri } = req.body;
  if (!veri || !veri.tablolar) {
    /* Basarisiz log */
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, durum, detay) VALUES (?, ?, 'geri_yukleme', 'basarisiz', 'Gecersiz yedek verisi.')`,
      [kullanici.id, kullanici.eposta]
    );
    return res.status(400).json({ basarili: false, mesaj: "Gecersiz yedek verisi." });
  }

  const baglanti = await havuz.getConnection();
  try {
    await baglanti.beginTransaction();

    /* FK kisitlamalarini gecici olarak devre disi birak */
    await baglanti.query("SET FOREIGN_KEY_CHECKS = 0");

    let yuklenenKayit = 0;
    let yuklenenTablo = 0;
    const dosyaAdi = veri.olusturma_zamani ? `yedek_${veri.olusturma_zamani.slice(0, 10)}.json` : "bilinmeyen_yedek.json";

    /* Ters sirada temizle (FK bagimliliklari icin) */
    for (const tablo of [...TABLO_SIRASI].reverse()) {
      if (veri.tablolar[tablo]) {
        await baglanti.query(`DELETE FROM \`${tablo}\``);
      }
    }

    /* Dogru sirada ekle */
    for (const tablo of TABLO_SIRASI) {
      const satirlar = veri.tablolar[tablo];
      if (!satirlar || satirlar.length === 0) continue;
      yuklenenTablo++;

      for (const satir of satirlar) {
        const sutunlar = Object.keys(satir);
        const degerler = Object.values(satir);
        const yertutucular = sutunlar.map(() => "?").join(", ");
        await baglanti.query(
          `INSERT INTO \`${tablo}\` (${sutunlar.map(s => `\`${s}\``).join(", ")}) VALUES (${yertutucular})`,
          degerler
        );
        yuklenenKayit++;
      }
    }

    /* FK kisitlamalarini tekrar etkinlestir */
    await baglanti.query("SET FOREIGN_KEY_CHECKS = 1");
    await baglanti.commit();

    /* Basarili log */
    const bodyStr = JSON.stringify(req.body);
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, dosya_adi, dosya_boyutu, tablo_sayisi, kayit_sayisi, durum, detay) VALUES (?, ?, 'geri_yukleme', ?, ?, ?, ?, 'basarili', ?)`,
      [kullanici.id, kullanici.eposta, dosyaAdi, Buffer.byteLength(bodyStr, "utf8"), yuklenenTablo, yuklenenKayit, `${yuklenenTablo} tablo, ${yuklenenKayit} kayit geri yuklendi.`]
    );

    res.json({ basarili: true, mesaj: "Yedek basariyla yuklendi." });
  } catch (hata) {
    await baglanti.rollback();
    await baglanti.query("SET FOREIGN_KEY_CHECKS = 1");

    /* Basarisiz log */
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, durum, detay) VALUES (?, ?, 'geri_yukleme', 'basarisiz', ?)`,
      [kullanici.id, kullanici.eposta, hata.message?.slice(0, 500)]
    );

    throw hata;
  } finally {
    baglanti.release();
  }
}));

/* ---- Yedekleme Log Kayitlarini Listele ---- */
router.get("/loglar", hataYakala(async (req, res) => {
  const [loglar] = await havuz.query(`
    SELECT yl.*,
      k.ad_soyad as kullanici_adi
    FROM yedekleme_loglari yl
    LEFT JOIN kullanicilar k ON yl.kullanici_id = k.id
    ORDER BY yl.tarih DESC
    LIMIT 100
  `);
  res.json({ basarili: true, veri: loglar });
}));

module.exports = router;
