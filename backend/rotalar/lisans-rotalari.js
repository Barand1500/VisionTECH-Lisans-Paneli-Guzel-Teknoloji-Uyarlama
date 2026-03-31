/* ============================================= */
/*  Lisans Rotalari - CRUD Islemleri              */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Lisanslari Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [lisanslar] = await havuz.query(`
    SELECT l.*,
      COALESCE(m.ad_soyad, m.sirket_adi) as musteri_adi,
      u.ad as urun_adi,
      p.ad as paket_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    ORDER BY l.id DESC
  `);
  res.json({ basarili: true, veri: lisanslar });
}));

/* ---- Tek Lisans Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(`
    SELECT l.*,
      COALESCE(m.ad_soyad, m.sirket_adi) as musteri_adi,
      u.ad as urun_adi,
      p.ad as paket_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.id = ?
  `, [Number(req.params.id)]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Musteriye Ait Lisanslari Getir ---- */
router.get("/musteri/:musteriId", hataYakala(async (req, res) => {
  const [lisanslar] = await havuz.query(`
    SELECT l.*,
      u.ad as urun_adi,
      p.ad as paket_adi
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.musteri_id = ?
    ORDER BY l.bitis_tarihi ASC
  `, [Number(req.params.musteriId)]);
  res.json({ basarili: true, veri: lisanslar });
}));

/* ---- Lisans Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { musteri_id, urun_id, paket_id, lisans_anahtari, baslangic_tarihi, bitis_tarihi, durum, domain, fatura_no, fiyat, fatura_geldi, kullanici_sayisi } = req.body;

  if (!musteri_id) return dogrulamaHatasi(res, "Musteri ID zorunludur.");
  if (!baslangic_tarihi || !bitis_tarihi) return dogrulamaHatasi(res, "Baslangic ve bitis tarihleri zorunludur.");

  const [sonuc] = await havuz.query(
    `INSERT INTO lisanslar (musteri_id, urun_id, paket_id, lisans_anahtari, baslangic_tarihi, bitis_tarihi, durum, domain, fatura_no, fiyat, fatura_geldi, kullanici_sayisi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [musteri_id, urun_id || null, paket_id || null, lisans_anahtari || null, baslangic_tarihi, bitis_tarihi, durum || "aktif", domain || null, fatura_no || null, fiyat || 0, fatura_geldi ? 1 : 0, parseInt(kullanici_sayisi) || 1]
  );

  res.status(201).json({ basarili: true, mesaj: "Lisans basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Lisans Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM lisanslar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const { musteri_id, urun_id, paket_id, lisans_anahtari, baslangic_tarihi, bitis_tarihi, durum, domain, fatura_no, fiyat, fatura_geldi, kullanici_sayisi } = req.body;

  await havuz.query(
    `UPDATE lisanslar SET
      musteri_id = COALESCE(?, musteri_id), urun_id = ?, paket_id = ?,
      lisans_anahtari = ?, baslangic_tarihi = COALESCE(?, baslangic_tarihi),
      bitis_tarihi = COALESCE(?, bitis_tarihi), durum = COALESCE(?, durum),
      domain = ?, fatura_no = ?, fiyat = COALESCE(?, fiyat),
      fatura_geldi = ?, kullanici_sayisi = ?
    WHERE id = ?`,
    [musteri_id || null, urun_id || null, paket_id || null, lisans_anahtari || null, baslangic_tarihi || null, bitis_tarihi || null, durum || null, domain || null, fatura_no || null, fiyat !== undefined ? fiyat : null, fatura_geldi !== undefined ? (fatura_geldi ? 1 : 0) : 0, kullanici_sayisi !== undefined ? (parseInt(kullanici_sayisi) || 1) : null, id]
  );

  res.json({ basarili: true, mesaj: "Lisans basariyla guncellendi." });
}));

/* ---- Lisans Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM lisanslar WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  await havuz.query("DELETE FROM lisanslar WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Lisans basariyla silindi." });
}));

module.exports = router;
