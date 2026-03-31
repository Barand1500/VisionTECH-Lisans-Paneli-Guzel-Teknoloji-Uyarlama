require("dotenv").config();
const havuz = require("./veritabani/baglanti");

(async () => {
  try {
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
        INDEX idx_yedekleme_log_islem_tipi (islem_tipi)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("yedekleme_loglari tablosu olusturuldu.");
    process.exit(0);
  } catch (e) {
    console.error("HATA:", e.message);
    process.exit(1);
  }
})();
