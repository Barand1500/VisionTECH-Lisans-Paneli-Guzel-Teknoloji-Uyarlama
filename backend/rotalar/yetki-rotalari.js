const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol, sadaceAdmin, JWT_GIZLI } = require("../yardimcilar/yetki-middleware");

/* ---- Giris ---- */
router.post("/giris", hataYakala(async (req, res) => {
  const { eposta, sifre } = req.body;
  if (!eposta || !sifre) return dogrulamaHatasi(res, "E-posta ve sifre zorunludur.");

  const kullanici = await prisma.kullanici.findFirst({
    where: { eposta, silinme_tarihi: null },
  });
  if (!kullanici) return res.status(401).json({ basarili: false, mesaj: "E-posta veya sifre hatali." });
  if (!kullanici.aktif) return res.status(403).json({ basarili: false, mesaj: "Hesabiniz pasif durumda. Yonetici ile iletisime gecin." });

  const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre_hash);
  if (!sifreDogruMu) return res.status(401).json({ basarili: false, mesaj: "E-posta veya sifre hatali." });

  await prisma.kullanici.update({ where: { id: kullanici.id }, data: { son_giris: new Date() } });

  const token = jwt.sign(
    { id: kullanici.id, eposta: kullanici.eposta, rol: kullanici.rol, ad_soyad: kullanici.ad_soyad },
    JWT_GIZLI,
    { expiresIn: "24h" }
  );

  try {
    await prisma.aktiviteLog.create({
      data: { kullanici_id: kullanici.id, tip: "giris", mesaj: `${kullanici.ad_soyad} (${kullanici.eposta}) giris yapti.` },
    });
  } catch (_) { /* log hatasi onemli degil */ }

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

/* ---- Cikis ---- */
router.post("/cikis", yetkiKontrol, hataYakala(async (req, res) => {
  try {
    await prisma.aktiviteLog.create({
      data: { kullanici_id: req.kullanici.id, tip: "cikis", mesaj: `${req.kullanici.ad_soyad || req.kullanici.eposta} cikis yapti.` },
    });
  } catch (_) { /* log hatasi onemli degil */ }
  res.json({ basarili: true, mesaj: "Cikis basarili." });
}));

/* ---- Mevcut Kullanici Bilgisi (token ile) ---- */
router.get("/ben", yetkiKontrol, hataYakala(async (req, res) => {
  const kullanici = await prisma.kullanici.findFirst({
    where: { id: req.kullanici.id, aktif: 1, silinme_tarihi: null },
  });
  if (!kullanici) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  const { sifre_hash, ...guvenli } = kullanici;
  res.json({ basarili: true, veri: temizle(guvenli) });
}));

/* ---- Tum Kullanicilari Listele ---- */
router.get("/kullanicilar", yetkiKontrol, sadaceAdmin, hataYakala(async (_req, res) => {
  const kullanicilar = await prisma.kullanici.findMany({
    where: { silinme_tarihi: null },
    orderBy: { olusturma_tarihi: "desc" },
  });
  const guvenliListe = kullanicilar.map(({ sifre_hash, ...k }) => k);
  res.json({ basarili: true, veri: temizle(guvenliListe) });
}));

/* ---- Kullanici Ekle ---- */
router.post("/kullanicilar", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const { ad_soyad, eposta, sifre, rol, aktif } = req.body;
  if (!ad_soyad || !eposta || !sifre) return dogrulamaHatasi(res, "Ad soyad, e-posta ve sifre zorunludur.");

  const mevcut = await prisma.kullanici.findFirst({
    where: { eposta, silinme_tarihi: null },
  });
  if (mevcut) return dogrulamaHatasi(res, "Bu e-posta adresi zaten kayitli.");

  const hash = await bcrypt.hash(sifre, 10);
  const kullaniciAdi = eposta.split("@")[0];

  const sonuc = await prisma.kullanici.create({
    data: { kullanici_adi: kullaniciAdi, sifre_hash: hash, ad_soyad, eposta, rol: rol || "kullanici", aktif: aktif !== undefined ? (aktif ? 1 : 0) : 1 },
  });
  res.status(201).json({ basarili: true, mesaj: "Kullanici basariyla eklendi.", id: sonuc.id });
}));

/* ---- Kullanici Guncelle ---- */
router.put("/kullanicilar/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.kullanici.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  const { kullanici_adi, sifre, ad_soyad, eposta, rol, aktif } = req.body;
  const data = {};
  if (kullanici_adi) data.kullanici_adi = kullanici_adi;
  if (ad_soyad) data.ad_soyad = ad_soyad;
  if (eposta) data.eposta = eposta;
  if (rol) data.rol = rol;
  if (aktif !== undefined) data.aktif = aktif ? 1 : 0;
  if (sifre) data.sifre_hash = await bcrypt.hash(sifre, 10);

  await prisma.kullanici.update({ where: { id }, data });
  res.json({ basarili: true, mesaj: "Kullanici basariyla guncellendi." });
}));

/* ---- Kullanici Sil ---- */
router.delete("/kullanicilar/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.kullanici.id) return dogrulamaHatasi(res, "Kendi hesabinizi silemezsiniz.");

  const mevcut = await prisma.kullanici.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  await prisma.kullanici.update({ where: { id }, data: { silinme_tarihi: new Date(), aktif: 0 } });
  res.json({ basarili: true, mesaj: "Kullanici basariyla silindi." });
}));

/* ---- Sifre Sifirlama Maili ---- */
router.post("/sifre-sifirla", hataYakala(async (req, res) => {
  const { eposta } = req.body;
  if (!eposta) return dogrulamaHatasi(res, "E-posta zorunludur.");

  const kullanici = await prisma.kullanici.findFirst({ where: { eposta, aktif: 1, silinme_tarihi: null } });
  if (!kullanici) return res.json({ basarili: true, mesaj: "Eger e-posta kayitli ise sifirlama linki gonderildi." });

  const yeniSifre = crypto.randomBytes(4).toString("hex");
  const hash = await bcrypt.hash(yeniSifre, 10);
  await prisma.kullanici.update({ where: { id: kullanici.id }, data: { sifre_hash: hash } });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_KULLANICI, pass: process.env.SMTP_SIFRE },
    });
    await transporter.sendMail({
      from: process.env.SMTP_KULLANICI,
      to: eposta,
      subject: "Guzel Teknoloji - Sifre Sifirlama",
      html: `<p>Yeni sifreniz: <strong>${yeniSifre}</strong></p><p>Giris yaptiktan sonra sifrenizi degistirmenizi oneririz.</p>`,
    });

    try {
      await prisma.aktiviteLog.create({
        data: { kullanici_id: kullanici.id, tip: "sifre_sifirlama", mesaj: `${kullanici.kullanici_adi} icin sifre sifirlandi.` },
      });
    } catch (_) {}
  } catch (e) {
    console.error("E-posta gonderim hatasi:", e.message);
  }

  res.json({ basarili: true, mesaj: "Eger e-posta kayitli ise sifirlama linki gonderildi." });
}));

/* ---- Sifre Degistir ---- */
router.put("/sifre-degistir", yetkiKontrol, hataYakala(async (req, res) => {
  const { mevcut_sifre, yeni_sifre } = req.body;
  if (!mevcut_sifre || !yeni_sifre) return dogrulamaHatasi(res, "Mevcut ve yeni sifre zorunludur.");

  const kullanici = await prisma.kullanici.findUnique({ where: { id: req.kullanici.id } });
  if (!kullanici) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  const dogruMu = await bcrypt.compare(mevcut_sifre, kullanici.sifre_hash);
  if (!dogruMu) return dogrulamaHatasi(res, "Mevcut sifre yanlis.");

  const hash = await bcrypt.hash(yeni_sifre, 10);
  await prisma.kullanici.update({ where: { id: kullanici.id }, data: { sifre_hash: hash } });
  res.json({ basarili: true, mesaj: "Sifre basariyla degistirildi." });
}));

module.exports = router;
