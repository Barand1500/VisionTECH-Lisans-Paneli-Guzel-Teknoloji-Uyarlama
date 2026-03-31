/* ============================================= */
/*  Rol Rotalari - Rol CRUD & Izin Yonetimi       */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol, sadaceAdmin } = require("../yardimcilar/yetki-middleware");

/* ---- Gecerli izin anahtarlari ---- */
const GECERLI_IZINLER = [
  "ozet", "musteriler", "bayiler", "yonetim",
  "lisans_yonetimi", "raporlar", "takvim",
  "aktivite_logu", "yedekleme",
];

/* ---- Tum Rolleri Listele ---- */
router.get("/", yetkiKontrol, hataYakala(async (req, res) => {
  const [roller] = await havuz.query(
    "SELECT id, ad, aciklama, izinler, varsayilan, aktif, olusturma_tarihi FROM roller ORDER BY id ASC"
  );
  res.json({ basarili: true, veri: roller });
}));

/* ---- Tek Rol Getir ---- */
router.get("/:id", yetkiKontrol, hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query("SELECT * FROM roller WHERE id = ?", [req.params.id]);
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Rol bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Yeni Rol Ekle ---- */
router.post("/", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const { ad, aciklama, izinler } = req.body;
  if (!ad || !ad.trim()) return dogrulamaHatasi(res, "Rol adi zorunludur.");
  if (!Array.isArray(izinler)) return dogrulamaHatasi(res, "Izinler dizi olmalidir.");

  /* Izin anahtarlarini dogrula */
  const gecersiz = izinler.filter(i => !GECERLI_IZINLER.includes(i));
  if (gecersiz.length > 0) return dogrulamaHatasi(res, "Gecersiz izin anahtarlari: " + gecersiz.join(", "));

  /* Benzersizlik kontrolu */
  const [mevcut] = await havuz.query("SELECT id FROM roller WHERE ad = ?", [ad.trim().toLowerCase()]);
  if (mevcut.length > 0) return dogrulamaHatasi(res, "Bu isimde bir rol zaten mevcut.");

  const [sonuc] = await havuz.query(
    "INSERT INTO roller (ad, aciklama, izinler) VALUES (?, ?, ?)",
    [ad.trim().toLowerCase(), aciklama || "", JSON.stringify(izinler)]
  );

  res.status(201).json({ basarili: true, mesaj: "Rol basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Rol Guncelle ---- */
router.put("/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcutSatir] = await havuz.query("SELECT * FROM roller WHERE id = ?", [id]);
  if (mevcutSatir.length === 0) return bulunamadiHatasi(res, "Rol bulunamadi.");

  const { ad, aciklama, izinler, aktif } = req.body;

  if (izinler !== undefined) {
    if (!Array.isArray(izinler)) return dogrulamaHatasi(res, "Izinler dizi olmalidir.");
    const gecersiz = izinler.filter(i => !GECERLI_IZINLER.includes(i));
    if (gecersiz.length > 0) return dogrulamaHatasi(res, "Gecersiz izin anahtarlari: " + gecersiz.join(", "));
  }

  /* Ad benzersizlik kontrolu (baska rolde kullaniliyorsa) */
  if (ad) {
    const [cakisan] = await havuz.query("SELECT id FROM roller WHERE ad = ? AND id != ?", [ad.trim().toLowerCase(), id]);
    if (cakisan.length > 0) return dogrulamaHatasi(res, "Bu isimde bir rol zaten mevcut.");
  }

  const guncelAd = ad ? ad.trim().toLowerCase() : mevcutSatir[0].ad;
  const eskiAd = mevcutSatir[0].ad;

  await havuz.query(
    "UPDATE roller SET ad = ?, aciklama = COALESCE(?, aciklama), izinler = COALESCE(?, izinler), aktif = COALESCE(?, aktif) WHERE id = ?",
    [guncelAd, aciklama !== undefined ? aciklama : null, izinler ? JSON.stringify(izinler) : null, aktif !== undefined ? (aktif ? 1 : 0) : null, id]
  );

  /* Eger rol adi degistiyse kullanicilar tablosunu da guncelle */
  if (ad && guncelAd !== eskiAd) {
    await havuz.query("UPDATE kullanicilar SET rol = ? WHERE rol = ?", [guncelAd, eskiAd]);
  }

  res.json({ basarili: true, mesaj: "Rol basariyla guncellendi." });
}));

/* ---- Rol Sil ---- */
router.delete("/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcutSatir] = await havuz.query("SELECT * FROM roller WHERE id = ?", [id]);
  if (mevcutSatir.length === 0) return bulunamadiHatasi(res, "Rol bulunamadi.");

  if (mevcutSatir[0].varsayilan) {
    return dogrulamaHatasi(res, "Varsayilan roller silinemez.");
  }

  /* Bu rolu kullanan kullanici var mi kontrol et */
  const [kullananlar] = await havuz.query("SELECT COUNT(*) as sayi FROM kullanicilar WHERE rol = ?", [mevcutSatir[0].ad]);
  if (kullananlar[0].sayi > 0) {
    return dogrulamaHatasi(res, "Bu rol " + kullananlar[0].sayi + " kullanici tarafindan kullaniliyor. Once kullanicilarin rolunu degistirin.");
  }

  await havuz.query("DELETE FROM roller WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Rol basariyla silindi." });
}));

/* ---- Gecerli izin listesini dondur (frontend icin) ---- */
router.get("/meta/izinler", yetkiKontrol, hataYakala(async (req, res) => {
  res.json({
    basarili: true, veri: GECERLI_IZINLER.map(k => ({
      anahtar: k,
      etiket: {
        ozet: "Ozet Paneli",
        musteriler: "Musteriler",
        bayiler: "Bayiler",
        yonetim: "Yonetim",
        lisans_yonetimi: "Lisans Yonetimi",
        raporlar: "Raporlar",
        takvim: "Takvim",
        aktivite_logu: "Aktivite Logu",
        yedekleme: "Yedekleme",
      }[k] || k,
    })),
  });
}));

module.exports = router;
