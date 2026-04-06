// =============================================
// VEGA YAZILIM - TAM SEED SCRIPTI
// Tüm verileri siler, ürünleri ve örnek müşteri ekler
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("\n🚀 VEGA Seed başlıyor...\n");
  console.log("=".repeat(50));

  // =============================================
  // 1. TÜM VERİLERİ TEMİZLE
  // =============================================
  console.log("\n🧹 Tüm veriler temizleniyor...");
  
  // Sıralı silme (foreign key ilişkileri nedeniyle)
  const silmeSirasi = [
    { model: "lisansDetay", ad: "Lisans Detayları" },
    { model: "pakettekiOzellik", ad: "Paketteki Özellikler" },
    { model: "musteriPaketi", ad: "Müşteri Paketleri" },
    { model: "sablonOzellik", ad: "Şablon Özellikleri" },
    { model: "urunPaketi", ad: "Ürün Paketleri" },
    { model: "uygulamaTipi", ad: "Uygulama Tipleri" },
    { model: "urunTipi", ad: "Ürün Tipleri" },
    { model: "iletisimKisi", ad: "İletişim Kişileri" },
    { model: "iletisim", ad: "İletişimler" },
    { model: "musteriCopKutusu", ad: "Müşteri Çöp Kutusu" },
    { model: "musteri", ad: "Müşteriler" },
    { model: "urunGrubu", ad: "Ürün Grupları" },
  ];

  for (const item of silmeSirasi) {
    try {
      const count = await prisma[item.model].deleteMany({});
      console.log(`   ✓ ${item.ad}: ${count.count} kayıt silindi`);
    } catch (e) {
      console.log(`   ⚠ ${item.ad}: Atlandı (${e.message.slice(0, 50)}...)`);
    }
  }
  console.log("\n✅ Temizlik tamamlandı");

  // =============================================
  // 2. ÜRÜN GRUPLARI (Markalar)
  // =============================================
  console.log("\n📦 Ürün Grupları oluşturuluyor...");
  
  const gruplar = [
    { ad: "VEGA", aciklama: "Vega Yazılım ürünleri" },
    { ad: "GIB", aciklama: "Gelir İdaresi Başkanlığı entegrasyonları" },
    { ad: "PAVO", aciklama: "PAVO marka ÖKC cihazları" },
    { ad: "INPOS", aciklama: "INPOS marka ÖKC cihazları" },
    { ad: "INGENICO", aciklama: "INGENICO marka ÖKC cihazları" },
    { ad: "METUNIC", aciklama: "Domain hizmetleri" },
    { ad: "GUZELNET", aciklama: "Hosting ve E-Posta hizmetleri" },
    { ad: "ARCTOS", aciklama: "Arctos paket programlar" },
  ];

  const grupMap = {};
  for (const g of gruplar) {
    const created = await prisma.urunGrubu.create({ data: g });
    grupMap[g.ad] = created.id;
  }
  console.log(`   ✓ ${gruplar.length} grup oluşturuldu`);

  // =============================================
  // 3. ÜRÜN TİPLERİ
  // =============================================
  console.log("\n📱 Ürün Tipleri oluşturuluyor...");
  
  const tipler = [
    { ad: "Yazılım", grup: "VEGA" },
    { ad: "E-Fatura", grup: "GIB" },
    { ad: "E-Arşiv", grup: "GIB" },
    { ad: "E-İrsaliye", grup: "GIB" },
    { ad: "E-Defter", grup: "GIB" },
    { ad: "ÖKC", grup: "PAVO" },
    { ad: "ÖKC", grup: "INPOS" },
    { ad: "ÖKC", grup: "INGENICO" },
    { ad: "Domain", grup: "METUNIC" },
    { ad: "Hosting", grup: "GUZELNET" },
    { ad: "E-Posta", grup: "GUZELNET" },
    { ad: "Paket Program", grup: "ARCTOS" },
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
  // 4. UYGULAMA TİPLERİ
  // =============================================
  console.log("\n💻 Uygulama Tipleri oluşturuluyor...");
  
  const uygulamaTipleri = [
    // VEGA Yazılım
    { ad: "Masaüstü", tip: "VEGA-Yazılım" },
    { ad: "Web", tip: "VEGA-Yazılım" },
    // GIB
    { ad: "Web Portal", tip: "GIB-E-Fatura" },
    { ad: "Entegrasyon", tip: "GIB-E-Fatura" },
    { ad: "Web Portal", tip: "GIB-E-Arşiv" },
    { ad: "Entegrasyon", tip: "GIB-E-Arşiv" },
    { ad: "Web Portal", tip: "GIB-E-İrsaliye" },
    { ad: "Web Portal", tip: "GIB-E-Defter" },
    // ÖKC
    { ad: "GMU", tip: "PAVO-ÖKC" },
    { ad: "TSM", tip: "PAVO-ÖKC" },
    { ad: "GMU", tip: "INPOS-ÖKC" },
    { ad: "TSM", tip: "INPOS-ÖKC" },
    { ad: "GMU", tip: "INGENICO-ÖKC" },
    { ad: "TSM", tip: "INGENICO-ÖKC" },
    // Hosting & Domain
    { ad: "Panel", tip: "METUNIC-Domain" },
    { ad: "Panel", tip: "GUZELNET-Hosting" },
    { ad: "Panel", tip: "GUZELNET-E-Posta" },
    // Arctos
    { ad: "Masaüstü", tip: "ARCTOS-Paket Program" },
  ];

  const uygulamaMap = {};
  for (const u of uygulamaTipleri) {
    const tipId = tipMap[u.tip];
    if (!tipId) continue;
    const created = await prisma.uygulamaTipi.create({
      data: { ad: u.ad, tip_id: tipId }
    });
    uygulamaMap[`${u.tip}-${u.ad}`] = created.id;
  }
  console.log(`   ✓ ${Object.keys(uygulamaMap).length} uygulama tipi oluşturuldu`);

  // =============================================
  // 5. ÜRÜN PAKETLERİ + ŞABLON ÖZELLİKLERİ
  // =============================================
  console.log("\n📋 Ürün Paketleri ve Şablonları oluşturuluyor...");

  // Helper: Şablon özelliği oluştur
  const ozellikOlustur = async (paketId, ozellikler) => {
    for (let i = 0; i < ozellikler.length; i++) {
      await prisma.sablonOzellik.create({
        data: {
          paket_id: paketId,
          ozellik_tipi: ozellikler[i].tip,
          baslik: ozellikler[i].baslik || "",
          deger: ozellikler[i].deger,
          sira: i,
        }
      });
    }
  };

  let paketSayisi = 0;

  // -----------------------------------------
  // VEGA YAZILIM - VegaPos & VegaCari
  // -----------------------------------------
  const vegaYazilimTip = tipMap["VEGA-Yazılım"];
  const vegaMasaustu = uygulamaMap["VEGA-Yazılım-Masaüstü"];
  
  // VegaPos Masaüstü
  const vegaPos = await prisma.urunPaketi.create({
    data: {
      ad: "VegaPos",
      aciklama: "Satış ve stok yönetim yazılımı",
      tip_id: vegaYazilimTip,
      uygulama_tipi_id: vegaMasaustu,
      aktif: true,
    }
  });
  await ozellikOlustur(vegaPos.id, [
    { tip: "temel_fiyat", baslik: "Lisans Ücreti", deger: { fiyat: 5000, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "Kullanıcı", deger: { min: 1, max: 50, ek_kullanici_fiyat: 500 } },
    { tip: "demo_suresi", baslik: "Deneme", deger: { gun: 30 } },
  ]);
  paketSayisi++;

  // VegaCari
  const vegaCari = await prisma.urunPaketi.create({
    data: {
      ad: "VegaCari",
      aciklama: "Cari hesap ve muhasebe takip yazılımı",
      tip_id: vegaYazilimTip,
      uygulama_tipi_id: vegaMasaustu,
      aktif: true,
    }
  });
  await ozellikOlustur(vegaCari.id, [
    { tip: "temel_fiyat", baslik: "Lisans Ücreti", deger: { fiyat: 3500, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "Kullanıcı", deger: { min: 1, max: 20, ek_kullanici_fiyat: 350 } },
    { tip: "demo_suresi", baslik: "Deneme", deger: { gun: 15 } },
  ]);
  paketSayisi++;

  // -----------------------------------------
  // GIB E-Fatura Paketleri
  // -----------------------------------------
  const gibFaturaTip = tipMap["GIB-E-Fatura"];
  const gibWebPortal = uygulamaMap["GIB-E-Fatura-Web Portal"];

  // E-Fatura Başlangıç
  const efaturaBaslangic = await prisma.urunPaketi.create({
    data: {
      ad: "E-Fatura Başlangıç",
      aciklama: "Küçük işletmeler için e-fatura paketi",
      tip_id: gibFaturaTip,
      uygulama_tipi_id: gibWebPortal,
      aktif: true,
    }
  });
  await ozellikOlustur(efaturaBaslangic.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1200, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Fatura Paketi", deger: { 
      tip: "adet", 
      birim: "Fatura",
      kademeler: [
        { deger: "500 Fatura", fiyat: 0 },
        { deger: "1000 Fatura", fiyat: 300 },
        { deger: "2500 Fatura", fiyat: 600 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  paketSayisi++;

  // E-Fatura Profesyonel
  const efaturaPro = await prisma.urunPaketi.create({
    data: {
      ad: "E-Fatura Profesyonel",
      aciklama: "Orta ölçekli işletmeler için e-fatura paketi",
      tip_id: gibFaturaTip,
      uygulama_tipi_id: gibWebPortal,
      aktif: true,
    }
  });
  await ozellikOlustur(efaturaPro.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 2500, yenileme_fiyat: 2000, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Fatura Paketi", deger: { 
      tip: "adet", 
      birim: "Fatura",
      kademeler: [
        { deger: "5000 Fatura", fiyat: 0 },
        { deger: "10000 Fatura", fiyat: 500 },
        { deger: "25000 Fatura", fiyat: 1000 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  paketSayisi++;

  // -----------------------------------------
  // GIB E-Arşiv Paketi
  // -----------------------------------------
  const gibArsivTip = tipMap["GIB-E-Arşiv"];
  const gibArsivPortal = uygulamaMap["GIB-E-Arşiv-Web Portal"];

  const earsiv = await prisma.urunPaketi.create({
    data: {
      ad: "E-Arşiv Fatura",
      aciklama: "E-Arşiv fatura çözümü",
      tip_id: gibArsivTip,
      uygulama_tipi_id: gibArsivPortal,
      aktif: true,
    }
  });
  await ozellikOlustur(earsiv.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 1000, yenileme_fiyat: 800, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Fatura Paketi", deger: { 
      tip: "adet", 
      birim: "Fatura",
      kademeler: [
        { deger: "1000 Fatura", fiyat: 0 },
        { deger: "5000 Fatura", fiyat: 400 },
        { deger: "10000 Fatura", fiyat: 750 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  paketSayisi++;

  // -----------------------------------------
  // PAVO ÖKC
  // -----------------------------------------
  const pavoOkcTip = tipMap["PAVO-ÖKC"];
  const pavoGmu = uygulamaMap["PAVO-ÖKC-GMU"];

  const pavoPos = await prisma.urunPaketi.create({
    data: {
      ad: "PAVO Pos",
      aciklama: "PAVO marka yeni nesil ÖKC",
      tip_id: pavoOkcTip,
      uygulama_tipi_id: pavoGmu,
      aktif: true,
    }
  });
  await ozellikOlustur(pavoPos.id, [
    { tip: "temel_fiyat", baslik: "Cihaz Bedeli", deger: { fiyat: 8500, para_birimi: "TL" } },
    { tip: "sicil_domain", baslik: "Sicil No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  paketSayisi++;

  // -----------------------------------------
  // METUNIC DOMAIN
  // -----------------------------------------
  const domainTip = tipMap["METUNIC-Domain"];
  const domainPanel = uygulamaMap["METUNIC-Domain-Panel"];

  const domainPaketi = await prisma.urunPaketi.create({
    data: {
      ad: "Domain Kaydı",
      aciklama: "Domain tescil ve yenileme hizmeti",
      tip_id: domainTip,
      uygulama_tipi_id: domainPanel,
      aktif: true,
    }
  });
  await ozellikOlustur(domainPaketi.id, [
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
  paketSayisi++;

  // -----------------------------------------
  // GUZELNET HOSTING
  // -----------------------------------------
  const hostingTip = tipMap["GUZELNET-Hosting"];
  const hostingPanel = uygulamaMap["GUZELNET-Hosting-Panel"];

  const hostingPaketi = await prisma.urunPaketi.create({
    data: {
      ad: "Web Hosting",
      aciklama: "SSD tabanlı web hosting hizmeti",
      tip_id: hostingTip,
      uygulama_tipi_id: hostingPanel,
      aktif: true,
    }
  });
  await ozellikOlustur(hostingPaketi.id, [
    { tip: "temel_fiyat", baslik: "Temel Ücret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "Fiyatlandırma", deger: { aktivasyon_fiyat: 500, yenileme_fiyat: 450, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Disk Alanı", deger: { 
      tip: "kapasite", 
      birim: "GB",
      kademeler: [
        { deger: "5 GB", fiyat: 0 },
        { deger: "10 GB", fiyat: 150 },
        { deger: "25 GB", fiyat: 350 },
        { deger: "50 GB", fiyat: 600 },
      ]
    }},
    { tip: "sicil_domain", baslik: "Domain", deger: { alan_tipi: "domain", zorunlu: true } },
  ]);
  paketSayisi++;

  // -----------------------------------------
  // ARCTOS PAKET PROGRAM
  // -----------------------------------------
  const arctosTip = tipMap["ARCTOS-Paket Program"];
  const arctosMasaustu = uygulamaMap["ARCTOS-Paket Program-Masaüstü"];

  const arctosPro = await prisma.urunPaketi.create({
    data: {
      ad: "Arctos Pro",
      aciklama: "Profesyonel ön muhasebe yazılımı",
      tip_id: arctosTip,
      uygulama_tipi_id: arctosMasaustu,
      aktif: true,
    }
  });
  await ozellikOlustur(arctosPro.id, [
    { tip: "temel_fiyat", baslik: "Lisans Ücreti", deger: { fiyat: 4500, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "Kullanıcı", deger: { min: 1, max: 10, ek_kullanici_fiyat: 450 } },
    { tip: "demo_suresi", baslik: "Deneme", deger: { gun: 14 } },
  ]);
  paketSayisi++;

  console.log(`   ✓ ${paketSayisi} ürün paketi oluşturuldu (şablonlarla birlikte)`);

  // =============================================
  // 6. ÖRNEK MÜŞTERİ
  // =============================================
  console.log("\n👤 Örnek müşteri oluşturuluyor...");

  const ornekMusteri = await prisma.musteri.create({
    data: {
      firma_adi: "Demo Ticaret A.Ş.",
      vergi_no: "1234567890",
      vergi_dairesi: "Kadıköy",
      telefon: "0216 555 1234",
      eposta: "bilgi@demoticaret.com",
      adres: "Kadıköy, İstanbul",
      il: "İstanbul",
      ilce: "Kadıköy",
      yetkili_kisi: "Ahmet Yılmaz",
      aktif: true,
      notlar: "Seed ile oluşturulmuş demo müşteri",
    }
  });

  // Müşteriye iletişim ekle
  await prisma.iletisim.create({
    data: {
      musteri_id: ornekMusteri.id,
      tur: "ARAMA",
      konu: "İlk Görüşme",
      notlar: "Ürünler hakkında bilgi alındı, demo talep edildi.",
      tarih: new Date(),
      tamamlandi: true,
    }
  });

  // Müşteriye bir paket ekle (VegaPos)
  const bugun = new Date();
  const birYilSonra = new Date(bugun);
  birYilSonra.setFullYear(birYilSonra.getFullYear() + 1);

  await prisma.musteriPaketi.create({
    data: {
      musteri_id: ornekMusteri.id,
      paket_id: vegaPos.id,
      lisans_tipi: "YILLIK",
      baslangic_tarihi: bugun,
      bitis_tarihi: birYilSonra,
      kullanim_gunu: 365,
      kullanici_sayisi: 3,
      ek_kullanici: 2,
      fiyat: 6000,
      indirim_orani: 0,
      indirim_tutari: 0,
      net_tutar: 6000,
      odeme_yontemi: "HAVALE",
      odeme_durumu: "ODENDI",
      aktif: true,
      notlar: "Seed ile oluşturulmuş örnek paket",
    }
  });

  console.log(`   ✓ Müşteri oluşturuldu: ${ornekMusteri.firma_adi}`);
  console.log(`   ✓ İletişim kaydı eklendi`);
  console.log(`   ✓ Müşteri paketi eklendi: VegaPos (1 yıllık)`);

  // =============================================
  // ÖZET
  // =============================================
  console.log("\n" + "=".repeat(50));
  console.log("✅ SEED TAMAMLANDI");
  console.log("=".repeat(50));
  console.log(`
📊 Özet:
   • Ürün Grupları: ${gruplar.length}
   • Ürün Tipleri: ${Object.keys(tipMap).length}
   • Uygulama Tipleri: ${Object.keys(uygulamaMap).length}
   • Ürün Paketleri: ${paketSayisi}
   • Müşteriler: 1 (Demo Ticaret A.Ş.)
`);
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
