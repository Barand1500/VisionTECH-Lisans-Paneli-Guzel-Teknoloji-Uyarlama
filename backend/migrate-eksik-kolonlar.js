// =============================================
// EKSİK KOLONLARI EKLE
// urunler.para_birimi + paketler.lisans_tipi_id
// Kullanım: node migrate-eksik-kolonlar.js
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrate() {
  console.log("\n🔧 EKSİK KOLONLAR EKLENİYOR...\n");

  // 1) urunler.para_birimi
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE urunler ADD COLUMN para_birimi VARCHAR(10) NOT NULL DEFAULT 'TL'
    `);
    console.log("  ✅ urunler.para_birimi eklendi");
  } catch (e) {
    if (e.message.includes("Duplicate column")) {
      console.log("  ⏭️  urunler.para_birimi zaten var");
    } else {
      console.error("  ❌ urunler.para_birimi:", e.message);
    }
  }

  // 2) paketler.lisans_tipi_id
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE paketler ADD COLUMN lisans_tipi_id INT NULL
    `);
    console.log("  ✅ paketler.lisans_tipi_id eklendi");
  } catch (e) {
    if (e.message.includes("Duplicate column")) {
      console.log("  ⏭️  paketler.lisans_tipi_id zaten var");
    } else {
      console.error("  ❌ paketler.lisans_tipi_id:", e.message);
    }
  }

  // 3) FK index + constraint for paketler.lisans_tipi_id
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE paketler ADD INDEX idx_paketler_lisans_tipi_id (lisans_tipi_id)
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE paketler ADD CONSTRAINT fk_paketler_lisans_tipi
      FOREIGN KEY (lisans_tipi_id) REFERENCES lisans_tipleri(id)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("  ✅ paketler.lisans_tipi_id FK eklendi");
  } catch (e) {
    if (e.message.includes("Duplicate")) {
      console.log("  ⏭️  FK zaten var");
    } else {
      console.error("  ⚠️  FK:", e.message);
    }
  }

  console.log("\n✅ MİGRASYON TAMAMLANDI!\n");
  console.log("Şimdi çalıştır: pm2 restart guzel-teknoloji\n");
}

migrate()
  .catch((e) => {
    console.error("❌ Hata:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
