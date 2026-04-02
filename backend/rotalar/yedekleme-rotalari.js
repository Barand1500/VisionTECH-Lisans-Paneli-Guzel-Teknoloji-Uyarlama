/* ============================================= */
/*  Yedekleme Rotalari - Veri Yedekleme/Yukleme   */
/*  + JSON ve SQL format destegi                  */
/*  + Aktivite Log Entegrasyonu                   */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

/* ---- Tablolarin sirasi (FK bagimliliklarina gore) ---- */
const TABLO_SIRASI = [
  "roller",
  "sektorler",
  "kullanicilar",
  "musteriler",
  "musteri_telefonlari",
  "musteri_adresleri",
  "musteri_dosyalar",
  "bayiler",
  "bayi_dosyalar",
  "urun_gruplari",
  "urunler",
  "paketler",
  "lisanslar",
  "surumler",
  "notlar",
  "iletisim_kayitlari",
  "aktivite_loglari",
  "yedekleme_loglari",
];

/* ---- Token'dan kullanici bilgisi cikar (opsiyonel) ---- */
function kullaniciBilgisiAl(req) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return { id: null, eposta: null };
    const decoded = jwt.verify(token, process.env.JWT_GIZLI || "guzel-teknoloji-gizli-anahtar-2026");
    return { id: decoded.id || null, eposta: decoded.eposta || null };
  } catch { return { id: null, eposta: null }; }
}

/* ---- SQL degerini formatla ---- */
function sqlDegerFormat(deger) {
  if (deger === null || deger === undefined) return "NULL";
  if (typeof deger === "number") return deger;
  if (typeof deger === "boolean") return deger ? 1 : 0;
  if (deger instanceof Date) return `'${deger.toISOString().slice(0, 19).replace("T", " ")}'`;
  
  /* JSON objelerini veya dizileri MySQL JSON formatina cevir */
  if (typeof deger === "object") {
    const jsonStr = JSON.stringify(deger);
    /* MySQL icin JSON string'i escape et */
    return `'${jsonStr.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }
  
  /* String degerleri - JSON benzeri string'leri kontrol et */
  const str = String(deger);
  if ((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("[") && str.endsWith("]"))){    /* JSON string - ozel escape */
    return `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  }
  
  /* Normal string - standart escape */
  return `'${str.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

/* ---- JSON Yedek Al ---- */
router.get("/indir", hataYakala(async (req, res) => {
  const kullanici = kullaniciBilgisiAl(req);
  const format = req.query.format || "json";
  const yedek = { olusturma_zamani: new Date().toISOString(), format, tablolar: {} };
  let toplamKayit = 0;

  for (const tablo of TABLO_SIRASI) {
    const [satirlar] = await havuz.query(`SELECT * FROM \`${tablo}\``);
    yedek.tablolar[tablo] = satirlar;
    toplamKayit += satirlar.length;
  }

  const tarih = new Date().toISOString().slice(0, 10);
  let dosyaIcerik, dosyaAdi, contentType;

  if (format === "sql") {
    /* SQL format */
    let sqlLines = [];
    sqlLines.push(`-- Guzel Teknoloji Veritabani Yedegi`);
    sqlLines.push(`-- Olusturma: ${yedek.olusturma_zamani}`);
    sqlLines.push(`-- Toplam: ${TABLO_SIRASI.length} tablo, ${toplamKayit} kayit`);
    sqlLines.push(``);
    sqlLines.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    sqlLines.push(``);

    for (const tablo of TABLO_SIRASI) {
      const satirlar = yedek.tablolar[tablo];
      if (!satirlar || satirlar.length === 0) continue;
      
      sqlLines.push(`-- Tablo: ${tablo} (${satirlar.length} kayit)`);
      sqlLines.push(`DELETE FROM \`${tablo}\`;`);
      
      for (const satir of satirlar) {
        const sutunlar = Object.keys(satir);
        const degerler = Object.values(satir).map(d => sqlDegerFormat(d));
        sqlLines.push(`INSERT INTO \`${tablo}\` (${sutunlar.map(s => `\`${s}\``).join(", ")}) VALUES (${degerler.join(", ")});`);
      }
      sqlLines.push(``);
    }

    sqlLines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
    dosyaIcerik = sqlLines.join("\n");
    dosyaAdi = `guzel_teknoloji_yedek_${tarih}.sql`;
    contentType = "application/sql; charset=utf-8";
  } else {
    /* JSON format */
    dosyaIcerik = JSON.stringify({ basarili: true, veri: yedek }, null, 2);
    dosyaAdi = `guzel_teknoloji_yedek_${tarih}.json`;
    contentType = "application/json; charset=utf-8";
  }

  /* Yedekleme logu kaydet */
  await havuz.query(
    `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, dosya_adi, dosya_boyutu, tablo_sayisi, kayit_sayisi, durum, detay) VALUES (?, ?, 'yedek_alma', ?, ?, ?, ?, 'basarili', ?)`,
    [kullanici.id, kullanici.eposta, dosyaAdi, Buffer.byteLength(dosyaIcerik, "utf8"), TABLO_SIRASI.length, toplamKayit, `${TABLO_SIRASI.length} tablo, ${toplamKayit} kayit ${format.toUpperCase()} formatinda yedeklendi.`]
  );

  /* Aktivite logu kaydet */
  await havuz.query(
    `INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, 'yedek_alma', ?)`,
    [kullanici.id, `Veritabani yedegi alindi (${format.toUpperCase()}, ${toplamKayit} kayit)`]
  );

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename=${dosyaAdi}`);
  res.send(dosyaIcerik);
}));

/* ---- JSON Yedegi Yukle (Geri Yukleme) ---- */
router.post("/yukle", hataYakala(async (req, res) => {
  const kullanici = kullaniciBilgisiAl(req);
  
  /* Body yapisini kontrol et - hem { veri: {...} } hem de { basarili, veri: {...} } destekle */
  let veri = req.body.veri || req.body;
  
  /* Eger hala ic ice veri varsa coz */
  if (veri.veri && veri.veri.tablolar) {
    veri = veri.veri;
  }
  
  if (!veri || !veri.tablolar) {
    /* Basarisiz log */
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, durum, detay) VALUES (?, ?, 'geri_yukleme', 'basarisiz', 'Gecersiz yedek verisi formatı.')`,
      [kullanici.id, kullanici.eposta]
    );
    await havuz.query(
      `INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, 'geri_yukleme', 'Geri yukleme basarisiz: Gecersiz dosya formati')`,
      [kullanici.id]
    );
    return res.status(400).json({ basarili: false, mesaj: "Gecersiz yedek verisi. Lütfen doğru formatta bir yedek dosyası seçin." });
  }

  const baglanti = await havuz.getConnection();
  try {
    await baglanti.beginTransaction();

    /* FK kisitlamalarini gecici olarak devre disi birak */
    await baglanti.query("SET FOREIGN_KEY_CHECKS = 0");

    let yuklenenKayit = 0;
    let yuklenenTablo = 0;
    const format = veri.format || "json";
    const dosyaAdi = veri.olusturma_zamani ? `yedek_${veri.olusturma_zamani.slice(0, 10)}.${format}` : `bilinmeyen_yedek.${format}`;

    /* Ters sirada temizle (FK bagimliliklari icin) */
    for (const tablo of [...TABLO_SIRASI].reverse()) {
      if (veri.tablolar[tablo]) {
        await baglanti.query(`DELETE FROM \`${tablo}\``);
      }
    }

    /* Dogru sirada ekle */
    for (const tablo of TABLO_SIRASI) {
      const satirlar = veri.tablolar[tablo];
      if (!satirlar || satirlar.length === 0) continue;
      yuklenenTablo++;

      for (const satir of satirlar) {
        const sutunlar = Object.keys(satir);
        const degerler = Object.values(satir).map(d => {
          /* Date string'leri duzelt */
          if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}T/.test(d)) {
            return new Date(d);
          }
          return d;
        });
        const yertutucular = sutunlar.map(() => "?").join(", ");
        await baglanti.query(
          `INSERT INTO \`${tablo}\` (${sutunlar.map(s => `\`${s}\``).join(", ")}) VALUES (${yertutucular})`,
          degerler
        );
        yuklenenKayit++;
      }
    }

    /* FK kisitlamalarini tekrar etkinlestir */
    await baglanti.query("SET FOREIGN_KEY_CHECKS = 1");
    await baglanti.commit();

    /* Basarili log - yedekleme_loglari */
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, dosya_adi, tablo_sayisi, kayit_sayisi, durum, detay) VALUES (?, ?, 'geri_yukleme', ?, ?, ?, 'basarili', ?)`,
      [kullanici.id, kullanici.eposta, dosyaAdi, yuklenenTablo, yuklenenKayit, `${yuklenenTablo} tablo, ${yuklenenKayit} kayit geri yuklendi.`]
    );

    /* Aktivite logu kaydet */
    await havuz.query(
      `INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, 'geri_yukleme', ?)`,
      [kullanici.id, `Veritabani geri yuklendi (${yuklenenTablo} tablo, ${yuklenenKayit} kayit)`]
    );

    res.json({ basarili: true, mesaj: `Yedek başarıyla geri yüklendi. ${yuklenenTablo} tablo, ${yuklenenKayit} kayıt yüklendi.` });
  } catch (hata) {
    await baglanti.rollback();
    await baglanti.query("SET FOREIGN_KEY_CHECKS = 1");

    /* Basarisiz log */
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, durum, detay) VALUES (?, ?, 'geri_yukleme', 'basarisiz', ?)`,
      [kullanici.id, kullanici.eposta, hata.message?.slice(0, 500)]
    );
    await havuz.query(
      `INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, 'geri_yukleme', ?)`,
      [kullanici.id, `Geri yukleme basarisiz: ${hata.message?.slice(0, 200)}`]
    );

    throw hata;
  } finally {
    baglanti.release();
  }
}));

/* ---- SQL Yedegi Yukle ---- */
router.post("/yukle-sql", hataYakala(async (req, res) => {
  const kullanici = kullaniciBilgisiAl(req);
  const { sql } = req.body;
  
  if (!sql || typeof sql !== "string") {
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, durum, detay) VALUES (?, ?, 'geri_yukleme', 'basarisiz', 'Gecersiz SQL verisi.')`,
      [kullanici.id, kullanici.eposta]
    );
    await havuz.query(
      `INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, 'geri_yukleme', 'SQL geri yukleme basarisiz: Gecersiz dosya')`,
      [kullanici.id]
    );
    return res.status(400).json({ basarili: false, mesaj: "Gecersiz SQL dosyasi." });
  }

  const baglanti = await havuz.getConnection();
  try {
    await baglanti.beginTransaction();
    
    /* SQL satirlarini akilli bir sekilde ayir */
    /* Tek tirnak icindeki ; isaretlerini koruyarak ayir */
    const sorgular = [];
    let mevcutSorgu = "";
    let tekTirnakIcinde = false;
    
    for (let i = 0; i < sql.length; i++) {
      const karakter = sql[i];
      
      if (karakter === "'" && sql[i-1] !== "\\") {
        tekTirnakIcinde = !tekTirnakIcinde;
      }
      
      if (karakter === ";" && !tekTirnakIcinde) {
        const temizSorgu = mevcutSorgu.trim();
        if (temizSorgu.length > 0 && !temizSorgu.startsWith("--")) {
          sorgular.push(temizSorgu);
        }
        mevcutSorgu = "";
      } else {
        mevcutSorgu += karakter;
      }
    }
    
    /* Son sorgu (eger ; ile bitmiyorsa) */
    const sonSorgu = mevcutSorgu.trim();
    if (sonSorgu.length > 0 && !sonSorgu.startsWith("--")) {
      sorgular.push(sonSorgu);
    }
    
    let calistirilanSorgu = 0;
    
    for (const sorgu of sorgular) {
      /* Yorum satirlarini atla */
      if (sorgu.startsWith("--")) continue;
      /* Bos satirlari atla */
      if (!sorgu.trim()) continue;
      
      try {
        await baglanti.query(sorgu);
        calistirilanSorgu++;
      } catch (sorguHatasi) {
        console.error(`SQL Sorgu Hatasi: ${sorgu.substring(0, 100)}...`);
        console.error(`Hata: ${sorguHatasi.message}`);
        throw sorguHatasi;
      }
    }
    
    await baglanti.commit();
    
    /* Basarili log */
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, dosya_adi, tablo_sayisi, kayit_sayisi, durum, detay) VALUES (?, ?, 'geri_yukleme', 'sql_yedek.sql', ?, ?, 'basarili', ?)`,
      [kullanici.id, kullanici.eposta, TABLO_SIRASI.length, calistirilanSorgu, `${calistirilanSorgu} SQL sorgusu basariyla calistirildi.`]
    );
    await havuz.query(
      `INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, 'geri_yukleme', ?)`,
      [kullanici.id, `SQL yedegi geri yuklendi (${calistirilanSorgu} sorgu)`]
    );
    
    res.json({ basarili: true, mesaj: `SQL yedegi basariyla geri yuklendi. ${calistirilanSorgu} sorgu calistirildi.` });
  } catch (hata) {
    await baglanti.rollback();
    
    await havuz.query(
      `INSERT INTO yedekleme_loglari (kullanici_id, kullanici_eposta, islem_tipi, durum, detay) VALUES (?, ?, 'geri_yukleme', 'basarisiz', ?)`,
      [kullanici.id, kullanici.eposta, hata.message?.slice(0, 500)]
    );
    await havuz.query(
      `INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, 'geri_yukleme', ?)`,
      [kullanici.id, `SQL geri yukleme basarisiz: ${hata.message?.slice(0, 200)}`]
    );
    
    throw hata;
  } finally {
    baglanti.release();
  }
}));

/* ---- Yedekleme Log Kayitlarini Listele ---- */
router.get("/loglar", hataYakala(async (req, res) => {
  const [loglar] = await havuz.query(`
    SELECT yl.*,
      k.ad_soyad as kullanici_adi
    FROM yedekleme_loglari yl
    LEFT JOIN kullanicilar k ON yl.kullanici_id = k.id
    ORDER BY yl.tarih DESC
    LIMIT 100
  `);
  res.json({ basarili: true, veri: loglar });
}));

module.exports = router;
