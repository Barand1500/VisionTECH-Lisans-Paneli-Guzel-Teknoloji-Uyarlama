/* ============================================= */
/*  Guzel Teknoloji - Urun Sablon Rotalari        */
/*  CRUD: Sablon + Sablon Ozellikleri             */
/* ============================================= */

const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ============================================= */
/*  SABLONLAR                                     */
/* ============================================= */

/* ---- Tum Sablonlari Listele ---- */
router.get("/", hataYakala(async (req, res) => {
  const sablonlar = await prisma.urunSablon.findMany({
    where: { aktif: 1, silinme_tarihi: null },
    include: {
      grup: { select: { id: true, ad: true } },
      urunTipi: { select: { id: true, ad: true } },
      uygulamaTipi: { select: { id: true, ad: true } },
      ozellikler: {
        where: { aktif: 1 },
        orderBy: { sira: "asc" },
      },
      _count: { select: { urunler: true } },
    },
    orderBy: { olusturma_tarihi: "desc" },
  });

  res.json({ basarili: true, veri: temizle(sablonlar) });
}));

/* ---- Tek Sablon Getir ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const sablon = await prisma.urunSablon.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      grup: { select: { id: true, ad: true } },
      urunTipi: { select: { id: true, ad: true } },
      uygulamaTipi: { select: { id: true, ad: true } },
      ozellikler: {
        where: { aktif: 1 },
        orderBy: { sira: "asc" },
      },
    },
  });

  if (!sablon) {
    return res.status(404).json({ basarili: false, mesaj: "Sablon bulunamadi." });
  }

  res.json({ basarili: true, veri: temizle(sablon) });
}));

/* ---- Yeni Sablon Olustur ---- */
router.post("/", hataYakala(async (req, res) => {
  const { ad, aciklama, grup_id, urun_tipi_id, uygulama_tipi_id, ozellikler } = req.body;

  if (!ad) {
    return res.status(400).json({ basarili: false, mesaj: "Sablon adi zorunludur." });
  }

  const sablon = await prisma.urunSablon.create({
    data: {
      ad,
      aciklama: aciklama || null,
      grup_id: grup_id ? Number(grup_id) : null,
      urun_tipi_id: urun_tipi_id ? Number(urun_tipi_id) : null,
      uygulama_tipi_id: uygulama_tipi_id ? Number(uygulama_tipi_id) : null,
      ozellikler: ozellikler && ozellikler.length > 0
        ? {
            create: ozellikler.map((oz, i) => ({
              ozellik_tipi: oz.ozellik_tipi,
              baslik: oz.baslik || null,
              deger: oz.deger || {},
              sira: oz.sira ?? i,
              aktif: 1,
            })),
          }
        : undefined,
    },
    include: {
      ozellikler: { orderBy: { sira: "asc" } },
    },
  });

  res.status(201).json({ basarili: true, mesaj: "Sablon olusturuldu.", veri: temizle(sablon) });
}));

/* ---- Sablon Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { ad, aciklama, grup_id, urun_tipi_id, uygulama_tipi_id, aktif, ozellikler } = req.body;

  // Mevcut ozellikleri sil ve yenilerini ekle (replace strategy)
  await prisma.$transaction(async (tx) => {
    // Sablonu guncelle
    await tx.urunSablon.update({
      where: { id },
      data: {
        ad,
        aciklama: aciklama || null,
        grup_id: grup_id ? Number(grup_id) : null,
        urun_tipi_id: urun_tipi_id ? Number(urun_tipi_id) : null,
        uygulama_tipi_id: uygulama_tipi_id ? Number(uygulama_tipi_id) : null,
        aktif: aktif !== undefined ? (aktif ? 1 : 0) : undefined,
        guncelleme_tarihi: new Date(),
      },
    });

    // Eger ozellikler gonderildiyse, eskileri sil yenilerini ekle
    if (ozellikler !== undefined) {
      await tx.sablonOzellik.deleteMany({ where: { sablon_id: id } });

      if (ozellikler.length > 0) {
        await tx.sablonOzellik.createMany({
          data: ozellikler.map((oz, i) => ({
            sablon_id: id,
            ozellik_tipi: oz.ozellik_tipi,
            baslik: oz.baslik || null,
            deger: oz.deger || {},
            sira: oz.sira ?? i,
            aktif: 1,
          })),
        });
      }
    }
  });

  const guncellenmis = await prisma.urunSablon.findUnique({
    where: { id },
    include: {
      grup: { select: { id: true, ad: true } },
      urunTipi: { select: { id: true, ad: true } },
      uygulamaTipi: { select: { id: true, ad: true } },
      ozellikler: { where: { aktif: 1 }, orderBy: { sira: "asc" } },
    },
  });

  res.json({ basarili: true, mesaj: "Sablon guncellendi.", veri: temizle(guncellenmis) });
}));

/* ---- Sablon Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);

  // Sablona bagli urun var mi kontrol et
  const bagliUrun = await prisma.urun.count({ where: { sablon_id: id } });
  if (bagliUrun > 0) {
    return res.status(400).json({
      basarili: false,
      mesaj: `Bu sablona bagli ${bagliUrun} urun var. Once urunlerin sablonunu degistirin.`,
    });
  }

  await prisma.urunSablon.update({ where: { id }, data: { silinme_tarihi: new Date(), durum: "silindi", aktif: 0 } });
  res.json({ basarili: true, mesaj: "Sablon silindi." });
}));

/* ---- Sablon Klonla ---- */
router.post("/:id/klonla", hataYakala(async (req, res) => {
  const kaynak = await prisma.urunSablon.findUnique({
    where: { id: Number(req.params.id) },
    include: { ozellikler: { where: { aktif: 1 }, orderBy: { sira: "asc" } } },
  });

  if (!kaynak) {
    return res.status(404).json({ basarili: false, mesaj: "Kaynak sablon bulunamadi." });
  }

  const yeniAd = req.body.ad || `${kaynak.ad} (Kopya)`;

  const klon = await prisma.urunSablon.create({
    data: {
      ad: yeniAd,
      aciklama: kaynak.aciklama,
      grup_id: kaynak.grup_id,
      urun_tipi_id: kaynak.urun_tipi_id,
      uygulama_tipi_id: kaynak.uygulama_tipi_id,
      ozellikler: {
        create: kaynak.ozellikler.map((oz) => ({
          ozellik_tipi: oz.ozellik_tipi,
          baslik: oz.baslik,
          deger: oz.deger,
          sira: oz.sira,
          aktif: 1,
        })),
      },
    },
    include: {
      ozellikler: { orderBy: { sira: "asc" } },
    },
  });

  res.status(201).json({ basarili: true, mesaj: "Sablon klonlandi.", veri: temizle(klon) });
}));

module.exports = router;
