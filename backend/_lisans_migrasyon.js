/* ============================================= */
/*  Lisans Tablosu Migrasyon                     */
/*  Yeni alanlar ekler: bayi, odeme, moduller    */
/*  Calistirmak icin: node _lisans_migrasyon.js  */
/* ============================================= */

require("dotenv").config();
const havuz = require("./veritabani/baglanti");

async function migrasyonuCalistir() {
  console.log("Lisans tablosu migrasyonu basliyor...\n");

  try {
    /* ---- Bayi ID kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN bayi_id INT NULL AFTER paket_id`);
      console.log("✓ bayi_id kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- bayi_id zaten var");
      else throw e;
    }

    /* ---- Lisans Tipi kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN lisans_tipi ENUM('demo','standart','profesyonel','enterprise') NOT NULL DEFAULT 'standart' AFTER lisans_anahtari`);
      console.log("✓ lisans_tipi kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- lisans_tipi zaten var");
      else throw e;
    }

    /* ---- Kullanim Gunu kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN kullanim_gunu INT NOT NULL DEFAULT 365 AFTER bitis_tarihi`);
      console.log("✓ kullanim_gunu kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- kullanim_gunu zaten var");
      else throw e;
    }

    /* ---- Fatura Tarihi kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN fatura_tarihi DATE NULL AFTER fatura_no`);
      console.log("✓ fatura_tarihi kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- fatura_tarihi zaten var");
      else throw e;
    }

    /* ---- Indirim Orani kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN indirim_orani DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER fiyat`);
      console.log("✓ indirim_orani kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- indirim_orani zaten var");
      else throw e;
    }

    /* ---- Indirim Tutari kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN indirim_tutari DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER indirim_orani`);
      console.log("✓ indirim_tutari kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- indirim_tutari zaten var");
      else throw e;
    }

    /* ---- Net Tutar kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN net_tutar DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER indirim_tutari`);
      console.log("✓ net_tutar kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- net_tutar zaten var");
      else throw e;
    }

    /* ---- Odeme Yontemi kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN odeme_yontemi ENUM('nakit','havale','eft','kredi_karti','cek','senet','diger') NULL AFTER net_tutar`);
      console.log("✓ odeme_yontemi kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- odeme_yontemi zaten var");
      else throw e;
    }

    /* ---- Odeme Durumu kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN odeme_durumu ENUM('odenmedi','kismi','odendi') NOT NULL DEFAULT 'odenmedi' AFTER odeme_yontemi`);
      console.log("✓ odeme_durumu kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- odeme_durumu zaten var");
      else throw e;
    }

    /* ---- Odenen Tutar kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN odenen_tutar DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER odeme_durumu`);
      console.log("✓ odenen_tutar kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- odenen_tutar zaten var");
      else throw e;
    }

    /* ---- Ek Kullanici kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN ek_kullanici INT NOT NULL DEFAULT 0 AFTER kullanici_sayisi`);
      console.log("✓ ek_kullanici kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- ek_kullanici zaten var");
      else throw e;
    }

    /* ---- MAC Adresi kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN mac_adresi VARCHAR(255) NULL AFTER ek_kullanici`);
      console.log("✓ mac_adresi kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- mac_adresi zaten var");
      else throw e;
    }

    /* ---- IP Adresi kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN ip_adresi VARCHAR(100) NULL AFTER mac_adresi`);
      console.log("✓ ip_adresi kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- ip_adresi zaten var");
      else throw e;
    }

    /* ---- Moduller kolonu (JSON) ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN moduller JSON NULL AFTER ip_adresi`);
      console.log("✓ moduller kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- moduller zaten var");
      else throw e;
    }

    /* ---- Otomatik Yenileme kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN otomatik_yenileme TINYINT(1) NOT NULL DEFAULT 0 AFTER moduller`);
      console.log("✓ otomatik_yenileme kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- otomatik_yenileme zaten var");
      else throw e;
    }

    /* ---- Bildirim Gun kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN bildirim_gun INT NOT NULL DEFAULT 30 AFTER otomatik_yenileme`);
      console.log("✓ bildirim_gun kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- bildirim_gun zaten var");
      else throw e;
    }

    /* ---- Notlar kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN notlar TEXT NULL AFTER bildirim_gun`);
      console.log("✓ notlar kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- notlar zaten var");
      else throw e;
    }

    /* ---- Guncelleme Tarihi kolonu ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD COLUMN guncelleme_tarihi DATETIME NULL ON UPDATE CURRENT_TIMESTAMP AFTER olusturma_tarihi`);
      console.log("✓ guncelleme_tarihi kolonu eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") console.log("- guncelleme_tarihi zaten var");
      else throw e;
    }

    /* ---- Foreign Key: bayi_id ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD CONSTRAINT fk_lisanslar_bayi FOREIGN KEY (bayi_id) REFERENCES bayiler(id) ON DELETE SET NULL ON UPDATE CASCADE`);
      console.log("✓ bayi_id FK eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_KEYNAME" || e.code === "ER_FK_DUP_NAME") console.log("- bayi_id FK zaten var");
      else throw e;
    }

    /* ---- Indexler ---- */
    try {
      await havuz.query(`ALTER TABLE lisanslar ADD INDEX idx_lisanslar_bayi (bayi_id)`);
      console.log("✓ bayi_id index eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_KEYNAME") console.log("- bayi_id index zaten var");
      else throw e;
    }

    try {
      await havuz.query(`ALTER TABLE lisanslar ADD INDEX idx_lisanslar_lisans_tipi (lisans_tipi)`);
      console.log("✓ lisans_tipi index eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_KEYNAME") console.log("- lisans_tipi index zaten var");
      else throw e;
    }

    try {
      await havuz.query(`ALTER TABLE lisanslar ADD INDEX idx_lisanslar_odeme_durumu (odeme_durumu)`);
      console.log("✓ odeme_durumu index eklendi");
    } catch (e) {
      if (e.code === "ER_DUP_KEYNAME") console.log("- odeme_durumu index zaten var");
      else throw e;
    }

    /* ---- Mevcut satirlarda net_tutar guncelle ---- */
    await havuz.query(`UPDATE lisanslar SET net_tutar = fiyat WHERE net_tutar = 0 AND fiyat > 0`);
    console.log("✓ Mevcut kayitlarda net_tutar guncellendi");

    console.log("\n✓ Migrasyon tamamlandi!");

  } catch (hata) {
    console.error("\n✗ Migrasyon hatasi:", hata.message);
    process.exit(1);
  }

  process.exit(0);
}

migrasyonuCalistir();
