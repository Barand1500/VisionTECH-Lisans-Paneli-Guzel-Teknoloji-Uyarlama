/* ============================================= */
/*  Yetki Rotalari - Giris / Kullanici Yonetimi  */
/* ============================================= */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const havuz = require("../veritabani/baglanti");
const { hataYakala, dogrulamaHatasi, bulunamadiHatasi } = require("../yardimcilar/hata-yonetimi");
const { yetkiKontrol, sadaceAdmin, JWT_GIZLI } = require("../yardimcilar/yetki-middleware");

/* ---- Giris Yap ---- */
router.post("/giris", hataYakala(async (req, res) => {
  const { eposta, sifre } = req.body;
  if (!eposta || !sifre) return dogrulamaHatasi(res, "E-posta ve sifre zorunludur.");

  const [satirlar] = await havuz.query("SELECT * FROM kullanicilar WHERE eposta = ?", [eposta]);
  if (satirlar.length === 0) return res.status(401).json({ basarili: false, mesaj: "E-posta veya sifre hatali." });

  const kullanici = satirlar[0];
  if (!kullanici.aktif) return res.status(403).json({ basarili: false, mesaj: "Hesabiniz pasif durumda. Yonetici ile iletisime gecin." });

  const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre_hash);
  if (!sifreDogruMu) return res.status(401).json({ basarili: false, mesaj: "E-posta veya sifre hatali." });

  /* Son giris tarihini guncelle */
  await havuz.query("UPDATE kullanicilar SET son_giris = NOW() WHERE id = ?", [kullanici.id]);

  /* Giris logunu kaydet */
  await havuz.query(
    "INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, ?, ?)",
    [kullanici.id, "giris", `${kullanici.ad_soyad} (${kullanici.eposta}) giris yapti.`]
  );

  const token = jwt.sign(
    { id: kullanici.id, eposta: kullanici.eposta, rol: kullanici.rol, ad_soyad: kullanici.ad_soyad },
    JWT_GIZLI,
    { expiresIn: "24h" }
  );

  res.json({
    basarili: true,
    mesaj: "Giris basarili.",
    token,
    kullanici: {
      id: kullanici.id,
      ad_soyad: kullanici.ad_soyad,
      eposta: kullanici.eposta,
      rol: kullanici.rol,
    },
  });
}));

/* ---- Mevcut Kullanici Bilgisi (token ile) ---- */
router.get("/ben", yetkiKontrol, hataYakala(async (req, res) => {
  const [satirlar] = await havuz.query(
    "SELECT id, kullanici_adi, ad_soyad, eposta, rol, aktif, olusturma_tarihi, son_giris FROM kullanicilar WHERE id = ?",
    [req.kullanici.id]
  );
  if (satirlar.length === 0) return bulunamadiHatasi(res, "Kullanici bulunamadi.");
  res.json({ basarili: true, veri: satirlar[0] });
}));

/* ---- Cikis Yap (log kaydi) ---- */
router.post("/cikis", yetkiKontrol, hataYakala(async (req, res) => {
  await havuz.query(
    "INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, ?, ?)",
    [req.kullanici.id, "cikis", `${req.kullanici.ad_soyad} (${req.kullanici.eposta}) cikis yapti.`]
  );
  res.json({ basarili: true, mesaj: "Cikis basarili." });
}));

/* ============================================= */
/*  Kullanici CRUD (sadece admin)                 */
/* ============================================= */

/* ---- Tum Kullanicilari Listele ---- */
router.get("/kullanicilar", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const [kullanicilar] = await havuz.query(
    "SELECT id, kullanici_adi, ad_soyad, eposta, rol, aktif, olusturma_tarihi, son_giris FROM kullanicilar ORDER BY id ASC"
  );
  res.json({ basarili: true, veri: kullanicilar });
}));

/* ---- Kullanici Ekle ---- */
router.post("/kullanicilar", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const { ad_soyad, eposta, sifre, rol, aktif } = req.body;
  if (!ad_soyad || !eposta || !sifre) return dogrulamaHatasi(res, "Ad soyad, e-posta ve sifre zorunludur.");

  /* E-posta benzersizlik kontrolu */
  const [mevcut] = await havuz.query("SELECT id FROM kullanicilar WHERE eposta = ?", [eposta]);
  if (mevcut.length > 0) return dogrulamaHatasi(res, "Bu e-posta adresi zaten kayitli.");

  const hash = await bcrypt.hash(sifre, 10);
  const kullaniciAdi = eposta.split("@")[0];

  const [sonuc] = await havuz.query(
    "INSERT INTO kullanicilar (kullanici_adi, ad_soyad, eposta, sifre_hash, rol, aktif) VALUES (?, ?, ?, ?, ?, ?)",
    [kullaniciAdi, ad_soyad, eposta, hash, rol || "kullanici", aktif !== undefined ? (aktif ? 1 : 0) : 1]
  );

  res.status(201).json({ basarili: true, mesaj: "Kullanici basariyla eklendi.", id: sonuc.insertId });
}));

/* ---- Kullanici Guncelle ---- */
router.put("/kullanicilar/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  const [mevcutSatir] = await havuz.query("SELECT id FROM kullanicilar WHERE id = ?", [id]);
  if (mevcutSatir.length === 0) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  const { ad_soyad, eposta, sifre, rol, aktif } = req.body;

  /* Eger sifre de gonderildiyse hashle */
  let hashPart = "";
  const params = [];

  let sql = "UPDATE kullanicilar SET ad_soyad = COALESCE(?, ad_soyad), eposta = COALESCE(?, eposta), rol = COALESCE(?, rol), aktif = COALESCE(?, aktif)";
  params.push(ad_soyad || null, eposta || null, rol || null, aktif !== undefined ? (aktif ? 1 : 0) : null);

  if (sifre) {
    sql += ", sifre_hash = ?";
    params.push(await bcrypt.hash(sifre, 10));
  }

  sql += " WHERE id = ?";
  params.push(id);

  await havuz.query(sql, params);
  res.json({ basarili: true, mesaj: "Kullanici basariyla guncellendi." });
}));

/* ---- Kullanici Sil ---- */
router.delete("/kullanicilar/:id", yetkiKontrol, sadaceAdmin, hataYakala(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.kullanici.id) return dogrulamaHatasi(res, "Kendi hesabinizi silemezsiniz.");

  const [mevcutSatir] = await havuz.query("SELECT id FROM kullanicilar WHERE id = ?", [id]);
  if (mevcutSatir.length === 0) return bulunamadiHatasi(res, "Kullanici bulunamadi.");

  await havuz.query("DELETE FROM kullanicilar WHERE id = ?", [id]);
  res.json({ basarili: true, mesaj: "Kullanici basariyla silindi." });
}));

/* ============================================= */
/*  Şifre Sıfırlama (Şifremi Unuttum)            */
/* ============================================= */
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const smtpTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_KULLANICI || "",
    pass: process.env.SMTP_SIFRE || "",
  },
});

router.post("/sifre-sifirla", hataYakala(async (req, res) => {
  const { eposta, tarayiciBilgisi, bilgisayarBilgisi } = req.body;
  if (!eposta) return dogrulamaHatasi(res, "E-posta adresi zorunludur.");

  /* Kullanıcıyı bul */
  const [satirlar] = await havuz.query("SELECT id, ad_soyad, eposta FROM kullanicilar WHERE eposta = ?", [eposta]);
  if (satirlar.length === 0) {
    return res.status(404).json({ basarili: false, mesaj: "Bu e-posta adresi sistemde kayıtlı değil." });
  }

  const kullanici = satirlar[0];

  /* Rastgele 10 karakterlik şifre üret */
  const yeniSifre = crypto.randomBytes(5).toString("hex");

  /* Hashle ve veritabanını güncelle */
  const hash = await bcrypt.hash(yeniSifre, 10);
  await havuz.query("UPDATE kullanicilar SET sifre_hash = ? WHERE id = ?", [hash, kullanici.id]);

  /* Aktivite logu kaydet */
  const simdi = new Date();
  const tarihStr = simdi.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

  await havuz.query(
    "INSERT INTO aktivite_loglari (kullanici_id, tip, mesaj) VALUES (?, ?, ?)",
    [kullanici.id, "sifre_sifirlama", `${kullanici.ad_soyad} (${kullanici.eposta}) şifre sıfırlama talebi. Tarayıcı: ${tarayiciBilgisi || "Bilinmiyor"}, Cihaz: ${bilgisayarBilgisi || "Bilinmiyor"}`]
  );

  /* E-posta gönder */
  if (!process.env.SMTP_KULLANICI || !process.env.SMTP_SIFRE) {
    console.log(`[Şifre Sıfırlama] Kullanıcı: ${kullanici.ad_soyad} (${kullanici.eposta})`);
    console.log(`[Şifre Sıfırlama] Yeni Şifre: ${yeniSifre}`);
    console.log(`[Şifre Sıfırlama] SMTP ayarları yapılandırılmadığı için mail gönderilemedi.`);
    return res.json({
      basarili: true,
      mesaj: "Şifreniz sıfırlandı. SMTP ayarları yapılandırıldığında e-posta olarak da gönderilecektir.",
    });
  }

  await smtpTransporter.sendMail({
    from: process.env.SMTP_KULLANICI,
    to: kullanici.eposta,
    subject: "Güzel Teknoloji - Şifre Sıfırlama",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:550px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#1e40af;color:#fff;font-weight:bold;font-size:18px;padding:12px 20px;border-radius:10px;">GT</div>
          <h2 style="color:#1e40af;margin:12px 0 4px;">Şifre Sıfırlama</h2>
          <p style="color:#6b7280;font-size:14px;margin:0;">Güzel Teknoloji Yönetim Paneli</p>
        </div>

        <p style="color:#374151;font-size:15px;">Sayın <strong>${kullanici.ad_soyad}</strong>,</p>

        <p style="color:#374151;font-size:15px;">Şifre sıfırlama talebiniz işleme alınmıştır. Yeni şifreniz aşağıdadır:</p>

        <div style="background:#eff6ff;border:2px solid #3b82f6;padding:16px;border-radius:10px;text-align:center;margin:20px 0;">
          <p style="color:#6b7280;font-size:13px;margin:0 0 6px;">Yeni Şifreniz</p>
          <p style="color:#1e40af;font-size:22px;font-weight:bold;margin:0;letter-spacing:2px;">${yeniSifre}</p>
        </div>

        <p style="color:#dc2626;font-size:13px;font-weight:600;">⚠️ Güvenliğiniz için giriş yaptıktan sonra şifrenizi değiştirmeniz önerilir.</p>

        <div style="background:#f9fafb;padding:14px;border-radius:8px;margin:16px 0;border:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:13px;margin:0 0 8px;font-weight:600;">📋 Talep Detayları</p>
          <table style="width:100%;font-size:13px;color:#374151;">
            <tr><td style="padding:3px 0;"><strong>Tarih:</strong></td><td>${tarihStr}</td></tr>
            <tr><td style="padding:3px 0;"><strong>Tarayıcı:</strong></td><td>${tarayiciBilgisi || "Bilinmiyor"}</td></tr>
            <tr><td style="padding:3px 0;"><strong>Cihaz / İşletim Sistemi:</strong></td><td>${bilgisayarBilgisi || "Bilinmiyor"}</td></tr>
          </table>
        </div>

        <p style="color:#6b7280;font-size:13px;">Bu talebi siz yapmadıysanız, lütfen derhal yöneticinize bildirin.</p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#9ca3af;font-size:11px;text-align:center;">Güzel Teknoloji Yönetim Paneli &copy; ${simdi.getFullYear()}</p>
      </div>
    `,
  });

  res.json({ basarili: true, mesaj: "Yeni şifreniz e-posta adresinize gönderildi." });
}));

module.exports = router;
