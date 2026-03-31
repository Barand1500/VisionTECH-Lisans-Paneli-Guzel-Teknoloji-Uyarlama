/* ============================================= */
/*  Urun ve Paket Rotalari - CRUD Islemleri       */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* =========== URUN GRUPLARI =========== */

router.get("/gruplar", hataYakala(async (req, res) => {
  const [gruplar] = await havuz.query("SELECT * FROM urun_gruplari ORDER BY ad");
  res.json({ basarili: true, veri: gruplar });
}));

router.post("/gruplar", hataYakala(async (req, res) => {
  const { ad, aciklama, aktif } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Grup adi zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO urun_gruplari (ad, aciklama, aktif) VALUES (?, ?, ?)",
    [ad, aciklama || null, aktif !== undefined ? (aktif ? 1 : 0) : 1]
  );
  res.status(201).json({ basarili: true, mesaj: "Urun grubu eklendi.", id: sonuc.insertId });
}));

router.put("/gruplar/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM urun_gruplari WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Urun grubu bulunamadi.");

  const { ad, aciklama, aktif } = req.body;

  await havuz.query(
    "UPDATE urun_gruplari SET ad = COALESCE(?, ad), aciklama = ?, aktif = ? WHERE id = ?",
    [ad || null, aciklama || null, aktif !== undefined ? (aktif ? 1 : 0) : 1, id]
  );
  res.json({ basarili: true, mesaj: "Urun grubu guncellendi." });
}));

router.delete("/gruplar/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM urun_gruplari WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Urun grubu bulunamadi.");

  await havuz.query("DELETE FROM urun_gruplari WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Urun grubu silindi." });
}));

/* =========== URUNLER =========== */

router.get("/", hataYakala(async (req, res) => {
  const [urunler] = await havuz.query(`
    SELECT u.*, ug.ad as grup_adi
    FROM urunler u
    LEFT JOIN urun_gruplari ug ON u.grup_id = ug.id
    ORDER BY u.id DESC
  `);
  res.json({ basarili: true, veri: urunler });
}));

router.get("/:id", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT u.*, ug.ad as grup_adi
    FROM urunler u
    LEFT JOIN urun_gruplari ug ON u.grup_id = ug.id
    WHERE u.id = ?
  `, [Number(req.params.id)]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Urun bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

router.post("/", hataYakala(async (req, res) => {
  const { grup_id, ad, urun_tipi, uygulama_tipi, ozel_proje, aktif } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Urun adi zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO urunler (grup_id, ad, urun_tipi, uygulama_tipi, ozel_proje, aktif) VALUES (?, ?, ?, ?, ?, ?)",
    [grup_id || null, ad, urun_tipi || null, uygulama_tipi || null, ozel_proje ? 1 : 0, aktif !== undefined ? (aktif ? 1 : 0) : 1]
  );

  res.status(201).json({ basarili: true, mesaj: "Urun basariyla eklendi.", id: sonuc.insertId });
}));

router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM urunler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Urun bulunamadi.");

  const { grup_id, ad, urun_tipi, uygulama_tipi, ozel_proje, aktif } = req.body;

  await havuz.query(
    `UPDATE urunler SET
      grup_id = ?, ad = COALESCE(?, ad), urun_tipi = ?, uygulama_tipi = ?,
      ozel_proje = ?, aktif = ?
    WHERE id = ?`,
    [grup_id || null, ad || null, urun_tipi || null, uygulama_tipi || null, ozel_proje !== undefined ? (ozel_proje ? 1 : 0) : 0, aktif !== undefined ? (aktif ? 1 : 0) : 1, id]
  );

  res.json({ basarili: true, mesaj: "Urun basariyla guncellendi." });
}));

router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM urunler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Urun bulunamadi.");

  await havuz.query("DELETE FROM urunler WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Urun basariyla silindi." });
}));

/* =========== PAKETLER =========== */

router.get("/:urunId/paketler", hataYakala(async (req, res) => {
  const [paketler] = await havuz.query(`
    SELECT p.*, u.ad as urun_adi
    FROM paketler p
    LEFT JOIN urunler u ON p.urun_id = u.id
    WHERE p.urun_id = ?
    ORDER BY p.id DESC
  `, [Number(req.params.urunId)]);
  res.json({ basarili: true, veri: paketler });
}));

router.get("/paketler/tumu", hataYakala(async (req, res) => {
  const [paketler] = await havuz.query(`
    SELECT p.*, u.ad as urun_adi
    FROM paketler p
    LEFT JOIN urunler u ON p.urun_id = u.id
    ORDER BY p.id DESC
  `);
  res.json({ basarili: true, veri: paketler });
}));

router.post("/paketler", hataYakala(async (req, res) => {
  const { urun_id, ad, tipi, kullanim_gunu, fiyat, kullanici_sayisi, aktif } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Paket adi zorunludur.");
  if (!urun_id) return dogrulamaHatasi(res, "Urun ID zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO paketler (urun_id, ad, tipi, kullanim_gunu, fiyat, kullanici_sayisi, aktif) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [urun_id, ad, tipi || null, kullanim_gunu || 365, fiyat || 0, kullanici_sayisi || 1, aktif !== undefined ? (aktif ? 1 : 0) : 1]
  );

  res.status(201).json({ basarili: true, mesaj: "Paket basariyla eklendi.", id: sonuc.insertId });
}));

router.put("/paketler/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM paketler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Paket bulunamadi.");

  const { urun_id, ad, tipi, kullanim_gunu, fiyat, kullanici_sayisi, aktif } = req.body;

  await havuz.query(
    `UPDATE paketler SET
      urun_id = COALESCE(?, urun_id), ad = COALESCE(?, ad), tipi = ?,
      kullanim_gunu = COALESCE(?, kullanim_gunu), fiyat = COALESCE(?, fiyat),
      kullanici_sayisi = COALESCE(?, kullanici_sayisi), aktif = ?
    WHERE id = ?`,
    [urun_id || null, ad || null, tipi || null, kullanim_gunu || null, fiyat !== undefined ? fiyat : null, kullanici_sayisi || null, aktif !== undefined ? (aktif ? 1 : 0) : 1, id]
  );

  res.json({ basarili: true, mesaj: "Paket basariyla guncellendi." });
}));

router.delete("/paketler/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM paketler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Paket bulunamadi.");

  await havuz.query("DELETE FROM paketler WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Paket basariyla silindi." });
}));

module.exports = router;
