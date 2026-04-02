/* ============================================= */
/*  Veritabani Temizlik Migrasyonu                */
/*  Tum tablolari sifirlar, semayi yeniden        */
/*  olusturur ve varsayilan verileri ekler.        */
/*  Ayrica lisans_tipleri tablosu ve ALTER islemleri*/
/*  yapilir.                                       */
/*                                                 */
/*  Kullanim: node _temizlik_migrasyon.js          */
/* ============================================= */

require("dotenv").config();
const havuz = require("./veritabani/baglanti");
const { tablolariOlustur, tablolariSifirla, ornekVerileriEkle } = require("./veritabani/sema");

async function temizlikYap() {
  console.log("=== VERITABANI TEMIZLIK MIGRASYONU ===");
  console.log("Tum veriler silinecek ve sifirlanacak!\n");

  try {
    /* 1. Tum tablolari sil */
    console.log("[1/4] Tablolar siliniyor...");
    await tablolariSifirla();

    /* 2. Tablolari yeniden olustur (lisans_tipleri dahil) */
    console.log("[2/4] Tablolar yeniden olusturuluyor...");
    await tablolariOlustur();

    /* 3. lisanslar.lisans_tipi kolonunu VARCHAR'a cevir (ENUM yerine) */
    console.log("[3/4] lisanslar.lisans_tipi kolonu ALTER ediliyor...");
    try {
      await havuz.query(`
        ALTER TABLE lisanslar 
        MODIFY COLUMN lisans_tipi VARCHAR(100) NOT NULL DEFAULT 'standart'
      `);
      console.log("  -> lisans_tipi kolonu VARCHAR(100) olarak guncellendi.");
    } catch (e) {
      /* Zaten VARCHAR ise hata verebilir, devam et */
      console.log("  -> lisans_tipi kolonu zaten uygun formatta veya hata:", e.message);
    }

    /* 4. Varsayilan verileri ekle */
    console.log("[4/4] Varsayilan veriler ekleniyor...");
    await ornekVerileriEkle();

    console.log("\n=== TEMIZLIK TAMAMLANDI ===");
    console.log("Veritabani sifirdan olusturuldu.");
    console.log("Varsayilan kullanici: ercan@guzelteknoloji.com / 123456");
    process.exit(0);
  } catch (hata) {
    console.error("\n[HATA] Temizlik basarisiz:", hata.message);
    process.exit(1);
  }
}

temizlikYap();
