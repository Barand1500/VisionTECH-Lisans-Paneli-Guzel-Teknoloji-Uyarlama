// =============================================
// Vega Yazılım - Ürün Seed Script v3
// Tam Temizlik + Yeniden Oluşturma
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Ürün seed işlemi başlıyor (v3 - Tam Temizlik)...\n");

  // =============================================
  // 1. MEVCUT VERİLERİ TEMİZLE
  // =============================================
  console.log("🧹 Mevcut veriler temizleniyor...");
  
  // Şablon özelliklerini sil
  const silinenOzellikler = await prisma.sablonOzellik.deleteMany({});
  console.log(`   - ${silinenOzellikler.count} şablon özelliği silindi`);
  
  // Uygulama tiplerini sil (silinme_tarihi null olanlar)
  const silinenUygulamaTipleri = await prisma.uygulamaTipi.deleteMany({
    where: { silinme_tarihi: null }
  });
  console.log(`   - ${silinenUygulamaTipleri.count} uygulama tipi silindi`);
  
  // Ürün tiplerini sil (silinme_tarihi null olanlar)
  const silinenUrunTipleri = await prisma.urunTipi.deleteMany({
    where: { silinme_tarihi: null }
  });
  console.log(`   - ${silinenUrunTipleri.count} ürün tipi silindi`);

  console.log("✅ Temizlik tamamlandı\n");

  // =============================================
  // 2. ÜRÜN GRUPLARI (Markalar) - Zaten var, kontrol et
  // =============================================
  console.log("📦 Ürün Grupları kontrol ediliyor...");
  
  const grupMap = {};
  const mevcutGruplar = await prisma.urunGrubu.findMany({ where: { silinme_tarihi: null } });
  
  for (const g of mevcutGruplar) {
    grupMap[g.ad] = g.id;
  }
  console.log(`✅ ${Object.keys(grupMap).length} ürün grubu mevcut\n`);

  // =============================================
  // 3. ÜRÜN TİPLERİ OLUŞTUR (Her gruba özel)
  // =============================================
  console.log("📦 Ürün Tipleri oluşturuluyor...");
  
  const grupUrunTipleri = {
    "PAVO": ["ÖKC"],
    "INPOS": ["ÖKC"],
    "INGENICO": ["ÖKC"],
    "VEGA": ["ÖKC", "Yazılım"],
    "GIB": ["E-Fatura", "E-Arşiv", "E-İrsaliye", "E-Defter", "E-Mutabakat", "Kombine Paket"],
    "ETIC": ["E-Ticaret"],
    "ANYPAY": ["E-Tahsilat"],
    "METUNIC": ["Domain"],
    "GUZELNET": ["Hosting", "E-Posta"],
    "ARCTOS": ["Paket Program"]
  };

  const tipMap = {};
  let tipCount = 0;
  
  for (const [grupAd, tipler] of Object.entries(grupUrunTipleri)) {
    const grupId = grupMap[grupAd];
    if (!grupId) continue;
    
    for (const tipAd of tipler) {
      const created = await prisma.urunTipi.create({ 
        data: { ad: tipAd, grup_id: grupId } 
      });
      tipMap[`${grupAd}-${tipAd}`] = created.id;
      tipCount++;
    }
  }
  console.log(`✅ ${tipCount} ürün tipi oluşturuldu\n`);

  // =============================================
  // 4. UYGULAMA TİPLERİ OLUŞTUR (Her ürün tipine özel)
  // =============================================
  console.log("📱 Uygulama Tipleri oluşturuluyor...");
  
  const tipUygulamalari = {
    "ÖKC": ["GMU", "TSM"],
    "E-Fatura": ["Web Portal", "Entegrasyon"],
    "E-Arşiv": ["Web Portal", "Entegrasyon"],
    "E-İrsaliye": ["Web Portal", "Entegrasyon"],
    "E-Defter": ["Web Portal"],
    "E-Mutabakat": ["Web Portal"],
    "Kombine Paket": ["Web Portal", "Entegrasyon"],
    "E-Ticaret": ["Web", "Mobil APP"],
    "E-Tahsilat": ["Web", "Mobil APP"],
    "Yazılım": ["Masaüstü", "Web"],
    "Domain": ["Panel"],
    "Hosting": ["Panel"],
    "E-Posta": ["Panel"],
    "Paket Program": ["Masaüstü"]
  };

  const appMap = {};
  let appCount = 0;
  
  // Tüm ürün tiplerini al
  const allTips = await prisma.urunTipi.findMany({ where: { silinme_tarihi: null } });
  
  for (const tip of allTips) {
    const uygulamalar = tipUygulamalari[tip.ad] || [];
    
    for (const appAd of uygulamalar) {
      const created = await prisma.uygulamaTipi.create({
        data: { ad: appAd, urun_tipi_id: tip.id }
      });
      appMap[`${tip.ad}-${appAd}`] = created.id;
      appCount++;
    }
  }
  console.log(`✅ ${appCount} uygulama tipi oluşturuldu\n`);

  // =============================================
  // 5. ŞABLON ÖZELLİKLERİ EKLE
  // =============================================
  console.log("📋 Şablon özellikleri ekleniyor...");
  
  // Doğru özellik tipleri (OZELLIK_TIPLERI'dan):
  // - temel_fiyat (otomatik ekleniyor zaten)
  // - aktivasyon_yenileme
  // - kademeli_fiyat (Kontör Paketi / Paket Tipi için)
  // - kullanici_sayisi
  // - sicil_domain
  // - domain_fiyat
  // - siparis_miktari
  // - demo_suresi
  // - otomatik_yenileme
  
  const sablonOzellikleri = {
    "Yazarkasa POS Lisans": [
      { 
        ozellik_tipi: "sicil_domain", 
        baslik: "Sicil No", 
        deger: { alan_tipi: "sicil_no", zorunlu: true }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "aktivasyon_yenileme", 
        baslik: "Lisans Fiyatları", 
        deger: { aktivasyon_fiyat: 0, yenileme_fiyat: 0, para_birimi: "TL" }, 
        sira: 2 
      }
    ],
    "E-Dönüşüm Temel": [
      { 
        ozellik_tipi: "sicil_domain", 
        baslik: "Vergi No / Sicil", 
        deger: { alan_tipi: "sicil_no", zorunlu: true }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "aktivasyon_yenileme", 
        baslik: "Lisans Fiyatları", 
        deger: { aktivasyon_fiyat: 6100, yenileme_fiyat: 4500, para_birimi: "TL" }, 
        sira: 2 
      }
    ],
    "E-Dönüşüm + Kontör": [
      { 
        ozellik_tipi: "sicil_domain", 
        baslik: "Vergi No / Sicil", 
        deger: { alan_tipi: "sicil_no", zorunlu: true }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "kademeli_fiyat", 
        baslik: "Kontör Paketi", 
        deger: { 
          tip: "adet", 
          birim: "Kontör",
          kademeler: [
            { deger: "250", fiyat: 500 },
            { deger: "500", fiyat: 900 },
            { deger: "1000", fiyat: 1600 }
          ] 
        }, 
        sira: 2 
      }
    ],
    "Web/Mobil Yazılım": [
      { 
        ozellik_tipi: "sicil_domain", 
        baslik: "Domain", 
        deger: { alan_tipi: "domain", zorunlu: true }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "aktivasyon_yenileme", 
        baslik: "Lisans Fiyatları", 
        deger: { aktivasyon_fiyat: 0, yenileme_fiyat: 0, para_birimi: "TL" }, 
        sira: 2 
      }
    ],
    "Kullanıcı Bazlı": [
      { 
        ozellik_tipi: "sicil_domain", 
        baslik: "Domain", 
        deger: { alan_tipi: "domain", zorunlu: true }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "kullanici_sayisi", 
        baslik: "Kullanıcı Sayısı", 
        deger: { min: 1, max: null, ek_kullanici_fiyat: 500 }, 
        sira: 2 
      }
    ],
    "Alan Adı Hizmeti": [
      { 
        ozellik_tipi: "sicil_domain", 
        baslik: "Alan Adı", 
        deger: { alan_tipi: "domain", zorunlu: true }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "domain_fiyat", 
        baslik: "Domain Uzantı Fiyatları", 
        deger: { 
          uzantilar: [
            { uzanti: ".com", aktivasyon: 150, yenileme: 150 },
            { uzanti: ".com.tr", aktivasyon: 50, yenileme: 50 },
            { uzanti: ".net", aktivasyon: 180, yenileme: 180 }
          ], 
          para_birimi: "TL" 
        }, 
        sira: 2 
      }
    ],
    "Hosting Hizmeti": [
      { 
        ozellik_tipi: "sicil_domain", 
        baslik: "Alan Adı", 
        deger: { alan_tipi: "domain", zorunlu: true }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "kademeli_fiyat", 
        baslik: "Paket Tipi", 
        deger: { 
          tip: "paket", 
          birim: "Paket",
          kademeler: [
            { deger: "Bireysel", fiyat: 500 },
            { deger: "Kurumsal", fiyat: 1000 },
            { deger: "Profesyonel", fiyat: 2000 }
          ] 
        }, 
        sira: 2 
      }
    ],
    "Paket Program": [
      { 
        ozellik_tipi: "kullanici_sayisi", 
        baslik: "Kullanıcı Sayısı", 
        deger: { min: 1, max: null, ek_kullanici_fiyat: 1000 }, 
        sira: 1 
      },
      { 
        ozellik_tipi: "aktivasyon_yenileme", 
        baslik: "Lisans Fiyatları", 
        deger: { aktivasyon_fiyat: 0, yenileme_fiyat: 0, para_birimi: "TL" }, 
        sira: 2 
      }
    ]
  };

  let ozellikCount = 0;
  const sablonlar = await prisma.urunSablon.findMany({ where: { silinme_tarihi: null } });
  const sablonMap = {};
  
  for (const sablon of sablonlar) {
    sablonMap[sablon.ad] = sablon.id;
    const ozellikler = sablonOzellikleri[sablon.ad];
    if (!ozellikler) continue;
    
    for (const oz of ozellikler) {
      await prisma.sablonOzellik.create({
        data: {
          sablon_id: sablon.id,
          ozellik_tipi: oz.ozellik_tipi,
          baslik: oz.baslik,
          deger: oz.deger,
          sira: oz.sira
        }
      });
      ozellikCount++;
    }
  }
  console.log(`✅ ${ozellikCount} şablon özelliği oluşturuldu\n`);

  // =============================================
  // 6. ÜRÜNLERİ GÜNCELLE (Şablon bağlantıları)
  // =============================================
  console.log("📦 Ürünler şablonlara bağlanıyor...");
  
  // Ürün-Şablon eşleşmeleri
  const urunSablonEslestirme = {
    "PAVO N86": "Yazarkasa POS Lisans",
    "INPOS M530": "Yazarkasa POS Lisans",
    "INGENICO Move 5000 F": "Yazarkasa POS Lisans",
    "VEGA ÖKC": "Yazarkasa POS Lisans",
    "E-Fatura": "E-Dönüşüm Temel",
    "E-Arşiv": "E-Dönüşüm Temel",
    "E-İrsaliye": "E-Dönüşüm Temel",
    "E-Defter": "E-Dönüşüm Temel",
    "E-Mutabakat": "E-Dönüşüm + Kontör",
    "E-Fatura + E-Arşiv": "E-Dönüşüm Temel",
    "E-Fatura + E-Arşiv + E-İrsaliye": "E-Dönüşüm Temel",
    "ETİC7": "Web/Mobil Yazılım",
    "ANYPAY": "Web/Mobil Yazılım",
    "VEYEDEK": "Kullanıcı Bazlı",
    "VEMOBİL": "Kullanıcı Bazlı",
    "METUNIC Domain": "Alan Adı Hizmeti",
    "GUZELNET Hosting": "Hosting Hizmeti",
    "GUZELNET E-Posta": "Hosting Hizmeti",
    "ARCTOS PRO": "Paket Program",
    "ARCTOS PLUS": "Paket Program"
  };

  let guncelCount = 0;
  
  for (const [urunAd, sablonAd] of Object.entries(urunSablonEslestirme)) {
    const sablonId = sablonMap[sablonAd];
    if (!sablonId) continue;
    
    const urun = await prisma.urun.findFirst({ 
      where: { ad: urunAd, silinme_tarihi: null } 
    });
    
    if (urun) {
      await prisma.urun.update({
        where: { id: urun.id },
        data: { sablon_id: sablonId }
      });
      guncelCount++;
    }
  }
  console.log(`✅ ${guncelCount} ürün şablona bağlandı\n`);

  // =============================================
  // ÖZET
  // =============================================
  console.log("🎉 Seed işlemi tamamlandı (v3)!");
  console.log("════════════════════════════════════════");
  console.log(`📦 Ürün Grupları: ${Object.keys(grupMap).length}`);
  console.log(`🏷️  Ürün Tipleri: ${tipCount} (yeni)`);
  console.log(`📱 Uygulama Tipleri: ${appCount} (yeni)`);
  console.log(`📋 Şablon Özellikleri: ${ozellikCount} (yeni)`);
  console.log(`🔗 Şablona Bağlı Ürünler: ${guncelCount}`);
  console.log("════════════════════════════════════════");
}

main()
  .catch(e => { console.error("❌ Hata:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
