/* ============================================= */
/*  Güzel Teknoloji - Dashboard Ana Sayfa (Özet) */
/*  Genel bakış kartları, grafikler (recharts),  */
/*  hızlı aksiyonlar ve son işlemler tablosu     */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ============================================= */
/*  Mock Veri — Backend gelene kadar demo          */
/* ============================================= */

/** Aylara göre lisans satış verileri */
const AYLIK_LISANS_SATISLARI = [
  { ay: "Oca", satis: 12 },
  { ay: "Şub", satis: 19 },
  { ay: "Mar", satis: 15 },
  { ay: "Nis", satis: 22 },
  { ay: "May", satis: 18 },
  { ay: "Haz", satis: 25 },
  { ay: "Tem", satis: 30 },
  { ay: "Ağu", satis: 28 },
  { ay: "Eyl", satis: 20 },
  { ay: "Eki", satis: 24 },
  { ay: "Kas", satis: 17 },
  { ay: "Ara", satis: 21 },
];

/** Müşteri dağılımı (tip bazında) */
const MUSTERI_DAGILIMI = [
  { ad: "Tüzel", deger: 148 },
  { ad: "Gerçek", deger: 85 },
  { ad: "Yabancı", deger: 15 },
];
const PIE_RENKLERI = ["#3b82f6", "#10b981", "#f59e0b"];

/** Son eklenen müşteriler */
const SON_MUSTERILER = [
  { id: 1, ad: "ABC Teknoloji A.Ş.", tur: "Tüzel", tarih: "2026-03-22" },
  { id: 2, ad: "Mehmet Yılmaz", tur: "Gerçek", tarih: "2026-03-21" },
  { id: 3, ad: "Veri Sistemleri Ltd.", tur: "Tüzel", tarih: "2026-03-20" },
  { id: 4, ad: "Ayşe Kara", tur: "Gerçek", tarih: "2026-03-18" },
  { id: 5, ad: "Global Trade Inc.", tur: "Yabancı", tarih: "2026-03-17" },
];

/** Son güncellenen lisanslar */
const SON_LISANSLAR = [
  { id: 1, musteri: "ABC Teknoloji A.Ş.", paket: "Vega E-Dönüşüm", tarih: "2026-03-22", islem: "Yenilendi" },
  { id: 2, musteri: "Mega Bilişim A.Ş.", paket: "Vega İK Modülü", tarih: "2026-03-21", islem: "Oluşturuldu" },
  { id: 3, musteri: "Ercan Güzel", paket: "Vega Muhasebe Pro", tarih: "2026-03-19", islem: "Yenilendi" },
  { id: 4, musteri: "Anadolu Teknoloji", paket: "Vega Stok Yönetimi", tarih: "2026-03-18", islem: "Donduruldu" },
  { id: 5, musteri: "Ayşe Kara", paket: "Vega CRM Lite", tarih: "2026-03-16", islem: "Yenilendi" },
];

/* ============================================= */
/*  Yardımcı: Tooltip özelleştirme                */
/* ============================================= */

function GrafikTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
      <p className="text-blue-600 dark:text-blue-400">{payload[0].value} lisans</p>
    </div>
  );
}

function PastaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{payload[0].name}</p>
      <p className="text-gray-600 dark:text-slate-300">{payload[0].value} müşteri</p>
    </div>
  );
}

/* ============================================= */
/*  Ana Bileşen                                    */
/* ============================================= */

export default function DashboardHome() {
  const navigate = useNavigate();

  /** Son işlemler sekmesi (müşteriler / lisanslar) */
  const [sonIslemSekme, setSonIslemSekme] = useState("musteriler");

  /* ---- Özet Kartları ---- */
  const ozetKartlari = [
    {
      baslik: "Toplam Müşteri",
      deger: "248",
      degisim: "+12 bu ay",
      degisimPositif: true,
      renk: "from-blue-600 to-blue-400",
      ikonBg: "bg-blue-100 dark:bg-blue-500/20",
      ikonRenk: "text-blue-600 dark:text-blue-400",
      yol: "/dashboard/musteriler",
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
    {
      baslik: "Toplam Aktif Bayi",
      deger: "64",
      degisim: "+3 bu ay",
      degisimPositif: true,
      renk: "from-emerald-600 to-emerald-400",
      ikonBg: "bg-emerald-100 dark:bg-emerald-500/20",
      ikonRenk: "text-emerald-600 dark:text-emerald-400",
      yol: "/dashboard/bayiler",
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
    },
    {
      baslik: "Toplam Aktif Lisans",
      deger: "186",
      degisim: "+8 bu ay",
      degisimPositif: true,
      renk: "from-violet-600 to-violet-400",
      ikonBg: "bg-violet-100 dark:bg-violet-500/20",
      ikonRenk: "text-violet-600 dark:text-violet-400",
      yol: "/dashboard/yonetim/lisanslar",
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
      ),
    },
    {
      baslik: "Bu Ay Biten Lisanslar",
      deger: "7",
      degisim: "Acil yenileme gerekli",
      degisimPositif: false,
      renk: "from-red-600 to-red-400",
      ikonBg: "bg-red-100 dark:bg-red-500/20",
      ikonRenk: "text-red-600 dark:text-red-400",
      yol: "/dashboard/yonetim/lisanslar",
      vurgulu: true,
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      ),
    },
  ];

  /* ---- Hızlı Aksiyon Butonları ---- */
  const hizliAksiyonlar = [
    {
      baslik: "Yeni Müşteri Ekle",
      aciklama: "Tüzel, gerçek veya yabancı müşteri kaydı oluşturun",
      yol: "/dashboard/musteri-ekle",
      renk: "bg-blue-600 hover:bg-blue-700",
      ikon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      ),
    },
    {
      baslik: "Lisans Yenile",
      aciklama: "Mevcut bir lisansın süresini uzatın",
      yol: "/dashboard/yonetim/lisanslar",
      renk: "bg-emerald-600 hover:bg-emerald-700",
      ikon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
      ),
    },
    {
      baslik: "Yeni Bayi Ekle",
      aciklama: "Sisteme yeni bir bayi tanımlayın",
      yol: "/dashboard/bayiler",
      renk: "bg-violet-600 hover:bg-violet-700",
      ikon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21" />
        </svg>
      ),
    },
    {
      baslik: "Raporları Gör",
      aciklama: "Detaylı istatistik ve grafikler",
      yol: null,
      renk: "bg-amber-600 hover:bg-amber-700",
      ikon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
  ];

  /* ---- İşlem rozetleri ---- */
  const islemRozeti = (islem) => {
    const harita = {
      Yenilendi: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      Oluşturuldu: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
      Donduruldu: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400",
    };
    return harita[islem] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400";
  };

  const turRozeti = (tur) => {
    const harita = {
      Tüzel: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
      Gerçek: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      Yabancı: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
    return harita[tur] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400";
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* =========== BAŞLIK =========== */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Genel Özet</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Hoş geldiniz! İşte bugünkü genel durumunuz.
        </p>
      </div>

      {/* =========== ÜST KARTLAR =========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {ozetKartlari.map((kart) => (
          <div
            key={kart.baslik}
            onClick={() => kart.yol && navigate(kart.yol)}
            className={`group relative overflow-hidden rounded-xl bg-white dark:bg-white/5 p-5 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
              kart.vurgulu
                ? "border-2 border-red-300 dark:border-red-500/40 ring-1 ring-red-200 dark:ring-red-500/20"
                : "border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            }`}
          >
            {/* Arka plan süs dairesi */}
            <div
              className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-linear-to-br ${kart.renk} opacity-10 group-hover:opacity-20 transition-opacity`}
            />

            <div className="flex items-start justify-between relative">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {kart.baslik}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kart.deger}</p>
                <p
                  className={`text-xs font-medium ${
                    kart.degisimPositif
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {kart.degisim}
                </p>
              </div>

              {/* İkon */}
              <div className={`shrink-0 w-11 h-11 rounded-lg ${kart.ikonBg} flex items-center justify-center ${kart.ikonRenk}`}>
                {kart.ikon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =========== GRAFİKLER =========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ---- Bar Chart: Aylara Göre Lisans Satışı ---- */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Aylara Göre Lisans Satışı
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AYLIK_LISANS_SATISLARI} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" />
                <XAxis
                  dataKey="ay"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-gray-500 dark:text-slate-400"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-gray-500 dark:text-slate-400"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<GrafikTooltip />} cursor={{ fill: "rgba(59,130,246,0.08)" }} />
                <Bar dataKey="satis" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---- Pie Chart: Müşteri Dağılımı ---- */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Müşteri Dağılımı
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MUSTERI_DAGILIMI}
                  dataKey="deger"
                  nameKey="ad"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {MUSTERI_DAGILIMI.map((_, i) => (
                    <Cell key={i} fill={PIE_RENKLERI[i]} />
                  ))}
                </Pie>
                <Tooltip content={<PastaTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-gray-600 dark:text-slate-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =========== HIZLI AKSİYONLAR =========== */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Hızlı Aksiyonlar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hizliAksiyonlar.map((aksiyon) => (
            <button
              key={aksiyon.baslik}
              onClick={() => aksiyon.yol && navigate(aksiyon.yol)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white text-sm font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${aksiyon.renk} ${!aksiyon.yol ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={!aksiyon.yol}
            >
              {aksiyon.ikon}
              <div className="text-left">
                <p className="font-semibold">{aksiyon.baslik}</p>
                <p className="text-xs text-white/70">{aksiyon.aciklama}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* =========== SON İŞLEMLER =========== */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
        {/* Sekme Başlıkları */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Son İşlemler</h2>
          <div className="flex rounded-lg bg-gray-100 dark:bg-white/5 p-0.5">
            <button
              onClick={() => setSonIslemSekme("musteriler")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sonIslemSekme === "musteriler"
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              Son Müşteriler
            </button>
            <button
              onClick={() => setSonIslemSekme("lisanslar")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sonIslemSekme === "lisanslar"
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              Son Lisanslar
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          {sonIslemSekme === "musteriler" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Eklenme Tarihi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {SON_MUSTERILER.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">
                      {m.ad}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${turRozeti(m.tur)}`}>
                        {m.tur}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400">{m.tarih}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Paket
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    İşlem
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {SON_LISANSLAR.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">
                      {l.musteri}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-slate-300">{l.paket}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${islemRozeti(l.islem)}`}>
                        {l.islem}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400">{l.tarih}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
