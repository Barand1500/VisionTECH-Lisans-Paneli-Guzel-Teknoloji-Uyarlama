const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");
const { JWT_GIZLI } = require("../yardimcilar/yetki-middleware");

/* Tablo sırası (FK uyumu icin once referans tablolar) */
const TABLO_SIRASI = [
  "roller", "sektorler", "kullanicilar",
  "musteriler", "musteri_telefonlari", "musteri_adresleri", "musteri_dosyalar",
  "bayiler", "bayi_dosyalar", "iletisim_kisileri",
  "urun_gruplari", "urun_tipleri", "uygulama_tipleri",
  "urun_sablonlari", "sablon_ozellikleri",
  "urunler", "bayi_urunler", "paketler", "paket_tipleri", "lisans_tipleri", "lisanslar",
  "surumler", "notlar", "iletisim_kayitlari", "aktivite_loglari", "yedekleme_loglari",
];

function kullaniciBilgisi(req) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return { id: null, ad: "Bilinmiyor" };
    const decoded = jwt.verify(token, JWT_GIZLI);
    return { id: decoded.id, ad: decoded.ad_soyad || decoded.kullanici_adi || "Bilinmiyor" };
  } catch (_) {
    return { id: null, ad: "Bilinmiyor" };
  }
}

/* ============================================================
   YEDEKLEME INDIR (JSON / SQL)
   ============================================================ */
router.get("/indir", hataYakala(async (req, res) => {
  const format = req.query.format || "json";
  const kullanici = kullaniciBilgisi(req);

  const yedek = {};
  for (const tablo of TABLO_SIRASI) {
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${tablo}\``);
      yedek[tablo] = temizle(rows);
    } catch (_) {
      yedek[tablo] = [];
    }
  }

  try {
    await prisma.yedeklemeLog.create({
      data: { kullanici_id: kullanici.id, islem_tipi: "yedek_alma", detay: `${kullanici.ad} tarafindan ${format.toUpperCase()} yedekleme indirildi.`, durum: "basarili" },
    });
  } catch (_) {}

  if (format === "sql") {
    let sql = `-- Guzel Teknoloji Yedekleme\n-- Tarih: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;
    for (const tablo of TABLO_SIRASI) {
      const rows = yedek[tablo];
      if (!rows || rows.length === 0) continue;
      sql += `-- ${tablo}\nDELETE FROM \`${tablo}\`;\n`;
      for (const row of rows) {
        const kolonlar = Object.keys(row).map(k => `\`${k}\``).join(", ");
        const degerler = Object.values(row).map(v => {
          if (v === null || v === undefined) return "NULL";
          if (typeof v === "boolean") return v ? 1 : 0;
          if (typeof v === "number") return v;
          if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
          if (typeof v === "object") {
            const str = JSON.stringify(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            return `'${str}'`;
          }
          const str = String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
          return `'${str}'`;
        }).join(", ");
        sql += `INSERT INTO \`${tablo}\` (${kolonlar}) VALUES (${degerler});\n`;
      }
      sql += "\n";
    }
    sql += "SET FOREIGN_KEY_CHECKS = 1;\n";

    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename=yedek_${Date.now()}.sql`);
    return res.send(sql);
  }

  /* JSON */
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=yedek_${Date.now()}.json`);
  res.json({ tarih: new Date().toISOString(), tablolar: yedek });
}));

/* ============================================================
   JSON RESTORE
   ============================================================ */
router.post("/yukle", hataYakala(async (req, res) => {
  const { tablolar } = req.body;
  if (!tablolar || typeof tablolar !== "object") {
    return res.status(400).json({ basarili: false, mesaj: "Gecersiz yedekleme verisi." });
  }

  const kullanici = kullaniciBilgisi(req);
  const sonuclar = [];

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");

      /* Önce TÜM tabloları temizle (ters sırada - FK uyumu) */
      for (const tablo of [...TABLO_SIRASI].reverse()) {
        try {
          await tx.$executeRawUnsafe(`DELETE FROM \`${tablo}\``);
        } catch (_) {}
      }

      /* Sonra verileri yükle */
      for (const tablo of TABLO_SIRASI) {
        const rows = tablolar[tablo];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        for (const row of rows) {
          const kolonlar = Object.keys(row).filter(k => {
            // Güvenlik: kolon adı sadece harf, rakam, alt çizgi içermeli
            return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k);
          });
          if (kolonlar.length === 0) continue;
          const placeholders = kolonlar.map(() => "?").join(", ");
          const values = kolonlar.map(k => {
            const v = row[k];
            if (v === null || v === undefined) return null;
            if (typeof v === "boolean") return v ? 1 : 0;
            if (typeof v === "object" && !(v instanceof Date)) return JSON.stringify(v);
            return v;
          });
          await tx.$executeRawUnsafe(
            `INSERT INTO \`${tablo}\` (${kolonlar.map(k => `\`${k}\``).join(", ")}) VALUES (${placeholders})`,
            ...values
          );
        }
        sonuclar.push({ tablo, satir: rows.length, basarili: true });
      }

      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }, { timeout: 120000 });
  } catch (e) {
    try {
      await prisma.yedeklemeLog.create({
        data: { kullanici_id: kullanici.id, islem_tipi: "geri_yukleme", detay: `JSON geri yukleme BASARISIZ: ${e.message}`, durum: "basarisiz" },
      });
    } catch (_) {}
    return res.status(500).json({ basarili: false, mesaj: `Geri yukleme basarisiz oldu, veriler geri alindi. Hata: ${e.message}`, detay: sonuclar });
  }

  try {
    await prisma.yedeklemeLog.create({
      data: { kullanici_id: kullanici.id, islem_tipi: "geri_yukleme", detay: `${kullanici.ad} tarafindan JSON geri yukleme yapildi.`, durum: "basarili" },
    });
  } catch (_) {}

  res.json({ basarili: true, mesaj: "Geri yukleme tamamlandi.", detay: sonuclar });
}));

/* ============================================================
   SQL RESTORE
   ============================================================ */
router.post("/yukle-sql", hataYakala(async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== "string") {
    return res.status(400).json({ basarili: false, mesaj: "Gecersiz SQL verisi." });
  }

  const kullanici = kullaniciBilgisi(req);

  /* Akilli noktalı virgul parcalama — string icindeki ; atlaniyor */
  const satirlar = [];
  let tampon = "";
  let stringIci = false;
  let onceki = "";
  for (const ch of sql) {
    if (ch === "'" && onceki !== "\\") stringIci = !stringIci;
    if (ch === ";" && !stringIci) {
      const t = tampon.trim();
      if (t && !t.startsWith("--")) satirlar.push(t);
      tampon = "";
    } else {
      tampon += ch;
    }
    onceki = ch;
  }
  if (tampon.trim() && !tampon.trim().startsWith("--")) satirlar.push(tampon.trim());

  let basariliSayi = 0;
  let hataSayi = 0;

  /* Güvenlik: Sadece INSERT, DELETE, SET izinli (kendi export formatimiz bunlari uretir) */
  const izinliKomutlar = /^\s*(INSERT|DELETE|SET)/i;
  /* Tablo adı beyaz listesi - INSERT INTO ve DELETE FROM ifadelerinde kontrol */
  const tabloRegex = /^\s*(?:INSERT\s+INTO|DELETE\s+FROM)\s+`?(\w+)`?/i;

  await prisma.$transaction(async (tx) => {
    for (const satir of satirlar) {
      if (!izinliKomutlar.test(satir)) {
        hataSayi++;
        continue;
      }
      const tabloMatch = satir.match(tabloRegex);
      if (tabloMatch && !TABLO_SIRASI.includes(tabloMatch[1])) {
        hataSayi++;
        continue;
      }
      try {
        await tx.$executeRawUnsafe(satir);
        basariliSayi++;
      } catch (_) {
        hataSayi++;
      }
    }
  }, { timeout: 120000 });

  try {
    await prisma.yedeklemeLog.create({
      data: { kullanici_id: kullanici.id, islem_tipi: "geri_yukleme", detay: `${kullanici.ad} tarafindan SQL geri yukleme yapildi. ${basariliSayi} basarili, ${hataSayi} hata.`, durum: "basarili" },
    });
  } catch (_) {}

  res.json({ basarili: true, mesaj: `SQL geri yukleme tamamlandi. ${basariliSayi} komut basarili, ${hataSayi} hata.` });
}));

/* ============================================================
   LOGLAR
   ============================================================ */
router.get("/loglar", hataYakala(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT yl.*, k.ad_soyad as kullanici_adi
    FROM yedekleme_loglari yl
    LEFT JOIN kullanicilar k ON yl.kullanici_id = k.id
    ORDER BY yl.id DESC
    LIMIT 50
  `);
  res.json({ basarili: true, veri: temizle(rows) });
}));

module.exports = router;
