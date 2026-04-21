require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    // bayi_id kolonu var mı kontrol et
    const kolonlar = await prisma.$queryRawUnsafe(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'bayi_id'`
    );
    if (kolonlar.length > 0) {
      console.log("bayi_id kolonu zaten mevcut, işlem atlanıyor.");
      return;
    }
    // Kolon ekle
    await prisma.$executeRawUnsafe(`ALTER TABLE musteriler ADD COLUMN bayi_id INT NULL AFTER sektor_id`);
    console.log("bayi_id kolonu eklendi.");
    // Index ekle
    await prisma.$executeRawUnsafe(`ALTER TABLE musteriler ADD INDEX idx_musteriler_bayi_id (bayi_id)`);
    console.log("Index eklendi.");
    // Foreign key ekle
    await prisma.$executeRawUnsafe(`ALTER TABLE musteriler ADD CONSTRAINT musteriler_bayi_id_fkey FOREIGN KEY (bayi_id) REFERENCES bayiler(id) ON DELETE SET NULL ON UPDATE CASCADE`);
    console.log("Foreign key eklendi.");
    console.log("Migration başarılı!");
  } catch (err) {
    console.error("Hata:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
