const mysql = require("mysql2/promise");

(async () => {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "May.Baran00",
    database: "guzel_teknoloji",
  });

  console.log("=== MIGRASYON BASLADI ===\n");

  // 2. kullanicilar.rol FK -> roller.ad
  try {
    await db.query(
      "ALTER TABLE kullanicilar ADD CONSTRAINT fk_kullanicilar_rol FOREIGN KEY (rol) REFERENCES roller(ad) ON UPDATE CASCADE ON DELETE RESTRICT"
    );
    console.log("[2] kullanicilar.rol -> roller.ad FK eklendi");
  } catch (e) {
    console.log("[2] FK:", e.message);
  }

  // 3. lisanslar.kullanici -> kullanici_sayisi
  try {
    await db.query(
      "ALTER TABLE lisanslar CHANGE COLUMN kullanici kullanici_sayisi INT NOT NULL DEFAULT 1"
    );
    console.log("[3] lisanslar.kullanici -> kullanici_sayisi yeniden adlandirildi");
  } catch (e) {
    console.log("[3] Rename:", e.message);
  }

  // 4. musteriler.durum ENUM kucuk harf
  try {
    await db.query("UPDATE musteriler SET durum = LOWER(durum)");
    await db.query(
      "ALTER TABLE musteriler MODIFY COLUMN durum ENUM('aktif','pasif') NOT NULL DEFAULT 'aktif'"
    );
    console.log("[4] musteriler.durum ENUM kucuk harfe donusturuldu");
  } catch (e) {
    console.log("[4] Durum:", e.message);
  }

  // 5. guncelleme_tarihi ON UPDATE CURRENT_TIMESTAMP
  try {
    await db.query(
      "ALTER TABLE musteriler MODIFY COLUMN guncelleme_tarihi DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP"
    );
    console.log("[5a] musteriler.guncelleme_tarihi auto-update eklendi");
  } catch (e) {
    console.log("[5a]:", e.message);
  }
  try {
    await db.query(
      "ALTER TABLE bayiler MODIFY COLUMN guncelleme_tarihi DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP"
    );
    console.log("[5b] bayiler.guncelleme_tarihi auto-update eklendi");
  } catch (e) {
    console.log("[5b]:", e.message);
  }

  // 6. Soft delete - silinme_tarihi kolonu ekle
  const softDeleteTablolar = ["musteriler", "bayiler", "kullanicilar"];
  for (const tbl of softDeleteTablolar) {
    try {
      await db.query(
        `ALTER TABLE ${tbl} ADD COLUMN silinme_tarihi DATETIME NULL DEFAULT NULL`
      );
      await db.query(
        `CREATE INDEX idx_${tbl}_silinme ON ${tbl}(silinme_tarihi)`
      );
      console.log(`[6] ${tbl}.silinme_tarihi eklendi + index`);
    } catch (e) {
      console.log(`[6] ${tbl}: ${e.message}`);
    }
  }

  console.log("\n=== MIGRASYON TAMAMLANDI ===\n");

  // Dogrulama
  const [cols] = await db.query("DESCRIBE lisanslar");
  console.log("lisanslar kolonlari:", cols.map((c) => c.Field).join(", "));

  const [cols2] = await db.query("DESCRIBE musteriler");
  const durumCol = cols2.find((c) => c.Field === "durum");
  console.log("musteriler.durum:", durumCol.Type);
  const silinmeCol = cols2.find((c) => c.Field === "silinme_tarihi");
  console.log("musteriler.silinme_tarihi:", silinmeCol ? "MEVCUT" : "YOK");

  const [cols3] = await db.query("DESCRIBE kullanicilar");
  const rolCol = cols3.find((c) => c.Field === "rol");
  console.log("kullanicilar.rol:", rolCol.Type, rolCol.Key);

  // FK kontrolu
  const [fks] = await db.query(
    "SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_NAME='kullanicilar'",
    ["guzel_teknoloji"]
  );
  console.log("\nkullanicilar FK'lar:");
  fks.forEach((f) =>
    console.log(`  ${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME}`)
  );

  await db.end();
})().catch((e) => console.error(e));
