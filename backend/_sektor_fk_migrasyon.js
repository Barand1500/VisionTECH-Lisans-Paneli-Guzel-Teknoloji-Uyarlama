/* ============================================= */
/*  Sektör FK Migrasyonu                          */
/*  musteriler.sektor VARCHAR → sektor_id INT FK  */
/*  bayiler.sektor VARCHAR → sektor_id INT FK     */
/* ============================================= */

const havuz = require("./veritabani/baglanti");

async function migrasyonCalistir() {
  const conn = await havuz.getConnection();
  try {
    await conn.beginTransaction();

    /* ---- 1. musteriler tablosuna sektor_id sütunu ekle ---- */
    const [musteriKolonlar] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'sektor_id'"
    );
    if (musteriKolonlar.length === 0) {
      console.log("[Migrasyon] musteriler.sektor_id sütunu ekleniyor...");
      await conn.query("ALTER TABLE musteriler ADD COLUMN sektor_id INT NULL AFTER sektor");
    } else {
      console.log("[Migrasyon] musteriler.sektor_id zaten mevcut.");
    }

    /* ---- 2. bayiler tablosuna sektor_id sütunu ekle ---- */
    const [bayiKolonlar] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bayiler' AND COLUMN_NAME = 'sektor_id'"
    );
    if (bayiKolonlar.length === 0) {
      console.log("[Migrasyon] bayiler.sektor_id sütunu ekleniyor...");
      await conn.query("ALTER TABLE bayiler ADD COLUMN sektor_id INT NULL AFTER sektor");
    } else {
      console.log("[Migrasyon] bayiler.sektor_id zaten mevcut.");
    }

    /* ---- 3. Mevcut string verileri sektor_id'ye taşı ---- */
    console.log("[Migrasyon] Mevcut sektör verileri taşınıyor...");
    await conn.query(
      "UPDATE musteriler SET sektor_id = (SELECT id FROM sektorler WHERE sektorler.ad = musteriler.sektor LIMIT 1) WHERE sektor IS NOT NULL AND sektor != '' AND sektor_id IS NULL"
    );
    await conn.query(
      "UPDATE bayiler SET sektor_id = (SELECT id FROM sektorler WHERE sektorler.ad = bayiler.sektor LIMIT 1) WHERE sektor IS NOT NULL AND sektor != '' AND sektor_id IS NULL"
    );

    /* ---- 4. Eski sektor VARCHAR sütunlarını kaldır ---- */
    const [musteriSektorVar] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'sektor'"
    );
    if (musteriSektorVar.length > 0) {
      console.log("[Migrasyon] musteriler.sektor sütunu kaldırılıyor...");
      // Eğer index varsa önce kaldır
      try { await conn.query("ALTER TABLE musteriler DROP INDEX idx_musteriler_sektor"); } catch (e) { /* index yoksa sorun yok */ }
      await conn.query("ALTER TABLE musteriler DROP COLUMN sektor");
    }

    const [bayiSektorVar] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bayiler' AND COLUMN_NAME = 'sektor'"
    );
    if (bayiSektorVar.length > 0) {
      console.log("[Migrasyon] bayiler.sektor sütunu kaldırılıyor...");
      try { await conn.query("ALTER TABLE bayiler DROP INDEX idx_bayiler_sektor"); } catch (e) { /* index yoksa sorun yok */ }
      await conn.query("ALTER TABLE bayiler DROP COLUMN sektor");
    }

    /* ---- 5. FK constraint ekle ---- */
    const [musteriFK] = await conn.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND CONSTRAINT_NAME = 'fk_musteriler_sektor'"
    );
    if (musteriFK.length === 0) {
      console.log("[Migrasyon] musteriler.sektor_id FK ekleniyor...");
      await conn.query(
        "ALTER TABLE musteriler ADD CONSTRAINT fk_musteriler_sektor FOREIGN KEY (sektor_id) REFERENCES sektorler(id) ON DELETE SET NULL ON UPDATE CASCADE"
      );
    }

    const [bayiFK] = await conn.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bayiler' AND CONSTRAINT_NAME = 'fk_bayiler_sektor'"
    );
    if (bayiFK.length === 0) {
      console.log("[Migrasyon] bayiler.sektor_id FK ekleniyor...");
      await conn.query(
        "ALTER TABLE bayiler ADD CONSTRAINT fk_bayiler_sektor FOREIGN KEY (sektor_id) REFERENCES sektorler(id) ON DELETE SET NULL ON UPDATE CASCADE"
      );
    }

    /* ---- 6. Index ekle ---- */
    try { await conn.query("ALTER TABLE musteriler ADD INDEX idx_musteriler_sektor_id (sektor_id)"); } catch (e) { /* zaten varsa ignore */ }
    try { await conn.query("ALTER TABLE bayiler ADD INDEX idx_bayiler_sektor_id (sektor_id)"); } catch (e) { /* zaten varsa ignore */ }

    await conn.commit();
    console.log("[Migrasyon] ✅ Sektör FK migrasyonu başarıyla tamamlandı.");
  } catch (err) {
    await conn.rollback();
    console.error("[Migrasyon] ❌ Hata:", err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrasyonCalistir();
