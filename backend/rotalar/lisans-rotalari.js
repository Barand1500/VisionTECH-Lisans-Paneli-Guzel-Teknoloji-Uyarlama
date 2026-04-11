const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");

function rastgeleLisansAnahtari() {
  const karakterler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const gruplar = [];
  for (let g = 0; g < 4; g++) {
    let grup = "";
    for (let i = 0; i < 4; i++) {
      grup += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
    }
    gruplar.push(grup);
  }
  return "GT-" + gruplar.join("-");
}

/* ---- Tum Lisanslar (bayi_id filtresi destekli) ---- */
router.get("/", hataYakala(async (req, res) => {
  const { bayi_id } = req.query;
  let whereClause = "WHERE l.silinme_tarihi IS NULL";
  const params = [];
  
  if (bayi_id) {
    whereClause += " AND l.bayi_id = ?";
    params.push(Number(bayi_id));
  }
  
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, m.ad_soyad AS musteri_adi, m.sirket_adi, m.tur AS musteri_turu,
           u.ad AS urun_adi, u.sablon_id, p.ad AS paket_adi, b.ad AS bayi_adi,
           lt.ad AS lisans_tipi_adi, lt.renk AS lisans_tipi_renk, lt.gun AS lisans_tipi_gun
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    LEFT JOIN lisans_tipleri lt ON l.lisans_tipi = lt.kod
    ${whereClause}
    ORDER BY l.id DESC
  `, ...params);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Musteriye Ait Lisanslar ---- */
router.get("/musteri/:musteriId", hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, u.ad AS urun_adi, u.sablon_id, p.ad AS paket_adi, b.ad AS bayi_adi,
           lt.ad AS lisans_tipi_adi, lt.renk AS lisans_tipi_renk, lt.gun AS lisans_tipi_gun
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    LEFT JOIN lisans_tipleri lt ON l.lisans_tipi = lt.kod
    WHERE l.musteri_id = ?
    AND l.silinme_tarihi IS NULL
    ORDER BY l.id DESC
  `, musteriId);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Bayinin Lisansları ---- */
router.get("/bayi/:bayiId", hataYakala(async (req, res) => {
  const bayiId = Number(req.params.bayiId);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.*, u.ad AS urun_adi, u.sablon_id, p.ad AS paket_adi, m.ad_soyad AS musteri_adi,
           m.sirket_adi, lt.ad AS lisans_tipi_adi, lt.renk AS lisans_tipi_renk, lt.gun AS lisans_tipi_gun
    FROM lisanslar l
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN lisans_tipleri lt ON l.lisans_tipi = lt.kod
    WHERE l.bayi_id = ?
    AND l.silinme_tarihi IS NULL
    ORDER BY l.id DESC
  `, bayiId);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Tek Lisans ---- */
router.get("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await prisma.$queryRawUnsafe(`
    SELECT l.*, m.ad_soyad AS musteri_adi, m.sirket_adi, m.tur AS musteri_turu,
           u.ad AS urun_adi, p.ad AS paket_adi, b.ad AS bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.id = ?
    AND l.silinme_tarihi IS NULL
  `, id);
  if (!row) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  res.json({ basarili: true, veri: temizle(row) });
}));

/* ---- Lisans Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const {
    musteri_id, urun_id, paket_id, bayi_id, lisans_tipi, baslangic_tarihi, bitis_tarihi,
    kullanim_gunu, durum, domain, fatura_no, fatura_tarihi, fatura_geldi,
    fiyat, indirim_orani, indirim_tutari, net_tutar,
    odeme_yontemi, odeme_durumu, odenen_tutar, kullanici_sayisi, ek_kullanici,
    mac_adresi, ip_adresi, moduller, sablon_verileri, otomatik_yenileme, bildirim_gun, notlar,
    suresiz
  } = req.body;

  if (!musteri_id) return dogrulamaHatasi(res, "Musteri zorunludur.");
  if (!baslangic_tarihi) return dogrulamaHatasi(res, "Baslangic tarihi zorunludur.");
  if (!suresiz && !bitis_tarihi) return dogrulamaHatasi(res, "Bitis tarihi zorunludur (suresiz degilse).");

  /* FK varlık kontrolleri */
  if (urun_id) {
    const urunVar = await prisma.urun.findUnique({ where: { id: Number(urun_id) }, select: { id: true } });
    if (!urunVar) return dogrulamaHatasi(res, "Belirtilen urun bulunamadi.");
  }
  if (paket_id) {
    const paketVar = await prisma.paket.findUnique({ where: { id: Number(paket_id) }, select: { id: true } });
    if (!paketVar) return dogrulamaHatasi(res, "Belirtilen paket bulunamadi.");
  }
  if (bayi_id) {
    const bayiVar = await prisma.bayi.findUnique({ where: { id: Number(bayi_id) }, select: { id: true } });
    if (!bayiVar) return dogrulamaHatasi(res, "Belirtilen bayi bulunamadi.");
  }

  const brut = Number(fiyat) || 0;
  const indOran = Number(indirim_orani) || 0;
  const indTutar = Number(indirim_tutari) || 0;
  const hesaplananNet = Math.max(0, net_tutar !== undefined ? Number(net_tutar) : brut - (brut * indOran / 100) - indTutar);

  /* Şablon verilerini moduller alanına birleştir */
  let birlesikModuller = moduller || {};
  if (sablon_verileri && typeof sablon_verileri === "object") {
    birlesikModuller = { ...birlesikModuller, sablon_verileri };
  }

  const sonuc = await prisma.lisans.create({
    data: {
      musteri_id: Number(musteri_id),
      urun_id: urun_id ? Number(urun_id) : null,
      paket_id: paket_id ? Number(paket_id) : null,
      bayi_id: bayi_id ? Number(bayi_id) : null,
      lisans_anahtari: rastgeleLisansAnahtari(),
      lisans_tipi: lisans_tipi || "standart",
      suresiz: suresiz ? 1 : 0,
      baslangic_tarihi: new Date(baslangic_tarihi),
      bitis_tarihi: suresiz ? null : new Date(bitis_tarihi),
      kullanim_gunu: suresiz ? 0 : (Number(kullanim_gunu) || 365),
      durum: durum || "aktif",
      domain: domain || null,
      fatura_no: fatura_no || null,
      fatura_tarihi: fatura_tarihi ? new Date(fatura_tarihi) : null,
      fatura_geldi: fatura_geldi ? 1 : 0,
      fiyat: brut,
      indirim_orani: indOran,
      indirim_tutari: indTutar,
      net_tutar: hesaplananNet,
      odeme_yontemi: odeme_yontemi || null,
      odeme_durumu: odeme_durumu || "odenmedi",
      odenen_tutar: Number(odenen_tutar) || 0,
      kullanici_sayisi: Number(kullanici_sayisi) || 1,
      ek_kullanici: Number(ek_kullanici) || 0,
      mac_adresi: mac_adresi || null,
      ip_adresi: ip_adresi || null,
      moduller: Object.keys(birlesikModuller).length > 0 ? birlesikModuller : undefined,
      otomatik_yenileme: otomatik_yenileme ? 1 : 0,
      bildirim_gun: Number(bildirim_gun) || 30,
      notlar: notlar || null,
    },
  });
  res.status(201).json({ basarili: true, mesaj: "Lisans basariyla eklendi.", id: sonuc.id, lisans_anahtari: sonuc.lisans_anahtari });
}));

/* ---- Lisans Guncelle ---- */
router.put("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisans.findUnique({ where: { id }, select: { id: true, moduller: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const {
    musteri_id, urun_id, paket_id, bayi_id, lisans_tipi, baslangic_tarihi, bitis_tarihi,
    kullanim_gunu, durum, domain, fatura_no, fatura_tarihi, fatura_geldi,
    fiyat, indirim_orani, indirim_tutari, net_tutar,
    odeme_yontemi, odeme_durumu, odenen_tutar, kullanici_sayisi, ek_kullanici,
    mac_adresi, ip_adresi, moduller, sablon_verileri, otomatik_yenileme, bildirim_gun, notlar,
    suresiz
  } = req.body;

  const data = { guncelleme_tarihi: new Date() };
  if (musteri_id !== undefined) data.musteri_id = Number(musteri_id);
  if (urun_id !== undefined) data.urun_id = urun_id ? Number(urun_id) : null;
  if (paket_id !== undefined) data.paket_id = paket_id ? Number(paket_id) : null;
  if (bayi_id !== undefined) data.bayi_id = bayi_id ? Number(bayi_id) : null;
  if (lisans_tipi !== undefined) data.lisans_tipi = lisans_tipi;
  if (suresiz !== undefined) {
    data.suresiz = suresiz ? 1 : 0;
    if (suresiz) {
      data.bitis_tarihi = null;
      data.kullanim_gunu = 0;
    }
  }
  if (baslangic_tarihi !== undefined) data.baslangic_tarihi = new Date(baslangic_tarihi);
  if (bitis_tarihi !== undefined && !data.suresiz) data.bitis_tarihi = bitis_tarihi ? new Date(bitis_tarihi) : null;
  if (kullanim_gunu !== undefined && !data.suresiz) data.kullanim_gunu = Number(kullanim_gunu) || 0;
  if (durum !== undefined) data.durum = durum;
  if (domain !== undefined) data.domain = domain || null;
  if (fatura_no !== undefined) data.fatura_no = fatura_no || null;
  if (fatura_tarihi !== undefined) data.fatura_tarihi = fatura_tarihi ? new Date(fatura_tarihi) : null;
  if (fatura_geldi !== undefined) data.fatura_geldi = fatura_geldi ? 1 : 0;
  if (odeme_yontemi !== undefined) data.odeme_yontemi = odeme_yontemi || null;
  if (odeme_durumu !== undefined) data.odeme_durumu = odeme_durumu;
  if (odenen_tutar !== undefined) data.odenen_tutar = Number(odenen_tutar) || 0;
  if (kullanici_sayisi !== undefined) data.kullanici_sayisi = Number(kullanici_sayisi) || 1;
  if (ek_kullanici !== undefined) data.ek_kullanici = Number(ek_kullanici) || 0;
  if (mac_adresi !== undefined) data.mac_adresi = mac_adresi || null;
  if (ip_adresi !== undefined) data.ip_adresi = ip_adresi || null;
  if (otomatik_yenileme !== undefined) data.otomatik_yenileme = otomatik_yenileme ? 1 : 0;
  if (bildirim_gun !== undefined) data.bildirim_gun = Number(bildirim_gun) || 30;
  if (notlar !== undefined) data.notlar = notlar || null;

  /* Şablon verilerini moduller alanına birleştir */
  if (moduller !== undefined || sablon_verileri !== undefined) {
    let birlesikModuller = mevcut.moduller || {};
    if (moduller !== undefined) birlesikModuller = { ...birlesikModuller, ...moduller };
    if (sablon_verileri !== undefined && typeof sablon_verileri === "object") {
      birlesikModuller = { ...birlesikModuller, sablon_verileri };
    }
    data.moduller = Object.keys(birlesikModuller).length > 0 ? birlesikModuller : null;
  }

  /* Fiyat hesapla */
  if (fiyat !== undefined || indirim_orani !== undefined || indirim_tutari !== undefined || net_tutar !== undefined) {
    const brut = fiyat !== undefined ? Number(fiyat) : undefined;
    const indOran = indirim_orani !== undefined ? Number(indirim_orani) : undefined;
    const indTutar = indirim_tutari !== undefined ? Number(indirim_tutari) : undefined;

    if (brut !== undefined) data.fiyat = brut;
    if (indOran !== undefined) data.indirim_orani = indOran;
    if (indTutar !== undefined) data.indirim_tutari = indTutar;

    if (net_tutar !== undefined) {
      data.net_tutar = Math.max(0, Number(net_tutar));
    } else if (brut !== undefined) {
      data.net_tutar = Math.max(0, brut - (brut * (indOran || 0) / 100) - (indTutar || 0));
    }
  }

  await prisma.lisans.update({ where: { id }, data });
  res.json({ basarili: true, mesaj: "Lisans basariyla guncellendi." });
}));

/* ---- Lisans Sil ---- */
router.delete("/:id", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisans.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  await prisma.lisans.update({ where: { id }, data: { silinme_tarihi: new Date(), durum: "silindi" } });
  res.json({ basarili: true, mesaj: "Lisans basariyla silindi." });
}));

/* ---- Yeni Anahtar Uret ---- */
router.put("/:id/yeni-anahtar", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const mevcut = await prisma.lisans.findUnique({ where: { id }, select: { id: true } });
  if (!mevcut) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const yeniAnahtar = rastgeleLisansAnahtari();
  await prisma.lisans.update({ where: { id }, data: { lisans_anahtari: yeniAnahtar, guncelleme_tarihi: new Date() } });
  res.json({ basarili: true, mesaj: "Yeni lisans anahtari uretildi.", lisans_anahtari: yeniAnahtar });
}));

/* ---- Toplu Durum Guncelle ---- */
router.put("/durum-guncelle", hataYakala(async (_req, res) => {
  await prisma.$executeRawUnsafe(`UPDATE lisanslar SET durum = 'suresi-dolmus' WHERE bitis_tarihi < CURDATE() AND bitis_tarihi IS NOT NULL AND suresiz = 0 AND durum = 'aktif' AND silinme_tarihi IS NULL`);
  await prisma.$executeRawUnsafe(`UPDATE lisanslar SET durum = 'aktif' WHERE baslangic_tarihi <= CURDATE() AND (bitis_tarihi >= CURDATE() OR suresiz = 1) AND durum = 'suresi-dolmus' AND silinme_tarihi IS NULL`);
  res.json({ basarili: true, mesaj: "Lisans durumlari guncellendi." });
}));

/* ---- Lisans Detay (Bilgi modalı) ---- */
router.get("/:id/detay", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await prisma.$queryRawUnsafe(`
    SELECT l.*,
           m.ad_soyad AS musteri_adi, m.sirket_adi AS musteri_sirket, m.tur AS musteri_turu, m.eposta AS musteri_eposta,
           u.ad AS urun_adi, u.urun_tipi, u.uygulama_tipi, u.versiyon, u.sablon_id,
           ug.ad AS grup_adi,
           p.ad AS paket_adi, p.tipi AS paket_tipi, p.kullanim_gunu AS paket_gun,
           b.ad AS bayi_adi, b.eposta AS bayi_eposta,
           lt.ad AS lisans_tipi_adi, lt.renk AS lisans_tipi_renk,
           s.surum AS surum_no, s.tarih AS surum_tarihi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN urun_gruplari ug ON u.grup_id = ug.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    LEFT JOIN lisans_tipleri lt ON l.lisans_tipi = lt.kod
    LEFT JOIN surumler s ON l.surum_id = s.id
    WHERE l.id = ?
  `, id);
  if (!row) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  /* Şablon özelliklerini yükle */
  let sablonOzellikleri = [];
  if (row.sablon_id) {
    sablonOzellikleri = await prisma.sablonOzellik.findMany({
      where: { sablon_id: Number(row.sablon_id), aktif: 1 },
      orderBy: { sira: "asc" },
    });
  }

  res.json({ basarili: true, veri: { ...temizle([row])[0], sablon_ozellikleri: temizle(sablonOzellikleri) } });
}));

/* ---- Lisans Transfer (Genel — domain olsun olmasın) ---- */
router.post("/:id/transfer", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { hedef_musteri_id, hedef_bayi_id, sure_secim, yeni_gun } = req.body;
  // sure_secim: "mevcut" (kalan gün ile devam) veya "yeni" (yeni gün sayısı)

  if (!hedef_musteri_id) return dogrulamaHatasi(res, "Hedef müşteri zorunludur.");
  if (sure_secim === "yeni" && (!yeni_gun || Number(yeni_gun) < 1)) return dogrulamaHatasi(res, "Yeni süre en az 1 gün olmalıdır.");

  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi veya silinmiş.");
  if (lisans.durum === "iptal") return dogrulamaHatasi(res, "İptal edilmiş lisans transfer edilemez.");
  if (Number(hedef_musteri_id) === lisans.musteri_id) return dogrulamaHatasi(res, "Aynı müşteriye transfer yapılamaz.");

  const hedefMusteri = await prisma.musteri.findFirst({ where: { id: Number(hedef_musteri_id), silinme_tarihi: null } });
  if (!hedefMusteri) return bulunamadiHatasi(res, "Hedef müşteri bulunamadı.");

  /* Eski müşteri adını al */
  const eskiMusteri = await prisma.musteri.findUnique({ where: { id: lisans.musteri_id }, select: { ad_soyad: true, sirket_adi: true } });
  const eskiMusteriAd = eskiMusteri?.ad_soyad || eskiMusteri?.sirket_adi || `#${lisans.musteri_id}`;
  const hedefMusteriAd = hedefMusteri.ad_soyad || hedefMusteri.sirket_adi || `#${hedefMusteri.id}`;

  await prisma.$transaction(async (tx) => {
    /* Transfer logunu moduller alanına yaz */
    const moduller = lisans.moduller || {};
    const transferLog = moduller.transfer_gecmisi || [];
    transferLog.push({
      tarih: new Date().toISOString(),
      eski_musteri_id: lisans.musteri_id,
      eski_musteri_ad: eskiMusteriAd,
      eski_bayi_id: lisans.bayi_id,
      yeni_musteri_id: Number(hedef_musteri_id),
      yeni_musteri_ad: hedefMusteriAd,
      yeni_bayi_id: hedef_bayi_id ? Number(hedef_bayi_id) : null,
      sure_secim: sure_secim || "mevcut",
    });

    const updateData = {
      musteri_id: Number(hedef_musteri_id),
      moduller: { ...moduller, transfer_gecmisi: transferLog },
      guncelleme_tarihi: new Date(),
    };
    if (hedef_bayi_id !== undefined) {
      updateData.bayi_id = hedef_bayi_id ? Number(hedef_bayi_id) : null;
    }

    /* Süre hesabı */
    if (sure_secim === "yeni") {
      const bugun = new Date();
      bugun.setHours(0, 0, 0, 0);
      const yeniBitis = new Date(bugun);
      yeniBitis.setDate(yeniBitis.getDate() + Number(yeni_gun));
      updateData.baslangic_tarihi = bugun;
      updateData.bitis_tarihi = yeniBitis;
      updateData.kullanim_gunu = Number(yeni_gun);
      updateData.suresiz = 0;
    }
    /* "mevcut" seçilmişse tarihler olduğu gibi kalır */

    /* Eğer durdurulmuş veya askıdaysa aktif yap */
    if (lisans.durum === "durduruldu" || lisans.durum === "askida") {
      updateData.durum = "aktif";
    }

    await tx.lisans.update({ where: { id }, data: updateData });

    await tx.aktiviteLog.create({
      data: {
        tip: "lisans_transfer",
        mesaj: `Lisans #${id} transfer edildi: ${eskiMusteriAd} → ${hedefMusteriAd}`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({
    basarili: true,
    mesaj: `Lisans başarıyla ${hedefMusteriAd} müşterisine transfer edildi.`,
    hedef_musteri_id: Number(hedef_musteri_id),
    hedef_musteri_ad: hedefMusteriAd,
  });
}));

/* ---- Domain Transfer (eski endpoint, geriye uyumluluk) ---- */
router.post("/:id/domain-transfer", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { hedef_musteri_id, hedef_bayi_id } = req.body;

  if (!hedef_musteri_id) return dogrulamaHatasi(res, "Hedef müşteri zorunludur.");

  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  if (!lisans.domain) return dogrulamaHatasi(res, "Bu lisansta domain bilgisi bulunmuyor.");
  if (Number(hedef_musteri_id) === lisans.musteri_id) return dogrulamaHatasi(res, "Aynı müşteriye transfer yapılamaz.");

  const hedefMusteri = await prisma.musteri.findFirst({ where: { id: Number(hedef_musteri_id), silinme_tarihi: null } });
  if (!hedefMusteri) return bulunamadiHatasi(res, "Hedef müşteri bulunamadı.");

  const eskiMusteri = await prisma.musteri.findUnique({ where: { id: lisans.musteri_id }, select: { ad_soyad: true, sirket_adi: true } });
  const eskiMusteriAd = eskiMusteri?.ad_soyad || eskiMusteri?.sirket_adi || `#${lisans.musteri_id}`;
  const hedefMusteriAd = hedefMusteri.ad_soyad || hedefMusteri.sirket_adi || `#${hedefMusteri.id}`;

  await prisma.$transaction(async (tx) => {
    const moduller = lisans.moduller || {};
    const transferLog = moduller.transfer_gecmisi || [];
    transferLog.push({
      tarih: new Date().toISOString(),
      eski_musteri_id: lisans.musteri_id,
      eski_musteri_ad: eskiMusteriAd,
      eski_bayi_id: lisans.bayi_id,
      yeni_musteri_id: Number(hedef_musteri_id),
      yeni_musteri_ad: hedefMusteriAd,
      yeni_bayi_id: hedef_bayi_id ? Number(hedef_bayi_id) : null,
    });

    const updateData = {
      musteri_id: Number(hedef_musteri_id),
      moduller: { ...moduller, transfer_gecmisi: transferLog },
      guncelleme_tarihi: new Date(),
    };
    if (hedef_bayi_id !== undefined) updateData.bayi_id = hedef_bayi_id ? Number(hedef_bayi_id) : null;

    await tx.lisans.update({ where: { id }, data: updateData });
    await tx.aktiviteLog.create({
      data: {
        tip: "domain_transfer",
        mesaj: `Domain "${lisans.domain}" transferi: ${eskiMusteriAd} → ${hedefMusteriAd}`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({ basarili: true, mesaj: `Domain "${lisans.domain}" başarıyla transfer edildi.` });
}));

/* ---- Domain Geri Al ---- */
router.post("/:id/domain-geri-al", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null }, select: { id: true, domain: true, musteri_id: true, bayi_id: true, moduller: true } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi.");

  const moduller = lisans.moduller || {};
  const transferLog = moduller.transfer_gecmisi || [];
  if (transferLog.length === 0) return dogrulamaHatasi(res, "Bu lisansta transfer geçmişi bulunamadı.");

  const sonTransfer = transferLog[transferLog.length - 1];
  const eskiMusteri = await prisma.musteri.findFirst({ where: { id: sonTransfer.eski_musteri_id, silinme_tarihi: null } });
  if (!eskiMusteri) return dogrulamaHatasi(res, "Önceki müşteri silinmiş veya bulunamadı.");

  await prisma.$transaction(async (tx) => {
    transferLog.push({
      tarih: new Date().toISOString(),
      eski_musteri_id: lisans.musteri_id,
      eski_musteri_ad: sonTransfer.yeni_musteri_ad || `#${lisans.musteri_id}`,
      eski_bayi_id: lisans.bayi_id,
      yeni_musteri_id: sonTransfer.eski_musteri_id,
      yeni_musteri_ad: sonTransfer.eski_musteri_ad || `#${sonTransfer.eski_musteri_id}`,
      yeni_bayi_id: sonTransfer.eski_bayi_id,
      geri_alma: true,
    });

    await tx.lisans.update({
      where: { id },
      data: {
        musteri_id: sonTransfer.eski_musteri_id,
        bayi_id: sonTransfer.eski_bayi_id,
        moduller: { ...moduller, transfer_gecmisi: transferLog },
        guncelleme_tarihi: new Date(),
      },
    });
    await tx.aktiviteLog.create({
      data: {
        tip: "domain_geri_alma",
        mesaj: `Domain "${lisans.domain}" geri alındı. Müşteri #${lisans.musteri_id} → #${sonTransfer.eski_musteri_id}`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({ basarili: true, mesaj: `Domain "${lisans.domain}" başarıyla geri alındı.` });
}));

/* ---- Lisans Durdur (Pause) ---- */
router.post("/:id/durdur", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  if (lisans.durum !== "aktif") return dogrulamaHatasi(res, "Sadece aktif lisanslar durdurulabilir.");

  /* Kalan günü hesapla ve kaydet */
  let kalanGun = 0;
  if (!lisans.suresiz && lisans.bitis_tarihi) {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const bitis = new Date(lisans.bitis_tarihi);
    bitis.setHours(0, 0, 0, 0);
    kalanGun = Math.max(0, Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24)));
  }

  const moduller = lisans.moduller || {};

  await prisma.$transaction(async (tx) => {
    await tx.lisans.update({
      where: { id },
      data: {
        durum: "durduruldu",
        moduller: {
          ...moduller,
          durdurma_tarihi: new Date().toISOString(),
          kalan_gun: kalanGun,
        },
        guncelleme_tarihi: new Date(),
      },
    });
    await tx.aktiviteLog.create({
      data: {
        tip: "lisans_durdur",
        mesaj: `Lisans #${id} durduruldu. Kalan gün: ${kalanGun}`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({ basarili: true, mesaj: `Lisans durduruldu. Kalan gün: ${kalanGun}` });
}));

/* ---- Lisans Devam Ettir (Resume) ---- */
router.post("/:id/devam-ettir", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  if (lisans.durum !== "durduruldu") return dogrulamaHatasi(res, "Bu lisans durdurulmuş durumda değil.");

  const moduller = lisans.moduller || {};
  const kalanGun = moduller.kalan_gun || 0;

  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  const updateData = {
    durum: "aktif",
    baslangic_tarihi: bugun,
    guncelleme_tarihi: new Date(),
  };

  if (lisans.suresiz) {
    updateData.bitis_tarihi = null;
  } else {
    const yeniBitis = new Date(bugun);
    yeniBitis.setDate(yeniBitis.getDate() + kalanGun);
    updateData.bitis_tarihi = yeniBitis;
    updateData.kullanim_gunu = kalanGun;
  }

  /* moduller'den durdurma bilgisini temizle */
  const { durdurma_tarihi, kalan_gun, ...kalanModuller } = moduller;
  updateData.moduller = Object.keys(kalanModuller).length > 0 ? kalanModuller : null;

  await prisma.$transaction(async (tx) => {
    await tx.lisans.update({ where: { id }, data: updateData });
    await tx.aktiviteLog.create({
      data: {
        tip: "lisans_devam",
        mesaj: `Lisans #${id} devam ettirildi. Kalan gün: ${kalanGun}`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({ basarili: true, mesaj: `Lisans devam ettirildi. Kalan ${kalanGun} gün ile devam ediyor.` });
}));

/* ---- Lisans Askıya Al (Suspend) ---- */
router.post("/:id/askiya-al", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const { tip, sure_gun } = req.body || {};
  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  if (lisans.durum === "iptal" || lisans.durum === "silindi") return dogrulamaHatasi(res, "İptal edilmiş veya silinmiş lisans askıya alınamaz.");
  if (lisans.durum === "askida") return dogrulamaHatasi(res, "Lisans zaten askıda.");

  const moduller = lisans.moduller || {};

  /* Kalan günü hesapla (askıdan aktif edilince kullanılır) */
  let kalanGun = 0;
  if (!lisans.suresiz && lisans.bitis_tarihi) {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const bitis = new Date(lisans.bitis_tarihi);
    bitis.setHours(0, 0, 0, 0);
    kalanGun = Math.max(0, Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24)));
  }

  const askiyaBilgi = {
    askiya_alma_tarihi: new Date().toISOString(),
    askida_kalan_gun: kalanGun,
    askiya_tip: tip || "belirsiz",
  };
  if (tip === "sureli" && sure_gun) {
    askiyaBilgi.askiya_sure_gun = Number(sure_gun);
    const bitisTarihi = new Date();
    bitisTarihi.setDate(bitisTarihi.getDate() + Number(sure_gun));
    askiyaBilgi.askiya_bitis_tarihi = bitisTarihi.toISOString();
  }

  await prisma.$transaction(async (tx) => {
    await tx.lisans.update({
      where: { id },
      data: {
        durum: "askida",
        moduller: { ...moduller, ...askiyaBilgi },
        guncelleme_tarihi: new Date(),
      },
    });
    await tx.aktiviteLog.create({
      data: {
        tip: "lisans_askiya_al",
        mesaj: `Lisans #${id} askıya alındı. ${tip === "sureli" ? `(${sure_gun} gün)` : "(belirsiz süre)"}`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({ basarili: true, mesaj: tip === "sureli" ? `Lisans ${sure_gun} gün süreyle askıya alındı.` : "Lisans askıya alındı." });
}));

/* ---- Lisans Askıdan Aktif Et ---- */
router.post("/:id/aktif-et", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  if (lisans.durum !== "askida") return dogrulamaHatasi(res, "Bu lisans askıda değil.");

  const moduller = lisans.moduller || {};
  const kalanGun = moduller.askida_kalan_gun || 0;

  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  const updateData = {
    durum: "aktif",
    baslangic_tarihi: bugun,
    guncelleme_tarihi: new Date(),
  };

  if (lisans.suresiz) {
    updateData.bitis_tarihi = null;
  } else {
    const yeniBitis = new Date(bugun);
    yeniBitis.setDate(yeniBitis.getDate() + kalanGun);
    updateData.bitis_tarihi = yeniBitis;
    updateData.kullanim_gunu = kalanGun;
  }

  /* moduller'den askıya alma bilgisini temizle */
  const { askiya_alma_tarihi, askida_kalan_gun, ...kalanModuller } = moduller;
  updateData.moduller = Object.keys(kalanModuller).length > 0 ? kalanModuller : null;

  await prisma.$transaction(async (tx) => {
    await tx.lisans.update({ where: { id }, data: updateData });
    await tx.aktiviteLog.create({
      data: {
        tip: "lisans_aktif_et",
        mesaj: `Lisans #${id} askıdan aktif edildi.`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({ basarili: true, mesaj: "Lisans aktif edildi." });
}));

/* ---- Lisans İptal Et ---- */
router.post("/:id/iptal", hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const lisans = await prisma.lisans.findFirst({ where: { id, silinme_tarihi: null } });
  if (!lisans) return bulunamadiHatasi(res, "Lisans bulunamadi.");
  if (lisans.durum === "iptal" || lisans.durum === "silindi") return dogrulamaHatasi(res, "Lisans zaten iptal/silinmiş durumda.");

  const moduller = lisans.moduller || {};

  /* İade bilgisi hesapla */
  let iadeBilgi = null;
  const sablonVerileri = moduller.sablon_verileri || {};
  const iptalIadeOrani = sablonVerileri.iptal_iade_orani ? Number(sablonVerileri.iptal_iade_orani) : 0;
  if (iptalIadeOrani > 0 && lisans.net_tutar) {
    iadeBilgi = {
      oran: iptalIadeOrani,
      tutar: (Number(lisans.net_tutar) * iptalIadeOrani / 100).toFixed(2),
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.lisans.update({
      where: { id },
      data: {
        durum: "iptal",
        silinme_tarihi: new Date(),
        moduller: {
          ...moduller,
          iptal_tarihi: new Date().toISOString(),
          iptal_iade: iadeBilgi,
        },
        guncelleme_tarihi: new Date(),
      },
    });
    await tx.aktiviteLog.create({
      data: {
        tip: "lisans_iptal",
        mesaj: `Lisans #${id} iptal edildi.${iadeBilgi ? ` İade: %${iadeBilgi.oran} (${iadeBilgi.tutar} TL)` : ""}`,
        kullanici_id: req.kullanici?.id || null,
      },
    });
  });

  res.json({
    basarili: true,
    mesaj: "Lisans iptal edildi.",
    iade: iadeBilgi,
  });
}));

module.exports = router;
