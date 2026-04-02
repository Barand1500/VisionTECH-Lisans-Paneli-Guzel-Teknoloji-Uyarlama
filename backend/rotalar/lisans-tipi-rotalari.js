/* ============================================= */
/*  Lisans Tipi Rotalari - CRUD Islemleri         */
/*  Dinamik lisans tipi yonetimi (Yonetim Paneli) */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Lisans Tiplerini Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [tipler] = await havuz.query("SELECT * FROM lisans_tipleri ORDER BY sira ASC, id ASC");
  res.json({ basarili: true, veri: tipler });
}));

/* ---- Sadece Aktif Lisans Tiplerini Listele ---- */
router.get("/aktif", hataYakala(async (req, res) => {
  const [tipler] = await havuz.query("SELECT * FROM lisans_tipleri WHERE aktif = 1 ORDER BY sira ASC, id ASC");
  res.json({ basarili: true, veri: tipler });
}));

/* ---- Tek Lisans Tipi Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query("SELECT * FROM lisans_tipleri WHERE id = ?", [Number(req.params.id)]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Lisans tipi bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Lisans Tipi Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { ad, kod, renk, gun, sira, aktif } = req.body;
  if (!ad || !kod) return dogrulamaHatasi(res, "Ad ve kod zorunludur.");

  /* Kod benzersizlik kontrolu */
  const [mevcut] = await havuz.query("SELECT id FROM lisans_tipleri WHERE kod = ?", [kod]);
  if (mevcut.length > 0) return dogrulamaHatasi(res, "Bu kod zaten kullanilmaktadir.");

  const [sonuc] = await havuz.query(
    "INSERT INTO lisans_tipleri (ad, kod, renk, gun, sira, aktif) VALUES (?, ?, ?, ?, ?, ?)",
    [ad, kod, renk || "blue", parseInt(gun) || 365, parseInt(sira) || 0, aktif !== undefined ? (aktif ? 1 : 0) : 1]
  );

  res.status(201).json({ basarili: true, mesaj: "Lisans tipi eklendi.", id: sonuc.insertId });
}));

/* ---- Lisans Tipi Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM lisans_tipleri WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Lisans tipi bulunamadi.");

  const { ad, kod, renk, gun, sira, aktif } = req.body;

  /* Kod benzersizlik kontrolu (kendisi haric) */
  if (kod) {
    const [ayniKod] = await havuz.query("SELECT id FROM lisans_tipleri WHERE kod = ? AND id != ?", [kod, id]);
    if (ayniKod.length > 0) return dogrulamaHatasi(res, "Bu kod zaten kullanilmaktadir.");
  }

  await havuz.query(
    `UPDATE lisans_tipleri SET 
      ad = COALESCE(?, ad),
      kod = COALESCE(?, kod),
      renk = COALESCE(?, renk),
      gun = COALESCE(?, gun),
      sira = COALESCE(?, sira),
      aktif = COALESCE(?, aktif)
    WHERE id = ?`,
    [ad || null, kod || null, renk || null, gun !== undefined ? parseInt(gun) : null, sira !== undefined ? parseInt(sira) : null, aktif !== undefined ? (aktif ? 1 : 0) : null, id]
  );

  res.json({ basarili: true, mesaj: "Lisans tipi guncellendi." });
}));

/* ---- Lisans Tipi Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id, kod FROM lisans_tipleri WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Lisans tipi bulunamadi.");

  /* Bu tip kullanılıyor mu kontrol et */
  const [kullanan] = await havuz.query("SELECT COUNT(*) as sayi FROM lisanslar WHERE lisans_tipi = ?", [mevcut[0].kod]);
  if (kullanan[0].sayi > 0) {
    return dogrulamaHatasi(res, `Bu lisans tipi ${kullanan[0].sayi} lisansta kullanilmaktadir. Oncelikle bu lisanslarin tipini degistirin.`);
  }

  await havuz.query("DELETE FROM lisans_tipleri WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Lisans tipi silindi." });
}));

module.exports = router;
