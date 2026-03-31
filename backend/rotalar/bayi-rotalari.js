/* ============================================= */
/*  Bayi Rotalari - CRUD Islemleri                */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Bayileri Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [bayiler] = await havuz.query("SELECT * FROM bayiler WHERE silinme_tarihi IS NULL ORDER BY id DESC");
  res.json({ basarili: true, veri: bayiler });
}));

/* ---- Tek Bayi Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query("SELECT * FROM bayiler WHERE id = ? AND silinme_tarihi IS NULL", [Number(req.params.id)]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Bayi bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Bayi Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sehir, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi } = req.body;

  if (!ad) return dogrulamaHatasi(res, "Bayi adi zorunludur.");

  const [sonuc] = await havuz.query(
    `INSERT INTO bayiler (ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sehir, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ad, yetkili || null, eposta || null, telefon || null, vergi_no || null, vergi_dairesi || null, sehir || null, durum || "aktif", tur || "tuzel", ust_bayi_id || null, tc_kimlik_no || null, pasaport_no || null, ad_soyad || null, sirket_adi || null]
  );

  res.status(201).json({ basarili: true, mesaj: "Bayi basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Bayi Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM bayiler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Bayi bulunamadi.");

  const { ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sehir, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi } = req.body;

  await havuz.query(
    `UPDATE bayiler SET
      ad = COALESCE(?, ad), yetkili = ?, eposta = ?, telefon = ?,
      vergi_no = ?, vergi_dairesi = ?, sehir = ?, durum = COALESCE(?, durum),
      tur = COALESCE(?, tur), ust_bayi_id = ?, tc_kimlik_no = ?,
      pasaport_no = ?, ad_soyad = ?, sirket_adi = ?, guncelleme_tarihi = NOW()
    WHERE id = ?`,
    [ad || null, yetkili || null, eposta || null, telefon || null, vergi_no || null, vergi_dairesi || null, sehir || null, durum || null, tur || null, ust_bayi_id || null, tc_kimlik_no || null, pasaport_no || null, ad_soyad || null, sirket_adi || null, id]
  );

  res.json({ basarili: true, mesaj: "Bayi basariyla guncellendi." });
}));

/* ---- Bayi Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM bayiler WHERE id = ? AND silinme_tarihi IS NULL", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Bayi bulunamadi.");

  await havuz.query("UPDATE bayiler SET silinme_tarihi = NOW() WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Bayi basariyla silindi." });
}));

module.exports = router;
