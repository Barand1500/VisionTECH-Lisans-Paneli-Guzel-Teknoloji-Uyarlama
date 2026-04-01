/* ============================================= */
/*  Musteri Rotalari - CRUD Islemleri             */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Musterileri Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const [musteriler] = await havuz.query(`
    SELECT m.*,
      s.ad AS sektor_adi,
      (SELECT GROUP_CONCAT(telefon SEPARATOR '|||') FROM musteri_telefonlari WHERE musteri_id = m.id) as telefonlar,
      (SELECT GROUP_CONCAT(adres SEPARATOR '|||') FROM musteri_adresleri WHERE musteri_id = m.id) as adresler
    FROM musteriler m
    LEFT JOIN sektorler s ON s.id = m.sektor_id
    WHERE m.silinme_tarihi IS NULL
    ORDER BY m.id DESC
  `);

  const sonuc = musteriler.map((m) => ({
    ...m,
    telefonlar: m.telefonlar ? m.telefonlar.split("|||") : [],
    adresler: m.adresler ? m.adresler.split("|||") : [],
  }));

  res.json({ basarili: true, veri: sonuc });
}));

/* ---- Tek Musteri Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [satirlar] = await havuz.query(
    "SELECT m.*, s.ad AS sektor_adi FROM musteriler m LEFT JOIN sektorler s ON s.id = m.sektor_id WHERE m.id = ? AND m.silinme_tarihi IS NULL",
    [id]
  );
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Musteri bulunamadi.");

  const musteri = satirlar[0];
  const [telSatirlari] = await havuz.query("SELECT telefon FROM musteri_telefonlari WHERE musteri_id = ?", [id]);
  const [adrSatirlari] = await havuz.query("SELECT adres FROM musteri_adresleri WHERE musteri_id = ?", [id]);
  musteri.telefonlar = telSatirlari.map(t => t.telefon);
  musteri.adresler = adrSatirlari.map(a => a.adres);

  res.json({ basarili: true, veri: musteri });
}));

/* ---- Musteri Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { tur, ad_soyad, sirket_adi, yetkili_kisi, eposta, tc_kimlik_no, vergi_no, vergi_dairesi, pasaport_no, sektor_id, durum, ust_musteri_id, telefonlar, adresler, etiketler } = req.body;

  if (!tur) return dogrulamaHatasi(res, "Musteri turu zorunludur.");
  if (tur === "gercek" && !ad_soyad) return dogrulamaHatasi(res, "Gercek kisi icin ad soyad zorunludur.");
  if (tur === "tuzel" && !sirket_adi) return dogrulamaHatasi(res, "Tuzel kisi icin sirket adi zorunludur.");

  const [sonuc] = await havuz.query(
    `INSERT INTO musteriler (tur, ad_soyad, sirket_adi, yetkili_kisi, eposta, tc_kimlik_no, vergi_no, vergi_dairesi, pasaport_no, sektor_id, etiketler, durum, ust_musteri_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tur, ad_soyad || null, sirket_adi || null, yetkili_kisi || null, eposta || null, tc_kimlik_no || null, vergi_no || null, vergi_dairesi || null, pasaport_no || null, sektor_id || null, etiketler ? JSON.stringify(etiketler) : null, durum || "aktif", ust_musteri_id || null]
  );

  const musteriId = sonuc.insertId;

  if (Array.isArray(telefonlar)) {
    for (const t of telefonlar) if (t) await havuz.query("INSERT INTO musteri_telefonlari (musteri_id, telefon) VALUES (?, ?)", [musteriId, t]);
  }
  if (Array.isArray(adresler)) {
    for (const a of adresler) if (a) await havuz.query("INSERT INTO musteri_adresleri (musteri_id, adres) VALUES (?, ?)", [musteriId, a]);
  }

  res.status(201).json({ basarili: true, mesaj: "Musteri basariyla eklendi.", id: musteriId });
}));

/* ---- Musteri Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM musteriler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Musteri bulunamadi.");

  const { tur, ad_soyad, sirket_adi, yetkili_kisi, eposta, tc_kimlik_no, vergi_no, vergi_dairesi, pasaport_no, sektor_id, etiketler, durum, ust_musteri_id, telefonlar, adresler } = req.body;

  await havuz.query(
    `UPDATE musteriler SET
      tur = COALESCE(?, tur), ad_soyad = ?, sirket_adi = ?, yetkili_kisi = ?, eposta = ?,
      tc_kimlik_no = ?, vergi_no = ?, vergi_dairesi = ?, pasaport_no = ?, sektor_id = ?,
      etiketler = ?, durum = COALESCE(?, durum), ust_musteri_id = ?, guncelleme_tarihi = NOW()
    WHERE id = ?`,
    [tur || null, ad_soyad || null, sirket_adi || null, yetkili_kisi || null, eposta || null, tc_kimlik_no || null, vergi_no || null, vergi_dairesi || null, pasaport_no || null, sektor_id !== undefined ? (sektor_id || null) : null, etiketler ? JSON.stringify(etiketler) : null, durum || null, ust_musteri_id || null, id]
  );

  if (Array.isArray(telefonlar)) {
    await havuz.query("DELETE FROM musteri_telefonlari WHERE musteri_id = ?", [id]);
    for (const t of telefonlar) if (t) await havuz.query("INSERT INTO musteri_telefonlari (musteri_id, telefon) VALUES (?, ?)", [id, t]);
  }
  if (Array.isArray(adresler)) {
    await havuz.query("DELETE FROM musteri_adresleri WHERE musteri_id = ?", [id]);
    for (const a of adresler) if (a) await havuz.query("INSERT INTO musteri_adresleri (musteri_id, adres) VALUES (?, ?)", [id, a]);
  }

  res.json({ basarili: true, mesaj: "Musteri basariyla guncellendi." });
}));

/* ---- Musteri Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM musteriler WHERE id = ? AND silinme_tarihi IS NULL", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Musteri bulunamadi.");

  await havuz.query("UPDATE musteriler SET silinme_tarihi = NOW(), durum = 'pasif' WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Musteri basariyla silindi." });
}));

module.exports = router;
