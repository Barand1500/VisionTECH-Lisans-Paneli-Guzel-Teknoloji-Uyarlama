// =============================================
// VERİTABANI TEMİZLEME SCRIPTI
// Tüm verileri siler, tabloları korur
// Kullanım: node temizlik.js
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function temizle() {
  console.log("\n🧹 VERİTABANI TEMİZLİĞİ BAŞLIYOR...\n");

  // FK kısıtlamalarını geçici kapat
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");

  // Silme sırası: önce bağımlı tablolar, sonra ana tablolar
  const tablolar = [
    "aktivite_log",
    "yedekleme_log",
    "iletisim_kayitlari",
    "iletisim_kisileri",
    "notlar",
    "musteri_telefonlari",
    "musteri_adresleri",
    "musteri_dosyalar",
    "bayi_dosyalar",
    "bayi_urunler",
    "sablon_ozellikleri",
    "lisanslar",
    "surumler",
    "paketler",
    "urunler",
    "urun_sablonlari",
    "uygulama_tipleri",
    "urun_tipleri",
    "urun_gruplari",
    "lisans_tipleri",
    "musteriler",
    "bayiler",
    "sektorler",
    // roller ve kullanicilar korunabilir, istersen bunları da aç:
    // "kullanicilar",
    // "roller",
  ];

  for (const tablo of tablolar) {
    try {
      const sonuc = await prisma.$executeRawUnsafe(`DELETE FROM \`${tablo}\``);
      console.log(`  ✅ ${tablo} — ${sonuc} kayıt silindi`);
    } catch (err) {
      console.log(`  ⚠️  ${tablo} — ${err.message}`);
    }
  }

  // Auto-increment sıfırla
  console.log("\n🔄 Auto-increment sıfırlanıyor...\n");
  for (const tablo of tablolar) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`${tablo}\` AUTO_INCREMENT = 1`);
    } catch (_) {}
  }

  // FK kısıtlamalarını geri aç
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");

  console.log("\n✅ TEMİZLİK TAMAMLANDI!\n");
  console.log("Not: Kullanıcılar ve roller korundu.");
  console.log("Onları da silmek istersen scriptte yorum satırlarını kaldır.\n");
}

temizle()
  .catch((e) => {
    console.error("❌ Hata:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
