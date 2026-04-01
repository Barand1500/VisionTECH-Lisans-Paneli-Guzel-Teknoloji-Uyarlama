/* ============================================= */
/*  Çöp Kutusu Rotaları                          */
/*  Silinen müşteri ve bayileri yönetir          */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");

/* ---- Tüm Silinen Kayıtları Getir ---- */
router.get("/", async (req, res, next) => {
  try {
    // Silinen müşteriler
    const [musteriler] = await havuz.query(`
      SELECT 
        m.id,
        COALESCE(m.ad_soyad, m.sirket_adi, 'Bilinmiyor') AS ad,
        m.silinme_tarihi,
        'musteri' AS tip
      FROM musteriler m
      WHERE m.silinme_tarihi IS NOT NULL
      ORDER BY m.silinme_tarihi DESC
    `);

    // Silinen bayiler
    const [bayiler] = await havuz.query(`
      SELECT 
        b.id,
        b.ad,
        b.silinme_tarihi,
        'bayi' AS tip
      FROM bayiler b
      WHERE b.silinme_tarihi IS NOT NULL
      ORDER BY b.silinme_tarihi DESC
    `);

    // İki listeyi birleştir ve tarihe göre sırala
    const tumSilinen = [...musteriler, ...bayiler].sort((a, b) => 
      new Date(b.silinme_tarihi) - new Date(a.silinme_tarihi)
    );

    res.json({ basarili: true, veri: tumSilinen });
  } catch (hata) {
    next(hata);
  }
});

/* ---- Müşteriyi Geri Yükle ---- */
router.post("/musteriler/:id/geri-yukle", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await havuz.query(`
      UPDATE musteriler 
      SET silinme_tarihi = NULL, durum = 'aktif'
      WHERE id = ?
    `, [id]);

    res.json({ basarili: true, mesaj: "Müşteri geri yüklendi" });
  } catch (hata) {
    next(hata);
  }
});

/* ---- Bayiyi Geri Yükle ---- */
router.post("/bayiler/:id/geri-yukle", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await havuz.query(`
      UPDATE bayiler 
      SET silinme_tarihi = NULL, durum = 'aktif'
      WHERE id = ?
    `, [id]);

    res.json({ basarili: true, mesaj: "Bayi geri yüklendi" });
  } catch (hata) {
    next(hata);
  }
});

/* ---- Musteriyi Kalici Sil ---- */
router.delete("/musteriler/:id/kalici", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    /* Iliski kayitlari FK CASCADE ile otomatik silinir */
    /* Sadece ana kaydi silmek yeterli                   */
    await havuz.query("DELETE FROM musteriler WHERE id = ?", [id]);

    res.json({ basarili: true, mesaj: "Musteri kalici olarak silindi" });
  } catch (hata) {
    next(hata);
  }
});

/* ---- Bayiyi Kalıcı Sil ---- */
router.delete("/bayiler/:id/kalici", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Bayiyi kalıcı sil
    await havuz.query("DELETE FROM bayiler WHERE id = ?", [id]);

    res.json({ basarili: true, mesaj: "Bayi kalıcı olarak silindi" });
  } catch (hata) {
    next(hata);
  }
});

module.exports = router;
