// =============================================
// VERİTABANI TEMİZLEME SCRIPTI
// Tüm verileri siler, tabloları korur
// Kullanım: node temizlik.js
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function temizle() {
  console.log("\n🧹 VERİTABANI TEMİZLİĞİ BAŞLIYOR...\n");
  console.log("=".repeat(50));
  console.log("⚠️  DİKKAT: Tüm veriler silinecek!");
  console.log("=".repeat(50));

  // Sıralı silme (foreign key ilişkileri nedeniyle önemli)
  const silmeSirasi = [
    // Önce bağımlı tablolar
    { model: "aktiviteLog", ad: "Aktivite Logları" },
    { model: "lisans", ad: "Lisanslar" },
    { model: "paket", ad: "Paketler" },
    { model: "surum", ad: "Sürümler" },
    { model: "bayiUrun", ad: "Bayi Ürünleri" },
    { model: "bayiDosya", ad: "Bayi Dosyaları" },
    { model: "urun", ad: "Ürünler" },
    { model: "sablonOzellik", ad: "Şablon Özellikleri" },
    { model: "urunSablon", ad: "Ürün Şablonları" },
    { model: "uygulamaTipi", ad: "Uygulama Tipleri" },
    { model: "urunTipi", ad: "Ürün Tipleri" },
    { model: "iletisimKisi", ad: "İletişim Kişileri" },
    { model: "iletisimKaydi", ad: "İletişim Kayıtları" },
    { model: "noti", ad: "Notlar" },
    { model: "musteriDosya", ad: "Müşteri Dosyaları" },
    { model: "musteriAdres", ad: "Müşteri Adresleri" },
    { model: "musteriTelefon", ad: "Müşteri Telefonları" },
    { model: "musteri", ad: "Müşteriler" },
    { model: "bayi", ad: "Bayiler" },
    { model: "urunGrubu", ad: "Ürün Grupları" },
    { model: "paketTipi", ad: "Paket Tipleri" },
    { model: "lisansTipi", ad: "Lisans Tipleri" },
    { model: "sektor", ad: "Sektörler" },
    { model: "rol", ad: "Roller" },
    { model: "yetki", ad: "Yetkiler" },
    // Kullanıcıları silme (isteğe bağlı - yorumdan çıkar)
    // { model: "kullanici", ad: "Kullanıcılar" },
  ];

  let toplamSilinen = 0;

  for (const item of silmeSirasi) {
    try {
      if (prisma[item.model]) {
        const count = await prisma[item.model].deleteMany({});
        if (count.count > 0) {
          console.log(`   ✓ ${item.ad}: ${count.count} kayıt silindi`);
          toplamSilinen += count.count;
        } else {
          console.log(`   - ${item.ad}: Zaten boş`);
        }
      }
    } catch (e) {
      console.log(`   ⚠ ${item.ad}: Atlandı (${e.message.slice(0, 50)}...)`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ TEMİZLİK TAMAMLANDI");
  console.log("=".repeat(50));
  console.log(`
📊 Özet:
   • Toplam silinen kayıt: ${toplamSilinen}
   • Veritabanı artık temiz!

💡 İpucu: Örnek veri eklemek için:
   node seed-vega.js
`);
}

// Script'i çalıştır
temizle()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
