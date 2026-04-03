const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// BigInt ve Decimal degerlerini JSON-uyumlu hale getirir
function temizle(veri) {
  if (veri === null || veri === undefined) return veri;
  if (typeof veri === "bigint") return Number(veri);
  if (veri instanceof Date) return veri;
  if (typeof veri === "object" && typeof veri.toNumber === "function")
    return veri.toNumber();
  if (Array.isArray(veri)) return veri.map(temizle);
  if (typeof veri !== "object") return veri;

  const sonuc = {};
  for (const [k, v] of Object.entries(veri)) {
    sonuc[k] = temizle(v);
  }
  return sonuc;
}

module.exports = { prisma, temizle };
