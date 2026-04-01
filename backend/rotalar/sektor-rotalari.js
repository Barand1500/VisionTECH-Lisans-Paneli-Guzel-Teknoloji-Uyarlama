/* ============================================= */
/*  Sektör Rotaları - Sektör CRUD                 */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

/* ---- Tüm Sektörleri Listele (müşteri/bayi sayıları ile) ---- */
router.get("/", yetkiKontrol, hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT s.id, s.ad, s.aktif, s.olusturma_tarihi,
      (SELECT COUNT(*) FROM musteriler WHERE sektor_id = s.id AND silinme_tarihi IS NULL) AS musteri_sayisi,
      (SELECT COUNT(*) FROM bayiler WHERE sektor_id = s.id AND silinme_tarihi IS NULL) AS bayi_sayisi
    FROM sektorler s
    ORDER BY s.ad ASC
  `);
  res.json({ basarili: true, veri: satirlar });
}));

/* ---- Yeni Sektör Ekle ---- */
router.post("/", yetkiKontrol, hataYakala(async (req, res) => {
  const { ad } = req.body;
  if (!ad || !ad.trim()) return dogrulamaHatasi(res, "Sektör adı zorunludur.");

  const [mevcut] = await havuz.query("SELECT id FROM sektorler WHERE ad = ?", [ad.trim()]);
  if (mevcut.length > 0) return dogrulamaHatasi(res, "Bu isimde bir sektör zaten mevcut.");

  const [sonuc] = await havuz.query("INSERT INTO sektorler (ad) VALUES (?)", [ad.trim()]);
  res.status(201).json({ basarili: true, mesaj: "Sektör eklendi.", id: sonuc.insertId });
}));

/* ---- Sektör Güncelle ---- */
router.put("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const { ad, aktif } = req.body;
  const { id } = req.params;

  const [mevcut] = await havuz.query("SELECT id FROM sektorler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Sektör bulunamadı.");

  if (ad !== undefined) {
    if (!ad.trim()) return dogrulamaHatasi(res, "Sektör adı boş olamaz.");
    const [ayniAd] = await havuz.query("SELECT id FROM sektorler WHERE ad = ? AND id != ?", [ad.trim(), id]);
    if (ayniAd.length > 0) return dogrulamaHatasi(res, "Bu isimde bir sektör zaten mevcut.");
  }

  const alanlar = [];
  const degerler = [];

  if (ad !== undefined) { alanlar.push("ad = ?"); degerler.push(ad.trim()); }
  if (aktif !== undefined) { alanlar.push("aktif = ?"); degerler.push(aktif ? 1 : 0); }

  if (alanlar.length === 0) return dogrulamaHatasi(res, "Güncellenecek alan belirtilmedi.");

  degerler.push(id);
  await havuz.query(`UPDATE sektorler SET ${alanlar.join(", ")} WHERE id = ?`, degerler);
  res.json({ basarili: true, mesaj: "Sektör güncellendi." });
}));

/* ---- Sektör Sil ---- */
router.delete("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const { id } = req.params;
  const [mevcut] = await havuz.query("SELECT id FROM sektorler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Sektör bulunamadı.");

  await havuz.query("DELETE FROM sektorler WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Sektör silindi." });
}));

module.exports = router;
