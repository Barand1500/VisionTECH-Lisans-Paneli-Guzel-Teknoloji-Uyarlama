/* ============================================= */
/*  Güzel Teknoloji - Ürün Şablonları Sekmesi    */
/*  Template Designer: Şablon oluştur/düzenle     */
/* ============================================= */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../yardimcilar/api";
import SilmeOnayModal from "../bilesenler/SilmeOnayModal";

/* ============================================= */
/*  Stil Sabitleri                                */
/* ============================================= */

const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

/* ============================================= */
/*  Özellik Tipleri Tanımları                    */
/* ============================================= */

/* ============================================= */
/*  MANTIK AÇIKLAMASI:                           */
/*  - temel_fiyat: Şablon oluşturulduğunda       */
/*    otomatik eklenir. Sabit ürün fiyatı.       */
/*  - kademeli_fiyat: Adet veya Kapasite bazlı   */
/*    kademe fiyatlandırma (birleşik widget)     */
/*  - hediye_urun: Mevcut ürünlerden arama ile   */
/*    seçim + çoklu hediye verilebilir           */
/*  - paket_indirimi: Birlikte alınacak ürünler  */
/*    arama ile seçilir, indirim uygulanır       */
/*  - periyot_indirim: Aylık/Yıllık seçim ile    */
/*    farklı indirim oranları tanımlanır         */
/*  - gecis_fiyati: Kaynak ürün (sabit info) +   */
/*    Hedef ürün arama ile seçilir               */
/*  - kullanici_sayisi: Min/max kullanıcı ve     */
/*    ek kullanıcı fiyatı (paket verirken        */
/*    kullanıcı eklenirse bu fiyat eklenir)      */
/*  - sicil_domain: Zorunlu ise paket eklerken   */
/*    bu alan mutlaka doldurulmalı               */
/*  - siparis_miktari: Bu üründen min/max kaç    */
/*    adet alınabilir kontrolü                   */
/*  - kampanya: Koşul builder ile if-else tarzı  */
/*    mantıksal kampanya kuralları               */
/*  - bagimli_urun: Bu ürün verilirken bağımlı   */
/*    ürünler de olmalı uyarısı verir            */
/* ============================================= */

export const OZELLIK_TIPLERI = [
  {
    id: "temel_fiyat",
    ad: "Temel Fiyat",
    ikon: "₺",
    renk: "emerald",
    aciklama: "Sabit ürün fiyatı (otomatik eklenir)",
    varsayilan: { fiyat: 0, para_birimi: "TL" },
    otomatik: true, // Şablon oluşturulduğunda otomatik eklenir
  },
  {
    id: "aktivasyon_yenileme",
    ad: "Aktivasyon / Yenileme",
    ikon: "🔄",
    renk: "blue",
    aciklama: "İlk alım ve yenileme için ayrı fiyat",
    varsayilan: { aktivasyon_fiyat: 0, yenileme_fiyat: 0, para_birimi: "TL" },
  },
  {
    id: "kademeli_fiyat",
    ad: "Kademeli Fiyat (Adet-Kapasite)",
    ikon: "📊",
    renk: "violet",
    aciklama: "Adet veya kapasite bazlı kademe fiyatı",
    varsayilan: { tip: "adet", kademeler: [{ deger: "", fiyat: 0 }], birim: "Adet" },
    // Mantık: Paket verilirken kademeye göre fiyat hesaplanır
  },
  {
    id: "hediye_urun",
    ad: "Hediye Ürün",
    ikon: "🎁",
    renk: "pink",
    aciklama: "Ürün arama ile hediye seçimi (çoklu)",
    varsayilan: { urunler: [], miktar: 1 },
    // Mantık: Bu ürün alındığında seçilen ürünler hediye verilir
  },
  {
    id: "paket_indirimi",
    ad: "Paket İndirimi",
    ikon: "📦",
    renk: "amber",
    aciklama: "Birlikte alınan ürünlerde indirim",
    varsayilan: { urunler: [], indirim_orani: 0 },
    // Mantık: Seçilen ürünlerle birlikte alınırsa indirim uygulanır
  },
  {
    id: "periyot_indirim",
    ad: "Aylık / Yıllık İndirim",
    ikon: "📅",
    renk: "teal",
    aciklama: "Periyoda göre farklı indirim oranları",
    varsayilan: { aylik_oran: 0, yillik_oran: 0 },
    // Mantık: Müşteri aylık/yıllık seçimine göre indirim uygulanır
  },
  {
    id: "gecis_fiyati",
    ad: "Geçiş Fiyatı",
    ikon: "🔀",
    renk: "orange",
    aciklama: "Başka üründen geçiş yapana özel fiyat",
    varsayilan: { hedef_urunler: [], fiyat: 0 },
    // Mantık: Seçilen ürünlerden geçiş yapanlara özel fiyat
  },
  {
    id: "kullanici_sayisi",
    ad: "Kullanıcı Sayısı",
    ikon: "👥",
    renk: "indigo",
    aciklama: "Min/max kullanıcı ve ek kullanıcı ücreti",
    varsayilan: { min: 1, max: null, ek_kullanici_fiyat: 0 },
    // Mantık: Ek kullanıcı eklenirse bu fiyat kadar artış olur
  },
  {
    id: "sicil_domain",
    ad: "Sicil No / Domain",
    ikon: "🌐",
    renk: "sky",
    aciklama: "Lisansa bağlı sicil no veya domain",
    varsayilan: { alan_tipi: "sicil_no", zorunlu: false },
    // Mantık: Zorunlu ise paket eklerken bu alan boş bırakılamaz
  },
  {
    id: "domain_fiyat",
    ad: "Domain Uzantı Fiyatlandırma",
    ikon: "🌍",
    renk: "cyan",
    aciklama: "Her domain uzantısı için farklı fiyat",
    varsayilan: { uzantilar: [{ uzanti: ".com", aktivasyon: 0, yenileme: 0 }], para_birimi: "TL" },
  },
  {
    id: "siparis_miktari",
    ad: "Sipariş Miktarı (Min-Max)",
    ikon: "📋",
    renk: "yellow",
    aciklama: "Üründen alınabilecek min/max adet",
    varsayilan: { min_adet: 1, max_adet: null },
    // Mantık: Paket verilirken bu sınırlar kontrol edilir
  },
  {
    id: "kampanya",
    ad: "Kampanya / Promosyon",
    ikon: "🏷️",
    renk: "rose",
    aciklama: "Koşullu kampanya tanımı",
    varsayilan: { ad: "", kosullar: [], indirim_orani: 0, bitis_tarihi: "" },
    // Mantık: Koşullar sağlanırsa kampanya indirimi uygulanır
  },
  {
    id: "demo_suresi",
    ad: "Demo Süresi",
    ikon: "🧪",
    renk: "purple",
    aciklama: "Ücretsiz deneme süresi",
    varsayilan: { gun: 30 },
  },
  {
    id: "otomatik_yenileme",
    ad: "Otomatik Yenileme",
    ikon: "🔁",
    renk: "green",
    aciklama: "Otomatik yenileme kuralı",
    varsayilan: { aktif: false, bildirim_gun: 30, aciklama: "" },
  },
  {
    id: "bagimli_urun",
    ad: "Bağımlı Ürün",
    ikon: "🔗",
    renk: "red",
    aciklama: "Bu ürün için gerekli diğer ürünler",
    varsayilan: { urunler: [], zorunlu: true },
    // Mantık: Bu ürün verilirken bağımlı ürünler yoksa uyarı verilir
  },
  {
    id: "urun_yonetimi",
    ad: "Ürün Yönetimi",
    ikon: "📦",
    renk: "fuchsia",
    aciklama: "Ürün/paket transfer, durdurma, askıya alma ve ücretlendirme ayarları",
    varsayilan: {
      transfer_edilebilir: true,
      transfer_ucreti: 0,
      transfer_ucreti_birimi: "TL",
      durdurulabilir: true,
      durdurma_suresi_gun: 90,
      askiya_alinabilir: true,
      askiya_alma_suresi_gun: 30,
      iptal_edilebilir: true,
      iptal_iade_orani: 0,
      devir_edilebilir: false,
      not: "",
    },
  },
  {
    id: "garanti_suresi",
    ad: "Garanti Süresi",
    ikon: "🛡️",
    renk: "slate",
    aciklama: "Ürünün garanti süresi — her ürün için varsayılan 2 yıl, şablonla değiştirilebilir",
    varsayilan: {
      sure_ay: 24,
      kapsam: "standart",
      uzatilabilir: true,
      uzatma_ucreti: 0,
      uzatma_ucreti_birimi: "TL",
      uzatma_suresi_ay: 12,
      garanti_notu: "",
    },
  },
  {
    id: "guvenlik",
    ad: "Güvenlik Ayarları",
    ikon: "🔒",
    renk: "lime",
    aciklama: "MAC/IP kontrolü, cihaz limiti ve lisans güvenlik politikaları",
    varsayilan: {
      mac_kontrolu: false,
      ip_kisitlama: false,
      max_cihaz: 1,
      cihaz_degisim_hakki: 2,
      cihaz_degisim_periyot: "yillik",
      online_dogrulama: false,
      dogrulama_periyot_gun: 30,
    },
  },
];

/* ============================================= */
/*  Renk Yardımcıları                            */
/* ============================================= */

const renkler = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20", ring: "ring-emerald-500" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/20", ring: "ring-blue-500" },
  violet: { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-500/20", ring: "ring-violet-500" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-500/20", ring: "ring-cyan-500" },
  pink: { bg: "bg-pink-50 dark:bg-pink-500/10", text: "text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-500/20", ring: "ring-pink-500" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20", ring: "ring-amber-500" },
  teal: { bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-200 dark:border-teal-500/20", ring: "ring-teal-500" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/20", ring: "ring-orange-500" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-500/20", ring: "ring-indigo-500" },
  sky: { bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", border: "border-sky-200 dark:border-sky-500/20", ring: "ring-sky-500" },
  slate: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-500/20", ring: "ring-slate-500" },
  lime: { bg: "bg-lime-50 dark:bg-lime-500/10", text: "text-lime-600 dark:text-lime-400", border: "border-lime-200 dark:border-lime-500/20", ring: "ring-lime-500" },
  rose: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-500/20", ring: "ring-rose-500" },
  fuchsia: { bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10", text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-200 dark:border-fuchsia-500/20", ring: "ring-fuchsia-500" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-500/20", ring: "ring-yellow-500" },
  gray: { bg: "bg-gray-50 dark:bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-500/20", ring: "ring-gray-500" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-500/20", ring: "ring-purple-500" },
  green: { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-500/20", ring: "ring-green-500" },
  red: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-500/20", ring: "ring-red-500" },
  neutral: { bg: "bg-neutral-50 dark:bg-neutral-500/10", text: "text-neutral-600 dark:text-neutral-400", border: "border-neutral-200 dark:border-neutral-500/20", ring: "ring-neutral-500" },
};

const getRenk = (r) => renkler[r] || renkler.gray;

/* ============================================= */
/*  Ana Bileşen: Şablonlar Sekmesi              */
/* ============================================= */

export default function UrunSablonlariSekmesi() {
  const [sablonlar, setSablonlar] = useState([]);
  const [tasarimModu, setTasarimModu] = useState(null); // null | "yeni" | sablonId
  const [silinecek, setSilinecek] = useState(null);
  const [silmeYukleniyor, setSilmeYukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await apiGet("/sablonlar");
      setSablonlar(res.veri || []);
    } catch (e) {
      console.error("Sablonlar yuklenemedi:", e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const sablonSil = async () => {
    if (!silinecek) return;
    setSilmeYukleniyor(true);
    try {
      await apiDelete(`/sablonlar/${silinecek.id}`);
      await yukle();
      setSilinecek(null);
    } catch (e) {
      console.error("Sablon silme hatasi:", e);
      alert(e.message || "Sablon silinemedi.");
    } finally {
      setSilmeYukleniyor(false);
    }
  };

  const sablonKlonla = async (id) => {
    try {
      await apiPost(`/sablonlar/${id}/klonla`, {});
      await yukle();
    } catch (e) {
      console.error("Sablon klonlama hata:", e);
    }
  };

  /* Tasarım moduna gir */
  if (tasarimModu !== null) {
    return (
      <SablonTasarimci
        sablonId={tasarimModu === "yeni" ? null : tasarimModu}
        kapat={() => { setTasarimModu(null); yukle(); }}
      />
    );
  }

  return (
    <div>
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Toplam Şablon</p>
          <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{sablonlar.length}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Aktif</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{sablonlar.filter(s => s.aktif).length}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Kullanılan</p>
          <p className="text-2xl font-bold mt-1 text-violet-600 dark:text-violet-400">{sablonlar.filter(s => s._count?.urunler > 0).length}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Toplam Özellik</p>
          <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{sablonlar.reduce((t, s) => t + (s.ozellikler?.length || 0), 0)}</p>
        </div>
      </div>

      {/* Başlık + Buton */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{sablonlar.length} şablon kayıtlı</p>
        <button
          onClick={() => setTasarimModu("yeni")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Şablon Tasarla
        </button>
      </div>

      {/* Grid Kartlar */}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : sablonlar.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Henüz şablon yok</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">İlk ürün şablonunuzu oluşturun ve ürünleri hızlıca tanımlayın.</p>
          <button
            onClick={() => setTasarimModu("yeni")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            İlk Şablonu Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sablonlar.map((s) => (
            <div key={s.id} className="group rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/5">
              {/* Kart Başlık */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{s.ad}</h3>
                    {s.aciklama && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{s.aciklama}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setTasarimModu(s.id)} title="Düzenle"
                      className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => sablonKlonla(s.id)} title="Klonla"
                      className="w-7 h-7 rounded-lg bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center cursor-pointer transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button onClick={() => setSilinecek(s)} title="Sil"
                      className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Etiketler */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {s.grup && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">{s.grup.ad}</span>
                  )}
                  {s.urunTipi && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium">{s.urunTipi.ad}</span>
                  )}
                  {s.uygulamaTipi && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-medium">{s.uygulamaTipi.ad}</span>
                  )}
                </div>
              </div>

              {/* Özellik Listesi */}
              <div className="px-5 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {(s.ozellikler || []).slice(0, 6).map((oz) => {
                    const tip = OZELLIK_TIPLERI.find((t) => t.id === oz.ozellik_tipi);
                    const r = getRenk(tip?.renk || "gray");
                    return (
                      <span key={oz.id} className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg ${r.bg} ${r.text} font-medium`}>
                        <span>{tip?.ikon || "•"}</span>
                        {oz.baslik || tip?.ad || oz.ozellik_tipi}
                      </span>
                    );
                  })}
                  {(s.ozellikler?.length || 0) > 6 && (
                    <span className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 font-medium">
                      +{s.ozellikler.length - 6}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 dark:text-slate-500">
                  {s._count?.urunler || 0} ürün kullanıyor
                </span>
                <span className="text-[11px] text-gray-400 dark:text-slate-500">
                  {s.ozellikler?.length || 0} özellik
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <SilmeOnayModal
        acik={!!silinecek}
        kapat={() => setSilinecek(null)}
        onay={sablonSil}
        baslik="Şablonu silmek istediğinizden emin misiniz?"
        mesaj={silinecek ? `"${silinecek.ad}" şablonu kalıcı olarak silinecek.` : ""}
        yukleniyor={silmeYukleniyor}
      />
    </div>
  );
}

/* ============================================= */
/*  Şablon Tasarımcı (Full-screen builder)       */
/* ============================================= */

function SablonTasarimci({ sablonId, kapat }) {
  const [form, setForm] = useState({
    ad: "",
    aciklama: "",
    grup_id: null,
    urun_tipi_id: null,
    uygulama_tipi_id: null,
    kdv_aktif: false,
    kdv_oran: 20,
  });
  const [ozellikler, setOzellikler] = useState([]);
  const [urunGruplari, setUrunGruplari] = useState([]);
  const [urunTipleri, setUrunTipleri] = useState([]);
  const [uygulamaTipleri, setUygulamaTipleri] = useState([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [solPanelAcik, setSolPanelAcik] = useState(true);
  const [aramaMetni, setAramaMetni] = useState("");
  const sayac = useRef(0);

  /* Yeni şablon oluşturulurken Temel Fiyat otomatik ekle */
  useEffect(() => {
    if (!sablonId && ozellikler.length === 0) {
      const temelFiyatTip = OZELLIK_TIPLERI.find(t => t.id === "temel_fiyat");
      if (temelFiyatTip) {
        setOzellikler([{
          _key: ++sayac.current,
          ozellik_tipi: "temel_fiyat",
          baslik: "",
          deger: JSON.parse(JSON.stringify(temelFiyatTip.varsayilan)),
          sira: 0,
        }]);
      }
    }
  }, [sablonId]);

  /* Tip verilerini yukle */
  useEffect(() => {
    const yukle = async () => {
      try {
        const [gRes, tRes, utRes] = await Promise.all([
          apiGet("/urunler/gruplar"),
          apiGet("/urunler/tipler"),
          apiGet("/urunler/uygulama-tipler"),
        ]);
        setUrunGruplari(gRes.veri || []);
        setUrunTipleri(tRes.veri || []);
        setUygulamaTipleri(utRes.veri || []);
      } catch (e) {
        console.error("Tip verileri yuklenemedi:", e);
      }
    };
    yukle();
  }, []);

  /* Mevcut sablon yukleme */
  useEffect(() => {
    if (!sablonId) return;
    const yukle = async () => {
      try {
        const res = await apiGet(`/sablonlar/${sablonId}`);
        const s = res.veri;
        setForm({
          ad: s.ad || "",
          aciklama: s.aciklama || "",
          grup_id: s.grup_id,
          urun_tipi_id: s.urun_tipi_id,
          uygulama_tipi_id: s.uygulama_tipi_id,
          kdv_aktif: s.kdv_aktif || false,
          kdv_oran: s.kdv_oran ?? 20,
        });
        setOzellikler(
          (s.ozellikler || []).map((oz, i) => ({
            _key: ++sayac.current,
            ozellik_tipi: oz.ozellik_tipi,
            baslik: oz.baslik || "",
            deger: oz.deger || {},
            sira: oz.sira ?? i,
          }))
        );
      } catch (e) {
        console.error("Sablon yuklenemedi:", e);
      }
    };
    yukle();
  }, [sablonId]);

  /* Özellik ekle */
  const ozellikEkle = (tipId) => {
    const tip = OZELLIK_TIPLERI.find((t) => t.id === tipId);
    if (!tip) return;
    setOzellikler((prev) => [
      ...prev,
      {
        _key: ++sayac.current,
        ozellik_tipi: tipId,
        baslik: "",
        deger: JSON.parse(JSON.stringify(tip.varsayilan)),
        sira: prev.length,
      },
    ]);
  };

  /* Özellik sil - temel_fiyat silinemez */
  const ozellikSil = (key) => {
    const silinecek = ozellikler.find((o) => o._key === key);
    if (silinecek?.ozellik_tipi === "temel_fiyat") {
      // Temel fiyat zorunlu, silinemez
      return;
    }
    setOzellikler((prev) => prev.filter((o) => o._key !== key));
  };

  /* Özellik güncelle */
  const ozellikGuncelle = (key, alan, val) => {
    setOzellikler((prev) =>
      prev.map((o) => (o._key === key ? { ...o, [alan]: val } : o))
    );
  };

  /* Özellik değer güncelle (deger nesnesinin içi) */
  const degerGuncelle = (key, alan, val) => {
    setOzellikler((prev) =>
      prev.map((o) =>
        o._key === key ? { ...o, deger: { ...o.deger, [alan]: val } } : o
      )
    );
  };

  /* Sıralama yukarı/aşağı */
  const siraDegistir = (key, yon) => {
    setOzellikler((prev) => {
      const idx = prev.findIndex((o) => o._key === key);
      if (idx < 0) return prev;
      const hedef = idx + yon;
      if (hedef < 0 || hedef >= prev.length) return prev;
      const yeni = [...prev];
      [yeni[idx], yeni[hedef]] = [yeni[hedef], yeni[idx]];
      return yeni.map((o, i) => ({ ...o, sira: i }));
    });
  };

  /* Kaydet */
  const kaydet = async () => {
    if (!form.ad.trim()) {
      alert("Şablon adı zorunludur.");
      return;
    }
    setKaydediliyor(true);
    try {
      const veri = {
        ...form,
        ozellikler: ozellikler.map((o, i) => ({
          ozellik_tipi: o.ozellik_tipi,
          baslik: o.baslik || null,
          deger: o.deger,
          sira: i,
        })),
      };

      if (sablonId) {
        await apiPut(`/sablonlar/${sablonId}`, veri);
      } else {
        await apiPost("/sablonlar", veri);
      }
      kapat();
    } catch (e) {
      console.error("Sablon kaydetme hatasi:", e);
      alert("Şablon kaydedilemedi.");
    } finally {
      setKaydediliyor(false);
    }
  };

  /* Filtrelenmis tipler */
  const filtreliTipler = useMemo(() => {
    if (!aramaMetni) return OZELLIK_TIPLERI;
    const q = aramaMetni.toLowerCase();
    return OZELLIK_TIPLERI.filter(
      (t) => t.ad.toLowerCase().includes(q) || t.aciklama.toLowerCase().includes(q)
    );
  }, [aramaMetni]);

  /* Filtrelenmiş urun tipleri (gruba göre) */
  const filtreliUrunTipleri = useMemo(() => {
    if (!form.grup_id) return urunTipleri;
    return urunTipleri.filter((t) => t.grup_id === form.grup_id);
  }, [urunTipleri, form.grup_id]);

  /* Filtrelenmiş uygulama tipleri (ürün tipine göre) */
  const filtreliUygulamaTipleri = useMemo(() => {
    if (!form.urun_tipi_id) return uygulamaTipleri;
    return uygulamaTipleri.filter((t) => t.urun_tipi_id === form.urun_tipi_id);
  }, [uygulamaTipleri, form.urun_tipi_id]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] -mx-6 -mt-2">
      {/* Üst Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-white/5 border-b border-gray-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={kapat} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {sablonId ? "Şablon Düzenle" : "Yeni Şablon Tasarla"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Soldan özellik ekle, ortada düzenle
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-slate-500 mr-2">
            {ozellikler.length} özellik
          </span>
          <button
            onClick={kapat}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            İptal
          </button>
          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-50 cursor-pointer transition-all inline-flex items-center gap-2"
          >
            {kaydediliyor ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {sablonId ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Ana İçerik: Sol Panel + Orta */}
      <div className="flex flex-1 overflow-hidden">
        {/* ====== SOL PANEL: Özellik Ekle ====== */}
        <div className={`shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] transition-all duration-300 flex flex-col ${solPanelAcik ? "w-72" : "w-12"}`}>
          {/* Sol Panel Başlık */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-white/5 shrink-0">
            {solPanelAcik && (
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Özellik Ekle</span>
            )}
            <button
              onClick={() => setSolPanelAcik(!solPanelAcik)}
              className="w-7 h-7 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-500 transition-transform ${solPanelAcik ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {solPanelAcik && (
            <>
              {/* Arama */}
              <div className="px-3 py-2 shrink-0">
                <input
                  type="text"
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  placeholder="Özellik ara..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Özellik Listesi */}
              <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
                {filtreliTipler.map((tip) => {
                  const r = getRenk(tip.renk);
                  return (
                    <button
                      key={tip.id}
                      onClick={() => ozellikEkle(tip.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border ${r.border} ${r.bg} hover:shadow-sm`}
                    >
                      <span className="text-lg shrink-0">{tip.ikon}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${r.text}`}>{tip.ad}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{tip.aciklama}</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 shrink-0 ${r.text} opacity-50`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ====== ORTA: Şablon Alanı ====== */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Şablon Bilgileri */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 mb-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Şablon Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Şablon Adı <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.ad}
                  onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
                  placeholder="Örn: E-Fatura Aktivasyon Şablonu"
                  className={INPUT_STIL}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Açıklama</label>
                <textarea
                  value={form.aciklama}
                  onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))}
                  placeholder="Şablon hakkında kısa açıklama..."
                  rows={2}
                  className={INPUT_STIL + " resize-none"}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Grubu</label>
                <select
                  value={form.grup_id || ""}
                  onChange={(e) => setForm((f) => ({ ...f, grup_id: e.target.value ? Number(e.target.value) : null, urun_tipi_id: null, uygulama_tipi_id: null }))}
                  className={INPUT_STIL}
                >
                  <option value="">Tümü</option>
                  {urunGruplari.map((g) => <option key={g.id} value={g.id}>{g.ad}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Tipi</label>
                <select
                  value={form.urun_tipi_id || ""}
                  onChange={(e) => setForm((f) => ({ ...f, urun_tipi_id: e.target.value ? Number(e.target.value) : null, uygulama_tipi_id: null }))}
                  className={INPUT_STIL}
                >
                  <option value="">Tümü</option>
                  {filtreliUrunTipleri.map((t) => <option key={t.id} value={t.id}>{t.ad}</option>)}
                </select>
              </div>
              {filtreliUygulamaTipleri.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Uygulama Tipi</label>
                  <select
                    value={form.uygulama_tipi_id || ""}
                    onChange={(e) => setForm((f) => ({ ...f, uygulama_tipi_id: e.target.value ? Number(e.target.value) : null }))}
                    className={INPUT_STIL}
                  >
                    <option value="">Tümü</option>
                    {filtreliUygulamaTipleri.map((t) => <option key={t.id} value={t.id}>{t.ad}</option>)}
                  </select>
                </div>
              )}

              {/* KDV Ayarı */}
              <div className="md:col-span-2 mt-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.kdv_aktif || false} 
                      onChange={(e) => setForm((f) => ({ ...f, kdv_aktif: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">KDV Uygula</span>
                  </label>
                  {form.kdv_aktif && (
                    <div className="flex items-center gap-2 ml-4 animate-fadeIn">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Oran:</span>
                      <input
                        type="number"
                        value={form.kdv_oran ?? 20}
                        onChange={(e) => setForm((f) => ({ ...f, kdv_oran: Number(e.target.value) }))}
                        className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={0}
                        max={100}
                      />
                      <span className="text-xs text-gray-500 dark:text-slate-400">%</span>
                    </div>
                  )}
                </div>
                {form.kdv_aktif && (
                  <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Bu şablon ile oluşturulan paketlerde fiyata %{form.kdv_oran ?? 20} KDV eklenecektir. Paket oluşturma ekranında KDV tutarı ayrıca gösterilecektir.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Özellikler Alanı */}
          {ozellikler.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 p-16 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Sol panelden özellik ekleyin</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Her özellik bir widget olarak buraya eklenecek</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ozellikler.map((oz, idx) => (
                <OzellikWidget
                  key={oz._key}
                  ozellik={oz}
                  sira={idx}
                  toplam={ozellikler.length}
                  guncelle={(alan, val) => ozellikGuncelle(oz._key, alan, val)}
                  degerGuncelle={(alan, val) => degerGuncelle(oz._key, alan, val)}
                  sil={() => ozellikSil(oz._key)}
                  yukari={() => siraDegistir(oz._key, -1)}
                  asagi={() => siraDegistir(oz._key, 1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Özellik Widget Bileşeni                      */
/* ============================================= */

function OzellikWidget({ ozellik, sira, toplam, guncelle, degerGuncelle, sil, yukari, asagi }) {
  const [acik, setAcik] = useState(true);
  const [yardimAcik, setYardimAcik] = useState(false);
  const tip = OZELLIK_TIPLERI.find((t) => t.id === ozellik.ozellik_tipi);
  const r = getRenk(tip?.renk || "gray");

  return (
    <div className={`rounded-2xl border ${r.border} ${r.bg} transition-all`}>
      {/* Widget Başlık */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Sıra & İkon */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${r.text} bg-white/60 dark:bg-white/10`}>
            {sira + 1}
          </span>
          <span className="text-xl">{tip?.ikon || "•"}</span>
        </div>

        {/* Başlık */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={ozellik.baslik}
            onChange={(e) => guncelle("baslik", e.target.value)}
            placeholder={tip?.ad || "Özellik"}
            className={`bg-transparent border-none outline-none text-sm font-semibold w-full ${r.text} placeholder:opacity-50`}
          />
          <p className="text-[10px] text-gray-400 dark:text-slate-500">{tip?.aciklama}</p>
        </div>

        {/* Kontroller */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={yukari} disabled={sira === 0}
            className="w-7 h-7 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 flex items-center justify-center disabled:opacity-20 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button onClick={asagi} disabled={sira === toplam - 1}
            className="w-7 h-7 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 flex items-center justify-center disabled:opacity-20 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button onClick={() => setAcik(!acik)}
            className="w-7 h-7 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-500 transition-transform ${acik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Yardım Butonu */}
          <button onClick={() => setYardimAcik(true)}
            className="w-7 h-7 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 flex items-center justify-center cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {/* Sil butonu - temel_fiyat için gizle (zorunlu özellik) */}
          {ozellik.ozellik_tipi !== "temel_fiyat" && (
            <button onClick={sil}
              className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Widget İçerik */}
      {acik && (
        <div className="px-4 pb-4 pt-1 overflow-visible">
          <OzellikFormu
            tip={ozellik.ozellik_tipi}
            deger={ozellik.deger}
            guncelle={degerGuncelle}
          />
        </div>
      )}

      {/* Yardım Modal */}
      {yardimAcik && (
        <WidgetYardimModal
          tip={tip}
          kapat={() => setYardimAcik(false)}
        />
      )}
    </div>
  );
}

/* ============================================= */
/*  Widget Yardım Modal                          */
/* ============================================= */

const WIDGET_YARDIM_METINLERI = {
  temel_fiyat: {
    baslik: "Temel Fiyat Nedir?",
    aciklama: "Ürünün sabit satış fiyatını belirler. Yeni şablon oluşturulduğunda otomatik olarak eklenir.",
    alanlar: [
      { ad: "Fiyat", aciklama: "Ürünün birim satış fiyatı" },
      { ad: "Para Birimi", aciklama: "TL, USD veya EUR seçebilirsiniz" },
    ],
    ornek: "Örnek: E-Fatura ürünü için 500 TL temel fiyat belirleyebilirsiniz.",
  },
  aktivasyon_yenileme: {
    baslik: "Aktivasyon / Yenileme Fiyatı",
    aciklama: "İlk kez alım ve yenileme için farklı fiyatlar tanımlamanızı sağlar.",
    alanlar: [
      { ad: "Aktivasyon Fiyatı", aciklama: "Müşterinin ürünü ilk aldığında ödeyeceği tutar" },
      { ad: "Yenileme Fiyatı", aciklama: "Lisans yenilemede ödeyeceği tutar" },
    ],
    ornek: "Örnek: Aktivasyon 1000 TL, Yenileme 600 TL",
  },
  kademeli_fiyat: {
    baslik: "Kademeli Fiyat (Adet/Kapasite)",
    aciklama: "Miktar arttıkça farklı fiyatlar uygulamanızı sağlar. Adet veya kapasite bazlı olarak kullanabilirsiniz.",
    alanlar: [
      { ad: "Adet Bazlı", aciklama: "1-10 adet, 11-50 adet gibi kademeler için farklı fiyatlar" },
      { ad: "Kapasite Bazlı", aciklama: "5GB, 10GB, 50GB gibi kapasite kademeleri için fiyatlar" },
    ],
    ornek: "Örnek: 1-10 adet: 100 TL, 11-50 adet: 80 TL, 51+ adet: 60 TL",
  },
  hediye_urun: {
    baslik: "Hediye Ürün",
    aciklama: "Bu ürün alındığında hangi ürünlerin hediye olarak verileceğini belirler.",
    alanlar: [
      { ad: "Ürün Seçimi", aciklama: "Hediye verilecek ürünleri arayarak seçin" },
    ],
    ornek: "Örnek: E-Fatura alana E-Mutabakat hediye",
  },
  paket_indirimi: {
    baslik: "Paket İndirimi",
    aciklama: "Belirli ürünlerle birlikte alındığında indirim uygulanmasını sağlar.",
    alanlar: [
      { ad: "Ürün Seçimi", aciklama: "Birlikte alınması gereken ürünler" },
      { ad: "İndirim Oranı/Tutarı", aciklama: "Yüzde veya sabit tutar indirim" },
    ],
    ornek: "Örnek: E-Fatura + E-Arşiv birlikte alınırsa %15 indirim",
  },
  periyot_indirim: {
    baslik: "Aylık / Yıllık İndirim",
    aciklama: "Müşteri yıllık alım yaparsa indirim uygulanmasını sağlar.",
    alanlar: [
      { ad: "Aylık Oran", aciklama: "Aylık alımlarda uygulanacak indirim" },
      { ad: "Yıllık Oran", aciklama: "Yıllık alımlarda uygulanacak indirim" },
    ],
    ornek: "Örnek: Yıllık alımlarda %20 indirim",
  },
  gecis_fiyati: {
    baslik: "Geçiş Fiyatı",
    aciklama: "Başka bir üründen bu ürüne geçiş yapan müşterilere özel fiyat tanımlar.",
    alanlar: [
      { ad: "Hedef Ürün", aciklama: "Hangi ürünlerden geçiş yapanlara uygulanacak" },
      { ad: "Geçiş Fiyatı", aciklama: "Geçiş yapanlara özel fiyat" },
    ],
    ornek: "Örnek: Rakip ürününden geçenlere 300 TL'ye aktivasyon",
  },
  kullanici_sayisi: {
    baslik: "Kullanıcı Sayısı",
    aciklama: "Minimum ve maksimum kullanıcı sayısı ile ek kullanıcı ücretini belirler.",
    alanlar: [
      { ad: "Min Kullanıcı", aciklama: "Pakete dahil minimum kullanıcı" },
      { ad: "Max Kullanıcı", aciklama: "İzin verilen maksimum kullanıcı (boş = sınırsız)" },
      { ad: "Ek Kullanıcı Fiyatı", aciklama: "Her ek kullanıcı için ücret" },
    ],
    ornek: "Örnek: 1-5 kullanıcı dahil, ek kullanıcı 50 TL",
  },
  sicil_domain: {
    baslik: "Sicil No / Domain",
    aciklama: "Lisansa bağlı sicil numarası veya domain adresi gereksinimi.",
    alanlar: [
      { ad: "Alan Tipi", aciklama: "Sicil No, Domain, MAC veya IP adresi" },
      { ad: "Zorunlu", aciklama: "İşaretlenirse paket eklerken bu alan mutlaka girilmeli" },
    ],
    ornek: "Örnek: E-Fatura için vergi sicil numarası zorunlu",
  },
  siparis_miktari: {
    baslik: "Sipariş Miktarı (Min-Max)",
    aciklama: "Bu üründen minimum ve maksimum kaç adet alınabileceğini belirler.",
    alanlar: [
      { ad: "Min Adet", aciklama: "En az alınması gereken miktar" },
      { ad: "Max Adet", aciklama: "En fazla alınabilecek miktar (boş = sınırsız)" },
    ],
    ornek: "Örnek: Minimum 100 kontör, maksimum 10000 kontör",
  },
  kampanya: {
    baslik: "Kampanya / Promosyon",
    aciklama: "Koşullu kampanya kuralları tanımlayarak otomatik indirim uygulanmasını sağlar.",
    alanlar: [
      { ad: "Kampanya Adı", aciklama: "Kampanyanın görünen adı" },
      { ad: "Koşullar", aciklama: "İndirim uygulanması için sağlanması gereken kurallar" },
      { ad: "İndirim Oranı", aciklama: "Koşullar sağlanınca uygulanacak indirim" },
    ],
    ornek: "Örnek: 5+ ürün alana %10 indirim",
  },
  bagimli_urun: {
    baslik: "Bağımlı Ürün",
    aciklama: "Bu ürünün çalışması için gerekli olan diğer ürünleri belirler. Paket verilirken uyarı gösterilir.",
    alanlar: [
      { ad: "Ürün Seçimi", aciklama: "Bu ürün için gerekli olan ürünler" },
      { ad: "Zorunlu", aciklama: "İşaretlenirse bağımlı ürünler olmadan satış yapılamaz" },
    ],
    ornek: "Örnek: E-Arşiv için E-Fatura gereklidir",
  },
  demo_suresi: {
    baslik: "Demo Süresi",
    aciklama: "Ürünün ücretsiz deneme süresini belirler.",
    alanlar: [
      { ad: "Gün", aciklama: "Deneme süresi gün cinsinden" },
    ],
    ornek: "Örnek: 30 gün ücretsiz deneme",
  },
  otomatik_yenileme: {
    baslik: "Otomatik Yenileme",
    aciklama: "Lisans bitiminde otomatik yenileme ve bildirim ayarları.",
    alanlar: [
      { ad: "Aktif", aciklama: "Otomatik yenileme açık/kapalı" },
      { ad: "Bildirim Günü", aciklama: "Bitiş tarihinden kaç gün önce uyarı" },
    ],
    ornek: "Örnek: Bitiş tarihinden 30 gün önce bildirim",
  },
  domain_fiyat: {
    baslik: "Domain Uzantı Fiyatlandırma",
    aciklama: "Her domain uzantısı için farklı aktivasyon ve yenileme fiyatı tanımlar.",
    alanlar: [
      { ad: "Uzantı", aciklama: ".com, .com.tr gibi uzantılar" },
      { ad: "Aktivasyon", aciklama: "İlk kayıt fiyatı" },
      { ad: "Yenileme", aciklama: "Yenileme fiyatı" },
    ],
    ornek: "Örnek: .com Aktivasyon: 150 TL, Yenileme: 100 TL",
  },
};

function WidgetYardimModal({ tip, kapat }) {
  const yardim = WIDGET_YARDIM_METINLERI[tip?.id] || {
    baslik: tip?.ad || "Widget Yardım",
    aciklama: tip?.aciklama || "Bu widget hakkında detaylı bilgi bulunmuyor.",
    alanlar: [],
    ornek: "",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={kapat}>
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-violet-500">
          <span className="text-2xl">{tip?.ikon || "❓"}</span>
          <h3 className="text-lg font-bold text-white">{yardim.baslik}</h3>
          <button onClick={kapat} className="ml-auto text-white/70 hover:text-white cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">{yardim.aciklama}</p>

          {/* Alanlar */}
          {yardim.alanlar.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Alanlar</h4>
              <div className="space-y-2">
                {yardim.alanlar.map((alan, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{alan.ad}:</span>
                    <span className="text-xs text-gray-600 dark:text-slate-400">{alan.aciklama}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Örnek */}
          {yardim.ornek && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">💡 </span>
                {yardim.ornek}
              </p>
            </div>
          )}
        </div>

        {/* Alt Buton */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 flex justify-end">
          <button
            onClick={kapat}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Ürün Bilgi Modal (Seçilen ürün detayı)       */
/* ============================================= */

function UrunBilgiModal({ urun, kapat }) {
  const [detay, setDetay] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (urun?.id) {
      setYukleniyor(true);
      apiGet(`/urunler/${urun.id}`)
        .then((res) => setDetay(res.veri))
        .catch(() => setDetay(null))
        .finally(() => setYukleniyor(false));
    } else {
      setYukleniyor(false);
    }
  }, [urun?.id]);

  if (!urun) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={kapat}>
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-500 to-cyan-500">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">{urun.ad}</h3>
            <p className="text-xs text-white/70">Ürün Bilgileri</p>
          </div>
          <button onClick={kapat} className="text-white/70 hover:text-white cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* İçerik */}
        <div className="p-5">
          {yukleniyor ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : detay ? (
            <div className="space-y-4">
              {/* Grup & Tip */}
              <div className="flex flex-wrap gap-2">
                {detay.grup?.ad && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {detay.grup.ad}
                  </span>
                )}
                {detay.urunTipi?.ad && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {detay.urunTipi.ad}
                  </span>
                )}
                {detay.uygulamaTipi?.ad && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {detay.uygulamaTipi.ad}
                  </span>
                )}
              </div>

              {/* Detay Bilgiler */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Durum</p>
                  <p className={`text-sm font-semibold ${detay.aktif ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                    {detay.aktif ? "✓ Aktif" : "○ Pasif"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Şablon</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 truncate">
                    {detay.sablon?.ad || "—"}
                  </p>
                </div>
              </div>

              {/* Açıklama */}
              {detay.aciklama && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1 font-medium">Açıklama</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">{detay.aciklama}</p>
                </div>
              )}

              {/* Fiyat Bilgisi */}
              {detay.sablon?.icerik && (() => {
                try {
                  const icerik = typeof detay.sablon.icerik === "string" ? JSON.parse(detay.sablon.icerik) : detay.sablon.icerik;
                  const temelFiyat = icerik?.ozellikler?.find(o => o.ozellik_tipi === "temel_fiyat");
                  if (temelFiyat?.deger?.fiyat) {
                    return (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1 font-medium">Temel Fiyat</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                          {temelFiyat.deger.fiyat.toLocaleString("tr-TR")} {temelFiyat.deger.para_birimi || "TL"}
                        </p>
                      </div>
                    );
                  }
                } catch { return null; }
                return null;
              })()}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Ürün bilgisi bulunamadı</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Bu ürün elle eklenmiş olabilir</p>
            </div>
          )}
        </div>

        {/* Alt Buton */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-white/5 flex justify-end">
          <button
            onClick={kapat}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Seçili Ürün Kartı (Tekrar kullanılabilir)    */
/* ============================================= */

const RENK_SEMALARI = {
  red: {
    kart: "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/10 border-red-200 dark:border-red-500/20",
    metin: "text-red-700 dark:text-red-400",
    ikon: "text-red-500 dark:text-red-400",
    buton: "hover:bg-red-100 dark:hover:bg-red-500/20",
    info: "hover:bg-red-200/50 dark:hover:bg-red-500/30",
  },
  emerald: {
    kart: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200 dark:border-emerald-500/20",
    metin: "text-emerald-700 dark:text-emerald-400",
    ikon: "text-emerald-500 dark:text-emerald-400",
    buton: "hover:bg-emerald-100 dark:hover:bg-emerald-500/20",
    info: "hover:bg-emerald-200/50 dark:hover:bg-emerald-500/30",
  },
  violet: {
    kart: "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 border-violet-200 dark:border-violet-500/20",
    metin: "text-violet-700 dark:text-violet-400",
    ikon: "text-violet-500 dark:text-violet-400",
    buton: "hover:bg-violet-100 dark:hover:bg-violet-500/20",
    info: "hover:bg-violet-200/50 dark:hover:bg-violet-500/30",
  },
  amber: {
    kart: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-200 dark:border-amber-500/20",
    metin: "text-amber-700 dark:text-amber-400",
    ikon: "text-amber-500 dark:text-amber-400",
    buton: "hover:bg-amber-100 dark:hover:bg-amber-500/20",
    info: "hover:bg-amber-200/50 dark:hover:bg-amber-500/30",
  },
  cyan: {
    kart: "bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-500/10 dark:to-sky-500/10 border-cyan-200 dark:border-cyan-500/20",
    metin: "text-cyan-700 dark:text-cyan-400",
    ikon: "text-cyan-500 dark:text-cyan-400",
    buton: "hover:bg-cyan-100 dark:hover:bg-cyan-500/20",
    info: "hover:bg-cyan-200/50 dark:hover:bg-cyan-500/30",
  },
  blue: {
    kart: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border-blue-200 dark:border-blue-500/20",
    metin: "text-blue-700 dark:text-blue-400",
    ikon: "text-blue-500 dark:text-blue-400",
    buton: "hover:bg-blue-100 dark:hover:bg-blue-500/20",
    info: "hover:bg-blue-200/50 dark:hover:bg-blue-500/30",
  },
};

function SeciliUrunListesi({ urunler, kaldir, renk = "blue", tekli = false, tumUrunler = [] }) {
  const [bilgiUrun, setBilgiUrun] = useState(null);
  const [bilgiYukleniyor, setBilgiYukleniyor] = useState(false);
  const r = RENK_SEMALARI[renk] || RENK_SEMALARI.blue;

  if (!urunler || urunler.length === 0) return null;

  // Bilgi butonuna tıklandığında tam ürün verisini bul veya API'den çek
  const bilgiGoster = async (u) => {
    // Önce tumUrunler'de ara
    if (u.id && tumUrunler.length > 0) {
      const tamUrun = tumUrunler.find(tu => tu.id === u.id);
      if (tamUrun) {
        setBilgiUrun(tamUrun);
        return;
      }
    }
    
    // tumUrunler'de yoksa ve ID varsa API'den çek
    if (u.id) {
      setBilgiYukleniyor(true);
      try {
        const yanit = await apiGet(`/urunler/${u.id}`);
        if (yanit.basarili && yanit.veri) {
          setBilgiUrun(yanit.veri);
        } else {
          // API'den de alınamadıysa mevcut bilgiyle göster
          setBilgiUrun(u);
        }
      } catch {
        // Hata durumunda mevcut bilgiyle göster
        setBilgiUrun(u);
      } finally {
        setBilgiYukleniyor(false);
      }
      return;
    }
    
    // Elle eklenen ürünler için mevcut bilgiyle göster
    setBilgiUrun(u);
  };

  return (
    <>
      <div className={tekli ? "space-y-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}>
        {urunler.map((u, i) => (
          <div
            key={i}
            className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border ${r.kart} transition-all hover:shadow-sm`}
          >
            {/* Ürün İkonu */}
            <div className={`w-7 h-7 rounded-lg bg-white/60 dark:bg-white/10 flex items-center justify-center shrink-0 ${r.ikon}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>

            {/* Ürün Adı */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${r.metin}`}>{u.ad}</p>
              {!u.id && (
                <p className="text-[9px] text-gray-400 dark:text-slate-500">Elle eklendi</p>
              )}
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Bilgi Butonu */}
              <button
                onClick={() => bilgiGoster(u)}
                disabled={bilgiYukleniyor}
                className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${r.info} ${bilgiYukleniyor ? 'opacity-50' : ''}`}
                title="Ürün bilgisi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${r.ikon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Kaldır Butonu */}
              <button
                onClick={() => tekli ? kaldir() : kaldir(i)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${r.buton}`}
                title="Kaldır"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bilgi Modal */}
      {bilgiUrun && (
        <UrunBilgiModal urun={bilgiUrun} kapat={() => setBilgiUrun(null)} />
      )}
    </>
  );
}

/* ============================================= */
/*  Özellik Formları (her tip için ayrı)         */
/* ============================================= */

const KUCUK_INPUT = "px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

export function OzellikFormu({ tip, deger: rawDeger, guncelle }) {
  const deger = rawDeger || {};
  switch (tip) {
    case "temel_fiyat":
      return (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Fiyat</label>
            <input type="number" value={deger.fiyat || 0} onChange={(e) => guncelle("fiyat", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
          </div>
          <div className="w-24">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Birim</label>
            <select value={deger.para_birimi || "TL"} onChange={(e) => guncelle("para_birimi", e.target.value)} className={KUCUK_INPUT + " w-full"}>
              <option value="TL">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      );

    case "aktivasyon_yenileme":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Aktivasyon Fiyatı</label>
            <input type="number" value={deger.aktivasyon_fiyat || 0} onChange={(e) => guncelle("aktivasyon_fiyat", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Yenileme Fiyatı</label>
            <input type="number" value={deger.yenileme_fiyat || 0} onChange={(e) => guncelle("yenileme_fiyat", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Birim</label>
            <select value={deger.para_birimi || "TL"} onChange={(e) => guncelle("para_birimi", e.target.value)} className={KUCUK_INPUT + " w-full"}>
              <option value="TL">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      );

    case "kademeli_fiyat":
      return <KademeliAdetKapasiteForm deger={deger} guncelle={guncelle} />;

    case "hediye_urun":
      return <UrunSecimFormu deger={deger} guncelle={guncelle} baslik="Hediye Edilecek Ürünler" renk="emerald" />;

    case "paket_indirimi":
      return <PaketIndirimiFormu deger={deger} guncelle={guncelle} />;

    case "periyot_indirim":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="periyot_tip" checked={deger.tip === "aylik"} onChange={() => guncelle("tip", "aylik")}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Aylık</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="periyot_tip" checked={deger.tip === "yillik"} onChange={() => guncelle("tip", "yillik")}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Yıllık</span>
            </label>
          </div>
          <div className="w-48">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">
              {deger.tip === "yillik" ? "Yıllık" : "Aylık"} İndirim Oranı (%)
            </label>
            <input type="number" value={deger.oran || 0} onChange={(e) => guncelle("oran", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} max={100} />
          </div>
        </div>
      );

    case "gecis_fiyati":
      return <GecisFiyatiFormu deger={deger} guncelle={guncelle} />;

    case "kullanici_sayisi":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Min Kullanıcı</label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={deger.min || 1} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                guncelle("min", val ? Number(val) : 1);
              }}
              className={KUCUK_INPUT + " w-full"} 
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Max Kullanıcı</label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={deger.max ?? ""} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                guncelle("max", val ? Number(val) : null);
              }}
              placeholder="Sınırsız" 
              className={KUCUK_INPUT + " w-full"} 
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Ek Kullanıcı Fiyatı</label>
            <input type="number" value={deger.ek_kullanici_fiyat || 0} onChange={(e) => guncelle("ek_kullanici_fiyat", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
          </div>
        </div>
      );

    case "sicil_domain":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Alan Tipi</label>
            <select value={deger.alan_tipi || "sicil_no"} onChange={(e) => guncelle("alan_tipi", e.target.value)} className={KUCUK_INPUT + " w-full"}>
              <option value="sicil_no">Sicil No</option>
              <option value="domain">Domain</option>
              <option value="mac_adresi">MAC Adresi</option>
              <option value="ip_adresi">IP Adresi</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={deger.zorunlu || false} onChange={(e) => guncelle("zorunlu", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Zorunlu</span>
            </label>
          </div>
        </div>
      );

    case "domain_fiyat":
      return <DomainFiyatFormu deger={deger} guncelle={guncelle} />;

    case "kampanya":
      return <KampanyaKosulBuilder deger={deger} guncelle={guncelle} />;

    case "siparis_miktari":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Minimum Adet</label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={deger.min || 1} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                guncelle("min", val ? Number(val) : 1);
              }}
              className={KUCUK_INPUT + " w-full"} 
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Maximum Adet</label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={deger.max ?? ""} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                guncelle("max", val ? Number(val) : null);
              }}
              placeholder="Sınırsız" 
              className={KUCUK_INPUT + " w-full"} 
            />
          </div>
        </div>
      );

    case "demo_suresi":
      return (
        <div className="w-48">
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Demo Süresi (Gün)</label>
          <input type="number" value={deger.gun || 30} onChange={(e) => guncelle("gun", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
        </div>
      );

    case "otomatik_yenileme":
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={deger.aktif || false} onChange={(e) => guncelle("aktif", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span className="text-xs text-gray-600 dark:text-slate-400">Otomatik Yenileme Aktif</span>
          </label>
          {deger.aktif && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Bildirim Günü (Bitiş Öncesi)</label>
                <input type="number" value={deger.bildirim_gun || 30} onChange={(e) => guncelle("bildirim_gun", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Açıklama</label>
                <input type="text" value={deger.aciklama || ""} onChange={(e) => guncelle("aciklama", e.target.value)} className={KUCUK_INPUT + " w-full"} />
              </div>
            </div>
          )}
        </div>
      );

    case "bagimli_urun":
      return <BagimliUrunFormu deger={deger} guncelle={guncelle} />;

    case "urun_yonetimi":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.transfer_edilebilir ?? true} onChange={(e) => guncelle("transfer_edilebilir", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Transfer Edilebilir</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.durdurulabilir ?? true} onChange={(e) => guncelle("durdurulabilir", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Durdurulabilir</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.askiya_alinabilir ?? true} onChange={(e) => guncelle("askiya_alinabilir", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Askıya Alınabilir</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.iptal_edilebilir ?? true} onChange={(e) => guncelle("iptal_edilebilir", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">İptal Edilebilir</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.devir_edilebilir ?? false} onChange={(e) => guncelle("devir_edilebilir", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Devir Edilebilir (Başka Bayiye)</span>
            </label>
          </div>
          {deger.transfer_edilebilir && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-500/5 border border-fuchsia-200 dark:border-fuchsia-500/20">
              <div>
                <label className="block text-[11px] font-medium text-fuchsia-600 dark:text-fuchsia-400 mb-1">Transfer Ücreti</label>
                <input type="number" value={deger.transfer_ucreti || 0} onChange={(e) => guncelle("transfer_ucreti", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-fuchsia-600 dark:text-fuchsia-400 mb-1">Birim</label>
                <select value={deger.transfer_ucreti_birimi || "TL"} onChange={(e) => guncelle("transfer_ucreti_birimi", e.target.value)} className={KUCUK_INPUT + " w-full"}>
                  <option value="TL">TL</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          )}
          {deger.durdurulabilir && (
            <div className="w-48">
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Max Durdurma Süresi (Gün)</label>
              <input type="number" value={deger.durdurma_suresi_gun || 90} onChange={(e) => guncelle("durdurma_suresi_gun", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
            </div>
          )}
          {deger.askiya_alinabilir && (
            <div className="w-48">
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Max Askı Süresi (Gün)</label>
              <input type="number" value={deger.askiya_alma_suresi_gun || 30} onChange={(e) => guncelle("askiya_alma_suresi_gun", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
            </div>
          )}
          {deger.iptal_edilebilir && (
            <div className="w-48">
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">İptal İade Oranı (%)</label>
              <input type="number" value={deger.iptal_iade_orani || 0} onChange={(e) => guncelle("iptal_iade_orani", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} max={100} />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Ek Not</label>
            <input type="text" value={deger.not || ""} onChange={(e) => guncelle("not", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Opsiyonel açıklama..." />
          </div>
        </div>
      );

    case "garanti_suresi":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Süre (Ay)</label>
              <input type="number" value={deger.sure_ay ?? 24} onChange={(e) => guncelle("sure_ay", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Kapsam</label>
              <select value={deger.kapsam || "standart"} onChange={(e) => guncelle("kapsam", e.target.value)} className={KUCUK_INPUT + " w-full"}>
                <option value="standart">Standart</option>
                <option value="genisletilmis">Genişletilmiş</option>
                <option value="premium">Premium</option>
                <option value="sinirli">Sınırlı</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={deger.uzatilabilir ?? true} onChange={(e) => guncelle("uzatilabilir", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
                <span className="text-xs text-gray-600 dark:text-slate-400">Uzatılabilir</span>
              </label>
            </div>
          </div>
          {deger.uzatilabilir && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-500/5 border border-slate-200 dark:border-slate-500/20">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Uzatma Süresi (Ay)</label>
                <input type="number" value={deger.uzatma_suresi_ay || 12} onChange={(e) => guncelle("uzatma_suresi_ay", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Uzatma Ücreti</label>
                <input type="number" value={deger.uzatma_ucreti || 0} onChange={(e) => guncelle("uzatma_ucreti", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Birim</label>
                <select value={deger.uzatma_ucreti_birimi || "TL"} onChange={(e) => guncelle("uzatma_ucreti_birimi", e.target.value)} className={KUCUK_INPUT + " w-full"}>
                  <option value="TL">TL</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Garanti Notu</label>
            <input type="text" value={deger.garanti_notu || ""} onChange={(e) => guncelle("garanti_notu", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Garanti ile ilgili ek bilgi..." />
          </div>
        </div>
      );

    case "guvenlik":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.mac_kontrolu ?? false} onChange={(e) => guncelle("mac_kontrolu", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">MAC Adresi Kontrolü</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.ip_kisitlama ?? false} onChange={(e) => guncelle("ip_kisitlama", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">IP Kısıtlama</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deger.online_dogrulama ?? false} onChange={(e) => guncelle("online_dogrulama", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">Online Doğrulama</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Max Cihaz</label>
              <input type="number" value={deger.max_cihaz || 1} onChange={(e) => guncelle("max_cihaz", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Cihaz Değişim Hakkı</label>
              <input type="number" value={deger.cihaz_degisim_hakki ?? 2} onChange={(e) => guncelle("cihaz_degisim_hakki", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Değişim Periyodu</label>
              <select value={deger.cihaz_degisim_periyot || "yillik"} onChange={(e) => guncelle("cihaz_degisim_periyot", e.target.value)} className={KUCUK_INPUT + " w-full"}>
                <option value="aylik">Aylık</option>
                <option value="yillik">Yıllık</option>
                <option value="sinirsiz">Sınırsız</option>
              </select>
            </div>
          </div>
          {deger.online_dogrulama && (
            <div className="w-48">
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Doğrulama Periyodu (Gün)</label>
              <input type="number" value={deger.dogrulama_periyot_gun || 30} onChange={(e) => guncelle("dogrulama_periyot_gun", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
            </div>
          )}
        </div>
      );

    default:
      return <p className="text-xs text-gray-400">Bilinmeyen özellik tipi: {tip}</p>;
  }
}

/* ============================================= */
/*  Kademeli Fiyat Formu (Ortak)                 */
/* ============================================= */

function KademeliForm({ deger: rawDeger, guncelle, birimLabel, birimKey }) {
  const deger = rawDeger || {};
  const kademeler = deger.kademeler || [];

  const kademeEkle = () => {
    guncelle("kademeler", [...kademeler, { [birimKey]: "", fiyat: 0 }]);
  };

  const kademeSil = (idx) => {
    guncelle("kademeler", kademeler.filter((_, i) => i !== idx));
  };

  const kademeGuncelle = (idx, alan, val) => {
    const yeni = kademeler.map((k, i) => (i === idx ? { ...k, [alan]: val } : k));
    guncelle("kademeler", yeni);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{birimLabel}</span>
        <span className="text-[11px] text-gray-400">→</span>
        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Fiyat</span>
        <div className="flex-1" />
        <select value={deger.birim || birimLabel} onChange={(e) => guncelle("birim", e.target.value)} className="text-[11px] px-2 py-1 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400">
          {birimKey === "adet" ? (
            <>
              <option value="Adet">Adet</option>
              <option value="Kontör">Kontör</option>
              <option value="Paket">Paket</option>
            </>
          ) : (
            <>
              <option value="GB">GB</option>
              <option value="TB">TB</option>
              <option value="MB">MB</option>
            </>
          )}
        </select>
      </div>
      {kademeler.map((k, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="text" value={k[birimKey] ?? ""} onChange={(e) => kademeGuncelle(i, birimKey, e.target.value)}
            placeholder={birimLabel} className={KUCUK_INPUT + " w-28"} />
          <span className="text-gray-400 text-xs">→</span>
          <input type="number" value={k.fiyat || 0} onChange={(e) => kademeGuncelle(i, "fiyat", Number(e.target.value))}
            className={KUCUK_INPUT + " w-32"} min={0} step="0.01" />
          <span className="text-xs text-gray-400">TL</span>
          <button onClick={() => kademeSil(i)}
            className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button onClick={kademeEkle}
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium cursor-pointer mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Kademe Ekle
      </button>
    </div>
  );
}

/* ============================================= */
/*  Domain Uzantı Fiyatlandırma Formu            */
/* ============================================= */

const YAYGIN_UZANTILAR = [".com", ".com.tr", ".net", ".org", ".org.tr", ".net.tr", ".biz", ".info", ".gen.tr", ".web.tr", ".name.tr", ".tel.tr", ".tv.tr", ".av.tr"];

function DomainFiyatFormu({ deger: rawDeger, guncelle }) {
  const deger = rawDeger || {};
  const uzantilar = deger.uzantilar || [];

  const uzantiEkle = () => {
    guncelle("uzantilar", [...uzantilar, { uzanti: "", aktivasyon: 0, yenileme: 0 }]);
  };

  const uzantiSil = (idx) => {
    guncelle("uzantilar", uzantilar.filter((_, i) => i !== idx));
  };

  const uzantiGuncelle = (idx, alan, val) => {
    const yeni = uzantilar.map((u, i) => (i === idx ? { ...u, [alan]: val } : u));
    guncelle("uzantilar", yeni);
  };

  const mevcutUzantilar = uzantilar.map((u) => u.uzanti);
  const eklenebilirler = YAYGIN_UZANTILAR.filter((u) => !mevcutUzantilar.includes(u));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 w-28">Uzantı</span>
          <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 w-28">Aktivasyon</span>
          <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 w-28">Yenileme</span>
        </div>
        <select value={deger.para_birimi || "TL"} onChange={(e) => guncelle("para_birimi", e.target.value)} className="text-[11px] px-2 py-1 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400">
          <option value="TL">TL</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      {uzantilar.map((u, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="text" value={u.uzanti} onChange={(e) => uzantiGuncelle(i, "uzanti", e.target.value)}
            placeholder=".com" className={KUCUK_INPUT + " w-28"} list="uzantiOneriler" />
          <input type="number" value={u.aktivasyon || 0} onChange={(e) => uzantiGuncelle(i, "aktivasyon", Number(e.target.value))}
            className={KUCUK_INPUT + " w-28"} min={0} step="0.01" placeholder="Aktivasyon" />
          <input type="number" value={u.yenileme || 0} onChange={(e) => uzantiGuncelle(i, "yenileme", Number(e.target.value))}
            className={KUCUK_INPUT + " w-28"} min={0} step="0.01" placeholder="Yenileme" />
          <button onClick={() => uzantiSil(i)}
            className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <datalist id="uzantiOneriler">
        {eklenebilirler.map((u) => <option key={u} value={u} />)}
      </datalist>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={uzantiEkle}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Uzantı Ekle
        </button>
        {eklenebilirler.length > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-slate-500">|</span>
        )}
        {eklenebilirler.slice(0, 5).map((u) => (
          <button key={u} onClick={() => guncelle("uzantilar", [...uzantilar, { uzanti: u, aktivasyon: 0, yenileme: 0 }])}
            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-400 cursor-pointer transition-colors">
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================= */
/*  Bağımlı Ürün Seçme Formu (çoklu + arama)    */
/* ============================================= */

function BagimliUrunFormu({ deger: rawDeger, guncelle }) {
  const deger = rawDeger || {};
  const [arama, setArama] = useState("");
  const [acik, setAcik] = useState(false);
  const [tumUrunler, setTumUrunler] = useState([]);
  const wrapRef = useRef(null);
  const urunler = deger.urunler || [];

  useEffect(() => {
    apiGet("/urunler").then((r) => setTumUrunler(r.veri || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const tiklanma = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAcik(false); };
    document.addEventListener("mousedown", tiklanma);
    return () => document.removeEventListener("mousedown", tiklanma);
  }, []);

  const filtrelenmis = tumUrunler.filter((u) => {
    const ad = u.ad || u.urun_adi || "";
    const zatenVar = urunler.some((su) => su.id === u.id || su.ad === ad);
    if (zatenVar) return false;
    if (!arama) return true;
    return ad.toLowerCase().includes(arama.toLowerCase());
  });

  const urunEkle = (urun) => {
    const ad = urun.ad || urun.urun_adi || "";
    guncelle("urunler", [...urunler, { id: urun.id, ad }]);
    setArama("");
    setAcik(false);
  };

  const elleEkle = () => {
    if (!arama.trim()) return;
    const zatenVar = urunler.some((u) => u.ad.toLowerCase() === arama.trim().toLowerCase());
    if (zatenVar) return;
    guncelle("urunler", [...urunler, { id: null, ad: arama.trim() }]);
    setArama("");
    setAcik(false);
  };

  const urunKaldir = (idx) => {
    guncelle("urunler", urunler.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Seçilen ürünler */}
      {urunler.length > 0 && (
        <SeciliUrunListesi 
          urunler={urunler} 
          kaldir={urunKaldir} 
          renk="red"
          tumUrunler={tumUrunler}
        />
      )}

      {/* Arama / Ekleme */}
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          value={arama}
          onChange={(e) => { setArama(e.target.value); setAcik(true); }}
          onFocus={() => setAcik(true)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); elleEkle(); } }}
          placeholder="Ürün ara veya elle yaz + Enter..."
          className={KUCUK_INPUT + " w-full pr-20"}
        />
        {arama.trim() && (
          <button onClick={elleEkle}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-500/25 transition-colors">
            Elle Ekle
          </button>
        )}
        {acik && filtrelenmis.length > 0 && (
          <div className="absolute z-[60] bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl">
            {filtrelenmis.slice(0, 15).map((u) => (
              <button key={u.id} onClick={() => urunEkle(u)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between">
                <span>{u.ad || u.urun_adi}</span>
                {u.grup && <span className="text-[10px] text-gray-400 dark:text-slate-500">{u.grup.ad}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zorunlu & Açıklama */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={deger.zorunlu ?? true} onChange={(e) => guncelle("zorunlu", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
          <span className="text-xs text-gray-600 dark:text-slate-400">Zorunlu</span>
        </label>
        <div className="flex-1">
          <input type="text" value={deger.aciklama || ""} onChange={(e) => guncelle("aciklama", e.target.value)}
            className={KUCUK_INPUT + " w-full"} placeholder="Açıklama (opsiyonel)" />
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Kademeli Adet + Kapasite Kombine Formu       */
/* ============================================= */

const BIRIM_SECENEKLERI = {
  adet: ["Adet", "Kontör", "Paket", "Kullanıcı", "Lisans"],
  kapasite: ["GB", "TB", "MB", "KB"],
};

function KademeliAdetKapasiteForm({ deger: rawDeger, guncelle }) {
  const deger = rawDeger || {};
  const tip = deger.tip || "adet"; // "adet" veya "kapasite"
  const kademeler = deger.kademeler || [];
  const birimKey = tip === "adet" ? "adet" : "kapasite";
  const birimLabel = tip === "adet" ? "Adet" : "Kapasite";
  const varsayilanBirim = tip === "adet" ? "Adet" : "GB";

  const kademeEkle = () => {
    guncelle("kademeler", [...kademeler, { [birimKey]: "", fiyat: 0, birim: varsayilanBirim }]);
  };

  const kademeSil = (idx) => {
    guncelle("kademeler", kademeler.filter((_, i) => i !== idx));
  };

  const kademeGuncelle = (idx, alan, val) => {
    const yeni = kademeler.map((k, i) => (i === idx ? { ...k, [alan]: val } : k));
    guncelle("kademeler", yeni);
  };

  const tipDegistir = (yeniTip) => {
    // Tip değiştiğinde kademelerin birimlerini de güncelle
    const eskiKey = tip === "adet" ? "adet" : "kapasite";
    const yeniKey = yeniTip === "adet" ? "adet" : "kapasite";
    const yeniBirim = yeniTip === "adet" ? "Adet" : "GB";
    const yeniKademeler = kademeler.map(k => ({
      [yeniKey]: k[eskiKey] || "",
      fiyat: k.fiyat || 0,
      birim: yeniBirim
    }));
    guncelle("tip", yeniTip);
    guncelle("kademeler", yeniKademeler);
  };

  return (
    <div className="space-y-3">
      {/* Tip Seçimi */}
      <div className="flex items-center gap-4 pb-2 border-b border-gray-100 dark:border-white/5">
        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Kademeli Fiyat Tipi:</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="kademeli_tip" checked={tip === "adet"} onChange={() => tipDegistir("adet")}
              className="w-3.5 h-3.5 border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-xs text-gray-600 dark:text-slate-400">Adet Bazlı</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="kademeli_tip" checked={tip === "kapasite"} onChange={() => tipDegistir("kapasite")}
              className="w-3.5 h-3.5 border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-xs text-gray-600 dark:text-slate-400">Kapasite Bazlı</span>
          </label>
        </div>
      </div>

      {/* Kademeler */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{birimLabel}</span>
        <span className="text-[11px] text-gray-400 ml-16">Birim</span>
        <span className="text-[11px] text-gray-400 ml-10">→</span>
        <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Fiyat</span>
      </div>
      {kademeler.map((k, i) => {
        const satirBirim = k.birim || varsayilanBirim;
        return (
          <div key={i} className="flex items-center gap-2">
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={k[birimKey] ?? ""} 
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                kademeGuncelle(i, birimKey, val ? Number(val) : "");
              }}
              placeholder={birimLabel} 
              className={KUCUK_INPUT + " w-20"} 
            />
            <select 
              value={satirBirim} 
              onChange={(e) => kademeGuncelle(i, "birim", e.target.value)} 
              className="text-[11px] px-2 py-1.5 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 w-20"
            >
              {BIRIM_SECENEKLERI[tip].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <span className="text-gray-400 text-xs">→</span>
            <input type="number" value={k.fiyat || 0} onChange={(e) => kademeGuncelle(i, "fiyat", Number(e.target.value))}
              className={KUCUK_INPUT + " w-28"} min={0} step="0.01" />
            <span className="text-xs text-gray-400">TL</span>
            <button onClick={() => kademeSil(i)}
              className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
      <button onClick={kademeEkle}
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium cursor-pointer mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Kademe Ekle
      </button>
    </div>
  );
}

/* ============================================= */
/*  Ürün Seçim Formu (Çoklu + Arama)             */
/*  hediye_urun ve diğerlerinde kullanılır       */
/* ============================================= */

function UrunSecimFormu({ deger: rawDeger, guncelle, baslik, renk = "blue" }) {
  const deger = rawDeger || {};
  const [arama, setArama] = useState("");
  const [acik, setAcik] = useState(false);
  const [tumUrunler, setTumUrunler] = useState([]);
  const wrapRef = useRef(null);
  const urunler = deger.urunler || [];

  useEffect(() => {
    apiGet("/urunler").then((r) => setTumUrunler(r.veri || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const tiklanma = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAcik(false); };
    document.addEventListener("mousedown", tiklanma);
    return () => document.removeEventListener("mousedown", tiklanma);
  }, []);

  const filtrelenmis = tumUrunler.filter((u) => {
    const ad = u.ad || u.urun_adi || "";
    const zatenVar = urunler.some((su) => su.id === u.id || su.ad === ad);
    if (zatenVar) return false;
    if (!arama) return true;
    return ad.toLowerCase().includes(arama.toLowerCase());
  });

  const urunEkle = (urun) => {
    const ad = urun.ad || urun.urun_adi || "";
    guncelle("urunler", [...urunler, { id: urun.id, ad }]);
    setArama("");
    setAcik(false);
  };

  const elleEkle = () => {
    if (!arama.trim()) return;
    const zatenVar = urunler.some((u) => u.ad.toLowerCase() === arama.trim().toLowerCase());
    if (zatenVar) return;
    guncelle("urunler", [...urunler, { id: null, ad: arama.trim() }]);
    setArama("");
    setAcik(false);
  };

  const urunKaldir = (idx) => {
    guncelle("urunler", urunler.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400">{baslik}</label>
      
      {/* Seçilen ürünler */}
      {urunler.length > 0 && (
        <SeciliUrunListesi 
          urunler={urunler} 
          kaldir={urunKaldir} 
          renk={renk}
          tumUrunler={tumUrunler}
        />
      )}

      {/* Arama */}
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          value={arama}
          onChange={(e) => { setArama(e.target.value); setAcik(true); }}
          onFocus={() => setAcik(true)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); elleEkle(); } }}
          placeholder="Ürün ara veya elle yaz + Enter..."
          className={KUCUK_INPUT + " w-full pr-20"}
        />
        {arama.trim() && (
          <button onClick={elleEkle}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-500/25 transition-colors">
            Elle Ekle
          </button>
        )}
        {acik && filtrelenmis.length > 0 && (
          <div className="absolute z-[60] bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl">
            {filtrelenmis.slice(0, 15).map((u) => (
              <button key={u.id} onClick={() => urunEkle(u)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between">
                <span>{u.ad || u.urun_adi}</span>
                {u.grup && <span className="text-[10px] text-gray-400 dark:text-slate-500">{u.grup.ad}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================= */
/*  Paket İndirimi Formu (Ürün Seçim + İndirim)  */
/* ============================================= */

function PaketIndirimiFormu({ deger: rawDeger, guncelle }) {
  const deger = rawDeger || {};
  const [arama, setArama] = useState("");
  const [acik, setAcik] = useState(false);
  const [tumUrunler, setTumUrunler] = useState([]);
  const wrapRef = useRef(null);
  const urunler = deger.urunler || [];

  useEffect(() => {
    apiGet("/urunler").then((r) => setTumUrunler(r.veri || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const tiklanma = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAcik(false); };
    document.addEventListener("mousedown", tiklanma);
    return () => document.removeEventListener("mousedown", tiklanma);
  }, []);

  const filtrelenmis = tumUrunler.filter((u) => {
    const ad = u.ad || u.urun_adi || "";
    const zatenVar = urunler.some((su) => su.id === u.id || su.ad === ad);
    if (zatenVar) return false;
    if (!arama) return true;
    return ad.toLowerCase().includes(arama.toLowerCase());
  });

  const urunEkle = (urun) => {
    const ad = urun.ad || urun.urun_adi || "";
    guncelle("urunler", [...urunler, { id: urun.id, ad }]);
    setArama("");
    setAcik(false);
  };

  const elleEkle = () => {
    if (!arama.trim()) return;
    const zatenVar = urunler.some((u) => u.ad.toLowerCase() === arama.trim().toLowerCase());
    if (zatenVar) return;
    guncelle("urunler", [...urunler, { id: null, ad: arama.trim() }]);
    setArama("");
    setAcik(false);
  };

  const urunKaldir = (idx) => {
    guncelle("urunler", urunler.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400">Birlikte Alındığında İndirim Uygulanacak Ürünler</label>
      
      {/* Seçilen ürünler */}
      {urunler.length > 0 && (
        <SeciliUrunListesi 
          urunler={urunler} 
          kaldir={urunKaldir} 
          renk="violet"
          tumUrunler={tumUrunler}
        />
      )}

      {/* Arama */}
      <div ref={wrapRef} className="relative">
        <input
          type="text"
          value={arama}
          onChange={(e) => { setArama(e.target.value); setAcik(true); }}
          onFocus={() => setAcik(true)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); elleEkle(); } }}
          placeholder="Ürün ara veya elle yaz + Enter..."
          className={KUCUK_INPUT + " w-full pr-20"}
        />
        {arama.trim() && (
          <button onClick={elleEkle}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 font-medium cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-500/25 transition-colors">
            Elle Ekle
          </button>
        )}
        {acik && filtrelenmis.length > 0 && (
          <div className="absolute z-[60] bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl">
            {filtrelenmis.slice(0, 15).map((u) => (
              <button key={u.id} onClick={() => urunEkle(u)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 dark:hover:bg-violet-500/10 text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between">
                <span>{u.ad || u.urun_adi}</span>
                {u.grup && <span className="text-[10px] text-gray-400 dark:text-slate-500">{u.grup.ad}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* İndirim oranı */}
      <div className="w-48">
        <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Paket İndirim Oranı (%)</label>
        <input type="number" value={deger.indirim_orani || 0} onChange={(e) => guncelle("indirim_orani", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} max={100} />
      </div>
    </div>
  );
}

/* ============================================= */
/*  Geçiş Fiyatı Formu (Hedef Ürün Arama)        */
/* ============================================= */

function GecisFiyatiFormu({ deger: rawDeger, guncelle }) {
  const deger = rawDeger || {};
  const [arama, setArama] = useState("");
  const [acik, setAcik] = useState(false);
  const [tumUrunler, setTumUrunler] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    apiGet("/urunler").then((r) => setTumUrunler(r.veri || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const tiklanma = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAcik(false); };
    document.addEventListener("mousedown", tiklanma);
    return () => document.removeEventListener("mousedown", tiklanma);
  }, []);

  const filtrelenmis = tumUrunler.filter((u) => {
    const ad = u.ad || u.urun_adi || "";
    if (!arama) return true;
    return ad.toLowerCase().includes(arama.toLowerCase());
  });

  const urunSec = (urun) => {
    const ad = urun.ad || urun.urun_adi || "";
    guncelle("hedef_urun_id", urun.id);
    guncelle("hedef_urun_ad", ad);
    setArama("");
    setAcik(false);
  };

  const temizle = () => {
    guncelle("hedef_urun_id", null);
    guncelle("hedef_urun_ad", "");
  };

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400">Bu üründen geçiş yapılabilecek hedef ürün</label>
      
      {/* Seçili ürün */}
      {deger.hedef_urun_ad ? (
        <SeciliUrunListesi 
          urunler={[{ id: deger.hedef_urun_id, ad: deger.hedef_urun_ad }]} 
          kaldir={temizle} 
          renk="cyan"
          tumUrunler={tumUrunler}
          tekli
        />
      ) : (
        <div ref={wrapRef} className="relative">
          <input
            type="text"
            value={arama}
            onChange={(e) => { setArama(e.target.value); setAcik(true); }}
            onFocus={() => setAcik(true)}
            placeholder="Hedef ürün ara..."
            className={KUCUK_INPUT + " w-full"}
          />
          {acik && filtrelenmis.length > 0 && (
            <div className="absolute z-[60] bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl">
              {filtrelenmis.slice(0, 15).map((u) => (
                <button key={u.id} onClick={() => urunSec(u)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-50 dark:hover:bg-cyan-500/10 text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between">
                  <span>{u.ad || u.urun_adi}</span>
                  {u.grup && <span className="text-[10px] text-gray-400 dark:text-slate-500">{u.grup.ad}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fiyat */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Geçiş Fiyatı</label>
          <input type="number" value={deger.fiyat || 0} onChange={(e) => guncelle("fiyat", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Para Birimi</label>
          <select value={deger.para_birimi || "TL"} onChange={(e) => guncelle("para_birimi", e.target.value)} className={KUCUK_INPUT + " w-full"}>
            <option value="TL">TL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Kampanya Koşul Builder (if-else style)       */
/* ============================================= */

const KOSUL_TIPLERI = [
  { id: "urun_adedi", ad: "Ürün Adedi", tip: "sayi" },
  { id: "toplam_tutar", ad: "Toplam Tutar", tip: "sayi" },
  { id: "musteri_tipi", ad: "Müşteri Tipi", tip: "secim", secenekler: ["Bayi", "Son Kullanıcı", "Kurumsal"] },
  { id: "periyot", ad: "Periyot", tip: "secim", secenekler: ["Aylık", "Yıllık"] },
  { id: "ilk_alis", ad: "İlk Alış mı?", tip: "boolean" },
  { id: "bitis_gunu", ad: "Kampanya Tarihi İçinde", tip: "tarih" },
];

const OPERATORLER = {
  sayi: [
    { id: ">=", ad: ">=" },
    { id: "<=", ad: "<=" },
    { id: "==", ad: "=" },
    { id: ">", ad: ">" },
    { id: "<", ad: "<" },
  ],
  secim: [
    { id: "==", ad: "=" },
    { id: "!=", ad: "!=" },
  ],
  boolean: [
    { id: "==", ad: "=" },
  ],
  tarih: [
    { id: "<=", ad: "Önce" },
  ],
};

function KampanyaKosulBuilder({ deger: rawDeger, guncelle }) {
  const deger = rawDeger || {};
  const kosullar = deger.kosullar || [];
  const [acikIdx, setAcikIdx] = useState(null);

  const kosulEkle = () => {
    guncelle("kosullar", [...kosullar, { tip: "urun_adedi", operator: ">=", deger: "", mantik: "VE" }]);
  };

  const kosulSil = (idx) => {
    guncelle("kosullar", kosullar.filter((_, i) => i !== idx));
  };

  const kosulGuncelle = (idx, alan, val) => {
    const yeni = kosullar.map((k, i) => (i === idx ? { ...k, [alan]: val } : k));
    guncelle("kosullar", yeni);
  };

  return (
    <div className="space-y-3">
      {/* Kampanya Adı & İndirim */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Kampanya Adı</label>
          <input type="text" value={deger.ad || ""} onChange={(e) => guncelle("ad", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Örn: Yılbaşı Kampanyası" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">İndirim Oranı (%)</label>
          <input type="number" value={deger.indirim_orani || 0} onChange={(e) => guncelle("indirim_orani", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} max={100} />
        </div>
      </div>

      {/* Koşullar Başlığı */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
        <span className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">Koşullar</span>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">(Tümü sağlanmalı)</span>
      </div>

      {/* Koşul Listesi */}
      {kosullar.map((k, idx) => {
        const tipBilgi = KOSUL_TIPLERI.find((t) => t.id === k.tip) || KOSUL_TIPLERI[0];
        const operatorler = OPERATORLER[tipBilgi.tip] || OPERATORLER.sayi;
        
        return (
          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-500/5 border border-slate-200 dark:border-slate-500/10">
            {idx > 0 && (
              <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 px-1.5 py-0.5 rounded">VE</span>
            )}
            
            {/* Koşul Tipi */}
            <select value={k.tip} onChange={(e) => kosulGuncelle(idx, "tip", e.target.value)} className={KUCUK_INPUT + " w-32"}>
              {KOSUL_TIPLERI.map((t) => <option key={t.id} value={t.id}>{t.ad}</option>)}
            </select>

            {/* Operator */}
            <select value={k.operator} onChange={(e) => kosulGuncelle(idx, "operator", e.target.value)} className={KUCUK_INPUT + " w-16"}>
              {operatorler.map((o) => <option key={o.id} value={o.id}>{o.ad}</option>)}
            </select>

            {/* Değer */}
            {tipBilgi.tip === "sayi" && (
              <input type="number" value={k.deger || ""} onChange={(e) => kosulGuncelle(idx, "deger", e.target.value)} className={KUCUK_INPUT + " w-24"} placeholder="Değer" />
            )}
            {tipBilgi.tip === "secim" && (
              <select value={k.deger} onChange={(e) => kosulGuncelle(idx, "deger", e.target.value)} className={KUCUK_INPUT + " w-32"}>
                <option value="">Seçin</option>
                {tipBilgi.secenekler?.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {tipBilgi.tip === "boolean" && (
              <select value={k.deger} onChange={(e) => kosulGuncelle(idx, "deger", e.target.value)} className={KUCUK_INPUT + " w-24"}>
                <option value="true">Evet</option>
                <option value="false">Hayır</option>
              </select>
            )}
            {tipBilgi.tip === "tarih" && (
              <input type="date" value={k.deger || ""} onChange={(e) => kosulGuncelle(idx, "deger", e.target.value)} className={KUCUK_INPUT + " w-32"} />
            )}

            <div className="flex-1" />
            <button onClick={() => kosulSil(idx)}
              className="w-6 h-6 rounded hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* Koşul Ekle */}
      <button onClick={kosulEkle}
        className="inline-flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Koşul Ekle
      </button>

      {/* Bitiş Tarihi */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/5">
        <div className="w-48">
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Kampanya Bitiş Tarihi</label>
          <input type="date" value={deger.bitis_tarihi || ""} onChange={(e) => guncelle("bitis_tarihi", e.target.value)} className={KUCUK_INPUT + " w-full"} />
        </div>
      </div>
    </div>
  );
}
