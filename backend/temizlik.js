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
    "aktivite_loglari",
    "yedekleme_loglari",
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
    "paket_tipleri",
    "musteriler",
    "bayiler",
    "sektorler",
    // roller ve kullanicilar korunabilir, istersen bunları da aç:
    // "kullanicilar",
    // "roller",
  ];

  for (const tablo of tablolar) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${tablo}\``);
      console.log(`  ✅ ${tablo} — temizlendi (ID sıfırlandı)`);
    } catch (err) {
      console.log(`  ⚠️  ${tablo} — ${err.message}`);
    }
  }

  // FK kısıtlamalarını geri aç
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");

  console.log("\n✅ TEMİZLİK TAMAMLANDI! (Tüm ID'ler 1'den başlayacak)\n");
  console.log("Not: Kullanıcılar ve roller korundu.");
  console.log("Onları da silmek istersen scriptte yorum satırlarını kaldır.\n");
}

temizle()
  .catch((e) => {
    console.error("❌ Hata:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
