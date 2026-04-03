const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol } = require("../yardimcilar/yetki-middleware");

/* ============================================= */
/*  MUSTERI ILETISIM KISILERI                    */
/* ============================================= */

router.get("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const kisiler = await prisma.iletisimKisi.findMany({
    where: { musteri_id: Number(req.params.musteriId), aktif: 1 },
    orderBy: [{ birincil: "desc" }, { ad_soyad: "asc" }],
  });
  res.json({ basarili: true, veri: temizle(kisiler) });
}));

router.post("/musteri/:musteriId", yetkiKontrol, hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;
  if (!ad_soyad) return dogrulamaHatasi(res, "Ad soyad zorunludur.");

  if (birincil) {
    await prisma.iletisimKisi.updateMany({ where: { musteri_id: musteriId }, data: { birincil: 0 } });
  }

  const sonuc = await prisma.iletisimKisi.create({
    data: { musteri_id: musteriId, ad_soyad, unvan: unvan || null, departman: departman || null, telefon: telefon || null, cep_telefon: cep_telefon || null, eposta: eposta || null, notlar: notlar || null, birincil: birincil ? 1 : 0 },
  });
  res.status(201).json({ basarili: true, mesaj: "Kisi basariyla eklendi.", id: sonuc.id });
}));

router.put("/musteri/:musteriId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const { musteriId, kisiId } = req.params;
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;

  const mevcut = await prisma.iletisimKisi.findFirst({ where: { id: Number(kisiId), musteri_id: Number(musteriId) } });
  if (!mevcut) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  if (birincil) {
    await prisma.iletisimKisi.updateMany({ where: { musteri_id: Number(musteriId), id: { not: Number(kisiId) } }, data: { birincil: 0 } });
  }

  await prisma.iletisimKisi.update({
    where: { id: Number(kisiId) },
    data: { ad_soyad: ad_soyad || undefined, unvan: unvan || null, departman: departman || null, telefon: telefon || null, cep_telefon: cep_telefon || null, eposta: eposta || null, notlar: notlar || null, birincil: birincil ? 1 : 0 },
  });
  res.json({ basarili: true, mesaj: "Kisi basariyla guncellendi." });
}));

router.delete("/musteri/:musteriId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const mevcut = await prisma.iletisimKisi.findFirst({ where: { id: Number(req.params.kisiId), musteri_id: Number(req.params.musteriId) } });
  if (!mevcut) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  await prisma.iletisimKisi.update({ where: { id: Number(req.params.kisiId) }, data: { aktif: 0 } });
  res.json({ basarili: true, mesaj: "Kisi basariyla silindi." });
}));

/* ============================================= */
/*  BAYI ILETISIM KISILERI                       */
/* ============================================= */

router.get("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const kisiler = await prisma.iletisimKisi.findMany({
    where: { bayi_id: Number(req.params.bayiId), aktif: 1 },
    orderBy: [{ birincil: "desc" }, { ad_soyad: "asc" }],
  });
  res.json({ basarili: true, veri: temizle(kisiler) });
}));

router.post("/bayi/:bayiId", yetkiKontrol, hataYakala(async (req, res) => {
  const bayiId = Number(req.params.bayiId);
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;
  if (!ad_soyad) return dogrulamaHatasi(res, "Ad soyad zorunludur.");

  if (birincil) {
    await prisma.iletisimKisi.updateMany({ where: { bayi_id: bayiId }, data: { birincil: 0 } });
  }

  const sonuc = await prisma.iletisimKisi.create({
    data: { bayi_id: bayiId, ad_soyad, unvan: unvan || null, departman: departman || null, telefon: telefon || null, cep_telefon: cep_telefon || null, eposta: eposta || null, notlar: notlar || null, birincil: birincil ? 1 : 0 },
  });
  res.status(201).json({ basarili: true, mesaj: "Kisi basariyla eklendi.", id: sonuc.id });
}));

router.put("/bayi/:bayiId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const { bayiId, kisiId } = req.params;
  const { ad_soyad, unvan, departman, telefon, cep_telefon, eposta, notlar, birincil } = req.body;

  const mevcut = await prisma.iletisimKisi.findFirst({ where: { id: Number(kisiId), bayi_id: Number(bayiId) } });
  if (!mevcut) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  if (birincil) {
    await prisma.iletisimKisi.updateMany({ where: { bayi_id: Number(bayiId), id: { not: Number(kisiId) } }, data: { birincil: 0 } });
  }

  await prisma.iletisimKisi.update({
    where: { id: Number(kisiId) },
    data: { ad_soyad: ad_soyad || undefined, unvan: unvan || null, departman: departman || null, telefon: telefon || null, cep_telefon: cep_telefon || null, eposta: eposta || null, notlar: notlar || null, birincil: birincil ? 1 : 0 },
  });
  res.json({ basarili: true, mesaj: "Kisi basariyla guncellendi." });
}));

router.delete("/bayi/:bayiId/:kisiId", yetkiKontrol, hataYakala(async (req, res) => {
  const mevcut = await prisma.iletisimKisi.findFirst({ where: { id: Number(req.params.kisiId), bayi_id: Number(req.params.bayiId) } });
  if (!mevcut) return bulunamadiHatasi(res, "Kisi bulunamadi.");

  await prisma.iletisimKisi.update({ where: { id: Number(req.params.kisiId) }, data: { aktif: 0 } });
  res.json({ basarili: true, mesaj: "Kisi basariyla silindi." });
}));

module.exports = router;
