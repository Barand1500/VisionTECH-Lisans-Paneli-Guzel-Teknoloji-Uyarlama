const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { epostaGecerliMi, tcKimlikGecerliMi, vergiNoGecerliMi, pasaportNoGecerliMi } = require("../yardimcilar/validasyon");

/* ---- Multer ayarlari ---- */
const musteriDepolama = multer.diskStorage({
  destination(_req, _file, cb) {
    const klasor = path.join(__dirname, "..", "uploads", "musteriler");
    fs.mkdirSync(klasor, { recursive: true });
    cb(null, klasor);
  },
  filename(_req, file, cb) {
    const benzersiz = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, benzersiz + path.extname(file.originalname));
  },
});
const musteriYukleme = multer({
  storage: musteriDepolama,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const izinli = /pdf|png|jpe?g|gif|webp/;
    if (izinli.test(file.mimetype) || izinli.test(path.extname(file.originalname).toLowerCase().slice(1))) {
      cb(null, true);
    } else {
      cb(new Error("Yalnizca PDF, PNG, JPEG, GIF, WEBP dosyalarina izin verilir."));
    }
  },
});

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
  let { tur, ad_soyad, sirket_adi, yetkili_kisi, eposta, tc_kimlik_no, vergi_no, vergi_dairesi, pasaport_no, sektor_id, bayi_id, durum, ust_musteri_id, telefonlar, adresler, etiketler } = req.body;

  /* Boşlukları temizle */
  tc_kimlik_no = tc_kimlik_no?.trim() || null;
  vergi_no = vergi_no?.trim() || null;
  pasaport_no = pasaport_no?.trim() || null;

  if (!tur) return dogrulamaHatasi(res, "Musteri turu zorunludur.");
  if (tur === "gercek" && !ad_soyad) return dogrulamaHatasi(res, "Gercek kisi icin ad soyad zorunludur.");
  if (tur === "tuzel" && !sirket_adi) return dogrulamaHatasi(res, "Tuzel kisi icin sirket adi zorunludur.");
  
  /* Validasyon kontrolleri */
  if (eposta && !epostaGecerliMi(eposta)) return dogrulamaHatasi(res, "Gecersiz e-posta formati.");
  if (tc_kimlik_no && !tcKimlikGecerliMi(tc_kimlik_no)) return dogrulamaHatasi(res, "Gecersiz TC kimlik numarasi.");
  if (vergi_no && !vergiNoGecerliMi(vergi_no)) return dogrulamaHatasi(res, "Vergi numarasi 10-11 haneli olmalidir.");
  if (pasaport_no && !pasaportNoGecerliMi(pasaport_no)) return dogrulamaHatasi(res, "Gecersiz pasaport numarasi formati.");

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
      bayi_id: bayi_id || null,
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
  const mevcut = await prisma.musteri.findFirst({ where: { id, silinme_tarihi: null }, select: { id: true, tc_kimlik_no: true, vergi_no: true, pasaport_no: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Musteri bulunamadi.");

  let { tur, ad_soyad, sirket_adi, yetkili_kisi, eposta, tc_kimlik_no, vergi_no, vergi_dairesi, pasaport_no, sektor_id, bayi_id, etiketler, durum, ust_musteri_id, telefonlar, adresler } = req.body;
  tc_kimlik_no = tc_kimlik_no?.trim() || null;
  vergi_no = vergi_no?.trim() || null;
  pasaport_no = pasaport_no?.trim() || null;

  /* Validasyon kontrolleri (güncelleme) - sadece değişen alanları doğrula */
  if (eposta && !epostaGecerliMi(eposta)) return dogrulamaHatasi(res, "Gecersiz e-posta formati.");
  if (tc_kimlik_no && tc_kimlik_no !== mevcut.tc_kimlik_no && !tcKimlikGecerliMi(tc_kimlik_no)) return dogrulamaHatasi(res, "Gecersiz TC kimlik numarasi.");
  if (vergi_no && vergi_no !== mevcut.vergi_no && !vergiNoGecerliMi(vergi_no)) return dogrulamaHatasi(res, "Vergi numarasi 10-11 haneli olmalidir.");
  if (pasaport_no && pasaport_no !== mevcut.pasaport_no && !pasaportNoGecerliMi(pasaport_no)) return dogrulamaHatasi(res, "Gecersiz pasaport numarasi formati.");

  await prisma.$transaction(async (tx) => {
    await tx.musteri.update({
      where: { id },
      data: {
        tur: tur !== undefined ? tur : undefined,
        ad_soyad: ad_soyad !== undefined ? (ad_soyad || null) : undefined,
        sirket_adi: sirket_adi !== undefined ? (sirket_adi || null) : undefined,
        yetkili_kisi: yetkili_kisi !== undefined ? (yetkili_kisi || null) : undefined,
        eposta: eposta !== undefined ? (eposta || null) : undefined,
        tc_kimlik_no: tc_kimlik_no !== undefined ? (tc_kimlik_no || null) : undefined,
        vergi_no: vergi_no !== undefined ? (vergi_no || null) : undefined,
        vergi_dairesi: vergi_dairesi !== undefined ? (vergi_dairesi || null) : undefined,
        pasaport_no: pasaport_no !== undefined ? (pasaport_no || null) : undefined,
        sektor_id: sektor_id !== undefined ? (sektor_id || null) : undefined,
        bayi_id: bayi_id !== undefined ? (bayi_id || null) : undefined,
        etiketler: etiketler !== undefined ? etiketler : undefined,
        durum: durum || undefined,
        ust_musteri_id: ust_musteri_id !== undefined ? (ust_musteri_id || null) : undefined,
        guncelleme_tarihi: new Date(),
      },
    });

    if (Array.isArray(telefonlar)) {
      await tx.musteriTelefon.deleteMany({ where: { musteri_id: id } });
      for (const t of telefonlar) {
        if (t) await tx.musteriTelefon.create({ data: { musteri_id: id, telefon: t } });
      }
    }
    if (Array.isArray(adresler)) {
      await tx.musteriAdres.deleteMany({ where: { musteri_id: id } });
      for (const a of adresler) {
        if (a) await tx.musteriAdres.create({ data: { musteri_id: id, adres: a } });
      }
    }
  });

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

/* ---- Musteri Telefonlari ---- */
router.get("/:id/telefonlar", hataYakala(async (req, res) => {
  const musteriId = Number(req.params.id);
  const telefonlar = await prisma.musteriTelefon.findMany({ where: { musteri_id: musteriId } });
  res.json({ basarili: true, veri: temizle(telefonlar) });
}));

/* ---- Musteri Adresleri ---- */
router.get("/:id/adresler", hataYakala(async (req, res) => {
  const musteriId = Number(req.params.id);
  const adresler = await prisma.musteriAdres.findMany({ where: { musteri_id: musteriId } });
  res.json({ basarili: true, veri: temizle(adresler) });
}));

/* ---- Musteri Dosyalari ---- */
router.get("/:id/dosyalar", hataYakala(async (req, res) => {
  const musteriId = Number(req.params.id);
  const dosyalar = await prisma.musteriDosya.findMany({ where: { musteri_id: musteriId }, orderBy: { yuklenme_tarihi: "desc" } });
  res.json({ basarili: true, veri: temizle(dosyalar) });
}));

/* ---- Dosya Yukle ---- */
router.post("/:id/dosyalar", (req, res) => {
  musteriYukleme.array("dosyalar", 10)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ basarili: false, mesaj: err.code === "LIMIT_FILE_SIZE" ? "Dosya boyutu 10MB sinirini asiyor." : err.message });
    }
    if (err) return res.status(400).json({ basarili: false, mesaj: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ basarili: false, mesaj: "Dosya secilmedi." });

    try {
      const musteriId = Number(req.params.id);
      const eklenen = [];
      for (const dosya of req.files) {
        const sonuc = await prisma.musteriDosya.create({
          data: {
            musteri_id: musteriId,
            dosya_adi: dosya.filename,
            orijinal_ad: dosya.originalname,
            dosya_tipi: dosya.mimetype,
            boyut: BigInt(dosya.size),
          },
        });
        eklenen.push({ id: sonuc.id, dosya_adi: dosya.filename, orijinal_ad: dosya.originalname });
      }
      res.status(201).json({ basarili: true, mesaj: `${eklenen.length} dosya yuklendi.`, veri: temizle(eklenen) });
    } catch (e) {
      res.status(500).json({ basarili: false, mesaj: "Dosya yuklenirken hata: " + e.message });
    }
  });
});

/* ---- Dosya Indir ---- */
router.get("/:id/dosyalar/:dosyaId/indir", hataYakala(async (req, res) => {
  const dosya = await prisma.musteriDosya.findFirst({
    where: { id: Number(req.params.dosyaId), musteri_id: Number(req.params.id) },
  });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadi.");
  const dosyaYolu = path.join(__dirname, "..", "uploads", "musteriler", dosya.dosya_adi);
  if (!fs.existsSync(dosyaYolu)) return bulunamadiHatasi(res, "Dosya sunucuda bulunamadi.");
  res.download(dosyaYolu, dosya.orijinal_ad);
}));

/* ---- Dosya Sil ---- */
router.delete("/:id/dosyalar/:dosyaId", hataYakala(async (req, res) => {
  const dosya = await prisma.musteriDosya.findFirst({
    where: { id: Number(req.params.dosyaId), musteri_id: Number(req.params.id) },
  });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadi.");
  const dosyaYolu = path.join(__dirname, "..", "uploads", "musteriler", dosya.dosya_adi);
  if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu);
  await prisma.musteriDosya.delete({ where: { id: dosya.id } });
  res.json({ basarili: true, mesaj: "Dosya basariyla silindi." });
}));

module.exports = router;
