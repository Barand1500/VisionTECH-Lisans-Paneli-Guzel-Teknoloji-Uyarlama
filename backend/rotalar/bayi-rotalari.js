const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { epostaGecerliMi, tcKimlikGecerliMi, vergiNoGecerliMi, pasaportNoGecerliMi } = require("../yardimcilar/validasyon");

/* ---- Multer ayarlari ---- */
const depolama = multer.diskStorage({
  destination(req, _file, cb) {
    const klasor = path.join(__dirname, "..", "uploads", "bayiler");
    fs.mkdirSync(klasor, { recursive: true });
    cb(null, klasor);
  },
  filename(_req, file, cb) {
    const benzersiz = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, benzersiz + path.extname(file.originalname));
  },
});
const yukleme = multer({
  storage: depolama,
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

/* ---- Tum Bayileri Listele ---- */
router.get("/", hataYakala(async (_req, res) => {
  const veriler = await prisma.bayi.findMany({
    where: { silinme_tarihi: null },
    include: { sektor: { select: { ad: true } } },
    orderBy: { id: "desc" },
  });
  const sonuc = veriler.map(({ sektor, ...b }) => ({
    ...b,
    sektor_adi: sektor?.ad || null,
  }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

/* ---- Tek Bayi Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const veri = await prisma.bayi.findFirst({
    where: { id, silinme_tarihi: null },
    include: { sektor: { select: { ad: true } } },
  });
  if (!veri) return bulunamadiHatasi(res, "Bayi bulunamadi.");
  const { sektor, ...bayi } = veri;
  bayi.sektor_adi = sektor?.ad || null;
  res.json({ basarili: true, veri: temizle(bayi) });
}));

/* ---- Bayi Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  let { ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sektor_id, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi, notlar, etiketler } = req.body;
  tc_kimlik_no = tc_kimlik_no?.trim() || null;
  vergi_no = vergi_no?.trim() || null;
  pasaport_no = pasaport_no?.trim() || null;
  if (!ad) return dogrulamaHatasi(res, "Bayi adi zorunludur.");

  /* Validasyon kontrolleri */
  if (eposta && !epostaGecerliMi(eposta)) return dogrulamaHatasi(res, "Gecersiz e-posta formati.");
  if (tc_kimlik_no && !tcKimlikGecerliMi(tc_kimlik_no)) return dogrulamaHatasi(res, "Gecersiz TC kimlik numarasi.");
  if (vergi_no && !vergiNoGecerliMi(vergi_no)) return dogrulamaHatasi(res, "Vergi numarasi 10-11 haneli olmalidir.");
  if (pasaport_no && !pasaportNoGecerliMi(pasaport_no)) return dogrulamaHatasi(res, "Gecersiz pasaport numarasi formati.");

  const sonuc = await prisma.bayi.create({
    data: {
      ad, yetkili: yetkili || null, eposta: eposta || null, telefon: telefon || null,
      vergi_no: vergi_no || null, vergi_dairesi: vergi_dairesi || null,
      sektor_id: sektor_id || null, durum: durum || "aktif", tur: tur || "tuzel",
      ust_bayi_id: ust_bayi_id || null, tc_kimlik_no: tc_kimlik_no || null,
      pasaport_no: pasaport_no || null, ad_soyad: ad_soyad || null,
      sirket_adi: sirket_adi || null, notlar: notlar || null,
      etiketler: etiketler ? (typeof etiketler === 'string' ? etiketler : JSON.stringify(etiketler)) : null,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Bayi basariyla eklendi.", id: sonuc.id });
}));

/* ---- Bayi Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.bayi.findUnique({ where: { id }, select: { id: true, tc_kimlik_no: true, vergi_no: true, pasaport_no: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Bayi bulunamadi.");

  let { ad, yetkili, eposta, telefon, vergi_no, vergi_dairesi, sektor_id, durum, tur, ust_bayi_id, tc_kimlik_no, pasaport_no, ad_soyad, sirket_adi, notlar, etiketler } = req.body;
  tc_kimlik_no = tc_kimlik_no?.trim() || null;
  vergi_no = vergi_no?.trim() || null;
  pasaport_no = pasaport_no?.trim() || null;

  /* Validasyon kontrolleri (güncelleme) - sadece değişen değerleri doğrula */
  if (eposta && !epostaGecerliMi(eposta)) return dogrulamaHatasi(res, "Gecersiz e-posta formati.");
  if (tc_kimlik_no && tc_kimlik_no !== mevcut.tc_kimlik_no && !tcKimlikGecerliMi(tc_kimlik_no)) return dogrulamaHatasi(res, "Gecersiz TC kimlik numarasi.");
  if (vergi_no && vergi_no !== mevcut.vergi_no && !vergiNoGecerliMi(vergi_no)) return dogrulamaHatasi(res, "Vergi numarasi 10-11 haneli olmalidir.");
  if (pasaport_no && pasaport_no !== mevcut.pasaport_no && !pasaportNoGecerliMi(pasaport_no)) return dogrulamaHatasi(res, "Gecersiz pasaport numarasi formati.");

  await prisma.bayi.update({
    where: { id },
    data: {
      ad: ad || undefined, yetkili: yetkili !== undefined ? (yetkili || null) : undefined,
      eposta: eposta !== undefined ? (eposta || null) : undefined,
      telefon: telefon !== undefined ? (telefon || null) : undefined,
      vergi_no: vergi_no !== undefined ? (vergi_no || null) : undefined,
      vergi_dairesi: vergi_dairesi !== undefined ? (vergi_dairesi || null) : undefined,
      sektor_id: sektor_id !== undefined ? (sektor_id || null) : undefined,
      durum: durum || undefined, tur: tur || undefined,
      ust_bayi_id: ust_bayi_id !== undefined ? (ust_bayi_id || null) : undefined,
      tc_kimlik_no: tc_kimlik_no !== undefined ? (tc_kimlik_no || null) : undefined,
      pasaport_no: pasaport_no !== undefined ? (pasaport_no || null) : undefined,
      ad_soyad: ad_soyad !== undefined ? (ad_soyad || null) : undefined,
      sirket_adi: sirket_adi !== undefined ? (sirket_adi || null) : undefined,
      notlar: notlar !== undefined ? (notlar || null) : undefined,
      etiketler: etiketler !== undefined ? (etiketler ? (typeof etiketler === 'string' ? etiketler : JSON.stringify(etiketler)) : null) : undefined,
      guncelleme_tarihi: new Date(),
    },
  });
  res.json({ basarili: true, mesaj: "Bayi basariyla guncellendi." });
}));

/* ---- Bayi Sil (soft delete) ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.bayi.findFirst({ where: { id, silinme_tarihi: null } });
  if (!mevcut) return bulunamadiHatasi(res, "Bayi bulunamadi.");

  await prisma.bayi.update({ where: { id }, data: { silinme_tarihi: new Date(), durum: "pasif" } });
  res.json({ basarili: true, mesaj: "Bayi basariyla silindi." });
}));

/* ---- Bayinin Musterilerini Getir (bayi_id veya lisanslar uzerinden) ---- */
router.get("/:id/musteriler", hataYakala(async (req, res) => {
  const bayiId = Number(req.params.id);
  const musteriler = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT m.*
    FROM musteriler m
    LEFT JOIN lisanslar l ON l.musteri_id = m.id AND l.bayi_id = ?
    WHERE (m.bayi_id = ? OR l.bayi_id IS NOT NULL) AND m.silinme_tarihi IS NULL
    ORDER BY m.id DESC
  `, bayiId, bayiId);
  res.json({ basarili: true, veri: temizle(musteriler) });
}));

/* ========== DOSYA ISLEMLERI ========== */

/* ---- Dosya Listele ---- */
router.get("/:id/dosyalar", hataYakala(async (req, res) => {
  const bayi_id = Number(req.params.id);
  const dosyalar = await prisma.bayiDosya.findMany({
    where: { bayi_id },
    orderBy: { yuklenme_tarihi: "desc" },
  });
  res.json({ basarili: true, veri: temizle(dosyalar) });
}));

/* ---- Dosya Yukle ---- */
router.post("/:id/dosyalar", (req, res) => {
  yukleme.array("dosyalar", 10)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ basarili: false, mesaj: err.code === "LIMIT_FILE_SIZE" ? "Dosya boyutu 10MB sinirini asiyor." : err.message });
    }
    if (err) return res.status(400).json({ basarili: false, mesaj: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ basarili: false, mesaj: "Dosya secilmedi." });

    try {
      const bayi_id = Number(req.params.id);
      const eklenen = [];
      for (const dosya of req.files) {
        const sonuc = await prisma.bayiDosya.create({
          data: {
            bayi_id,
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
  const dosya = await prisma.bayiDosya.findFirst({
    where: { id: Number(req.params.dosyaId), bayi_id: Number(req.params.id) },
  });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadi.");

  const dosyaYolu = path.join(__dirname, "..", "uploads", "bayiler", dosya.dosya_adi);
  if (!fs.existsSync(dosyaYolu)) return bulunamadiHatasi(res, "Dosya bulunamadi.");
  res.download(dosyaYolu, dosya.orijinal_ad);
}));

/* ---- Dosya Sil ---- */
router.delete("/:id/dosyalar/:dosyaId", hataYakala(async (req, res) => {
  const dosya = await prisma.bayiDosya.findFirst({
    where: { id: Number(req.params.dosyaId), bayi_id: Number(req.params.id) },
  });
  if (!dosya) return bulunamadiHatasi(res, "Dosya bulunamadi.");

  const dosyaYolu = path.join(__dirname, "..", "uploads", "bayiler", dosya.dosya_adi);
  if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu);

  await prisma.bayiDosya.delete({ where: { id: dosya.id } });
  res.json({ basarili: true, mesaj: "Dosya basariyla silindi." });
}));

module.exports = router;
