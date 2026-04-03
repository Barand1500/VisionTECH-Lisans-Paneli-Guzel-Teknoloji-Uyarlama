/* ============================================= */
/*  Güzel Teknoloji - Müşteriler Sayfası         */
/*  Müşteri listesi tablo görünümü, arama,       */
/*  düzenleme modalı (MusteriEklePage formlu),    */
/*  müşteri paket yönetimi (tablo + aksiyonlar)   */
/*  ve lisans belgesi önizleme/indirme            */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMusteriler } from "../baglam/MusteriContext";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";
import { apiGet, apiPut } from "../yardimcilar/api";
import KopyalaButonu from "../bilesenler/KopyalaButonu";

/* ---- Sekme Tanımları ---- */
const SEKMELER = [
  {
    id: "gercek",
    etiket: "Gerçek",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "tuzel",
    etiket: "Tüzel",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "yabanci",
    etiket: "Yabancı",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

/* ---- Stil Sabitleri ---- */
const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

const LABEL_STIL = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

const HATA_INPUT =
  "w-full px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm";

/* ---- Sallanma Animasyonu Stili ---- */
const sallanmaStili = document.getElementById("sallanma-stili") || (() => {
  const s = document.createElement("style");
  s.id = "sallanma-stili";
  s.textContent = `@keyframes sallanma { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(5px)} 45%{transform:translateX(-4px)} 60%{transform:translateX(3px)} 75%{transform:translateX(-2px)} } .sallan { animation: sallanma 0.5s ease-in-out; }`;
  document.head.appendChild(s);
  return s;
})();

/* ---- Yardımcı Fonksiyonlar ---- */
const telefonFormatla = (deger) => {
  const r = deger.replace(/\D/g, "").slice(0, 10);
  if (!r) return "";
  if (r.length <= 3) return `(${r}`;
  if (r.length <= 6) return `(${r.slice(0, 3)}) ${r.slice(3)}`;
  if (r.length <= 8) return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6)}`;
  return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6, 8)} ${r.slice(8)}`;
};

/* Telefon gösterim formatı: (XXX) XXX XX XX */
const telefonGosterimFormatla = (numara) => {
  if (!numara) return "";
  const temiz = numara.replace(/\D/g, "");
  if (temiz.length < 10) return numara;
  return `(${temiz.slice(0, 3)}) ${temiz.slice(3, 6)} ${temiz.slice(6, 8)} ${temiz.slice(8, 10)}`;
};

/* ---- Müşteri adı yardımcısı (ağaç bileşeni için) ---- */
const musteriAdiGetir = (m) => m.adSoyad || m.sirketAdi || `Müşteri #${m.id}`;

/* ---- Hiyerarşi: Düğümün odaklanan müşterinin altı olup olmadığını kontrol et ---- */
function odakliAltMi(musteriId, odakliId, tumMusteriler) {
  if (!odakliId) return false;
  let mevcut = tumMusteriler.find((m) => m.id === musteriId);
  while (mevcut) {
    if (mevcut.ustMusteriId === odakliId) return true;
    mevcut = tumMusteriler.find((m) => m.id === mevcut.ustMusteriId);
  }
  return false;
}

/* ============================================= */
/*  Hiyerarşi Ağaç Düğümü                        */
/* ============================================= */

function MusteriAgacDugumu({ musteri, tumMusteriler, seviye = 0, odakliId, setOdakliId }) {
  const altMusteriler = tumMusteriler.filter((m) => m.ustMusteriId === musteri.id);
  const odakli = odakliId === musteri.id;
  const altSirket = odakliAltMi(musteri.id, odakliId, tumMusteriler);
  const soluk = odakliId !== null && odakliId !== musteri.id && !altSirket;

  const tipRenkAgac = (tur) => {
    if (tur === "gercek") return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
    if (tur === "tuzel") return "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400";
    return "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400";
  };

  const tipEtiketAgac = (tur) => {
    if (tur === "gercek") return "Gerçek";
    if (tur === "tuzel") return "Tüzel";
    return "Yabancı";
  };

  return (
    <div>
      <div
        onClick={() => setOdakliId(odakli ? null : musteri.id)}
        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-300 ${
          seviye > 0 ? "ml-6 border-l-2 border-blue-200 dark:border-blue-500/30 pl-4" : ""
        } ${
          odakli
            ? "bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-400 dark:ring-blue-500/50 shadow-md"
            : soluk
            ? "opacity-40 hover:opacity-70"
            : "hover:bg-gray-50 dark:hover:bg-white/5"
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${tipRenkAgac(musteri.tur)}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {musteri.tur === "tuzel" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            ) : musteri.tur === "yabanci" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            )}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${odakli ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"}`}>{musteriAdiGetir(musteri)}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{musteri.eposta || "—"}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          (musteri.durum || "").toLowerCase() === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
        }`}>
          {(musteri.durum || "").toLowerCase() === "aktif" ? "Aktif" : "Pasif"}
        </span>
      </div>
      {altMusteriler.map((alt) => (
        <MusteriAgacDugumu key={alt.id} musteri={alt} tumMusteriler={tumMusteriler} seviye={seviye + 1} odakliId={odakliId} setOdakliId={setOdakliId} />
      ))}
    </div>
  );
}

/* ============================================= */
/*  Müşteri Paket Hiyerarşisi Düğümü             */
/* ============================================= */

function MusteriPaketDugumu({ musteri, lisanslar, genislemis, setGenislemis, onUzat }) {
  const musteriLisanslari = lisanslar.filter((l) => String(l.musteri_id) === String(musteri.id));
  const acik = genislemis.has(musteri.id);
  
  const tarihGoster = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR");
  };

  const kalanGun = (bitisTarihi) => {
    if (!bitisTarihi) return null;
    const fark = Math.ceil((new Date(bitisTarihi) - new Date()) / (1000 * 60 * 60 * 24));
    return fark;
  };

  const tipRenk = (tur) => {
    if (tur === "gercek") return "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
    if (tur === "tuzel") return "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400";
    return "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400";
  };

  return (
    <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-white/[0.02] mb-3">
      {/* Müşteri Başlığı */}
      <div
        onClick={() => setGenislemis((prev) => {
          const yeni = new Set(prev);
          if (yeni.has(musteri.id)) yeni.delete(musteri.id);
          else yeni.add(musteri.id);
          return yeni;
        })}
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tipRenk(musteri.tur)}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {musteri.tur === "tuzel" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            )}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{musteriAdiGetir(musteri)}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{musteri.eposta || "E-posta yok"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            (musteri.durum || "").toLowerCase() === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
          }`}>
            {(musteri.durum || "").toLowerCase() === "aktif" ? "Aktif" : "Pasif"}
          </span>
          <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
            {musteriLisanslari.length} Paket
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 text-gray-400 transition-transform ${acik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Paketler */}
      {acik && (
        <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01]">
          {musteriLisanslari.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {musteriLisanslari.map((lisans) => {
                const kalan = kalanGun(lisans.bitis_tarihi);
                const suresiGecmis = kalan !== null && kalan < 0;
                const sureAz = kalan !== null && kalan >= 0 && kalan <= 30;
                return (
                  <div key={lisans.id} className={`flex items-center gap-4 p-4 pl-16 ${suresiGecmis ? "bg-red-50/50 dark:bg-red-500/5" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{lisans.urun_adi || "Ürün"}</span>
                        <span className="text-gray-400 dark:text-slate-500">•</span>
                        <span className="text-gray-600 dark:text-slate-400">{lisans.paket_adi || "Paket"}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                        <span>{tarihGoster(lisans.baslangic_tarihi)} → {tarihGoster(lisans.bitis_tarihi)}</span>
                        {lisans.domain && <span className="text-blue-600 dark:text-blue-400">{lisans.domain}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${
                        suresiGecmis ? "text-red-600 dark:text-red-400" : sureAz ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-slate-400"
                      }`}>
                        {kalan !== null ? (kalan < 0 ? `${Math.abs(kalan)} gün geçti` : `${kalan} gün kaldı`) : "-"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {Number(lisans.fiyat || 0).toLocaleString("tr-TR")} ₺
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onUzat(lisans); }}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      >
                        Uzat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-4 pl-16 text-sm text-gray-400 dark:text-slate-500">Bu müşterinin paketi bulunmamaktadır.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  Bayi Müşteri Hiyerarşisi Düğümü              */
/* ============================================= */

function BayiMusteriDugumu({ bayi, musteriler, tumLisanslar, genislemis, setGenislemis, onUzat }) {
  const acik = genislemis.has(`bayi-${bayi.id}`);
  const bayiMusterileri = musteriler || [];

  const tarihGoster = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR");
  };

  const kalanGun = (bitisTarihi) => {
    if (!bitisTarihi) return null;
    const fark = Math.ceil((new Date(bitisTarihi) - new Date()) / (1000 * 60 * 60 * 24));
    return fark;
  };

  return (
    <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-white/[0.02] mb-3">
      {/* Bayi Başlığı */}
      <div
        onClick={() => setGenislemis((prev) => {
          const yeni = new Set(prev);
          const key = `bayi-${bayi.id}`;
          if (yeni.has(key)) yeni.delete(key);
          else yeni.add(key);
          return yeni;
        })}
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-500/5 dark:to-violet-500/5"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-100 dark:bg-purple-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{bayi.firma_adi || bayi.ad || "Bayi"}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{bayi.sehir || "Şehir belirtilmemiş"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            (bayi.durum || "").toLowerCase() === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
          }`}>
            {(bayi.durum || "").toLowerCase() === "aktif" ? "Aktif" : "Pasif"}
          </span>
          <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full font-medium">
            {bayiMusterileri.length} Müşteri
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 text-gray-400 transition-transform ${acik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Müşteriler ve Paketleri */}
      {acik && (
        <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
          {bayiMusterileri.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {bayiMusterileri.map((musteri) => {
                const musteriLisanslari = tumLisanslar.filter((l) => String(l.musteri_id) === String(musteri.id));
                const musteriAcik = genislemis.has(`bayi-musteri-${musteri.id}`);
                return (
                  <div key={musteri.id}>
                    {/* Müşteri Satırı */}
                    <div
                      onClick={() => setGenislemis((prev) => {
                        const yeni = new Set(prev);
                        const key = `bayi-musteri-${musteri.id}`;
                        if (yeni.has(key)) yeni.delete(key);
                        else yeni.add(key);
                        return yeni;
                      })}
                      className="flex items-center gap-3 p-3 pl-8 cursor-pointer hover:bg-white dark:hover:bg-white/5"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{musteri.ad_soyad || musteri.sirket_adi || "Müşteri"}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{musteri.eposta || "-"}</p>
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        {musteriLisanslari.length} Paket
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${musteriAcik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Müşterinin Paketleri */}
                    {musteriAcik && musteriLisanslari.length > 0 && (
                      <div className="bg-gray-100/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                        {musteriLisanslari.map((lisans) => {
                          const kalan = kalanGun(lisans.bitis_tarihi);
                          const suresiGecmis = kalan !== null && kalan < 0;
                          const sureAz = kalan !== null && kalan >= 0 && kalan <= 30;
                          return (
                            <div key={lisans.id} className={`flex items-center gap-4 p-3 pl-20 border-b border-gray-100 dark:border-white/5 last:border-b-0 ${suresiGecmis ? "bg-red-50/50 dark:bg-red-500/5" : ""}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{lisans.urun_adi || "Ürün"}</span>
                                  <span className="text-gray-300 dark:text-slate-600">•</span>
                                  <span className="text-sm text-gray-500 dark:text-slate-400">{lisans.paket_adi || "Paket"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                  <span>{tarihGoster(lisans.bitis_tarihi)}</span>
                                  {lisans.domain && <span className="text-blue-500">{lisans.domain}</span>}
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${
                                suresiGecmis ? "text-red-600 dark:text-red-400" : sureAz ? "text-amber-600 dark:text-amber-400" : "text-gray-500"
                              }`}>
                                {kalan !== null ? (kalan < 0 ? `${Math.abs(kalan)} gün geçti` : `${kalan} gün`) : "-"}
                              </span>
                              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                {Number(lisans.fiyat || 0).toLocaleString("tr-TR")} ₺
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onUzat(lisans); }}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                              >
                                Uzat
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {musteriAcik && musteriLisanslari.length === 0 && (
                      <p className="pl-20 py-2 text-xs text-gray-400 dark:text-slate-500">Paket bulunmamaktadır.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-4 pl-8 text-sm text-gray-400 dark:text-slate-500">Bu bayinin müşterisi bulunmamaktadır.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  Ana Bileşen                                   */
/* ============================================= */

export default function MusterilerPage() {
  const git = useNavigate();
  const { musteriler, musteriGuncelle, musteriSil, topluSil, topluDurumGuncelle, notlar, notEkle, notSil } = useMusteriler();
  const { logEkle } = useAktiviteLog();

  const [arama, setArama] = useState("");
  const [etiketFiltresi, setEtiketFiltresi] = useState(new Set());
  const [etiketDropdownAcik, setEtiketDropdownAcik] = useState(false);
  const [etiketArama, setEtiketArama] = useState("");
  const [kartFiltre, setKartFiltre] = useState(null);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);
  const [aktifSayfa, setAktifSayfa] = useState(1);

  /* Sıralama */
  const [siralamaAlani, setSiralamaAlani] = useState(null);
  const [siralamaYonu, setSiralamaYonu] = useState("asc");

  const siralamaToggle = (alan) => {
    if (siralamaAlani === alan) {
      setSiralamaYonu((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSiralamaAlani(alan);
      setSiralamaYonu("asc");
    }
  };

  const SiralamaIkon = ({ alan }) => {
    if (siralamaAlani !== alan) return <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>;
    return siralamaYonu === "asc"
      ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
      : <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;
  };

  /* Modal states */
  const [duzenleModal, setDuzenleModal] = useState(null);
  const [lisansModal, setLisansModal] = useState(null);
  const [silOnay, setSilOnay] = useState(null);
  const [topluSilOnay, setTopluSilOnay] = useState(false);

  /* Not modalı */
  const [notModal, setNotModal] = useState(null);
  const [yeniNot, setYeniNot] = useState("");
  const [yeniNotOnemli, setYeniNotOnemli] = useState(false);

  /* Detay modalı */
  const [detayModal, setDetayModal] = useState(null);
  const [detayDosyalar, setDetayDosyalar] = useState([]);
  const [detayDosyalarYukleniyor, setDetayDosyalarYukleniyor] = useState(false);

  /* Toplu seçim */
  const [seciliIdler, setSeciliIdler] = useState(new Set());

  /* Görünüm Toggle + Hiyerarşi odaklama */
  const [aktifGorunum, setAktifGorunum] = useState("tablo");
  const [odakliId, setOdakliId] = useState(null);

  /* Hiyerarşi modu: musteriPaketleri veya bayiMusterileri */
  const [hiyerarsiMod, setHiyerarsiMod] = useState("musteriPaketleri");
  const [tumLisanslar, setTumLisanslar] = useState([]);
  const [lisanslarYukleniyor, setLisanslarYukleniyor] = useState(false);
  const [uzatModal, setUzatModal] = useState(null);
  const [genislemisler, setGenislemisler] = useState(new Set());

  /* Bayi listesi (Düzenle modalında kullanılır) */
  const [bayiListesi, setBayiListesi] = useState([]);
  const [bayiMusterileri, setBayiMusterileri] = useState({});

  useEffect(() => {
    apiGet("/bayiler").then((yanit) => {
      if (yanit?.veri) {
        setBayiListesi(yanit.veri);
        /* Her bayinin müşterilerini yükle */
        yanit.veri.forEach((bayi) => {
          apiGet(`/bayiler/${bayi.id}/musteriler`).then((res) => {
            if (res?.veri) {
              setBayiMusterileri((prev) => ({ ...prev, [bayi.id]: res.veri }));
            }
          }).catch(() => {});
        });
      }
    }).catch(() => {});
  }, []);

  /* Tüm lisansları yükle (hiyerarşi görünümü için) */
  useEffect(() => {
    if (aktifGorunum === "hiyerarsi") {
      setLisanslarYukleniyor(true);
      apiGet("/lisanslar").then((res) => {
        if (res?.basarili && res.veri) {
          setTumLisanslar(res.veri);
        }
      }).catch(() => {}).finally(() => setLisanslarYukleniyor(false));
    }
  }, [aktifGorunum]);

  /* Etiket dropdown ref'i */
  const etiketDropdownRef = useRef(null);

  useEffect(() => {
    const escKapat = (e) => {
      if (e.key === "Escape") {
        setDuzenleModal(null);
        setLisansModal(null);
        setSilOnay(null);
        setTopluSilOnay(false);
        setDetayModal(null);
        setEtiketDropdownAcik(false);
      }
    };
    window.addEventListener("keydown", escKapat);
    return () => window.removeEventListener("keydown", escKapat);
  }, []);

  /* Etiket dropdown dışına tıklanınca kapat */
  useEffect(() => {
    const disariTiklama = (e) => {
      if (etiketDropdownRef.current && !etiketDropdownRef.current.contains(e.target)) {
        setEtiketDropdownAcik(false);
      }
    };
    if (etiketDropdownAcik) {
      document.addEventListener("mousedown", disariTiklama);
    }
    return () => document.removeEventListener("mousedown", disariTiklama);
  }, [etiketDropdownAcik]);

  /* Detay modalı açıldığında dosyaları yükle */
  useEffect(() => {
    if (detayModal) {
      setDetayDosyalarYukleniyor(true);
      apiGet(`/musteriler/${detayModal.id}/dosyalar`)
        .then((res) => setDetayDosyalar(res.veri || []))
        .catch(() => setDetayDosyalar([]))
        .finally(() => setDetayDosyalarYukleniyor(false));
    } else {
      setDetayDosyalar([]);
    }
  }, [detayModal]);

  /* ---- Tüm benzersiz etiketler ---- */
  const tumEtiketler = useMemo(() => {
    const set = new Set();
    musteriler.forEach((m) => {
      if (Array.isArray(m.etiketler)) {
        m.etiketler.forEach((e) => set.add(e));
      }
    });
    return [...set].sort();
  }, [musteriler]);

  /* ---- Etiket filtresi toggle ---- */
  const etiketFiltresiToggle = (etiket) => {
    setEtiketFiltresi((prev) => {
      const yeni = new Set(prev);
      if (yeni.has(etiket)) {
        yeni.delete(etiket);
      } else {
        yeni.add(etiket);
      }
      return yeni;
    });
    setAktifSayfa(1);
  };

  /* ---- Arama filtresi + Kart Filtre + Etiket Filtre + Sıralama ---- */
  const filtrelenenler = musteriler.filter((m) => {
    const q = arama.toLowerCase();
    const aramaUygun =
      (m.adSoyad || "").toLowerCase().includes(q) ||
      (m.sirketAdi || "").toLowerCase().includes(q) ||
      (m.yetkiliKisi || "").toLowerCase().includes(q) ||
      (m.eposta || "").toLowerCase().includes(q) ||
      (m.tur || "").toLowerCase().includes(q);
    if (!aramaUygun) return false;
    
    /* Etiket filtresi */
    if (etiketFiltresi.size > 0) {
      const musteriEtiketleri = Array.isArray(m.etiketler) ? m.etiketler : [];
      const eslesme = [...etiketFiltresi].some((e) => musteriEtiketleri.includes(e));
      if (!eslesme) return false;
    }
    
    if (!kartFiltre) return true;
    if (kartFiltre === "toplam") return true;
    if (kartFiltre === "gercek") return m.tur === "gercek";
    if (kartFiltre === "tuzel") return m.tur === "tuzel";
    if (kartFiltre === "yabanci") return m.tur === "yabanci";
    if (kartFiltre === "aktif") return (m.durum || "").toLowerCase() === "aktif";
    if (kartFiltre === "pasif") return (m.durum || "").toLowerCase() === "pasif";
    return true;
  });

  const siraliListe = [...filtrelenenler].sort((a, b) => {
    if (!siralamaAlani) return 0;
    let dA, dB;
    switch (siralamaAlani) {
      case "ad": dA = (a.adSoyad || a.sirketAdi || "").toLowerCase(); dB = (b.adSoyad || b.sirketAdi || "").toLowerCase(); break;
      case "tur": dA = a.tur || ""; dB = b.tur || ""; break;
      case "yetkili": dA = (a.yetkiliKisi || "").toLowerCase(); dB = (b.yetkiliKisi || "").toLowerCase(); break;
      case "eposta": dA = (a.eposta || "").toLowerCase(); dB = (b.eposta || "").toLowerCase(); break;
      case "durum": dA = a.durum || ""; dB = b.durum || ""; break;
      default: return 0;
    }
    if (dA < dB) return siralamaYonu === "asc" ? -1 : 1;
    if (dA > dB) return siralamaYonu === "asc" ? 1 : -1;
    return 0;
  });

  const toplamSayfa = Math.max(1, Math.ceil(siraliListe.length / sayfaBoyutu));
  const sayfalananlar = siraliListe.slice(
    (aktifSayfa - 1) * sayfaBoyutu,
    aktifSayfa * sayfaBoyutu
  );

  const musteriAdi = (m) => m.adSoyad || m.sirketAdi || `Müşteri #${m.id}`;

  const tipRenk = (tur) => {
    if (tur === "gercek") return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300";
    if (tur === "tuzel") return "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300";
    return "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300";
  };

  const tipEtiket = (tur) => {
    if (tur === "gercek") return "Gerçek";
    if (tur === "tuzel") return "Tüzel";
    return "Yabancı";
  };

  /* ---- Müşteri Silme (Çöp Kutusuna Gönder) ---- */
  const musteriSilIslem = async (musteri) => {
    await musteriSil(musteri.id);
    logEkle("musteri_silme", `"${musteriAdi(musteri)}" adlı müşteri çöp kutusuna taşındı.`);
    seciliIdler.delete(musteri.id);
    setSeciliIdler(new Set(seciliIdler));
    setSilOnay(null);
  };

  /* ---- Toplu Silme (Çöp Kutusuna Gönder) ---- */
  const topluSilIslem = async () => {
    const silinecekler = musteriler.filter((m) => seciliIdler.has(m.id));
    const isimler = silinecekler.map(musteriAdi).join(", ");
    await topluSil([...seciliIdler]);
    logEkle("toplu_silme", `${silinecekler.length} müşteri çöp kutusuna taşındı: ${isimler}`);
    setSeciliIdler(new Set());
    setTopluSilOnay(false);
  };

  /* ---- Seçim Yardımcıları ---- */
  const tekSecimToggle = (id) => {
    const yeni = new Set(seciliIdler);
    if (yeni.has(id)) yeni.delete(id);
    else yeni.add(id);
    setSeciliIdler(yeni);
  };

  const tumunuSec = () => {
    if (seciliIdler.size === sayfalananlar.length && sayfalananlar.every((m) => seciliIdler.has(m.id))) {
      setSeciliIdler(new Set());
    } else {
      setSeciliIdler(new Set(sayfalananlar.map((m) => m.id)));
    }
  };

  const hepsiSecili = sayfalananlar.length > 0 && sayfalananlar.every((m) => seciliIdler.has(m.id));

  /* ---- Hiyerarşi Yardımcıları ---- */
  const kokMusteriler = musteriler.filter((m) => !m.ustMusteriId);

  /* ---- Toplu Durum Değiştir ---- */
  const topluDurumIslem = (yeniDurum) => {
    const hedefler = musteriler.filter((m) => seciliIdler.has(m.id));
    const isimler = hedefler.map(musteriAdi).join(", ");
    topluDurumGuncelle([...seciliIdler], yeniDurum);
    logEkle("musteri_durum", `${hedefler.length} müşteri "${yeniDurum}" yapıldı: ${isimler}`);
    setSeciliIdler(new Set());
  };

  /* ---- Toplu Dışa Aktar (CSV) ---- */
  const topluDisaAktar = () => {
    const secililer = musteriler.filter((m) => seciliIdler.has(m.id));
    const basliklar = ["Ad", "Tip", "Yetkili", "E-posta", "Telefon", "Durum"];
    const satirlar = secililer.map((m) => [
      musteriAdi(m),
      tipEtiket(m.tur),
      m.yetkiliKisi || "",
      m.eposta || "",
      (m.telefonlar || [])[0] || "",
      m.durum || "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = "\uFEFF" + [basliklar.join(","), ...satirlar].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `musteriler_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logEkle("diger", `${secililer.length} müşteri CSV olarak dışa aktarıldı.`);
  };

  /* ============================================= */
  /*  Düzenleme Modalı - MusteriEklePage Tarzı     */
  /* ============================================= */

  function DuzenleModalBilesen() {
    const m = duzenleModal;
    if (!m) return null;

    const [aktifSekme, setAktifSekme] = useState(m.tur || "gercek");
    const [form, setForm] = useState({
      adSoyad: m.adSoyad || "",
      sirketAdi: m.sirketAdi || "",
      yetkiliKisi: m.yetkiliKisi || "",
      eposta: m.eposta || "",
      tcKimlikNo: m.tcKimlikNo || "",
      vergiNo: m.vergiNo || "",
      vergiDairesi: m.vergiDairesi || "",
      pasaportNo: m.pasaportNo || "",
      bayi: m.bayiId ? String(m.bayiId) : "",
      bayiAdi: (() => { const b = bayiListesi.find(x => x.id === m.bayiId); return b ? (b.ad || b.sirket_adi || `Bayi #${b.id}`) : ""; })(),
      bayiArama: "",
      telefonlar: (m.telefonlar && m.telefonlar.length > 0) ? [...m.telefonlar] : [""],
      adresler: (m.adresler && m.adresler.length > 0) ? [...m.adresler] : [""],
      durum: m.durum === "Aktif" || m.durum === "aktif" || m.durum === true,
      sektorId: m.sektorId || "",
    });
    const [hatalar, setHatalar] = useState({});
    const [bayiAcik, setBayiAcik] = useState(false);
    const bayiRef = useRef(null);

    useEffect(() => {
      const disari = (e) => {
        if (bayiRef.current && !bayiRef.current.contains(e.target)) setBayiAcik(false);
      };
      document.addEventListener("mousedown", disari);
      return () => document.removeEventListener("mousedown", disari);
    }, []);

    const tumBayiler = bayiListesi
      .filter(b => !b.silinme_tarihi)
      .map((b) => ({ id: b.id, ad: b.ad || b.sirket_adi || `Bayi #${b.id}` }));

    const filtreliBayiler = tumBayiler.filter((b) =>
      b.ad.toLowerCase().includes(form.bayiArama.toLowerCase())
    );

    const guncelle = (alan, deger) => {
      setForm((o) => ({ ...o, [alan]: deger }));
      if (hatalar[alan]) setHatalar((o) => { const y = { ...o }; delete y[alan]; return y; });
    };

    const listeEkle = (alan) => setForm((o) => ({ ...o, [alan]: [...o[alan], ""] }));
    const listeGuncelle = (alan, idx, val) => setForm((o) => { const y = [...o[alan]]; y[idx] = val; return { ...o, [alan]: y }; });
    const listeSil = (alan, idx) => setForm((o) => { const y = o[alan].filter((_, i) => i !== idx); return { ...o, [alan]: y.length === 0 ? [""] : y }; });

    const dogrula = () => {
      const h = {};
      if (!form.eposta.trim()) h.eposta = "E-posta zorunludur.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.eposta.trim())) h.eposta = "Geçerli bir e-posta adresi giriniz.";
      /* Telefon zorunlu değil - ekleme sayfasıyla uyumlu */
      if (form.telefonlar[0] && form.telefonlar[0].trim() && form.telefonlar[0].replace(/\D/g, "").length < 10) h.telefonlar = "Telefon en az 10 haneli olmalıdır.";
      if (!form.adresler[0] || !form.adresler[0].trim()) h.adresler = "Adres zorunludur.";
      if (aktifSekme === "gercek") {
        if (!form.tcKimlikNo.trim()) h.tcKimlikNo = "TC Kimlik No zorunludur.";
        else if (form.tcKimlikNo.replace(/\D/g, "").length !== 11) h.tcKimlikNo = "TC Kimlik No 11 haneli olmalıdır.";
        if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      }
      if (aktifSekme === "tuzel") {
        if (!form.vergiNo.trim()) h.vergiNo = "Vergi No zorunludur.";
        else if (form.vergiNo.replace(/\D/g, "").length !== 10) h.vergiNo = "Vergi No 10 haneli olmalıdır.";
        if (!form.vergiDairesi.trim()) h.vergiDairesi = "Vergi Dairesi zorunludur.";
      }
      if (aktifSekme === "yabanci") {
        if (!form.pasaportNo.trim()) h.pasaportNo = "Pasaport No zorunludur.";
        if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      }
      setHatalar(h);
      return Object.keys(h).length === 0;
    };

    const kaydet = () => {
      if (!dogrula()) return;
      const veri = {
        tur: aktifSekme,
        eposta: form.eposta,
        sektorId: m.sektorId || null,
        bayiId: form.bayi ? Number(form.bayi) : null,
        telefonlar: form.telefonlar.filter((t) => t.trim()),
        adresler: form.adresler.filter((a) => a.trim()),
        durum: form.durum ? "Aktif" : "Pasif",
        ...(aktifSekme === "gercek" && { adSoyad: form.adSoyad, tcKimlikNo: form.tcKimlikNo, yetkiliKisi: form.yetkiliKisi, sirketAdi: form.sirketAdi }),
        ...(aktifSekme === "tuzel" && { sirketAdi: form.sirketAdi, yetkiliKisi: form.yetkiliKisi, vergiDairesi: form.vergiDairesi, vergiNo: form.vergiNo }),
        ...(aktifSekme === "yabanci" && { adSoyad: form.adSoyad, sirketAdi: form.sirketAdi, pasaportNo: form.pasaportNo, yetkiliKisi: form.yetkiliKisi }),
      };
      musteriGuncelle(m.id, veri);
      logEkle("musteri_guncelleme", `"${musteriAdi(m)}" adlı müşteri güncellendi.`);
      console.log("✏️ Müşteri güncellendi:", veri);
      setDuzenleModal(null);
    };

    const duzenleRef = useRef(null);
    const sallanmaUygula = () => { if (duzenleRef.current) { duzenleRef.current.classList.remove("sallan"); void duzenleRef.current.offsetWidth; duzenleRef.current.classList.add("sallan"); } };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanmaUygula}>
        <div ref={duzenleRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-3xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Başlık */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between rounded-t-2xl">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Müşteri Düzenle</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">{musteriAdi(m)}</p>
            </div>
            <button onClick={() => setDuzenleModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* ---- Bayi ---- */}
            <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Bayi
              </h3>
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Bu müşteriyi bir bayiye bağlamak istiyorsanız aşağıdan arayın.</p>
              <div className="relative" ref={bayiRef}>
                {form.bayi ? (
                  <div className={INPUT_STIL + " flex items-center justify-between"}>
                    <span className="text-sm">{form.bayiAdi}</span>
                    <button type="button" onClick={() => { guncelle("bayi", ""); guncelle("bayiAdi", ""); guncelle("bayiArama", ""); }}
                      className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="text" placeholder="Bayi adı yazarak arayın..." value={form.bayiArama}
                      onChange={(e) => { guncelle("bayiArama", e.target.value); setBayiAcik(true); }}
                      onFocus={() => setBayiAcik(true)} className={INPUT_STIL} />
                    {bayiAcik && form.bayiArama.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl max-h-56 overflow-y-auto">
                        {filtreliBayiler.length > 0 ? filtreliBayiler.map((b) => (
                          <button key={b.id} type="button" onClick={() => { guncelle("bayi", String(b.id)); guncelle("bayiAdi", b.ad); guncelle("bayiArama", ""); setBayiAcik(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer">
                            {b.ad}
                          </button>
                        )) : (
                          <div className="p-4">
                            <p className="text-sm text-gray-400 dark:text-slate-500">Eşleşen bayi bulunamadı.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ---- Sekme (Tab) Çubuğu: Gerçek / Tüzel / Yabancı ---- */}
            <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-xl border border-gray-200 dark:border-white/10">
              {SEKMELER.map((s) => (
                <button key={s.id} type="button" onClick={() => { setAktifSekme(s.id); setHatalar({}); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    aktifSekme === s.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`}>
                  {s.ikon}
                  {s.etiket}
                </button>
              ))}
            </div>

            {/* ---- Fatura Bilgileri ---- */}
            <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Fatura Bilgileri
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${form.durum ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                    {form.durum ? "Aktif" : "Pasif"}
                  </span>
                  <button
                    type="button"
                    onClick={() => guncelle("durum", !form.durum)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                      form.durum ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/20"
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                      form.durum ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ======== GERÇEK MÜŞTERİ ALANLARI ======== */}
                {aktifSekme === "gercek" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                      <input type="text" value={form.adSoyad} onChange={(e) => guncelle("adSoyad", e.target.value)}
                        className={hatalar.adSoyad ? HATA_INPUT : INPUT_STIL} placeholder="Ad ve soyadını giriniz" />
                      {hatalar.adSoyad && <p className="text-red-500 text-xs mt-1">{hatalar.adSoyad}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>TC Kimlik No <span className="text-red-500">*</span></label>
                      <input type="text" value={form.tcKimlikNo} onChange={(e) => guncelle("tcKimlikNo", e.target.value.replace(/\D/g, "").slice(0, 11))}
                        className={hatalar.tcKimlikNo ? HATA_INPUT : INPUT_STIL} maxLength={11} placeholder="11 haneli TC kimlik numarası" />
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.tcKimlikNo.length}/11 hane</p>
                      {hatalar.tcKimlikNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.tcKimlikNo}</p>}
                    </div>
                  </>
                )}

                {/* ======== TÜZEL MÜŞTERİ ALANLARI ======== */}
                {aktifSekme === "tuzel" && (
                  <>
                    <div className="md:col-span-2">
                      <label className={LABEL_STIL}>Şirket Ünvanı <span className="text-red-500">*</span></label>
                      <input type="text" value={form.sirketAdi} onChange={(e) => guncelle("sirketAdi", e.target.value)}
                        className={hatalar.sirketAdi ? HATA_INPUT : INPUT_STIL} placeholder="Şirket ünvanını giriniz" />
                      {hatalar.sirketAdi && <p className="text-red-500 text-xs mt-1">{hatalar.sirketAdi}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Vergi Dairesi <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vergiDairesi} onChange={(e) => guncelle("vergiDairesi", e.target.value)}
                        className={hatalar.vergiDairesi ? HATA_INPUT : INPUT_STIL} placeholder="Vergi dairesi adı" />
                      {hatalar.vergiDairesi && <p className="text-red-500 text-xs mt-1">{hatalar.vergiDairesi}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Vergi Numarası <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vergiNo} onChange={(e) => guncelle("vergiNo", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={hatalar.vergiNo ? HATA_INPUT : INPUT_STIL} maxLength={10} placeholder="10 haneli vergi numarası" />
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.vergiNo.length}/10 hane</p>
                      {hatalar.vergiNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiNo}</p>}
                    </div>
                  </>
                )}

                {/* ======== YABANCI MÜŞTERİ ALANLARI ======== */}
                {aktifSekme === "yabanci" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                      <input type="text" value={form.adSoyad} onChange={(e) => guncelle("adSoyad", e.target.value)}
                        className={hatalar.adSoyad ? HATA_INPUT : INPUT_STIL} placeholder="Ad ve soyadını giriniz" />
                      {hatalar.adSoyad && <p className="text-red-500 text-xs mt-1">{hatalar.adSoyad}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Pasaport No <span className="text-red-500">*</span></label>
                      <input type="text" value={form.pasaportNo} onChange={(e) => guncelle("pasaportNo", e.target.value)}
                        className={hatalar.pasaportNo ? HATA_INPUT : INPUT_STIL} placeholder="Pasaport numarası" />
                      {hatalar.pasaportNo && <p className="text-red-500 text-xs mt-1">{hatalar.pasaportNo}</p>}
                    </div>
                  </>
                )}

                {/* ======== ORTAK ALANLAR ======== */}
                <div>
                  <label className={LABEL_STIL}>E-Posta <span className="text-red-500">*</span></label>
                  <input type="email" value={form.eposta} onChange={(e) => guncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT : INPUT_STIL} placeholder="ornek@sirket.com" />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Telefon</label>
                  {hatalar.telefonlar && <p className="text-red-500 text-xs mb-1">{hatalar.telefonlar}</p>}
                  {form.telefonlar.map((tel, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input type="text" placeholder="(5XX) XXX XX XX" value={tel}
                        onChange={(e) => listeGuncelle("telefonlar", idx, telefonFormatla(e.target.value))} className={INPUT_STIL} />
                      {form.telefonlar.length > 1 && (
                        <button type="button" onClick={() => listeSil("telefonlar", idx)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 cursor-pointer shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => listeEkle("telefonlar")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer font-medium inline-flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Telefon Ekle
                  </button>
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Adres <span className="text-red-500">*</span></label>
                  {hatalar.adresler && <p className="text-red-500 text-xs mb-1">{hatalar.adresler}</p>}
                  {form.adresler.map((adres, idx) => (
                    <div key={idx} className="flex items-start gap-2 mb-2">
                      <textarea placeholder="Adres bilgisi" value={adres} onChange={(e) => listeGuncelle("adresler", idx, e.target.value)}
                        rows={2} className={INPUT_STIL + " resize-none"} />
                      {form.adresler.length > 1 && (
                        <button type="button" onClick={() => listeSil("adresler", idx)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 cursor-pointer shrink-0 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => listeEkle("adresler")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer font-medium inline-flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Adres Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* ---- Hata Özeti ---- */}
            {Object.keys(hatalar).length > 0 && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Lütfen zorunlu alanları doldurun.</p>
              </div>
            )}
          </div>

          {/* ---- Alt Butonlar ---- */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={() => setDuzenleModal(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">İptal</button>
            <button onClick={kaydet}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Kaydet
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Lisans Belgesi Modalı                        */
  /* ============================================= */

  function LisansModalBilesen() {
    const m = lisansModal;
    if (!m) return null;

    const bugun = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
    const belgeNo = `GT-${String(m.id).slice(-6)}-${new Date().getFullYear()}`;

    const yazdir = () => {
      const pencere = window.open("", "_blank");
      if (!pencere) return;
      pencere.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lisans Belgesi - ${musteriAdi(m)}</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1a1a1a}.header{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:30px}.header h1{color:#2563eb;margin:0;font-size:24px}.header p{color:#666;margin:5px 0 0}.info{margin:20px 0}.info table{width:100%;border-collapse:collapse}.info td{padding:8px 12px;border:1px solid #e5e7eb;font-size:14px}.info td:first-child{background:#f9fafb;font-weight:600;width:40%}.footer{margin-top:40px;text-align:center;color:#666;font-size:12px;border-top:1px solid #e5e7eb;padding-top:20px}.badge{display:inline-block;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:600}.aktif{background:#d1fae5;color:#065f46}.pasif{background:#fee2e2;color:#991b1b}</style></head><body>
        <div class="header"><h1>GÜZEL TEKNOLOJİ</h1><p>Lisans Belgesi</p></div>
        <div class="info"><table>
          <tr><td>Belge No</td><td>${belgeNo}</td></tr>
          <tr><td>Müşteri Adı</td><td>${musteriAdi(m)}</td></tr>
          <tr><td>Müşteri Tipi</td><td>${tipEtiket(m.tur)}</td></tr>
          ${m.tcKimlikNo ? `<tr><td>TC Kimlik No</td><td>${m.tcKimlikNo}</td></tr>` : ""}
          ${m.vergiNo ? `<tr><td>Vergi No</td><td>${m.vergiNo}</td></tr>` : ""}
          ${m.pasaportNo ? `<tr><td>Pasaport No</td><td>${m.pasaportNo}</td></tr>` : ""}
          <tr><td>E-posta</td><td>${m.eposta || "-"}</td></tr>
          <tr><td>Telefon</td><td>${(m.telefonlar || []).join(", ") || "-"}</td></tr>
          <tr><td>Durum</td><td><span class="badge ${m.durum === "Aktif" ? "aktif" : "pasif"}">${m.durum}</span></td></tr>
          <tr><td>Tarih</td><td>${bugun}</td></tr>
        </table></div>
        <div class="footer"><p>Bu belge Güzel Teknoloji Yönetim Paneli tarafından oluşturulmuştur.</p><p>&copy; ${new Date().getFullYear()} Güzel Teknoloji</p></div>
        </body></html>`);
      pencere.document.close();
      pencere.print();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLisansModal(null)}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-xl mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lisans Belgesi</h3>
            <button onClick={() => setLisansModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6">
            <div className="border border-gray-200 dark:border-white/10 rounded-xl p-6 bg-gray-50 dark:bg-white/[0.02]">
              <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
                <h4 className="text-xl font-bold text-blue-600">GÜZEL TEKNOLOJİ</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">Lisans Belgesi</p>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Belge No", <span className="font-mono">{belgeNo}</span>],
                  ["Müşteri", musteriAdi(m)],
                  ["Tip", <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipRenk(m.tur)}`}>{tipEtiket(m.tur)}</span>],
                  m.eposta && ["E-posta", m.eposta],
                  ["Durum", <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.durum === "Aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>{m.durum}</span>],
                  ["Tarih", bugun],
                ].filter(Boolean).map(([label, val], i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5">
                    <span className="font-medium text-gray-600 dark:text-slate-400">{label}</span>
                    <span className="text-gray-900 dark:text-white">{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">Güzel Teknoloji Yönetim Paneli tarafından oluşturulmuştur.</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
            <button onClick={() => setLisansModal(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">Kapat</button>
            <button onClick={yazdir}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              İndir / Yazdır
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Sayfa Render                                 */
  /* ============================================= */

  return (
    <div>
      <DuzenleModalBilesen />
      <LisansModalBilesen />

      {/* ---- Silme Onay Modalı ---- */}
      {silOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSilOnay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Müşteri Pasif Yapılacak</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                <span className="font-semibold text-gray-700 dark:text-white">"{musteriAdi(silOnay)}"</span> adlı müşteri pasif duruma alınacaktır. Müşteri listeden kaldırılmayacak, sadece pasif olarak görünecektir.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setSilOnay(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">İptal</button>
              <button onClick={() => musteriSilIslem(silOnay)}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                Pasif Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Toplu Silme Onay Modalı ---- */}
      {topluSilOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setTopluSilOnay(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Toplu Pasif Yap</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Seçili <span className="font-semibold text-gray-700 dark:text-white">{seciliIdler.size} müşteri</span> pasif duruma alınacaktır.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setTopluSilOnay(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">İptal</button>
              <button onClick={topluSilIslem}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                {seciliIdler.size} Müşteriyi Pasif Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Başlık */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteriler</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Müşteri kayıtlarını görüntüleyin ve yönetin.</p>
        </div>
        <button onClick={() => git("/dashboard/musteri-ekle")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Müşteri Ekle
        </button>
      </div>

      {/* Arama + Etiket Filtresi + Görünüm */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Müşteri adı, e-posta veya yetkili ile arayın..." value={arama} onChange={(e) => { setArama(e.target.value); setAktifSayfa(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        
        {/* Etiket Filtresi */}
        {tumEtiketler.length > 0 && (
          <div className="relative" ref={etiketDropdownRef}>
            <button type="button" onClick={() => setEtiketDropdownAcik(!etiketDropdownAcik)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                etiketFiltresi.size > 0
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10"
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Etiketler
              {etiketFiltresi.size > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-xs">{etiketFiltresi.size}</span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${etiketDropdownAcik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {etiketDropdownAcik && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-30 p-2 max-h-64 overflow-y-auto">
                <input type="text" placeholder="Etiket ara..." value={etiketArama || ""} onChange={(e) => setEtiketArama(e.target.value)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {etiketFiltresi.size > 0 && (
                  <button type="button" onClick={() => { setEtiketFiltresi(new Set()); setAktifSayfa(1); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer mb-1">
                    Filtreyi Temizle
                  </button>
                )}
                {tumEtiketler.filter((e) => !etiketArama || e.toLowerCase().includes(etiketArama.toLowerCase())).map((etiket) => (
                  <label key={etiket} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" checked={etiketFiltresi.has(etiket)} onChange={() => etiketFiltresiToggle(etiket)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">{etiket}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
          <button onClick={() => setAktifGorunum("tablo")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${aktifGorunum === "tablo" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
          <button onClick={() => setAktifGorunum("hiyerarsi")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${aktifGorunum === "hiyerarsi" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { etiket: "Toplam Müşteri", deger: musteriler.length, renk: "text-blue-600 dark:text-blue-400", filtre: "toplam", borderRenk: "border-blue-500 dark:border-blue-400" },
          { etiket: "Gerçek Kişi", deger: musteriler.filter((m) => m.tur === "gercek").length, renk: "text-cyan-600 dark:text-cyan-400", filtre: "gercek", borderRenk: "border-cyan-500 dark:border-cyan-400" },
          { etiket: "Tüzel Kişi", deger: musteriler.filter((m) => m.tur === "tuzel").length, renk: "text-violet-600 dark:text-violet-400", filtre: "tuzel", borderRenk: "border-violet-500 dark:border-violet-400" },
          { etiket: "Aktif", deger: musteriler.filter((m) => (m.durum || "").toLowerCase() === "aktif").length, renk: "text-emerald-600 dark:text-emerald-400", filtre: "aktif", borderRenk: "border-emerald-500 dark:border-emerald-400" },
          { etiket: "Pasif", deger: musteriler.filter((m) => (m.durum || "").toLowerCase() === "pasif").length, renk: "text-gray-500 dark:text-slate-400", filtre: "pasif", borderRenk: "border-gray-500 dark:border-slate-400" },
        ].map((k) => (
          <div key={k.etiket} onClick={() => setKartFiltre(kartFiltre === k.filtre ? null : k.filtre)}
            className={`rounded-xl bg-white dark:bg-white/5 border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              kartFiltre === k.filtre ? `${k.borderRenk} shadow-md` : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            }`}>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{k.etiket}</p>
            <p className={`text-2xl font-bold ${k.renk}`}>{k.deger}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">

          {/* Toplu İşlem Barı */}
          {seciliIdler.size > 0 && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-500/10 border-b border-blue-200 dark:border-blue-500/20 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {seciliIdler.size} müşteri seçildi
                </span>
                <button onClick={() => setSeciliIdler(new Set())}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer">Seçimi Temizle</button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Aktif Yap */}
                <button onClick={() => topluDurumIslem("Aktif")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Aktif Yap
                </button>
                {/* Pasif Yap */}
                <button onClick={() => topluDurumIslem("Pasif")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Pasif Yap
                </button>
                {/* CSV Dışa Aktar */}
                <button onClick={topluDisaAktar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  CSV İndir
                </button>
                {/* Toplu Sil */}
                <button onClick={() => setTopluSilOnay(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Toplu Sil
                </button>
              </div>
            </div>
          )}

          {/* Tablo Görünümü */}
          {aktifGorunum === "tablo" && (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="px-4 py-4 w-12">
                    <input type="checkbox" checked={hepsiSecili} onChange={tumunuSec}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  <th onClick={() => siralamaToggle("ad")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Müşteri Adı<SiralamaIkon alan="ad" /></span></th>
                  <th onClick={() => siralamaToggle("tur")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Tipi<SiralamaIkon alan="tur" /></span></th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Telefon</th>
                  <th onClick={() => siralamaToggle("eposta")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">E-posta<SiralamaIkon alan="eposta" /></span></th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Etiketler</th>
                  <th onClick={() => siralamaToggle("durum")} className="text-center px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center justify-center">Durum<SiralamaIkon alan="durum" /></span></th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sayfalananlar.map((m) => (
                  <tr key={m.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${seciliIdler.has(m.id) ? "bg-blue-50/50 dark:bg-blue-500/5" : ""} ${(m.durum || "").toLowerCase() !== "aktif" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={seciliIdler.has(m.id)} onChange={() => tekSecimToggle(m.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {musteriAdi(m)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${tipRenk(m.tur)}`}>{tipEtiket(m.tur)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap"><span className="inline-flex items-center group">{(m.telefonlar || [])[0] || "-"}<KopyalaButonu metin={(m.telefonlar || [])[0]} /></span></td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-400"><span className="inline-flex items-center group">{m.eposta || "-"}<KopyalaButonu metin={m.eposta} /></span></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Array.isArray(m.etiketler) && m.etiketler.length > 0 ? (
                          m.etiketler.map((etiket, idx) => (
                            <span key={idx} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                              {etiket}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        (m.durum || "").toLowerCase() === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      }`}>{(m.durum || "").toLowerCase() === "aktif" ? "Aktif" : "Pasif"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => git(`/dashboard/musteri/${m.id}`)} title="Detay Görüntüle"
                          className="w-8 h-8 rounded-lg bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => setDuzenleModal(m)} title="Düzenle"
                          className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => git(`/dashboard/musteri-paketleri/${m.id}`)} title="Müşteri Paketleri"
                          className="w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </button>
                        <button onClick={() => setLisansModal(m)} title="Lisans Belgesi"
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <button onClick={() => { setNotModal(m); setYeniNot(""); setYeniNotOnemli(false); }} title="Notlar"
                          className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center cursor-pointer relative">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                          {notlar.filter((n) => n.musteriId === m.id).length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">{notlar.filter((n) => n.musteriId === m.id).length}</span>
                          )}
                        </button>
                        <button onClick={() => setSilOnay(m)} title="Sil"
                          className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sayfalananlar.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                      {arama || kartFiltre ? `"${arama}" ile eşleşen müşteri bulunamadı.` : "Henüz müşteri kaydı bulunmamaktadır."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <select value={sayfaBoyutu} onChange={(e) => { setSayfaBoyutu(Number(e.target.value)); setAktifSayfa(1); }}
                  className="px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm cursor-pointer">
                  {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>kayıt göster</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                — Toplam {siraliListe.length} kayıttan {Math.min((aktifSayfa - 1) * sayfaBoyutu + 1, siraliListe.length)}-{Math.min(aktifSayfa * sayfaBoyutu, siraliListe.length)} arası
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setAktifSayfa((o) => Math.max(1, o - 1))} disabled={aktifSayfa === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Önceki</button>
              {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
                <button key={s} onClick={() => setAktifSayfa(s)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${aktifSayfa === s ? "bg-blue-600 text-white" : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>{s}</button>
              ))}
              <button onClick={() => setAktifSayfa((o) => Math.min(toplamSayfa, o + 1))} disabled={aktifSayfa === toplamSayfa}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Sonraki</button>
            </div>
          </div>
          </>
          )}

          {/* Hiyerarşi Ağacı Görünümü */}
          {aktifGorunum === "hiyerarsi" && (
            <div className="p-6">
              {/* Hiyerarşi Mod Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                    <button 
                      onClick={() => setHiyerarsiMod("musteriPaketleri")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                        hiyerarsiMod === "musteriPaketleri" 
                          ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm" 
                          : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Müşteri Paketleri
                    </button>
                    <button 
                      onClick={() => setHiyerarsiMod("bayiMusterileri")}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                        hiyerarsiMod === "bayiMusterileri" 
                          ? "bg-white dark:bg-white/10 text-purple-600 dark:text-purple-400 shadow-sm" 
                          : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Bayi Müşterileri
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {genislemisler.size > 0 && (
                    <button onClick={() => setGenislemisler(new Set())}
                      className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 cursor-pointer font-medium">
                      Tümünü Kapat
                    </button>
                  )}
                  {lisanslarYukleniyor && (
                    <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Yükleniyor...
                    </span>
                  )}
                </div>
              </div>

              {/* Müşteri Paketleri Görünümü */}
              {hiyerarsiMod === "musteriPaketleri" && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Müşterilere tıklayarak paketlerini görüntüleyebilirsiniz.</p>
                  <div className="space-y-0">
                    {musteriler.length > 0 ? musteriler.filter(m => (m.durum || "").toLowerCase() === "aktif").map((m) => (
                      <MusteriPaketDugumu 
                        key={m.id} 
                        musteri={m} 
                        lisanslar={tumLisanslar} 
                        genislemis={genislemisler} 
                        setGenislemis={setGenislemisler}
                        onUzat={(lisans) => setUzatModal(lisans)}
                      />
                    )) : (
                      <p className="text-center text-gray-400 dark:text-slate-500 py-8">Henüz müşteri kaydı bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Bayi Müşterileri Görünümü */}
              {hiyerarsiMod === "bayiMusterileri" && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Bayilere tıklayarak müşterilerini ve paketlerini görüntüleyebilirsiniz.</p>
                  <div className="space-y-0">
                    {bayiListesi.length > 0 ? bayiListesi.filter(b => (b.durum || "").toLowerCase() === "aktif").map((bayi) => (
                      <BayiMusteriDugumu 
                        key={bayi.id} 
                        bayi={bayi} 
                        musteriler={bayiMusterileri[bayi.id] || []}
                        tumLisanslar={tumLisanslar}
                        genislemis={genislemisler} 
                        setGenislemis={setGenislemisler}
                        onUzat={(lisans) => setUzatModal(lisans)}
                      />
                    )) : (
                      <p className="text-center text-gray-400 dark:text-slate-500 py-8">Henüz bayi kaydı bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      {/* ---- Müşteri Detay Modalı ---- */}
      {detayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Başlık */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  detayModal.tur === "gercek" ? "bg-blue-100 dark:bg-blue-500/20" : detayModal.tur === "tuzel" ? "bg-violet-100 dark:bg-violet-500/20" : "bg-amber-100 dark:bg-amber-500/20"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${
                    detayModal.tur === "gercek" ? "text-blue-600 dark:text-blue-400" : detayModal.tur === "tuzel" ? "text-violet-600 dark:text-violet-400" : "text-amber-600 dark:text-amber-400"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {detayModal.tur === "tuzel" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    ) : detayModal.tur === "yabanci" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{musteriAdi(detayModal)}</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{tipEtiket(detayModal.tur)} Kişi</p>
                </div>
              </div>
              <button onClick={() => setDetayModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Durum */}
              <div className="flex justify-end">
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                  detayModal.durum === "aktif" || detayModal.durum === "Aktif" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${detayModal.durum === "aktif" || detayModal.durum === "Aktif" ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {detayModal.durum === "aktif" || detayModal.durum === "Aktif" ? "Aktif" : "Pasif"}
                </span>
              </div>

              {/* Temel Bilgiler */}
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Temel Bilgiler</p>
                <div className="space-y-3">
                  {detayModal.adSoyad && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Ad Soyad</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.adSoyad}</p></div>
                      <KopyalaButonu metin={detayModal.adSoyad} />
                    </div>
                  )}
                  {detayModal.sirketAdi && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Şirket Adı</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.sirketAdi}</p></div>
                      <KopyalaButonu metin={detayModal.sirketAdi} />
                    </div>
                  )}
                  {detayModal.yetkiliKisi && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Yetkili Kişi</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.yetkiliKisi}</p></div>
                      <KopyalaButonu metin={detayModal.yetkiliKisi} />
                    </div>
                  )}
                  {detayModal.tcKimlikNo && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">TC Kimlik No</p><p className="text-sm text-gray-900 dark:text-white font-medium font-mono">{detayModal.tcKimlikNo}</p></div>
                      <KopyalaButonu metin={detayModal.tcKimlikNo} />
                    </div>
                  )}
                  {detayModal.vergiNo && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Vergi No</p><p className="text-sm text-gray-900 dark:text-white font-medium font-mono">{detayModal.vergiNo}</p></div>
                      <KopyalaButonu metin={detayModal.vergiNo} />
                    </div>
                  )}
                  {detayModal.vergiDairesi && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Vergi Dairesi</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.vergiDairesi}</p></div>
                      <KopyalaButonu metin={detayModal.vergiDairesi} />
                    </div>
                  )}
                  {detayModal.pasaportNo && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Pasaport No</p><p className="text-sm text-gray-900 dark:text-white font-medium font-mono">{detayModal.pasaportNo}</p></div>
                      <KopyalaButonu metin={detayModal.pasaportNo} />
                    </div>
                  )}
                  {detayModal.sektor && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Sektör</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.sektor}</p></div>
                      <KopyalaButonu metin={detayModal.sektor} />
                    </div>
                  )}
                </div>
              </div>

              {/* İletişim */}
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">İletişim</p>
                <div className="space-y-3">
                  {detayModal.eposta && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">E-posta</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.eposta}</p></div>
                      <KopyalaButonu metin={detayModal.eposta} />
                    </div>
                  )}
                  {detayModal.telefonlar && detayModal.telefonlar.length > 0 && detayModal.telefonlar[0] && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Telefonlar</p>
                      {detayModal.telefonlar.filter(t => t).map((tel, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{tel}</p>
                          <KopyalaButonu metin={tel} />
                        </div>
                      ))}
                    </div>
                  )}
                  {detayModal.adresler && detayModal.adresler.length > 0 && detayModal.adresler[0] && (
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Adresler</p>
                      {detayModal.adresler.filter(a => a).map((adres, i) => (
                        <div key={i} className="flex items-start justify-between py-1 gap-2">
                          <p className="text-sm text-gray-900 dark:text-white font-medium flex-1">{adres}</p>
                          <KopyalaButonu metin={adres} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notlar */}
              {(() => {
                const musteriNotlari = notlar.filter(n => n.musteriId === detayModal.id);
                if (musteriNotlari.length === 0) return null;
                return (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">Notlar ({musteriNotlari.length})</p>
                    <div className="space-y-2">
                      {musteriNotlari.map((not) => (
                        <div key={not.id} className="flex items-start justify-between gap-2 py-1">
                          <div className="flex-1">
                            <p className={`text-sm ${not.onemli ? "text-amber-700 dark:text-amber-300 font-semibold" : "text-gray-700 dark:text-slate-300"}`}>
                              {not.onemli && <span className="mr-1">⭐</span>}
                              {not.metin}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                              {new Date(not.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <KopyalaButonu metin={not.metin} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Etiketler */}
              {detayModal.etiketler && detayModal.etiketler.length > 0 && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Etiketler ({detayModal.etiketler.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {detayModal.etiketler.map((etiket, i) => (
                      <div key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                        <span>#{etiket}</span>
                        <KopyalaButonu metin={etiket} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yüklenen Dosyalar */}
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Yüklenen Dosyalar
                </p>
                {detayDosyalarYukleniyor ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500">Yükleniyor...</p>
                ) : detayDosyalar.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500">Henüz dosya yüklenmemiş.</p>
                ) : (
                  <div className="space-y-2">
                    {detayDosyalar.map((dosya) => (
                      <div key={dosya.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${dosya.dosya_tipi?.includes('pdf') ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-500'}`}>
                            {dosya.dosya_tipi?.includes('pdf') ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{dosya.orijinal_ad}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{(dosya.boyut / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/musteriler/${detayModal.id}/dosyalar/${dosya.id}/indir`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="İndir"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kayıt Bilgisi */}
              {detayModal.kayitTarihi && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500">Kayıt Tarihi: {new Date(detayModal.kayitTarihi).toLocaleDateString("tr-TR")}</p>
                </div>
              )}
            </div>

            {/* Alt Buton */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end rounded-b-2xl">
              <button onClick={() => setDetayModal(null)}
                className="px-5 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Not / Yorum Modalı ---- */}
      {notModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setNotModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Başlık */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notlar</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{musteriAdi(notModal)}</p>
              </div>
              <button onClick={() => setNotModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer text-gray-500 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Yeni Not Ekle */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
              <textarea value={yeniNot} onChange={(e) => setYeniNot(e.target.value)} rows={2}
                placeholder="Yeni not yazın..."
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none" />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked={yeniNotOnemli} onChange={(e) => setYeniNotOnemli(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-white/20 text-amber-500 focus:ring-amber-500 cursor-pointer" />
                  Önemli olarak işaretle
                </label>
                <button onClick={() => { if (yeniNot.trim()) { notEkle(notModal.id, yeniNot.trim(), yeniNotOnemli); logEkle("diger", `"${musteriAdi(notModal)}" için not eklendi.`); setYeniNot(""); setYeniNotOnemli(false); } }}
                  disabled={!yeniNot.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors">
                  Ekle
                </button>
              </div>
            </div>
            {/* Not Listesi */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {notlar.filter((n) => n.musteriId === notModal.id).length === 0 ? (
                <p className="text-center text-gray-400 dark:text-slate-500 py-6 text-sm">Henüz not eklenmemiş.</p>
              ) : (
                notlar.filter((n) => n.musteriId === notModal.id).sort((a, b) => new Date(b.tarih) - new Date(a.tarih)).map((n) => (
                  <div key={n.id} className={`p-3 rounded-lg border ${
                    n.onemli
                      ? "border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5"
                      : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-800 dark:text-slate-200 flex-1">
                        {n.onemli && <span className="text-amber-500 mr-1">★</span>}
                        {n.metin}
                      </p>
                      <button onClick={() => notSil(n.id)} title="Notu Sil" className="shrink-0 w-6 h-6 rounded hover:bg-red-100 dark:hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{new Date(n.tarih).toLocaleString("tr-TR")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Paket Uzatma Modalı ---- */}
      {uzatModal && <UzatModalBilesen lisans={uzatModal} onKapat={() => setUzatModal(null)} onBasarili={(guncellenen) => {
        setTumLisanslar((prev) => prev.map((l) => l.id === guncellenen.id ? { ...l, ...guncellenen } : l));
        setUzatModal(null);
      }} />}
    </div>
  );
}

/* ============================================= */
/*  Paket Uzatma Modalı                          */
/* ============================================= */

function UzatModalBilesen({ lisans, onKapat, onBasarili }) {
  const [uzatmaGun, setUzatmaGun] = useState(365);
  const [ucretAlindi, setUcretAlindi] = useState(false);
  const [yeniFiyat, setYeniFiyat] = useState(lisans.fiyat || 0);
  const [faturaNo, setFaturaNo] = useState("");
  const [faturaTarihi, setFaturaTarihi] = useState(new Date().toISOString().slice(0, 10));
  const [notlar, setNotlar] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

  const mevcutBitis = lisans.bitis_tarihi ? new Date(lisans.bitis_tarihi) : new Date();
  const yeniBitis = new Date(mevcutBitis);
  yeniBitis.setDate(yeniBitis.getDate() + Number(uzatmaGun));
  const yeniBitisStr = yeniBitis.toISOString().slice(0, 10);

  const tarihGoster = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR");
  };

  const uzatmaYap = async () => {
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await apiPut(`/lisanslar/${lisans.id}`, {
        bitis_tarihi: yeniBitisStr,
        fiyat: Number(yeniFiyat),
        fatura_no: faturaNo || null,
        fatura_tarihi: faturaTarihi || null,
        odeme_durumu: ucretAlindi ? "odendi" : "odenmedi",
        notlar: notlar || lisans.notlar,
      });
      if (res.basarili) {
        onBasarili({
          id: lisans.id,
          bitis_tarihi: yeniBitisStr,
          fiyat: Number(yeniFiyat),
          fatura_no: faturaNo,
          odeme_durumu: ucretAlindi ? "odendi" : "odenmedi",
        });
      } else {
        setHata(res.mesaj || "Bir hata oluştu");
      }
    } catch (err) {
      setHata("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onKapat}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Paket Uzatma</h3>
              <p className="text-emerald-100 text-sm">{lisans.urun_adi} - {lisans.paket_adi}</p>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div className="p-6 space-y-5">
          {/* Mevcut Durum */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Mevcut Bitiş</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{tarihGoster(lisans.bitis_tarihi)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Mevcut Fiyat</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{Number(lisans.fiyat || 0).toLocaleString("tr-TR")} ₺</p>
            </div>
          </div>

          {/* Uzatma Süresi */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">Uzatma Süresi</label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 90, 180, 365].map((gun) => (
                <button
                  key={gun}
                  type="button"
                  onClick={() => setUzatmaGun(gun)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    uzatmaGun === gun
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                      : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  {gun} Gün
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">veya</span>
              <input
                type="number"
                value={uzatmaGun}
                onChange={(e) => setUzatmaGun(Math.max(1, Number(e.target.value)))}
                className="w-24 px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white"
                min="1"
              />
              <span className="text-xs text-gray-500 dark:text-slate-400">gün</span>
            </div>
          </div>

          {/* Yeni Bitiş */}
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-400">Yeni Bitiş Tarihi:</span>
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{tarihGoster(yeniBitisStr)}</span>
            </div>
          </div>

          {/* Fiyat ve Ücret */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Uzatma Ücreti (₺)</label>
              <input
                type="number"
                value={yeniFiyat}
                onChange={(e) => setYeniFiyat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ucretAlindi}
                  onChange={(e) => setUcretAlindi(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Ücret alındı</span>
              </label>
            </div>
          </div>

          {/* Fatura Bilgileri */}
          {ucretAlindi && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Fatura No</label>
                <input
                  type="text"
                  value={faturaNo}
                  onChange={(e) => setFaturaNo(e.target.value)}
                  placeholder="FAT-2024-001"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/10 border border-blue-300 dark:border-blue-500/30 text-sm text-gray-900 dark:text-white placeholder-blue-300 dark:placeholder-blue-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Fatura Tarihi</label>
                <input
                  type="date"
                  value={faturaTarihi}
                  onChange={(e) => setFaturaTarihi(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/10 border border-blue-300 dark:border-blue-500/30 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Notlar */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Notlar (Opsiyonel)</label>
            <textarea
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              rows={2}
              placeholder="Uzatma ile ilgili notlar..."
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 resize-none"
            />
          </div>

          {/* Hata */}
          {hata && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{hata}</p>
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onKapat}
            className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            İptal
          </button>
          <button
            onClick={uzatmaYap}
            disabled={yukleniyor}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2"
          >
            {yukleniyor ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Uzat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
