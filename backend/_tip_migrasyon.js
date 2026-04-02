/**
 * Ürün Tipleri ve Uygulama Tipleri tablolarını
 * hiyerarşik yapıya göre yeniden oluşturur
 */

require("dotenv").config();
const havuz = require("./veritabani/baglanti");

async function migrasyonCalistir() {
  try {
    console.log("📦 Tip tabloları migrasyonu başlıyor...\n");

    // Eski tabloları sil
    await havuz.query("DROP TABLE IF EXISTS uygulama_tipleri");
    await havuz.query("DROP TABLE IF EXISTS urun_tipleri");
    console.log("✓ Eski tablolar silindi");

    // Ürün tipleri - grup_id ile
    await havuz.query(`
      CREATE TABLE urun_tipleri (
        id        INT          AUTO_INCREMENT PRIMARY KEY,
        grup_id   INT          NULL,
        ad        VARCHAR(100) NOT NULL,
        aktif     TINYINT(1)   NOT NULL DEFAULT 1,
        FOREIGN KEY (grup_id) REFERENCES urun_gruplari(id) ON UPDATE CASCADE ON DELETE SET NULL,
        INDEX idx_urun_tipleri_aktif (aktif),
        INDEX idx_urun_tipleri_grup (grup_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ urun_tipleri tablosu oluşturuldu (grup_id FK eklendi)");

    // Uygulama tipleri - urun_tipi_id ile
    await havuz.query(`
      CREATE TABLE uygulama_tipleri (
        id            INT          AUTO_INCREMENT PRIMARY KEY,
        urun_tipi_id  INT          NULL,
        ad            VARCHAR(100) NOT NULL,
        aktif         TINYINT(1)   NOT NULL DEFAULT 1,
        FOREIGN KEY (urun_tipi_id) REFERENCES urun_tipleri(id) ON UPDATE CASCADE ON DELETE SET NULL,
        INDEX idx_uygulama_tipleri_aktif (aktif),
        INDEX idx_uygulama_tipleri_urun_tipi (urun_tipi_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ uygulama_tipleri tablosu oluşturuldu (urun_tipi_id FK eklendi)");

    console.log("\n✅ Migrasyon başarıyla tamamlandı!");
    process.exit(0);
  } catch (e) {
    console.error("\n❌ HATA:", e.message);
    process.exit(1);
  }
}

migrasyonCalistir();
