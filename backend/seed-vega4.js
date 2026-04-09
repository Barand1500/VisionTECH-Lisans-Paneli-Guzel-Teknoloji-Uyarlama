// =============================================
// 🌱 SEED VEGA v4 — KAPSAMLI TEST VERİSİ
// =============================================
// Tüm özellik tiplerini, paketleri, sürümleri,
// iletişim kayıtlarını, bayiUrun ilişkilerini,
// farklı lisans durumlarını kapsar.
// =============================================

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// ── Yardımcı fonksiyonlar ──
function rastgeleTarih(gunOnce) {
  const simdi = new Date();
  const gecmis = new Date(simdi.getTime() - gunOnce * 24 * 60 * 60 * 1000);
  return new Date(gecmis.getTime() + Math.random() * (simdi.getTime() - gecmis.getTime()));
}

function bitisTarihiHesapla(baslangic, gun) {
  const d = new Date(baslangic);
  d.setDate(d.getDate() + gun);
  return d;
}

function lisansAnahtari() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

async function main() {
  console.log("=".repeat(60));
  console.log("🌱 SEED VEGA v4 — KAPSAMLI TEST VERİSİ");
  console.log("=".repeat(60));

  // =============================================
  // 0. TEMİZLİK
  // =============================================
  console.log("\n🧹 Mevcut veriler temizleniyor...");
  await prisma.aktiviteLog.deleteMany();
  await prisma.yedeklemeLog.deleteMany();
  await prisma.iletisimKaydi.deleteMany();
  await prisma.noti.deleteMany();
  await prisma.lisans.deleteMany();
  await prisma.surum.deleteMany();
  await prisma.paket.deleteMany();
  await prisma.bayiUrun.deleteMany();
  await prisma.musteriDosya.deleteMany();
  await prisma.bayiDosya.deleteMany();
  await prisma.iletisimKisi.deleteMany();
  await prisma.musteriTelefon.deleteMany();
  await prisma.musteriAdres.deleteMany();
  await prisma.urun.deleteMany();
  await prisma.sablonOzellik.deleteMany();
  await prisma.urunSablon.deleteMany();
  await prisma.musteri.deleteMany();
  await prisma.bayi.deleteMany();
  await prisma.urunTipi.deleteMany();
  await prisma.uygulamaTipi.deleteMany();
  await prisma.urunGrubu.deleteMany();
  await prisma.lisansTipi.deleteMany();
  await prisma.paketTipi.deleteMany();
  await prisma.sektor.deleteMany();
  await prisma.kullanici.deleteMany();
  await prisma.rol.deleteMany();
  console.log("   ✓ Temizlik tamamlandı");

  // =============================================
  // 1. ROLLER ve KULLANICI
  // =============================================
  console.log("\n👤 Roller ve kullanıcı oluşturuluyor...");
  const adminRol = await prisma.rol.create({ data: { ad: "Yönetici", izinler: ["*"] } });
  const bayiRol = await prisma.rol.create({ data: { ad: "Bayi", izinler: ["musteri:oku", "lisans:oku", "lisans:ekle"] } });
  const destekRol = await prisma.rol.create({ data: { ad: "Destek", izinler: ["musteri:oku", "lisans:oku", "not:ekle"] } });

  const sifreHash = await bcrypt.hash("123456", 10);
  const admin = await prisma.kullanici.create({
    data: {
      kullanici_adi: "ercan",
      ad_soyad: "Ercan Güzel",
      eposta: "ercan@guzelteknoloji.com",
      sifre_hash: sifreHash,
      rol: adminRol.ad,
      aktif: 1,
    },
  });
  console.log("   ✓ 3 rol + 1 admin kullanıcı");

  // =============================================
  // 2. SEKTÖRLER
  // =============================================
  console.log("\n🏭 Sektörler oluşturuluyor...");
  const sektorAdlari = ["Perakende", "Toptan Ticaret", "Hizmet", "Üretim", "Sağlık", "Gıda", "Lojistik", "Eğitim"];
  const sektorler = [];
  for (const ad of sektorAdlari) {
    sektorler.push(await prisma.sektor.create({ data: { ad } }));
  }
  const sektorMap = {};
  sektorler.forEach((s) => (sektorMap[s.ad] = s.id));
  console.log(`   ✓ ${sektorler.length} sektör`);

  // =============================================
  // 3. LİSANS TİPLERİ
  // =============================================
  console.log("\n📋 Lisans tipleri oluşturuluyor...");
  const lisansTipleri = [
    { ad: "Demo", kod: "demo", renk: "purple", gun: 30, suresiz: 0, sira: 0 },
    { ad: "Aylık", kod: "aylik", renk: "blue", gun: 30, suresiz: 0, sira: 1 },
    { ad: "3 Aylık", kod: "3aylik", renk: "cyan", gun: 90, suresiz: 0, sira: 2 },
    { ad: "6 Aylık", kod: "6aylik", renk: "teal", gun: 180, suresiz: 0, sira: 3 },
    { ad: "Yıllık", kod: "yillik", renk: "green", gun: 365, suresiz: 0, sira: 4 },
    { ad: "Süresiz", kod: "suresiz", renk: "amber", gun: 0, suresiz: 1, sira: 5 },
  ];
  const lisansTipiMap = {};
  for (const lt of lisansTipleri) {
    const rec = await prisma.lisansTipi.create({ data: lt });
    lisansTipiMap[lt.kod] = rec.id;
  }
  console.log(`   ✓ ${lisansTipleri.length} lisans tipi`);

  // =============================================
  // 4. PAKET TİPLERİ
  // =============================================
  console.log("\n📦 Paket tipleri oluşturuluyor...");
  const paketTipleri = ["STARTER", "BASIC", "PROFESSIONAL", "PREMIUM", "ENTERPRISE"];
  for (let i = 0; i < paketTipleri.length; i++) {
    await prisma.paketTipi.create({ data: { ad: paketTipleri[i], sira: i } });
  }
  console.log(`   ✓ ${paketTipleri.length} paket tipi`);

  // =============================================
  // 5. ÜRÜN GRUPLARI
  // =============================================
  console.log("\n📂 Ürün grupları oluşturuluyor...");
  const grupVerileri = [
    { ad: "VEGA Yazılım", aciklama: "VegaPos, VegaCari, VegaHR yazılım ailesi" },
    { ad: "GİB Entegrasyon", aciklama: "E-Fatura, E-Arşiv, E-İrsaliye, E-Mutabakat" },
    { ad: "PAVO Donanım", aciklama: "Yazar kasa, SmartPos cihazları" },
    { ad: "METUNIC Altyapı", aciklama: "Domain, Hosting, E-Posta altyapı hizmetleri" },
    { ad: "GÜZELNET İnternet", aciklama: "Fiber internet, kurumsal bağlantı" },
  ];
  const gruplar = [];
  const grupMap = {};
  for (const g of grupVerileri) {
    const rec = await prisma.urunGrubu.create({ data: g });
    gruplar.push(rec);
    grupMap[g.ad] = rec.id;
  }
  console.log(`   ✓ ${gruplar.length} ürün grubu`);

  // =============================================
  // 6. ÜRÜN TİPLERİ + UYGULAMA TİPLERİ
  // =============================================
  console.log("\n🏷️ Ürün ve uygulama tipleri oluşturuluyor...");
  const urunTipleriData = [
    { ad: "Yazılım", grup: "VEGA Yazılım" },
    { ad: "Donanım", grup: "PAVO Donanım" },
    { ad: "Hizmet", grup: "METUNIC Altyapı" },
    { ad: "Entegrasyon", grup: "GİB Entegrasyon" },
    { ad: "Lisans", grup: "VEGA Yazılım" },
    { ad: "Bulut", grup: "METUNIC Altyapı" },
    { ad: "Abonelik", grup: "GÜZELNET İnternet" },
    { ad: "Destek", grup: "VEGA Yazılım" },
    { ad: "Eğitim", grup: "VEGA Yazılım" },
  ];
  const tipMap = {};
  for (const t of urunTipleriData) {
    const rec = await prisma.urunTipi.create({ data: { ad: t.ad, grup_id: grupMap[t.grup] } });
    tipMap[t.ad] = rec.id;
  }

  const uygulamaTipleriData = [
    { ad: "Masaüstü", urunTipi: "Yazılım" },
    { ad: "Web", urunTipi: "Yazılım" },
    { ad: "Mobil", urunTipi: "Yazılım" },
    { ad: "API", urunTipi: "Entegrasyon" },
    { ad: "Donanım", urunTipi: "Donanım" },
    { ad: "Cloud", urunTipi: "Bulut" },
    { ad: "SaaS", urunTipi: "Hizmet" },
    { ad: "Eklenti", urunTipi: "Yazılım" },
    { ad: "Modül", urunTipi: "Yazılım" },
    { ad: "Hizmet", urunTipi: "Hizmet" },
    { ad: "IoT", urunTipi: "Donanım" },
    { ad: "Karma", urunTipi: "Lisans" },
  ];
  const uygulamaMap = {};
  for (const u of uygulamaTipleriData) {
    const rec = await prisma.uygulamaTipi.create({ data: { ad: u.ad, urun_tipi_id: tipMap[u.urunTipi] } });
    uygulamaMap[u.ad] = rec.id;
  }
  console.log(`   ✓ ${urunTipleriData.length} ürün tipi, ${uygulamaTipleriData.length} uygulama tipi`);

  // =============================================
  // 7. ÜRÜN ŞABLONLARI + ÖZELLİKLER
  // =============================================
  console.log("\n📐 Ürün şablonları ve özellikleri oluşturuluyor...");
  let sablonSayisi = 0;

  // ----- Yardımcı: Şablon + özellik oluştur -----
  async function sablonOlustur(data, ozellikler) {
    const sablon = await prisma.urunSablon.create({ data });
    sablonSayisi++;
    for (let i = 0; i < ozellikler.length; i++) {
      await prisma.sablonOzellik.create({
        data: {
          sablon_id: sablon.id,
          ozellik_tipi: ozellikler[i].ozellik_tipi,
          baslik: ozellikler[i].baslik,
          deger: ozellikler[i].deger,
          sira: i,
          aktif: 1,
        },
      });
    }
    return sablon;
  }

  // ─── 1) VegaPos ───
  const sablonVegaPos = await sablonOlustur(
    { ad: "VegaPos Satış Noktası", aciklama: "POS ve satış yönetimi yazılımı", grup_id: grupMap["VEGA Yazılım"], urun_tipi_id: tipMap["Yazılım"], uygulama_tipi_id: uygulamaMap["Masaüstü"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 3500, para_birimi: "TL" } },
      { ozellik_tipi: "kullanici_sayisi", baslik: "Kullanıcı Sayısı", deger: { min: 1, max: 50, ek_kullanici_fiyat: 500 } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Aktivasyon / Yenileme", deger: { aktivasyon_fiyat: 3500, yenileme_fiyat: 2800, para_birimi: "TL" } },
      { ozellik_tipi: "kademeli_fiyat", baslik: "Kullanıcı Kademesi", deger: { tip: "adet", birim: "Kullanıcı", kademeler: [{ deger: "1-3", fiyat: 3500 }, { deger: "4-10", fiyat: 3000 }, { deger: "11-50", fiyat: 2500 }] } },
      { ozellik_tipi: "sicil_domain", baslik: "Sicil No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      { ozellik_tipi: "demo_suresi", baslik: "Demo Süresi", deger: { gun: 15 } },
      { ozellik_tipi: "otomatik_yenileme", baslik: "Otomatik Yenileme", deger: { aktif: true, bildirim_gun: 30, aciklama: "Yıllık lisans otomatik yenilenir" } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Ürün Yönetimi", deger: { transfer_edilebilir: true, transfer_ucreti: 500, transfer_ucreti_birimi: "TL", durdurulabilir: true, durdurma_suresi_gun: 90, askiya_alinabilir: true, askiya_alma_suresi_gun: 30, iptal_edilebilir: true, iptal_iade_orani: 50, devir_edilebilir: true, not: "Devir işlemi sadece aynı bayi müşterileri arasında yapılabilir" } },
      { ozellik_tipi: "garanti_suresi", baslik: "Garanti Süresi", deger: { sure_ay: 12, kapsam: "standart", uzatilabilir: true, uzatma_ucreti: 500, uzatma_ucreti_birimi: "TL", uzatma_suresi_ay: 12, garanti_notu: "Yazılım güncellemelerini kapsar" } },
      { ozellik_tipi: "guvenlik", baslik: "Güvenlik Ayarları", deger: { mac_kontrolu: true, ip_kisitlama: false, max_cihaz: 3, cihaz_degisim_hakki: 2, cihaz_degisim_periyot: "yillik", online_dogrulama: true, dogrulama_periyot_gun: 7 } },
    ]
  );
  console.log("   ✓ VegaPos Satış Noktası (10 özellik)");

  // ─── 2) VegaCari ───
  const sablonVegaCari = await sablonOlustur(
    { ad: "VegaCari Muhasebe", aciklama: "Cari hesap ve muhasebe yönetimi", grup_id: grupMap["VEGA Yazılım"], urun_tipi_id: tipMap["Yazılım"], uygulama_tipi_id: uygulamaMap["Masaüstü"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 2500, para_birimi: "TL" } },
      { ozellik_tipi: "kullanici_sayisi", baslik: "Kullanıcı Sayısı", deger: { min: 1, max: 20, ek_kullanici_fiyat: 350 } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Aktivasyon / Yenileme", deger: { aktivasyon_fiyat: 2500, yenileme_fiyat: 2000, para_birimi: "TL" } },
      { ozellik_tipi: "sicil_domain", baslik: "Sicil No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      { ozellik_tipi: "bagimli_urun", baslik: "Bağımlı Ürün", deger: { urunler: [], zorunlu: false } },
      { ozellik_tipi: "demo_suresi", baslik: "Demo Süresi", deger: { gun: 15 } },
      { ozellik_tipi: "periyot_indirim", baslik: "Periyot İndirimi", deger: { aylik_oran: 0, yillik_oran: 10 } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Ürün Yönetimi", deger: { transfer_edilebilir: true, transfer_ucreti: 300, transfer_ucreti_birimi: "TL", durdurulabilir: true, durdurma_suresi_gun: 60, askiya_alinabilir: true, askiya_alma_suresi_gun: 30, iptal_edilebilir: true, iptal_iade_orani: 30, devir_edilebilir: false, not: "" } },
    ]
  );
  console.log("   ✓ VegaCari Muhasebe (8 özellik)");

  // ─── 3) VegaHR ───
  const sablonVegaHR = await sablonOlustur(
    { ad: "VegaHR İnsan Kaynakları", aciklama: "Personel ve bordro yönetimi", grup_id: grupMap["VEGA Yazılım"], urun_tipi_id: tipMap["Yazılım"], uygulama_tipi_id: uygulamaMap["Web"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 4000, para_birimi: "TL" } },
      { ozellik_tipi: "kullanici_sayisi", baslik: "Kullanıcı Sayısı", deger: { min: 1, max: 100, ek_kullanici_fiyat: 200 } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Aktivasyon / Yenileme", deger: { aktivasyon_fiyat: 4000, yenileme_fiyat: 3200, para_birimi: "TL" } },
      { ozellik_tipi: "kampanya", baslik: "Lansman Kampanyası", deger: { ad: "VegaHR Lansman", kosullar: ["Yeni müşteri", "Yıllık alım"], indirim_orani: 20, bitis_tarihi: "2026-12-31" } },
      { ozellik_tipi: "hediye_urun", baslik: "Hediye Ürün", deger: { urunler: [], miktar: 1 } },
      { ozellik_tipi: "siparis_miktari", baslik: "Sipariş Miktarı", deger: { min_adet: 1, max_adet: 5 } },
      { ozellik_tipi: "otomatik_yenileme", baslik: "Otomatik Yenileme", deger: { aktif: true, bildirim_gun: 45, aciklama: "Sözleşme yenilemede hatırlatma" } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Ürün Yönetimi", deger: { transfer_edilebilir: false, transfer_ucreti: 0, transfer_ucreti_birimi: "TL", durdurulabilir: true, durdurma_suresi_gun: 30, askiya_alinabilir: false, askiya_alma_suresi_gun: 0, iptal_edilebilir: true, iptal_iade_orani: 0, devir_edilebilir: false, not: "Transfer ve devir yapılamaz" } },
    ]
  );
  console.log("   ✓ VegaHR İnsan Kaynakları (8 özellik)");

  // ─── 4) E-Fatura Portal ───
  const sablonEFatura = await sablonOlustur(
    { ad: "E-Fatura Portal", aciklama: "GİB entegrasyonlu e-fatura sistemi", grup_id: grupMap["GİB Entegrasyon"], urun_tipi_id: tipMap["Entegrasyon"], uygulama_tipi_id: uygulamaMap["Web"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 2000, para_birimi: "TL" } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Aktivasyon / Yenileme", deger: { aktivasyon_fiyat: 2000, yenileme_fiyat: 1500, para_birimi: "TL" } },
      { ozellik_tipi: "sicil_domain", baslik: "Vergi No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      { ozellik_tipi: "kademeli_fiyat", baslik: "Fatura Kotası", deger: { tip: "adet", birim: "Fatura/Ay", kademeler: [{ deger: "1-100", fiyat: 2000 }, { deger: "101-500", fiyat: 3500 }, { deger: "501-2000", fiyat: 6000 }, { deger: "2001+", fiyat: 10000 }] } },
      { ozellik_tipi: "paket_indirimi", baslik: "GİB Paket İndirimi", deger: { urunler: [], indirim_orani: 15 } },
      { ozellik_tipi: "otomatik_yenileme", baslik: "Otomatik Yenileme", deger: { aktif: true, bildirim_gun: 60, aciklama: "GİB entegrasyonu kesintisiz devam etmeli" } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Ürün Yönetimi", deger: { transfer_edilebilir: false, transfer_ucreti: 0, transfer_ucreti_birimi: "TL", durdurulabilir: false, durdurma_suresi_gun: 0, askiya_alinabilir: true, askiya_alma_suresi_gun: 15, iptal_edilebilir: true, iptal_iade_orani: 0, devir_edilebilir: false, not: "GİB entegrasyonu transfer edilemez" } },
    ]
  );
  console.log("   ✓ E-Fatura Portal (7 özellik)");

  // ─── 5) E-Arşiv Fatura ───
  const sablonEArsiv = await sablonOlustur(
    { ad: "E-Arşiv Fatura", aciklama: "E-Arşiv fatura entegrasyonu", grup_id: grupMap["GİB Entegrasyon"], urun_tipi_id: tipMap["Entegrasyon"], uygulama_tipi_id: uygulamaMap["API"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 1000, para_birimi: "TL" } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Aktivasyon / Yenileme", deger: { aktivasyon_fiyat: 1000, yenileme_fiyat: 800, para_birimi: "TL" } },
      { ozellik_tipi: "sicil_domain", baslik: "Vergi No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      { ozellik_tipi: "bagimli_urun", baslik: "Gerekli Ürün", deger: { urunler: [], zorunlu: true } },
    ]
  );
  console.log("   ✓ E-Arşiv Fatura (4 özellik)");

  // ─── 6) E-İrsaliye ───
  const sablonEIrsaliye = await sablonOlustur(
    { ad: "E-İrsaliye", aciklama: "Elektronik irsaliye entegrasyonu", grup_id: grupMap["GİB Entegrasyon"], urun_tipi_id: tipMap["Entegrasyon"], uygulama_tipi_id: uygulamaMap["API"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 800, para_birimi: "TL" } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Aktivasyon / Yenileme", deger: { aktivasyon_fiyat: 800, yenileme_fiyat: 600, para_birimi: "TL" } },
      { ozellik_tipi: "sicil_domain", baslik: "Vergi No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
    ]
  );
  console.log("   ✓ E-İrsaliye (3 özellik)");

  // ─── 7) E-Mutabakat Kontör ───
  const sablonEMutabakat = await sablonOlustur(
    { ad: "E-Mutabakat Kontör", aciklama: "Kontör bazlı e-mutabakat sistemi", grup_id: grupMap["GİB Entegrasyon"], urun_tipi_id: tipMap["Hizmet"], uygulama_tipi_id: uygulamaMap["SaaS"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 1750, para_birimi: "TL" } },
      { ozellik_tipi: "kademeli_fiyat", baslik: "Kontör Kademesi", deger: { tip: "adet", birim: "Kontör", kademeler: [{ deger: "100", fiyat: 750 }, { deger: "250", fiyat: 1250 }, { deger: "500", fiyat: 1750 }, { deger: "1000", fiyat: 2500 }] } },
      { ozellik_tipi: "sicil_domain", baslik: "Vergi No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      { ozellik_tipi: "gecis_fiyati", baslik: "Geçiş Fiyatı", deger: { hedef_urunler: [], fiyat: 500 } },
    ]
  );
  console.log("   ✓ E-Mutabakat Kontör (4 özellik)");

  // ─── 8) PAVO SmartPos ───
  const sablonPAVO = await sablonOlustur(
    { ad: "PAVO SmartPos", aciklama: "Akıllı yazar kasa cihazı", grup_id: grupMap["PAVO Donanım"], urun_tipi_id: tipMap["Donanım"], uygulama_tipi_id: uygulamaMap["Donanım"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Cihaz Fiyatı", deger: { fiyat: 8500, para_birimi: "TL" } },
      { ozellik_tipi: "sicil_domain", baslik: "OKC Sicil No", deger: { alan_tipi: "sicil_no", zorunlu: true } },
      { ozellik_tipi: "garanti_suresi", baslik: "Garanti", deger: { sure_ay: 24, kapsam: "genis", uzatilabilir: true, uzatma_ucreti: 1500, uzatma_ucreti_birimi: "TL", uzatma_suresi_ay: 12, garanti_notu: "Donanım arıza ve yazılım güncellemelerini kapsar" } },
      { ozellik_tipi: "guvenlik", baslik: "Cihaz Güvenliği", deger: { mac_kontrolu: true, ip_kisitlama: false, max_cihaz: 1, cihaz_degisim_hakki: 1, cihaz_degisim_periyot: "yillik", online_dogrulama: true, dogrulama_periyot_gun: 1 } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Cihaz Yönetimi", deger: { transfer_edilebilir: true, transfer_ucreti: 1000, transfer_ucreti_birimi: "TL", durdurulabilir: false, durdurma_suresi_gun: 0, askiya_alinabilir: false, askiya_alma_suresi_gun: 0, iptal_edilebilir: true, iptal_iade_orani: 0, devir_edilebilir: true, not: "Cihaz devri fiziksel teslim gerektirir" } },
      { ozellik_tipi: "siparis_miktari", baslik: "Sipariş Limiti", deger: { min_adet: 1, max_adet: 20 } },
    ]
  );
  console.log("   ✓ PAVO SmartPos (6 özellik)");

  // ─── 9) Domain Tescil ───
  const sablonDomain = await sablonOlustur(
    { ad: "Domain Tescil", aciklama: "Alan adı tescil ve yenileme", grup_id: grupMap["METUNIC Altyapı"], urun_tipi_id: tipMap["Hizmet"], uygulama_tipi_id: uygulamaMap["Hizmet"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 150, para_birimi: "TL" } },
      { ozellik_tipi: "sicil_domain", baslik: "Domain", deger: { alan_tipi: "domain", zorunlu: true } },
      { ozellik_tipi: "domain_fiyat", baslik: "Uzantı Fiyatları", deger: { para_birimi: "TL", uzantilar: [{ uzanti: ".com", aktivasyon: 150, yenileme: 150 }, { uzanti: ".com.tr", aktivasyon: 80, yenileme: 80 }, { uzanti: ".net", aktivasyon: 180, yenileme: 180 }, { uzanti: ".org", aktivasyon: 200, yenileme: 200 }, { uzanti: ".io", aktivasyon: 450, yenileme: 450 }] } },
      { ozellik_tipi: "otomatik_yenileme", baslik: "Otomatik Yenileme", deger: { aktif: true, bildirim_gun: 30, aciklama: "Domain süresi dolmadan yenilenir" } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Domain Yönetimi", deger: { transfer_edilebilir: true, transfer_ucreti: 0, transfer_ucreti_birimi: "TL", durdurulabilir: false, durdurma_suresi_gun: 0, askiya_alinabilir: false, askiya_alma_suresi_gun: 0, iptal_edilebilir: true, iptal_iade_orani: 0, devir_edilebilir: true, not: "Domain transferi auth code ile yapılır" } },
    ]
  );
  console.log("   ✓ Domain Tescil (5 özellik)");

  // ─── 10) Web Hosting ───
  const sablonHosting = await sablonOlustur(
    { ad: "Web Hosting", aciklama: "Web barındırma hizmeti", grup_id: grupMap["METUNIC Altyapı"], urun_tipi_id: tipMap["Bulut"], uygulama_tipi_id: uygulamaMap["Cloud"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 500, para_birimi: "TL" } },
      { ozellik_tipi: "kademeli_fiyat", baslik: "Disk Kapasitesi", deger: { tip: "kapasite", birim: "GB", kademeler: [{ deger: "5", fiyat: 500 }, { deger: "10", fiyat: 800 }, { deger: "25", fiyat: 1500 }, { deger: "50", fiyat: 2500 }] } },
      { ozellik_tipi: "sicil_domain", baslik: "Domain", deger: { alan_tipi: "domain", zorunlu: true } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Aktivasyon / Yenileme", deger: { aktivasyon_fiyat: 500, yenileme_fiyat: 500, para_birimi: "TL" } },
      { ozellik_tipi: "periyot_indirim", baslik: "Periyot İndirimi", deger: { aylik_oran: 0, yillik_oran: 15 } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Hosting Yönetimi", deger: { transfer_edilebilir: true, transfer_ucreti: 0, transfer_ucreti_birimi: "TL", durdurulabilir: true, durdurma_suresi_gun: 30, askiya_alinabilir: true, askiya_alma_suresi_gun: 15, iptal_edilebilir: true, iptal_iade_orani: 0, devir_edilebilir: false, not: "" } },
    ]
  );
  console.log("   ✓ Web Hosting (6 özellik)");

  // ─── 11) Kurumsal E-Posta ───
  const sablonEPosta = await sablonOlustur(
    { ad: "Kurumsal E-Posta", aciklama: "Kurumsal e-posta çözümü", grup_id: grupMap["METUNIC Altyapı"], urun_tipi_id: tipMap["Abonelik"], uygulama_tipi_id: uygulamaMap["SaaS"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Temel Fiyat", deger: { fiyat: 100, para_birimi: "TL" } },
      { ozellik_tipi: "kullanici_sayisi", baslik: "Hesap Sayısı", deger: { min: 1, max: 500, ek_kullanici_fiyat: 100 } },
      { ozellik_tipi: "kademeli_fiyat", baslik: "Hesap Kademesi", deger: { tip: "adet", birim: "Hesap", kademeler: [{ deger: "1-5", fiyat: 100 }, { deger: "6-20", fiyat: 80 }, { deger: "21-100", fiyat: 60 }, { deger: "101-500", fiyat: 45 }] } },
      { ozellik_tipi: "sicil_domain", baslik: "Domain", deger: { alan_tipi: "domain", zorunlu: true } },
      { ozellik_tipi: "periyot_indirim", baslik: "Periyot İndirimi", deger: { aylik_oran: 0, yillik_oran: 20 } },
    ]
  );
  console.log("   ✓ Kurumsal E-Posta (5 özellik)");

  // ─── 12) Fiber İnternet ───
  const sablonFiber = await sablonOlustur(
    { ad: "Fiber İnternet", aciklama: "Kurumsal fiber internet bağlantısı", grup_id: grupMap["GÜZELNET İnternet"], urun_tipi_id: tipMap["Abonelik"], uygulama_tipi_id: uygulamaMap["Hizmet"] },
    [
      { ozellik_tipi: "temel_fiyat", baslik: "Aylık Ücret", deger: { fiyat: 750, para_birimi: "TL" } },
      { ozellik_tipi: "kademeli_fiyat", baslik: "Hız Kademesi", deger: { tip: "kapasite", birim: "Mbps", kademeler: [{ deger: "50", fiyat: 500 }, { deger: "100", fiyat: 750 }, { deger: "200", fiyat: 1200 }, { deger: "500", fiyat: 2000 }, { deger: "1000", fiyat: 3500 }] } },
      { ozellik_tipi: "aktivasyon_yenileme", baslik: "Kurulum / Yenileme", deger: { aktivasyon_fiyat: 500, yenileme_fiyat: 0, para_birimi: "TL" } },
      { ozellik_tipi: "kampanya", baslik: "Taahhüt Kampanyası", deger: { ad: "24 Ay Taahhüt", kosullar: ["24 ay taahhüt", "Kurumsal müşteri"], indirim_orani: 25, bitis_tarihi: "" } },
      { ozellik_tipi: "urun_yonetimi", baslik: "Abonelik Yönetimi", deger: { transfer_edilebilir: false, transfer_ucreti: 0, transfer_ucreti_birimi: "TL", durdurulabilir: true, durdurma_suresi_gun: 180, askiya_alinabilir: true, askiya_alma_suresi_gun: 90, iptal_edilebilir: true, iptal_iade_orani: 0, devir_edilebilir: false, not: "Taahhütlü abonelikte erken iptal cezası uygulanır" } },
      { ozellik_tipi: "garanti_suresi", baslik: "Hizmet Garantisi", deger: { sure_ay: 12, kapsam: "standart", uzatilabilir: false, uzatma_ucreti: 0, uzatma_ucreti_birimi: "TL", uzatma_suresi_ay: 0, garanti_notu: "%99.5 uptime garantisi" } },
    ]
  );
  console.log("   ✓ Fiber İnternet (6 özellik)");

  console.log(`   ─ Toplam ${sablonSayisi} şablon oluşturuldu`);

  // =============================================
  // 8. ÜRÜNLER
  // =============================================
  console.log("\n📦 Ürünler oluşturuluyor...");
  const urunVerileri = [
    { ad: "VegaPos", sablon: sablonVegaPos, grup: "VEGA Yazılım", urunTipi: "Yazılım", uygulamaTipi: "Masaüstü", fiyat: 3500, aciklama: "VegaPos satış noktası yazılımı", versiyon: "4.2.1" },
    { ad: "VegaCari", sablon: sablonVegaCari, grup: "VEGA Yazılım", urunTipi: "Yazılım", uygulamaTipi: "Masaüstü", fiyat: 2500, aciklama: "VegaCari muhasebe yazılımı", versiyon: "3.8.0" },
    { ad: "VegaHR", sablon: sablonVegaHR, grup: "VEGA Yazılım", urunTipi: "Yazılım", uygulamaTipi: "Web", fiyat: 4000, aciklama: "VegaHR insan kaynakları yönetimi", versiyon: "1.0.0" },
    { ad: "E-Fatura Portal", sablon: sablonEFatura, grup: "GİB Entegrasyon", urunTipi: "Entegrasyon", uygulamaTipi: "Web", fiyat: 2000, aciklama: "E-Fatura portal entegrasyonu", versiyon: "2.5.0" },
    { ad: "E-Arşiv Fatura", sablon: sablonEArsiv, grup: "GİB Entegrasyon", urunTipi: "Entegrasyon", uygulamaTipi: "API", fiyat: 1000, aciklama: "E-Arşiv fatura sistemi", versiyon: "2.5.0" },
    { ad: "E-İrsaliye", sablon: sablonEIrsaliye, grup: "GİB Entegrasyon", urunTipi: "Entegrasyon", uygulamaTipi: "API", fiyat: 800, aciklama: "Elektronik irsaliye sistemi", versiyon: "1.3.0" },
    { ad: "E-Mutabakat Kontör", sablon: sablonEMutabakat, grup: "GİB Entegrasyon", urunTipi: "Hizmet", uygulamaTipi: "SaaS", fiyat: 1750, aciklama: "Kontör bazlı e-mutabakat", versiyon: "1.1.0" },
    { ad: "PAVO SmartPos", sablon: sablonPAVO, grup: "PAVO Donanım", urunTipi: "Donanım", uygulamaTipi: "Donanım", fiyat: 8500, aciklama: "PAVO akıllı yazar kasa", versiyon: "2.0.0" },
    { ad: "Domain Tescil", sablon: sablonDomain, grup: "METUNIC Altyapı", urunTipi: "Hizmet", uygulamaTipi: "Hizmet", fiyat: 150, aciklama: "Alan adı tescil hizmeti", versiyon: null },
    { ad: "Web Hosting", sablon: sablonHosting, grup: "METUNIC Altyapı", urunTipi: "Bulut", uygulamaTipi: "Cloud", fiyat: 500, aciklama: "Web barındırma hizmeti", versiyon: null },
    { ad: "Kurumsal E-Posta", sablon: sablonEPosta, grup: "METUNIC Altyapı", urunTipi: "Abonelik", uygulamaTipi: "SaaS", fiyat: 100, aciklama: "Kurumsal e-posta hesabı", versiyon: null },
    { ad: "Fiber İnternet", sablon: sablonFiber, grup: "GÜZELNET İnternet", urunTipi: "Abonelik", uygulamaTipi: "Hizmet", fiyat: 750, aciklama: "Fiber internet bağlantısı", versiyon: null },
  ];

  const urunMap = {};
  for (const u of urunVerileri) {
    const rec = await prisma.urun.create({
      data: {
        ad: u.ad,
        aciklama: u.aciklama,
        sablon_id: u.sablon.id,
        grup_id: grupMap[u.grup],
        urun_tipi: u.urunTipi,
        urun_tipi_id: tipMap[u.urunTipi],
        uygulama_tipi: u.uygulamaTipi,
        uygulama_tipi_id: uygulamaMap[u.uygulamaTipi],
        temel_fiyat: u.fiyat,
        versiyon: u.versiyon,
        aktif: 1,
      },
    });
    urunMap[u.ad] = rec.id;
  }
  console.log(`   ✓ ${urunVerileri.length} ürün`);

  // =============================================
  // 9. PAKETLER
  // =============================================
  console.log("\n📦 Paketler oluşturuluyor...");
  const paketVerileri = [
    // VegaPos paketleri
    { urun: "VegaPos", ad: "VegaPos Starter", tipi: "STARTER", gun: 365, fiyat: 3500, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 1 },
    ] },
    { urun: "VegaPos", ad: "VegaPos Professional", tipi: "PROFESSIONAL", gun: 365, fiyat: 5000, kullanici: 5, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 5 },
    ] },
    { urun: "VegaPos", ad: "VegaPos Enterprise", tipi: "ENTERPRISE", gun: 365, fiyat: 8000, kullanici: 20, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 20 },
    ] },
    // VegaCari paketleri
    { urun: "VegaCari", ad: "VegaCari Basic", tipi: "BASIC", gun: 365, fiyat: 2500, kullanici: 1, ozellikler: [] },
    { urun: "VegaCari", ad: "VegaCari Professional", tipi: "PROFESSIONAL", gun: 365, fiyat: 3500, kullanici: 5, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 5 },
    ] },
    // VegaHR paketleri
    { urun: "VegaHR", ad: "VegaHR Starter", tipi: "STARTER", gun: 365, fiyat: 4000, kullanici: 3, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 3 },
    ] },
    { urun: "VegaHR", ad: "VegaHR Premium", tipi: "PREMIUM", gun: 365, fiyat: 7000, kullanici: 20, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 20 },
    ] },
    // E-Fatura paketleri
    { urun: "E-Fatura Portal", ad: "E-Fatura 100", tipi: "STARTER", gun: 365, fiyat: 2000, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "adet", birim: "Fatura/Ay", kademeler: [{ deger: "1-100", fiyat: 2000 }] } },
    ] },
    { urun: "E-Fatura Portal", ad: "E-Fatura 500", tipi: "PROFESSIONAL", gun: 365, fiyat: 3500, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "adet", birim: "Fatura/Ay", kademeler: [{ deger: "1-500", fiyat: 3500 }] } },
    ] },
    { urun: "E-Fatura Portal", ad: "E-Fatura Sınırsız", tipi: "ENTERPRISE", gun: 365, fiyat: 10000, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "adet", birim: "Fatura/Ay", kademeler: [{ deger: "Sınırsız", fiyat: 10000 }] } },
    ] },
    // E-Arşiv
    { urun: "E-Arşiv Fatura", ad: "E-Arşiv Yıllık", tipi: "BASIC", gun: 365, fiyat: 1000, kullanici: 1, ozellikler: [] },
    // E-İrsaliye
    { urun: "E-İrsaliye", ad: "E-İrsaliye Yıllık", tipi: "BASIC", gun: 365, fiyat: 800, kullanici: 1, ozellikler: [] },
    // E-Mutabakat
    { urun: "E-Mutabakat Kontör", ad: "E-Mutabakat 250", tipi: "BASIC", gun: 365, fiyat: 1250, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "adet", birim: "Kontör", kademeler: [{ deger: "250", fiyat: 1250 }] } },
    ] },
    { urun: "E-Mutabakat Kontör", ad: "E-Mutabakat 500", tipi: "PROFESSIONAL", gun: 365, fiyat: 1750, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "adet", birim: "Kontör", kademeler: [{ deger: "500", fiyat: 1750 }] } },
    ] },
    // PAVO SmartPos
    { urun: "PAVO SmartPos", ad: "PAVO Standart", tipi: "BASIC", gun: 0, fiyat: 8500, kullanici: 1, ozellikler: [] },
    // Domain
    { urun: "Domain Tescil", ad: "Domain .com", tipi: "BASIC", gun: 365, fiyat: 150, kullanici: 1, ozellikler: [] },
    { urun: "Domain Tescil", ad: "Domain .com.tr", tipi: "STARTER", gun: 365, fiyat: 80, kullanici: 1, ozellikler: [] },
    // Hosting
    { urun: "Web Hosting", ad: "Hosting 5GB", tipi: "STARTER", gun: 365, fiyat: 500, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "kapasite", birim: "GB", kademeler: [{ deger: "5", fiyat: 500 }] } },
    ] },
    { urun: "Web Hosting", ad: "Hosting 25GB", tipi: "PROFESSIONAL", gun: 365, fiyat: 1500, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "kapasite", birim: "GB", kademeler: [{ deger: "25", fiyat: 1500 }] } },
    ] },
    // E-Posta
    { urun: "Kurumsal E-Posta", ad: "E-Posta 5 Hesap", tipi: "STARTER", gun: 365, fiyat: 500, kullanici: 5, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 5 },
    ] },
    { urun: "Kurumsal E-Posta", ad: "E-Posta 20 Hesap", tipi: "PROFESSIONAL", gun: 365, fiyat: 1600, kullanici: 20, ozellikler: [
      { ozellik_tipi: "kullanici_sayisi", tip: "kullanici_sayisi", deger: 20 },
    ] },
    // Fiber İnternet
    { urun: "Fiber İnternet", ad: "Fiber 100 Mbps", tipi: "BASIC", gun: 30, fiyat: 750, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "kapasite", birim: "Mbps", kademeler: [{ deger: "100", fiyat: 750 }] } },
    ] },
    { urun: "Fiber İnternet", ad: "Fiber 500 Mbps", tipi: "PREMIUM", gun: 30, fiyat: 2000, kullanici: 1, ozellikler: [
      { ozellik_tipi: "kademeli_fiyat", tip: "kademeli_fiyat", deger: { tip: "kapasite", birim: "Mbps", kademeler: [{ deger: "500", fiyat: 2000 }] } },
    ] },
  ];

  const paketMap = {};
  for (const p of paketVerileri) {
    const rec = await prisma.paket.create({
      data: {
        urun_id: urunMap[p.urun],
        ad: p.ad,
        tipi: p.tipi,
        kullanim_gunu: p.gun,
        fiyat: p.fiyat,
        kullanici_sayisi: p.kullanici,
        ozellikler: p.ozellikler.length > 0 ? p.ozellikler : undefined,
        aktif: 1,
      },
    });
    paketMap[p.ad] = rec.id;
  }
  console.log(`   ✓ ${paketVerileri.length} paket`);

  // =============================================
  // 10. BAYİLER
  // =============================================
  console.log("\n🏢 Bayiler oluşturuluyor...");

  const bayi1 = await prisma.bayi.create({
    data: {
      ad: "Güzel Teknoloji A.Ş.", tur: "tuzel", sirket_adi: "Güzel Teknoloji A.Ş.", yetkili: "Baran Güzel",
      eposta: "info@guzelteknoloji.com", telefon: "02163251000",
      vergi_no: "1234567890", vergi_dairesi: "Ataşehir", sehir: "İstanbul",
      durum: "aktif", etiketler: "Ana Bayi,Premium",
    },
  });
  await prisma.iletisimKisi.create({
    data: { bayi_id: bayi1.id, ad_soyad: "Baran Güzel", unvan: "Genel Müdür", departman: "Yönetim", telefon: "02163251000", cep_telefon: "05321234567", eposta: "baran@guzelteknoloji.com", birincil: 1 },
  });
  await prisma.iletisimKisi.create({
    data: { bayi_id: bayi1.id, ad_soyad: "Zeynep Aktaş", unvan: "Satış Müdürü", departman: "Satış", cep_telefon: "05339876543", eposta: "zeynep@guzelteknoloji.com", birincil: 0 },
  });

  const bayi2 = await prisma.bayi.create({
    data: {
      ad: "Panu Teknoloji Ltd. Şti.", tur: "tuzel", sirket_adi: "Panu Teknoloji Ltd. Şti.", yetkili: "Ali Panu",
      eposta: "ali@panutek.com", telefon: "02324561234",
      vergi_no: "9876543210", vergi_dairesi: "Konak", sehir: "İzmir",
      durum: "aktif", etiketler: "İzmir Bölge",
    },
  });
  await prisma.iletisimKisi.create({
    data: { bayi_id: bayi2.id, ad_soyad: "Ali Panu", unvan: "Kurucu", departman: "Yönetim", cep_telefon: "05421234567", eposta: "ali@panutek.com", birincil: 1 },
  });

  const bayi3 = await prisma.bayi.create({
    data: {
      ad: "Kodgem Bilişim", tur: "tuzel", sirket_adi: "Kodgem Bilişim San. Tic. Ltd. Şti.", yetkili: "Emre Demir",
      eposta: "emre@kodgem.com", telefon: "03124567890",
      vergi_no: "5556667778", vergi_dairesi: "Çankaya", sehir: "Ankara",
      durum: "aktif", etiketler: "Ankara Bölge",
    },
  });
  await prisma.iletisimKisi.create({
    data: { bayi_id: bayi3.id, ad_soyad: "Emre Demir", unvan: "Genel Müdür", departman: "Yönetim", cep_telefon: "05051112233", eposta: "emre@kodgem.com", birincil: 1 },
  });

  const bayi4 = await prisma.bayi.create({
    data: {
      ad: "Mega Yazılım", tur: "tuzel", sirket_adi: "Mega Yazılım Ltd. Şti.", yetkili: "Hakan Yıldız",
      eposta: "hakan@megayazilim.com", telefon: "02247891234",
      vergi_no: "3332221110", vergi_dairesi: "Osmangazi", sehir: "Bursa",
      durum: "aktif", etiketler: "Bursa Bölge",
    },
  });
  await prisma.iletisimKisi.create({
    data: { bayi_id: bayi4.id, ad_soyad: "Hakan Yıldız", unvan: "Müdür", departman: "Satış", cep_telefon: "05381231234", eposta: "hakan@megayazilim.com", birincil: 1 },
  });

  const bayi5 = await prisma.bayi.create({
    data: {
      ad: "Doruk Bilişim", tur: "gercek", ad_soyad: "Mert Aydın", yetkili: "Mert Aydın",
      eposta: "mert@dorukbilisim.com", telefon: "02424561234",
      tc_kimlik_no: "12345678901", sehir: "Antalya",
      durum: "aktif", etiketler: "Bireysel Bayi,Antalya",
    },
  });
  await prisma.iletisimKisi.create({
    data: { bayi_id: bayi5.id, ad_soyad: "Mert Aydın", unvan: "Bayi Sahibi", cep_telefon: "05071234567", eposta: "mert@dorukbilisim.com", birincil: 1 },
  });
  console.log("   ✓ 5 bayi + iletişim kişileri");

  // =============================================
  // 11. BAYİ-ÜRÜN İLİŞKİLERİ
  // =============================================
  console.log("\n🔗 Bayi-ürün ilişkileri oluşturuluyor...");
  const bayiUrunVerileri = [
    // Güzel Teknoloji — tüm ürünler
    ...Object.values(urunMap).map((uid) => ({ bayi_id: bayi1.id, urun_id: uid })),
    // Panu — Yazılım + GİB
    { bayi_id: bayi2.id, urun_id: urunMap["VegaPos"] },
    { bayi_id: bayi2.id, urun_id: urunMap["VegaCari"] },
    { bayi_id: bayi2.id, urun_id: urunMap["E-Fatura Portal"] },
    { bayi_id: bayi2.id, urun_id: urunMap["E-Arşiv Fatura"] },
    { bayi_id: bayi2.id, urun_id: urunMap["E-İrsaliye"] },
    { bayi_id: bayi2.id, urun_id: urunMap["Domain Tescil"] },
    // Kodgem — Yazılım + GİB + Altyapı
    { bayi_id: bayi3.id, urun_id: urunMap["VegaPos"] },
    { bayi_id: bayi3.id, urun_id: urunMap["VegaCari"] },
    { bayi_id: bayi3.id, urun_id: urunMap["E-Fatura Portal"] },
    { bayi_id: bayi3.id, urun_id: urunMap["E-Arşiv Fatura"] },
    { bayi_id: bayi3.id, urun_id: urunMap["E-Mutabakat Kontör"] },
    { bayi_id: bayi3.id, urun_id: urunMap["Web Hosting"] },
    { bayi_id: bayi3.id, urun_id: urunMap["Kurumsal E-Posta"] },
    // Mega — Yazılım + Donanım
    { bayi_id: bayi4.id, urun_id: urunMap["VegaPos"] },
    { bayi_id: bayi4.id, urun_id: urunMap["VegaCari"] },
    { bayi_id: bayi4.id, urun_id: urunMap["E-Fatura Portal"] },
    { bayi_id: bayi4.id, urun_id: urunMap["E-İrsaliye"] },
    { bayi_id: bayi4.id, urun_id: urunMap["PAVO SmartPos"] },
    // Doruk — Sadece Yazılım + E-Arşiv
    { bayi_id: bayi5.id, urun_id: urunMap["VegaPos"] },
    { bayi_id: bayi5.id, urun_id: urunMap["E-Arşiv Fatura"] },
  ];
  for (const bu of bayiUrunVerileri) {
    await prisma.bayiUrun.create({ data: bu });
  }
  console.log(`   ✓ ${bayiUrunVerileri.length} bayi-ürün ilişkisi`);

  // =============================================
  // 12. MÜŞTERİLER
  // =============================================
  console.log("\n👥 Müşteriler oluşturuluyor...");

  // --- Müşteri 1: Gerçek kişi, Bağımsız ---
  const musteri1 = await prisma.musteri.create({
    data: {
      tur: "gercek", ad_soyad: "Mehmet Yıldız", tc_kimlik_no: "10120130140",
      eposta: "mehmet@yildizmarket.com", sektor_id: sektorMap["Perakende"],
      durum: "aktif", etiketler: ["VIP", "Perakende"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri1.id, telefon: "05301234567" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri1.id, telefon: "02161234567" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri1.id, adres: "Kadıköy Mah. Bağdat Cad. No:42/A, Kadıköy/İstanbul" } });
  console.log("   ✓ 1: Mehmet Yıldız (Bağımsız)");

  // --- Müşteri 2: Tüzel — Anadolu Market, Güzel Teknoloji bayisi ---
  const musteri2 = await prisma.musteri.create({
    data: {
      tur: "tuzel", sirket_adi: "Anadolu Market Zinciri A.Ş.", yetkili_kisi: "Fatma Özkan",
      eposta: "fatma@anadolumarket.com.tr", vergi_no: "1112223334", vergi_dairesi: "Beyoğlu",
      sektor_id: sektorMap["Perakende"], durum: "aktif", etiketler: ["Kurumsal", "Zincir Mağaza"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri2.id, telefon: "05412345678" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri2.id, telefon: "02122345678" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri2.id, adres: "İstiklal Cad. No:128, Beyoğlu/İstanbul" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri2.id, adres: "Merkez Depo: Esenyurt OSB, 3. Cd. No:7, Esenyurt/İstanbul" } });
  await prisma.iletisimKisi.create({
    data: { musteri_id: musteri2.id, ad_soyad: "Fatma Özkan", unvan: "IT Müdürü", departman: "Bilgi İşlem", telefon: "02122345678", cep_telefon: "05412345678", eposta: "fatma@anadolumarket.com.tr", birincil: 1 },
  });
  await prisma.iletisimKisi.create({
    data: { musteri_id: musteri2.id, ad_soyad: "Kemal Doğan", unvan: "Muhasebe Müdürü", departman: "Finans", cep_telefon: "05423456789", eposta: "kemal@anadolumarket.com.tr", birincil: 0 },
  });
  console.log("   ✓ 2: Anadolu Market Zinciri (Bayi: Güzel Teknoloji)");

  // --- Müşteri 3: Gerçek kişi, Güzel Teknoloji bayisi ---
  const musteri3 = await prisma.musteri.create({
    data: {
      tur: "gercek", ad_soyad: "Ahmet Kaya", tc_kimlik_no: "20230240250",
      eposta: "ahmet.kaya@hotmail.com", sektor_id: sektorMap["Perakende"], durum: "aktif", etiketler: ["Esnaf"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri3.id, telefon: "05559876543" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri3.id, adres: "Atatürk Mah. Cumhuriyet Cad. No:15, Bakırköy/İstanbul" } });
  console.log("   ✓ 3: Ahmet Kaya (Bayi: Güzel Teknoloji)");

  // --- Müşteri 4: Tüzel — Ege Lojistik, Panu Teknoloji bayisi ---
  const musteri4 = await prisma.musteri.create({
    data: {
      tur: "tuzel", sirket_adi: "Ege Lojistik Ltd. Şti.", yetkili_kisi: "Derya Aksoy",
      eposta: "derya@egelojistik.com", vergi_no: "4445556667", vergi_dairesi: "Alsancak",
      sektor_id: sektorMap["Lojistik"], durum: "aktif", etiketler: ["Lojistik", "KOBİ"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri4.id, telefon: "05327654321" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri4.id, adres: "Alsancak Mah. Kıbrıs Şehitleri Cad. No:88, Konak/İzmir" } });
  await prisma.iletisimKisi.create({
    data: { musteri_id: musteri4.id, ad_soyad: "Derya Aksoy", unvan: "Genel Müdür", departman: "Yönetim", telefon: "02324567890", cep_telefon: "05327654321", eposta: "derya@egelojistik.com", birincil: 1 },
  });
  console.log("   ✓ 4: Ege Lojistik (Bayi: Panu Teknoloji)");

  // --- Müşteri 5: Gerçek kişi, Panu bayisi ---
  const musteri5 = await prisma.musteri.create({
    data: {
      tur: "gercek", ad_soyad: "Canan Demir", tc_kimlik_no: "30340350360",
      eposta: "canan.demir@gmail.com", sektor_id: sektorMap["Perakende"], durum: "aktif",
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri5.id, telefon: "05448765432" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri5.id, adres: "Bornova Mah. 2. Sk. No:5, Bornova/İzmir" } });
  console.log("   ✓ 5: Canan Demir (Bayi: Panu Teknoloji)");

  // --- Müşteri 6: Tüzel — Başkent Medikal, Kodgem bayisi ---
  const musteri6 = await prisma.musteri.create({
    data: {
      tur: "tuzel", sirket_adi: "Başkent Medikal San. Tic. Ltd. Şti.", yetkili_kisi: "Oğuz Şahin",
      eposta: "oguz@baskentmedikal.com", vergi_no: "6667778889", vergi_dairesi: "Kızılay",
      sektor_id: sektorMap["Sağlık"], durum: "aktif", etiketler: ["Sağlık Sektörü", "Kurumsal"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri6.id, telefon: "05051234567" } });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri6.id, telefon: "03124561234" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri6.id, adres: "Kızılay Mah. Atatürk Blv. No:200/B, Çankaya/Ankara" } });
  await prisma.iletisimKisi.create({
    data: { musteri_id: musteri6.id, ad_soyad: "Oğuz Şahin", unvan: "Satın Alma Müdürü", departman: "Satın Alma", telefon: "03124561234", cep_telefon: "05051234567", eposta: "oguz@baskentmedikal.com", birincil: 1 },
  });
  console.log("   ✓ 6: Başkent Medikal (Bayi: Kodgem)");

  // --- Müşteri 7: Gerçek kişi, Kodgem bayisi ---
  const musteri7 = await prisma.musteri.create({
    data: {
      tur: "gercek", ad_soyad: "Elif Arslan", tc_kimlik_no: "40450460470",
      eposta: "elif.arslan@outlook.com", sektor_id: sektorMap["Hizmet"], durum: "aktif",
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri7.id, telefon: "05369871234" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri7.id, adres: "Bahçelievler Mah. 7. Cad. No:12, Çankaya/Ankara" } });
  console.log("   ✓ 7: Elif Arslan (Bayi: Kodgem)");

  // --- Müşteri 8: Tüzel — Nilüfer Otomotiv, Mega Yazılım bayisi ---
  const musteri8 = await prisma.musteri.create({
    data: {
      tur: "tuzel", sirket_adi: "Nilüfer Otomotiv San. ve Tic. A.Ş.", yetkili_kisi: "Burak Yılmaz",
      eposta: "burak@niluferotomotiv.com", vergi_no: "8889990001", vergi_dairesi: "Osmangazi",
      sektor_id: sektorMap["Üretim"], durum: "aktif", etiketler: ["Üretim", "Otomotiv", "Kurumsal"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri8.id, telefon: "05381112233" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri8.id, adres: "Organize Sanayi Bölgesi 12. Cd. No:45, Nilüfer/Bursa" } });
  await prisma.iletisimKisi.create({
    data: { musteri_id: musteri8.id, ad_soyad: "Burak Yılmaz", unvan: "Fabrika Müdürü", departman: "Üretim", telefon: "02248901234", cep_telefon: "05381112233", eposta: "burak@niluferotomotiv.com", birincil: 1 },
  });
  console.log("   ✓ 8: Nilüfer Otomotiv (Bayi: Mega Yazılım)");

  // --- Müşteri 9: Gerçek kişi, Doruk Bilişim bayisi ---
  const musteri9 = await prisma.musteri.create({
    data: {
      tur: "gercek", ad_soyad: "Serkan Polat", tc_kimlik_no: "50560570580",
      eposta: "serkan.polat@gmail.com", sektor_id: sektorMap["Perakende"], durum: "aktif", etiketler: ["Esnaf", "Antalya"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri9.id, telefon: "05074567890" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri9.id, adres: "Konyaaltı Mah. Liman Cad. No:33, Konyaaltı/Antalya" } });
  console.log("   ✓ 9: Serkan Polat (Bayi: Doruk Bilişim)");

  // --- Müşteri 10: Tüzel, Bağımsız ---
  const musteri10 = await prisma.musteri.create({
    data: {
      tur: "tuzel", sirket_adi: "Akdeniz Gıda Toptan Tic. Ltd. Şti.", yetkili_kisi: "Murat Koç",
      eposta: "murat@akdenizgida.com.tr", vergi_no: "3334445556", vergi_dairesi: "Muratpaşa",
      sektor_id: sektorMap["Gıda"], durum: "aktif", etiketler: ["Toptan", "Gıda"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri10.id, telefon: "05427890123" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri10.id, adres: "Toptancılar Sitesi B Blok No:14, Muratpaşa/Antalya" } });
  await prisma.iletisimKisi.create({
    data: { musteri_id: musteri10.id, ad_soyad: "Murat Koç", unvan: "Genel Müdür", departman: "Yönetim", telefon: "02423456789", cep_telefon: "05427890123", eposta: "murat@akdenizgida.com.tr", birincil: 1 },
  });
  console.log("   ✓ 10: Akdeniz Gıda (Bağımsız)");

  // --- Müşteri 11: Tüzel — Eğitim sektörü, Güzel Teknoloji ---
  const musteri11 = await prisma.musteri.create({
    data: {
      tur: "tuzel", sirket_adi: "Bilgi Üniversitesi Vakfı", yetkili_kisi: "Prof. Dr. Hasan Korkmaz",
      eposta: "bilgiislem@bilgiuni.edu.tr", vergi_no: "7778889990", vergi_dairesi: "Şişli",
      sektor_id: sektorMap["Eğitim"], durum: "aktif", etiketler: ["Eğitim", "Vakıf"],
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri11.id, telefon: "02125551234" } });
  await prisma.musteriAdres.create({ data: { musteri_id: musteri11.id, adres: "Şişli Mah. Halaskargazi Cad. No:150, Şişli/İstanbul" } });
  await prisma.iletisimKisi.create({
    data: { musteri_id: musteri11.id, ad_soyad: "Dr. Ayşe Çelik", unvan: "Bilgi İşlem Direktörü", departman: "IT", cep_telefon: "05331112233", eposta: "ayse.celik@bilgiuni.edu.tr", birincil: 1 },
  });
  console.log("   ✓ 11: Bilgi Üniversitesi Vakfı (Bayi: Güzel Teknoloji)");

  // --- Müşteri 12: Pasif müşteri (süresi dolmuş) ---
  const musteri12 = await prisma.musteri.create({
    data: {
      tur: "gercek", ad_soyad: "Hüseyin Çetin", tc_kimlik_no: "60670680690",
      eposta: "huseyin.cetin@hotmail.com", sektor_id: sektorMap["Hizmet"], durum: "pasif",
    },
  });
  await prisma.musteriTelefon.create({ data: { musteri_id: musteri12.id, telefon: "05461234567" } });
  console.log("   ✓ 12: Hüseyin Çetin (Pasif)");

  console.log("   ─ Toplam 12 müşteri");

  // =============================================
  // 13. SÜRÜMLER
  // =============================================
  console.log("\n📦 Sürümler oluşturuluyor...");
  const surumVerileri = [
    { urun_id: urunMap["VegaPos"], urun_adi: "VegaPos", surum: "4.2.1", tarih: new Date("2026-03-15"), duzenlenenler: "Kasa kapanış raporu hatası giderildi\nZ raporu yazıcı uyumluluğu iyileştirildi", eklenenler: "Toplu ürün fiyat güncelleme\nBarkod okuyucu entegrasyonu", cikarilanlar: "Eski XML export kaldırıldı" },
    { urun_id: urunMap["VegaPos"], urun_adi: "VegaPos", surum: "4.2.0", tarih: new Date("2026-01-10"), duzenlenenler: "Performans iyileştirmeleri", eklenenler: "Çoklu şube desteği\nMüşteri sadakat kartı modülü", cikarilanlar: null },
    { urun_id: urunMap["VegaPos"], urun_adi: "VegaPos", surum: "4.1.8", tarih: new Date("2025-11-20"), duzenlenenler: "Stok sayım hatası düzeltildi", eklenenler: "Anlık stok takip ekranı", cikarilanlar: null },
    { urun_id: urunMap["VegaCari"], urun_adi: "VegaCari", surum: "3.8.0", tarih: new Date("2026-02-28"), duzenlenenler: "Mutabakat hesaplama düzeltmesi\nDöviz kuru güncelleme sorunu", eklenenler: "Otomatik virman talimatı\nGelir/gider karşılaştırma raporu", cikarilanlar: null },
    { urun_id: urunMap["VegaCari"], urun_adi: "VegaCari", surum: "3.7.5", tarih: new Date("2025-12-01"), duzenlenenler: "Mizan raporu round hatası", eklenenler: "E-Defter XML export", cikarilanlar: null },
    { urun_id: urunMap["VegaHR"], urun_adi: "VegaHR", surum: "1.0.0", tarih: new Date("2026-04-01"), duzenlenenler: null, eklenenler: "İlk sürüm: Personel yönetimi\nBordro hesaplama\nİzin takip modülü\nPuantaj sistemi", cikarilanlar: null },
    { urun_id: urunMap["E-Fatura Portal"], urun_adi: "E-Fatura Portal", surum: "2.5.0", tarih: new Date("2026-03-01"), duzenlenenler: "GİB şema v1.3 uyumluluğu", eklenenler: "Toplu fatura gönderim\nOtomatik fatura numaralama", cikarilanlar: null },
    { urun_id: urunMap["PAVO SmartPos"], urun_adi: "PAVO SmartPos", surum: "2.0.0", tarih: new Date("2026-02-01"), duzenlenenler: "Firmware güvenlik güncellemesi", eklenenler: "Temassız ödeme (NFC) desteği\nQR kod ödeme entegrasyonu", cikarilanlar: "Eski banka POS protokolü" },
  ];
  for (const s of surumVerileri) {
    await prisma.surum.create({ data: s });
  }
  console.log(`   ✓ ${surumVerileri.length} sürüm`);

  // =============================================
  // 14. NOTLAR
  // =============================================
  console.log("\n📝 Notlar oluşturuluyor...");
  const notVerileri = [
    { musteri_id: musteri1.id, metin: "Mehmet Bey VegaPos Enterprise pakete yükseltmek istiyor, 10 kullanıcıya çıkacak.", onemli: 1 },
    { musteri_id: musteri1.id, metin: "Yıllık yenileme faturası kesildi, ödeme bekleniyor.", onemli: 0 },
    { musteri_id: musteri2.id, metin: "Anadolu Market 12 şubeye çıkıyor, toplu lisans teklifi hazırlandı. Enterprise pakete geçiş yapılacak.", onemli: 1 },
    { musteri_id: musteri2.id, metin: "E-Fatura kotası dolmak üzere, 500'lük pakete yükseltilmeli.", onemli: 1 },
    { musteri_id: musteri3.id, metin: "Ahmet Bey VegaCari demo talep etti, 15 günlük demo lisansı verildi.", onemli: 0 },
    { musteri_id: musteri4.id, metin: "Ege Lojistik E-İrsaliye entegrasyonu tamamlandı, eğitim verilecek.", onemli: 1 },
    { musteri_id: musteri5.id, metin: "Canan Hanım hosting yükseltme istedi, 25GB'a geçilecek.", onemli: 0 },
    { musteri_id: musteri6.id, metin: "Başkent Medikal VegaHR demo istiyor, sağlık sektörü için özelleştirme gerekebilir.", onemli: 1 },
    { musteri_id: musteri7.id, metin: "Elif Hanım domain yenileme hatırlatması yapıldı.", onemli: 0 },
    { musteri_id: musteri8.id, metin: "Nilüfer Otomotiv SmartPos cihazında garanti kapsamında değişim yapıldı.", onemli: 1 },
    { musteri_id: musteri9.id, metin: "Serkan Bey E-Arşiv entegrasyonu sorunsuz çalışıyor, memnun.", onemli: 0 },
    { musteri_id: musteri10.id, metin: "Akdeniz Gıda yeni şube açıyor — ek VegaPos ve SmartPos talebi., fiber internet bağlantısı da gerekiyor.", onemli: 1 },
    { musteri_id: musteri11.id, metin: "Üniversite 50 kullanıcılık VegaHR paketi değerlendiriyor, toplantı planlanacak.", onemli: 1 },
    { musteri_id: musteri12.id, metin: "Müşteri 6 aydır iletişime geçemiyoruz, pasife alındı.", onemli: 0 },
    { bayi_id: bayi1.id, metin: "Güzel Teknoloji Q1 hedeflerini %120 aştı, prim hesaplanacak.", onemli: 1 },
    { bayi_id: bayi2.id, metin: "Panu Teknoloji İzmir bölgesi satışlarında lider konumda.", onemli: 1 },
    { bayi_id: bayi3.id, metin: "Kodgem Bilişim yeni sözleşme imzalandı, komisyon %12'ye yükseltildi.", onemli: 1 },
    { bayi_id: bayi4.id, metin: "Mega Yazılım Bursa Technology fuarında standımızı temsil edecek.", onemli: 0 },
    { bayi_id: bayi5.id, metin: "Doruk Bilişim Antalya bölgesinde yeni müşteri portföyü genişliyor.", onemli: 0 },
  ];
  for (const not of notVerileri) {
    await prisma.noti.create({
      data: { musteri_id: not.musteri_id || null, bayi_id: not.bayi_id || null, kullanici_id: admin.id, metin: not.metin, onemli: not.onemli, tarih: rastgeleTarih(90) },
    });
  }
  console.log(`   ✓ ${notVerileri.length} not`);

  // =============================================
  // 15. İLETİŞİM KAYITLARI
  // =============================================
  console.log("\n📞 İletişim kayıtları oluşturuluyor...");
  const iletisimKayitlari = [
    { musteri_id: musteri1.id, iletisim_turu: "telefon", konu: "Yenileme Hatırlatması", aciklama: "VegaPos yıllık lisans yenileme görüşmesi yapıldı. Enterprise pakete geçiş teklifi sunuldu." },
    { musteri_id: musteri2.id, iletisim_turu: "toplanti", konu: "Şube Genişleme Toplantısı", aciklama: "12 şubeye çıkış planı görüşüldü. Toplu lisans indirimi ve kurulum takvimi belirlendi." },
    { musteri_id: musteri2.id, iletisim_turu: "eposta", konu: "E-Fatura Kota Uyarısı", aciklama: "Aylık fatura kotasının %90'ına ulaşıldığı bildirildi. Paket yükseltme önerildi." },
    { musteri_id: musteri3.id, iletisim_turu: "telefon", konu: "Demo Talebi", aciklama: "VegaCari için 15 günlük demo lisansı oluşturuldu ve gönderildi." },
    { musteri_id: musteri4.id, iletisim_turu: "toplanti", konu: "E-İrsaliye Eğitimi", aciklama: "Online eğitim yapıldı, 3 personel katıldı. Kullanım kılavuzu gönderildi." },
    { musteri_id: musteri6.id, iletisim_turu: "eposta", konu: "VegaHR Tanıtımı", aciklama: "VegaHR ürün broşürü ve demo bağlantısı gönderildi. Toplantı talebi bekleniyor." },
    { musteri_id: musteri8.id, iletisim_turu: "telefon", konu: "SmartPos Garanti Değişim", aciklama: "Arızalı SmartPos cihazı garanti kapsamında değiştirildi. Yeni cihaz kargo ile gönderildi." },
    { musteri_id: musteri10.id, iletisim_turu: "toplanti", konu: "Yeni Şube Planlama", aciklama: "Yeni şube için VegaPos + SmartPos + Fiber internet paketi hazırlanıyor." },
    { musteri_id: musteri11.id, iletisim_turu: "eposta", konu: "VegaHR 50 Kullanıcı Teklifi", aciklama: "50 kullanıcılık VegaHR Premium paketi fiyat teklifi gönderildi." },
    { musteri_id: musteri12.id, iletisim_turu: "telefon", konu: "İletişim Denemesi", aciklama: "Müşteriye ulaşılamadı, numara kapalı. 3. deneme, pasife alınması önerildi." },
  ];
  for (const ik of iletisimKayitlari) {
    const tarih = rastgeleTarih(60);
    await prisma.iletisimKaydi.create({
      data: {
        musteri_id: ik.musteri_id,
        kullanici_id: admin.id,
        iletisim_turu: ik.iletisim_turu,
        konu: ik.konu,
        aciklama: ik.aciklama,
        iletisim_tarihi: tarih,
        sonraki_iletisim: bitisTarihiHesapla(tarih, 14),
      },
    });
  }
  console.log(`   ✓ ${iletisimKayitlari.length} iletişim kaydı`);

  // =============================================
  // 16. LİSANSLAR
  // =============================================
  console.log("\n🔑 Lisanslar oluşturuluyor...");
  let lisansSayisi = 0;

  async function lisansOlustur(data) {
    await prisma.lisans.create({ data });
    lisansSayisi++;
  }

  // --- Müşteri 1: Mehmet Yıldız (Bağımsız) — 5 lisans ---
  const m1t1 = rastgeleTarih(180);
  await lisansOlustur({ musteri_id: musteri1.id, bayi_id: null, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Professional"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1t1, bitis_tarihi: bitisTarihiHesapla(m1t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "10120130140", fiyat: 5000, net_tutar: 5000, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 5000 });

  const m1t2 = rastgeleTarih(120);
  await lisansOlustur({ musteri_id: musteri1.id, bayi_id: null, urun_id: urunMap["E-Fatura Portal"], paket_id: paketMap["E-Fatura 100"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1t2, bitis_tarihi: bitisTarihiHesapla(m1t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "10120130140", fiyat: 2000, net_tutar: 2000, odeme_durumu: "odendi", odenen_tutar: 2000 });

  const m1t3 = rastgeleTarih(300);
  await lisansOlustur({ musteri_id: musteri1.id, bayi_id: null, urun_id: urunMap["Domain Tescil"], paket_id: paketMap["Domain .com"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1t3, bitis_tarihi: bitisTarihiHesapla(m1t3, 365), kullanim_gunu: 365, durum: "aktif", domain: "mehmetyildiz.com", fiyat: 150, net_tutar: 150, odeme_durumu: "odendi", odenen_tutar: 150 });

  const m1t4 = rastgeleTarih(100);
  await lisansOlustur({ musteri_id: musteri1.id, bayi_id: null, urun_id: urunMap["PAVO SmartPos"], paket_id: paketMap["PAVO Standart"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1, lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1t4, bitis_tarihi: null, kullanim_gunu: 0, durum: "aktif", domain: "OKC-2024-001", fiyat: 8500, net_tutar: 8500, odeme_durumu: "odendi", odenen_tutar: 8500, mac_adresi: "AA:BB:CC:DD:EE:01" });

  const m1t5 = rastgeleTarih(50);
  await lisansOlustur({ musteri_id: musteri1.id, bayi_id: null, urun_id: urunMap["E-Arşiv Fatura"], paket_id: paketMap["E-Arşiv Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m1t5, bitis_tarihi: bitisTarihiHesapla(m1t5, 365), kullanim_gunu: 365, durum: "aktif", domain: "10120130140", fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000 });
  console.log("   ✓ Mehmet Yıldız: 5 lisans");

  // --- Müşteri 2: Anadolu Market (Bayi: Güzel Teknoloji) — 8 lisans ---
  const m2t1 = rastgeleTarih(60);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Enterprise"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t1, bitis_tarihi: bitisTarihiHesapla(m2t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "1112223334", fiyat: 8000, net_tutar: 7200, kullanici_sayisi: 20, indirim_orani: 10, indirim_tutari: 800, odeme_durumu: "odendi", odenen_tutar: 7200, notlar: "Bayi indirimi %10" });

  const m2t2 = rastgeleTarih(60);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["VegaCari"], paket_id: paketMap["VegaCari Professional"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t2, bitis_tarihi: bitisTarihiHesapla(m2t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "1112223334", fiyat: 3500, net_tutar: 3150, kullanici_sayisi: 5, indirim_orani: 10, indirim_tutari: 350, odeme_durumu: "odendi", odenen_tutar: 3150 });

  const m2t3 = rastgeleTarih(90);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["E-Fatura Portal"], paket_id: paketMap["E-Fatura 500"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t3, bitis_tarihi: bitisTarihiHesapla(m2t3, 365), kullanim_gunu: 365, durum: "aktif", domain: "1112223334", fiyat: 3500, net_tutar: 3500, odeme_durumu: "odendi", odenen_tutar: 3500 });

  const m2t4 = rastgeleTarih(90);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["E-Arşiv Fatura"], paket_id: paketMap["E-Arşiv Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t4, bitis_tarihi: bitisTarihiHesapla(m2t4, 365), kullanim_gunu: 365, durum: "aktif", domain: "1112223334", fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000 });

  const m2t5 = rastgeleTarih(200);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["Web Hosting"], paket_id: paketMap["Hosting 25GB"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t5, bitis_tarihi: bitisTarihiHesapla(m2t5, 365), kullanim_gunu: 365, durum: "aktif", domain: "anadolumarket.com.tr", fiyat: 1500, net_tutar: 1500, odeme_durumu: "odendi", odenen_tutar: 1500 });

  const m2t6 = rastgeleTarih(200);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["Domain Tescil"], paket_id: paketMap["Domain .com.tr"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t6, bitis_tarihi: bitisTarihiHesapla(m2t6, 365), kullanim_gunu: 365, durum: "aktif", domain: "anadolumarket.com.tr", fiyat: 80, net_tutar: 80, odeme_durumu: "odendi", odenen_tutar: 80 });

  const m2t7 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["Kurumsal E-Posta"], paket_id: paketMap["E-Posta 20 Hesap"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t7, bitis_tarihi: bitisTarihiHesapla(m2t7, 365), kullanim_gunu: 365, durum: "aktif", domain: "anadolumarket.com.tr", fiyat: 1600, net_tutar: 1600, kullanici_sayisi: 20, odeme_durumu: "odendi", odenen_tutar: 1600 });

  const m2t8 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri2.id, bayi_id: bayi1.id, urun_id: urunMap["E-İrsaliye"], paket_id: paketMap["E-İrsaliye Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m2t8, bitis_tarihi: bitisTarihiHesapla(m2t8, 365), kullanim_gunu: 365, durum: "aktif", domain: "1112223334", fiyat: 800, net_tutar: 800, odeme_durumu: "odendi", odenen_tutar: 800 });
  console.log("   ✓ Anadolu Market: 8 lisans");

  // --- Müşteri 3: Ahmet Kaya (Bayi: Güzel Teknoloji) — 3 lisans ---
  const m3t1 = rastgeleTarih(150);
  await lisansOlustur({ musteri_id: musteri3.id, bayi_id: bayi1.id, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Starter"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m3t1, bitis_tarihi: bitisTarihiHesapla(m3t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "20230240250", fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 3500 });

  const m3t2 = rastgeleTarih(100);
  await lisansOlustur({ musteri_id: musteri3.id, bayi_id: bayi1.id, urun_id: urunMap["PAVO SmartPos"], paket_id: paketMap["PAVO Standart"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1, lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m3t2, bitis_tarihi: null, kullanim_gunu: 0, durum: "aktif", domain: "OKC-2024-002", fiyat: 8500, net_tutar: 8500, odeme_durumu: "odendi", odenen_tutar: 8500 });

  // Demo lisans
  const m3t3 = rastgeleTarih(10);
  await lisansOlustur({ musteri_id: musteri3.id, bayi_id: bayi1.id, urun_id: urunMap["VegaCari"], paket_id: paketMap["VegaCari Basic"], lisans_tipi_id: lisansTipiMap["demo"], lisans_tipi: "demo", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m3t3, bitis_tarihi: bitisTarihiHesapla(m3t3, 15), kullanim_gunu: 15, durum: "aktif", domain: "20230240250", fiyat: 0, net_tutar: 0, odeme_durumu: "odenmedi", odenen_tutar: 0, notlar: "15 günlük demo" });
  console.log("   ✓ Ahmet Kaya: 3 lisans (1 demo)");

  // --- Müşteri 4: Ege Lojistik (Bayi: Panu) — 4 lisans ---
  const m4t1 = rastgeleTarih(90);
  await lisansOlustur({ musteri_id: musteri4.id, bayi_id: bayi2.id, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Professional"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m4t1, bitis_tarihi: bitisTarihiHesapla(m4t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "4445556667", fiyat: 5000, net_tutar: 5000, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 5000 });

  const m4t2 = rastgeleTarih(90);
  await lisansOlustur({ musteri_id: musteri4.id, bayi_id: bayi2.id, urun_id: urunMap["E-Fatura Portal"], paket_id: paketMap["E-Fatura 100"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m4t2, bitis_tarihi: bitisTarihiHesapla(m4t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "4445556667", fiyat: 2000, net_tutar: 2000, odeme_durumu: "odendi", odenen_tutar: 2000 });

  const m4t3 = rastgeleTarih(90);
  await lisansOlustur({ musteri_id: musteri4.id, bayi_id: bayi2.id, urun_id: urunMap["E-İrsaliye"], paket_id: paketMap["E-İrsaliye Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m4t3, bitis_tarihi: bitisTarihiHesapla(m4t3, 365), kullanim_gunu: 365, durum: "aktif", domain: "4445556667", fiyat: 800, net_tutar: 800, odeme_durumu: "odendi", odenen_tutar: 800 });

  const m4t4 = rastgeleTarih(150);
  await lisansOlustur({ musteri_id: musteri4.id, bayi_id: bayi2.id, urun_id: urunMap["Domain Tescil"], paket_id: paketMap["Domain .com"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m4t4, bitis_tarihi: bitisTarihiHesapla(m4t4, 365), kullanim_gunu: 365, durum: "aktif", domain: "egelojistik.com", fiyat: 150, net_tutar: 150, odeme_durumu: "odendi", odenen_tutar: 150 });
  console.log("   ✓ Ege Lojistik: 4 lisans");

  // --- Müşteri 5: Canan Demir (Bayi: Panu) — 2 lisans ---
  const m5t1 = rastgeleTarih(45);
  await lisansOlustur({ musteri_id: musteri5.id, bayi_id: bayi2.id, urun_id: urunMap["VegaCari"], paket_id: paketMap["VegaCari Basic"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m5t1, bitis_tarihi: bitisTarihiHesapla(m5t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "30340350360", fiyat: 2500, net_tutar: 2500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 2500 });

  const m5t2 = rastgeleTarih(45);
  await lisansOlustur({ musteri_id: musteri5.id, bayi_id: bayi2.id, urun_id: urunMap["E-Arşiv Fatura"], paket_id: paketMap["E-Arşiv Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m5t2, bitis_tarihi: bitisTarihiHesapla(m5t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "30340350360", fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000 });
  console.log("   ✓ Canan Demir: 2 lisans");

  // --- Müşteri 6: Başkent Medikal (Bayi: Kodgem) — 7 lisans ---
  const m6t1 = rastgeleTarih(60);
  await lisansOlustur({ musteri_id: musteri6.id, bayi_id: bayi3.id, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Professional"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6t1, bitis_tarihi: bitisTarihiHesapla(m6t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "6667778889", fiyat: 5000, net_tutar: 5000, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 5000 });

  const m6t2 = rastgeleTarih(60);
  await lisansOlustur({ musteri_id: musteri6.id, bayi_id: bayi3.id, urun_id: urunMap["E-Fatura Portal"], paket_id: paketMap["E-Fatura 500"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6t2, bitis_tarihi: bitisTarihiHesapla(m6t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "6667778889", fiyat: 3500, net_tutar: 3500, odeme_durumu: "odendi", odenen_tutar: 3500 });

  const m6t3 = rastgeleTarih(60);
  await lisansOlustur({ musteri_id: musteri6.id, bayi_id: bayi3.id, urun_id: urunMap["E-Arşiv Fatura"], paket_id: paketMap["E-Arşiv Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6t3, bitis_tarihi: bitisTarihiHesapla(m6t3, 365), kullanim_gunu: 365, durum: "aktif", domain: "6667778889", fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000 });

  const m6t4 = rastgeleTarih(100);
  await lisansOlustur({ musteri_id: musteri6.id, bayi_id: bayi3.id, urun_id: urunMap["E-Mutabakat Kontör"], paket_id: paketMap["E-Mutabakat 500"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6t4, bitis_tarihi: bitisTarihiHesapla(m6t4, 365), kullanim_gunu: 365, durum: "aktif", domain: "6667778889", fiyat: 1750, net_tutar: 1750, odeme_durumu: "odendi", odenen_tutar: 1750, notlar: "500 kontör paketi" });

  const m6t5 = rastgeleTarih(150);
  await lisansOlustur({ musteri_id: musteri6.id, bayi_id: bayi3.id, urun_id: urunMap["Web Hosting"], paket_id: paketMap["Hosting 5GB"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6t5, bitis_tarihi: bitisTarihiHesapla(m6t5, 365), kullanim_gunu: 365, durum: "aktif", domain: "baskentmedikal.com", fiyat: 500, net_tutar: 500, odeme_durumu: "odendi", odenen_tutar: 500 });

  const m6t6 = rastgeleTarih(150);
  await lisansOlustur({ musteri_id: musteri6.id, bayi_id: bayi3.id, urun_id: urunMap["Kurumsal E-Posta"], paket_id: paketMap["E-Posta 5 Hesap"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1, lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6t6, bitis_tarihi: null, kullanim_gunu: 0, durum: "aktif", domain: "baskentmedikal.com", fiyat: 500, net_tutar: 500, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 500 });

  const m6t7 = rastgeleTarih(150);
  await lisansOlustur({ musteri_id: musteri6.id, bayi_id: bayi3.id, urun_id: urunMap["Domain Tescil"], paket_id: paketMap["Domain .com"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m6t7, bitis_tarihi: bitisTarihiHesapla(m6t7, 365), kullanim_gunu: 365, durum: "aktif", domain: "baskentmedikal.com", fiyat: 150, net_tutar: 150, odeme_durumu: "odendi", odenen_tutar: 150 });
  console.log("   ✓ Başkent Medikal: 7 lisans");

  // --- Müşteri 7: Elif Arslan (Bayi: Kodgem) — 1 lisans ---
  const m7t1 = rastgeleTarih(200);
  await lisansOlustur({ musteri_id: musteri7.id, bayi_id: bayi3.id, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Starter"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m7t1, bitis_tarihi: bitisTarihiHesapla(m7t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "40450460470", fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 3500 });
  console.log("   ✓ Elif Arslan: 1 lisans");

  // --- Müşteri 8: Nilüfer Otomotiv (Bayi: Mega) — 5 lisans ---
  const m8t1 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri8.id, bayi_id: bayi4.id, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Enterprise"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8t1, bitis_tarihi: bitisTarihiHesapla(m8t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "8889990001", fiyat: 8000, net_tutar: 8000, kullanici_sayisi: 20, odeme_durumu: "odendi", odenen_tutar: 8000 });

  const m8t2 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri8.id, bayi_id: bayi4.id, urun_id: urunMap["VegaCari"], paket_id: paketMap["VegaCari Professional"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8t2, bitis_tarihi: bitisTarihiHesapla(m8t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "8889990001", fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 3500 });

  const m8t3 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri8.id, bayi_id: bayi4.id, urun_id: urunMap["E-Fatura Portal"], paket_id: paketMap["E-Fatura Sınırsız"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8t3, bitis_tarihi: bitisTarihiHesapla(m8t3, 365), kullanim_gunu: 365, durum: "aktif", domain: "8889990001", fiyat: 10000, net_tutar: 10000, odeme_durumu: "odendi", odenen_tutar: 10000 });

  const m8t4 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri8.id, bayi_id: bayi4.id, urun_id: urunMap["E-İrsaliye"], paket_id: paketMap["E-İrsaliye Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8t4, bitis_tarihi: bitisTarihiHesapla(m8t4, 365), kullanim_gunu: 365, durum: "aktif", domain: "8889990001", fiyat: 800, net_tutar: 800, odeme_durumu: "odendi", odenen_tutar: 800 });

  const m8t5 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri8.id, bayi_id: bayi4.id, urun_id: urunMap["PAVO SmartPos"], paket_id: paketMap["PAVO Standart"], lisans_tipi_id: lisansTipiMap["suresiz"], lisans_tipi: "suresiz", suresiz: 1, lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m8t5, bitis_tarihi: null, kullanim_gunu: 0, durum: "aktif", domain: "OKC-2025-003", fiyat: 8500, net_tutar: 8500, odeme_durumu: "odendi", odenen_tutar: 8500 });
  console.log("   ✓ Nilüfer Otomotiv: 5 lisans");

  // --- Müşteri 9: Serkan Polat (Bayi: Doruk) — 2 lisans ---
  const m9t1 = rastgeleTarih(120);
  await lisansOlustur({ musteri_id: musteri9.id, bayi_id: bayi5.id, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Starter"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m9t1, bitis_tarihi: bitisTarihiHesapla(m9t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "50560570580", fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 3500 });

  const m9t2 = rastgeleTarih(120);
  await lisansOlustur({ musteri_id: musteri9.id, bayi_id: bayi5.id, urun_id: urunMap["E-Arşiv Fatura"], paket_id: paketMap["E-Arşiv Yıllık"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m9t2, bitis_tarihi: bitisTarihiHesapla(m9t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "50560570580", fiyat: 1000, net_tutar: 1000, odeme_durumu: "odendi", odenen_tutar: 1000 });
  console.log("   ✓ Serkan Polat: 2 lisans");

  // --- Müşteri 10: Akdeniz Gıda (Bağımsız) — 6 lisans ---
  const m10t1 = rastgeleTarih(50);
  await lisansOlustur({ musteri_id: musteri10.id, bayi_id: null, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Professional"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10t1, bitis_tarihi: bitisTarihiHesapla(m10t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "3334445556", fiyat: 5000, net_tutar: 5000, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 5000 });

  const m10t2 = rastgeleTarih(50);
  await lisansOlustur({ musteri_id: musteri10.id, bayi_id: null, urun_id: urunMap["VegaCari"], paket_id: paketMap["VegaCari Professional"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10t2, bitis_tarihi: bitisTarihiHesapla(m10t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "3334445556", fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 5, odeme_durumu: "odendi", odenen_tutar: 3500 });

  const m10t3 = rastgeleTarih(50);
  await lisansOlustur({ musteri_id: musteri10.id, bayi_id: null, urun_id: urunMap["E-Fatura Portal"], paket_id: paketMap["E-Fatura 500"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10t3, bitis_tarihi: bitisTarihiHesapla(m10t3, 365), kullanim_gunu: 365, durum: "aktif", domain: "3334445556", fiyat: 3500, net_tutar: 3500, odeme_durumu: "odendi", odenen_tutar: 3500 });

  const m10t4 = rastgeleTarih(50);
  await lisansOlustur({ musteri_id: musteri10.id, bayi_id: null, urun_id: urunMap["Domain Tescil"], paket_id: paketMap["Domain .com.tr"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10t4, bitis_tarihi: bitisTarihiHesapla(m10t4, 365), kullanim_gunu: 365, durum: "aktif", domain: "akdenizgida.com.tr", fiyat: 80, net_tutar: 80, odeme_durumu: "odendi", odenen_tutar: 80 });

  const m10t5 = rastgeleTarih(50);
  await lisansOlustur({ musteri_id: musteri10.id, bayi_id: null, urun_id: urunMap["Web Hosting"], paket_id: paketMap["Hosting 25GB"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10t5, bitis_tarihi: bitisTarihiHesapla(m10t5, 365), kullanim_gunu: 365, durum: "aktif", domain: "akdenizgida.com.tr", fiyat: 1500, net_tutar: 1500, odeme_durumu: "odendi", odenen_tutar: 1500 });

  // Ödenmemiş lisans
  const m10t6 = rastgeleTarih(10);
  await lisansOlustur({ musteri_id: musteri10.id, bayi_id: null, urun_id: urunMap["Fiber İnternet"], paket_id: paketMap["Fiber 100 Mbps"], lisans_tipi_id: lisansTipiMap["aylik"], lisans_tipi: "aylik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m10t6, bitis_tarihi: bitisTarihiHesapla(m10t6, 30), kullanim_gunu: 30, durum: "aktif", domain: "3334445556", fiyat: 750, net_tutar: 750, odeme_durumu: "beklemede", odenen_tutar: 0, notlar: "İlk ay fatura henüz ödenmedi" });
  console.log("   ✓ Akdeniz Gıda: 6 lisans (1 ödenmemiş)");

  // --- Müşteri 11: Bilgi Üniversitesi (Bayi: Güzel Teknoloji) — 2 lisans ---
  const m11t1 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri11.id, bayi_id: bayi1.id, urun_id: urunMap["VegaHR"], paket_id: paketMap["VegaHR Premium"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m11t1, bitis_tarihi: bitisTarihiHesapla(m11t1, 365), kullanim_gunu: 365, durum: "aktif", domain: "7778889990", fiyat: 7000, net_tutar: 5600, kullanici_sayisi: 20, indirim_orani: 20, indirim_tutari: 1400, odeme_durumu: "odendi", odenen_tutar: 5600, notlar: "Lansman kampanyası %20 indirim" });

  const m11t2 = rastgeleTarih(30);
  await lisansOlustur({ musteri_id: musteri11.id, bayi_id: bayi1.id, urun_id: urunMap["Kurumsal E-Posta"], paket_id: paketMap["E-Posta 20 Hesap"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m11t2, bitis_tarihi: bitisTarihiHesapla(m11t2, 365), kullanim_gunu: 365, durum: "aktif", domain: "bilgiuni.edu.tr", fiyat: 1600, net_tutar: 1600, kullanici_sayisi: 20, odeme_durumu: "odendi", odenen_tutar: 1600 });
  console.log("   ✓ Bilgi Üniversitesi: 2 lisans");

  // --- Müşteri 12: Hüseyin Çetin (Pasif) — 1 süresi dolmuş lisans ---
  const m12t1Start = new Date();
  m12t1Start.setDate(m12t1Start.getDate() - 400);
  await lisansOlustur({ musteri_id: musteri12.id, bayi_id: null, urun_id: urunMap["VegaPos"], paket_id: paketMap["VegaPos Starter"], lisans_tipi_id: lisansTipiMap["yillik"], lisans_tipi: "yillik", lisans_anahtari: lisansAnahtari(), baslangic_tarihi: m12t1Start, bitis_tarihi: bitisTarihiHesapla(m12t1Start, 365), kullanim_gunu: 365, durum: "suresi_doldu", domain: "60670680690", fiyat: 3500, net_tutar: 3500, kullanici_sayisi: 1, odeme_durumu: "odendi", odenen_tutar: 3500, notlar: "Müşteri ulaşılamıyor, lisans yenilenmedi" });
  console.log("   ✓ Hüseyin Çetin: 1 lisans (süresi dolmuş)");

  console.log(`   ─ Toplam ${lisansSayisi} lisans`);

  // =============================================
  // 17. AKTİVİTE LOGLARI
  // =============================================
  console.log("\n📊 Aktivite logları oluşturuluyor...");
  const logVerileri = [
    { tip: "lisans_ekleme", mesaj: "Anadolu Market Zinciri A.Ş. için VegaPos Enterprise lisansı oluşturuldu" },
    { tip: "lisans_ekleme", mesaj: "Bilgi Üniversitesi Vakfı için VegaHR Premium lisansı oluşturuldu (Kampanya %20)" },
    { tip: "musteri_ekleme", mesaj: "Yeni müşteri eklendi: Bilgi Üniversitesi Vakfı" },
    { tip: "musteri_ekleme", mesaj: "Yeni müşteri eklendi: Akdeniz Gıda Toptan Tic. Ltd. Şti." },
    { tip: "bayi_guncelleme", mesaj: "Kodgem Bilişim komisyon oranı %10 → %12 olarak güncellendi" },
    { tip: "lisans_yenileme", mesaj: "Mehmet Yıldız — VegaPos yıllık lisansı yenilendi" },
    { tip: "urun_guncelleme", mesaj: "VegaPos v4.2.1 sürümü yayınlandı" },
    { tip: "urun_guncelleme", mesaj: "VegaCari v3.8.0 sürümü yayınlandı" },
    { tip: "urun_ekleme", mesaj: "Yeni ürün eklendi: VegaHR İnsan Kaynakları" },
    { tip: "urun_ekleme", mesaj: "Yeni ürün eklendi: Fiber İnternet" },
    { tip: "lisans_iptal", mesaj: "Hüseyin Çetin — VegaPos lisansı süresi doldu, yenilenmedi" },
    { tip: "yedekleme", mesaj: "Veritabanı JSON yedeği oluşturuldu (admin)" },
    { tip: "giris", mesaj: "Baran Güzel sisteme giriş yaptı" },
    { tip: "giris", mesaj: "Baran Güzel sisteme giriş yaptı" },
    { tip: "lisans_ekleme", mesaj: "Nilüfer Otomotiv için PAVO SmartPos süresiz lisansı oluşturuldu" },
    { tip: "paket_ekleme", mesaj: "VegaHR Starter paketi oluşturuldu" },
    { tip: "paket_ekleme", mesaj: "VegaHR Premium paketi oluşturuldu" },
    { tip: "sablon_guncelleme", mesaj: "VegaPos şablonuna urun_yonetimi ve guvenlik özellikleri eklendi" },
  ];
  for (const log of logVerileri) {
    await prisma.aktiviteLog.create({
      data: { kullanici_id: admin.id, tip: log.tip, mesaj: log.mesaj, tarih: rastgeleTarih(60) },
    });
  }
  console.log(`   ✓ ${logVerileri.length} aktivite logu`);

  // =============================================
  // ÖZET
  // =============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED VEGA v4 TAMAMLANDI");
  console.log("=".repeat(60));
  console.log(`
📊 ÖZET:
   ├─ Roller: 3 (Yönetici, Bayi, Destek)
   ├─ Kullanıcı: 1 (admin)
   ├─ Sektörler: ${sektorAdlari.length}
   ├─ Lisans Tipleri: ${lisansTipleri.length}
   ├─ Paket Tipleri: ${paketTipleri.length}
   ├─ Ürün Grupları: ${gruplar.length}
   ├─ Ürün Tipleri: ${urunTipleriData.length}
   ├─ Uygulama Tipleri: ${uygulamaTipleriData.length}
   ├─ Ürün Şablonları: ${sablonSayisi} (tüm özellik tipleri kapsanmış)
   │   ├─ VegaPos: temel_fiyat, kullanici_sayisi, aktivasyon_yenileme, kademeli_fiyat,
   │   │          sicil_domain, demo_suresi, otomatik_yenileme, urun_yonetimi,
   │   │          garanti_suresi, guvenlik
   │   ├─ VegaCari: temel_fiyat, kullanici_sayisi, aktivasyon_yenileme, sicil_domain,
   │   │           bagimli_urun, demo_suresi, periyot_indirim, urun_yonetimi
   │   ├─ VegaHR: temel_fiyat, kullanici_sayisi, aktivasyon_yenileme, kampanya,
   │   │         hediye_urun, siparis_miktari, otomatik_yenileme, urun_yonetimi
   │   ├─ E-Fatura: temel_fiyat, aktivasyon_yenileme, sicil_domain, kademeli_fiyat,
   │   │           paket_indirimi, otomatik_yenileme, urun_yonetimi
   │   ├─ E-Arşiv: temel_fiyat, aktivasyon_yenileme, sicil_domain, bagimli_urun
   │   ├─ E-İrsaliye: temel_fiyat, aktivasyon_yenileme, sicil_domain
   │   ├─ E-Mutabakat: temel_fiyat, kademeli_fiyat, sicil_domain, gecis_fiyati
   │   ├─ PAVO SmartPos: temel_fiyat, sicil_domain, garanti_suresi, guvenlik,
   │   │                 urun_yonetimi, siparis_miktari
   │   ├─ Domain: temel_fiyat, sicil_domain, domain_fiyat, otomatik_yenileme, urun_yonetimi
   │   ├─ Hosting: temel_fiyat, kademeli_fiyat, sicil_domain, aktivasyon_yenileme,
   │   │          periyot_indirim, urun_yonetimi
   │   ├─ E-Posta: temel_fiyat, kullanici_sayisi, kademeli_fiyat, sicil_domain, periyot_indirim
   │   └─ Fiber: temel_fiyat, kademeli_fiyat, aktivasyon_yenileme, kampanya,
   │            urun_yonetimi, garanti_suresi
   ├─ Ürünler: ${urunVerileri.length}
   ├─ Paketler: ${paketVerileri.length}
   ├─ Bayi-Ürün İlişkileri: ${bayiUrunVerileri.length}
   ├─ Sürümler: ${surumVerileri.length}
   ├─ Bayiler: 5
   ├─ Müşteriler: 12 (10 aktif + 1 eğitim + 1 pasif)
   ├─ Notlar: ${notVerileri.length}
   ├─ İletişim Kayıtları: ${iletisimKayitlari.length}
   ├─ Lisanslar: ${lisansSayisi}
   │   ├─ Aktif: ${lisansSayisi - 1}
   │   ├─ Süresi Dolmuş: 1
   │   ├─ Demo: 1
   │   └─ Ödenmemiş: 1
   └─ Aktivite Logları: ${logVerileri.length}

🔑 ÖZELLİK TİPLERİ KAPSAMI:
   ✓ temel_fiyat (tüm şablonlar)
   ✓ kullanici_sayisi (VegaPos, VegaCari, VegaHR, E-Posta)
   ✓ aktivasyon_yenileme (VegaPos, VegaCari, VegaHR, E-Fatura, E-Arşiv, E-İrsaliye, Hosting, Fiber)
   ✓ kademeli_fiyat (VegaPos, E-Fatura, E-Mutabakat, Hosting, E-Posta, Fiber)
   ✓ sicil_domain (VegaPos, VegaCari, E-Fatura, E-Arşiv, E-İrsaliye, E-Mutabakat, PAVO, Domain, Hosting, E-Posta)
   ✓ demo_suresi (VegaPos, VegaCari)
   ✓ otomatik_yenileme (VegaPos, VegaHR, E-Fatura, Domain)
   ✓ urun_yonetimi (VegaPos, VegaCari, VegaHR, E-Fatura, PAVO, Domain, Hosting, Fiber)
   ✓ garanti_suresi (VegaPos, PAVO, Fiber)
   ✓ guvenlik (VegaPos, PAVO)
   ✓ kampanya (VegaHR, Fiber)
   ✓ hediye_urun (VegaHR)
   ✓ siparis_miktari (VegaHR, PAVO)
   ✓ paket_indirimi (E-Fatura)
   ✓ periyot_indirim (VegaCari, Hosting, E-Posta)
   ✓ gecis_fiyati (E-Mutabakat)
   ✓ bagimli_urun (VegaCari, E-Arşiv)
   ✓ domain_fiyat (Domain)
`);
}

main()
  .catch((e) => {
    console.error("\n❌ HATA:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
