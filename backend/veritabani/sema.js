/* ============================================= */
/*  Guzel Teknoloji - Veritabani Sema Kurulumu   */
/*                                                */
/*  Bu dosya tum veritabani tablolarini olusturur */
/*  FK, INDEX ve CONSTRAINT yapilarini icerir     */
/*                                                */
/*  Yazar: Guzel Teknoloji Ekibi                  */
/*  Son Guncelleme: 2026                          */
/* ============================================= */
/*                                                */
/*  TABLO OLUSTURMA SIRASI (FK Bagimliliklari):   */
/*   1.  roller              (bagimsiz)           */
/*   2.  sektorler           (bagimsiz)           */
/*   3.  kullanicilar        (-> roller)          */
/*   4.  musteriler          (-> sektorler)       */
/*   5.  musteri_telefonlari (-> musteriler)      */
/*   6.  musteri_adresleri   (-> musteriler)      */
/*   7.  musteri_dosyalar    (-> musteriler)      */
/*   8.  bayiler             (-> sektorler)       */
/*   9.  bayi_dosyalar       (-> bayiler)         */
/*  10.  urun_gruplari       (bagimsiz)           */
/*  11.  urunler             (-> urun_gruplari)   */
/*  12.  paketler            (-> urunler)         */
/*  13.  lisanslar           (-> musteriler,      */
/*                              urunler, paketler)*/
/*  14.  surumler            (-> urunler)         */
/*  15.  notlar              (-> musteriler,      */
/*                              kullanicilar)     */
/*  16.  iletisim_kayitlari  (-> musteriler)      */
/*  17.  aktivite_loglari    (-> kullanicilar)    */
/*  18.  yedekleme_loglari   (-> kullanicilar)    */
/* ============================================= */

const havuz = require("./baglanti");
const bcrypt = require("bcryptjs");

/* ============================================= */
/*  TABLOLARI OLUSTUR                             */
/* ============================================= */

async function tablolariOlustur() {

  /* ======================================== */
  /*  1. ROLLER (Yetki Gruplari)              */
  /*  Kullanici yetkilendirme temel tablosu   */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS roller (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      ad               VARCHAR(100)   NOT NULL UNIQUE,
      aciklama         VARCHAR(500)   NULL DEFAULT '',
      izinler          JSON           NOT NULL,
      varsayilan       TINYINT(1)     NULL DEFAULT 0,
      aktif            TINYINT(1)     NULL DEFAULT 1,
      olusturma_tarihi DATETIME       NULL DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_roller_aktif (aktif)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  2. SEKTORLER (Is Sektorleri)            */
  /*  Musteri ve bayi sektor siniflandirmasi  */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS sektorler (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      ad               VARCHAR(200)   NOT NULL UNIQUE,
      aktif            TINYINT(1)     NOT NULL DEFAULT 1,
      olusturma_tarihi DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_sektorler_aktif (aktif)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  3. KULLANICILAR (Sistem Kullanicilari)  */
  /*  Panele giris yapan kullanicilar         */
  /*  FK: roller.ad                           */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS kullanicilar (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      kullanici_adi    VARCHAR(100)   NOT NULL UNIQUE,
      sifre_hash       VARCHAR(255)   NOT NULL,
      ad_soyad         VARCHAR(255)   NOT NULL,
      eposta           VARCHAR(255)   NOT NULL UNIQUE,
      rol              VARCHAR(100)   NOT NULL DEFAULT 'kullanici',
      aktif            TINYINT(1)     NOT NULL DEFAULT 1,
      olusturma_tarihi DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
      son_giris        DATETIME       NULL,
      silinme_tarihi   DATETIME       NULL DEFAULT NULL,

      CONSTRAINT fk_kullanicilar_rol
        FOREIGN KEY (rol) REFERENCES roller(ad)
        ON UPDATE CASCADE ON DELETE RESTRICT,

      INDEX idx_kullanicilar_eposta  (eposta),
      INDEX idx_kullanicilar_rol     (rol),
      INDEX idx_kullanicilar_aktif   (aktif),
      INDEX idx_kullanicilar_silinme (silinme_tarihi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  4. MUSTERILER (Firma/Kisi Kayitlari)    */
  /*  Gercek, tuzel ve yabanci musteriler     */
  /*  FK: sektorler.id, self-ref              */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS musteriler (
      id                INT            AUTO_INCREMENT PRIMARY KEY,
      tur               ENUM('gercek','tuzel','yabanci') NOT NULL DEFAULT 'gercek',
      ad_soyad          VARCHAR(255)   NULL,
      sirket_adi        VARCHAR(255)   NULL,
      yetkili_kisi      VARCHAR(255)   NULL,
      eposta            VARCHAR(255)   NULL,
      tc_kimlik_no      VARCHAR(11)    NULL,
      vergi_no          VARCHAR(20)    NULL,
      vergi_dairesi     VARCHAR(100)   NULL,
      pasaport_no       VARCHAR(50)    NULL,
      sektor_id         INT            NULL,
      etiketler         JSON           NULL,
      durum             ENUM('aktif','pasif') NOT NULL DEFAULT 'aktif',
      ust_musteri_id    INT            NULL,
      kayit_tarihi      DATE           NOT NULL DEFAULT (CURDATE()),
      guncelleme_tarihi DATETIME       NULL ON UPDATE CURRENT_TIMESTAMP,
      silinme_tarihi    DATETIME       NULL DEFAULT NULL,

      CONSTRAINT fk_musteriler_sektor
        FOREIGN KEY (sektor_id) REFERENCES sektorler(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_musteriler_ust_musteri
        FOREIGN KEY (ust_musteri_id) REFERENCES musteriler(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_musteriler_tur            (tur),
      INDEX idx_musteriler_durum          (durum),
      INDEX idx_musteriler_eposta         (eposta),
      INDEX idx_musteriler_sektor_id      (sektor_id),
      INDEX idx_musteriler_ust_musteri    (ust_musteri_id),
      INDEX idx_musteriler_kayit_tarihi   (kayit_tarihi),
      INDEX idx_musteriler_silinme        (silinme_tarihi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  5. MUSTERI TELEFONLARI                  */
  /*  Musteriye ait coklu telefon kayitlari   */
  /*  FK: musteriler.id (CASCADE)             */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS musteri_telefonlari (
      id          INT          AUTO_INCREMENT PRIMARY KEY,
      musteri_id  INT          NOT NULL,
      telefon     VARCHAR(50)  NOT NULL,

      CONSTRAINT fk_musteri_tel_musteri
        FOREIGN KEY (musteri_id) REFERENCES musteriler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

      INDEX idx_musteri_tel_musteri (musteri_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  6. MUSTERI ADRESLERI                    */
  /*  Musteriye ait coklu adres kayitlari     */
  /*  FK: musteriler.id (CASCADE)             */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS musteri_adresleri (
      id          INT  AUTO_INCREMENT PRIMARY KEY,
      musteri_id  INT  NOT NULL,
      adres       TEXT NOT NULL,

      CONSTRAINT fk_musteri_adr_musteri
        FOREIGN KEY (musteri_id) REFERENCES musteriler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

      INDEX idx_musteri_adr_musteri (musteri_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  7. MUSTERI DOSYALARI                    */
  /*  Musteriye ait yuklenen dosyalar         */
  /*  FK: musteriler.id (CASCADE)             */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS musteri_dosyalar (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      musteri_id       INT            NOT NULL,
      dosya_adi        VARCHAR(255)   NOT NULL,
      orijinal_ad      VARCHAR(255)   NOT NULL,
      dosya_tipi       VARCHAR(100)   NOT NULL,
      boyut            BIGINT         NOT NULL DEFAULT 0,
      yuklenme_tarihi  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_musteri_dosya_musteri
        FOREIGN KEY (musteri_id) REFERENCES musteriler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

      INDEX idx_musteri_dosya_musteri (musteri_id),
      INDEX idx_musteri_dosya_tarih   (yuklenme_tarihi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  8. BAYILER (Bayi/Temsilci Kayitlari)    */
  /*  Satis ve destek bayileri                */
  /*  FK: sektorler.id, self-ref              */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS bayiler (
      id                INT            AUTO_INCREMENT PRIMARY KEY,
      ad                VARCHAR(255)   NOT NULL,
      yetkili           VARCHAR(255)   NULL,
      eposta            VARCHAR(255)   NULL,
      telefon           VARCHAR(50)    NULL,
      vergi_no          VARCHAR(20)    NULL,
      vergi_dairesi     VARCHAR(100)   NULL,
      sektor_id         INT            NULL,
      durum             ENUM('aktif','pasif') NOT NULL DEFAULT 'aktif',
      tur               ENUM('gercek','tuzel','yabanci') NOT NULL DEFAULT 'tuzel',
      ust_bayi_id       INT            NULL,
      tc_kimlik_no      VARCHAR(11)    NULL,
      pasaport_no       VARCHAR(50)    NULL,
      ad_soyad          VARCHAR(255)   NULL,
      sirket_adi        VARCHAR(255)   NULL,
      notlar            TEXT           NULL,
      etiketler         JSON           NULL,
      kayit_tarihi      DATE           NOT NULL DEFAULT (CURDATE()),
      guncelleme_tarihi DATETIME       NULL ON UPDATE CURRENT_TIMESTAMP,
      silinme_tarihi    DATETIME       NULL DEFAULT NULL,

      CONSTRAINT fk_bayiler_sektor
        FOREIGN KEY (sektor_id) REFERENCES sektorler(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_bayiler_ust_bayi
        FOREIGN KEY (ust_bayi_id) REFERENCES bayiler(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_bayiler_durum         (durum),
      INDEX idx_bayiler_tur           (tur),
      INDEX idx_bayiler_sektor_id     (sektor_id),
      INDEX idx_bayiler_ust_bayi      (ust_bayi_id),
      INDEX idx_bayiler_kayit_tarihi  (kayit_tarihi),
      INDEX idx_bayiler_silinme       (silinme_tarihi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  9. BAYI DOSYALARI                       */
  /*  Bayiye ait yuklenen dosyalar            */
  /*  FK: bayiler.id (CASCADE)                */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS bayi_dosyalar (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      bayi_id          INT            NOT NULL,
      dosya_adi        VARCHAR(255)   NOT NULL,
      orijinal_ad      VARCHAR(255)   NOT NULL,
      dosya_tipi       VARCHAR(100)   NOT NULL,
      boyut            BIGINT         NOT NULL DEFAULT 0,
      yuklenme_tarihi  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_bayi_dosya_bayi
        FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

      INDEX idx_bayi_dosya_bayi  (bayi_id),
      INDEX idx_bayi_dosya_tarih (yuklenme_tarihi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  10. URUN GRUPLARI                       */
  /*  Urunlerin kategori/grup bilgisi         */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS urun_gruplari (
      id        INT          AUTO_INCREMENT PRIMARY KEY,
      ad        VARCHAR(100) NOT NULL UNIQUE,
      aciklama  VARCHAR(255) NULL,
      aktif     TINYINT(1)   NOT NULL DEFAULT 1,

      INDEX idx_urun_gruplari_aktif (aktif)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  11. URUNLER (Yazilim Urunleri)          */
  /*  Satis yapilan yazilim urunleri          */
  /*  FK: urun_gruplari.id                    */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS urunler (
      id             INT            AUTO_INCREMENT PRIMARY KEY,
      grup_id        INT            NULL,
      ad             VARCHAR(255)   NOT NULL,
      urun_tipi      VARCHAR(50)    NULL,
      uygulama_tipi  VARCHAR(50)    NULL,
      ozel_proje     TINYINT(1)     NOT NULL DEFAULT 0,
      aktif          TINYINT(1)     NOT NULL DEFAULT 1,

      CONSTRAINT fk_urunler_grup
        FOREIGN KEY (grup_id) REFERENCES urun_gruplari(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_urunler_grup      (grup_id),
      INDEX idx_urunler_aktif     (aktif),
      INDEX idx_urunler_urun_tipi (urun_tipi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  12. PAKETLER (Urun Paketleri)           */
  /*  Urunlerin fiyat ve sure paketleri       */
  /*  FK: urunler.id (CASCADE)                */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS paketler (
      id                INT            AUTO_INCREMENT PRIMARY KEY,
      urun_id           INT            NOT NULL,
      ad                VARCHAR(255)   NOT NULL,
      tipi              VARCHAR(50)    NULL,
      kullanim_gunu     INT            NOT NULL DEFAULT 365,
      fiyat             DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      kullanici_sayisi  INT            NOT NULL DEFAULT 1,
      aktif             TINYINT(1)     NOT NULL DEFAULT 1,

      CONSTRAINT fk_paketler_urun
        FOREIGN KEY (urun_id) REFERENCES urunler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

      INDEX idx_paketler_urun  (urun_id),
      INDEX idx_paketler_aktif (aktif),
      INDEX idx_paketler_tipi  (tipi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  13. LISANSLAR (Musteri Lisanslari)      */
  /*  Musterilere tanimli lisans kayitlari    */
  /*  FK: musteriler, urunler, paketler       */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS lisanslar (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      musteri_id       INT            NOT NULL,
      urun_id          INT            NULL,
      paket_id         INT            NULL,
      lisans_anahtari  VARCHAR(100)   NULL UNIQUE,
      baslangic_tarihi DATE           NOT NULL,
      bitis_tarihi     DATE           NOT NULL,
      durum            ENUM('aktif','yaklasan','suresi-dolmus','dondurulmus') NOT NULL DEFAULT 'aktif',
      domain           VARCHAR(255)   NULL,
      fatura_no        VARCHAR(50)    NULL,
      fiyat            DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      fatura_geldi     TINYINT(1)     NOT NULL DEFAULT 0,
      kullanici_sayisi INT            NOT NULL DEFAULT 1,
      olusturma_tarihi DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_lisanslar_musteri
        FOREIGN KEY (musteri_id) REFERENCES musteriler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_lisanslar_urun
        FOREIGN KEY (urun_id) REFERENCES urunler(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_lisanslar_paket
        FOREIGN KEY (paket_id) REFERENCES paketler(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_lisanslar_musteri    (musteri_id),
      INDEX idx_lisanslar_urun       (urun_id),
      INDEX idx_lisanslar_paket      (paket_id),
      INDEX idx_lisanslar_durum      (durum),
      INDEX idx_lisanslar_bitis      (bitis_tarihi),
      INDEX idx_lisanslar_baslangic  (baslangic_tarihi),
      INDEX idx_lisanslar_olusturma  (olusturma_tarihi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  14. SURUMLER (Yazilim Surumleri)        */
  /*  Urunlerin versiyon gecmisi              */
  /*  FK: urunler.id                          */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS surumler (
      id             INT            AUTO_INCREMENT PRIMARY KEY,
      urun_id        INT            NULL,
      urun_adi       VARCHAR(255)   NOT NULL,
      surum          VARCHAR(50)    NOT NULL,
      tarih          DATE           NOT NULL,
      duzenlenenler  TEXT           NULL,
      eklenenler     TEXT           NULL,
      cikarilanlar   TEXT           NULL,
      dosya_adi      VARCHAR(255)   NULL,
      aktif          TINYINT(1)     NOT NULL DEFAULT 1,

      CONSTRAINT fk_surumler_urun
        FOREIGN KEY (urun_id) REFERENCES urunler(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_surumler_urun  (urun_id),
      INDEX idx_surumler_tarih (tarih),
      INDEX idx_surumler_aktif (aktif)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  15. NOTLAR (Musteri Notlari)            */
  /*  Musterilere eklenen notlar/yorumlar     */
  /*  FK: musteriler.id, kullanicilar.id      */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS notlar (
      id           INT        AUTO_INCREMENT PRIMARY KEY,
      musteri_id   INT        NOT NULL,
      kullanici_id INT        NULL,
      metin        TEXT       NOT NULL,
      onemli       TINYINT(1) NOT NULL DEFAULT 0,
      tarih        DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_notlar_musteri
        FOREIGN KEY (musteri_id) REFERENCES musteriler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_notlar_kullanici
        FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_notlar_musteri   (musteri_id),
      INDEX idx_notlar_kullanici (kullanici_id),
      INDEX idx_notlar_tarih     (tarih),
      INDEX idx_notlar_onemli    (onemli)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  16. ILETISIM KAYITLARI                  */
  /*  Musteriyle yapilan iletisim gecmisi     */
  /*  FK: musteriler.id, kullanicilar.id      */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS iletisim_kayitlari (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      musteri_id       INT            NOT NULL,
      kullanici_id     INT            NULL,
      iletisim_turu    ENUM('telefon','eposta','toplanti','ziyaret','diger') NOT NULL DEFAULT 'telefon',
      konu             VARCHAR(255)   NULL,
      aciklama         TEXT           NULL,
      iletisim_tarihi  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sonraki_iletisim DATETIME       NULL,

      CONSTRAINT fk_iletisim_musteri
        FOREIGN KEY (musteri_id) REFERENCES musteriler(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_iletisim_kullanici
        FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_iletisim_musteri   (musteri_id),
      INDEX idx_iletisim_kullanici (kullanici_id),
      INDEX idx_iletisim_tarih     (iletisim_tarihi),
      INDEX idx_iletisim_turu      (iletisim_turu)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  17. AKTIVITE LOGLARI                    */
  /*  Sistem kullanici aktivite kayitlari     */
  /*  FK: kullanicilar.id                     */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS aktivite_loglari (
      id           INT         AUTO_INCREMENT PRIMARY KEY,
      kullanici_id INT         NULL,
      tip          VARCHAR(50) NOT NULL,
      mesaj        TEXT        NOT NULL,
      tarih        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_aktivite_log_kullanici
        FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_aktivite_log_kullanici (kullanici_id),
      INDEX idx_aktivite_log_tip       (tip),
      INDEX idx_aktivite_log_tarih     (tarih)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  /* ======================================== */
  /*  18. YEDEKLEME LOGLARI                   */
  /*  Yedekleme islem kayitlari               */
  /*  FK: kullanicilar.id                     */
  /* ======================================== */
  await havuz.query(`
    CREATE TABLE IF NOT EXISTS yedekleme_loglari (
      id               INT            AUTO_INCREMENT PRIMARY KEY,
      kullanici_id     INT            NULL,
      kullanici_eposta VARCHAR(255)   NULL,
      islem_tipi       ENUM('yedek_alma','geri_yukleme') NOT NULL,
      dosya_adi        VARCHAR(500)   NULL,
      dosya_boyutu     BIGINT         NULL DEFAULT 0,
      tablo_sayisi     INT            NULL DEFAULT 0,
      kayit_sayisi     INT            NULL DEFAULT 0,
      durum            ENUM('basarili','basarisiz') NOT NULL DEFAULT 'basarili',
      detay            TEXT           NULL,
      tarih            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT fk_yedekleme_log_kullanici
        FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

      INDEX idx_yedekleme_log_tarih      (tarih),
      INDEX idx_yedekleme_log_kullanici  (kullanici_id),
      INDEX idx_yedekleme_log_islem_tipi (islem_tipi),
      INDEX idx_yedekleme_log_durum      (durum)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("[Veritabani] Tum tablolar olusturuldu / kontrol edildi.");
}

/* ============================================= */
/*  TABLO SIFIRLAMA                              */
/*  Tum tablolari siler (migrasyon icin)         */
/*  DIKKAT: Tum verileri kaybedersiniz!          */
/* ============================================= */

async function tablolariSifirla() {
  console.log("[Veritabani] Tablolar sifirlaniyor...");
  await havuz.query("SET FOREIGN_KEY_CHECKS = 0");

  /* FK bagimlilik sirasina gore (tersten) */
  const tablolar = [
    "yedekleme_loglari",
    "aktivite_loglari",
    "iletisim_kayitlari",
    "notlar",
    "surumler",
    "lisanslar",
    "paketler",
    "urunler",
    "urun_gruplari",
    "bayi_dosyalar",
    "bayiler",
    "musteri_dosyalar",
    "musteri_adresleri",
    "musteri_telefonlari",
    "musteriler",
    "kullanicilar",
    "sektorler",
    "roller",
  ];

  for (const tablo of tablolar) {
    await havuz.query(`DROP TABLE IF EXISTS ${tablo}`);
  }

  await havuz.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("[Veritabani] Tum tablolar silindi.");
}

/* ============================================= */
/*  VARSAYILAN VERILER                           */
/*  Sistem icin gerekli baslangic verileri       */
/* ============================================= */

async function ornekVerileriEkle() {

  /* ---- Varsayilan Roller ---- */
  const [rSatir] = await havuz.query("SELECT COUNT(*) as sayi FROM roller");
  if (rSatir[0].sayi === 0) {
    const varsayilanRoller = [
      ["admin", "Tam yetkili yonetici", '["ozet","musteriler","bayiler","lisans_yonetimi","yonetim","raporlar","takvim","aktivite_logu","yedekleme"]', 1, 1],
      ["kullanici", "Standart kullanici", '["ozet","musteriler","bayiler","lisans_yonetimi"]', 1, 1],
      ["izleyici", "Sadece goruntuleme yetkisi", '["ozet"]', 1, 1],
    ];
    for (const r of varsayilanRoller) {
      await havuz.query("INSERT INTO roller (ad, aciklama, izinler, varsayilan, aktif) VALUES (?, ?, ?, ?, ?)", r);
    }
    console.log("[Veritabani] Varsayilan roller eklendi.");
  }

  /* ---- Varsayilan Sektorler ---- */
  const [sSatir] = await havuz.query("SELECT COUNT(*) as sayi FROM sektorler");
  if (sSatir[0].sayi === 0) {
    const varsayilanSektorler = [
      "Bilisim / Yazilim",
      "E-Ticaret",
      "Egitim",
      "Finans / Bankacilik",
      "Gida",
      "Hukuk",
      "Insaat / Gayrimenkul",
      "Lojistik / Tasimacilik",
      "Muhendislik",
      "Otomotiv",
      "Perakende",
      "Saglik",
      "Sanayi / Uretim",
      "Tarim",
      "Tekstil",
      "Telekomunikasyon",
      "Turizm / Otelcilik",
      "Diger",
    ];
    for (const ad of varsayilanSektorler) {
      await havuz.query("INSERT INTO sektorler (ad) VALUES (?)", [ad]);
    }
    console.log("[Veritabani] Varsayilan sektorler eklendi.");
  }

  /* ---- Varsayilan Kullanicilar ---- */
  const [kSatir] = await havuz.query("SELECT COUNT(*) as sayi FROM kullanicilar");
  if (kSatir[0].sayi === 0) {
    const sifreHash = await bcrypt.hash("admin123", 10);
    const kullaniciVerileri = [
      ["ercan", sifreHash, "Ercan Guzel", "ercan@guzelteknoloji.com", "admin", 1],
      ["semihcan", sifreHash, "Semihcan Guzel", "semihcan@guzelteknoloji.com", "kullanici", 1],
      ["baran", sifreHash, "Baran Uruncan", "baran@guzelteknoloji.com", "izleyici", 0],
      ["suleyman", sifreHash, "Suleyman Guzel", "suleyman@guzelteknoloji.com", "admin", 1],
      ["aykut", sifreHash, "Aykut", "aykut@guzelteknoloji.com", "kullanici", 1],
    ];
    for (const k of kullaniciVerileri) {
      await havuz.query("INSERT INTO kullanicilar (kullanici_adi, sifre_hash, ad_soyad, eposta, rol, aktif) VALUES (?, ?, ?, ?, ?, ?)", k);
    }
    console.log("[Veritabani] Varsayilan kullanicilar eklendi. (Sifre: admin123)");
  }
}

/* ============================================= */
/*  DISA AKTARMA                                  */
/* ============================================= */

module.exports = { tablolariOlustur, tablolariSifirla, ornekVerileriEkle };
