const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { hataYakala, dogrulamaHatasi } = require("../yardimcilar/hata-yonetimi");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_KULLANICI || "", pass: process.env.SMTP_SIFRE || "" },
});

/* ---- Şifremi Unuttum / Patrona Bildirim ---- */
router.post("/sifremi-unuttum", hataYakala(async (req, res) => {
  const { gonderen, mesaj } = req.body;
  if (!mesaj || !mesaj.trim()) return dogrulamaHatasi(res, "Mesaj boş olamaz.");

  const hedefEposta = process.env.PATRON_EPOSTA || "";

  if (!hedefEposta) return dogrulamaHatasi(res, "PATRON_EPOSTA ortam değişkeni tanımlanmamış.");

  if (!process.env.SMTP_KULLANICI || !process.env.SMTP_SIFRE) {
    console.log(`[Mail Bildirimi] Gönderen: ${gonderen || "Bilinmeyen"}`);
    console.log(`[Mail Bildirimi] Mesaj: ${mesaj}`);
    console.log(`[Mail Bildirimi] SMTP ayarları yapılandırılmadığı için mail gönderilemedi.`);
    return res.json({ basarili: true, mesaj: "Bildiriminiz kaydedildi. SMTP ayarları yapılandırıldığında e-posta olarak da gönderilecektir." });
  }

  await transporter.sendMail({
    from: process.env.SMTP_KULLANICI,
    to: hedefEposta,
    subject: "Güzel Teknoloji - Şifre Sıfırlama Talebi",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1e40af;margin-bottom:16px;">🔑 Şifre Sıfırlama Talebi</h2>
        <p style="color:#374151;"><strong>Gönderen:</strong> ${gonderen || "Belirtilmemiş"}</p>
        <div style="background:#f9fafb;padding:12px;border-radius:8px;margin:12px 0;">
          <p style="color:#374151;margin:0;">${mesaj.replace(/\n/g, "<br>")}</p>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
        <p style="color:#9ca3af;font-size:12px;">Güzel Teknoloji Yönetim Paneli</p>
      </div>
    `,
  });

  res.json({ basarili: true, mesaj: "E-posta başarıyla gönderildi." });
}));

/* ---- Patron E-postasını Getir ---- */
router.get("/patron-eposta", (req, res) => {
  res.json({ eposta: process.env.PATRON_EPOSTA || "" });
});

module.exports = router;
