// =============================================
// GÜZEL TEKNOLOJİ - KAPSAMLI SEED SCRIPTI v3
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
  console.log("\n🚀 Güzel Teknoloji Seed v3 başlıyor...\n");
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
    { ad: "Süresiz", kod: "suresiz", renk: "purple", gun: 0, suresiz: 1, sira: 6 },
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
  // 9. ÜRÜNLER
  // =============================================
  console.log("\n📦 Ürünler oluşturuluyor...");

  const urunVerileri = [
    { ad: "VegaPos", sablon: "VegaPos", grup: "VEGA", temelFiyat: 5000, aciklama: "Profesyonel satış ve stok yönetim yazılımı" },
    { ad: "VegaCari", sablon: "VegaCari", grup: "VEGA", temelFiyat: 3500, aciklama: "Cari hesap ve muhasebe takip yazılımı" },
    { ad: "E-Mutabakat Kontör", sablon: "E-Mutabakat", grup: "VEGA", temelFiyat: 0, aciklama: "E-Mutabakat kontör satışı" },
    { ad: "E-Fatura Portal", sablon: "E-Fatura", grup: "GIB", temelFiyat: 0, aciklama: "GIB E-Fatura web portal hizmeti" },
    { ad: "E-Arşiv Fatura", sablon: "E-Arşiv", grup: "GIB", temelFiyat: 0, aciklama: "E-Arşiv fatura hizmeti" },
    { ad: "E-İrsaliye", sablon: "E-İrsaliye", grup: "GIB", temelFiyat: 0, aciklama: "E-İrsaliye hizmeti" },
    { ad: "PAVO SmartPos", sablon: "PAVO-OKC", grup: "PAVO", temelFiyat: 8500, aciklama: "PAVO yeni nesil akıllı ÖKC cihazı" },
    { ad: "Domain Tescil", sablon: "Domain", grup: "METUNIC", temelFiyat: 0, aciklama: "Domain tescil ve yenileme hizmeti" },
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
  // 10. PAKETLER
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

  // E-Mutabakat Paketleri
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
      ]
    }
  });

  // E-Fatura Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Fatura Portal"],
      ad: "E-Fatura Başlangıç",
      tipi: "STARTER",
      kullanim_gunu: 365,
      fiyat: 1500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1200 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 500, birim: "Kontör" } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Fatura Portal"],
      ad: "E-Fatura Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 2000,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 2000, yenileme_fiyat: 1700 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 2500, birim: "Kontör" } },
      ]
    }
  });

  // E-Arşiv Paketi
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Arşiv Fatura"],
      ad: "E-Arşiv Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 1000,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1000, yenileme_fiyat: 800 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 1000, birim: "Kontör" } },
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
      ]
    }
  });

  // Domain Paketi
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

  // Hosting Paketi
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

  // E-Posta Paketi
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

  const paketSayisi = await prisma.paket.count();
  console.log(`   ✓ ${paketSayisi} paket oluşturuldu`);

  // =============================================
  // 11. BAYİLER (3 ADET)
  // =============================================
  console.log("\n🏢 Bayiler oluşturuluyor...");

  const bayi1 = await prisma.bayi.create({
    data: {
      ad: "Güzel Teknoloji",
      tur: "tuzel",
      sirket_adi: "Güzel Teknoloji Yazılım A.Ş.",
      yetkili: "Baran Ürüncan",
      telefon: "0212 555 1010",
      eposta: "info@guzelteknoloji.com",
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
      ad_soyad: "Baran Ürüncan",
      unvan: "Genel Müdür",
      departman: "Yönetim",
      telefon: "0212 555 1010",
      cep_telefon: "0532 100 2030",
      eposta: "baran@guzelteknoloji.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Bayi 1: Güzel Teknoloji (İstanbul)`);

  const bayi2 = await prisma.bayi.create({
    data: {
      ad: "Panu Teknoloji",
      tur: "tuzel",
      sirket_adi: "Panu Teknoloji Çözümleri Ltd.",
      yetkili: "Ali Köse",
      telefon: "0232 444 2020",
      eposta: "info@panuteknoloji.com",
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
      ad_soyad: "Ali Köse",
      unvan: "Satış Müdürü",
      departman: "Satış",
      telefon: "0232 444 2020",
      cep_telefon: "0533 200 3040",
      eposta: "ali@panuteknoloji.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Bayi 2: Panu Teknoloji (İzmir)`);

  const bayi3 = await prisma.bayi.create({
    data: {
      ad: "Kodgem",
      tur: "tuzel",
      sirket_adi: "Kodgem Bilişim ve Danışmanlık Ltd.",
      yetkili: "Nimet Demir",
      telefon: "0312 333 3030",
      eposta: "iletisim@kodgem.com",
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
      ad_soyad: "Nimet Demir",
      unvan: "Kurucu Ortak",
      departman: "Yönetim",
      telefon: "0312 333 3030",
      cep_telefon: "0534 300 4050",
      eposta: "nimet@kodgem.com",
      birincil: 1,
    }
  });
  console.log(`   ✓ Bayi 3: Kodgem (Ankara)`);

  // =============================================
  // 12. MÜŞTERİLER (3 ADET)
  // =============================================
  console.log("\n👤 Müşteriler oluşturuluyor...");

  // Müşteri 1: Bağımsız müşteri (bayi yok) - Gerçek kişi
  const musteri1 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Baran Ürüncan",
      tc_kimlik_no: "11122233344",
      eposta: "baran.uruncan@gmail.com",
      sektor_id: sektorMap["Teknoloji"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri1.id, telefon: "0532 100 2030" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri1.id, adres: "Kadıköy, İstanbul" } });
  console.log(`   ✓ Müşteri 1: Baran Ürüncan (Bağımsız)`);

  // Müşteri 2: Güzel Teknoloji'nin alt müşterisi - Gerçek kişi
  const musteri2 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Ali Köse",
      tc_kimlik_no: "22233344455",
      eposta: "ali.kose@gmail.com",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri2.id, telefon: "0533 200 3040" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri2.id, adres: "Konak, İzmir" } });
  console.log(`   ✓ Müşteri 2: Ali Köse (Bayi: Güzel Teknoloji)`);

  // Müşteri 3: Kodgem'in alt müşterisi - Gerçek kişi
  const musteri3 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Nimet Demir",
      tc_kimlik_no: "33344455566",
      eposta: "nimet.demir@gmail.com",
      sektor_id: sektorMap["Hizmet"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri3.id, telefon: "0534 300 4050" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri3.id, adres: "Çankaya, Ankara" } });
  console.log(`   ✓ Müşteri 3: Nimet Demir (Bayi: Kodgem)`);

  // =============================================
  // 13. LİSANSLAR
  // =============================================
  console.log("\n📋 Lisanslar oluşturuluyor...");

  let lisansSayisi = 0;

  // --- Müşteri 1: Baran Ürüncan (Bağımsız) ---
  // VegaPos Pro - Yıllık
  const m1b1 = rastgeleTarih(180);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["VegaPos"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("VP"),
      baslangic_tarihi: m1b1,
      bitis_tarihi: bitisTarihiHesapla(m1b1, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "11122233344",
      fiyat: 8000,
      net_tutar: 8000,
      kullanici_sayisi: 5,
      odeme_durumu: "odendi",
      odenen_tutar: 8000,
    }
  });
  lisansSayisi++;

  // E-Fatura Standart - Yıllık
  const m1b2 = rastgeleTarih(120);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["E-Fatura Portal"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EF"),
      baslangic_tarihi: m1b2,
      bitis_tarihi: bitisTarihiHesapla(m1b2, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "11122233344",
      fiyat: 2000,
      net_tutar: 2000,
      odeme_durumu: "odendi",
      odenen_tutar: 2000,
    }
  });
  lisansSayisi++;

  // Domain - Yıllık
  const m1b3 = rastgeleTarih(300);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["Domain Tescil"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("DOM"),
      baslangic_tarihi: m1b3,
      bitis_tarihi: bitisTarihiHesapla(m1b3, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "baranuruncan.com",
      fiyat: 350,
      net_tutar: 350,
      odeme_durumu: "odendi",
      odenen_tutar: 350,
    }
  });
  lisansSayisi++;

  // PAVO SmartPos - Süresiz
  const m1b4 = rastgeleTarih(100);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id,
      bayi_id: null,
      urun_id: urunMap["PAVO SmartPos"],
      lisans_tipi_id: lisansTipiMap["suresiz"],
      lisans_tipi: "suresiz",
      suresiz: 1,
      lisans_anahtari: lisansAnahtari("PAVO"),
      baslangic_tarihi: m1b4,
      bitis_tarihi: null,
      kullanim_gunu: 0,
      durum: "aktif",
      domain: "OKC-2024-001",
      fiyat: 8500,
      net_tutar: 8500,
      odeme_durumu: "odendi",
      odenen_tutar: 8500,
    }
  });
  lisansSayisi++;
  console.log(`   ✓ Baran Ürüncan için ${lisansSayisi} lisans oluşturuldu`);

  // --- Müşteri 2: Ali Köse (Bayi: Güzel Teknoloji) ---
  const m2Onceki = lisansSayisi;

  // VegaCari Standart - Yıllık
  const m2b1 = rastgeleTarih(90);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id,
      bayi_id: bayi1.id,
      urun_id: urunMap["VegaCari"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("VC"),
      baslangic_tarihi: m2b1,
      bitis_tarihi: bitisTarihiHesapla(m2b1, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "22233344455",
      fiyat: 3500,
      net_tutar: 3500,
      kullanici_sayisi: 3,
      odeme_durumu: "odendi",
      odenen_tutar: 3500,
    }
  });
  lisansSayisi++;

  // E-Arşiv Fatura - Yıllık
  const m2b2 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id,
      bayi_id: bayi1.id,
      urun_id: urunMap["E-Arşiv Fatura"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EA"),
      baslangic_tarihi: m2b2,
      bitis_tarihi: bitisTarihiHesapla(m2b2, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "22233344455",
      fiyat: 1000,
      net_tutar: 1000,
      odeme_durumu: "odendi",
      odenen_tutar: 1000,
    }
  });
  lisansSayisi++;

  // Web Hosting - Yıllık
  const m2b3 = rastgeleTarih(200);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id,
      bayi_id: bayi1.id,
      urun_id: urunMap["Web Hosting"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("HOST"),
      baslangic_tarihi: m2b3,
      bitis_tarihi: bitisTarihiHesapla(m2b3, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "alikose.com.tr",
      fiyat: 500,
      net_tutar: 500,
      odeme_durumu: "odendi",
      odenen_tutar: 500,
    }
  });
  lisansSayisi++;
  console.log(`   ✓ Ali Köse için ${lisansSayisi - m2Onceki} lisans oluşturuldu (Bayi: Güzel Teknoloji)`);

  // --- Müşteri 3: Nimet Demir (Bayi: Kodgem) ---
  const m3Onceki = lisansSayisi;

  // VegaPos Starter - Yıllık
  const m3b1 = rastgeleTarih(150);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id,
      bayi_id: bayi3.id,
      urun_id: urunMap["VegaPos"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("VP"),
      baslangic_tarihi: m3b1,
      bitis_tarihi: bitisTarihiHesapla(m3b1, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "33344455566",
      fiyat: 3500,
      net_tutar: 3500,
      kullanici_sayisi: 1,
      odeme_durumu: "odendi",
      odenen_tutar: 3500,
    }
  });
  lisansSayisi++;

  // E-Mutabakat Kontör - Yıllık
  const m3b2 = rastgeleTarih(45);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id,
      bayi_id: bayi3.id,
      urun_id: urunMap["E-Mutabakat Kontör"],
      lisans_tipi_id: lisansTipiMap["yillik"],
      lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EMK"),
      baslangic_tarihi: m3b2,
      bitis_tarihi: bitisTarihiHesapla(m3b2, 365),
      kullanim_gunu: 365,
      durum: "aktif",
      domain: "33344455566",
      fiyat: 500,
      net_tutar: 500,
      odeme_durumu: "odendi",
      odenen_tutar: 500,
      notlar: "100 Kontör paketi",
    }
  });
  lisansSayisi++;

  // Kurumsal E-Posta - Süresiz
  const m3b3 = rastgeleTarih(200);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id,
      bayi_id: bayi3.id,
      urun_id: urunMap["Kurumsal E-Posta"],
      lisans_tipi_id: lisansTipiMap["suresiz"],
      lisans_tipi: "suresiz",
      suresiz: 1,
      lisans_anahtari: lisansAnahtari("MAIL"),
      baslangic_tarihi: m3b3,
      bitis_tarihi: null,
      kullanim_gunu: 0,
      durum: "aktif",
      domain: "nimetdemir.com",
      fiyat: 500,
      net_tutar: 500,
      kullanici_sayisi: 5,
      odeme_durumu: "odendi",
      odenen_tutar: 500,
    }
  });
  lisansSayisi++;
  console.log(`   ✓ Nimet Demir için ${lisansSayisi - m3Onceki} lisans oluşturuldu (Bayi: Kodgem)`);

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
   │   ├─ Güzel Teknoloji (İstanbul)
   │   ├─ Panu Teknoloji (İzmir)
   │   └─ Kodgem (Ankara)
   ├─ Müşteriler: 3
   │   ├─ Baran Ürüncan (Bağımsız)
   │   ├─ Ali Köse (Bayi: Güzel Teknoloji)
   │   └─ Nimet Demir (Bayi: Kodgem)
   └─ Lisanslar: ${lisansSayisi}
       ├─ 2 adet süresiz lisans (PAVO SmartPos + E-Posta)
       └─ ${lisansSayisi - 2} adet yıllık lisans
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
