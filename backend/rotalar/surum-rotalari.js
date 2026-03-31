/* ============================================= */
/*  Surum Rotalari - CRUD Islemleri               */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Surumleri Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [surumler] = await havuz.query("SELECT * FROM surumler ORDER BY tarih DESC, id DESC");
  res.json({ basarili: true, veri: surumler });
}));

/* ---- Tek Surum Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query("SELECT * FROM surumler WHERE id = ?", [Number(req.params.id)]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Surum bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Surum Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { urun_id, urun_adi, surum, tarih, duzenlenenler, eklenenler, cikarilanlar, dosya_adi } = req.body;
  if (!urun_adi || !surum) return dogrulamaHatasi(res, "Urun adi ve surum numarasi zorunludur.");

  /* Mevcut aktif surumu pasif yap */
  await havuz.query("UPDATE surumler SET aktif = 0 WHERE urun_adi = ? AND aktif = 1", [urun_adi]);

  const [sonuc] = await havuz.query(
    `INSERT INTO surumler (urun_id, urun_adi, surum, tarih, duzenlenenler, eklenenler, cikarilanlar, dosya_adi, aktif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [urun_id || null, urun_adi, surum, tarih || new Date().toISOString().slice(0, 10), duzenlenenler || null, eklenenler || null, cikarilanlar || null, dosya_adi || null]
  );

  res.status(201).json({ basarili: true, mesaj: "Surum basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Surum Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM surumler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Surum bulunamadi.");

  const { urun_id, urun_adi, surum, tarih, duzenlenenler, eklenenler, cikarilanlar, dosya_adi, aktif } = req.body;

  await havuz.query(
    `UPDATE surumler SET
      urun_id = ?, urun_adi = COALESCE(?, urun_adi), surum = COALESCE(?, surum),
      tarih = COALESCE(?, tarih), duzenlenenler = ?, eklenenler = ?,
      cikarilanlar = ?, dosya_adi = ?, aktif = ?
    WHERE id = ?`,
    [urun_id || null, urun_adi || null, surum || null, tarih || null, duzenlenenler || null, eklenenler || null, cikarilanlar || null, dosya_adi || null, aktif !== undefined ? (aktif ? 1 : 0) : 1, id]
  );

  res.json({ basarili: true, mesaj: "Surum basariyla guncellendi." });
}));

/* ---- Surum Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM surumler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Surum bulunamadi.");

  await havuz.query("DELETE FROM surumler WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Surum basariyla silindi." });
}));

module.exports = router;
