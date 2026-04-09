/* Kullanıcı seed - ercan@guzelteknoloji.com / 123456 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const sifre = await bcrypt.hash("123456", 10);

  // Önce roller tablosunda "admin" rolü var mı kontrol et
  let rol = await prisma.rol.findFirst({ where: { ad: "admin" } });
  if (!rol) {
    rol = await prisma.rol.create({ data: { ad: "admin", aciklama: "Yönetici", aktif: 1, izinler: JSON.stringify(["*"]) } });
    console.log("Admin rolü oluşturuldu:", rol.id);
  }

  // Kullanıcıyı oluştur veya güncelle
  const mevcut = await prisma.kullanici.findFirst({ where: { eposta: "ercan@guzelteknoloji.com" } });
  if (mevcut) {
    await prisma.kullanici.update({
      where: { id: mevcut.id },
      data: { sifre_hash: sifre, aktif: 1, rol: "admin" },
    });
    console.log("Kullanıcı güncellendi:", mevcut.id);
  } else {
    const yeni = await prisma.kullanici.create({
      data: {
        kullanici_adi: "ercan",
        sifre_hash: sifre,
        ad_soyad: "Ercan Güzel Teknoloji",
        eposta: "ercan@guzelteknoloji.com",
        rol: "admin",
        aktif: 1,
      },
    });
    console.log("Kullanıcı oluşturuldu:", yeni.id);
  }
}

main()
  .catch((e) => { console.error("Hata:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
