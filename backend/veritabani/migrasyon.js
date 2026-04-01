/* ============================================= */
/*  Guzel Teknoloji - Veritabani Migrasyonu       */
/*  Tablo yapisini yeniler, mevcut verileri       */
/*  yedekleyip geri yukler.                       */
/*                                                */
/*  Kullanim: node veritabani/migrasyon.js        */
/* ============================================= */

require("dotenv").config();
const havuz = require("./baglanti");
const { tablolariSifirla, tablolariOlustur, ornekVerileriEkle } = require("./sema");

async function veriYedekle(tablo, sutunlar) {
  try {
    const [satirlar] = await havuz.query(`SELECT ${sutunlar} FROM ${tablo}`);
    return satirlar || [];
  } catch (_) {
    return [];
  }
}

(async () => {
  try {
    console.log("\n========================================");
    console.log("  VERITABANI MIGRASYONU");
    console.log("========================================\n");

    /* 1. Mevcut verileri yedekle */
    console.log("[1/5] Mevcut veriler yedekleniyor...");

    const kullanicilar = await veriYedekle("kullanicilar", "*");
    console.log(`  kullanicilar   : ${kullanicilar.length} kayit`);

    const urunGruplari = await veriYedekle("urun_gruplari", "*");
    console.log(`  urun_gruplari  : ${urunGruplari.length} kayit`);

    const urunler = await veriYedekle("urunler", "*");
    console.log(`  urunler        : ${urunler.length} kayit`);

    const paketler = await veriYedekle("paketler", "*");
    console.log(`  paketler       : ${paketler.length} kayit`);

    /* 2. Tablolari sil */
    console.log("\n[2/5] Eski tablolar siliniyor...");
    await tablolariSifirla();

    /* 3. Yeni tablolari olustur */
    console.log("\n[3/5] Yeni tablolar olusturuluyor...");
    await tablolariOlustur();

    /* 4. Yedeklenen verileri geri yukle */
    console.log("\n[4/5] Veriler geri yukleniyor...");

    for (const k of kullanicilar) {
      await havuz.query(
        `INSERT INTO kullanicilar (id, kullanici_adi, sifre_hash, ad_soyad, eposta, rol, aktif, olusturma_tarihi, son_giris)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [k.id, k.kullanici_adi, k.sifre_hash, k.ad_soyad, k.eposta, k.rol, k.aktif, k.olusturma_tarihi, k.son_giris]
      );
    }
    console.log(`  kullanicilar   : ${kullanicilar.length} kayit yuklendi`);

    for (const g of urunGruplari) {
      await havuz.query(
        "INSERT INTO urun_gruplari (id, ad, aciklama, aktif) VALUES (?, ?, ?, ?)",
        [g.id, g.ad, g.aciklama || null, g.aktif !== undefined ? g.aktif : 1]
      );
    }
    console.log(`  urun_gruplari  : ${urunGruplari.length} kayit yuklendi`);

    for (const u of urunler) {
      await havuz.query(
        "INSERT INTO urunler (id, grup_id, ad, urun_tipi, uygulama_tipi, ozel_proje, aktif) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [u.id, u.grup_id, u.ad, u.urun_tipi, u.uygulama_tipi, u.ozel_proje, u.aktif]
      );
    }
    console.log(`  urunler        : ${urunler.length} kayit yuklendi`);

    for (const p of paketler) {
      await havuz.query(
        "INSERT INTO paketler (id, urun_id, ad, tipi, kullanim_gunu, fiyat, kullanici_sayisi, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [p.id, p.urun_id, p.ad, p.tipi, p.kullanim_gunu, p.fiyat, p.kullanici_sayisi, p.aktif]
      );
    }
    console.log(`  paketler       : ${paketler.length} kayit yuklendi`);

    /* AUTO_INCREMENT degerlerini ayarla */
    const tabloVeri = [
      ["kullanicilar", kullanicilar],
      ["urun_gruplari", urunGruplari],
      ["urunler", urunler],
      ["paketler", paketler],
    ];
    for (const [tablo, veri] of tabloVeri) {
      if (veri.length > 0) {
        const maxId = Math.max(...veri.map(v => v.id));
        await havuz.query(`ALTER TABLE ${tablo} AUTO_INCREMENT = ${maxId + 1}`);
      }
    }

    /* 5. Dogrulama */
    console.log("\n[5/5] Dogrulama...");
    const tablolar = [
      "roller", "sektorler", "kullanicilar",
      "musteriler", "musteri_telefonlari", "musteri_adresleri", "musteri_dosyalar",
      "bayiler", "bayi_dosyalar",
      "urun_gruplari", "urunler", "paketler",
      "lisanslar", "surumler", "notlar", "iletisim_kayitlari",
      "aktivite_loglari", "yedekleme_loglari",
    ];
    for (const t of tablolar) {
      const [[r]] = await havuz.query(`SELECT COUNT(*) as c FROM ${t}`);

      /* FK bilgisini goster */
      const [fkler] = await havuz.query(`
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [t]);
      const fkSayisi = fkler.length;

      /* Index bilgisini goster */
      const [indexler] = await havuz.query(`SHOW INDEX FROM ${t} WHERE Key_name != 'PRIMARY'`);
      const benzersizIndexler = [...new Set(indexler.map(i => i.Key_name))];

      console.log(`  ${t.padEnd(24)} ${String(r.c).padStart(3)} kayit | ${fkSayisi} FK | ${benzersizIndexler.length} INDEX`);
    }

    console.log("\n========================================");
    console.log("  MIGRASYON BASARIYLA TAMAMLANDI");
    console.log("========================================\n");
    process.exit(0);
  } catch (hata) {
    console.error("\n[HATA] Migrasyon basarisiz:", hata.message);
    process.exit(1);
  }
})();
