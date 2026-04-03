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

const OZELLIK_TIPLERI = [
  {
    id: "temel_fiyat",
    ad: "Temel Fiyat",
    ikon: "₺",
    renk: "emerald",
    aciklama: "Sabit ürün fiyatı",
    varsayilan: { fiyat: 0, para_birimi: "TL" },
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
    id: "kademeli_adet",
    ad: "Kademeli Fiyat (Adet)",
    ikon: "📊",
    renk: "violet",
    aciklama: "Kontör/adet bazlı kademe fiyatlandırma",
    varsayilan: { kademeler: [{ adet: 0, fiyat: 0 }], birim: "Adet" },
  },
  {
    id: "kademeli_kapasite",
    ad: "Kademeli Fiyat (Kapasite)",
    ikon: "💾",
    renk: "cyan",
    aciklama: "GB/TB bazlı kademe fiyatlandırma",
    varsayilan: { kademeler: [{ kapasite: "", fiyat: 0 }], birim: "GB" },
  },
  {
    id: "hediye_urun",
    ad: "Hediye Ürün",
    ikon: "🎁",
    renk: "pink",
    aciklama: "Bu ürünü alana hediye ürün",
    varsayilan: { urun_adi: "", miktar: 1, aciklama: "" },
  },
  {
    id: "paket_indirimi",
    ad: "Paket İndirimi",
    ikon: "📦",
    renk: "amber",
    aciklama: "Başka ürünlerle alınca toplu indirim",
    varsayilan: { birlikte_urunler: "", indirim_orani: 0, aciklama: "" },
  },
  {
    id: "yillik_indirim",
    ad: "Yıllık İndirim Oranı",
    ikon: "📅",
    renk: "teal",
    aciklama: "Yıllık alıma özel indirim",
    varsayilan: { oran: 0, aciklama: "" },
  },
  {
    id: "gecis_fiyati",
    ad: "Geçiş Fiyatı",
    ikon: "🔀",
    renk: "orange",
    aciklama: "Başka üründen geçiş yapana özel",
    varsayilan: { kaynak_urun: "", fiyat: 0, aciklama: "" },
  },
  {
    id: "kullanici_sayisi",
    ad: "Kullanıcı Sayısı",
    ikon: "👥",
    renk: "indigo",
    aciklama: "Min/max kullanıcı ve ek kullanıcı ücreti",
    varsayilan: { min: 1, max: null, ek_kullanici_fiyat: 0 },
  },
  {
    id: "sicil_domain",
    ad: "Sicil No / Domain",
    ikon: "🌐",
    renk: "sky",
    aciklama: "Lisansa bağlı sicil no veya domain",
    varsayilan: { alan_tipi: "sicil_no", zorunlu: false },
  },
  {
    id: "domain_fiyat",
    ad: "Domain Uzantı Fiyatlandırma",
    ikon: "🌍",
    renk: "cyan",
    aciklama: "Her domain uzantısı için farklı fiyat (.com, .org, vb.)",
    varsayilan: { uzantilar: [{ uzanti: ".com", aktivasyon: 0, yenileme: 0 }], para_birimi: "TL" },
  },
  {
    id: "kdv",
    ad: "KDV Oranı",
    ikon: "🏛️",
    renk: "slate",
    aciklama: "Vergi oranı ve dahil/hariç seçimi",
    varsayilan: { oran: 20, dahil: false },
  },
  {
    id: "sure",
    ad: "Süre Seçenekleri",
    ikon: "⏱️",
    renk: "lime",
    aciklama: "Yıllık, aylık, adet bazlı süre",
    varsayilan: { tip: "yillik", deger: 1, birim: "yil" },
  },
  {
    id: "kampanya",
    ad: "Kampanya / Promosyon",
    ikon: "🏷️",
    renk: "rose",
    aciklama: "Özel kampanya tanımı",
    varsayilan: { ad: "", kosul: "", indirim_orani: 0, bitis_tarihi: "", aciklama: "" },
  },
  {
    id: "ek_kullanici_ucret",
    ad: "Ek Kullanıcı Ücreti",
    ikon: "👤",
    renk: "fuchsia",
    aciklama: "Kullanıcı başına ücret",
    varsayilan: { fiyat: 0, para_birimi: "TL" },
  },
  {
    id: "min_siparis",
    ad: "Minimum Sipariş",
    ikon: "📋",
    renk: "yellow",
    aciklama: "Minimum sipariş miktarı",
    varsayilan: { miktar: 1, birim: "adet" },
  },
  {
    id: "ozel_not",
    ad: "Özel Not / Açıklama",
    ikon: "📝",
    renk: "gray",
    aciklama: "Serbest metin alanı",
    varsayilan: { metin: "" },
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
    varsayilan: { urunler: [], zorunlu: true, aciklama: "" },
  },
  {
    id: "marka",
    ad: "Marka",
    ikon: "🏢",
    renk: "blue",
    aciklama: "Ürün markası bilgisi",
    varsayilan: { marka: "" },
  },
  {
    id: "ozel_alan",
    ad: "Özel Alan",
    ikon: "⚙️",
    renk: "neutral",
    aciklama: "İstediğin adı ve değeri gir",
    varsayilan: { alan_adi: "", alan_degeri: "" },
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
  });
  const [ozellikler, setOzellikler] = useState([]);
  const [urunGruplari, setUrunGruplari] = useState([]);
  const [urunTipleri, setUrunTipleri] = useState([]);
  const [uygulamaTipleri, setUygulamaTipleri] = useState([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [solPanelAcik, setSolPanelAcik] = useState(true);
  const [aramaMetni, setAramaMetni] = useState("");
  const sayac = useRef(0);

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

  /* Özellik sil */
  const ozellikSil = (key) => {
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
  const tip = OZELLIK_TIPLERI.find((t) => t.id === ozellik.ozellik_tipi);
  const r = getRenk(tip?.renk || "gray");

  return (
    <div className={`rounded-2xl border ${r.border} ${r.bg} overflow-hidden transition-all`}>
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
          <button onClick={sil}
            className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Widget İçerik */}
      {acik && (
        <div className="px-4 pb-4 pt-1">
          <OzellikFormu
            tip={ozellik.ozellik_tipi}
            deger={ozellik.deger}
            guncelle={degerGuncelle}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  Özellik Formları (her tip için ayrı)         */
/* ============================================= */

const KUCUK_INPUT = "px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

function OzellikFormu({ tip, deger, guncelle }) {
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

    case "kademeli_adet":
      return <KademeliForm deger={deger} guncelle={guncelle} birimLabel="Adet" birimKey="adet" />;

    case "kademeli_kapasite":
      return <KademeliForm deger={deger} guncelle={guncelle} birimLabel="Kapasite" birimKey="kapasite" />;

    case "hediye_urun":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Hediye Ürün Adı</label>
            <input type="text" value={deger.urun_adi || ""} onChange={(e) => guncelle("urun_adi", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Örn: E-Mutabakat" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Miktar</label>
            <input type="number" value={deger.miktar || 1} onChange={(e) => guncelle("miktar", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Açıklama</label>
            <input type="text" value={deger.aciklama || ""} onChange={(e) => guncelle("aciklama", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Opsiyonel not..." />
          </div>
        </div>
      );

    case "paket_indirimi":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Birlikte Alınacak Ürünler</label>
            <input type="text" value={deger.birlikte_urunler || ""} onChange={(e) => guncelle("birlikte_urunler", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Örn: E-Fatura, E-Arşiv" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">İndirim Oranı (%)</label>
              <input type="number" value={deger.indirim_orani || 0} onChange={(e) => guncelle("indirim_orani", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} max={100} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Açıklama</label>
              <input type="text" value={deger.aciklama || ""} onChange={(e) => guncelle("aciklama", e.target.value)} className={KUCUK_INPUT + " w-full"} />
            </div>
          </div>
        </div>
      );

    case "yillik_indirim":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">İndirim Oranı (%)</label>
            <input type="number" value={deger.oran || 0} onChange={(e) => guncelle("oran", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} max={100} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Açıklama</label>
            <input type="text" value={deger.aciklama || ""} onChange={(e) => guncelle("aciklama", e.target.value)} className={KUCUK_INPUT + " w-full"} />
          </div>
        </div>
      );

    case "gecis_fiyati":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Kaynak Ürün</label>
            <input type="text" value={deger.kaynak_urun || ""} onChange={(e) => guncelle("kaynak_urun", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Geçiş yapılacak ürün" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Geçiş Fiyatı</label>
            <input type="number" value={deger.fiyat || 0} onChange={(e) => guncelle("fiyat", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} step="0.01" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Açıklama</label>
            <input type="text" value={deger.aciklama || ""} onChange={(e) => guncelle("aciklama", e.target.value)} className={KUCUK_INPUT + " w-full"} />
          </div>
        </div>
      );

    case "kullanici_sayisi":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Min Kullanıcı</label>
            <input type="number" value={deger.min || 1} onChange={(e) => guncelle("min", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Max Kullanıcı</label>
            <input type="number" value={deger.max || ""} onChange={(e) => guncelle("max", e.target.value ? Number(e.target.value) : null)} placeholder="Sınırsız" className={KUCUK_INPUT + " w-full"} min={1} />
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

    case "kdv":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">KDV Oranı (%)</label>
            <input type="number" value={deger.oran ?? 20} onChange={(e) => guncelle("oran", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={0} max={100} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={deger.dahil || false} onChange={(e) => guncelle("dahil", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs text-gray-600 dark:text-slate-400">KDV Dahil</span>
            </label>
          </div>
        </div>
      );

    case "sure":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Süre Tipi</label>
            <select value={deger.tip || "yillik"} onChange={(e) => guncelle("tip", e.target.value)} className={KUCUK_INPUT + " w-full"}>
              <option value="yillik">Yıllık</option>
              <option value="aylik">Aylık</option>
              <option value="adet">Adet</option>
              <option value="sinirsiz">Sınırsız</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Değer</label>
            <input type="number" value={deger.deger || 1} onChange={(e) => guncelle("deger", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Birim</label>
            <select value={deger.birim || "yil"} onChange={(e) => guncelle("birim", e.target.value)} className={KUCUK_INPUT + " w-full"}>
              <option value="yil">Yıl</option>
              <option value="ay">Ay</option>
              <option value="gun">Gün</option>
              <option value="adet">Adet</option>
            </select>
          </div>
        </div>
      );

    case "kampanya":
      return (
        <div className="space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Koşul</label>
              <input type="text" value={deger.kosul || ""} onChange={(e) => guncelle("kosul", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Opsiyonel koşul" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Bitiş Tarihi</label>
              <input type="date" value={deger.bitis_tarihi || ""} onChange={(e) => guncelle("bitis_tarihi", e.target.value)} className={KUCUK_INPUT + " w-full"} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Açıklama</label>
            <input type="text" value={deger.aciklama || ""} onChange={(e) => guncelle("aciklama", e.target.value)} className={KUCUK_INPUT + " w-full"} />
          </div>
        </div>
      );

    case "ek_kullanici_ucret":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Kullanıcı Başı Fiyat</label>
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
      );

    case "min_siparis":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Minimum Miktar</label>
            <input type="number" value={deger.miktar || 1} onChange={(e) => guncelle("miktar", Number(e.target.value))} className={KUCUK_INPUT + " w-full"} min={1} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Birim</label>
            <select value={deger.birim || "adet"} onChange={(e) => guncelle("birim", e.target.value)} className={KUCUK_INPUT + " w-full"}>
              <option value="adet">Adet</option>
              <option value="paket">Paket</option>
              <option value="kullanici">Kullanıcı</option>
            </select>
          </div>
        </div>
      );

    case "ozel_not":
      return (
        <div>
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Not / Açıklama</label>
          <textarea value={deger.metin || ""} onChange={(e) => guncelle("metin", e.target.value)}
            className={KUCUK_INPUT + " w-full resize-none"} rows={3} placeholder="Serbest metin alanı..." />
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

    case "marka":
      return (
        <div className="w-64">
          <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Marka</label>
          <input type="text" value={deger.marka || ""} onChange={(e) => guncelle("marka", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Örn: VEGA, PAVO, INGENICO" />
        </div>
      );

    case "ozel_alan":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Alan Adı</label>
            <input type="text" value={deger.alan_adi || ""} onChange={(e) => guncelle("alan_adi", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Özellik adı" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Alan Değeri</label>
            <input type="text" value={deger.alan_degeri || ""} onChange={(e) => guncelle("alan_degeri", e.target.value)} className={KUCUK_INPUT + " w-full"} placeholder="Değer" />
          </div>
        </div>
      );

    default:
      return <p className="text-xs text-gray-400">Bilinmeyen özellik tipi: {tip}</p>;
  }
}

/* ============================================= */
/*  Kademeli Fiyat Formu (Ortak)                 */
/* ============================================= */

function KademeliForm({ deger, guncelle, birimLabel, birimKey }) {
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

function DomainFiyatFormu({ deger, guncelle }) {
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

function BagimliUrunFormu({ deger, guncelle }) {
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
        <div className="flex flex-wrap gap-1.5">
          {urunler.map((u, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-medium">
              {u.ad}
              <button onClick={() => urunKaldir(i)} className="ml-0.5 hover:text-red-900 dark:hover:text-red-300 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
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
          <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl">
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
