/* ============================================= */
/*  Iletisim Kisileri Rotalari                   */
/*  Musteri ve Bayi iletisim kisi yonetimi       */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

/* ============================================= */
/*  MUSTERI ILETISIM KISILERI                    */
/* ============================================= */

/* ---- Musteri kisilerini listele ---- */
router.get("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const [kisiler] = await havuz.query(
    "SELECT * FROM iletisim_kisileri WHERE musteri_id = ? AND aktif = 1 ORDER BY birincil DESC, ad_soyad ASC",
    [req.params.musteriId]
  );
  res.json({ basarili: true, veri: kisiler });
}));

/* ---- Yeni musteri kisisi ekle ---- */
router.post("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;

  if (!ad_soyad) return dogrulamaHatasi(res, "Ad soyad zorunludur.");

  /* Birincil ise diger birincilleri kaldir */
  if (birincil) {
    await havuz.query("UPDATE iletisim_kisileri SET birincil = 0 WHERE musteri_id = ?", [musteriId]);
  }

  const [sonuc] = await havuz.query(
    `INSERT INTO iletisim_kisileri (musteri_id, ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [musteriId, ad_soyad, unvan || null, departman || null, telefon || null, cep_telefon || null, eposta || null, notlar || null, birincil ? 1 : 0]
  );

  res.status(201).json({ basarili: true, mesaj: "Kisi basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Musteri kisisi guncelle ---- */
router.put("/musteri/:musteriId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const { musteriId, kisiId } = req.params;
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;

  const [mevcut] = await havuz.query("SELECT id FROM iletisim_kisileri WHERE id = ? AND musteri_id = ?", [kisiId, musteriId]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  /* Birincil ise diger birincilleri kaldir */
  if (birincil) {
    await havuz.query("UPDATE iletisim_kisileri SET birincil = 0 WHERE musteri_id = ? AND id != ?", [musteriId, kisiId]);
  }

  await havuz.query(
    `UPDATE iletisim_kisileri SET
      ad_soyad = COALESCE(?, ad_soyad),
      unvan = ?,
      departman = ?,
      telefon = ?,
      cep_telefon = ?,
      eposta = ?,
      notlar = ?,
      birincil = ?
    WHERE id = ?`,
    [ad_soyad || null, unvan || null, departman || null, telefon || null, cep_telefon || null, eposta || null, notlar || null, birincil ? 1 : 0, kisiId]
  );

  res.json({ basarili: true, mesaj: "Kisi basariyla guncellendi." });
}));

/* ---- Musteri kisisi sil ---- */
router.delete("/musteri/:musteriId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const { musteriId, kisiId } = req.params;
  const [mevcut] = await havuz.query("SELECT id FROM iletisim_kisileri WHERE id = ? AND musteri_id = ?", [kisiId, musteriId]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  await havuz.query("UPDATE iletisim_kisileri SET aktif = 0 WHERE id = ?", [kisiId]);
  res.json({ basarili: true, mesaj: "Kisi basariyla silindi." });
}));

/* ============================================= */
/*  BAYI ILETISIM KISILERI                       */
/* ============================================= */

/* ---- Bayi kisilerini listele ---- */
router.get("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const [kisiler] = await havuz.query(
    "SELECT * FROM iletisim_kisileri WHERE bayi_id = ? AND aktif = 1 ORDER BY birincil DESC, ad_soyad ASC",
    [req.params.bayiId]
  );
  res.json({ basarili: true, veri: kisiler });
}));

/* ---- Yeni bayi kisisi ekle ---- */
router.post("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const bayiId = Number(req.params.bayiId);
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;

  if (!ad_soyad) return dogrulamaHatasi(res, "Ad soyad zorunludur.");

  /* Birincil ise diger birincilleri kaldir */
  if (birincil) {
    await havuz.query("UPDATE iletisim_kisileri SET birincil = 0 WHERE bayi_id = ?", [bayiId]);
  }

  const [sonuc] = await havuz.query(
    `INSERT INTO iletisim_kisileri (bayi_id, ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [bayiId, ad_soyad, unvan || null, departman || null, telefon || null, cep_telefon || null, eposta || null, notlar || null, birincil ? 1 : 0]
  );

  res.status(201).json({ basarili: true, mesaj: "Kisi basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Bayi kisisi guncelle ---- */
router.put("/bayi/:bayiId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const { bayiId, kisiId } = req.params;
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;

  const [mevcut] = await havuz.query("SELECT id FROM iletisim_kisileri WHERE id = ? AND bayi_id = ?", [kisiId, bayiId]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  /* Birincil ise diger birincilleri kaldir */
  if (birincil) {
    await havuz.query("UPDATE iletisim_kisileri SET birincil = 0 WHERE bayi_id = ? AND id != ?", [bayiId, kisiId]);
  }

  await havuz.query(
    `UPDATE iletisim_kisileri SET
      ad_soyad = COALESCE(?, ad_soyad),
      unvan = ?,
      departman = ?,
      telefon = ?,
      cep_telefon = ?,
      eposta = ?,
      notlar = ?,
      birincil = ?
    WHERE id = ?`,
    [ad_soyad || null, unvan || null, departman || null, telefon || null, cep_telefon || null, eposta || null, notlar || null, birincil ? 1 : 0, kisiId]
  );

  res.json({ basarili: true, mesaj: "Kisi basariyla guncellendi." });
}));

/* ---- Bayi kisisi sil ---- */
router.delete("/bayi/:bayiId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const { bayiId, kisiId } = req.params;
  const [mevcut] = await havuz.query("SELECT id FROM iletisim_kisileri WHERE id = ? AND bayi_id = ?", [kisiId, bayiId]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  await havuz.query("UPDATE iletisim_kisileri SET aktif = 0 WHERE id = ?", [kisiId]);
  res.json({ basarili: true, mesaj: "Kisi basariyla silindi." });
}));

module.exports = router;
