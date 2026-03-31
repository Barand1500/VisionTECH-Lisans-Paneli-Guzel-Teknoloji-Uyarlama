/* ============================================= */
/*  Yetki Rotalari - Giris / Kullanici Yonetimi  */
/* ============================================= */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol, sadaceAdmin, JWT_GIZLI } = require("../yardimcilar/yetki-middleware");

/* ---- Giris Yap ---- */
router.post("/giris", hataYakala(async (req, res) => {
  const { eposta, sifre } = req.body;
  if (!eposta || !sifre) return dogrulamaHatasi(res, "E-posta ve sifre zorunludur.");

  const [satirlar] = await havuz.query("SELECT * FROM kullanicilar WHERE eposta = ?", [eposta]);
  if (satirlar.length === 0) return res.status(401).json({ basarili: false, mesaj: "E-posta veya sifre hatali." });

  const kullanici = satirlar[0];
  if (!kullanici.aktif) return res.status(403).json({ basarili: false, mesaj: "Hesabiniz pasif durumda. Yonetici ile iletisime gecin." });

  const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre_hash);
  if (!sifreDogruMu) return res.status(401).json({ basarili: false, mesaj: "E-posta veya sifre hatali." });

  /* Son giris tarihini guncelle */
  await havuz.query("UPDATE kullanicilar SET son_giris = NOW() WHERE id = ?", [kullanici.id]);

  /* Giris logunu kaydet */
  await havuz.query(
    "INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, ?, ?)",
    [kullanici.id, "giris", `${kullanici.ad_soyad} (${kullanici.eposta}) giris yapti.`]
  );

  const token = jwt.sign(
    { id: kullanici.id, eposta: kullanici.eposta, rol: kullanici.rol, ad_soyad: kullanici.ad_soyad },
    JWT_GIZLI,
    { expiresIn: "24h" }
  );

  res.json({
    basarili: true,
    mesaj: "Giris basarili.",
    token,
    kullanici: {
      id: kullanici.id,
      ad_soyad: kullanici.ad_soyad,
      eposta: kullanici.eposta,
      rol: kullanici.rol,
    },
  });
}));

/* ---- Mevcut Kullanici Bilgisi (token ile) ---- */
router.get("/ben", yetkiKontrol, hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(
    "SELECT id, kullanici_adi, ad_soyad, eposta, rol, aktif, olusturma_tarihi, son_giris FROM kullanicilar WHERE id = ?",
    [req.kullanici.id]
  );
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Kullanici bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Cikis Yap (log kaydi) ---- */
router.post("/cikis", yetkiKontrol, hataYakala(async (req, res) => {
  await havuz.query(
    "INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, ?, ?)",
    [req.kullanici.id, "cikis", `${req.kullanici.ad_soyad} (${req.kullanici.eposta}) cikis yapti.`]
  );
  res.json({ basarili: true, mesaj: "Cikis basarili." });
}));

/* ============================================= */
/*  Kullanici CRUD (sadece admin)                 */
/* ============================================= */

/* ---- Tum Kullanicilari Listele ---- */
router.get("/kullanicilar", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const [kullanicilar] = await havuz.query(
    "SELECT id, kullanici_adi, ad_soyad, eposta, rol, aktif, olusturma_tarihi, son_giris FROM kullanicilar ORDER BY id ASC"
  );
  res.json({ basarili: true, veri: kullanicilar });
}));

/* ---- Kullanici Ekle ---- */
router.post("/kullanicilar", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const { ad_soyad, eposta, sifre, rol, aktif } = req.body;
  if (!ad_soyad || !eposta || !sifre) return dogrulamaHatasi(res, "Ad soyad, e-posta ve sifre zorunludur.");

  /* E-posta benzersizlik kontrolu */
  const [mevcut] = await havuz.query("SELECT id FROM kullanicilar WHERE eposta = ?", [eposta]);
  if (mevcut.length > 0) return dogrulamaHatasi(res, "Bu e-posta adresi zaten kayitli.");

  const hash = await bcrypt.hash(sifre, 10);
  const kullaniciAdi = eposta.split("@")[0];

  const [sonuc] = await havuz.query(
    "INSERT INTO kullanicilar (kullanici_adi, ad_soyad, eposta, sifre_hash, rol, aktif) VALUES (?, ?, ?, ?, ?, ?)",
    [kullaniciAdi, ad_soyad, eposta, hash, rol || "kullanici", aktif !== undefined ? (aktif ? 1 : 0) : 1]
  );

  res.status(201).json({ basarili: true, mesaj: "Kullanici basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Kullanici Guncelle ---- */
router.put("/kullanicilar/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcutSatir] = await havuz.query("SELECT id FROM kullanicilar WHERE id = ?", [id]);
  if (mevcutSatir.length === 0) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  const { ad_soyad, eposta, sifre, rol, aktif } = req.body;

  /* Eger sifre de gonderildiyse hashle */
  let hashPart = "";
  const params = [];

  let sql = "UPDATE kullanicilar SET ad_soyad = COALESCE(?, ad_soyad), eposta = COALESCE(?, eposta), rol = COALESCE(?, rol), aktif = COALESCE(?, aktif)";
  params.push(ad_soyad || null, eposta || null, rol || null, aktif !== undefined ? (aktif ? 1 : 0) : null);

  if (sifre) {
    sql += ", sifre_hash = ?";
    params.push(await bcrypt.hash(sifre, 10));
  }

  sql += " WHERE id = ?";
  params.push(id);

  await havuz.query(sql, params);
  res.json({ basarili: true, mesaj: "Kullanici basariyla guncellendi." });
}));

/* ---- Kullanici Sil ---- */
router.delete("/kullanicilar/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.kullanici.id) return dogrulamaHatasi(res, "Kendi hesabinizi silemezsiniz.");

  const [mevcutSatir] = await havuz.query("SELECT id FROM kullanicilar WHERE id = ?", [id]);
  if (mevcutSatir.length === 0) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  await havuz.query("DELETE FROM kullanicilar WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Kullanici basariyla silindi." });
}));

module.exports = router;
