const express = require("express");
const router = express.Router();
const { prisma, temizle } = require("../veritabani/prisma");
const { hataYakala } = require("../yardimcilar/hata-yonetimi");

/* ---- Tum Loglari Listele (kullanici bilgisiyle) ---- */
router.get("/", hataYakala(async (req, res) => {
  const loglar = await prisma.aktiviteLog.findMany({
    include: { kullanici: { select: { ad_soyad: true, eposta: true } } },
    orderBy: { tarih: "desc" },
    take: 500,
  });
  const sonuc = loglar.map(({ kullanici, ...log }) => ({
    ...log,
    kullanici_adi: kullanici?.ad_soyad || null,
    kullanici_eposta: kullanici?.eposta || null,
  }));
  res.json({ basarili: true, veri: temizle(sonuc) });
}));

/* ---- Log Ekle ---- */
router.post("/", hataYakala(async (req, res) => {
  const { tip, mesaj, kullanici_id } = req.body;
  if (!tip || !mesaj) return res.status(400).json({ basarili: false, mesaj: "Tip ve mesaj zorunludur." });

  const sonuc = await prisma.aktiviteLog.create({
    data: { kullanici_id: kullanici_id || null, tip, mesaj },
  });
  res.status(201).json({ basarili: true, mesaj: "Log kaydedildi.", id: sonuc.id });
}));

/* ---- Loglari Sil (tarih araligina gore) ---- */
router.delete("/", hataYakala(async (req, res) => {
  const { periyot, baslangic, bitis } = req.query;

  if (periyot === "aralik") {
    if (!baslangic || !bitis) {
      return res.status(400).json({ basarili: false, mesaj: "Başlangıç ve bitiş tarihi zorunludur." });
    }
    const silinen = await prisma.$executeRawUnsafe(
      "DELETE FROM aktivite_loglari WHERE DATE(tarih) >= ? AND DATE(tarih) <= ?",
      baslangic, bitis
    );
    return res.json({ basarili: true, mesaj: `${silinen} log kaydı silindi.`, silinen });
  }

  let kosul = "";
  switch (periyot) {
    case "bugun": kosul = "WHERE DATE(tarih) = CURDATE()"; break;
    case "hafta": kosul = "WHERE tarih >= DATE_SUB(NOW(), INTERVAL 7 DAY)"; break;
    case "ay": kosul = "WHERE tarih >= DATE_SUB(NOW(), INTERVAL 1 MONTH)"; break;
    case "tumu": kosul = ""; break;
    default: return res.status(400).json({ basarili: false, mesaj: "Gecersiz periyot." });
  }
  const silinen = await prisma.$executeRawUnsafe(`DELETE FROM aktivite_loglari ${kosul}`);
  res.json({ basarili: true, mesaj: `${silinen} log kaydı silindi.`, silinen });
}));

module.exports = router;
