/* ============================================= */
/*  Güzel Teknoloji - Aktivite Logu Sayfası      */
/*  Tüm kullanıcı işlemlerinin kronolojik listesi*/
/*  Filtreleme ve arama destekli                  */
/* ============================================= */

import { useState } from "react";
import { useAktiviteLog } from "../context/AktiviteLogContext";

/* ---- Renk Yardımcıları ---- */
const renkSinif = (renk) => {
  const harita = {
    emerald: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
    red: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
    amber: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
    violet: "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300",
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
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
  const { loglar, TUR_ETIKETLERI } = useAktiviteLog();
  const [arama, setArama] = useState("");
  const [filtreTur, setFiltreTur] = useState("tumu");

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
    { etiket: "Ekleme", deger: loglar.filter((l) => l.tur === "musteri_ekleme").length, renk: "emerald" },
    { etiket: "Güncelleme", deger: loglar.filter((l) => l.tur === "musteri_guncelleme").length, renk: "blue" },
    { etiket: "Silme", deger: loglar.filter((l) => l.tur === "musteri_silme" || l.tur === "toplu_silme").length, renk: "red" },
  ];

  return (
    <div>
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aktivite Logu</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Tüm işlemlerin kronolojik kaydı.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {istatistikler.map((ist) => (
          <div key={ist.etiket} className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{ist.etiket}</p>
            <p className={`text-2xl font-bold mt-1 ${
              ist.renk === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
              ist.renk === "red" ? "text-red-600 dark:text-red-400" :
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
                      <span className="text-xs text-gray-400 dark:text-slate-500">{gecenSure(log.tarih)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{log.detay}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{tarihFormatla(log.tarih)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
