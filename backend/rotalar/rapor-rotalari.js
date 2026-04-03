const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ---- Satis Raporu ---- */
router.get("/satislar", hataYakala(async (req, res) => {
  const { baslangic, bitis } = req.query;
  let where = "";
  const params = [];
  if (baslangic) { where += " AND l.olusturma_tarihi >= ?"; params.push(baslangic); }
  if (bitis) { where += " AND l.olusturma_tarihi <= ?"; params.push(bitis); }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.lisans_anahtari, l.lisans_tipi, l.durum, l.fiyat, l.indirim_orani,
           l.indirim_tutari, l.net_tutar, l.odeme_durumu, l.odeme_yontemi, l.olusturma_tarihi,
           l.domain, l.kullanici_sayisi,
           m.ad_soyad as musteri_adi, m.sirket_adi, m.tur as musteri_turu,
           u.ad as urun_adi, p.ad as paket_adi, b.ad as bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE 1=1 ${where}
    ORDER BY l.olusturma_tarihi DESC
  `, ...params);
  /* Alan adlarını frontend'in beklediği formata dönüştür */
  const mapped = temizle(rows).map((r) => ({
    id: r.id,
    musteri: r.musteri_adi || r.sirket_adi || "-",
    urun: r.urun_adi || "-",
    paket: r.paket_adi || "-",
    domain: r.domain || "",
    kullanici: r.kullanici_sayisi ? String(r.kullanici_sayisi) : "",
    tutar: Number(r.net_tutar || 0),
    tarih: r.olusturma_tarihi ? new Date(r.olusturma_tarihi).toLocaleDateString("tr-TR") : "-",
    durum: r.odeme_durumu === 'odendi' ? 'Tamamlandı' : r.durum === 'iptal' ? 'İptal' : 'Bekliyor',
    odemeDurumu: r.odeme_durumu,
  }));
  res.json({ basarili: true, veri: mapped });
}));

/* ---- Aktif Paketler ---- */
router.get("/aktif-paketler", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.baslangic_tarihi, l.bitis_tarihi, l.kullanici_sayisi, l.domain,
           DATEDIFF(l.bitis_tarihi, CURDATE()) as kalan_gun,
           m.ad_soyad as musteri_adi, m.sirket_adi,
           u.ad as urun_adi, p.ad as paket_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    WHERE l.durum = 'aktif' AND (l.bitis_tarihi IS NULL OR l.bitis_tarihi >= CURDATE())
    ORDER BY l.bitis_tarihi ASC
  `);
  const mapped = temizle(rows).map((r) => ({
    id: r.id,
    musteri: r.musteri_adi || r.sirket_adi || "-",
    urun: r.urun_adi || "-",
    paketAdi: r.paket_adi || "-",
    baslangic: r.baslangic_tarihi ? new Date(r.baslangic_tarihi).toLocaleDateString("tr-TR") : "-",
    bitis: r.bitis_tarihi ? new Date(r.bitis_tarihi).toLocaleDateString("tr-TR") : "-",
    kalanGun: r.kalan_gun != null ? Number(r.kalan_gun) : 0,
    kullaniciSayisi: r.kullanici_sayisi ? Number(r.kullanici_sayisi) : 0,
  }));
  res.json({ basarili: true, veri: mapped });
}));

/* ---- Aktif Cihazlar ---- */
router.get("/aktif-cihazlar", hataYakala(async (_req, res) => {
  try {
    const tableCheck = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE 'aktif_cihazlar'`);
    if (tableCheck.length === 0) return res.json({ basarili: true, veri: [] });

    const rows = await prisma.$queryRawUnsafe(`
      SELECT ac.*, m.ad_soyad as musteri_adi, m.sirket_adi, u.ad as urun_adi
      FROM aktif_cihazlar ac
      LEFT JOIN musteriler m ON ac.musteri_id = m.id
      LEFT JOIN urunler u ON ac.urun_id = u.id
      ORDER BY ac.son_aktivite DESC
    `);
    const mapped = temizle(rows).map((r) => ({
      id: r.id,
      musteri: r.musteri_adi || r.sirket_adi || '-',
      bilgisayarAdi: r.bilgisayar_adi || '-',
      ipAdresi: r.ip_adresi || '-',
      islemciNo: r.islemci_no || '-',
      surum: r.surum || '-',
      aktivasyonZamani: r.aktivasyon_zamani ? new Date(r.aktivasyon_zamani).toLocaleDateString('tr-TR') : '-',
      sonBaglanti: r.son_aktivite ? new Date(r.son_aktivite).toLocaleDateString('tr-TR') : '-',
      durum: r.durum || 'Çevrimiçi',
    }));
    res.json({ basarili: true, veri: mapped });
  } catch (_) {
    res.json({ basarili: true, veri: [] });
  }
}));

/* ---- Suresi Yaklasanlar ---- */
router.get("/suresi-yaklasanlar", hataYakala(async (req, res) => {
  const gun = Number(req.query.gun) || 30;
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.lisans_anahtari, l.bitis_tarihi, l.durum, l.net_tutar,
           DATEDIFF(l.bitis_tarihi, CURDATE()) as kalan_gun,
           m.ad_soyad as musteri_adi, m.sirket_adi, u.ad as urun_adi,
           p.ad as paket_adi, b.ad as bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.durum = 'aktif' AND l.bitis_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    ORDER BY l.bitis_tarihi ASC
  `, gun);
  const mapped = temizle(rows).map((r) => ({
    id: r.id,
    musteri: r.musteri_adi || r.sirket_adi || '-',
    urun: r.urun_adi || '-',
    paket: r.paket_adi || '-',
    bitis: r.bitis_tarihi ? new Date(r.bitis_tarihi).toLocaleDateString('tr-TR') : '-',
    kalanGun: r.kalan_gun != null ? Number(r.kalan_gun) : 0,
  }));
  res.json({ basarili: true, veri: mapped });
}));

/* ---- Suresi Bitenler ---- */
router.get("/suresi-bitenler", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.lisans_anahtari, l.bitis_tarihi, l.durum, l.net_tutar,
           DATEDIFF(CURDATE(), l.bitis_tarihi) as gecen_gun,
           m.ad_soyad as musteri_adi, m.sirket_adi, u.ad as urun_adi,
           p.ad as paket_adi, b.ad as bayi_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    LEFT JOIN paketler p ON l.paket_id = p.id
    LEFT JOIN bayiler b ON l.bayi_id = b.id
    WHERE l.durum = 'suresi-dolmus'
    ORDER BY l.bitis_tarihi DESC
  `);
  const mapped = temizle(rows).map((r) => ({
    id: r.id,
    musteri: r.musteri_adi || r.sirket_adi || '-',
    urun: r.urun_adi || '-',
    paket: r.paket_adi || '-',
    bitis: r.bitis_tarihi ? new Date(r.bitis_tarihi).toLocaleDateString('tr-TR') : '-',
    gecenGun: r.gecen_gun != null ? Number(r.gecen_gun) : 0,
  }));
  res.json({ basarili: true, veri: mapped });
}));

/* ---- Tahsilat Raporu ---- */
router.get("/tahsilatlar", hataYakala(async (req, res) => {
  const { baslangic, bitis } = req.query;
  let where = "";
  const params = [];
  if (baslangic) { where += " AND l.olusturma_tarihi >= ?"; params.push(baslangic); }
  if (bitis) { where += " AND l.olusturma_tarihi <= ?"; params.push(bitis); }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.lisans_anahtari, l.fiyat, l.net_tutar, l.odenen_tutar, l.odeme_durumu,
           l.odeme_yontemi, l.fatura_no, l.fatura_tarihi, l.fatura_geldi,
           (l.net_tutar - l.odenen_tutar) as kalan_tutar,
           m.ad_soyad as musteri_adi, m.sirket_adi, u.ad as urun_adi
    FROM lisanslar l
    LEFT JOIN musteriler m ON l.musteri_id = m.id
    LEFT JOIN urunler u ON l.urun_id = u.id
    WHERE 1=1 ${where}
    ORDER BY l.olusturma_tarihi DESC
  `, ...params);
  const yontemMap = { nakit: 'Nakit', havale: 'Havale', eft: 'EFT', 'kredi-karti': 'Kredi Kartı', cek: 'Çek', senet: 'Senet' };
  const mapped = temizle(rows).map((r) => ({
    id: r.id,
    musteri: r.musteri_adi || r.sirket_adi || '-',
    faturaNo: r.fatura_no || '-',
    tutar: Number(r.net_tutar || 0),
    odemeTarihi: r.fatura_tarihi ? new Date(r.fatura_tarihi).toLocaleDateString('tr-TR') : '-',
    yontem: yontemMap[r.odeme_yontemi] || r.odeme_yontemi || 'Diğer',
    durum: r.odeme_durumu === 'odendi' ? 'Ödendi' : r.odeme_durumu === 'kismi' ? 'Kısmi' : 'Bekliyor',
  }));
  res.json({ basarili: true, veri: mapped });
}));

/* ---- Ozet Istatistikler ---- */
router.get("/ozet", hataYakala(async (_req, res) => {
  const [toplam] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as toplam_lisans,
           COALESCE(SUM(net_tutar), 0) as toplam_tutar,
           COALESCE(SUM(odenen_tutar), 0) as toplam_odenen,
           COALESCE(SUM(net_tutar - odenen_tutar), 0) as toplam_kalan,
           SUM(CASE WHEN odeme_durumu = 'odendi' THEN 1 ELSE 0 END) as odenen_adet,
           SUM(CASE WHEN odeme_durumu = 'odenmedi' THEN 1 ELSE 0 END) as odenmedi_adet,
           SUM(CASE WHEN odeme_durumu = 'kismi' THEN 1 ELSE 0 END) as kismi_adet
    FROM lisanslar
  `);
  res.json({ basarili: true, veri: temizle(toplam) });
}));

/* ---- Aylik Satis Grafigi ---- */
router.get("/aylik-satis", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT DATE_FORMAT(olusturma_tarihi, '%Y-%m') as ay,
           COUNT(*) as lisans_sayisi,
           COALESCE(SUM(net_tutar), 0) as toplam_tutar,
           COALESCE(SUM(odenen_tutar), 0) as odenen_tutar
    FROM lisanslar
    WHERE olusturma_tarihi >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY ay ORDER BY ay ASC
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Urun Dagilimi ---- */
router.get("/urun-dagilimi", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(u.ad, 'Belirtilmemis') as urun_adi, COUNT(*) as sayi,
           COALESCE(SUM(l.net_tutar), 0) as toplam_tutar
    FROM lisanslar l LEFT JOIN urunler u ON l.urun_id = u.id
    GROUP BY u.ad ORDER BY sayi DESC
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

/* ---- Bayi Satis Raporu ---- */
router.get("/bayi-satis", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT COALESCE(b.ad, 'Direkt Satis') as bayi_adi, COUNT(*) as lisans_sayisi,
           COALESCE(SUM(l.net_tutar), 0) as toplam_tutar,
           COALESCE(SUM(l.odenen_tutar), 0) as odenen_tutar
    FROM lisanslar l LEFT JOIN bayiler b ON l.bayi_id = b.id
    GROUP BY b.ad ORDER BY toplam_tutar DESC
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

module.exports = router;
