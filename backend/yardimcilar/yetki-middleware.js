/* ============================================= */
/*  Yetkilendirme Middleware                      */
/*  JWT token dogrulama                           */
/* ============================================= */

const jwt = require("jsonwebtoken");

const JWT_GIZLI = process.env.JWT_SECRET;
if (!JWT_GIZLI) throw new Error("JWT_SECRET ortam degiskeni tanimlanmamis! Sunucu guvenli calisamaz.");

/* ---- Token Dogrulama ---- */
function yetkiKontrol(req, res, next) {
  const baslik = req.headers.authorization;
  if (!baslik || !baslik.startsWith("Bearer ")) {
    return res.status(401).json({ basarili: false, mesaj: "Yetkilendirme basarisi bulunamadi." });
  }

  const token = baslik.split(" ")[1];
  try {
    const cozulmus = jwt.verify(token, JWT_GIZLI);
    req.kullanici = cozulmus;
    next();
  } catch {
    return res.status(401).json({ basarili: false, mesaj: "Gecersiz veya suresi dolmus token." });
  }
}

/* ---- Sadece Admin Erisimi ---- */
function sadaceAdmin(req, res, next) {
  const rol = (req.kullanici.rol || "").toLowerCase().replace(/ö/g, "o").replace(/ü/g, "u").replace(/ı/g, "i");
  if (rol !== "yonetici") {
    return res.status(403).json({ basarili: false, mesaj: "Bu islem icin admin yetkisi gereklidir." });
  }
  next();
}

module.exports = { yetkiKontrol, sadaceAdmin, JWT_GIZLI };
