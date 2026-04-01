/* ============================================= */
/*  Guzel Teknoloji - Hata Yonetimi Middleware   */
/*  API isteklerinde olusan hatalari yakalar     */
/*  ve standart JSON formatinda dondurur         */
/* ============================================= */

function hataYakala(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((hata) => {
      console.error(`[Hata] ${req.method} ${req.path} =>`, hata.message);
      res.status(500).json({
        basarili: false,
        mesaj: "Sunucu hatasi olustu.",
        detay: process.env.NODE_ENV === "development" ? hata.message : undefined,
      });
    });
  };
}

function dogrulamaHatasi(res, mesaj) {
  return res.status(400).json({ basarili: false, mesaj });
}

function bulunamadiHatasi(res, mesaj = "Kayit bulunamadi.") {
  return res.status(404).json({ basarili: false, mesaj });
}

module.exports = { hataYakala, dogrulamaHatasi, bulunamadiHatasi };
