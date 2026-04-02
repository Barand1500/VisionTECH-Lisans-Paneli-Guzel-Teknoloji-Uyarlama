/* ============================================= */
/*  Aktivite Log Rotalari - CRUD Islemleri        */
/* ============================================= */

const express = require("express");
const router = express.Router();
const havuz = require("../veritabani/baglanti");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Loglari Listele (kullanici bilgisiyle) ---- */
router.get("/", hataYakala(async (req, res) => {
  const [loglar] = await havuz.query(`
    SELECT al.*, 
           k.ad_soyad as kullanici_adi,
           k.eposta as kullanici_eposta
    FROM aktivite_loglari al
    LEFT JOIN kullanicilar k ON al.kullanici_id = k.id
    ORDER BY al.tarih DESC 
    LIMIT 500
  `);
  res.json({ basarili: true, veri: loglar });
}));

/* ---- Log Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { tip, mesaj, kullanici_id } = req.body;
  if (!tip || !mesaj) return res.status(400).json({ basarili: false, mesaj: "Tip ve mesaj zorunludur." });

  const [sonuc] = await havuz.query(
    "INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, ?, ?)",
    [kullanici_id || null, tip, mesaj]
  );

  res.status(201).json({ basarili: true, mesaj: "Log kaydedildi.", id: sonuc.insertId });
}));


/* ---- Loglari Sil (tarih araligina gore) ---- */
router.delete("/", hataYakala(async (req, res) => {
  const { periyot, baslangic, bitis } = req.query;

  /* Tarih araligi ile silme */
  if (periyot === "aralik") {
    if (!baslangic || !bitis) {
      return res.status(400).json({ basarili: false, mesaj: "Başlangıç ve bitiş tarihi zorunludur." });
    }
    const [sonuc] = await havuz.query(
      "DELETE FROM aktivite_loglari WHERE DATE(tarih) >= ? AND DATE(tarih) <= ?",
      [baslangic, bitis]
    );
    return res.json({ basarili: true, mesaj: `${sonuc.affectedRows} log kaydı silindi.`, silinen: sonuc.affectedRows });
  }

  /* Periyot ile silme */
  let kosul = "";
  switch (periyot) {
    case "bugun":
      kosul = "WHERE DATE(tarih) = CURDATE()";
      break;
    case "hafta":
      kosul = "WHERE tarih >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
      break;
    case "ay":
      kosul = "WHERE tarih >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
      break;
    case "tumu":
      kosul = "";
      break;
    default:
      return res.status(400).json({ basarili: false, mesaj: "Gecersiz periyot." });
  }
  const [sonuc] = await havuz.query(`DELETE FROM aktivite_loglari ${kosul}`);
  res.json({ basarili: true, mesaj: `${sonuc.affectedRows} log kaydı silindi.`, silinen: sonuc.affectedRows });
}));

module.exports = router;
