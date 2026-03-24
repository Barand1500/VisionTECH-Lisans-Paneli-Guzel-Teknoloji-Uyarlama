/* ============================================= */
/*  Güzel Teknoloji - Yönetim Sayfası            */
/*  Sekmeler: Ürünler, Ürün Grupları,            */
/*  Sürümler, Kullanıcılar                        */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState, useRef } from "react";
import KopyalaButonu from "../components/KopyalaButonu";

/* ============================================= */
/*  Sabitler                                      */
/* ============================================= */

const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

/* ---- Sallanma Animasyonu ---- */
const _sallanmaYonetim = document.getElementById("sallanma-stili-yon") || (() => {
  const s = document.createElement("style");
  s.id = "sallanma-stili-yon";
  s.textContent = `@keyframes sallanma { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(5px)} 45%{transform:translateX(-4px)} 60%{transform:translateX(3px)} 75%{transform:translateX(-2px)} } .sallan { animation: sallanma 0.5s ease-in-out; }`;
  document.head.appendChild(s);
  return s;
})();

/* ---- Sekme Tanımları ---- */
const SEKMELER = [
  {
    id: "urunler", etiket: "Ürünler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    id: "urunGruplari", etiket: "Ürün Grupları",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    id: "surumler", etiket: "Sürümler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>,
  },
  {
    id: "kullanicilar", etiket: "Kullanıcılar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
];

/* ============================================= */
/*  Mock Veriler                                  */
/* ============================================= */

const URUN_GRUPLARI = [
  "Alan Adı", "Diğer", "E-Posta", "E-Tuğra", "Hosting", "KEP",
  "SMS", "SSL", "Sunucu", "Yazılım", "Bulut Hizmetleri",
];

const URUN_TIPLERI = ["DOMAIN", "BAKIM ANLAŞMASI", "HOSTING", "YAZILIM", "SSL", "E-POSTA", "SMS", "SUNUCU", "KEP", "E-TUĞRA"];

const UYGULAMA_TIPLERI = ["WEB", "WINDOWS", "MOBİL", "API", "-"];

const PAKET_TIPLERI = ["AKTİVASYON", "EK KULLANICI", "YENİLEME", "UPGRADE", "DENEME", "BAKIM"];

const BASLANGIC_PAKETLER = [
  { id: 1, urunId: 11, urunAdi: "Kurumsal E-Posta 5GB", tipi: "AKTİVASYON", adi: "Business Starter - Aktivasyon", kullanimGunu: 365, fiyati: 0, kullaniciSayisi: 1, aktif: true },
  { id: 2, urunId: 11, urunAdi: "Kurumsal E-Posta 5GB", tipi: "EK KULLANICI", adi: "Business Starter - Ek Kullanıcı", kullanimGunu: 365, fiyati: 0, kullaniciSayisi: 0, aktif: true },
  { id: 3, urunId: 11, urunAdi: "Kurumsal E-Posta 5GB", tipi: "YENİLEME", adi: "Business Starter - Yenileme", kullanimGunu: 365, fiyati: 0, kullaniciSayisi: 1, aktif: true },
  { id: 4, urunId: 12, urunAdi: "Kurumsal E-Posta 10GB", tipi: "AKTİVASYON", adi: "Business Plus - Aktivasyon", kullanimGunu: 365, fiyati: 120, kullaniciSayisi: 1, aktif: true },
  { id: 5, urunId: 12, urunAdi: "Kurumsal E-Posta 10GB", tipi: "YENİLEME", adi: "Business Plus - Yenileme", kullanimGunu: 365, fiyati: 100, kullaniciSayisi: 1, aktif: true },
  { id: 6, urunId: 8, urunAdi: "CRM Yazılımı", tipi: "AKTİVASYON", adi: "CRM Pro - Aktivasyon", kullanimGunu: 365, fiyati: 2500, kullaniciSayisi: 5, aktif: true },
  { id: 7, urunId: 8, urunAdi: "CRM Yazılımı", tipi: "EK KULLANICI", adi: "CRM Pro - Ek Kullanıcı", kullanimGunu: 365, fiyati: 500, kullaniciSayisi: 0, aktif: true },
  { id: 8, urunId: 8, urunAdi: "CRM Yazılımı", tipi: "YENİLEME", adi: "CRM Pro - Yenileme", kullanimGunu: 365, fiyati: 2000, kullaniciSayisi: 5, aktif: true },
  { id: 9, urunId: 8, urunAdi: "CRM Yazılımı", tipi: "UPGRADE", adi: "CRM Pro - Enterprise Upgrade", kullanimGunu: 365, fiyati: 3500, kullaniciSayisi: 10, aktif: true },
  { id: 10, urunId: 9, urunAdi: "E-Ticaret Paketi", tipi: "AKTİVASYON", adi: "E-Ticaret Başlangıç", kullanimGunu: 365, fiyati: 1500, kullaniciSayisi: 2, aktif: true },
  { id: 11, urunId: 9, urunAdi: "E-Ticaret Paketi", tipi: "BAKIM", adi: "E-Ticaret Bakım Paketi", kullanimGunu: 365, fiyati: 800, kullaniciSayisi: 0, aktif: true },
  { id: 12, urunId: 5, urunAdi: "Başlangıç Hosting", tipi: "AKTİVASYON", adi: "Hosting Başlangıç - Aktivasyon", kullanimGunu: 365, fiyati: 250, kullaniciSayisi: 1, aktif: true },
  { id: 13, urunId: 5, urunAdi: "Başlangıç Hosting", tipi: "YENİLEME", adi: "Hosting Başlangıç - Yenileme", kullanimGunu: 365, fiyati: 200, kullaniciSayisi: 1, aktif: true },
  { id: 14, urunId: 6, urunAdi: "Profesyonel Hosting", tipi: "AKTİVASYON", adi: "Hosting Pro - Aktivasyon", kullanimGunu: 365, fiyati: 500, kullaniciSayisi: 1, aktif: true },
  { id: 15, urunId: 10, urunAdi: "Muhasebe Pro", tipi: "AKTİVASYON", adi: "Muhasebe Pro - Lisans", kullanimGunu: 365, fiyati: 3000, kullaniciSayisi: 3, aktif: true },
  { id: 16, urunId: 10, urunAdi: "Muhasebe Pro", tipi: "EK KULLANICI", adi: "Muhasebe Pro - Ek Kullanıcı", kullanimGunu: 365, fiyati: 600, kullaniciSayisi: 0, aktif: true },
  { id: 17, urunId: 13, urunAdi: "Standart SSL", tipi: "AKTİVASYON", adi: "SSL Standart - 1 Yıl", kullanimGunu: 365, fiyati: 150, kullaniciSayisi: 0, aktif: true },
  { id: 18, urunId: 15, urunAdi: "Toplu SMS 1000", tipi: "AKTİVASYON", adi: "1000 SMS Paketi", kullanimGunu: 180, fiyati: 200, kullaniciSayisi: 0, aktif: true },
];

const BASLANGIC_URUNLER = [
  { id: 1, grubu: "Alan Adı", adi: ".com.tr Alan Adı", urunTipi: "DOMAIN", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 2, grubu: "Alan Adı", adi: ".com Alan Adı", urunTipi: "DOMAIN", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 3, grubu: "Alan Adı", adi: ".net Alan Adı", urunTipi: "DOMAIN", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 4, grubu: "Alan Adı", adi: ".org Alan Adı", urunTipi: "DOMAIN", uygulamaTipi: "-", ozelProje: false, aktif: false },
  { id: 5, grubu: "Hosting", adi: "Başlangıç Hosting", urunTipi: "HOSTING", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 6, grubu: "Hosting", adi: "Profesyonel Hosting", urunTipi: "HOSTING", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 7, grubu: "Hosting", adi: "Kurumsal Hosting", urunTipi: "HOSTING", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 8, grubu: "Yazılım", adi: "CRM Yazılımı", urunTipi: "YAZILIM", uygulamaTipi: "WINDOWS", ozelProje: true, aktif: true },
  { id: 9, grubu: "Yazılım", adi: "E-Ticaret Paketi", urunTipi: "YAZILIM", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 10, grubu: "Yazılım", adi: "Muhasebe Pro", urunTipi: "YAZILIM", uygulamaTipi: "WINDOWS", ozelProje: true, aktif: true },
  { id: 11, grubu: "E-Posta", adi: "Kurumsal E-Posta 5GB", urunTipi: "E-POSTA", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 12, grubu: "E-Posta", adi: "Kurumsal E-Posta 10GB", urunTipi: "E-POSTA", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 13, grubu: "SSL", adi: "Standart SSL", urunTipi: "SSL", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 14, grubu: "SSL", adi: "Wildcard SSL", urunTipi: "SSL", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 15, grubu: "SMS", adi: "Toplu SMS 1000", urunTipi: "SMS", uygulamaTipi: "API", ozelProje: false, aktif: true },
  { id: 16, grubu: "SMS", adi: "Toplu SMS 5000", urunTipi: "SMS", uygulamaTipi: "API", ozelProje: false, aktif: false },
  { id: 17, grubu: "Sunucu", adi: "VPS Başlangıç", urunTipi: "SUNUCU", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 18, grubu: "Sunucu", adi: "VPS Profesyonel", urunTipi: "SUNUCU", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 19, grubu: "KEP", adi: "KEP Hesabı Bireysel", urunTipi: "KEP", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 20, grubu: "KEP", adi: "KEP Hesabı Kurumsal", urunTipi: "KEP", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 21, grubu: "E-Tuğra", adi: "E-İmza Başlangıç", urunTipi: "E-TUĞRA", uygulamaTipi: "WINDOWS", ozelProje: false, aktif: true },
  { id: 22, grubu: "E-Tuğra", adi: "E-İmza Profesyonel", urunTipi: "E-TUĞRA", uygulamaTipi: "WINDOWS", ozelProje: false, aktif: false },
  { id: 23, grubu: "Diğer", adi: "Bakım Anlaşması Temel", urunTipi: "BAKIM ANLAŞMASI", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 24, grubu: "Diğer", adi: "Bakım Anlaşması Pro", urunTipi: "BAKIM ANLAŞMASI", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 25, grubu: "Bulut Hizmetleri", adi: "Bulut Depolama 50GB", urunTipi: "HOSTING", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 26, grubu: "Yazılım", adi: "Stok Takip Sistemi", urunTipi: "YAZILIM", uygulamaTipi: "WEB", ozelProje: true, aktif: true },
  { id: 27, grubu: "Hosting", adi: "WordPress Hosting", urunTipi: "HOSTING", uygulamaTipi: "WEB", ozelProje: false, aktif: true },
  { id: 28, grubu: "Alan Adı", adi: ".com.tr Alan Adı (2 Yıl)", urunTipi: "DOMAIN", uygulamaTipi: "-", ozelProje: false, aktif: true },
  { id: 29, grubu: "Yazılım", adi: "Mobil Uygulama Paketi", urunTipi: "YAZILIM", uygulamaTipi: "MOBİL", ozelProje: true, aktif: false },
  { id: 30, grubu: "SSL", adi: "EV SSL Sertifikası", urunTipi: "SSL", uygulamaTipi: "-", ozelProje: false, aktif: true },
];

const BASLANGIC_URUN_GRUPLARI_VERI = [
  { id: 1, ad: "Alan Adı", aciklama: "Domain ve alan adı hizmetleri", aktif: true },
  { id: 2, ad: "Diğer", aciklama: "Diğer hizmetler ve bakım anlaşmaları", aktif: true },
  { id: 3, ad: "E-Posta", aciklama: "Kurumsal e-posta çözümleri", aktif: true },
  { id: 4, ad: "E-Tuğra", aciklama: "Elektronik imza hizmetleri", aktif: true },
  { id: 5, ad: "Hosting", aciklama: "Web barındırma hizmetleri", aktif: true },
  { id: 6, ad: "KEP", aciklama: "Kayıtlı elektronik posta", aktif: true },
  { id: 7, ad: "SMS", aciklama: "Toplu SMS hizmetleri", aktif: true },
  { id: 8, ad: "SSL", aciklama: "SSL sertifika hizmetleri", aktif: true },
  { id: 9, ad: "Sunucu", aciklama: "VPS ve sunucu hizmetleri", aktif: true },
  { id: 10, ad: "Yazılım", aciklama: "Yazılım ürünleri ve lisanslar", aktif: true },
  { id: 11, ad: "Bulut Hizmetleri", aciklama: "Bulut depolama ve servisleri", aktif: true },
];

const BASLANGIC_SURUMLER = [
  { id: 1, urunAdi: "CRM Yazılımı", surum: "3.2.1", tarih: "2025-01-15", notlar: "Performans iyileştirmeleri", aktif: true },
  { id: 2, urunAdi: "CRM Yazılımı", surum: "3.1.0", tarih: "2024-11-20", notlar: "Yeni raporlama modülü", aktif: false },
  { id: 7, urunAdi: "CRM Yazılımı", surum: "3.0.0", tarih: "2024-08-10", notlar: "Büyük güncelleme: Yeni dashboard", aktif: false },
  { id: 8, urunAdi: "CRM Yazılımı", surum: "2.9.5", tarih: "2024-06-01", notlar: "Güvenlik yamaları", aktif: false },
  { id: 9, urunAdi: "CRM Yazılımı", surum: "2.8.0", tarih: "2024-03-22", notlar: "Çoklu dil desteği", aktif: false },
  { id: 3, urunAdi: "E-Ticaret Paketi", surum: "2.5.0", tarih: "2025-02-01", notlar: "Ödeme entegrasyonu", aktif: true },
  { id: 10, urunAdi: "E-Ticaret Paketi", surum: "2.4.0", tarih: "2024-10-15", notlar: "Kargo entegrasyonu", aktif: false },
  { id: 11, urunAdi: "E-Ticaret Paketi", surum: "2.3.1", tarih: "2024-07-08", notlar: "Sepet hata düzeltmesi", aktif: false },
  { id: 12, urunAdi: "E-Ticaret Paketi", surum: "2.2.0", tarih: "2024-04-20", notlar: "Ürün varyant desteği", aktif: false },
  { id: 4, urunAdi: "Muhasebe Pro", surum: "4.0.0", tarih: "2025-01-10", notlar: "Yeni arayüz tasarımı", aktif: true },
  { id: 13, urunAdi: "Muhasebe Pro", surum: "3.5.2", tarih: "2024-09-18", notlar: "E-Fatura güncellemesi", aktif: false },
  { id: 14, urunAdi: "Muhasebe Pro", surum: "3.4.0", tarih: "2024-05-12", notlar: "KDV hesaplama düzeltmesi", aktif: false },
  { id: 5, urunAdi: "Stok Takip Sistemi", surum: "1.0.0", tarih: "2024-12-05", notlar: "İlk sürüm", aktif: true },
  { id: 6, urunAdi: "Mobil Uygulama Paketi", surum: "1.2.0", tarih: "2025-01-25", notlar: "iOS desteği", aktif: true },
  { id: 15, urunAdi: "Mobil Uygulama Paketi", surum: "1.1.0", tarih: "2024-11-10", notlar: "Bildirim sistemi", aktif: false },
  { id: 16, urunAdi: "Mobil Uygulama Paketi", surum: "1.0.0", tarih: "2024-09-01", notlar: "İlk sürüm - Android", aktif: false },
];

const BASLANGIC_KULLANICILAR = [
  { id: 1, ad: "Ercan Güzel", eposta: "ercan@guzelteknoloji.com", rol: "Admin", durum: "aktif", sonGiris: "2025-02-10 14:30" },
  { id: 2, ad: "Semihcan Güzel", eposta: "semihcan@guzelteknoloji.com", rol: "Editör", durum: "aktif", sonGiris: "2025-02-10 09:15" },
  { id: 3, ad: "Baran Ürüncan", eposta: "baran@guzelteknoloji.com", rol: "Görüntüleyici", durum: "pasif", sonGiris: "2025-01-28 16:45" },
  { id: 4, ad: "Süleyman Güzel", eposta: "suleyman@guzelteknoloji.com", rol: "Admin", durum: "aktif", sonGiris: "2025-02-09 11:20" },
  { id: 5, ad: "Aykut", eposta: "aykut@guzelteknoloji.com", rol: "Editör", durum: "aktif", sonGiris: "2025-02-10 08:50" },
];

/* ============================================= */
/*  Ana Bileşen                                   */
/* ============================================= */

export default function YonetimPage() {
  const [aktifSekme, setAktifSekme] = useState("urunler");

  return (
    <div>
      {/* ---- Sayfa Başlığı ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yönetim</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Ürün, grup, sürüm ve kullanıcı yönetimi.</p>
      </div>

      {/* ---- Sekme Navigasyonu ---- */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl p-1.5 border border-gray-200 dark:border-white/10 overflow-x-auto">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            onClick={() => setAktifSekme(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              aktifSekme === s.id
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            }`}
          >
            {s.ikon}
            {s.etiket}
          </button>
        ))}
      </div>

      {/* ---- Sekme İçeriği ---- */}
      {aktifSekme === "urunler" && <UrunlerSekmesi />}
      {aktifSekme === "urunGruplari" && <UrunGruplariSekmesi />}
      {aktifSekme === "surumler" && <SurumlerSekmesi />}
      {aktifSekme === "kullanicilar" && <KullanicilarSekmesi />}
    </div>
  );
}

/* ============================================= */
/*  Ürünler Sekmesi                               */
/* ============================================= */

function UrunlerSekmesi() {
  const [urunler, setUrunler] = useState(BASLANGIC_URUNLER);
  const [paketler, setPaketler] = useState(BASLANGIC_PAKETLER);
  const [filtreGrup, setFiltreGrup] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [modal, setModal] = useState(null); // null | "yeni" | urunObjesi (düzenleme)
  const [paketModal, setPaketModal] = useState(null); // null | urunObjesi (paketleri göster)
  const sayfaBasi = 10;

  /* ---- Filtreleme ---- */
  const filtrelenmis = urunler.filter((u) => {
    if (filtreGrup && u.grubu !== filtreGrup) return false;
    if (filtreDurum === "aktif" && !u.aktif) return false;
    if (filtreDurum === "pasif" && u.aktif) return false;
    return true;
  });

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaUrunler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const sifirla = () => { setFiltreGrup(""); setFiltreDurum(""); setSayfa(1); };

  /* ---- Ürün Kaydet (Ekle veya Güncelle) ---- */
  const urunKaydet = (veri) => {
    if (veri.id) {
      setUrunler((o) => o.map((u) => u.id === veri.id ? { ...u, ...veri } : u));
    } else {
      const yeniId = Math.max(...urunler.map((u) => u.id), 0) + 1;
      setUrunler((o) => [...o, { ...veri, id: yeniId }]);
    }
    setModal(null);
  };

  /* ---- Ürün Sil ---- */
  const urunSil = (id) => {
    setUrunler((o) => o.filter((u) => u.id !== id));
  };

  return (
    <div>
      {/* ---- Filtre Çubuğu ---- */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Grup Filtresi */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Grubu</label>
            <select value={filtreGrup} onChange={(e) => { setFiltreGrup(e.target.value); setSayfa(1); }} className={INPUT_STIL}>
              <option value="">Tümü</option>
              {URUN_GRUPLARI.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
            <select value={filtreDurum} onChange={(e) => { setFiltreDurum(e.target.value); setSayfa(1); }} className={INPUT_STIL}>
              <option value="">Tümü</option>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </div>

          {/* Butonlar */}
          <div className="flex items-center gap-2">
            <button onClick={sifirla}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              Sıfırla
            </button>
            <button onClick={() => setSayfa(1)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer">
              Filtrele
            </button>
          </div>

          {/* Yeni Ürün Butonu */}
          <div className="ml-auto">
            <button onClick={() => setModal("yeni")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Yeni Ürün
            </button>
          </div>
        </div>
      </div>

      {/* ---- Tablo ---- */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Grubu", "Adı", "Ürün Tipi", "Uygulama Tipi", "Özel Proje", "Aktif", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaUrunler.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">Ürün bulunamadı.</td></tr>
              ) : sayfaUrunler.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">{u.grubu}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">{u.adi}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{u.urunTipi}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{u.uygulamaTipi}</td>
                  <td className="px-4 py-3.5 text-center">
                    {u.ozelProje ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">EVET</span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                      {u.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* Paketler */}
                      <button onClick={() => setPaketModal(u)} title="Paketler"
                        className="w-8 h-8 rounded-lg bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </button>
                      {/* Düzenle */}
                      <button onClick={() => setModal(u)} title="Düzenle"
                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {/* Sil */}
                      <button onClick={() => urunSil(u.id)} title="Sil"
                        className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- Sayfalama ---- */}
        <div className="px-4 py-3.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {filtrelenmis.length} kayıttan <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min((sayfa - 1) * sayfaBasi + 1, filtrelenmis.length)}</span> ile <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min(sayfa * sayfaBasi, filtrelenmis.length)}</span> arasındakiler gösteriliyor
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>
                {s}
              </button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa === toplamSayfa || toplamSayfa === 0}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ---- Ürün Oluştur/Düzenle Modalı ---- */}
      {modal && <UrunModal modal={modal} kapat={() => setModal(null)} kaydet={urunKaydet} />}

      {/* ---- Paketler Modalı ---- */}
      {paketModal && <PaketlerModal urun={paketModal} kapat={() => setPaketModal(null)} paketler={paketler} setPaketler={setPaketler} tumUrunler={urunler} />}
    </div>
  );
}

/* ============================================= */
/*  Paketler Modalı (Ürünün Paketleri)           */
/* ============================================= */

function PaketlerModal({ urun, kapat, paketler, setPaketler, tumUrunler }) {
  const [arama, setArama] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [paketForm, setPaketForm] = useState(null); // null | "yeni" | paketObjesi
  const sayfaBasi = 10;
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const urunPaketleri = paketler.filter((p) => p.urunId === urun.id);
  const filtrelenmis = arama
    ? urunPaketleri.filter((p) => p.adi.toLowerCase().includes(arama.toLowerCase()) || p.tipi.toLowerCase().includes(arama.toLowerCase()))
    : urunPaketleri;

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaPaketler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const paketKaydet = (veri) => {
    if (veri.id) {
      setPaketler((o) => o.map((p) => p.id === veri.id ? { ...p, ...veri } : p));
    } else {
      const yeniId = Math.max(...paketler.map((p) => p.id), 0) + 1;
      setPaketler((o) => [...o, { ...veri, id: yeniId, urunId: urun.id, urunAdi: urun.adi }]);
    }
    setPaketForm(null);
  };

  const paketSil = (id) => {
    setPaketler((o) => o.filter((p) => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Başlık */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paketler</h3>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">{urun.adi}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPaketForm("yeni")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Yeni Paket
            </button>
            <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Kontroller */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span>{filtrelenmis.length} kayıt</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-slate-400">Ara:</span>
            <input type="text" value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48" />
          </div>
        </div>

        {/* Tablo */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Ürün Adı", "Tipi", "Adı", "Kullanım Günü", "Fiyatı", "Kullanıcı Sayısı", "Aktif", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaPaketler.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">Bu ürüne ait paket bulunamadı.</td></tr>
              ) : sayfaPaketler.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">{p.urunAdi}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400">{p.tipi}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-sm">{p.adi}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-sm text-center">{p.kullanimGunu}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-sm">{Number(p.fiyati).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-sm text-center">{p.kullaniciSayisi || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                      {p.aktif ? "E" : "H"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setPaketForm(p)} title="Düzenle"
                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => paketSil(p.id)} title="Sil"
                        className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {filtrelenmis.length} kayıttan <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min((sayfa - 1) * sayfaBasi + 1, filtrelenmis.length)}</span> ile <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min(sayfa * sayfaBasi, filtrelenmis.length)}</span> arasındakiler gösteriliyor
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa || 1 }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa || 1, s + 1))} disabled={sayfa >= (toplamSayfa || 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      </div>

      {/* Paket Oluştur/Düzenle Alt Modalı */}
      {paketForm && <PaketOlusturModal modal={paketForm} kapat={() => setPaketForm(null)} kaydet={paketKaydet} urun={urun} tumUrunler={tumUrunler} />}
    </div>
  );
}

/* ============================================= */
/*  Paket Oluştur / Düzenle Modalı               */
/* ============================================= */

function PaketOlusturModal({ modal, kapat, kaydet, urun, tumUrunler }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    urunGrubu: duzenle ? (tumUrunler.find((u) => u.id === modal.urunId)?.grubu || urun.grubu) : urun.grubu,
    urunId: duzenle ? modal.urunId : urun.id,
    tipi: duzenle ? modal.tipi : "",
    adi: duzenle ? modal.adi : "",
    kullanimGunu: duzenle ? modal.kullanimGunu : 365,
    fiyati: duzenle ? modal.fiyati : 0,
    kullaniciSayisi: duzenle ? modal.kullaniciSayisi : 0,
    aktif: duzenle ? modal.aktif : true,
  });
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const grupUrunleri = tumUrunler.filter((u) => u.grubu === form.urunGrubu);

  const guncelle = (alan, val) => setForm((o) => ({ ...o, [alan]: val }));

  const gonder = (e) => {
    e.preventDefault();
    if (!form.tipi || !form.adi) return;
    const seciliUrun = tumUrunler.find((u) => u.id === Number(form.urunId)) || urun;
    kaydet({ ...form, urunId: seciliUrun.id, urunAdi: seciliUrun.adi });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>

        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Paket Düzenle" : "Paket Oluştur"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={gonder} className="p-6 space-y-4">
          {/* Ürün Grubu */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Grubu</label>
            <select value={form.urunGrubu} onChange={(e) => { guncelle("urunGrubu", e.target.value); guncelle("urunId", ""); }} className={INPUT_STIL}>
              {URUN_GRUPLARI.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Ürün */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün</label>
            <select value={form.urunId} onChange={(e) => guncelle("urunId", Number(e.target.value))} className={INPUT_STIL}>
              {grupUrunleri.length === 0 && <option value="">Bu grupta ürün yok</option>}
              {grupUrunleri.map((u) => <option key={u.id} value={u.id}>{u.adi}</option>)}
            </select>
          </div>

          {/* Paket Tipi */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Paket Tipi <span className="text-red-500">*</span></label>
            <select value={form.tipi} onChange={(e) => guncelle("tipi", e.target.value)} className={INPUT_STIL} required>
              <option value="">SEÇİNİZ</option>
              {PAKET_TIPLERI.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Adı */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.adi} onChange={(e) => guncelle("adi", e.target.value)} className={INPUT_STIL} required />
          </div>

          {/* Kullanım Günü & Fiyatı */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Kullanım Günü</label>
              <input type="number" value={form.kullanimGunu} onChange={(e) => guncelle("kullanimGunu", Number(e.target.value))} className={INPUT_STIL} min={0} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Fiyatı</label>
              <input type="number" value={form.fiyati} onChange={(e) => guncelle("fiyati", Number(e.target.value))} className={INPUT_STIL} min={0} step="0.01" />
            </div>
          </div>

          {/* Kullanıcı Sayısı */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Kullanıcı Sayısı</label>
            <input type="number" value={form.kullaniciSayisi} onChange={(e) => guncelle("kullaniciSayisi", Number(e.target.value))} className={INPUT_STIL} min={0} />
          </div>

          {/* Durum */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.aktif} onChange={(e) => guncelle("aktif", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Aktif</span>
          </label>

          {/* Kaydet */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Ürün Oluştur / Düzenle Modalı                */
/* ============================================= */

function UrunModal({ modal, kapat, kaydet }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    grubu: duzenle ? modal.grubu : "",
    adi: duzenle ? modal.adi : "",
    urunTipi: duzenle ? modal.urunTipi : "",
    uygulamaTipi: duzenle ? modal.uygulamaTipi : "-",
    ozelProje: duzenle ? modal.ozelProje : false,
    aktif: duzenle ? modal.aktif : true,
  });
  const ref = useRef(null);

  const sallanma = () => {
    if (ref.current) {
      ref.current.classList.remove("sallan");
      void ref.current.offsetWidth;
      ref.current.classList.add("sallan");
    }
  };

  const guncelle = (alan, val) => setForm((o) => ({ ...o, [alan]: val }));

  const gonder = (e) => {
    e.preventDefault();
    if (!form.grubu || !form.adi || !form.urunTipi) return;
    kaydet(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>

        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Ürün Düzenle" : "Yeni Ürün Oluştur"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={gonder} className="p-6 space-y-4">
          {/* Ürün Grubu */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Grubu <span className="text-red-500">*</span></label>
            <select value={form.grubu} onChange={(e) => guncelle("grubu", e.target.value)} className={INPUT_STIL} required>
              <option value="">Seçiniz</option>
              {URUN_GRUPLARI.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Ürün Tipi */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Tipi <span className="text-red-500">*</span></label>
            <select value={form.urunTipi} onChange={(e) => guncelle("urunTipi", e.target.value)} className={INPUT_STIL} required>
              <option value="">Seçiniz</option>
              {URUN_TIPLERI.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Uygulama Tipi */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Uygulama Tipi</label>
            <select value={form.uygulamaTipi} onChange={(e) => guncelle("uygulamaTipi", e.target.value)} className={INPUT_STIL}>
              {UYGULAMA_TIPLERI.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Adı */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.adi} onChange={(e) => guncelle("adi", e.target.value)} placeholder="Ürün adını giriniz" className={INPUT_STIL} required />
          </div>

          {/* Özel Proje & Durum */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ozelProje} onChange={(e) => guncelle("ozelProje", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Özel Proje</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.aktif} onChange={(e) => guncelle("aktif", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Aktif</span>
            </label>
          </div>

          {/* Kaydet */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Ürün Grupları Sekmesi                         */
/* ============================================= */

function UrunGruplariSekmesi() {
  const [gruplar, setGruplar] = useState(BASLANGIC_URUN_GRUPLARI_VERI);
  const [modal, setModal] = useState(null); // null | "yeni" | grupObjesi

  const kaydet = (veri) => {
    if (veri.id) {
      setGruplar((o) => o.map((g) => g.id === veri.id ? { ...g, ...veri } : g));
    } else {
      const yeniId = Math.max(...gruplar.map((g) => g.id), 0) + 1;
      setGruplar((o) => [...o, { ...veri, id: yeniId }]);
    }
    setModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{gruplar.length} ürün grubu</p>
        <button onClick={() => setModal("yeni")}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Grup
        </button>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.03]">
              {["Grup Adı", "Açıklama", "Durum", "İşlemler"].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {gruplar.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">{g.ad}</td>
                <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{g.aciklama}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${g.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                    {g.aktif ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => setModal(g)} title="Düzenle"
                    className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <GrupModal modal={modal} kapat={() => setModal(null)} kaydet={kaydet} />}
    </div>
  );
}

function GrupModal({ modal, kapat, kaydet }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    ad: duzenle ? modal.ad : "",
    aciklama: duzenle ? modal.aciklama : "",
    aktif: duzenle ? modal.aktif : true,
  });
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const gonder = (e) => {
    e.preventDefault();
    if (!form.ad) return;
    kaydet(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Grup Düzenle" : "Yeni Ürün Grubu"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Grup Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.ad} onChange={(e) => setForm((o) => ({ ...o, ad: e.target.value }))} placeholder="Grup adını giriniz" className={INPUT_STIL} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Açıklama</label>
            <input type="text" value={form.aciklama} onChange={(e) => setForm((o) => ({ ...o, aciklama: e.target.value }))} placeholder="Kısa açıklama" className={INPUT_STIL} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.aktif} onChange={(e) => setForm((o) => ({ ...o, aktif: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Aktif</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Sürümler Sekmesi                              */
/* ============================================= */

function SurumlerSekmesi() {
  const [surumler, setSurumler] = useState(BASLANGIC_SURUMLER);
  const [modal, setModal] = useState(null);
  const [acikGruplar, setAcikGruplar] = useState({});

  const kaydet = (veri) => {
    if (veri.id) {
      setSurumler((o) => o.map((s) => s.id === veri.id ? { ...s, ...veri } : s));
    } else {
      const yeniId = Math.max(...surumler.map((s) => s.id), 0) + 1;
      setSurumler((o) => [
        ...o.map((s) => s.urunAdi === veri.urunAdi && s.aktif ? { ...s, aktif: false } : s),
        { ...veri, id: yeniId, aktif: true },
      ]);
    }
    setModal(null);
  };

  /* ---- Ürün adına göre grupla, her grupta tarihe göre sırala (en yeni ilk) ---- */
  const gruplar = {};
  surumler.forEach((s) => {
    if (!gruplar[s.urunAdi]) gruplar[s.urunAdi] = [];
    gruplar[s.urunAdi].push(s);
  });
  Object.values(gruplar).forEach((liste) => liste.sort((a, b) => b.tarih.localeCompare(a.tarih)));

  const grupToggle = (urunAdi) => {
    setAcikGruplar((o) => ({ ...o, [urunAdi]: !o[urunAdi] }));
  };

  const benzersizUrunSayisi = Object.keys(gruplar).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{benzersizUrunSayisi} ürün, {surumler.length} sürüm kaydı</p>
        <button onClick={() => setModal("yeni")}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Sürüm
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(gruplar).map(([urunAdi, urunSurumleri]) => {
          const guncel = urunSurumleri[0];
          const eskiler = urunSurumleri.slice(1);
          const acik = acikGruplar[urunAdi];

          return (
            <div key={urunAdi} className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden transition-all">
              {/* Ana Satır - Güncel Sürüm */}
              <div
                onClick={() => eskiler.length > 0 && grupToggle(urunAdi)}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  eskiler.length > 0 ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]" : ""
                } ${acik ? "bg-gray-50/50 dark:bg-white/[0.02]" : ""}`}
              >
                {/* Açılır/Kapanır İkon */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {eskiler.length > 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${acik ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600" />
                  )}
                </div>

                {/* Ürün Bilgileri */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{urunAdi}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      v{guncel.surum}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      Güncel
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 dark:text-slate-500">{guncel.tarih}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{guncel.notlar}</span>
                  </div>
                </div>

                {/* Sürüm Sayısı Rozeti */}
                {eskiler.length > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    {eskiler.length} eski sürüm
                  </span>
                )}

                {/* Düzenle Butonu */}
                <button onClick={(e) => { e.stopPropagation(); setModal(guncel); }} title="Düzenle"
                  className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              </div>

              {/* Eski Sürümler - Accordion İçeriği */}
              {acik && eskiler.length > 0 && (
                <div className="border-t border-gray-200 dark:border-white/10">
                  <div className="px-5 py-2 bg-gray-50 dark:bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Geçmiş Sürümler</p>
                  </div>
                  {eskiler.map((s, i) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 px-5 py-3 ml-6 border-l-2 border-gray-200 dark:border-white/10 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${
                        i < eskiler.length - 1 ? "border-b border-b-gray-100 dark:border-b-white/5" : ""
                      }`}
                    >
                      {/* Timeline Noktası */}
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 -ml-[19px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-slate-600 ring-2 ring-white dark:ring-slate-900" />
                      </div>

                      {/* Sürüm Bilgileri */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400">
                            v{s.surum}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">{s.tarih}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">{s.notlar}</p>
                      </div>

                      {/* Düzenle */}
                      <button onClick={() => setModal(s)} title="Düzenle"
                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-blue-500 hover:text-white text-gray-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && <SurumModal modal={modal} kapat={() => setModal(null)} kaydet={kaydet} surumler={surumler} />}
    </div>
  );
}

function SurumModal({ modal, kapat, kaydet, surumler }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    urunAdi: duzenle ? modal.urunAdi : "",
    surum: duzenle ? modal.surum : "",
    tarih: duzenle ? modal.tarih : new Date().toISOString().slice(0, 10),
    notlar: duzenle ? modal.notlar : "",
    aktif: duzenle ? modal.aktif : true,
  });
  const [oneriAcik, setOneriAcik] = useState(false);
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  // Benzersiz ürün adları (öneri listesi)
  const benzersizUrunler = [...new Set(surumler.map((s) => s.urunAdi))];
  const filtreliOneriler = form.urunAdi
    ? benzersizUrunler.filter((u) => u.toLowerCase().includes(form.urunAdi.toLowerCase()) && u !== form.urunAdi)
    : benzersizUrunler;

  const urunSec = (urunAdi) => {
    // Seçilen ürünün en son sürümünü bul ve bilgileri otomatik doldur
    const urunSurumleri = surumler.filter((s) => s.urunAdi === urunAdi).sort((a, b) => b.id - a.id);
    const sonSurum = urunSurumleri[0];
    setForm((o) => ({
      ...o,
      urunAdi,
      surum: sonSurum ? sonSurum.surum : "",
      notlar: "",
    }));
    setOneriAcik(false);
  };

  const gonder = (e) => {
    e.preventDefault();
    if (!form.urunAdi || !form.surum) return;
    kaydet(form);
  };

  // Seçilen ürünün mevcut sürümleri (bilgi olarak)
  const mevcutSurumler = surumler.filter((s) => s.urunAdi === form.urunAdi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Sürüm Düzenle" : "Yeni Sürüm"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4">
          {/* Ürün Adı - otomatik doldurma */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.urunAdi}
              onChange={(e) => { setForm((o) => ({ ...o, urunAdi: e.target.value })); setOneriAcik(true); }}
              onFocus={() => setOneriAcik(true)}
              onBlur={() => setTimeout(() => setOneriAcik(false), 200)}
              placeholder="Ürün adını yazın veya seçin"
              className={INPUT_STIL} required autoComplete="off" />
            {oneriAcik && filtreliOneriler.length > 0 && !duzenle && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl max-h-40 overflow-auto">
                {filtreliOneriler.map((u) => (
                  <button type="button" key={u} onMouseDown={() => urunSec(u)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer transition-colors">
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mevcut sürümler bilgisi */}
          {!duzenle && mevcutSurumler.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">Mevcut Sürümler:</p>
              <div className="flex flex-wrap gap-1.5">
                {mevcutSurumler.map((s) => (
                  <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full font-mono ${s.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"}`}>
                    v{s.surum} {s.aktif ? "(Güncel)" : "(Eski)"}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60 mt-1.5">Yeni sürüm eklediğinizde mevcut güncel sürüm otomatik olarak "Eski" yapılır.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Sürüm No <span className="text-red-500">*</span></label>
              <input type="text" value={form.surum} onChange={(e) => setForm((o) => ({ ...o, surum: e.target.value }))} placeholder="1.0.0" className={INPUT_STIL} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tarih</label>
              <input type="date" value={form.tarih} onChange={(e) => setForm((o) => ({ ...o, tarih: e.target.value }))} className={INPUT_STIL} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Notlar</label>
            <input type="text" value={form.notlar} onChange={(e) => setForm((o) => ({ ...o, notlar: e.target.value }))} placeholder="Sürüm notları" className={INPUT_STIL} />
          </div>
          {duzenle && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.aktif} onChange={(e) => setForm((o) => ({ ...o, aktif: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Güncel Sürüm</span>
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Kullanıcılar Sekmesi                          */
/* ============================================= */

function KullanicilarSekmesi() {
  const [kullanicilar, setKullanicilar] = useState(BASLANGIC_KULLANICILAR);
  const [modal, setModal] = useState(null);
  const [bildirim, setBildirim] = useState(null);

  const kaydet = (veri) => {
    const yeniKayit = !veri.id;
    if (veri.id) {
      setKullanicilar((o) => o.map((k) => k.id === veri.id ? { ...k, ...veri } : k));
    } else {
      const yeniId = Math.max(...kullanicilar.map((k) => k.id), 0) + 1;
      setKullanicilar((o) => [...o, { ...veri, id: yeniId }]);
    }
    setModal(null);
    if (yeniKayit && veri.eposta) {
      setBildirim(`${veri.eposta} adresine davet e-postası gönderildi.`);
      setTimeout(() => setBildirim(null), 4000);
    }
  };

  const sil = (id) => {
    setKullanicilar((o) => o.filter((k) => k.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{kullanicilar.length} kullanıcı</p>
        <button onClick={() => setModal("yeni")}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Kullanıcı
        </button>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.03]">
              {["Ad Soyad", "E-Posta", "Rol", "Durum", "Son Giriş", "İşlemler"].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {kullanicilar.map((k) => (
              <tr key={k.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{k.ad.split(" ").map((x) => x[0]).join("")}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{k.ad}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm"><span className="inline-flex items-center group">{k.eposta}<KopyalaButonu metin={k.eposta} /></span></td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    k.rol === "Admin" ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"
                    : k.rol === "Editör" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400"
                  }`}>{k.rol}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${k.durum === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                    {k.durum === "aktif" ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{k.sonGiris}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setModal(k)} title="Düzenle"
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => sil(k.id)} title="Sil"
                      className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* E-posta bildirim toast */}
      {bildirim && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 animate-[slideInRight_0.3s_ease-out]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <span className="text-sm font-medium">{bildirim}</span>
        </div>
      )}

      {modal && <KullaniciModal modal={modal} kapat={() => setModal(null)} kaydet={kaydet} />}
    </div>
  );
}

function KullaniciModal({ modal, kapat, kaydet }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    ad: duzenle ? modal.ad : "",
    eposta: duzenle ? modal.eposta : "",
    rol: duzenle ? modal.rol : "Görüntüleyici",
    durum: duzenle ? modal.durum : "aktif",
    sonGiris: duzenle ? modal.sonGiris : "-",
  });
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const gonder = (e) => {
    e.preventDefault();
    if (!form.ad || !form.eposta) return;
    kaydet(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Soyad <span className="text-red-500">*</span></label>
            <input type="text" value={form.ad} onChange={(e) => setForm((o) => ({ ...o, ad: e.target.value }))} className={INPUT_STIL} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">E-Posta <span className="text-red-500">*</span></label>
            <input type="email" value={form.eposta} onChange={(e) => setForm((o) => ({ ...o, eposta: e.target.value }))} className={INPUT_STIL} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Rol</label>
            <select value={form.rol} onChange={(e) => setForm((o) => ({ ...o, rol: e.target.value }))} className={INPUT_STIL}>
              <option value="Admin">Admin</option>
              <option value="Editör">Editör</option>
              <option value="Görüntüleyici">Görüntüleyici</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
            <select value={form.durum} onChange={(e) => setForm((o) => ({ ...o, durum: e.target.value }))} className={INPUT_STIL}>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
