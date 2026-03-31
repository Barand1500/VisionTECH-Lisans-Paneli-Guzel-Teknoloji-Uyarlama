/* ============================================= */
/*  Not Rotalari - CRUD Islemleri                 */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Musteriye Ait Notlari Listele ---- */
router.get("/musteri/:musteriId", hataYakala(async (req, res) => {
  const [notlar] = await havuz.query("SELECT * FROM notlar WHERE musteri_id = ? ORDER BY tarih DESC", [Number(req.params.musteriId)]);
  res.json({ basarili: true, veri: notlar });
}));

/* ---- Tum Notlari Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [notlar] = await havuz.query(`
    SELECT n.*, COALESCE(m.ad_soyad, m.sirket_adi) as musteri_adi
    FROM notlar n
    LEFT JOIN musteriler m ON n.musteri_id = m.id
    ORDER BY n.tarih DESC
  `);
  res.json({ basarili: true, veri: notlar });
}));

/* ---- Not Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { musteri_id, metin, onemli } = req.body;

  if (!musteri_id) return dogrulamaHatasi(res, "Musteri ID zorunludur.");
  if (!metin || !metin.trim()) return dogrulamaHatasi(res, "Not metni zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO notlar (musteri_id, metin, onemli) VALUES (?, ?, ?)",
    [musteri_id, metin.trim(), onemli ? 1 : 0]
  );

  res.status(201).json({ basarili: true, mesaj: "Not basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Not Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM notlar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Not bulunamadi.");

  const { metin, onemli } = req.body;

  await havuz.query(
    "UPDATE notlar SET metin = COALESCE(?, metin), onemli = ? WHERE id = ?",
    [metin || null, onemli !== undefined ? (onemli ? 1 : 0) : 0, id]
  );

  res.json({ basarili: true, mesaj: "Not basariyla guncellendi." });
}));

/* ---- Not Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM notlar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Not bulunamadi.");

  await havuz.query("DELETE FROM notlar WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Not basariyla silindi." });
}));

module.exports = router;
