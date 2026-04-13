const mysql = require("mysql2/promise");
const { connect } = require("./rotalar/lisans-rotalari");
require("dotenv").config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.VT_HOST,
    port: process.env.VT_PORT,
    user: process.env.VT_KULLANICI,
    password: process.env.VT_SIFRE,
    database: process.env.VT_VERITABANI,
  });
  console.log("Veritabanina baglandi.");
  try {
    await conn.execute("ALTER TABLE paketler ADD COLUMN lisans_tipi_id INT NULL");
    console.log("lisans_tipi_id kolonu eklendi.");
  } catch (e) { console.log("Kolon zaten var veya hata:", e.message); }
  try {
    await conn.execute("ALTER TABLE paketler ADD INDEX idx_lisans_tipi_id (lisans_tipi_id)");
    console.log("Index eklendi.");
  } catch (e) { console.log("Index zaten var veya hata:", e.message); }
  try {
    await conn.execute("ALTER TABLE paketler ADD CONSTRAINT fk_paketler_lisans_tipi FOREIGN KEY (lisans_tipi_id) REFERENCES lisans_tipleri(id) ON DELETE SET NULL ON UPDATE CASCADE");
    console.log("FK constraint eklendi.");
  } catch (e) { console.log("FK zaten var veya hata:", e.message); }
  await conn.end();
  console.log("Migrasyon tamamlandi!");
})();
