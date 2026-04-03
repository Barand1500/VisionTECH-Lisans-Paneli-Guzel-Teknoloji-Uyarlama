const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Musterileri Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const veriler = await prisma.musteri.findMany({
    where: { silinme_tarihi: null },
    include: {
      sektor: { select: { ad: true } },
      telefonlar: { select: { telefon: true } },
      adresler: { select: { adres: true } },
    },
    orderBy: { id: "desc" },
  });

  const sonuc = veriler.map(({ sektor, telefonlar, adresler, ...m }) => ({
    ...m,
    sektor_adi: sektor?.ad || null,
    telefonlar: telefonlar.map(t => t.telefon),
    adresler: adresler.map(a => a.adres),
  }));

  res.json({ basarili: true, veri: temizle(sonuc) });
}));

/* ---- Tek Musteri Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const veri = await prisma.musteri.findFirst({
    where: { id, silinme_tarihi: null },
    include: {
      sektor: { select: { ad: true } },
      telefonlar: { select: { telefon: true } },
      adresler: { select: { adres: true } },
    },
  });
  if (!veri) return bulunamadiHatasi(res, "Musteri bulunamadi.");

  const { sektor, telefonlar, adresler, ...musteri } = veri;
  musteri.sektor_adi = sektor?.ad || null;
  musteri.telefonlar = telefonlar.map(t => t.telefon);
  musteri.adresler = adresler.map(a => a.adres);

  res.json({ basarili: true, veri: temizle(musteri) });
}));

/* ---- Musteri Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { tur, ad_soyad, sirket_adi, yetkili_kisi, eposta, tc_kimlik_no, vergi_no, vergi_dairesi, pasaport_no, sektor_id, durum, ust_musteri_id, telefonlar, adresler, etiketler } = req.body;

  if (!tur) return dogrulamaHatasi(res, "Musteri turu zorunludur.");
  if (tur === "gercek" && !ad_soyad) return dogrulamaHatasi(res, "Gercek kisi icin ad soyad zorunludur.");
  if (tur === "tuzel" && !sirket_adi) return dogrulamaHatasi(res, "Tuzel kisi icin sirket adi zorunludur.");

  const sonuc = await prisma.musteri.create({
    data: {
      tur,
      ad_soyad: ad_soyad || null,
      sirket_adi: sirket_adi || null,
      yetkili_kisi: yetkili_kisi || null,
      eposta: eposta || null,
      tc_kimlik_no: tc_kimlik_no || null,
      vergi_no: vergi_no || null,
      vergi_dairesi: vergi_dairesi || null,
      pasaport_no: pasaport_no || null,
      sektor_id: sektor_id || null,
      etiketler: etiketler || undefined,
      durum: durum || "aktif",
      ust_musteri_id: ust_musteri_id || null,
      telefonlar: Array.isArray(telefonlar) && telefonlar.filter(Boolean).length > 0
        ? { create: telefonlar.filter(Boolean).map(t => ({ telefon: t })) }
        : undefined,
      adresler: Array.isArray(adresler) && adresler.filter(Boolean).length > 0
        ? { create: adresler.filter(Boolean).map(a => ({ adres: a })) }
        : undefined,
    },
  });

  res.status(201).json({ basarili: true, mesaj: "Musteri basariyla eklendi.", id: sonuc.id });
}));

/* ---- Musteri Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.musteri.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Musteri bulunamadi.");

  const { tur, ad_soyad, sirket_adi, yetkili_kisi, eposta, tc_kimlik_no, vergi_no, vergi_dairesi, pasaport_no, sektor_id, etiketler, durum, ust_musteri_id, telefonlar, adresler } = req.body;

  await prisma.musteri.update({
    where: { id },
    data: {
      tur: tur || undefined,
      ad_soyad: ad_soyad || null,
      sirket_adi: sirket_adi || null,
      yetkili_kisi: yetkili_kisi || null,
      eposta: eposta || null,
      tc_kimlik_no: tc_kimlik_no || null,
      vergi_no: vergi_no || null,
      vergi_dairesi: vergi_dairesi || null,
      pasaport_no: pasaport_no || null,
      sektor_id: sektor_id !== undefined ? (sektor_id || null) : undefined,
      etiketler: etiketler !== undefined ? etiketler : undefined,
      durum: durum || undefined,
      ust_musteri_id: ust_musteri_id || null,
      guncelleme_tarihi: new Date(),
    },
  });

  if (Array.isArray(telefonlar)) {
    await prisma.musteriTelefon.deleteMany({ where: { musteri_id: id } });
    for (const t of telefonlar) {
      if (t) await prisma.musteriTelefon.create({ data: { musteri_id: id, telefon: t } });
    }
  }
  if (Array.isArray(adresler)) {
    await prisma.musteriAdres.deleteMany({ where: { musteri_id: id } });
    for (const a of adresler) {
      if (a) await prisma.musteriAdres.create({ data: { musteri_id: id, adres: a } });
    }
  }

  res.json({ basarili: true, mesaj: "Musteri basariyla guncellendi." });
}));

/* ---- Musteri Sil (soft delete) ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.musteri.findFirst({ where: { id, silinme_tarihi: null } });
  if (!mevcut) return bulunamadiHatasi(res, "Musteri bulunamadi.");

  await prisma.musteri.update({ where: { id }, data: { silinme_tarihi: new Date(), durum: "pasif" } });
  res.json({ basarili: true, mesaj: "Musteri basariyla silindi." });
}));

module.exports = router;
