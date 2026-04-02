/* ============================================= */
/*  Güzel Teknoloji - Raporlar Sayfası            */
/*  Sekmeler: Satışlar, Aktif Paketler,           */
/*  Aktif Cihazlar, Süresi Yaklaşanlar,           */
/*  Süresi Bitenler, Tahsilatlar                   */
/*  Gece/Gündüz modu destekli                     */
/* ============================================= */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import KopyalaButonu from "../bilesenler/KopyalaButonu";
import { apiGet } from "../yardimcilar/api";

/* ============================================= */
/*  Sabitler                                      */
/* ============================================= */

const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

/* ---- Excel (CSV) Dışa Aktarma ---- */
const excelAktar = (veri, sutunlar, dosyaAdi) => {
  const bom = "\uFEFF";
  const basliklar = sutunlar.map((s) => s.baslik).join(";");
  const satirlar = veri.map((item) =>
    sutunlar.map((s) => {
      let deger = String(s.al(item) ?? "");
      if (deger.includes(";") || deger.includes('"') || deger.includes("\n")) {
        deger = `"${deger.replace(/"/g, '""')}"`;
      }
      return deger;
    }).join(";")
  );
  const csv = bom + basliklar + "\n" + satirlar.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dosyaAdi}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const ExcelButonu = ({ onClick }) => (
  <button onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Excel'e Aktar
  </button>
);

/* ---- Sekme Tanımları ---- */
const SEKMELER = [
  {
    id: "satislar", etiket: "Satışlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    id: "aktifPaketler", etiket: "Aktif Paketler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    id: "aktifCihazlar", etiket: "Aktif Cihazlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    id: "suresiYaklasanlar", etiket: "Süresi Yaklaşanlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    id: "suresiBitenler", etiket: "Süresi Bitenler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
  },
  {
    id: "tahsilatlar", etiket: "Tahsilatlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
];

/* ============================================= */
/*  Ana Bileşen                                   */
/* ============================================= */

export default function RaporlarPage() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [aktifSekme, setAktifSekme] = useState(tabFromUrl || "satislar");

  // URL'den tab parametresi değişirse sekmeyi güncelle
  useEffect(() => {
    if (tabFromUrl && SEKMELER.some(s => s.id === tabFromUrl)) {
      setAktifSekme(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div>
      {/* ---- Sayfa Başlığı ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Satış, paket, cihaz ve tahsilat raporlarını inceleyin</p>
      </div>

      {/* ---- Sekme Navigasyonu ---- */}
      <div className="flex flex-wrap gap-1 p-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
        {SEKMELER.map((s) => (
          <button key={s.id} onClick={() => setAktifSekme(s.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              aktifSekme === s.id
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-white/10"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            }`}>
            {s.ikon}
            {s.etiket}
          </button>
        ))}
      </div>

      {/* ---- Sekme İçerikleri ---- */}
      {aktifSekme === "satislar" && <SatislarSekmesi />}
      {aktifSekme === "aktifPaketler" && <AktifPaketlerSekmesi />}
      {aktifSekme === "aktifCihazlar" && <AktifCihazlarSekmesi />}
      {aktifSekme === "suresiYaklasanlar" && <SuresiYaklasanlarSekmesi />}
      {aktifSekme === "suresiBitenler" && <SuresiBitenlerSekmesi />}
      {aktifSekme === "tahsilatlar" && <TahsilatlarSekmesi />}
    </div>
  );
}

/* ============================================= */
/*  Ortak Bileşenler                              */
/* ============================================= */

function OzetKart({ baslik, deger, ikon, renk }) {
  const renkler = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
    cyan: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20",
  };

  return (
    <div className={`rounded-xl border p-4 ${renkler[renk] || renkler.blue}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-center shrink-0">
          {ikon}
        </div>
        <div>
          <p className="text-xs font-medium opacity-70">{baslik}</p>
          <p className="text-lg font-bold">{deger}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Satışlar Sekmesi                              */
/* ============================================= */

function SatislarSekmesi() {
  const [arama, setArama] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const sayfaBasi = 10;
  const [veri, setVeri] = useState([]);

  useEffect(() => {
    apiGet("/raporlar/satislar").then((r) => r.basarili && setVeri(r.veri)).catch(() => {});
  }, []);

  const filtrelenmis = veri.filter((s) => {
    const aramaUygun = !arama || s.musteri.toLowerCase().includes(arama.toLowerCase()) || s.urun.toLowerCase().includes(arama.toLowerCase());
    const durumUygun = !filtreDurum || s.durum === filtreDurum;
    return aramaUygun && durumUygun;
  });

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaVeriler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const toplamCiro = veri.filter((s) => s.durum === "aktif").reduce((t, s) => t + Number(s.tutar), 0);
  const bekleyenTutar = veri.filter((s) => s.durum !== "aktif").reduce((t, s) => t + Number(s.tutar), 0);

  return (
    <div>
      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OzetKart baslik="Toplam Satış" deger={veri.length} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <OzetKart baslik="Toplam Ciro" deger={`₺${toplamCiro.toLocaleString("tr-TR")}`} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <OzetKart baslik="Bekleyen Tutar" deger={`₺${bekleyenTutar.toLocaleString("tr-TR")}`} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <OzetKart baslik="Tamamlanan" deger={veri.filter((s) => s.durum === "aktif").length} renk="violet"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>} />
      </div>

      {/* Filtre Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya ürün ara..." value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
          className={`${INPUT_STIL} !w-64`} />
        <select value={filtreDurum} onChange={(e) => { setFiltreDurum(e.target.value); setSayfa(1); }} className={`${INPUT_STIL} !w-44`}>
          <option value="">Tüm Durumlar</option>
          <option value="Tamamlandı">Tamamlandı</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="İptal">İptal</option>
        </select>
        {(arama || filtreDurum) && (
          <button onClick={() => { setArama(""); setFiltreDurum(""); setSayfa(1); }}
            className="text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 cursor-pointer">Sıfırla</button>
        )}
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Ünvanı", al: (s) => s.musteri },
          { baslik: "Ürün", al: (s) => s.urun },
          { baslik: "Paket", al: (s) => s.paket },
          { baslik: "Domain", al: (s) => s.domain || "" },
          { baslik: "Kullanıcı", al: (s) => s.kullanici || "" },
          { baslik: "Tutar", al: (s) => s.tutar },
          { baslik: "Tarih", al: (s) => s.tarih },
          { baslik: "Durum", al: (s) => s.durum },
        ], "satislar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      {/* Tablo */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Ünvanı", "Ürün", "Paket", "Domain", "Kullanıcı", "Tutar", "Tarih", "Durum"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaVeriler.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white text-xs">{s.musteri}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.urun}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.paket}</td>
                  <td className="px-3 py-3 text-xs max-w-[180px]"><span className="inline-flex items-center group truncate">{s.domain ? <span className="text-blue-600 dark:text-blue-400 truncate">{s.domain}</span> : <span className="text-gray-400 dark:text-slate-600">—</span>}<KopyalaButonu metin={s.domain} /></span></td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.kullanici || "—"}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white text-xs">₺{s.tutar.toLocaleString("tr-TR")}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.tarih}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.durum === "Tamamlandı" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : s.durum === "Bekliyor" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}>{s.durum}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sayfalama */}
      {toplamSayfa > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}-{Math.min(sayfa * sayfaBasi, filtrelenmis.length)} arası</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa >= toplamSayfa}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  Aktif Paketler Sekmesi                        */
/* ============================================= */

function AktifPaketlerSekmesi() {
  const [arama, setArama] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const sayfaBasi = 10;
  const [veri, setVeri] = useState([]);

  useEffect(() => {
    apiGet("/raporlar/aktif-paketler").then((r) => r.basarili && setVeri(r.veri)).catch(() => {});
  }, []);

  const filtrelenmis = veri.filter((p) =>
    !arama || p.musteri.toLowerCase().includes(arama.toLowerCase()) || p.urun.toLowerCase().includes(arama.toLowerCase()) || (p.paketAdi || "").toLowerCase().includes(arama.toLowerCase())
  );

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaVeriler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);
  const toplamKullanici = veri.reduce((t, p) => t + Number(p.kullaniciSayisi || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Aktif Paket" deger={veri.length} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        <OzetKart baslik="Toplam Kullanıcı" deger={toplamKullanici} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <OzetKart baslik="Ortalama Kalan Gün" deger={veri.length ? Math.round(veri.reduce((t, p) => t + Number(p.kalanGun || 0), 0) / veri.length) : 0} renk="violet"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri, ürün veya paket ara..." value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
          className={`${INPUT_STIL} !w-72`} />
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (p) => p.musteri },
          { baslik: "Ürün", al: (p) => p.urun },
          { baslik: "Paket Adı", al: (p) => p.paketAdi },
          { baslik: "Başlangıç", al: (p) => p.baslangic },
          { baslik: "Bitiş", al: (p) => p.bitis },
          { baslik: "Kalan Gün", al: (p) => p.kalanGun },
          { baslik: "Kullanıcı Sayısı", al: (p) => p.kullaniciSayisi },
        ], "aktif_paketler")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Ürün", "Paket Adı", "Başlangıç", "Bitiş", "Kalan Gün", "Kullanıcı"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaVeriler.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{p.musteri}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.urun}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.paketAdi}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.baslangic}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.bitis}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      p.kalanGun > 180 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : p.kalanGun > 60 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}>{p.kalanGun} gün</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm text-center">{p.kullaniciSayisi || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toplamSayfa > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}-{Math.min(sayfa * sayfaBasi, filtrelenmis.length)} arası</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa >= toplamSayfa}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  Aktif Cihazlar Sekmesi                        */
/* ============================================= */

function AktifCihazlarSekmesi() {
  const [arama, setArama] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");
  const [veri, setVeri] = useState([]);

  useEffect(() => {
    apiGet("/raporlar/aktif-cihazlar").then((r) => r.basarili && setVeri(r.veri)).catch(() => {});
  }, []);

  const filtrelenmis = veri.filter((c) => {
    const aramaUygun = !arama || (c.musteri || "").toLowerCase().includes(arama.toLowerCase()) || (c.bilgisayarAdi || "").toLowerCase().includes(arama.toLowerCase()) || (c.ipAdresi || "").includes(arama);
    const durumUygun = !filtreDurum || c.durum === filtreDurum;
    return aramaUygun && durumUygun;
  });

  const cevrimici = veri.filter((c) => c.durum === "Çevrimiçi").length;
  const cevrimdisi = veri.filter((c) => c.durum === "Çevrimdışı").length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Toplam Cihaz" deger={veri.length} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
        <OzetKart baslik="Çevrimiçi" deger={cevrimici} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a4 4 0 010-7.656m5.656 0a4 4 0 010 7.656" /></svg>} />
        <OzetKart baslik="Çevrimdışı" deger={cevrimdisi} renk="red"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri, bilgisayar veya IP ara..." value={arama} onChange={(e) => setArama(e.target.value)}
          className={`${INPUT_STIL} !w-64`} />
        <select value={filtreDurum} onChange={(e) => setFiltreDurum(e.target.value)} className={`${INPUT_STIL} !w-44`}>
          <option value="">Tüm Durumlar</option>
          <option value="Çevrimiçi">Çevrimiçi</option>
          <option value="Çevrimdışı">Çevrimdışı</option>
        </select>
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (c) => c.musteri },
          { baslik: "Bilgisayar Adı", al: (c) => c.bilgisayarAdi },
          { baslik: "IP Adresi", al: (c) => c.ipAdresi },
          { baslik: "İşlemci No", al: (c) => c.islemciNo },
          { baslik: "Sürüm", al: (c) => c.surum },
          { baslik: "Aktivasyon Zamanı", al: (c) => c.aktivasyonZamani },
          { baslik: "Son Bağlantı", al: (c) => c.sonBaglanti },
          { baslik: "Durum", al: (c) => c.durum },
        ], "aktif_cihazlar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Bilgisayar Adı", "IP Adresi", "İşlemci No", "Sürüm", "Aktivasyon Zamanı", "Son Bağlantı", "Durum"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtrelenmis.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white text-xs">{c.musteri}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-mono text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded">{c.bilgisayarAdi}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs font-mono"><span className="inline-flex items-center group">{c.ipAdresi}<KopyalaButonu metin={c.ipAdresi} /></span></td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs font-mono"><span className="inline-flex items-center group">{c.islemciNo}<KopyalaButonu metin={c.islemciNo} /></span></td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">{c.surum}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{c.aktivasyonZamani}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{c.sonBaglanti}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.durum === "Çevrimiçi" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.durum === "Çevrimiçi" ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                      {c.durum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Süresi Yaklaşanlar Sekmesi                    */
/* ============================================= */

function SuresiYaklasanlarSekmesi() {
  const [arama, setArama] = useState("");
  const [kritikEsik, setKritikEsik] = useState(7);
  const [veri, setVeri] = useState([]);

  useEffect(() => {
    apiGet("/raporlar/suresi-yaklasanlar").then((r) => r.basarili && setVeri(r.veri)).catch(() => {});
  }, []);

  const filtrelenmis = veri.filter((s) =>
    !arama || (s.musteri || "").toLowerCase().includes(arama.toLowerCase()) || (s.urun || "").toLowerCase().includes(arama.toLowerCase())
  ).sort((a, b) => a.kalanGun - b.kalanGun);

  const kritik = veri.filter((s) => s.kalanGun <= kritikEsik).length;
  const uyari = veri.filter((s) => s.kalanGun > kritikEsik && s.kalanGun <= kritikEsik * 2).length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Toplam Yaklaşan" deger={veri.length} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <div className="rounded-xl border p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium opacity-70">Kritik</p>
                <select value={kritikEsik} onChange={(e) => setKritikEsik(Number(e.target.value))}
                  className="text-xs rounded-md border border-red-300 dark:border-red-500/30 bg-white dark:bg-white/10 text-red-700 dark:text-red-400 px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-400">
                  <option value={5}>≤5 gün</option>
                  <option value={7}>≤7 gün</option>
                  <option value={10}>≤10 gün</option>
                  <option value={15}>≤15 gün</option>
                  <option value={20}>≤20 gün</option>
                  <option value={30}>≤30 gün</option>
                </select>
              </div>
              <p className="text-lg font-bold">{kritik}</p>
            </div>
          </div>
        </div>
        <OzetKart baslik={`Uyarı (${kritikEsik + 1}-${kritikEsik * 2} gün)`} deger={uyari} renk="cyan"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya ürün ara..." value={arama} onChange={(e) => setArama(e.target.value)}
          className={`${INPUT_STIL} !w-64`} />
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (s) => s.musteri },
          { baslik: "Ürün", al: (s) => s.urun },
          { baslik: "Paket", al: (s) => s.paket },
          { baslik: "Bitiş Tarihi", al: (s) => s.bitis },
          { baslik: "Kalan Gün", al: (s) => s.kalanGun },
        ], "suresi_yaklasanlar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Ürün", "Paket", "Bitiş Tarihi", "Kalan Gün"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtrelenmis.map((s) => (
                <tr key={s.id} className={`transition-colors ${s.kalanGun <= kritikEsik ? "bg-red-50/50 dark:bg-red-500/[0.03]" : s.kalanGun <= kritikEsik * 2 ? "bg-amber-50/50 dark:bg-amber-500/[0.03]" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{s.musteri}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.urun}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.paket}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.bitis}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      s.kalanGun <= kritikEsik ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      : s.kalanGun <= kritikEsik * 2 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                    }`}>{s.kalanGun} gün</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Süresi Bitenler Sekmesi                       */
/* ============================================= */

function SuresiBitenlerSekmesi() {
  const [arama, setArama] = useState("");
  const [veri, setVeri] = useState([]);

  useEffect(() => {
    apiGet("/raporlar/suresi-bitenler").then((r) => r.basarili && setVeri(r.veri)).catch(() => {});
  }, []);

  const filtrelenmis = veri.filter((s) =>
    !arama || (s.musteri || "").toLowerCase().includes(arama.toLowerCase()) || (s.urun || "").toLowerCase().includes(arama.toLowerCase())
  ).sort((a, b) => b.gecenGun - a.gecenGun);

  const toplamGecen30 = veri.filter((s) => s.gecenGun > 30).length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Süresi Biten" deger={veri.length} renk="red"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
        <OzetKart baslik="30+ Gün Geçen" deger={toplamGecen30} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        <OzetKart baslik="Son 2 Hafta" deger={veri.filter((s) => s.gecenGun <= 14).length} renk="cyan"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya ürün ara..." value={arama} onChange={(e) => setArama(e.target.value)}
          className={`${INPUT_STIL} !w-64`} />
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (s) => s.musteri },
          { baslik: "Ürün", al: (s) => s.urun },
          { baslik: "Paket", al: (s) => s.paket },
          { baslik: "Bitiş Tarihi", al: (s) => s.bitis },
          { baslik: "Geçen Gün", al: (s) => s.gecenGun },
        ], "suresi_bitenler")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Ürün", "Paket", "Bitiş Tarihi", "Geçen Gün", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtrelenmis.map((s) => (
                <tr key={s.id} className={`transition-colors ${s.gecenGun > 30 ? "bg-red-50/50 dark:bg-red-500/[0.03]" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{s.musteri}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.urun}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.paket}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.bitis}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      s.gecenGun > 30 ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    }`}>{s.gecenGun} gün</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer">
                      Yenile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Tahsilatlar Sekmesi                           */
/* ============================================= */

function TahsilatlarSekmesi() {
  const [arama, setArama] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");
  const [filtreYontem, setFiltreYontem] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const sayfaBasi = 10;
  const [veri, setVeri] = useState([]);

  useEffect(() => {
    apiGet("/raporlar/tahsilatlar").then((r) => r.basarili && setVeri(r.veri)).catch(() => {});
  }, []);

  const filtrelenmis = veri.filter((t) => {
    const aramaUygun = !arama || (t.musteri || "").toLowerCase().includes(arama.toLowerCase()) || (t.faturaNo || "").toLowerCase().includes(arama.toLowerCase());
    const durumUygun = !filtreDurum || t.durum === filtreDurum;
    const yontemUygun = !filtreYontem || t.yontem === filtreYontem;
    return aramaUygun && durumUygun && yontemUygun;
  });

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaVeriler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const odenen = veri.filter((t) => t.durum === "Ödendi").reduce((t, s) => t + Number(s.tutar || 0), 0);
  const bekleyen = veri.filter((t) => t.durum === "Bekliyor").reduce((t, s) => t + Number(s.tutar || 0), 0);
  const gecikmis = veri.filter((t) => t.durum === "Gecikmiş").reduce((t, s) => t + Number(s.tutar || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OzetKart baslik="Toplam Tahsilat" deger={veri.length} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <OzetKart baslik="Ödenen" deger={`₺${odenen.toLocaleString("tr-TR")}`} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>} />
        <OzetKart baslik="Bekleyen" deger={`₺${bekleyen.toLocaleString("tr-TR")}`} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <OzetKart baslik="Gecikmiş" deger={`₺${gecikmis.toLocaleString("tr-TR")}`} renk="red"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya fatura no ara..." value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
          className={`${INPUT_STIL} !w-64`} />
        <select value={filtreDurum} onChange={(e) => { setFiltreDurum(e.target.value); setSayfa(1); }} className={`${INPUT_STIL} !w-40`}>
          <option value="">Tüm Durumlar</option>
          <option value="Ödendi">Ödendi</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="Kısmi">Kısmi Ödeme</option>
        </select>
        <select value={filtreYontem} onChange={(e) => { setFiltreYontem(e.target.value); setSayfa(1); }} className={`${INPUT_STIL} !w-40`}>
          <option value="">Tüm Yöntemler</option>
          <option value="Nakit">Nakit</option>
          <option value="Havale">Havale</option>
          <option value="EFT">EFT</option>
          <option value="Kredi Kartı">Kredi Kartı</option>
          <option value="Çek">Çek</option>
          <option value="Senet">Senet</option>
          <option value="Diğer">Diğer</option>
        </select>
        {(arama || filtreDurum || filtreYontem) && (
          <button onClick={() => { setArama(""); setFiltreDurum(""); setFiltreYontem(""); setSayfa(1); }}
            className="text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 cursor-pointer">Sıfırla</button>
        )}
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (t) => t.musteri },
          { baslik: "Fatura No", al: (t) => t.faturaNo },
          { baslik: "Tutar", al: (t) => t.tutar },
          { baslik: "Ödeme Tarihi", al: (t) => t.odemeTarihi },
          { baslik: "Yöntem", al: (t) => t.yontem },
          { baslik: "Durum", al: (t) => t.durum },
        ], "tahsilatlar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Fatura No", "Tutar", "Ödeme Tarihi", "Yöntem", "Durum"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaVeriler.map((t) => (
                <tr key={t.id} className={`transition-colors ${t.durum === "Gecikmiş" ? "bg-red-50/50 dark:bg-red-500/[0.03]" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{t.musteri}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center group">
                      <span className="text-sm font-mono text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">{t.faturaNo}</span>
                      <KopyalaButonu metin={t.faturaNo} />
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">₺{t.tutar.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{t.odemeTarihi}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      t.yontem === "Havale" || t.yontem === "EFT" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : t.yontem === "Kredi Kartı" ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"
                      : t.yontem === "Nakit" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : t.yontem === "Çek" || t.yontem === "Senet" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
                    }`}>{t.yontem}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      t.durum === "Ödendi" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : t.durum === "Kısmi" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400"
                      : t.durum === "Bekliyor" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}>{t.durum}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toplamSayfa > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}-{Math.min(sayfa * sayfaBasi, filtrelenmis.length)} arası</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa >= toplamSayfa}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      )}
    </div>
  );
}
