require("dotenv").config();
const h = require("./veritabani/baglanti");

(async () => {
  // Roller tablosu olustur
  await h.query(`
    CREATE TABLE IF NOT EXISTS roller (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ad VARCHAR(100) NOT NULL UNIQUE,
      aciklama VARCHAR(500) DEFAULT '',
      izinler JSON NOT NULL,
      varsayilan TINYINT(1) DEFAULT 0,
      aktif TINYINT(1) DEFAULT 1,
      olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("roller tablosu olusturuldu");

  // Varsayilan rolleri ekle
  const tumIzinler = JSON.stringify(["ozet","musteriler","bayiler","yonetim","lisans_yonetimi","raporlar","takvim","aktivite_logu","yedekleme"]);
  const editorIzinler = JSON.stringify(["ozet","musteriler","bayiler","lisans_yonetimi","raporlar","takvim"]);
  const izleyiciIzinler = JSON.stringify(["ozet","raporlar","takvim"]);

  await h.query("INSERT IGNORE INTO roller (ad, aciklama, izinler, varsayilan) VALUES (?, ?, ?, 1)", ["admin", "Tam yetkili yonetici. Tum modullere erisebilir.", tumIzinler]);
  await h.query("INSERT IGNORE INTO roller (ad, aciklama, izinler, varsayilan) VALUES (?, ?, ?, 1)", ["kullanici", "Standart kullanici. Musteri, bayi, lisans ve raporlara erisebilir.", editorIzinler]);
  await h.query("INSERT IGNORE INTO roller (ad, aciklama, izinler, varsayilan) VALUES (?, ?, ?, 1)", ["izleyici", "Salt okunur erisim. Sadece ozet, raporlar ve takvimi gorebilir.", izleyiciIzinler]);
  console.log("Varsayilan roller eklendi");

  // kullanicilar.rol kolonunu VARCHAR yap (enum yerine)
  await h.query("ALTER TABLE kullanicilar MODIFY COLUMN rol VARCHAR(100) NOT NULL DEFAULT 'kullanici'");
  console.log("kullanicilar.rol kolonu VARCHAR yapildi");

  const [r] = await h.query("SELECT * FROM roller");
  console.log("Roller:", JSON.stringify(r, null, 2));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
