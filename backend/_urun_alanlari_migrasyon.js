/* ============================================= */
/*  Ürünler Tablosu - Yeni Alanlar Migrasyonu    */
/*                                                */
/*  Eklenen alanlar:                              */
/*  - aciklama: Ürün açıklaması                  */
/*  - min_kullanici: Minimum kullanıcı sayısı    */
/*  - max_kullanici: Maksimum kullanıcı sayısı   */
/*  - demo_gun: Demo süresi (gün)                */
/*  - temel_fiyat: Temel fiyat                   */
/*  - versiyon: Varsayılan versiyon              */
/*  - logo_url: Logo URL'i                       */
/*  - ozellikler: Özellikler (JSON)              */
/* ============================================= */

require("dotenv").config();
const havuz = require("./veritabani/baglanti");

async function migrasyonuCalistir() {
  console.log("Ürünler tablosu migrasyon başlatılıyor...");
  
  try {
    // Mevcut sütunları kontrol et
    const [sutunlar] = await havuz.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'urunler'
    `);
    const mevcutSutunlar = sutunlar.map(s => s.COLUMN_NAME);
    console.log("Mevcut sütunlar:", mevcutSutunlar);

    // Eklenmesi gereken sütunlar
    const yeniSutunlar = [
      { ad: "varsayilan_gun", tip: "INT NOT NULL DEFAULT 365", sonra: "uygulama_tipi" },
      { ad: "aciklama", tip: "TEXT NULL", sonra: "ad" },
      { ad: "min_kullanici", tip: "INT NOT NULL DEFAULT 1", sonra: "varsayilan_gun" },
      { ad: "max_kullanici", tip: "INT NULL", sonra: "min_kullanici" },
      { ad: "demo_gun", tip: "INT NOT NULL DEFAULT 30", sonra: "max_kullanici" },
      { ad: "temel_fiyat", tip: "DECIMAL(10,2) NOT NULL DEFAULT 0.00", sonra: "demo_gun" },
      { ad: "versiyon", tip: "VARCHAR(50) NULL", sonra: "temel_fiyat" },
      { ad: "logo_url", tip: "VARCHAR(500) NULL", sonra: "versiyon" },
      { ad: "ozellikler", tip: "JSON NULL", sonra: "logo_url" }
    ];

    for (const sutun of yeniSutunlar) {
      if (!mevcutSutunlar.includes(sutun.ad)) {
        console.log(`  ${sutun.ad} sütunu ekleniyor...`);
        await havuz.query(`
          ALTER TABLE urunler 
          ADD COLUMN ${sutun.ad} ${sutun.tip} AFTER ${sutun.sonra}
        `);
        console.log(`  ✓ ${sutun.ad} eklendi.`);
      } else {
        console.log(`  → ${sutun.ad} zaten mevcut, atlandı.`);
      }
    }

    console.log("\n✓ Migrasyon başarıyla tamamlandı!");
    process.exit(0);
  } catch (hata) {
    console.error("Migrasyon hatası:", hata);
    process.exit(1);
  }
}

migrasyonuCalistir();
