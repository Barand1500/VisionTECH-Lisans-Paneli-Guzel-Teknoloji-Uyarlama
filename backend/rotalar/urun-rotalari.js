/* ============================================= */
/*  Urun ve Paket Rotalari - CRUD Islemleri       */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* =========== YARDIMCI FONKSIYON =========== */
// Güvenli sayı dönüşümü - NaN kontrolü ile
const guvenliSayi = (deger) => {
  if (deger === undefined || deger === null || deger === "") return null;
  const sayi = parseInt(deger, 10);
  return isNaN(sayi) ? null : sayi;
};

/* =========== URUN TIPLERI =========== */

// Tüm ürün tiplerini getir (opsiyonel grup_id filtresi)
router.get("/tipler", hataYakala(async (req, res) => {
  const grupId = guvenliSayi(req.query.grup_id);
  let sorgu = `
    SELECT ut.*, ug.ad as grup_adi
    FROM urun_tipleri ut
    LEFT JOIN urun_gruplari ug ON ut.grup_id = ug.id
    WHERE ut.aktif = 1
  `;
  const params = [];
  
  if (grupId !== null) {
    sorgu += " AND ut.grup_id = ?";
    params.push(grupId);
  }
  
  sorgu += " ORDER BY ug.ad, ut.ad";
  
  const [tipler] = await havuz.query(sorgu, params);
  res.json({ basarili: true, veri: tipler });
}));

router.post("/tipler", hataYakala(async (req, res) => {
  const { ad, grup_id } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Tip adi zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO urun_tipleri (ad, grup_id) VALUES (?, ?)",
    [ad, grup_id || null]
  );
  res.status(201).json({ basarili: true, mesaj: "Urun tipi eklendi.", id: sonuc.insertId });
}));

router.put("/tipler/:id", hataYakala(async (req, res) => {
  const id = guvenliSayi(req.params.id);
  if (id === null) return dogrulamaHatasi(res, "Gecerli bir ID gerekli.");
  
  const { ad, grup_id, aktif } = req.body;
  const grupIdSayi = guvenliSayi(grup_id);

  await havuz.query(
    "UPDATE urun_tipleri SET ad = COALESCE(?, ad), grup_id = ?, aktif = ? WHERE id = ?",
    [ad, grupIdSayi, aktif !== undefined ? (aktif ? 1 : 0) : 1, id]
  );
  res.json({ basarili: true, mesaj: "Urun tipi guncellendi." });
}));

router.delete("/tipler/:id", hataYakala(async (req, res) => {
  const id = guvenliSayi(req.params.id);
  if (id === null) return dogrulamaHatasi(res, "Gecerli bir ID gerekli.");
  
  await havuz.query("DELETE FROM urun_tipleri WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Urun tipi silindi." });
}));

/* =========== UYGULAMA TIPLERI =========== */

// Tüm uygulama tiplerini getir (opsiyonel urun_tipi_id filtresi)
router.get("/uygulama-tipler", hataYakala(async (req, res) => {
  const urunTipiId = guvenliSayi(req.query.urun_tipi_id);
  let sorgu = `
    SELECT uyt.*, ut.ad as urun_tipi_adi
    FROM uygulama_tipleri uyt
    LEFT JOIN urun_tipleri ut ON uyt.urun_tipi_id = ut.id
    WHERE uyt.aktif = 1
  `;
  const params = [];
  
  if (urunTipiId !== null) {
    sorgu += " AND uyt.urun_tipi_id = ?";
    params.push(urunTipiId);
  }
  
  sorgu += " ORDER BY ut.ad, uyt.ad";
  
  const [tipler] = await havuz.query(sorgu, params);
  res.json({ basarili: true, veri: tipler });
}));

router.post("/uygulama-tipler", hataYakala(async (req, res) => {
  const { ad, urun_tipi_id } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Uygulama tipi adi zorunludur.");

  const [sonuc] = await havuz.query(
    "INSERT INTO uygulama_tipleri (ad, urun_tipi_id) VALUES (?, ?)",
    [ad, urun_tipi_id || null]
  );
  res.status(201).json({ basarili: true, mesaj: "Uygulama tipi eklendi.", id: sonuc.insertId });
}));

// Çoklu ürün tipine aynı uygulama tipini ekle
router.post("/uygulama-tipler/toplu", hataYakala(async (req, res) => {
  const { ad, urun_tipi_idler } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Uygulama tipi adi zorunludur.");
  if (!urun_tipi_idler || !Array.isArray(urun_tipi_idler) || urun_tipi_idler.length === 0) {
    return dogrulamaHatasi(res, "En az bir urun tipi secilmelidir.");
  }

  const eklenenler = [];
  for (const urunTipiId of urun_tipi_idler) {
    const [sonuc] = await havuz.query(
      "INSERT INTO uygulama_tipleri (ad, urun_tipi_id) VALUES (?, ?)",
      [ad, urunTipiId || null]
    );
    eklenenler.push(sonuc.insertId);
  }
  
  res.status(201).json({ 
    basarili: true, 
    mesaj: `${eklenenler.length} adet uygulama tipi eklendi.`, 
    idler: eklenenler 
  });
}));

router.put("/uygulama-tipler/:id", hataYakala(async (req, res) => {
  const id = guvenliSayi(req.params.id);
  if (id === null) return dogrulamaHatasi(res, "Gecerli bir ID gerekli.");
  
  const { ad, urun_tipi_id, aktif } = req.body;
  const urunTipiIdSayi = guvenliSayi(urun_tipi_id);

  await havuz.query(
    "UPDATE uygulama_tipleri SET ad = COALESCE(?, ad), urun_tipi_id = ?, aktif = ? WHERE id = ?",
    [ad, urunTipiIdSayi, aktif !== undefined ? (aktif ? 1 : 0) : 1, id]
  );
  res.json({ basarili: true, mesaj: "Uygulama tipi guncellendi." });
}));

router.delete("/uygulama-tipler/:id", hataYakala(async (req, res) => {
  const id = guvenliSayi(req.params.id);
  if (id === null) return dogrulamaHatasi(res, "Gecerli bir ID gerekli.");
  
  await havuz.query("DELETE FROM uygulama_tipleri WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Uygulama tipi silindi." });
}));

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
  const { 
    grup_id, ad, aciklama, urun_tipi, uygulama_tipi, 
    ozel_proje, aktif, varsayilan_gun,
    min_kullanici, max_kullanici, demo_gun, temel_fiyat,
    versiyon, logo_url, ozellikler
  } = req.body;
  if (!ad) return dogrulamaHatasi(res, "Urun adi zorunludur.");

  const [sonuc] = await havuz.query(
    `INSERT INTO urunler (
      grup_id, ad, aciklama, urun_tipi, uygulama_tipi, ozel_proje, aktif, varsayilan_gun,
      min_kullanici, max_kullanici, demo_gun, temel_fiyat, versiyon, logo_url, ozellikler
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      grup_id || null, 
      ad, 
      aciklama || null,
      urun_tipi || null, 
      uygulama_tipi || null, 
      ozel_proje ? 1 : 0, 
      aktif !== undefined ? (aktif ? 1 : 0) : 1, 
      varsayilan_gun || 365,
      min_kullanici || 1,
      max_kullanici || null,
      demo_gun || 30,
      temel_fiyat || 0,
      versiyon || null,
      logo_url || null,
      ozellikler ? JSON.stringify(ozellikler) : null
    ]
  );

  res.status(201).json({ basarili: true, mesaj: "Urun basariyla eklendi.", id: sonuc.insertId });
}));

router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcut] = await havuz.query("SELECT id FROM urunler WHERE id = ?", [id]);
  if (mevcut.length === 0) return bulunamadiHatasi(res, "Urun bulunamadi.");

  const { 
    grup_id, ad, aciklama, urun_tipi, uygulama_tipi, 
    ozel_proje, aktif, varsayilan_gun,
    min_kullanici, max_kullanici, demo_gun, temel_fiyat,
    versiyon, logo_url, ozellikler
  } = req.body;

  await havuz.query(
    `UPDATE urunler SET
      grup_id = ?, ad = COALESCE(?, ad), aciklama = ?, urun_tipi = ?, uygulama_tipi = ?,
      ozel_proje = ?, aktif = ?, varsayilan_gun = ?,
      min_kullanici = ?, max_kullanici = ?, demo_gun = ?, temel_fiyat = ?,
      versiyon = ?, logo_url = ?, ozellikler = ?
    WHERE id = ?`,
    [
      grup_id || null, 
      ad || null, 
      aciklama || null,
      urun_tipi || null, 
      uygulama_tipi || null, 
      ozel_proje !== undefined ? (ozel_proje ? 1 : 0) : 0, 
      aktif !== undefined ? (aktif ? 1 : 0) : 1, 
      varsayilan_gun || 365,
      min_kullanici || 1,
      max_kullanici || null,
      demo_gun || 30,
      temel_fiyat || 0,
      versiyon || null,
      logo_url || null,
      ozellikler ? JSON.stringify(ozellikler) : null,
      id
    ]
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
