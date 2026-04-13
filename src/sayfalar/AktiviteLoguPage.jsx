/* ============================================= */
/*  Güzel Teknoloji - Aktivite Logu Sayfası      */
/*  Tüm kullanıcı işlemlerinin kronolojik listesi*/
/*  Filtreleme ve arama destekli                  */
/* ============================================= */

import { useState } from "react";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";

/* ---- Renk Yardımcıları ---- */
const renkSinif = (renk) => {
  const harita = {
    emerald: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
    red: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
    amber: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
    violet: "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300",
    cyan: "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
    orange: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400",
    gray: "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400",
  };
  return harita[renk] || harita.gray;
};

const ikonRenk = (renk) => {
  const harita = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    cyan: "bg-cyan-500",
    orange: "bg-orange-500",
    gray: "bg-gray-500",
  };
  return harita[renk] || harita.gray;
};

/* ---- Tür İkonları ---- */
const turIkonu = (tur) => {
  switch (tur) {
    case "musteri_ekleme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case "musteri_guncelleme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case "musteri_silme":
    case "toplu_silme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case "lisans_goruntuleme":
    case "lisans_olusturma":
    case "lisans_guncelleme":
    case "lisans_yenileme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "lisans_silme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case "lisans_dondurma":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "yedek_alma":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      );
    case "geri_yukleme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    case "log_silme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case "giris":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      );
    case "cikis":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      );
    case "bayi_ekleme":
    case "bayi_durum":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "bayi_silme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case "urun_ekleme":
    case "urun_guncelleme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case "urun_silme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case "paket_ekleme":
    case "paket_guncelleme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    case "paket_silme":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export default function AktiviteLoguPage() {
  const { loglar, logSil, TUR_ETIKETLERI } = useAktiviteLog();
  const [arama, setArama] = useState("");
  const [filtreTur, setFiltreTur] = useState("tumu");
  const [silmeModal, setSilmeModal] = useState(false);
  const [silmePeriyot, setSilmePeriyot] = useState("");
  const [silmeYukleniyor, setSilmeYukleniyor] = useState(false);
  const [silmeSonuc, setSilmeSonuc] = useState(null);
  const [tarihBaslangic, setTarihBaslangic] = useState("");
  const [tarihBitis, setTarihBitis] = useState("");

  const PERIYOTLAR = [
    { id: "bugun", etiket: "Bugünü Sil", aciklama: "Bugüne ait tüm loglar silinecek" },
    { id: "hafta", etiket: "Son 1 Hafta", aciklama: "Son 7 güne ait tüm loglar silinecek" },
    { id: "ay", etiket: "Son 1 Ay", aciklama: "Son 1 aya ait tüm loglar silinecek" },
    { id: "tumu", etiket: "Tümünü Sil", aciklama: "Tüm aktivite log kayıtları silinecek" },
  ];

  const silmeIslemi = async () => {
    setSilmeYukleniyor(true);
    setSilmeSonuc(null);
    try {
      const yanit = silmePeriyot === "aralik"
        ? await logSil("aralik", tarihBaslangic, tarihBitis)
        : await logSil(silmePeriyot);
      setSilmeSonuc({ tip: "basari", mesaj: yanit?.mesaj || "Loglar silindi." });
      setTimeout(() => { setSilmeModal(false); setSilmeSonuc(null); setSilmePeriyot(""); setTarihBaslangic(""); setTarihBitis(""); }, 1500);
    } catch {
      setSilmeSonuc({ tip: "hata", mesaj: "Silme işlemi başarısız oldu." });
    } finally {
      setSilmeYukleniyor(false);
    }
  };


  /* ---- Filtreleme ---- */
  const filtrelenmis = loglar.filter((log) => {
    const turUygun = filtreTur === "tumu" || log.tur === filtreTur;
    const aramaUygun = !arama || log.detay.toLowerCase().includes(arama.toLowerCase());
    return turUygun && aramaUygun;
  });

  /* ---- Tarih Formatlama ---- */
  const tarihFormatla = (iso) => {
    const t = new Date(iso);
    return t.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) +
      " " + t.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const gecenSure = (iso) => {
    const fark = Date.now() - new Date(iso).getTime();
    const dk = Math.floor(fark / 60000);
    if (dk < 1) return "Az önce";
    if (dk < 60) return `${dk} dk önce`;
    const saat = Math.floor(dk / 60);
    if (saat < 24) return `${saat} saat önce`;
    const gun = Math.floor(saat / 24);
    return `${gun} gün önce`;
  };

  /* ---- İstatistikler ---- */
  const istatistikler = [
    { etiket: "Toplam İşlem", deger: loglar.length, renk: "blue" },
    { etiket: "Ekleme", deger: loglar.filter((l) => l.tur === "musteri_ekleme" || l.tur === "bayi_ekleme").length, renk: "emerald" },
    { etiket: "Güncelleme", deger: loglar.filter((l) => l.tur === "musteri_guncelleme").length, renk: "blue" },
    { etiket: "Silme", deger: loglar.filter((l) => l.tur === "musteri_silme" || l.tur === "toplu_silme").length, renk: "red" },
    { etiket: "Yedekleme", deger: loglar.filter((l) => l.tur === "yedek_alma" || l.tur === "geri_yukleme").length, renk: "cyan" },
  ];

  return (
    <div>
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aktivite Logu</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Tüm işlemlerin kronolojik kaydı.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {istatistikler.map((ist) => (
          <div key={ist.etiket} className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{ist.etiket}</p>
            <p className={`text-2xl font-bold mt-1 ${
              ist.renk === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
              ist.renk === "red" ? "text-red-600 dark:text-red-400" :
              ist.renk === "cyan" ? "text-cyan-600 dark:text-cyan-400" :
              "text-blue-600 dark:text-blue-400"
            }`}>{ist.deger}</p>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filtreTur} onChange={(e) => setFiltreTur(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm cursor-pointer">
              <option value="tumu">Tüm İşlemler</option>
              {Object.entries(TUR_ETIKETLERI).map(([key, val]) => (
                <option key={key} value={key}>{val.etiket}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-slate-400">Ara:</span>
            <input type="text" value={arama} onChange={(e) => setArama(e.target.value)}
              placeholder="İşlem ara..." className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
          </div>
        </div>

        {/* Silme Butonları */}
        <div className="px-6 py-3 flex items-center gap-2 flex-wrap border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 mr-1">Log Temizle:</span>
          {PERIYOTLAR.map((p) => (
            <button key={p.id} onClick={() => { setSilmePeriyot(p.id); setSilmeSonuc(null); setSilmeModal(true); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                p.id === "tumu"
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10"
              }`}>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {p.etiket}
              </span>
            </button>
          ))}

          {/* Ayırıcı */}
          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1" />

          {/* Tarih Aralığı Silme */}
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={tarihBaslangic} onChange={(e) => setTarihBaslangic(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
            <input type="date" value={tarihBitis} onChange={(e) => setTarihBitis(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button
              onClick={() => {
                if (!tarihBaslangic || !tarihBitis) return;
                setSilmePeriyot("aralik");
                setSilmeSonuc(null);
                setSilmeModal(true);
              }}
              disabled={!tarihBaslangic || !tarihBitis}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Belirli Tarihi Sil
              </span>
            </button>
          </div>
        </div>

        {/* Log Listesi */}
        {filtrelenmis.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-slate-400">
              {loglar.length === 0 ? "Henüz aktivite kaydı bulunmamaktadır." : "Bu filtreye uygun kayıt bulunamadı."}
            </p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              {loglar.length === 0 ? "Müşteri işlemleri yaptıkça burası dolacak." : "Filtre ayarlarını değiştirmeyi deneyin."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {filtrelenmis.map((log) => {
              const turBilgi = TUR_ETIKETLERI[log.tur] || TUR_ETIKETLERI.diger;
              return (
                <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  {/* İkon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ikonRenk(turBilgi.renk)}`}>
                    {turIkonu(log.tur)}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${renkSinif(turBilgi.renk)}`}>
                        {turBilgi.etiket}
                      </span>
                      {/* Kullanıcı Bilgisi */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {log.kullanici_adi || "Bilinmiyor"}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{gecenSure(log.tarih)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{log.detay}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400 dark:text-slate-500">{tarihFormatla(log.tarih)}</p>
                      {log.kullanici_eposta && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {log.kullanici_eposta}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Silme Onay Modalı */}
      {silmeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6">
            {/* İkon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Emin misiniz?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-1">
              {silmePeriyot === "aralik"
                ? <><span className="font-semibold text-gray-700 dark:text-slate-200">{tarihBaslangic}</span> ile <span className="font-semibold text-gray-700 dark:text-slate-200">{tarihBitis}</span> tarihleri arasındaki tüm loglar silinecek.</>
                : <>{PERIYOTLAR.find((p) => p.id === silmePeriyot)?.aciklama || "Seçilen loglar silinecek"}.</>}
            </p>
            {silmePeriyot === "aralik" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center mb-1 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Başlangıç ve bitiş tarihleri dahildir.
              </p>
            )}
            <p className="text-sm text-center mb-6">
              <span className="text-red-500 dark:text-red-400 font-medium">Bu işlem geri alınamaz.</span>
            </p>

            {/* Sonuç Mesajı */}
            {silmeSonuc && (
              <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium text-center ${
                silmeSonuc.tip === "basari"
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
              }`}>
                {silmeSonuc.mesaj}
              </div>
            )}

            {/* Butonlar */}
            <div className="flex gap-3">
              <button onClick={() => { setSilmeModal(false); setSilmeSonuc(null); setSilmePeriyot(""); setTarihBaslangic(""); setTarihBitis(""); }}
                disabled={silmeYukleniyor}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50">
                İptal
              </button>
              <button onClick={silmeIslemi} disabled={silmeYukleniyor}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {silmeYukleniyor ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Siliniyor...
                  </>
                ) : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
