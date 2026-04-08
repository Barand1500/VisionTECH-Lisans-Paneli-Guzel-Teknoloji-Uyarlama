// =============================================
// GÃœZEL TEKNOLOJÄ° - KAPSAMLI SEED SCRIPTI v3
// Åablonlar, ÃœrÃ¼nler, Paketler, Bayiler, MÃ¼ÅŸteriler ve Lisanslar
// =============================================
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// YardÄ±mcÄ±: Rastgele tarih Ã¼ret (son X gÃ¼n iÃ§inde)
const rastgeleTarih = (gunOnce = 365) => {
  const bugun = new Date();
  const rastgeleGun = Math.floor(Math.random() * gunOnce);
  return new Date(bugun.getTime() - rastgeleGun * 24 * 60 * 60 * 1000);
};

// YardÄ±mcÄ±: BitiÅŸ tarihi Ã¼ret (baÅŸlangÄ±Ã§tan X gÃ¼n sonra)
const bitisTarihiHesapla = (baslangic, gun = 365) => {
  const bitis = new Date(baslangic);
  bitis.setDate(bitis.getDate() + gun);
  return bitis;
};

// YardÄ±mcÄ±: Rastgele lisans anahtarÄ±
const lisansAnahtari = () => {
  const karakterler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const gruplar = [];
  for (let g = 0; g < 4; g++) {
    let grup = "";
    for (let i = 0; i < 4; i++) {
      grup += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
    }
    gruplar.push(grup);
  }
  return "GT-" + gruplar.join("-");
};

async function main() {
  console.log("\nğŸš€ GÃ¼zel Teknoloji Seed v3 baÅŸlÄ±yor...\n");
  console.log("=".repeat(60));

  // =============================================
  // 1. TÃœM VERÄ°LERÄ° TEMÄ°ZLE
  // =============================================
  console.log("\nğŸ§¹ TÃ¼m veriler temizleniyor...");
  
  const silmeSirasi = [
    { model: "lisans", ad: "Lisanslar" },
    { model: "paket", ad: "Paketler" },
    { model: "surum", ad: "SÃ¼rÃ¼mler" },
    { model: "bayiUrun", ad: "Bayi ÃœrÃ¼nleri" },
    { model: "urun", ad: "ÃœrÃ¼nler" },
    { model: "sablonOzellik", ad: "Åablon Ã–zellikleri" },
    { model: "urunSablon", ad: "ÃœrÃ¼n ÅablonlarÄ±" },
    { model: "uygulamaTipi", ad: "Uygulama Tipleri" },
    { model: "urunTipi", ad: "ÃœrÃ¼n Tipleri" },
    { model: "iletisimKisi", ad: "Ä°letiÅŸim KiÅŸileri" },
    { model: "iletisimKaydi", ad: "Ä°letiÅŸim KayÄ±tlarÄ±" },
    { model: "noti", ad: "Notlar" },
    { model: "musteriDosya", ad: "MÃ¼ÅŸteri DosyalarÄ±" },
    { model: "musteriAdres", ad: "MÃ¼ÅŸteri Adresleri" },
    { model: "musteriTelefon", ad: "MÃ¼ÅŸteri TelefonlarÄ±" },
    { model: "musteri", ad: "MÃ¼ÅŸteriler" },
    { model: "bayiDosya", ad: "Bayi DosyalarÄ±" },
    { model: "bayi", ad: "Bayiler" },
    { model: "urunGrubu", ad: "ÃœrÃ¼n GruplarÄ±" },
    { model: "lisansTipi", ad: "Lisans Tipleri" },
    { model: "paketTipi", ad: "Paket Tipleri" },
    { model: "sektor", ad: "SektÃ¶rler" },
  ];

  for (const item of silmeSirasi) {
    try {
      const count = await prisma[item.model].deleteMany({});
      console.log(`   âœ“ ${item.ad}: ${count.count} kayÄ±t silindi`);
    } catch (e) {
      console.log(`   âš  ${item.ad}: AtlandÄ± (${e.message?.slice(0, 50) || 'hata'})`);
    }
  }
  console.log("\nâœ… Temizlik tamamlandÄ±");

  // =============================================
  // 2. SEKTÃ–RLER
  // =============================================
  console.log("\nğŸ­ SektÃ¶rler oluÅŸturuluyor...");
  
  const sektorler = [
    { ad: "Perakende" },
    { ad: "Toptan Ticaret" },
    { ad: "Hizmet" },
    { ad: "Ãœretim" },
    { ad: "Teknoloji" },
    { ad: "SaÄŸlÄ±k" },
  ];
  
  const sektorMap = {};
  for (const s of sektorler) {
    const created = await prisma.sektor.create({ data: s });
    sektorMap[s.ad] = created.id;
  }
  console.log(`   âœ“ ${sektorler.length} sektÃ¶r oluÅŸturuldu`);

  // =============================================
  // 3. LÄ°SANS TÄ°PLERÄ°
  // =============================================
  console.log("\nğŸ“‹ Lisans Tipleri oluÅŸturuluyor...");
  
  const lisansTipleri = [
    { ad: "Demo", kod: "demo", renk: "amber", gun: 30, sira: 1 },
    { ad: "AylÄ±k", kod: "aylik", renk: "blue", gun: 30, sira: 2 },
    { ad: "3 AylÄ±k", kod: "3aylik", renk: "cyan", gun: 90, sira: 3 },
    { ad: "6 AylÄ±k", kod: "6aylik", renk: "teal", gun: 180, sira: 4 },
    { ad: "YÄ±llÄ±k", kod: "yillik", renk: "emerald", gun: 365, sira: 5 },
    { ad: "SÃ¼resiz", kod: "suresiz", renk: "purple", gun: 0, suresiz: 1, sira: 6 },
  ];
  
  const lisansTipiMap = {};
  for (const lt of lisansTipleri) {
    const created = await prisma.lisansTipi.create({ data: lt });
    lisansTipiMap[lt.kod] = created.id;
  }
  console.log(`   âœ“ ${lisansTipleri.length} lisans tipi oluÅŸturuldu`);

  // =============================================
  // 4. PAKET TÄ°PLERÄ°
  // =============================================
  console.log("\nğŸ“¦ Paket Tipleri oluÅŸturuluyor...");
  
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
  console.log(`   âœ“ ${paketTipleri.length} paket tipi oluÅŸturuldu`);

  // =============================================
  // 5. ÃœRÃœN GRUPLARI
  // =============================================
  console.log("\nğŸ“ ÃœrÃ¼n GruplarÄ± oluÅŸturuluyor...");
  
  const gruplar = [
    { ad: "VEGA", aciklama: "Vega YazÄ±lÄ±m ana Ã¼rÃ¼nleri" },
    { ad: "GIB", aciklama: "Gelir Ä°daresi BaÅŸkanlÄ±ÄŸÄ± entegrasyonlarÄ±" },
    { ad: "PAVO", aciklama: "PAVO marka Ã–KC cihazlarÄ±" },
    { ad: "METUNIC", aciklama: "Domain ve DNS hizmetleri" },
    { ad: "GUZELNET", aciklama: "Hosting ve E-Posta hizmetleri" },
  ];

  const grupMap = {};
  for (const g of gruplar) {
    const created = await prisma.urunGrubu.create({ data: g });
    grupMap[g.ad] = created.id;
  }
  console.log(`   âœ“ ${gruplar.length} grup oluÅŸturuldu`);

  // =============================================
  // 6. ÃœRÃœN TÄ°PLERÄ°
  // =============================================
  console.log("\nğŸ“± ÃœrÃ¼n Tipleri oluÅŸturuluyor...");
  
  const tipler = [
    { ad: "SatÄ±ÅŸ YazÄ±lÄ±mÄ±", grup: "VEGA" },
    { ad: "Muhasebe YazÄ±lÄ±mÄ±", grup: "VEGA" },
    { ad: "E-Fatura", grup: "GIB" },
    { ad: "E-ArÅŸiv", grup: "GIB" },
    { ad: "E-Ä°rsaliye", grup: "GIB" },
    { ad: "Ã–KC Cihaz", grup: "PAVO" },
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
  console.log(`   âœ“ ${tipler.length} tip oluÅŸturuldu`);

  // =============================================
  // 7. UYGULAMA TÄ°PLERÄ°
  // =============================================
  console.log("\nğŸ’» Uygulama Tipleri oluÅŸturuluyor...");
  
  const uygulamaTipleri = [
    { ad: "MasaÃ¼stÃ¼", tip: "VEGA-SatÄ±ÅŸ YazÄ±lÄ±mÄ±" },
    { ad: "Web", tip: "VEGA-SatÄ±ÅŸ YazÄ±lÄ±mÄ±" },
    { ad: "MasaÃ¼stÃ¼", tip: "VEGA-Muhasebe YazÄ±lÄ±mÄ±" },
    { ad: "Web Portal", tip: "GIB-E-Fatura" },
    { ad: "Entegrasyon", tip: "GIB-E-Fatura" },
    { ad: "Web Portal", tip: "GIB-E-ArÅŸiv" },
    { ad: "Web Portal", tip: "GIB-E-Ä°rsaliye" },
    { ad: "GMU", tip: "PAVO-Ã–KC Cihaz" },
    { ad: "TSM", tip: "PAVO-Ã–KC Cihaz" },
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
  console.log(`   âœ“ ${Object.keys(uygulamaMap).length} uygulama tipi oluÅŸturuldu`);

  // =============================================
  // 8. ÃœRÃœN ÅABLONLARI + Ã–ZELLÄ°KLERÄ°
  // =============================================
  console.log("\nğŸ“‹ ÃœrÃ¼n ÅablonlarÄ± oluÅŸturuluyor...");

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

  // ----- VEGA POS ÅABLONU -----
  const vegaPosSablon = await prisma.urunSablon.create({
    data: {
      ad: "VegaPos Åablonu",
      aciklama: "SatÄ±ÅŸ ve stok yÃ¶netim yazÄ±lÄ±mÄ± ÅŸablonu",
      grup_id: grupMap["VEGA"],
      urun_tipi_id: tipMap["VEGA-SatÄ±ÅŸ YazÄ±lÄ±mÄ±"],
      uygulama_tipi_id: uygulamaMap["VEGA-SatÄ±ÅŸ YazÄ±lÄ±mÄ±-MasaÃ¼stÃ¼"],
    }
  });
  await ozellikOlustur(vegaPosSablon.id, [
    { tip: "temel_fiyat", baslik: "Lisans Ãœcreti", deger: { fiyat: 5000, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "KullanÄ±cÄ± Limiti", deger: { min: 1, max: 50, ek_kullanici_fiyat: 500 } },
    { tip: "aktivasyon_yenileme", baslik: "FiyatlandÄ±rma", deger: { aktivasyon_fiyat: 5000, yenileme_fiyat: 3500, para_birimi: "TL" } },
    { tip: "demo_suresi", baslik: "Demo SÃ¼resi", deger: { gun: 30 } },
  ]);
  sablonMap["VegaPos"] = vegaPosSablon.id;
  sablonSayisi++;

  // ----- VEGA CARÄ° ÅABLONU -----
  const vegaCariSablon = await prisma.urunSablon.create({
    data: {
      ad: "VegaCari Åablonu",
      aciklama: "Cari hesap ve muhasebe takip ÅŸablonu",
      grup_id: grupMap["VEGA"],
      urun_tipi_id: tipMap["VEGA-Muhasebe YazÄ±lÄ±mÄ±"],
      uygulama_tipi_id: uygulamaMap["VEGA-Muhasebe YazÄ±lÄ±mÄ±-MasaÃ¼stÃ¼"],
    }
  });
  await ozellikOlustur(vegaCariSablon.id, [
    { tip: "temel_fiyat", baslik: "Lisans Ãœcreti", deger: { fiyat: 3500, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "KullanÄ±cÄ± Limiti", deger: { min: 1, max: 20, ek_kullanici_fiyat: 350 } },
    { tip: "aktivasyon_yenileme", baslik: "FiyatlandÄ±rma", deger: { aktivasyon_fiyat: 3500, yenileme_fiyat: 2500, para_birimi: "TL" } },
    { tip: "demo_suresi", baslik: "Demo SÃ¼resi", deger: { gun: 15 } },
  ]);
  sablonMap["VegaCari"] = vegaCariSablon.id;
  sablonSayisi++;

  // ----- E-Mutabakat KontÃ¶r ÅABLONU -----
  const eMutabakatSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-Mutabakat KontÃ¶r Åablonu",
      aciklama: "E-Mutabakat kontÃ¶r satÄ±ÅŸ ÅŸablonu",
      grup_id: grupMap["VEGA"],
      urun_tipi_id: tipMap["VEGA-Muhasebe YazÄ±lÄ±mÄ±"],
      uygulama_tipi_id: uygulamaMap["VEGA-Muhasebe YazÄ±lÄ±mÄ±-MasaÃ¼stÃ¼"],
    }
  });
  await ozellikOlustur(eMutabakatSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ãœcret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "KontÃ¶r Paketleri", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 100, birim: "KontÃ¶r", fiyat: 500 },
        { adet: 250, birim: "KontÃ¶r", fiyat: 1000 },
        { adet: 500, birim: "KontÃ¶r", fiyat: 1750 },
        { adet: 1000, birim: "KontÃ¶r", fiyat: 3000 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-Mutabakat"] = eMutabakatSablon.id;
  sablonSayisi++;

  // ----- E-FATURA ÅABLONU -----
  const efaturaSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-Fatura Åablonu",
      aciklama: "E-Fatura portal ve entegrasyon ÅŸablonu",
      grup_id: grupMap["GIB"],
      urun_tipi_id: tipMap["GIB-E-Fatura"],
      uygulama_tipi_id: uygulamaMap["GIB-E-Fatura-Web Portal"],
    }
  });
  await ozellikOlustur(efaturaSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ãœcret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "FiyatlandÄ±rma", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1200, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "KontÃ¶r Paketi", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 500, birim: "KontÃ¶r", fiyat: 0 },
        { adet: 1000, birim: "KontÃ¶r", fiyat: 300 },
        { adet: 2500, birim: "KontÃ¶r", fiyat: 600 },
        { adet: 5000, birim: "KontÃ¶r", fiyat: 1000 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-Fatura"] = efaturaSablon.id;
  sablonSayisi++;

  // ----- E-ARÅÄ°V ÅABLONU -----
  const earsivSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-ArÅŸiv Åablonu",
      aciklama: "E-ArÅŸiv fatura ÅŸablonu",
      grup_id: grupMap["GIB"],
      urun_tipi_id: tipMap["GIB-E-ArÅŸiv"],
      uygulama_tipi_id: uygulamaMap["GIB-E-ArÅŸiv-Web Portal"],
    }
  });
  await ozellikOlustur(earsivSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ãœcret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "FiyatlandÄ±rma", deger: { aktivasyon_fiyat: 1000, yenileme_fiyat: 800, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "KontÃ¶r Paketi", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 1000, birim: "KontÃ¶r", fiyat: 0 },
        { adet: 5000, birim: "KontÃ¶r", fiyat: 400 },
        { adet: 10000, birim: "KontÃ¶r", fiyat: 750 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-ArÅŸiv"] = earsivSablon.id;
  sablonSayisi++;

  // ----- E-Ä°RSALÄ°YE ÅABLONU -----
  const eirsaliyeSablon = await prisma.urunSablon.create({
    data: {
      ad: "E-Ä°rsaliye Åablonu",
      aciklama: "E-Ä°rsaliye ÅŸablonu",
      grup_id: grupMap["GIB"],
      urun_tipi_id: tipMap["GIB-E-Ä°rsaliye"],
      uygulama_tipi_id: uygulamaMap["GIB-E-Ä°rsaliye-Web Portal"],
    }
  });
  await ozellikOlustur(eirsaliyeSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ãœcret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "FiyatlandÄ±rma", deger: { aktivasyon_fiyat: 800, yenileme_fiyat: 600, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "KontÃ¶r Paketi", deger: { 
      tip: "adet", 
      kademeler: [
        { adet: 500, birim: "KontÃ¶r", fiyat: 0 },
        { adet: 2000, birim: "KontÃ¶r", fiyat: 300 },
      ]
    }},
    { tip: "sicil_domain", baslik: "VKN/TCKN", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["E-Ä°rsaliye"] = eirsaliyeSablon.id;
  sablonSayisi++;

  // ----- PAVO Ã–KC ÅABLONU -----
  const pavoSablon = await prisma.urunSablon.create({
    data: {
      ad: "PAVO Ã–KC Åablonu",
      aciklama: "PAVO yeni nesil Ã–KC cihazÄ± ÅŸablonu",
      grup_id: grupMap["PAVO"],
      urun_tipi_id: tipMap["PAVO-Ã–KC Cihaz"],
      uygulama_tipi_id: uygulamaMap["PAVO-Ã–KC Cihaz-GMU"],
    }
  });
  await ozellikOlustur(pavoSablon.id, [
    { tip: "temel_fiyat", baslik: "Cihaz Bedeli", deger: { fiyat: 8500, para_birimi: "TL" } },
    { tip: "sicil_domain", baslik: "Sicil No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
  ]);
  sablonMap["PAVO-OKC"] = pavoSablon.id;
  sablonSayisi++;

  // ----- DOMAÄ°N ÅABLONU -----
  const domainSablon = await prisma.urunSablon.create({
    data: {
      ad: "Domain Åablonu",
      aciklama: "Domain tescil ve yenileme ÅŸablonu",
      grup_id: grupMap["METUNIC"],
      urun_tipi_id: tipMap["METUNIC-Domain"],
      uygulama_tipi_id: uygulamaMap["METUNIC-Domain-Panel"],
    }
  });
  await ozellikOlustur(domainSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ãœcret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "domain_fiyat", baslik: "Domain UzantÄ±larÄ±", deger: { 
      para_birimi: "TL",
      uzantilar: [
        { uzanti: ".com", aktivasyon: 350, yenileme: 350 },
        { uzanti: ".com.tr", aktivasyon: 150, yenileme: 120 },
        { uzanti: ".net", aktivasyon: 400, yenileme: 400 },
        { uzanti: ".org", aktivasyon: 380, yenileme: 380 },
        { uzanti: ".xyz", aktivasyon: 50, yenileme: 50 },
      ]
    }},
    { tip: "sicil_domain", baslik: "Domain AdÄ±", deger: { alan_tipi: "domain", zorunlu: true } },
  ]);
  sablonMap["Domain"] = domainSablon.id;
  sablonSayisi++;

  // ----- HOSTÄ°NG ÅABLONU -----
  const hostingSablon = await prisma.urunSablon.create({
    data: {
      ad: "Web Hosting Åablonu",
      aciklama: "SSD tabanlÄ± web hosting ÅŸablonu",
      grup_id: grupMap["GUZELNET"],
      urun_tipi_id: tipMap["GUZELNET-Hosting"],
      uygulama_tipi_id: uygulamaMap["GUZELNET-Hosting-Panel"],
    }
  });
  await ozellikOlustur(hostingSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ãœcret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "FiyatlandÄ±rma", deger: { aktivasyon_fiyat: 500, yenileme_fiyat: 450, para_birimi: "TL" } },
    { tip: "kademeli_fiyat", baslik: "Disk AlanÄ±", deger: { 
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

  // ----- E-POSTA ÅABLONU -----
  const epostaSablon = await prisma.urunSablon.create({
    data: {
      ad: "Kurumsal E-Posta Åablonu",
      aciklama: "Kurumsal e-posta hizmeti ÅŸablonu",
      grup_id: grupMap["GUZELNET"],
      urun_tipi_id: tipMap["GUZELNET-E-Posta"],
      uygulama_tipi_id: uygulamaMap["GUZELNET-E-Posta-Panel"],
    }
  });
  await ozellikOlustur(epostaSablon.id, [
    { tip: "temel_fiyat", baslik: "Temel Ãœcret", deger: { fiyat: 0, para_birimi: "TL" } },
    { tip: "aktivasyon_yenileme", baslik: "FiyatlandÄ±rma", deger: { aktivasyon_fiyat: 200, yenileme_fiyat: 180, para_birimi: "TL" } },
    { tip: "kullanici_sayisi", baslik: "Hesap SayÄ±sÄ±", deger: { min: 1, max: 100, ek_kullanici_fiyat: 50 } },
    { tip: "sicil_domain", baslik: "Domain", deger: { alan_tipi: "domain", zorunlu: true } },
  ]);
  sablonMap["E-Posta"] = epostaSablon.id;
  sablonSayisi++;

  console.log(`   âœ“ ${sablonSayisi} ÅŸablon oluÅŸturuldu`);

  // =============================================
  // 9. ÃœRÃœNLER
  // =============================================
  console.log("\nğŸ“¦ ÃœrÃ¼nler oluÅŸturuluyor...");

  const urunVerileri = [
    { ad: "VegaPos", sablon: "VegaPos", grup: "VEGA", temelFiyat: 5000, aciklama: "Profesyonel satÄ±ÅŸ ve stok yÃ¶netim yazÄ±lÄ±mÄ±" },
    { ad: "VegaCari", sablon: "VegaCari", grup: "VEGA", temelFiyat: 3500, aciklama: "Cari hesap ve muhasebe takip yazÄ±lÄ±mÄ±" },
    { ad: "E-Mutabakat KontÃ¶r", sablon: "E-Mutabakat", grup: "VEGA", temelFiyat: 0, aciklama: "E-Mutabakat kontÃ¶r satÄ±ÅŸÄ±" },
    { ad: "E-Fatura Portal", sablon: "E-Fatura", grup: "GIB", temelFiyat: 0, aciklama: "GIB E-Fatura web portal hizmeti" },
    { ad: "E-ArÅŸiv Fatura", sablon: "E-ArÅŸiv", grup: "GIB", temelFiyat: 0, aciklama: "E-ArÅŸiv fatura hizmeti" },
    { ad: "E-Ä°rsaliye", sablon: "E-Ä°rsaliye", grup: "GIB", temelFiyat: 0, aciklama: "E-Ä°rsaliye hizmeti" },
    { ad: "PAVO SmartPos", sablon: "PAVO-OKC", grup: "PAVO", temelFiyat: 8500, aciklama: "PAVO yeni nesil akÄ±llÄ± Ã–KC cihazÄ±" },
    { ad: "Domain Tescil", sablon: "Domain", grup: "METUNIC", temelFiyat: 0, aciklama: "Domain tescil ve yenileme hizmeti" },
    { ad: "Web Hosting", sablon: "Hosting", grup: "GUZELNET", temelFiyat: 0, aciklama: "SSD tabanlÄ± web hosting hizmeti" },
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
  console.log(`   âœ“ ${urunVerileri.length} Ã¼rÃ¼n oluÅŸturuldu`);

  // =============================================
  // 10. PAKETLER
  // =============================================
  console.log("\nğŸ“‹ Paketler oluÅŸturuluyor...");

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
      urun_id: urunMap["E-Mutabakat KontÃ¶r"],
      ad: "100 KontÃ¶r",
      tipi: "STARTER",
      kullanim_gunu: 365,
      fiyat: 500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 500 },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 100, birim: "KontÃ¶r" } },
      ]
    }
  });

  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Mutabakat KontÃ¶r"],
      ad: "500 KontÃ¶r",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 1750,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "temel_fiyat", deger: 1750 },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 500, birim: "KontÃ¶r" } },
      ]
    }
  });

  // E-Fatura Paketleri
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Fatura Portal"],
      ad: "E-Fatura BaÅŸlangÄ±Ã§",
      tipi: "STARTER",
      kullanim_gunu: 365,
      fiyat: 1500,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1500, yenileme_fiyat: 1200 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 500, birim: "KontÃ¶r" } },
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
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 2500, birim: "KontÃ¶r" } },
      ]
    }
  });

  // E-ArÅŸiv Paketi
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-ArÅŸiv Fatura"],
      ad: "E-ArÅŸiv Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 1000,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 1000, yenileme_fiyat: 800 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 1000, birim: "KontÃ¶r" } },
      ]
    }
  });

  // E-Ä°rsaliye Paketi
  await prisma.paket.create({
    data: {
      urun_id: urunMap["E-Ä°rsaliye"],
      ad: "E-Ä°rsaliye Standart",
      tipi: "STANDART",
      kullanim_gunu: 365,
      fiyat: 800,
      aktif: 1,
      ozellikler: [
        { id: 1, tip: "aktivasyon_yenileme", deger: { aktivasyon_fiyat: 800, yenileme_fiyat: 600 } },
        { id: 2, tip: "kademeli_fiyat", deger: { adet: 500, birim: "KontÃ¶r" } },
      ]
    }
  });

  // PAVO Ã–KC Paketi
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
      ad: "Hosting BaÅŸlangÄ±Ã§",
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
  console.log(`   âœ“ ${paketSayisi} paket oluÅŸturuldu`);

  // =============================================
  // 11. BAYÄ°LER (5 ADET)
  // =============================================
  console.log("\nğŸ¢ Bayiler oluÅŸturuluyor...");

  const bayi1 = await prisma.bayi.create({
    data: {
      ad: "GÃ¼zel Teknoloji",
      tur: "tuzel",
      sirket_adi: "GÃ¼zel Teknoloji YazÄ±lÄ±m A.Å.",
      yetkili: "Baran ÃœrÃ¼ncan",
      telefon: "05321002030",
      eposta: "info@guzelteknoloji.com",
      vergi_no: "1234567890",
      vergi_dairesi: "ÅiÅŸli",
      sehir: "Ä°stanbul",
      sektor_id: sektorMap["Teknoloji"],
      durum: "aktif",
      etiketler: JSON.stringify(["Ana Bayi", "Premium", "Ä°stanbul"]),
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi1.id,
      ad_soyad: "Baran ÃœrÃ¼ncan",
      unvan: "Genel MÃ¼dÃ¼r",
      departman: "YÃ¶netim",
      telefon: "02125551010",
      cep_telefon: "05321002030",
      eposta: "baran@guzelteknoloji.com",
      birincil: 1,
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi1.id,
      ad_soyad: "Selin AydÄ±n",
      unvan: "Teknik Destek UzmanÄ±",
      departman: "Teknik",
      telefon: "02125551011",
      cep_telefon: "05361112233",
      eposta: "selin@guzelteknoloji.com",
      birincil: 0,
    }
  });
  console.log(`   âœ“ Bayi 1: GÃ¼zel Teknoloji (Ä°stanbul)`);

  const bayi2 = await prisma.bayi.create({
    data: {
      ad: "Panu Teknoloji",
      tur: "tuzel",
      sirket_adi: "Panu Teknoloji Ã‡Ã¶zÃ¼mleri Ltd. Åti.",
      yetkili: "Ali KÃ¶se",
      telefon: "05332003040",
      eposta: "info@panuteknoloji.com",
      vergi_no: "9876543210",
      vergi_dairesi: "Konak",
      sehir: "Ä°zmir",
      sektor_id: sektorMap["Teknoloji"],
      durum: "aktif",
      etiketler: JSON.stringify(["Yetkili Bayi", "Ä°zmir"]),
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi2.id,
      ad_soyad: "Ali KÃ¶se",
      unvan: "SatÄ±ÅŸ MÃ¼dÃ¼rÃ¼",
      departman: "SatÄ±ÅŸ",
      telefon: "02324442020",
      cep_telefon: "05332003040",
      eposta: "ali@panuteknoloji.com",
      birincil: 1,
    }
  });
  console.log(`   âœ“ Bayi 2: Panu Teknoloji (Ä°zmir)`);

  const bayi3 = await prisma.bayi.create({
    data: {
      ad: "Kodgem BiliÅŸim",
      tur: "tuzel",
      sirket_adi: "Kodgem BiliÅŸim ve DanÄ±ÅŸmanlÄ±k Ltd. Åti.",
      yetkili: "Nimet Demir",
      telefon: "05343004050",
      eposta: "iletisim@kodgem.com",
      vergi_no: "5555555555",
      vergi_dairesi: "Ã‡ankaya",
      sehir: "Ankara",
      sektor_id: sektorMap["Hizmet"],
      durum: "aktif",
      etiketler: JSON.stringify(["Yetkili Bayi", "Ankara"]),
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi3.id,
      ad_soyad: "Nimet Demir",
      unvan: "Kurucu Ortak",
      departman: "YÃ¶netim",
      telefon: "03123333030",
      cep_telefon: "05343004050",
      eposta: "nimet@kodgem.com",
      birincil: 1,
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi3.id,
      ad_soyad: "Emre YÄ±lmaz",
      unvan: "SatÄ±ÅŸ DanÄ±ÅŸmanÄ±",
      departman: "SatÄ±ÅŸ",
      cep_telefon: "05423334455",
      eposta: "emre@kodgem.com",
      birincil: 0,
    }
  });
  console.log(`   âœ“ Bayi 3: Kodgem BiliÅŸim (Ankara)`);

  const bayi4 = await prisma.bayi.create({
    data: {
      ad: "Mega YazÄ±lÄ±m",
      tur: "tuzel",
      sirket_adi: "Mega YazÄ±lÄ±m Teknoloji A.Å.",
      yetkili: "Hakan Ã‡elik",
      telefon: "05354005060",
      eposta: "info@megayazilim.com.tr",
      vergi_no: "7771234567",
      vergi_dairesi: "NilÃ¼fer",
      sehir: "Bursa",
      sektor_id: sektorMap["Teknoloji"],
      durum: "aktif",
      etiketler: JSON.stringify(["Yetkili Bayi", "Bursa", "Yeni"]),
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi4.id,
      ad_soyad: "Hakan Ã‡elik",
      unvan: "Genel MÃ¼dÃ¼r",
      departman: "YÃ¶netim",
      telefon: "02242501010",
      cep_telefon: "05354005060",
      eposta: "hakan@megayazilim.com.tr",
      birincil: 1,
    }
  });
  console.log(`   âœ“ Bayi 4: Mega YazÄ±lÄ±m (Bursa)`);

  const bayi5 = await prisma.bayi.create({
    data: {
      ad: "Doruk BiliÅŸim",
      tur: "gercek",
      ad_soyad: "Zeynep Kara",
      tc_kimlik_no: "44455566677",
      yetkili: "Zeynep Kara",
      telefon: "05065006070",
      eposta: "zeynep@dorukbilisim.com",
      sehir: "Antalya",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
      etiketler: JSON.stringify(["Bireysel Bayi", "Antalya"]),
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      bayi_id: bayi5.id,
      ad_soyad: "Zeynep Kara",
      unvan: "Ä°ÅŸletme Sahibi",
      departman: "YÃ¶netim",
      cep_telefon: "05065006070",
      eposta: "zeynep@dorukbilisim.com",
      birincil: 1,
    }
  });
  console.log(`   âœ“ Bayi 5: Doruk BiliÅŸim (Antalya)`);

  // =============================================
  // 12. MÃœÅTERÄ°LER (10 ADET)
  // =============================================
  console.log("\nğŸ‘¤ MÃ¼ÅŸteriler oluÅŸturuluyor...");

  // ---- MÃ¼ÅŸteri 1: GerÃ§ek kiÅŸi, baÄŸÄ±msÄ±z ----
  const musteri1 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Mehmet YÄ±ldÄ±z",
      tc_kimlik_no: "10120130140",
      eposta: "mehmet.yildiz@gmail.com",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
      etiketler: ["VIP", "Perakende"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri1.id, telefon: "05301234567" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri1.id, telefon: "02161234567" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri1.id, adres: "KadÄ±kÃ¶y Mah. BaÄŸdat Cad. No:42/A, KadÄ±kÃ¶y/Ä°stanbul" } });
  console.log(`   âœ“ MÃ¼ÅŸteri 1: Mehmet YÄ±ldÄ±z (BaÄŸÄ±msÄ±z)`);

  // ---- MÃ¼ÅŸteri 2: TÃ¼zel, GÃ¼zel Teknoloji bayisi altÄ±nda ----
  const musteri2 = await prisma.musteri.create({
    data: {
      tur: "tuzel",
      sirket_adi: "Anadolu Market Zinciri A.Å.",
      yetkili_kisi: "Fatma Ã–zkan",
      eposta: "fatma@anadolumarket.com.tr",
      vergi_no: "1112223334",
      vergi_dairesi: "BeyoÄŸlu",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
      etiketler: ["Kurumsal", "Zincir MaÄŸaza"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri2.id, telefon: "05412345678" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri2.id, telefon: "02122345678" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri2.id, adres: "Ä°stiklal Cad. No:128, BeyoÄŸlu/Ä°stanbul" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri2.id, adres: "Merkez Depo: Esenyurt OSB, 3. Cd. No:7, Esenyurt/Ä°stanbul" } });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri2.id,
      ad_soyad: "Fatma Ã–zkan",
      unvan: "IT MÃ¼dÃ¼rÃ¼",
      departman: "Bilgi Ä°ÅŸlem",
      telefon: "02122345678",
      cep_telefon: "05412345678",
      eposta: "fatma@anadolumarket.com.tr",
      birincil: 1,
    }
  });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri2.id,
      ad_soyad: "Kemal DoÄŸan",
      unvan: "Muhasebe MÃ¼dÃ¼rÃ¼",
      departman: "Finans",
      cep_telefon: "05423456789",
      eposta: "kemal@anadolumarket.com.tr",
      birincil: 0,
    }
  });
  console.log(`   âœ“ MÃ¼ÅŸteri 2: Anadolu Market Zinciri (Bayi: GÃ¼zel Teknoloji)`);

  // ---- MÃ¼ÅŸteri 3: GerÃ§ek kiÅŸi, GÃ¼zel Teknoloji bayisi altÄ±nda ----
  const musteri3 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Ahmet Kaya",
      tc_kimlik_no: "20230240250",
      eposta: "ahmet.kaya@hotmail.com",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
      etiketler: ["Esnaf"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri3.id, telefon: "05559876543" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri3.id, adres: "AtatÃ¼rk Mah. Cumhuriyet Cad. No:15, BakÄ±rkÃ¶y/Ä°stanbul" } });
  console.log(`   âœ“ MÃ¼ÅŸteri 3: Ahmet Kaya (Bayi: GÃ¼zel Teknoloji)`);

  // ---- MÃ¼ÅŸteri 4: TÃ¼zel, Panu Teknoloji bayisi altÄ±nda ----
  const musteri4 = await prisma.musteri.create({
    data: {
      tur: "tuzel",
      sirket_adi: "Ege Lojistik Ltd. Åti.",
      yetkili_kisi: "Derya Aksoy",
      eposta: "derya@egelojistik.com",
      vergi_no: "4445556667",
      vergi_dairesi: "Alsancak",
      sektor_id: sektorMap["Hizmet"],
      durum: "aktif",
      etiketler: ["Lojistik", "KOBÄ°"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri4.id, telefon: "05327654321" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri4.id, telefon: "02324567890" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri4.id, adres: "Alsancak Mah. KÄ±brÄ±s Åehitleri Cad. No:88, Konak/Ä°zmir" } });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri4.id,
      ad_soyad: "Derya Aksoy",
      unvan: "Genel MÃ¼dÃ¼r",
      departman: "YÃ¶netim",
      telefon: "02324567890",
      cep_telefon: "05327654321",
      eposta: "derya@egelojistik.com",
      birincil: 1,
    }
  });
  console.log(`   âœ“ MÃ¼ÅŸteri 4: Ege Lojistik (Bayi: Panu Teknoloji)`);

  // ---- MÃ¼ÅŸteri 5: GerÃ§ek kiÅŸi, Panu Teknoloji bayisi altÄ±nda ----
  const musteri5 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Canan Demir",
      tc_kimlik_no: "30340350360",
      eposta: "canan.demir@gmail.com",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri5.id, telefon: "05448765432" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri5.id, adres: "Bornova Mah. 2. Sk. No:5, Bornova/Ä°zmir" } });
  console.log(`   âœ“ MÃ¼ÅŸteri 5: Canan Demir (Bayi: Panu Teknoloji)`);

  // ---- MÃ¼ÅŸteri 6: TÃ¼zel, Kodgem bayisi altÄ±nda ----
  const musteri6 = await prisma.musteri.create({
    data: {
      tur: "tuzel",
      sirket_adi: "BaÅŸkent Medikal San. Tic. Ltd. Åti.",
      yetkili_kisi: "OÄŸuz Åahin",
      eposta: "oguz@baskentmedikal.com",
      vergi_no: "6667778889",
      vergi_dairesi: "KÄ±zÄ±lay",
      sektor_id: sektorMap["SaÄŸlÄ±k"],
      durum: "aktif",
      etiketler: ["SaÄŸlÄ±k SektÃ¶rÃ¼", "Kurumsal"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri6.id, telefon: "05051234567" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri6.id, telefon: "03124561234" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri6.id, adres: "KÄ±zÄ±lay Mah. AtatÃ¼rk Blv. No:200/B, Ã‡ankaya/Ankara" } });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri6.id,
      ad_soyad: "OÄŸuz Åahin",
      unvan: "SatÄ±n Alma MÃ¼dÃ¼rÃ¼",
      departman: "SatÄ±n Alma",
      telefon: "03124561234",
      cep_telefon: "05051234567",
      eposta: "oguz@baskentmedikal.com",
      birincil: 1,
    }
  });
  console.log(`   âœ“ MÃ¼ÅŸteri 6: BaÅŸkent Medikal (Bayi: Kodgem)`);

  // ---- MÃ¼ÅŸteri 7: GerÃ§ek kiÅŸi, Kodgem bayisi altÄ±nda ----
  const musteri7 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Elif Arslan",
      tc_kimlik_no: "40450460470",
      eposta: "elif.arslan@outlook.com",
      sektor_id: sektorMap["Hizmet"],
      durum: "aktif",
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri7.id, telefon: "05369871234" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri7.id, adres: "BahÃ§elievler Mah. 7. Cad. No:12, Ã‡ankaya/Ankara" } });
  console.log(`   âœ“ MÃ¼ÅŸteri 7: Elif Arslan (Bayi: Kodgem)`);

  // ---- MÃ¼ÅŸteri 8: TÃ¼zel, Mega YazÄ±lÄ±m bayisi altÄ±nda ----
  const musteri8 = await prisma.musteri.create({
    data: {
      tur: "tuzel",
      sirket_adi: "NilÃ¼fer Otomotiv San. ve Tic. A.Å.",
      yetkili_kisi: "Burak YÄ±lmaz",
      eposta: "burak@niluferotomotiv.com",
      vergi_no: "8889990001",
      vergi_dairesi: "Osmangazi",
      sektor_id: sektorMap["Ãœretim"],
      durum: "aktif",
      etiketler: ["Ãœretim", "Otomotiv", "Kurumsal"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri8.id, telefon: "05381112233" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri8.id, telefon: "02248901234" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri8.id, adres: "Organize Sanayi BÃ¶lgesi 12. Cd. No:45, NilÃ¼fer/Bursa" } });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri8.id,
      ad_soyad: "Burak YÄ±lmaz",
      unvan: "Fabrika MÃ¼dÃ¼rÃ¼",
      departman: "Ãœretim",
      telefon: "02248901234",
      cep_telefon: "05381112233",
      eposta: "burak@niluferotomotiv.com",
      birincil: 1,
    }
  });
  console.log(`   âœ“ MÃ¼ÅŸteri 8: NilÃ¼fer Otomotiv (Bayi: Mega YazÄ±lÄ±m)`);

  // ---- MÃ¼ÅŸteri 9: GerÃ§ek kiÅŸi, Doruk BiliÅŸim bayisi altÄ±nda ----
  const musteri9 = await prisma.musteri.create({
    data: {
      tur: "gercek",
      ad_soyad: "Serkan Polat",
      tc_kimlik_no: "50560570580",
      eposta: "serkan.polat@gmail.com",
      sektor_id: sektorMap["Perakende"],
      durum: "aktif",
      etiketler: ["Esnaf", "Antalya"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri9.id, telefon: "05074567890" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri9.id, adres: "KonyaaltÄ± Mah. Liman Cad. No:33, KonyaaltÄ±/Antalya" } });
  console.log(`   âœ“ MÃ¼ÅŸteri 9: Serkan Polat (Bayi: Doruk BiliÅŸim)`);

  // ---- MÃ¼ÅŸteri 10: TÃ¼zel, baÄŸÄ±msÄ±z ----
  const musteri10 = await prisma.musteri.create({
    data: {
      tur: "tuzel",
      sirket_adi: "Akdeniz GÄ±da Toptan Tic. Ltd. Åti.",
      yetkili_kisi: "Murat KoÃ§",
      eposta: "murat@akdenizgida.com.tr",
      vergi_no: "3334445556",
      vergi_dairesi: "MuratpaÅŸa",
      sektor_id: sektorMap["Toptan Ticaret"],
      durum: "aktif",
      etiketler: ["Toptan", "GÄ±da"],
    }
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri10.id, telefon: "05427890123" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri10.id, telefon: "02423456789" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri10.id, adres: "ToptancÄ±lar Sitesi B Blok No:14, MuratpaÅŸa/Antalya" } });
  await prisma.iletisimKisi.create({
    data: {
      musteri_id: musteri10.id,
      ad_soyad: "Murat KoÃ§",
      unvan: "Genel MÃ¼dÃ¼r",
      departman: "YÃ¶netim",
      telefon: "02423456789",
      cep_telefon: "05427890123",
      eposta: "murat@akdenizgida.com.tr",
      birincil: 1,
    }
  });
  console.log(`   âœ“ MÃ¼ÅŸteri 10: Akdeniz GÄ±da (BaÄŸÄ±msÄ±z)`);

  // =============================================
  // 13. LÄ°SANSLAR
  // =============================================
  console.log("\nğŸ“‹ Lisanslar oluÅŸturuluyor...");

  let lisansSayisi = 0;

  // --- MÃ¼ÅŸteri 1: Mehmet YÄ±ldÄ±z (BaÄŸÄ±msÄ±z) ---
  const m1b1 = rastgeleTarih(180);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id, bayi_id: null,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1b1, bitis_tarihi: bitisTarihiHesapla(m1b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "10120130140",
      fiyat: 8000, net_tutar: 8000, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 8000,
    }
  });
  lisansSayisi++;

  const m1b2 = rastgeleTarih(120);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id, bayi_id: null,
      urun_id: urunMap["E-Fatura Portal"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1b2, bitis_tarihi: bitisTarihiHesapla(m1b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "10120130140",
      fiyat: 2000, net_tutar: 2000, odeme_durumu: "odendi", odenen_tutar: 2000,
    }
  });
  lisansSayisi++;

  const m1b3 = rastgeleTarih(300);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id, bayi_id: null,
      urun_id: urunMap["Domain Tescil"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1b3, bitis_tarihi: bitisTarihiHesapla(m1b3, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "mehmetyildiz.com",
      fiyat: 350, net_tutar: 350, odeme_durumu: "odendi", odenen_tutar: 350,
    }
  });
  lisansSayisi++;

  const m1b4 = rastgeleTarih(100);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri1.id, bayi_id: null,
      urun_id: urunMap["PAVO SmartPos"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1,
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1b4, bitis_tarihi: null,
      kullanim_gunu: 0, durum: "aktif", domain: "OKC-2024-001",
      fiyat: 8500, net_tutar: 8500, odeme_durumu: "odendi", odenen_tutar: 8500,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Mehmet YÄ±ldÄ±z: 4 lisans (BaÄŸÄ±msÄ±z)`);

  // --- MÃ¼ÅŸteri 2: Anadolu Market (Bayi: GÃ¼zel Teknoloji) ---
  const m2b1 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, bayi_id: bayi1.id,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2b1, bitis_tarihi: bitisTarihiHesapla(m2b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "1112223334",
      fiyat: 8000, net_tutar: 7200, kullanici_sayisi: 10, odeme_durumu: "odendi", odenen_tutar: 7200,
      notlar: "Bayi indirimi uygulandÄ± (%10)",
    }
  });
  lisansSayisi++;

  const m2b2 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, bayi_id: bayi1.id,
      urun_id: urunMap["VegaCari"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2b2, bitis_tarihi: bitisTarihiHesapla(m2b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "1112223334",
      fiyat: 3500, net_tutar: 3150, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 3150,
    }
  });
  lisansSayisi++;

  const m2b3 = rastgeleTarih(90);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, bayi_id: bayi1.id,
      urun_id: urunMap["E-Fatura Portal"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2b3, bitis_tarihi: bitisTarihiHesapla(m2b3, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "1112223334",
      fiyat: 2000, net_tutar: 2000, odeme_durumu: "odendi", odenen_tutar: 2000,
    }
  });
  lisansSayisi++;

  const m2b4 = rastgeleTarih(90);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, bayi_id: bayi1.id,
      urun_id: urunMap["E-ArÅŸiv Fatura"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2b4, bitis_tarihi: bitisTarihiHesapla(m2b4, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "1112223334",
      fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000,
    }
  });
  lisansSayisi++;

  const m2b5 = rastgeleTarih(200);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, bayi_id: bayi1.id,
      urun_id: urunMap["Web Hosting"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2b5, bitis_tarihi: bitisTarihiHesapla(m2b5, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "anadolumarket.com.tr",
      fiyat: 500, net_tutar: 500, odeme_durumu: "odendi", odenen_tutar: 500,
    }
  });
  lisansSayisi++;

  const m2b6 = rastgeleTarih(200);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, bayi_id: bayi1.id,
      urun_id: urunMap["Domain Tescil"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2b6, bitis_tarihi: bitisTarihiHesapla(m2b6, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "anadolumarket.com.tr",
      fiyat: 150, net_tutar: 150, odeme_durumu: "odendi", odenen_tutar: 150,
    }
  });
  lisansSayisi++;

  const m2b7 = rastgeleTarih(30);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri2.id, bayi_id: bayi1.id,
      urun_id: urunMap["Kurumsal E-Posta"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("MAIL"), baslangic_tarihi: m2b7, bitis_tarihi: bitisTarihiHesapla(m2b7, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "anadolumarket.com.tr",
      fiyat: 500, net_tutar: 500, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 500,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Anadolu Market: 7 lisans (Bayi: GÃ¼zel Teknoloji)`);

  // --- MÃ¼ÅŸteri 3: Ahmet Kaya (Bayi: GÃ¼zel Teknoloji) ---
  const m3b1 = rastgeleTarih(150);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id, bayi_id: bayi1.id,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m3b1, bitis_tarihi: bitisTarihiHesapla(m3b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "20230240250",
      fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 3500,
    }
  });
  lisansSayisi++;

  const m3b2 = rastgeleTarih(100);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri3.id, bayi_id: bayi1.id,
      urun_id: urunMap["PAVO SmartPos"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1,
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m3b2, bitis_tarihi: null,
      kullanim_gunu: 0, durum: "aktif", domain: "OKC-2024-002",
      fiyat: 8500, net_tutar: 8500, odeme_durumu: "odendi", odenen_tutar: 8500,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Ahmet Kaya: 2 lisans (Bayi: GÃ¼zel Teknoloji)`);

  // --- MÃ¼ÅŸteri 4: Ege Lojistik (Bayi: Panu Teknoloji) ---
  const m4b1 = rastgeleTarih(90);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri4.id, bayi_id: bayi2.id,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m4b1, bitis_tarihi: bitisTarihiHesapla(m4b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "4445556667",
      fiyat: 5000, net_tutar: 5000, kullanici_sayisi: 3, odeme_durumu: "odendi", odenen_tutar: 5000,
    }
  });
  lisansSayisi++;

  const m4b2 = rastgeleTarih(90);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri4.id, bayi_id: bayi2.id,
      urun_id: urunMap["E-Fatura Portal"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m4b2, bitis_tarihi: bitisTarihiHesapla(m4b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "4445556667",
      fiyat: 1500, net_tutar: 1500, odeme_durumu: "odendi", odenen_tutar: 1500,
    }
  });
  lisansSayisi++;

  const m4b3 = rastgeleTarih(90);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri4.id, bayi_id: bayi2.id,
      urun_id: urunMap["E-Ä°rsaliye"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EIR"), baslangic_tarihi: m4b3, bitis_tarihi: bitisTarihiHesapla(m4b3, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "4445556667",
      fiyat: 800, net_tutar: 800, odeme_durumu: "odendi", odenen_tutar: 800,
    }
  });
  lisansSayisi++;

  const m4b4 = rastgeleTarih(150);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri4.id, bayi_id: bayi2.id,
      urun_id: urunMap["Domain Tescil"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m4b4, bitis_tarihi: bitisTarihiHesapla(m4b4, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "egelojistik.com",
      fiyat: 350, net_tutar: 350, odeme_durumu: "odendi", odenen_tutar: 350,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Ege Lojistik: 4 lisans (Bayi: Panu Teknoloji)`);

  // --- MÃ¼ÅŸteri 5: Canan Demir (Bayi: Panu Teknoloji) ---
  const m5b1 = rastgeleTarih(45);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri5.id, bayi_id: bayi2.id,
      urun_id: urunMap["VegaCari"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m5b1, bitis_tarihi: bitisTarihiHesapla(m5b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "30340350360",
      fiyat: 2500, net_tutar: 2500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 2500,
    }
  });
  lisansSayisi++;

  const m5b2 = rastgeleTarih(45);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri5.id, bayi_id: bayi2.id,
      urun_id: urunMap["E-ArÅŸiv Fatura"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m5b2, bitis_tarihi: bitisTarihiHesapla(m5b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "30340350360",
      fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Canan Demir: 2 lisans (Bayi: Panu Teknoloji)`);

  // --- MÃ¼ÅŸteri 6: BaÅŸkent Medikal (Bayi: Kodgem) ---
  const m6b1 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri6.id, bayi_id: bayi3.id,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6b1, bitis_tarihi: bitisTarihiHesapla(m6b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "6667778889",
      fiyat: 5000, net_tutar: 5000, kullanici_sayisi: 3, odeme_durumu: "odendi", odenen_tutar: 5000,
    }
  });
  lisansSayisi++;

  const m6b2 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri6.id, bayi_id: bayi3.id,
      urun_id: urunMap["E-Fatura Portal"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6b2, bitis_tarihi: bitisTarihiHesapla(m6b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "6667778889",
      fiyat: 2000, net_tutar: 2000, odeme_durumu: "odendi", odenen_tutar: 2000,
    }
  });
  lisansSayisi++;

  const m6b3 = rastgeleTarih(60);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri6.id, bayi_id: bayi3.id,
      urun_id: urunMap["E-ArÅŸiv Fatura"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6b3, bitis_tarihi: bitisTarihiHesapla(m6b3, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "6667778889",
      fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000,
    }
  });
  lisansSayisi++;

  const m6b4 = rastgeleTarih(100);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri6.id, bayi_id: bayi3.id,
      urun_id: urunMap["E-Mutabakat KontÃ¶r"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6b4, bitis_tarihi: bitisTarihiHesapla(m6b4, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "6667778889",
      fiyat: 1750, net_tutar: 1750, odeme_durumu: "odendi", odenen_tutar: 1750, notlar: "500 KontÃ¶r paketi",
    }
  });
  lisansSayisi++;

  const m6b5 = rastgeleTarih(150);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri6.id, bayi_id: bayi3.id,
      urun_id: urunMap["Web Hosting"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6b5, bitis_tarihi: bitisTarihiHesapla(m6b5, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "baskentmedikal.com",
      fiyat: 500, net_tutar: 500, odeme_durumu: "odendi", odenen_tutar: 500,
    }
  });
  lisansSayisi++;

  const m6b6 = rastgeleTarih(150);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri6.id, bayi_id: bayi3.id,
      urun_id: urunMap["Kurumsal E-Posta"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1,
      lisans_anahtari: lisansAnahtari("MAIL"), baslangic_tarihi: m6b5, bitis_tarihi: null,
      kullanim_gunu: 0, durum: "aktif", domain: "baskentmedikal.com",
      fiyat: 500, net_tutar: 500, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 500,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ BaÅŸkent Medikal: 6 lisans (Bayi: Kodgem)`);

  // --- MÃ¼ÅŸteri 7: Elif Arslan (Bayi: Kodgem) ---
  const m7b1 = rastgeleTarih(200);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri7.id, bayi_id: bayi3.id,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m7b1, bitis_tarihi: bitisTarihiHesapla(m7b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "40450460470",
      fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 3500,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Elif Arslan: 1 lisans (Bayi: Kodgem)`);

  // --- MÃ¼ÅŸteri 8: NilÃ¼fer Otomotiv (Bayi: Mega YazÄ±lÄ±m) ---
  const m8b1 = rastgeleTarih(30);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri8.id, bayi_id: bayi4.id,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8b1, bitis_tarihi: bitisTarihiHesapla(m8b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "8889990001",
      fiyat: 8000, net_tutar: 8000, kullanici_sayisi: 10, odeme_durumu: "odendi", odenen_tutar: 8000,
    }
  });
  lisansSayisi++;

  const m8b2 = rastgeleTarih(30);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri8.id, bayi_id: bayi4.id,
      urun_id: urunMap["VegaCari"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8b2, bitis_tarihi: bitisTarihiHesapla(m8b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "8889990001",
      fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 3500,
    }
  });
  lisansSayisi++;

  const m8b3 = rastgeleTarih(30);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri8.id, bayi_id: bayi4.id,
      urun_id: urunMap["E-Fatura Portal"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8b3, bitis_tarihi: bitisTarihiHesapla(m8b3, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "8889990001",
      fiyat: 2000, net_tutar: 2000, odeme_durumu: "odendi", odenen_tutar: 2000,
    }
  });
  lisansSayisi++;

  const m8b4 = rastgeleTarih(30);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri8.id, bayi_id: bayi4.id,
      urun_id: urunMap["E-Ä°rsaliye"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari("EIR"), baslangic_tarihi: m8b4, bitis_tarihi: bitisTarihiHesapla(m8b4, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "8889990001",
      fiyat: 800, net_tutar: 800, odeme_durumu: "odendi", odenen_tutar: 800,
    }
  });
  lisansSayisi++;

  const m8b5 = rastgeleTarih(30);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri8.id, bayi_id: bayi4.id,
      urun_id: urunMap["PAVO SmartPos"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1,
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8b5, bitis_tarihi: null,
      kullanim_gunu: 0, durum: "aktif", domain: "OKC-2025-003",
      fiyat: 8500, net_tutar: 8500, odeme_durumu: "odendi", odenen_tutar: 8500,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ NilÃ¼fer Otomotiv: 5 lisans (Bayi: Mega YazÄ±lÄ±m)`);

  // --- MÃ¼ÅŸteri 9: Serkan Polat (Bayi: Doruk BiliÅŸim) ---
  const m9b1 = rastgeleTarih(120);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri9.id, bayi_id: bayi5.id,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m9b1, bitis_tarihi: bitisTarihiHesapla(m9b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "50560570580",
      fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 3500,
    }
  });
  lisansSayisi++;

  const m9b2 = rastgeleTarih(120);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri9.id, bayi_id: bayi5.id,
      urun_id: urunMap["E-ArÅŸiv Fatura"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m9b2, bitis_tarihi: bitisTarihiHesapla(m9b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "50560570580",
      fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Serkan Polat: 2 lisans (Bayi: Doruk BiliÅŸim)`);

  // --- MÃ¼ÅŸteri 10: Akdeniz GÄ±da (BaÄŸÄ±msÄ±z) ---
  const m10b1 = rastgeleTarih(50);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri10.id, bayi_id: null,
      urun_id: urunMap["VegaPos"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10b1, bitis_tarihi: bitisTarihiHesapla(m10b1, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "3334445556",
      fiyat: 5000, net_tutar: 5000, kullanici_sayisi: 3, odeme_durumu: "odendi", odenen_tutar: 5000,
    }
  });
  lisansSayisi++;

  const m10b2 = rastgeleTarih(50);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri10.id, bayi_id: null,
      urun_id: urunMap["VegaCari"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10b2, bitis_tarihi: bitisTarihiHesapla(m10b2, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "3334445556",
      fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 3500,
    }
  });
  lisansSayisi++;

  const m10b3 = rastgeleTarih(50);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri10.id, bayi_id: null,
      urun_id: urunMap["E-Fatura Portal"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10b3, bitis_tarihi: bitisTarihiHesapla(m10b3, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "3334445556",
      fiyat: 2000, net_tutar: 2000, odeme_durumu: "odendi", odenen_tutar: 2000,
    }
  });
  lisansSayisi++;

  const m10b4 = rastgeleTarih(50);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri10.id, bayi_id: null,
      urun_id: urunMap["Domain Tescil"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10b4, bitis_tarihi: bitisTarihiHesapla(m10b4, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "akdenizgida.com.tr",
      fiyat: 150, net_tutar: 150, odeme_durumu: "odendi", odenen_tutar: 150,
    }
  });
  lisansSayisi++;

  const m10b5 = rastgeleTarih(50);
  await prisma.lisans.create({
    data: {
      musteri_id: musteri10.id, bayi_id: null,
      urun_id: urunMap["Web Hosting"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik",
      lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10b5, bitis_tarihi: bitisTarihiHesapla(m10b5, 365),
      kullanim_gunu: 365, durum: "aktif", domain: "akdenizgida.com.tr",
      fiyat: 500, net_tutar: 500, odeme_durumu: "odendi", odenen_tutar: 500,
    }
  });
  lisansSayisi++;
  console.log(`   âœ“ Akdeniz GÄ±da: 5 lisans (BaÄŸÄ±msÄ±z)`);

  // =============================================
  // Ã–ZET
  // =============================================
  console.log("\n" + "=".repeat(60));
  console.log("âœ… SEED v3 TAMAMLANDI");
  console.log("=".repeat(60));
  console.log(`
ğŸ“Š Ã–ZET:
   â”œâ”€ SektÃ¶rler: ${sektorler.length}
   â”œâ”€ Lisans Tipleri: ${lisansTipleri.length}
   â”œâ”€ Paket Tipleri: ${paketTipleri.length}
   â”œâ”€ ÃœrÃ¼n GruplarÄ±: ${gruplar.length}
   â”œâ”€ ÃœrÃ¼n Tipleri: ${Object.keys(tipMap).length}
   â”œâ”€ Uygulama Tipleri: ${Object.keys(uygulamaMap).length}
   â”œâ”€ ÃœrÃ¼n ÅablonlarÄ±: ${sablonSayisi}
   â”œâ”€ ÃœrÃ¼nler: ${Object.keys(urunMap).length}
   â”œâ”€ Paketler: ${paketSayisi}
   â”œâ”€ Bayiler: 5
   â”‚   â”œâ”€ GÃ¼zel Teknoloji (Ä°stanbul) â€” Ana Bayi
   â”‚   â”œâ”€ Panu Teknoloji (Ä°zmir)
   â”‚   â”œâ”€ Kodgem BiliÅŸim (Ankara)
   â”‚   â”œâ”€ Mega YazÄ±lÄ±m (Bursa)
   â”‚   â””â”€ Doruk BiliÅŸim (Antalya) â€” Bireysel
   â”œâ”€ MÃ¼ÅŸteriler: 10
   â”‚   â”œâ”€ Mehmet YÄ±ldÄ±z â€” BaÄŸÄ±msÄ±z (4 lisans)
   â”‚   â”œâ”€ Anadolu Market Zinciri â€” GÃ¼zel Teknoloji (7 lisans)
   â”‚   â”œâ”€ Ahmet Kaya â€” GÃ¼zel Teknoloji (2 lisans)
   â”‚   â”œâ”€ Ege Lojistik â€” Panu Teknoloji (4 lisans)
   â”‚   â”œâ”€ Canan Demir â€” Panu Teknoloji (2 lisans)
   â”‚   â”œâ”€ BaÅŸkent Medikal â€” Kodgem (6 lisans)
   â”‚   â”œâ”€ Elif Arslan â€” Kodgem (1 lisans)
   â”‚   â”œâ”€ NilÃ¼fer Otomotiv â€” Mega YazÄ±lÄ±m (5 lisans)
   â”‚   â”œâ”€ Serkan Polat â€” Doruk BiliÅŸim (2 lisans)
   â”‚   â””â”€ Akdeniz GÄ±da â€” BaÄŸÄ±msÄ±z (5 lisans)
   â””â”€ Lisanslar: ${lisansSayisi}
`);
}

main()
  .catch((e) => {
    console.error("\nâŒ HATA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
