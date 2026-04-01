/* Etiketler sütunu ekleme migrasyonu */
require("dotenv").config();
const havuz = require("./veritabani/baglanti");

async function migrate() {
  try {
    // Musteriler etiketler kontrol
    const [r1] = await havuz.query(`SHOW COLUMNS FROM musteriler LIKE 'etiketler'`);
    if (r1.length === 0) {
      await havuz.query(`ALTER TABLE musteriler ADD COLUMN etiketler JSON NULL`);
      console.log("✓ musteriler.etiketler eklendi");
    } else {
      console.log("✓ musteriler.etiketler zaten var");
    }

    // Bayiler etiketler kontrol
    const [r2] = await havuz.query(`SHOW COLUMNS FROM bayiler LIKE 'etiketler'`);
    if (r2.length === 0) {
      await havuz.query(`ALTER TABLE bayiler ADD COLUMN etiketler JSON NULL`);
      console.log("✓ bayiler.etiketler eklendi");
    } else {
      console.log("✓ bayiler.etiketler zaten var");
    }

    console.log("\nMigrasyon tamamlandi!");
    process.exit(0);
  } catch (err) {
    console.error("Hata:", err.message);
    process.exit(1);
  }
}

migrate();
