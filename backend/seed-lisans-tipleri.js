// =============================================
// Varsayılan Lisans Tipleri Seed Scripti
// 4 adet varsayılan lisans tipi oluşturur
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const VARSAYILAN_LISANS_TIPLERI = [
  { ad: "Demo",         kod: "demo",         renk: "gray",    gun: 30,  suresiz: 0, sira: 1 },
  { ad: "Standart",     kod: "standart",     renk: "blue",    gun: 365, suresiz: 0, sira: 2 },
  { ad: "Profesyonel",  kod: "profesyonel",  renk: "purple",  gun: 365, suresiz: 0, sira: 3 },
  { ad: "Süresiz",      kod: "suresiz",      renk: "emerald", gun: 0,   suresiz: 1, sira: 4 },
];

async function main() {
  console.log("\n🚀 Varsayılan Lisans Tipleri seed başlıyor...\n");

  for (const tip of VARSAYILAN_LISANS_TIPLERI) {
    const mevcut = await prisma.lisansTipi.findUnique({ where: { kod: tip.kod } });
    if (mevcut) {
      console.log(`  ⏭  "${tip.ad}" zaten mevcut (id: ${mevcut.id})`);
    } else {
      const yeni = await prisma.lisansTipi.create({ data: tip });
      console.log(`  ✅ "${tip.ad}" oluşturuldu (id: ${yeni.id})`);
    }
  }

  console.log("\n✅ Lisans tipleri seed tamamlandı!\n");
}

main()
  .catch((e) => { console.error("❌ Hata:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
