/* ============================================= */
/*  Not Rotalari - CRUD Islemleri                 */
/*  Musteri ve Bayi notlari yonetimi              */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

/* ---- Musteriye Ait Notlari Listele ---- */
router.get("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const [notlar] = await havuz.query(
    "SELECT id, musteri_id, metin, onemli, tarih FROM notlar WHERE musteri_id = ? ORDER BY tarih DESC",
    [Number(req.params.musteriId)]
  );
  res.json({ basarili: true, veri: notlar });
}));

/* ---- Bayiye Ait Notlari Listele ---- */
router.get("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const [notlar] = await havuz.query(
    "SELECT id, bayi_id, metin, onemli, tarih FROM notlar WHERE bayi_id = ? ORDER BY tarih DESC",
    [Number(req.params.bayiId)]
  );
  res.json({ basarili: true, veri: notlar });
}));

/* ---- Tum Notlari Listele ---- */
router.get("/", yetkiKontrol, hataYakala(async (req, res) => {
  const [notlar] = await havuz.query(`
    SELECT n.*, 
           COALESCE(m.ad_soyad, m.sirket_adi) as musteri_adi,
           b.sirket_adi as bayi_adi
    FROM notlar n
    LEFT JOIN musteriler m ON n.musteri_id = m.id
    LEFT JOIN bayiler b ON n.bayi_id = b.id
    ORDER BY n.tarih DESC
  `);
  res.json({ basarili: true, veri: notlar });
}));

/* ---- Musteri Notu Ekle ---- */
router.post("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  const { metin, onemli } = req.body;

  if (!metin || !metin.trim()) return dogrulamaHatasi(res, "Not metni zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO notlar (musteri_id, metin, onemli) VALUES (?, ?, ?)",
    [musteriId, metin.trim(), onemli ? 1 : 0]
  );

  res.status(201).json({ basarili: true, mesaj: "Not basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Bayi Notu Ekle ---- */
router.post("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const bayiId = Number(req.params.bayiId);
  const { metin, onemli } = req.body;

  if (!metin || !metin.trim()) return dogrulamaHatasi(res, "Not metni zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO notlar (bayi_id, metin, onemli) VALUES (?, ?, ?)",
    [bayiId, metin.trim(), onemli ? 1 : 0]
  );

  res.status(201).json({ basarili: true, mesaj: "Not basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Not Ekle (eski uyumluluk) ---- */
router.post("/", yetkiKontrol, hataYakala(async (req, res) => {
  const { musteri_id, bayi_id, metin, onemli } = req.body;

  if (!musteri_id && !bayi_id) return dogrulamaHatasi(res, "Musteri veya Bayi ID zorunludur.");
  if (!metin || !metin.trim()) return dogrulamaHatasi(res, "Not metni zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO notlar (musteri_id, bayi_id, metin, onemli) VALUES (?, ?, ?, ?)",
    [musteri_id || null, bayi_id || null, metin.trim(), onemli ? 1 : 0]
  );

  res.status(201).json({ basarili: true, mesaj: "Not basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Not Guncelle ---- */
router.put("/:id", yetkiKontrol, hataYakala(async (req, res) => {
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
router.delete("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM notlar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Not bulunamadi.");

  await havuz.query("DELETE FROM notlar WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Not basariyla silindi." });
}));

module.exports = router;
