const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala, dogrulamaHatasi } = require("../yardimcilar/hata-yonetimi");

const ERISIM_API_KEY = process.env.PAKET_ERISIM_API_KEY || process.env.ERISIM_API_KEY;
const PAKET_ERISIM_AKTIF = process.env.PAKET_ERISIM_AKTIF === "true";

function metinTemizle(deger) {
  return typeof deger === "string" ? deger.trim() : "";
}

function kucukHarf(deger) {
  return metinTemizle(deger).toLocaleLowerCase("tr-TR");
}

function domainNormalize(deger) {
  const temiz = metinTemizle(deger);
  if (!temiz) return "";

  try {
    const url = temiz.includes("://") ? new URL(temiz) : new URL(`https://${temiz}`);
    return url.hostname.toLocaleLowerCase("tr-TR");
  } catch {
    return temiz
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLocaleLowerCase("tr-TR");
  }
}

function servisAnahtariKontrol(req, res, next) {
  if (!ERISIM_API_KEY) {
    return res.status(500).json({
      basarili: false,
      mesaj: "PAKET_ERISIM_API_KEY tanimli degil. Erisim servisi baslatilamadi.",
    });
  }

  const gelenAnahtar = metinTemizle(req.headers["x-api-key"] || req.headers["x-erisim-key"]);
  if (!gelenAnahtar || gelenAnahtar !== ERISIM_API_KEY) {
    return res.status(401).json({ basarili: false, mesaj: "Gecersiz servis anahtari." });
  }

  next();
}

/* ---- Musterinin Dis Sistem Izinli E-postalari ---- */
router.get("/musteri/:musteriId/izinli-epostalar", hataYakala(async (req, res) => {
  const musteriId = Number(req.params.musteriId);
  if (!musteriId) return dogrulamaHatasi(res, "Gecerli musteri ID zorunludur.");

  const musteri = await prisma.musteri.findFirst({
    where: { id: musteriId, silinme_tarihi: null },
    select: {
      id: true,
      ad_soyad: true,
      sirket_adi: true,
      eposta: true,
      iletisimKisileri: {
        where: { aktif: 1 },
        select: { id: true, ad_soyad: true, eposta: true, birincil: true },
        orderBy: [{ birincil: "desc" }, { ad_soyad: "asc" }],
      },
    },
  });

  if (!musteri) {
    return res.status(404).json({ basarili: false, mesaj: "Musteri bulunamadi." });
  }

  const epostaMap = new Map();
  const musteriEposta = kucukHarf(musteri.eposta);
  if (musteriEposta) {
    epostaMap.set(musteriEposta, {
      tip: "musteri",
      kaynak_id: musteri.id,
      ad_soyad: musteri.ad_soyad || musteri.sirket_adi || `Musteri #${musteri.id}`,
      eposta: musteri.eposta,
      birincil: true,
    });
  }

  for (const kisi of musteri.iletisimKisileri) {
    const kisiEposta = kucukHarf(kisi.eposta);
    if (!kisiEposta || epostaMap.has(kisiEposta)) continue;
    epostaMap.set(kisiEposta, {
      tip: "kisi",
      kaynak_id: kisi.id,
      ad_soyad: kisi.ad_soyad,
      eposta: kisi.eposta,
      birincil: !!kisi.birincil,
    });
  }

  res.json({
    basarili: true,
    veri: {
      musteri_id: musteri.id,
      musteri_adi: musteri.ad_soyad || musteri.sirket_adi || `Musteri #${musteri.id}`,
      epostalar: Array.from(epostaMap.values()),
    },
  });
}));

function paketKontrolAktifMi(req, res, next) {
  if (!PAKET_ERISIM_AKTIF) {
    return res.status(503).json({
      basarili: false,
      mesaj: "Paket erisim kontrolu gecici olarak kapali.",
    });
  }
  next();
}

/* ---- Dis Uygulama Paket Erisim Kontrolu ---- */
router.post("/paket-kontrol", paketKontrolAktifMi, servisAnahtariKontrol, hataYakala(async (req, res) => {
  const eposta = kucukHarf(req.body?.eposta);
  const domain = domainNormalize(req.body?.domain);
  const urunAdi = kucukHarf(req.body?.urun_adi);
  const paketAdi = kucukHarf(req.body?.paket_adi);
  const urunId = Number(req.body?.urun_id) || null;
  const paketId = Number(req.body?.paket_id) || null;

  if (!eposta && !domain) {
    return dogrulamaHatasi(res, "E-posta veya domain zorunludur.");
  }

  if (!urunAdi && !paketAdi && !urunId && !paketId && !domain) {
    return dogrulamaHatasi(res, "Urun, paket veya domain filtresinden en az biri zorunludur.");
  }

  let whereClause = `
    WHERE l.silinme_tarihi IS NULL
      AND m.silinme_tarihi IS NULL
      AND l.durum = 'aktif'
      AND m.durum = 'aktif'
      AND l.baslangic_tarihi <= CURDATE()
      AND (l.suresiz = 1 OR l.bitis_tarihi IS NULL OR l.bitis_tarihi >= CURDATE())
  `;
  const params = [];

  if (eposta) {
    whereClause += `
      AND (
        LOWER(m.eposta) = ?
        OR EXISTS (
          SELECT 1
          FROM iletisim_kisileri ik
          WHERE ik.musteri_id = m.id
            AND ik.aktif = 1
            AND LOWER(ik.eposta) = ?
        )
      )`;
    params.push(eposta, eposta);
  }

  if (domain) {
    whereClause += " AND LOWER(REPLACE(IFNULL(l.domain, ''), 'www.', '')) = ?";
    params.push(domain.replace(/^www\./, ""));
  }

  if (urunId) {
    whereClause += " AND l.urun_id = ?";
    params.push(urunId);
  }

  if (paketId) {
    whereClause += " AND l.paket_id = ?";
    params.push(paketId);
  }

  if (urunAdi) {
    whereClause += " AND LOWER(u.ad) = ?";
    params.push(urunAdi);
  }

  if (paketAdi) {
    whereClause += " AND LOWER(p.ad) = ?";
    params.push(paketAdi);
  }

  const kayitlar = await prisma.$queryRawUnsafe(`
    SELECT l.id, l.musteri_id, l.urun_id, l.paket_id, l.lisans_anahtari, l.baslangic_tarihi, l.bitis_tarihi,
           l.suresiz, l.durum, l.domain, l.kullanici_sayisi, l.ek_kullanici,
           m.ad_soyad, m.sirket_adi, m.eposta,
           u.ad AS urun_adi,
           p.ad AS paket_adi,
           (
             SELECT ik.eposta
             FROM iletisim_kisileri ik
             WHERE ik.musteri_id = m.id
               AND ik.aktif = 1
               AND LOWER(ik.eposta) = ?
             ORDER BY ik.birincil DESC, ik.id ASC
             LIMIT 1
           ) AS eslesen_kisi_eposta,
           (
             SELECT ik.ad_soyad
             FROM iletisim_kisileri ik
             WHERE ik.musteri_id = m.id
               AND ik.aktif = 1
               AND LOWER(ik.eposta) = ?
             ORDER BY ik.birincil DESC, ik.id ASC
             LIMIT 1
           ) AS eslesen_kisi_adi,
           lt.ad AS lisans_tipi_adi,
           lt.kod AS lisans_tipi_kodu
    FROM lisanslar l
    INNER JOIN musteriler m ON m.id = l.musteri_id
    LEFT JOIN urunler u ON u.id = l.urun_id
    LEFT JOIN paketler p ON p.id = l.paket_id
    LEFT JOIN lisans_tipleri lt ON lt.id = l.lisans_tipi_id
    ${whereClause}
    ORDER BY l.suresiz DESC, l.bitis_tarihi DESC, l.id DESC
    LIMIT 5
  `, eposta || "", eposta || "", ...params);

  const temizKayitlar = temizle(kayitlar);
  const erisimVar = temizKayitlar.length > 0;
  const ilkKayit = erisimVar ? temizKayitlar[0] : null;

  res.json({
    basarili: true,
    erisim_var: erisimVar,
    mesaj: erisimVar ? "Paket erisimi bulundu." : "Aktif paket erisimi bulunamadi.",
    veri: erisimVar ? {
      musteri: {
        id: ilkKayit.musteri_id,
        ad: ilkKayit.ad_soyad || ilkKayit.sirket_adi || `Musteri #${ilkKayit.musteri_id}`,
        eposta: ilkKayit.eposta || null,
      },
      giris: {
        eposta,
        eslesen_tip: ilkKayit.eslesen_kisi_eposta ? "kisi" : (ilkKayit.eposta ? "musteri" : null),
        eslesen_ad: ilkKayit.eslesen_kisi_adi || ilkKayit.ad_soyad || ilkKayit.sirket_adi || null,
      },
      lisans: ilkKayit,
      eslesen_lisanslar: temizKayitlar,
    } : null,
  });
}));

module.exports = router;