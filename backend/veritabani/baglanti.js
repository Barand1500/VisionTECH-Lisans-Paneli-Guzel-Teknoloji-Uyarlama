/* ============================================= */
/*  Guzel Teknoloji - Veritabani Baglanti Modulu */
/*  MySQL veritabani baglantisi                   */
/*  mysql2/promise kullanilir (asenkron)          */
/* ============================================= */

const mysql = require("mysql2/promise");

/* ---- Baglanti Havuzu (Connection Pool) ---- */
const havuz = mysql.createPool({
  host: process.env.VT_HOST || "localhost",
  port: Number(process.env.VT_PORT) || 3306,
  user: process.env.VT_KULLANICI || "root",
  password: process.env.VT_SIFRE || "",
  database: process.env.VT_VERITABANI || "guzel_teknoloji",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

console.log("[Veritabani] MySQL baglanti havuzu olusturuldu.");

module.exports = havuz;
