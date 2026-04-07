/* ============================================= */
/*  Güzel Teknoloji - Yedek Yöneticisi            */
/*  Yedek Al (JSON/SQL) & Geri Yükle              */
/*  createPortal ile body seviyesinde render      */
/* ============================================= */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiPost, BASE_URL } from "../yardimcilar/api";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";

export default function YedeklemeModal({ acik, kapat }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [secilenDosya, setSecilenDosya] = useState(null);
  const [yedekFormati, setYedekFormati] = useState("json"); // json veya sql
  const dosyaRef = useRef(null);
  const { loglariYukle, logEkle } = useAktiviteLog();

  /* Modal kapanırken durumu sıfırla */
  useEffect(() => {
    if (!acik) { setSonuc(null); setSecilenDosya(null); }
  }, [acik]);

  /* ESC tuşu ile kapat */
  useEffect(() => {
    if (!acik) return;
    const esc = (e) => { if (e.key === "Escape") kapat(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [acik, kapat]);

  if (!acik) return null;

  /* ---- Yedek Al ---- */
  const yedekAl = async () => {
    setYukleniyor(true);
    setSonuc(null);
    try {
      const token = localStorage.getItem("gt_token");
      const res = await fetch(`${BASE_URL}/api/yedekleme/indir?format=${yedekFormati}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("İndirme başarısız");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const tarih = new Date().toISOString().slice(0, 10);
      a.download = `guzel_teknoloji_yedek_${tarih}.${yedekFormati}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSonuc({ tip: "basari", mesaj: `Yedek dosyası başarıyla indirildi (${yedekFormati.toUpperCase()} formatında).` });
      /* Aktivite logü */
      await logEkle("yedek_alma", `Yedek alındı (${yedekFormati.toUpperCase()} formatı)`);
      await loglariYukle();
    } catch (err) {
      setSonuc({ tip: "hata", mesaj: "Yedek alınırken hata oluştu: " + err.message });
    } finally {
      setYukleniyor(false);
    }
  };

  /* ---- Dosya Seç ---- */
  const dosyaSec = (e) => {
    const dosya = e.target.files?.[0];
    if (dosya) setSecilenDosya(dosya);
  };

  /* ---- Yedek Yükle ---- */
  const yedekYukle = async () => {
    if (!secilenDosya) return;
    
    const dosyaAdi = secilenDosya.name.toLowerCase();
    const jsonMi = dosyaAdi.endsWith(".json");
    const sqlMi = dosyaAdi.endsWith(".sql");
    
    if (!jsonMi && !sqlMi) {
      setSonuc({ tip: "hata", mesaj: "Sadece JSON veya SQL formatındaki yedek dosyaları geri yüklenebilir." });
      return;
    }
    
    setYukleniyor(true);
    setSonuc(null);
    try {
      const icerik = await secilenDosya.text();
      let sonuc;
      
      if (jsonMi) {
        /* JSON dosyası */
        let veri;
        try {
          veri = JSON.parse(icerik);
        } catch (parseErr) {
          throw new Error("Dosya geçerli bir JSON formatında değil.");
        }
        sonuc = await apiPost("/yedekleme/yukle", veri);
      } else {
        /* SQL dosyası */
        sonuc = await apiPost("/yedekleme/yukle-sql", { sql: icerik });
      }
      
      if (sonuc.basarili) {
        setSonuc({ tip: "basari", mesaj: sonuc.mesaj || "Yedek başarıyla geri yüklendi. Sayfa yenilenecek..." });
        /* Aktivite logü */
        await logEkle("geri_yukleme", `Yedek geri yüklendi (${jsonMi ? "JSON" : "SQL"})`);
        await loglariYukle();
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSonuc({ tip: "hata", mesaj: sonuc.mesaj || "Geri yükleme başarısız." });
      }
    } catch (err) {
      console.error("Yedek yükleme hatası:", err);
      setSonuc({ tip: "hata", mesaj: err.message || "Dosya işlenirken hata oluştu." });
    } finally {
      setYukleniyor(false);
      setSecilenDosya(null);
      if (dosyaRef.current) dosyaRef.current.value = "";
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop — koyu ve tam kapatıcı */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={kapat} />

      {/* Modal Kutusu */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 border border-gray-200/80 dark:border-white/10 animate-[fadeIn_0.2s_ease-out]">

        {/* ── Başlık ── */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Yedek Yöneticisi</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Veritabanını yedekle veya geri yükle</p>
            </div>
          </div>
          <button onClick={kapat} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Ayırıcı ── */}
        <div className="mx-6 h-px bg-gray-200 dark:bg-white/10" />

        {/* ── İçerik ── */}
        <div className="p-6 space-y-5">

          {/* Yedek Al Kartı */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Yedek Al</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Tüm tabloları seçtiğiniz formatta bilgisayarınıza indirin.</p>
                
                {/* Format Seçimi */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-gray-500 dark:text-slate-400">Format:</span>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-white/15">
                    <button
                      type="button"
                      onClick={() => setYedekFormati("json")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        yedekFormati === "json"
                          ? "bg-emerald-600 text-white"
                          : "bg-white dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10"
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setYedekFormati("sql")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-l border-gray-300 dark:border-white/15 ${
                        yedekFormati === "sql"
                          ? "bg-emerald-600 text-white"
                          : "bg-white dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10"
                      }`}
                    >
                      SQL
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={yedekAl}
                  disabled={yukleniyor}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {yedekFormati.toUpperCase()} İndir
                </button>
              </div>
            </div>
          </div>

          {/* Geri Yükle Kartı */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Geri Yükle</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Daha önce alınmış bir JSON veya SQL yedek dosyasını seçerek veritabanını geri yükleyin.</p>

                <input type="file" ref={dosyaRef} accept=".json,.sql" onChange={dosyaSec} className="hidden" />

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => dosyaRef.current?.click()}
                    disabled={yukleniyor}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {secilenDosya ? secilenDosya.name : "Dosya Seç (.json / .sql)"}
                  </button>

                  {secilenDosya && (
                    <button
                      onClick={yedekYukle}
                      disabled={yukleniyor}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      Yükle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sonuç Mesajı */}
          {sonuc && (
            <div className={`flex items-center gap-3 p-3.5 rounded-xl text-sm ${
              sonuc.tip === "basari"
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20"
            }`}>
              {sonuc.tip === "basari" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{sonuc.mesaj}</span>
            </div>
          )}

          {/* Yükleniyor */}
          {yukleniyor && (
            <div className="flex items-center justify-center gap-2.5 py-2 text-sm text-gray-500 dark:text-slate-400">
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>İşlem devam ediyor...</span>
            </div>
          )}
        </div>

        {/* ── Alt Bilgi ── */}
        <div className="mx-6 h-px bg-gray-200 dark:bg-white/10" />
        <div className="px-6 py-3.5">
          <div className="flex flex-col gap-1.5 text-xs text-gray-400 dark:text-slate-500">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Geri yükleme işlemi mevcut verilerin üzerine yazar.</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Hem JSON hem SQL formatı geri yükleme için desteklenir.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
