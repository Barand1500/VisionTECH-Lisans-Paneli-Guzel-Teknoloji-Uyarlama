// =============================================
// VEGA YAZILIM - KAPSAMLI SEED SCRIPTI v3
// Şablonlar, Ürünler, Paketler, Bayiler, Müşteriler ve Lisanslar
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Yardımcı: Rastgele tarih üret (son X gün içinde)
const rastgeleTarih = (gunOnce = 365) => {
  const bugun = new Date();
  const rastgeleGun = Math.floor(Math.random() * gunOnce);
  return new Date(bugun.getTime() - rastgeleGun * 24 * 60 * 60 * 1000);
};

// Yardımcı: Bitiş tarihi üret (başlangıçtan X gün sonra)
const bitisTarihiHesapla = (baslangic, gun = 365) => {
  const bitis = new Date(baslangic);
  bitis.setDate(bitis.getDate() + gun);
  return bitis;
};

// Yardımcı: Rastgele lisans anahtarı
const lisansAnahtari = (prefix) => `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

async function main() {
  console.log("\n🚀 VEGA Seed v3 başlıyor...\n");
  console.log("=".repeat(60));

  // =============================================
  // 1. TÜM VERİLERİ TEMİZLE
  // =============================================
  console.log("\n🧹 Tüm veriler temizleniyor...");
  
  const silmeSirasi = [
    { model: "lisans", ad: "Lisanslar" },
    { model: "paket", ad: "Paketler" },
    { model: "surum", ad: "Sürümler" },
    { model: "bayiUrun", ad: "Bayi Ürünleri" },
    { model: "urun", ad: "Ürünler" },
    { model: "sablonOzellik", ad: "Şablon Özellikleri" },
    { model: "urunSablon", ad: "Ürün Şablonları" },
    { model: "uygulamaTipi", ad: "Uygulama Tipleri" },
    { model: "urunTipi", ad: "Ürün Tipleri" },
    { model: "iletisimKisi", ad: "İletişim Kişileri" },
    { model: "iletisimKaydi", ad: "İletişim Kayıtları" },
    { model: "noti", ad: "Notlar" },
    { model: "musteriDosya", ad: "Müşteri Dosyaları" },
    { model: "musteriAdres", ad: "Müşteri Adresleri" },
    { model: "musteriTelefon", ad: "Müşteri Telefonları" },
    { model: "musteri", ad: "Müşteriler" },
    { model: "bayiDosya", ad: "Bayi Dosyaları" },
    { model: "bayi", ad: "Bayiler" },
    { model: "urunGrubu", ad: "Ürün Grupları" },
    { model: "lisansTipi", ad: "Lisans Tipleri" },
    { model: "paketTipi", ad: "Paket Tipleri" },
    { model: "sektor", ad: "Sektörler" },
  ];

  for (const item of silmeSirasi) {
    try {
      const count = await prisma[item.model].deleteMany({});
      console.log(`   ✓ ${item.ad}: ${count.count} kayıt silindi`);
    } catch (e) {
      console.log(`   ⚠ ${item.ad}: Atlandı (${e.message?.slice(0, 50) || 'hata'})`);
    }
  }
  console.log("\n✅ Temizlik tamamlandı");

  // =============================================
  // 2. SEKTÖRLER
  // =============================================
  console.log("\n🏭 Sektörler oluşturuluyor...");
  
  const sektorler = [
    { ad: "Perakende" },
    { ad: "Toptan Ticaret" },
    { ad: "Hizmet" },
    { ad: "Üretim" },
    { ad: "Teknoloji" },
    { ad: "Sağlık" },
  ];
  
  const sektorMap = {};
  for (const s of sektorler) {
    const created = await prisma.sektor.create({ data: s });
    sektorMap[s.ad] = created.id;
  }
  console.log(`   ✓ ${sektorler.length} sektör oluşturuldu`);

  // =============================================
  // 3. LİSANS TİPLERİ
  // =============================================
  console.log("\n📋 Lisans Tipleri oluşturuluyor...");
  
  const lisansTipleri = [
    { ad: "Demo", kod: "demo", renk: "amber", gun: 30, sira: 1 },
    { ad: "Aylık", kod: "aylik", renk: "blue", gun: 30, sira: 2 },
    { ad: "3 Aylık", kod: "3aylik", renk: "cyan", gun: 90, sira: 3 },
    { ad: "6 Aylık", kod: "6aylik", renk: "teal", gun: 180, sira: 4 },
    { ad: "Yıllık", kod: "yillik", renk: "emerald", gun: 365, sira: 5 },
    { ad: "Süresiz", kod: "suresiz", renk: "purple", gun: 36500, sira: 6 },
  ];
  
  const lisansTipiMap = {};
  for (const lt of lisansTipleri) {
    const created = await prisma.lisansTipi.create({ data: lt });
    lisansTipiMap[lt.kod] = created.id;
  }
  console.log(`   ✓ ${lisansTipleri.length} lisans tipi oluşturuldu`);

  // =============================================
  // 4. PAKET TİPLERİ
  // =============================================
  console.log("\n📦 Paket Tipleri oluşturuluyor...");
  
  const paketTipleri = [
    { ad: "STARTER", sira: 1 },
    { ad: "BASIC", sira: 2 },
    { ad: "STANDART", sira: 3 },
    { ad: "PROFESYONEL", sira: 4 },
    { ad: "ENTERPRISE", sira: 5 },
  ];
  
  for (const pt of paketTipleri) {
    await prisma.paketTipi.create({ data: pt });
  }
  console.log(`   ✓ ${paketTipleri.length} paket tipi oluşturuldu`);

  // =============================================
  // 5. ÜRÜN GRUPLARI
  // =============================================
  console.log("\n📁 Ürün Grupları oluşturuluyor...");
  
  const gruplar = [
    { ad: "VEGA", aciklama: "Vega Yazılım ana ürünleri" },
    { ad: "GIB", aciklama: "Gelir İdaresi Başkanlığı entegrasyonları" },
    { ad: "PAVO", aciklama: "PAVO marka ÖKC cihazları" },
    { ad: "METUNIC", aciklama: "Domain ve DNS hizmetleri" },
    { ad: "GUZELNET", aciklama: "Hosting ve E-Posta hizmetleri" },
  ];

  const grupMap = {};
  for (const g of gruplar) {
    const created = await prisma.urunGrubu.create({ data: g });
    grupMap[g.ad] = created.id;
  }
  console.log(`   ✓ ${gruplar.length} grup oluşturuldu`);

  // =============================================
  // 6. ÜRÜN TİPLERİ
  // =============================================
  console.log("\n📱 Ürün Tipleri oluşturuluyor...");
  
  const tipler = [
    { ad: "Satış Yazılımı", grup: "VEGA" },
    { ad: "Muhasebe Yazılımı", grup: "VEGA" },
    { ad: "E-Fatura", grup: "GIB" },
    { ad: "E-Arşiv", grup: "GIB" },
    { ad: "E-İrsaliye", grup: "GIB" },
    { ad: "ÖKC Cihaz", grup: "PAVO" },
    { ad: "Domain", grup: "METUNIC" },
    { ad: "Hosting", grup: "GUZELNET" },
    { ad: "E-Posta", grup: "GUZELNET" },
  ];

  const tipMap = {};
  for (const t of tipler) {
    const created = await prisma.urunTipi.create({
      data: { ad: t.ad, grup_id: grupMap[t.grup] }
    });
    tipMap[`${t.grup}-${t.ad}`] = created.id;
  }
  console.log(`   ✓ ${tipler.length} tip oluşturuldu`);

  // =============================================
  // 7. UYGULAMA TİPLERİ
  // =============================================
  console.log("\n💻 Uygulama Tipleri oluşturuluyor...");
  
  const uygulamaTipleri = [
    { ad: "Masaüstü", tip: "VEGA-Satış Yazılımı" },
    { ad: "Web", tip: "VEGA-Satış Yazılımı" },
    { ad: "Masaüstü", tip: "VEGA-Muhasebe Yazılımı" },
    { ad: "Web Portal", tip: "GIB-E-Fatura" },
    { ad: "Entegrasyon", tip: "GIB-E-Fatura" },
    { ad: "Web Portal", tip: "GIB-E-Arşiv" },
    { ad: "Web Portal", tip: "GIB-E-İrsaliye" },
    { ad: "GMU", tip: "PAVO-ÖKC Cihaz" },
    { ad: "TSM", tip: "PAVO-ÖKC Cihaz" },
    { ad: "Panel", tip: "METUNIC-Domain" },
    { ad: "Panel", tip: "GUZELNET-Hosting" },
    { ad: "Panel", tip: "GUZELNET-E-Posta" },
  ];

  const uygulamaMap = {};
  for (const u of uygulamaTipleri) {
    const tipId = tipMap[u.tip];
    if (!tipId) continue;
    const created = await prisma.uygulamaTipi.create({
      data: { ad: u.ad, urun_tipi_id: tipId }
    });
    uygulamaMap[`${u.tip}-${u.ad}`] = created.id;
  }
  console.log(`   ✓ ${Object.keys(uygulamaMap).length} uygulama tipi oluşturuldu`);

  // =============================================
  // 8. ÜRÜN ŞABLONLARI + ÖZELLİKLERİ
  // =============================================
  console.log("\n📋 Ürün Şablonları oluşturuluyor...");

  // Helper: Şablon özellikleri oluştur
  const ozellikOlustur = async (sablonId, ozellikler) => {
    for (let i = 0; i < ozellikler.length; i++) {
      await prisma.sablonOzellik.create({
        data: {
          sablon_id: sablonId,
          ozellik_tipi: ozellikler[i].tip,
          baslik: ozellikler[i].baslik || "",
          deger: ozellikler[i].deger,
          sira: i,
        }
      });
    }
  };

  const sablonMap = {};
  let sablonSayisi = 0;

  // ----- VEGA POS ŞABLONU -----
  const vegaPosSablon = await prisma.urunSablon.create({
    data: {
      ad: "VegaPos Şablonu",
      aciklama: "Satış ve stok yönetim yazılımı şablonu",
      grup_id: grupMap["VEGA"],
      urun_tipi_id: tipMap["VEGA-Satış Yazılımı"],
      uygulama_tipi_id: uygulamaMap["VEGA-Satış Yazılımı-Masaüstü"],
    }
  });
  await ozellikOlustur(vegaPosSablon.id, [
    { tip: "temel_fiyat", baslik: "Lisans Ücreti", deger: { fiyat: 5000, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "Kullanıcı Limiti", deger: { min: 1, max: 50, ek_kullanici_fiyat: 500 } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 5000, yenileme_fiyat: 3500, para_birimi: "TL" } },
    { tip: "demo_suresi", baslik: "Demo Süresi", deger: { gun: 30 } },
  ]);
  sablonMap["VegaPos"] = vegaPosSablon.id;
  sablonSayisi++;

  // ----- VEGA CARİ ŞABLONU -----
  const vegaCariSablon = await prisma.urunSablon.create({
    data: {
      ad: "VegaCari Şablonu",
      aciklama: "Cari hesap ve muhasebe takip şablonu",
      grup_id: grupMap["VEGA"],
      urun_tipi_id: tipMap["VEGA-Muhasebe Yazılımı"],
      uygulama_tipi_id: uygulamaMap["VEGA-Muhasebe Yazılımı-Masaüstü"],
    }
  });
  await ozellikOlustur(vegaCariSablon.id, [
    { tip: "temel_fiyat", baslik: "Lisans Ücreti", deger: { fiyat: 3500, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "Kullanıcı Limiti", deger: { min: 1, max: 20, ek_kullanici_fiyat: 350 } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 3500, yenileme_fiyat: 2500, para_birimi: "TL" } },
    { tip: "demo_suresi", baslik: "Demo Süresi", deger: { gun: 15 } },
  ]);
  sablonMap["VegaCari"] = vegaCariSablon.id;
  sablonSayisi++;

  // ----- E-Mutabakat Kontör ŞABLONU -----
  const eMutabakatSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-Mutabakat Kontör Şablonu",
      aciklama: "E-Mutabakat kontör satış şablonu",
      grup_id: grupMap["VEGA"],
      urun_tipi_id: tipMap["VEGA-Muhasebe Yazılımı"],
      uygulama_tipi_id: uygulamaMap["VEGA-Muhasebe Yazılımı-Masaüstü"],
    }
  });
  await ozellikOlustur(eMutabakatSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Kontör Paketleri", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 100, birim: "Kontör", fiyat: 500 },
        { adet: 250, birim: "Kontör", fiyat: 1000 },
        { adet: 500, birim: "Kontör", fiyat: 1750 },
        { adet: 1000, birim: "Kontör", fiyat: 3000 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-Mutabakat"] = eMutabakatSablon.id;
  sablonSayisi++;

  // ----- E-FATURA ŞABLONU -----
  const efaturaSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-Fatura Şablonu",
      aciklama: "E-Fatura portal ve entegrasyon şablonu",
      grup_id: grupMap["GIB"],
      urun_tipi_id: tipMap["GIB-E-Fatura"],
      uygulama_tipi_id: uygulamaMap["GIB-E-Fatura-Web Portal"],
    }
  });
  await ozellikOlustur(efaturaSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1200, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Kontör Paketi", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 500, birim: "Kontör", fiyat: 0 },
        { adet: 1000, birim: "Kontör", fiyat: 300 },
        { adet: 2500, birim: "Kontör", fiyat: 600 },
        { adet: 5000, birim: "Kontör", fiyat: 1000 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-Fatura"] = efaturaSablon.id;
  sablonSayisi++;

  // ----- E-ARŞİV ŞABLONU -----
  const earsivSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-Arşiv Şablonu",
      aciklama: "E-Arşiv fatura şablonu",
      grup_id: grupMap["GIB"],
      urun_tipi_id: tipMap["GIB-E-Arşiv"],
      uygulama_tipi_id: uygulamaMap["GIB-E-Arşiv-Web Portal"],
    }
  });
  await ozellikOlustur(earsivSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 1000, yenileme_fiyat: 800, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Kontör Paketi", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 1000, birim: "Kontör", fiyat: 0 },
        { adet: 5000, birim: "Kontör", fiyat: 400 },
        { adet: 10000, birim: "Kontör", fiyat: 750 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-Arşiv"] = earsivSablon.id;
  sablonSayisi++;

  // ----- E-İRSALİYE ŞABLONU -----
  const eirsaliyeSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-İrsaliye Şablonu",
      aciklama: "E-İrsaliye şablonu",
      grup_id: grupMap["GIB"],
      urun_tipi_id: tipMap["GIB-E-İrsaliye"],
      uygulama_tipi_id: uygulamaMap["GIB-E-İrsaliye-Web Portal"],
    }
  });
  await ozellikOlustur(eirsaliyeSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 800, yenileme_fiyat: 600, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Kontör Paketi", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 500, birim: "Kontör", fiyat: 0 },
        { adet: 2000, birim: "Kontör", fiyat: 300 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-İrsaliye"] = eirsaliyeSablon.id;
  sablonSayisi++;

  // ----- PAVO ÖKC ŞABLONU -----
  const pavoSablon = await prisma.urunSablon.create({
    data: {
      ad: "PAVO ÖKC Şablonu",
      aciklama: "PAVO yeni nesil ÖKC cihazı şablonu",
      grup_id: grupMap["PAVO"],
      urun_tipi_id: tipMap["PAVO-ÖKC Cihaz"],
      uygulama_tipi_id: uygulamaMap["PAVO-ÖKC Cihaz-GMU"],
    }
  });
  await ozellikOlustur(pavoSablon.id, [
    { tip: "temel_fiyat", baslik: "Cihaz Bedeli", deger: { fiyat: 8500, para_birimi: "TL" } },
    { tip: "sicil_domain", baslik: "Sicil No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["PAVO-OKC"] = pavoSablon.id;
  sablonSayisi++;

  // ----- DOMAİN ŞABLONU -----
  const domainSablon = await prisma.urunSablon.create({
    data: {
      ad: "Domain Şablonu",
      aciklama: "Domain tescil ve yenileme şablonu",
      grup_id: grupMap["METUNIC"],
      urun_tipi_id: tipMap["METUNIC-Domain"],
      uygulama_tipi_id: uygulamaMap["METUNIC-Domain-Panel"],
    }
  });
  await ozellikOlustur(domainSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "domain_fiyat", baslik: "Domain Uzantıları", deger: { 
      para_birimi: "TL",
      uzantilar: [
        { uzanti: ".com", aktivasyon: 350, yenileme: 350 },
        { uzanti: ".com.tr", aktivasyon: 150, yenileme: 120 },
        { uzanti: ".net", aktivasyon: 400, yenileme: 400 },
        { uzanti: ".org", aktivasyon: 380, yenileme: 380 },
        { uzanti: ".xyz", aktivasyon: 50, yenileme: 50 },
      ]
    }},
    { tip: "sicil_domain", baslik: "Domain Adı", deger: { alan_tipi: "domain", zorunlu: true } },
  ]);
  sablonMap["Domain"] = domainSablon.id;
  sablonSayisi++;

  // ----- HOSTİNG ŞABLONU -----
  const hostingSablon = await prisma.urunSablon.create({
    data: {
      ad: "Web Hosting Şablonu",
      aciklama: "SSD tabanlı web hosting şablonu",
      grup_id: grupMap["GUZELNET"],
      urun_tipi_id: tipMap["GUZELNET-Hosting"],
      uygulama_tipi_id: uygulamaMap["GUZELNET-Hosting-Panel"],
    }
  });
  await ozellikOlustur(hostingSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 500, yenileme_fiyat: 450, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Disk Alanı", deger: { 
      tip: "kapasite", 
      kademeler: [
        { kapasite: 5, birim: "GB", fiyat: 0 },
        { kapasite: 10, birim: "GB", fiyat: 150 },
        { kapasite: 25, birim: "GB", fiyat: 350 },
        { kapasite: 50, birim: "GB", fiyat: 600 },
      ]
    }},
    { tip: "sicil_domain", baslik: "Domain", deger: { alan_tipi: "domain", zorunlu: true } },
  ]);
  sablonMap["Hosting"] = hostingSablon.id;
  sablonSayisi++;

  // ----- E-POSTA ŞABLONU -----
  const epostaSablon = await prisma.urunSablon.create({
    data: {
      ad: "Kurumsal E-Posta Şablonu",
      aciklama: "Kurumsal e-posta hizmeti şablonu",
      grup_id: grupMap["GUZELNET"],
      urun_tipi_id: tipMap["GUZELNET-E-Posta"],
      uygulama_tipi_id: uygulamaMap["GUZELNET-E-Posta-Panel"],
    }
  });
  await ozellikOlustur(epostaSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 200, yenileme_fiyat: 180, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "Hesap Sayısı", deger: { min: 1, max: 100, ek_kullanici_fiyat: 50 } },
    { tip: "sicil_domain", baslik: "Domain", deger: { alan_tipi: "domain", zorunlu: true } },
  ]);
  sablonMap["E-Posta"] = epostaSablon.id;
  sablonSayisi++;

  console.log(`   ✓ ${sablonSayisi} şablon oluşturuldu`);

  // =============================================
  // 9. ÜRÜNLER (Şablonlardan)
  // =============================================
  console.log("\n📦 Ürünler oluşturuluyor...");

  const urunVerileri = [
    // VEGA Ürünleri
    { ad: "VegaPos", sablon: "VegaPos", grup: "VEGA", temelFiyat: 5000, aciklama: "Profesyonel satış ve stok yönetim yazılımı" },
    { ad: "VegaCari", sablon: "VegaCari", grup: "VEGA", temelFiyat: 3500, aciklama: "Cari hesap ve muhasebe takip yazılımı" },
    { ad: "E-Mutabakat Kontör", sablon: "E-Mutabakat", grup: "VEGA", temelFiyat: 0, aciklama: "E-Mutabakat kontör satışı" },
    // GIB Ürünleri
    { ad: "E-Fatura Portal", sablon: "E-Fatura", grup: "GIB", temelFiyat: 0, aciklama: "GIB E-Fatura web portal hizmeti" },
    { ad: "E-Arşiv Fatura", sablon: "E-Arşiv", grup: "GIB", temelFiyat: 0, aciklama: "E-Arşiv fatura hizmeti" },
    { ad: "E-İrsaliye", sablon: "E-İrsaliye", grup: "GIB", temelFiyat: 0, aciklama: "E-İrsaliye hizmeti" },
    // PAVO Ürünleri
    { ad: "PAVO SmartPos", sablon: "PAVO-OKC", grup: "PAVO", temelFiyat: 8500, aciklama: "PAVO yeni nesil akıllı ÖKC cihazı" },
    // METUNIC Ürünleri
    { ad: "Domain Tescil", sablon: "Domain", grup: "METUNIC", temelFiyat: 0, aciklama: "Domain tescil ve yenileme hizmeti" },
    // GUZELNET Ürünleri
    { ad: "Web Hosting", sablon: "Hosting", grup: "GUZELNET", temelFiyat: 0, aciklama: "SSD tabanlı web hosting hizmeti" },
    { ad: "Kurumsal E-Posta", sablon: "E-Posta", grup: "GUZELNET", temelFiyat: 0, aciklama: "Kurumsal e-posta hizmeti" },
  ];

  const urunMap = {};
  for (const uv of urunVerileri) {
    const urun = await prisma.urun.create({
      data: {
        ad: uv.ad,
        sablon_id: sablonMap[uv.sablon],
        grup_id: grupMap[uv.grup],
        temel_fiyat: uv.temelFiyat,
        aciklama: uv.aciklama,
        aktif: 1,
        durum: "aktif",
        demo_gun: 30,
        varsayilan_gun: 365,
      }
    });
    urunMap[uv.ad] = urun.id;
  }
  console.log(`   ✓ ${urunVerileri.length} ürün oluşturuldu`);

  // =============================================
  // 10. PAKETLER + PAKET ÖZELLİKLERİ
  // =============================================
  console.log("\n📋 Paketler oluşturuluyor...");

  // VegaPos Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["VegaPos"],
      ad: "VegaPos Starter",
      tipi: "STARTER",
      kullanim_gunu: 365,
      fiyat: 3500,
      kullanici_sayisi: 1,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 3500 },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 1 } },
        { id: 3, tip: "ozel_not", deger: "Tek kullanıcı için ideal başlangıç paketi" },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["VegaPos"],
      ad: "VegaPos Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 5000,
      kullanici_sayisi: 3,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 5000 },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 3, ek_kullanici_fiyat: 500 } },
        { id: 3, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 5000, yenileme_fiyat: 3500 } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["VegaPos"],
      ad: "VegaPos Pro",
      tipi: "PROFESYONEL",
      kullanim_gunu: 365,
      fiyat: 8000,
      kullanici_sayisi: 10,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 8000 },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 10, ek_kullanici_fiyat: 400 } },
        { id: 3, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 8000, yenileme_fiyat: 6000 } },
        { id: 4, tip: "hediye_urun", deger: { urun_id: urunMap["E-Arşiv Fatura"], sure: 365 }, urunAdi: "E-Arşiv Fatura" },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["VegaPos"],
      ad: "VegaPos Enterprise",
      tipi: "ENTERPRISE",
      kullanim_gunu: 365,
      fiyat: 15000,
      kullanici_sayisi: 50,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 15000 },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 50, ek_kullanici_fiyat: 300 } },
        { id: 3, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 15000, yenileme_fiyat: 12000 } },
        { id: 4, tip: "hediye_urun", deger: { urun_id: urunMap["E-Fatura Portal"], sure: 365 }, urunAdi: "E-Fatura Portal" },
        { id: 5, tip: "hediye_urun", deger: { urun_id: urunMap["E-Arşiv Fatura"], sure: 365 }, urunAdi: "E-Arşiv Fatura" },
        { id: 6, tip: "indirim", deger: 10 },
        { id: 7, tip: "ozel_not", deger: "7/24 öncelikli teknik destek dahil" },
      ]
    }
  });

  // VegaCari Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["VegaCari"],
      ad: "VegaCari Basic",
      tipi: "BASIC",
      kullanim_gunu: 365,
      fiyat: 2500,
      kullanici_sayisi: 1,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 2500 },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 1 } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["VegaCari"],
      ad: "VegaCari Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 3500,
      kullanici_sayisi: 5,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 3500 },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 5, ek_kullanici_fiyat: 350 } },
        { id: 3, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 3500, yenileme_fiyat: 2500 } },
      ]
    }
  });

  // E-Mutabakat Paketleri (Kontör bazlı)
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Mutabakat Kontör"],
      ad: "100 Kontör",
      tipi: "STARTER",
      kullanim_gunu: 365,
      fiyat: 500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 500 },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 100, birim: "Kontör" } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Mutabakat Kontör"],
      ad: "500 Kontör",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 1750,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 1750 },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 500, birim: "Kontör" } },
        { id: 3, tip: "indirim", deger: 12.5 },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Mutabakat Kontör"],
      ad: "1000 Kontör",
      tipi: "PROFESYONEL",
      kullanim_gunu: 365,
      fiyat: 3000,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 3000 },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 1000, birim: "Kontör" } },
        { id: 3, tip: "indirim", deger: 25 },
      ]
    }
  });

  // E-Fatura Paketleri
  const efaturaUrunId = urunMap["E-Fatura Portal"];
  await prisma.paket.create({
    data: {
      urun_id: efaturaUrunId,
      ad: "E-Fatura Başlangıç",
      tipi: "STARTER",
      kullanim_gunu: 365,
      fiyat: 1500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1200 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 500, birim: "Kontör" } },
        { id: 3, tip: "sicil_domain", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: efaturaUrunId,
      ad: "E-Fatura Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 2000,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 2000, yenileme_fiyat: 1700 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 2500, birim: "Kontör" } },
        { id: 3, tip: "sicil_domain", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: efaturaUrunId,
      ad: "E-Fatura Pro",
      tipi: "PROFESYONEL",
      kullanim_gunu: 365,
      fiyat: 3500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 3500, yenileme_fiyat: 3000 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 10000, birim: "Kontör" } },
        { id: 3, tip: "sicil_domain", deger: { alan_tipi: "sicil_no", zorunlu: true } },
        { id: 4, tip: "hediye_urun", deger: { urun_id: urunMap["E-Arşiv Fatura"], sure: 365 }, urunAdi: "E-Arşiv Fatura" },
      ]
    }
  });

  // E-Arşiv Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Arşiv Fatura"],
      ad: "E-Arşiv Basic",
      tipi: "BASIC",
      kullanim_gunu: 365,
      fiyat: 1000,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1000, yenileme_fiyat: 800 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 1000, birim: "Kontör" } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Arşiv Fatura"],
      ad: "E-Arşiv Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 1500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1200 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 5000, birim: "Kontör" } },
      ]
    }
  });

  // E-İrsaliye Paketi
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-İrsaliye"],
      ad: "E-İrsaliye Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 800,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 800, yenileme_fiyat: 600 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 500, birim: "Kontör" } },
      ]
    }
  });

  // PAVO ÖKC Paketi
  await prisma.paket.create({
    data: {
      urun_id: urunMap["PAVO SmartPos"],
      ad: "PAVO SmartPos Cihaz",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 8500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 8500 },
        { id: 2, tip: "sicil_domain", deger: { alan_tipi: "sicil_no", zorunlu: true } },
        { id: 3, tip: "ozel_not", deger: "2 yıl garanti dahil" },
      ]
    }
  });

  // Domain Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["Domain Tescil"],
      ad: ".com Domain",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 350,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "domain_fiyat", deger: { uzanti: ".com", aktivasyon: 350, yenileme: 350 } },
        { id: 2, tip: "sicil_domain", deger: { alan_tipi: "domain", zorunlu: true } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["Domain Tescil"],
      ad: ".com.tr Domain",
      tipi: "BASIC",
      kullanim_gunu: 365,
      fiyat: 150,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "domain_fiyat", deger: { uzanti: ".com.tr", aktivasyon: 150, yenileme: 120 } },
        { id: 2, tip: "sicil_domain", deger: { alan_tipi: "domain", zorunlu: true } },
      ]
    }
  });

  // Hosting Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["Web Hosting"],
      ad: "Hosting Başlangıç",
      tipi: "STARTER",
      kullanim_gunu: 365,
      fiyat: 500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 500, yenileme_fiyat: 450 } },
        { id: 2, tip: "kademeli_fiyat", deger: { kapasite: 5, birim: "GB" } },
        { id: 3, tip: "sicil_domain", deger: { alan_tipi: "domain", zorunlu: true } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["Web Hosting"],
      ad: "Hosting Pro",
      tipi: "PROFESYONEL",
      kullanim_gunu: 365,
      fiyat: 1100,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1100, yenileme_fiyat: 1000 } },
        { id: 2, tip: "kademeli_fiyat", deger: { kapasite: 50, birim: "GB" } },
        { id: 3, tip: "sicil_domain", deger: { alan_tipi: "domain", zorunlu: true } },
        { id: 4, tip: "hediye_urun", deger: { urun_id: urunMap["Kurumsal E-Posta"], sure: 365 }, urunAdi: "Kurumsal E-Posta (5 hesap)" },
      ]
    }
  });

  // E-Posta Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["Kurumsal E-Posta"],
      ad: "E-Posta 5 Hesap",
      tipi: "BASIC",
      kullanim_gunu: 365,
      fiyat: 500,
      kullanici_sayisi: 5,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 500, yenileme_fiyat: 450 } },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 5, ek_kullanici_fiyat: 50 } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["Kurumsal E-Posta"],
      ad: "E-Posta 25 Hesap",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 1500,
      kullanici_sayisi: 25,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1350 } },
        { id: 2, tip: "kullanici_sayisi", deger: { min: 1, max: 25, ek_kullanici_fiyat: 40 } },
        { id: 3, tip: "indirim", deger: 10 },
      ]
    }
  });

  // Paket sayısını getir
  const paketSayisi = await prisma.paket.count();
  console.log(`   ✓ ${paketSayisi} paket oluşturuldu`);

  // =============================================
  // 11. BAYİLER (3 ADET)
  // =============================================
  console.log("\n🏢 Bayiler oluşturuluyor...");

  const bayi1 = await prisma.bayi.create({
    data: {
      ad: "Marmara Bilişim",
      tur: "tuzel",
      sirket_adi: "Marmara Bilişim Teknoloji A.Ş.",
      yetkili: "Mehmet Kaya",
      telefon: "0212 444 5566",
      eposta: "bilgi@marmarabilisim.com",
      vergi_no: "1234567890",
      vergi_dairesi: "Şişli",
      sehir: "İstanbul",
      sektor_id: sektorMap["Teknoloji"],
      durum: "aktif",
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi1.id,
      ad_soyad: "Mehmet Kaya",
      unvan: "Genel Müdür",
      departman: "Yönetim",
      telefon: "0212 444 5566",
      cep_telefon: "0532 111 2233",
      eposta: "mehmet.kaya@marmarabilisim.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Bayi 1: Marmara Bilişim (İstanbul)`);

  const bayi2 = await prisma.bayi.create({
    data: {
      ad: "Ege Teknoloji",
      tur: "tuzel",
      sirket_adi: "Ege Teknoloji Çözümleri Ltd.",
      yetkili: "Ayşe Demir",
      telefon: "0232 333 4455",
      eposta: "info@egeteknoloji.com",
      vergi_no: "9876543210",
      vergi_dairesi: "Konak",
      sehir: "İzmir",
      sektor_id: sektorMap["Teknoloji"],
      durum: "aktif",
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi2.id,
      ad_soyad: "Ayşe Demir",
      unvan: "Satış Müdürü",
      departman: "Satış",
      telefon: "0232 333 4455",
      cep_telefon: "0533 222 3344",
      eposta: "ayse.demir@egeteknoloji.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Bayi 2: Ege Teknoloji (İzmir)`);

  const bayi3 = await prisma.bayi.create({
    data: {
      ad: "Anadolu Yazılım",
      tur: "tuzel",
      sirket_adi: "Anadolu Yazılım ve Danışmanlık Ltd.",
      yetkili: "Ali Yıldız",
      telefon: "0312 555 6677",
      eposta: "iletisim@anadoluyazilim.com",
      vergi_no: "5555555555",
      vergi_dairesi: "Çankaya",
      sehir: "Ankara",
      sektor_id: sektorMap["Hizmet"],
      durum: "aktif",
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi3.id,
      ad_soyad: "Ali Yıldız",
      unvan: "Kurucu Ortak",
      departman: "Yönetim",
      telefon: "0312 555 6677",
      cep_telefon: "0534 333 4455",
      eposta: "ali.yildiz@anadoluyazilim.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Bayi 3: Anadolu Yazılım (Ankara)`);

  // =============================================
  // 12. MÜŞTERİLER (3 ADET)
  // =============================================
  console.log("\n👤 Müşteriler oluşturuluyor...");

  // Müşteri 1: Bağımsız müşteri (bayi_id yok) - Tüzel
  const musteri1 = await prisma.musteri.create({
    data: {
      tur: "tuzel",
      sirket_adi: "Demo Ticaret A.Ş.",
      yetkili_kisi: "Ahmet Yılmaz",
      vergi_no: "1112223334",
      vergi_dairesi: "Kadıköy",
      eposta: "bilgi@demoticaret.com",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri1.id, telefon: "0216 555 1234" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri1.id, adres: "Bağdat Cad. No:123, Kadıköy, İstanbul" } });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri1.id,
      ad_soyad: "Ahmet Yılmaz",
      unvan: "Genel Müdür",
      telefon: "0216 555 1234",
      cep_telefon: "0535 111 2222",
      eposta: "ahmet@demoticaret.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Müşteri 1: Demo Ticaret A.Ş. (Bağımsız - Perakende)`);

  // Müşteri 2: Marmara Bilişim'in alt müşterisi - Tüzel
  const musteri2 = await prisma.musteri.create({
    data: {
      tur: "tuzel",
      sirket_adi: "Anadolu Market Ltd.",
      yetkili_kisi: "Fatma Şahin",
      vergi_no: "2223334445",
      vergi_dairesi: "Beşiktaş",
      eposta: "iletisim@anadolumarket.com",
      sektor_id: sektorMap["Toptan Ticaret"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri2.id, telefon: "0212 666 7788" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri2.id, adres: "Levent Mah. Plaza No:55, Beşiktaş, İstanbul" } });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri2.id,
      ad_soyad: "Fatma Şahin",
      unvan: "Finans Müdürü",
      telefon: "0212 666 7788",
      cep_telefon: "0536 222 3333",
      eposta: "fatma@anadolumarket.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Müşteri 2: Anadolu Market Ltd. (Bayi: Marmara Bilişim)`);

  // Müşteri 3: Ege Teknoloji'nin alt müşterisi - Gerçek kişi
  const musteri3 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Mustafa Özkan",
      tc_kimlik_no: "12345678901",
      eposta: "mustafa.ozkan@gmail.com",
      sektor_id: sektorMap["Hizmet"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri3.id, telefon: "0537 888 9999" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri3.id, adres: "Karşıyaka Mah. No:42, Konak, İzmir" } });
  console.log(`   ✓ Müşteri 3: Mustafa Özkan (Gerçek Kişi - Bayi: Ege Teknoloji)`);

  // =============================================
  // 13. LİSANSLAR
  // =============================================
  console.log("\n📋 Lisanslar oluşturuluyor...");

  let lisansSayisi = 0;

  // --- Müşteri 1: Demo Ticaret A.Ş. için lisanslar ---
  // VegaPos Pro lisansı
  const m1Baslangic1 = rastgeleTarih(180);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["VegaPos"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("VP"),
      baslangic_tarihi: m1Baslangic1,
      bitis_tarihi: bitisTarihiHesapla(m1Baslangic1, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "1112223334",
      fiyat: 8000,
      net_tutar: 8000,
      kullanici_sayisi: 5,
      odeme_durumu: "odendi",
      odenen_tutar: 8000,
    }
  });
  lisansSayisi++;

  // E-Fatura Standart lisansı
  const m1Baslangic2 = rastgeleTarih(120);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["E-Fatura Portal"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EF"),
      baslangic_tarihi: m1Baslangic2,
      bitis_tarihi: bitisTarihiHesapla(m1Baslangic2, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "1112223334",
      fiyat: 2000,
      net_tutar: 2000,
      odeme_durumu: "odendi",
      odenen_tutar: 2000,
    }
  });
  lisansSayisi++;

  // E-Arşiv lisansı
  const m1Baslangic3 = rastgeleTarih(120);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["E-Arşiv Fatura"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EA"),
      baslangic_tarihi: m1Baslangic3,
      bitis_tarihi: bitisTarihiHesapla(m1Baslangic3, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "1112223334",
      fiyat: 1000,
      net_tutar: 1000,
      odeme_durumu: "odendi",
      odenen_tutar: 1000,
    }
  });
  lisansSayisi++;

  // Domain lisansı
  const m1Baslangic4 = rastgeleTarih(300);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["Domain Tescil"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("DOM"),
      baslangic_tarihi: m1Baslangic4,
      bitis_tarihi: bitisTarihiHesapla(m1Baslangic4, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "demoticaret.com",
      fiyat: 350,
      net_tutar: 350,
      odeme_durumu: "odendi",
      odenen_tutar: 350,
    }
  });
  lisansSayisi++;

  // Web Hosting lisansı
  const m1Baslangic5 = rastgeleTarih(300);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["Web Hosting"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("HOST"),
      baslangic_tarihi: m1Baslangic5,
      bitis_tarihi: bitisTarihiHesapla(m1Baslangic5, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "demoticaret.com",
      fiyat: 500,
      net_tutar: 500,
      odeme_durumu: "odendi",
      odenen_tutar: 500,
    }
  });
  lisansSayisi++;
  console.log(`   ✓ Demo Ticaret A.Ş. için 5 lisans oluşturuldu`);

  // --- Müşteri 2: Anadolu Market Ltd. için lisanslar (Bayi: Marmara Bilişim) ---
  // VegaPos Enterprise lisansı
  const m2Baslangic1 = rastgeleTarih(90);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id,
      bayi_id: bayi1.id,
      urun_id: urunMap["VegaPos"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("VP"),
      baslangic_tarihi: m2Baslangic1,
      bitis_tarihi: bitisTarihiHesapla(m2Baslangic1, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "2223334445",
      fiyat: 15000,
      indirim_orani: 10,
      indirim_tutari: 1500,
      net_tutar: 13500,
      kullanici_sayisi: 15,
      odeme_durumu: "odendi",
      odenen_tutar: 13500,
    }
  });
  lisansSayisi++;

  // E-Fatura Pro lisansı
  const m2Baslangic2 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id,
      bayi_id: bayi1.id,
      urun_id: urunMap["E-Fatura Portal"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EFP"),
      baslangic_tarihi: m2Baslangic2,
      bitis_tarihi: bitisTarihiHesapla(m2Baslangic2, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "2223334445",
      fiyat: 3500,
      net_tutar: 3500,
      odeme_durumu: "odendi",
      odenen_tutar: 3500,
    }
  });
  lisansSayisi++;

  // E-Arşiv lisansı
  const m2Baslangic3 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id,
      bayi_id: bayi1.id,
      urun_id: urunMap["E-Arşiv Fatura"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EA"),
      baslangic_tarihi: m2Baslangic3,
      bitis_tarihi: bitisTarihiHesapla(m2Baslangic3, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "2223334445",
      fiyat: 1500,
      net_tutar: 1500,
      odeme_durumu: "odendi",
      odenen_tutar: 1500,
    }
  });
  lisansSayisi++;

  // E-İrsaliye lisansı
  const m2Baslangic4 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id,
      bayi_id: bayi1.id,
      urun_id: urunMap["E-İrsaliye"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EI"),
      baslangic_tarihi: m2Baslangic4,
      bitis_tarihi: bitisTarihiHesapla(m2Baslangic4, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "2223334445",
      fiyat: 800,
      net_tutar: 800,
      odeme_durumu: "odendi",
      odenen_tutar: 800,
    }
  });
  lisansSayisi++;
  console.log(`   ✓ Anadolu Market Ltd. için 4 lisans oluşturuldu (Bayi: Marmara Bilişim)`);

  // --- Müşteri 3: Mustafa Özkan için lisanslar (Bayi: Ege Teknoloji) ---
  // VegaCari Basic lisansı
  const m3Baslangic1 = rastgeleTarih(150);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id,
      bayi_id: bayi2.id,
      urun_id: urunMap["VegaCari"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("VC"),
      baslangic_tarihi: m3Baslangic1,
      bitis_tarihi: bitisTarihiHesapla(m3Baslangic1, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "12345678901",
      fiyat: 2500,
      net_tutar: 2500,
      kullanici_sayisi: 1,
      odeme_durumu: "odendi",
      odenen_tutar: 2500,
    }
  });
  lisansSayisi++;

  // Domain lisansı
  const m3Baslangic2 = rastgeleTarih(200);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id,
      bayi_id: bayi2.id,
      urun_id: urunMap["Domain Tescil"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("DOM"),
      baslangic_tarihi: m3Baslangic2,
      bitis_tarihi: bitisTarihiHesapla(m3Baslangic2, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "mustafaozkan.com.tr",
      fiyat: 150,
      net_tutar: 150,
      odeme_durumu: "odendi",
      odenen_tutar: 150,
    }
  });
  lisansSayisi++;

  // E-Posta lisansı
  const m3Baslangic3 = rastgeleTarih(200);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id,
      bayi_id: bayi2.id,
      urun_id: urunMap["Kurumsal E-Posta"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("MAIL"),
      baslangic_tarihi: m3Baslangic3,
      bitis_tarihi: bitisTarihiHesapla(m3Baslangic3, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "mustafaozkan.com.tr",
      fiyat: 500,
      net_tutar: 500,
      kullanici_sayisi: 5,
      odeme_durumu: "odendi",
      odenen_tutar: 500,
    }
  });
  lisansSayisi++;
  console.log(`   ✓ Mustafa Özkan için 3 lisans oluşturuldu (Bayi: Ege Teknoloji)`);

  // --- Bayi 3: Anadolu Yazılım için direkt lisans (demo amaçlı) ---
  // PAVO SmartPos lisansı
  const b3Baslangic1 = rastgeleTarih(100);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id, // Demo Ticaret'e satış yapıldı
      bayi_id: bayi3.id,
      urun_id: urunMap["PAVO SmartPos"],
      lisans_tipi_id: lisansTipiMap["suresiz"],
      lisans_tipi: "suresiz",
      lisans_anahtari: lisansAnahtari("PAVO"),
      baslangic_tarihi: b3Baslangic1,
      bitis_tarihi: bitisTarihiHesapla(b3Baslangic1, 36500), // Süresiz
      kullanim_gunu: 36500,
      durum: "aktif",
      domain: "OKC-2024-001",
      fiyat: 8500,
      net_tutar: 8500,
      odeme_durumu: "odendi",
      odenen_tutar: 8500,
    }
  });
  lisansSayisi++;

  // E-Mutabakat Kontör lisansı
  const b3Baslangic2 = rastgeleTarih(45);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, // Anadolu Market'e satış yapıldı
      bayi_id: bayi3.id,
      urun_id: urunMap["E-Mutabakat Kontör"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EMK"),
      baslangic_tarihi: b3Baslangic2,
      bitis_tarihi: bitisTarihiHesapla(b3Baslangic2, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "2223334445",
      fiyat: 1750,
      net_tutar: 1750,
      odeme_durumu: "odendi",
      odenen_tutar: 1750,
      notlar: "500 Kontör paketi",
    }
  });
  lisansSayisi++;
  console.log(`   ✓ Anadolu Yazılım için 2 lisans oluşturuldu`);

  // =============================================
  // ÖZET
  // =============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED v3 TAMAMLANDI");
  console.log("=".repeat(60));
  console.log(`
📊 ÖZET:
   ├─ Sektörler: ${sektorler.length}
   ├─ Lisans Tipleri: ${lisansTipleri.length}
   ├─ Paket Tipleri: ${paketTipleri.length}
   ├─ Ürün Grupları: ${gruplar.length}
   ├─ Ürün Tipleri: ${Object.keys(tipMap).length}
   ├─ Uygulama Tipleri: ${Object.keys(uygulamaMap).length}
   ├─ Ürün Şablonları: ${sablonSayisi}
   ├─ Ürünler: ${Object.keys(urunMap).length}
   ├─ Paketler: ${paketSayisi}
   ├─ Bayiler: 3
   │   ├─ Marmara Bilişim (İstanbul)
   │   ├─ Ege Teknoloji (İzmir)
   │   └─ Anadolu Yazılım (Ankara)
   ├─ Müşteriler: 3
   │   ├─ Demo Ticaret A.Ş. (Bağımsız)
   │   ├─ Anadolu Market Ltd. (Bayi: Marmara Bilişim)
   │   └─ Mustafa Özkan (Gerçek Kişi - Bayi: Ege Teknoloji)
   └─ Lisanslar: ${lisansSayisi}
`);
}

main()
  .catch((e) => {
    console.error("\n❌ HATA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
