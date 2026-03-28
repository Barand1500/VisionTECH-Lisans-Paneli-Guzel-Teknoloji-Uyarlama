/* ============================================= */
/*  Güzel Teknoloji - Yan Menü Bileşeni (Sidebar)*/
/*  Dashboard sol tarafındaki sabit navigasyon    */
/*  Daraltma/genişletme özelliği: daraltılınca    */
/*  sadece simgeler görünür, logo "GT" olur       */
/*  Gece/Gündüz modu geçiş butonu içerir          */
/* ============================================= */

import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import GlobalArama from "./GlobalArama";

/* ---- Menü Öğelerinin Tanımlanması ---- */
const menuOgeleri = [
  {
    baslik: "Özet",
    yol: "/dashboard",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    baslik: "Müşteriler",
    yol: "/dashboard/musteriler",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    baslik: "Bayiler",
    yol: "/dashboard/bayiler",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    baslik: "Yönetim",
    yol: "/dashboard/yonetim",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    /* altMenuler: Lisans Yönetimi şimdilik pasif
    altMenuler: [
      {
        baslik: "Lisans Yönetimi",
        yol: "/dashboard/yonetim/lisanslar",
        ikon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        ),
      },
    ], */
  },
  {
    baslik: "Raporlar",
    yol: "/dashboard/raporlar",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    baslik: "Aktivite Logu",
    yol: "/dashboard/aktivite-logu",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({ daraltilmis, daraltToggle }) {
  const { karanlikMod, temaToggle } = useTheme();
  const location = useLocation();
  const [aramaAcik, setAramaAcik] = useState(false);

  /* ---- Ctrl+K ile Global Arama ---- */
  useEffect(() => {
    const kisayol = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setAramaAcik(true);
      }
    };
    window.addEventListener("keydown", kisayol);
    return () => window.removeEventListener("keydown", kisayol);
  }, []);

  /* ---- NavLink İçin Aktif / Pasif Stil Sınıfları ---- */
  const stilBelirle = ({ isActive }) =>
    `flex items-center ${daraltilmis ? "justify-center" : ""} gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
        : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
    }`;

  return (
    <aside className={`${daraltilmis ? "w-20" : "w-64"} min-h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300 relative shrink-0`}>

      {/* ---- Daralt/Genişlet Butonu ---- */}
      <button
        onClick={daraltToggle}
        className="absolute -right-3.5 top-8 z-30 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-200 cursor-pointer"
        title={daraltilmis ? "Menüyü Genişlet" : "Menüyü Daralt"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-300 ${daraltilmis ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ---- Logo Alanı ---- */}
      <div className={`${daraltilmis ? "px-3" : "px-6"} py-6 border-b border-gray-200 dark:border-white/10 transition-all duration-300`}>
        <div className={`flex items-center ${daraltilmis ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">GT</span>
          </div>
          {!daraltilmis && (
            <div className="overflow-hidden">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">Güzel Teknoloji</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">Yönetim Paneli</p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Global Arama Tetikleyici ---- */}
      <div className={`${daraltilmis ? "px-2" : "px-4"} pt-4 pb-2 transition-all duration-300`}>
        <button
          onClick={() => setAramaAcik(true)}
          className={`w-full flex items-center ${daraltilmis ? "justify-center" : ""} gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 text-gray-400 dark:text-slate-500 transition-all duration-200 cursor-pointer group`}
          title={daraltilmis ? "Ara (Ctrl+K)" : ""}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {!daraltilmis && (
            <>
              <span className="flex-1 text-left text-sm">Ara...</span>
              <kbd className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 dark:text-slate-600">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* ---- Global Arama Modalı ---- */}
      <GlobalArama acik={aramaAcik} kapat={() => setAramaAcik(false)} />

      {/* ---- Navigasyon Menüsü ---- */}
      <nav className={`flex-1 ${daraltilmis ? "px-2" : "px-4"} py-4 space-y-1 transition-all duration-300`}>
        {menuOgeleri.map((oge) => {
          /* Alt menülü öge (Yönetim gibi) */
          if (oge.altMenuler) {
            const altAktif = oge.altMenuler.some((a) => location.pathname.startsWith(a.yol));
            const kendisiAktif = location.pathname === oge.yol;
            const acik = altAktif || kendisiAktif;

            return (
              <div key={oge.yol}>
                <NavLink to={oge.yol} end className={stilBelirle} title={daraltilmis ? oge.baslik : ""}>
                  {oge.ikon}
                  {!daraltilmis && <span className="flex-1">{oge.baslik}</span>}
                  {!daraltilmis && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-200 ${acik ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </NavLink>
                {/* Alt menü öğeleri - daraltılmışken gizle */}
                {acik && !daraltilmis && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-white/10 pl-3">
                    {oge.altMenuler.map((alt) => (
                      <NavLink
                        key={alt.yol}
                        to={alt.yol}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                          }`
                        }
                      >
                        {alt.ikon}
                        <span>{alt.baslik}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          /* Normal menü ögesi */
          return (
            <NavLink key={oge.yol} to={oge.yol} end className={stilBelirle} title={daraltilmis ? oge.baslik : ""}>
              {oge.ikon}
              {!daraltilmis && <span>{oge.baslik}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* ---- Alt Kısım: Tema Geçişi ve Çıkış ---- */}
      <div className={`${daraltilmis ? "px-2" : "px-4"} py-4 border-t border-gray-200 dark:border-white/10 space-y-1 transition-all duration-300`}>

        {/* ---- Gece / Gündüz Modu Geçiş Butonu ---- */}
        <button
          onClick={temaToggle}
          className={`w-full flex items-center ${daraltilmis ? "justify-center" : ""} gap-3 px-4 py-3 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-200 text-sm font-medium cursor-pointer`}
          title={daraltilmis ? (karanlikMod ? "Gündüz Modu" : "Gece Modu") : ""}
        >
          {karanlikMod ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {!daraltilmis && <span>{karanlikMod ? "Gündüz Modu" : "Gece Modu"}</span>}
        </button>

        {/* ---- Çıkış Butonu ---- */}
        <NavLink
          to="/login"
          className={`flex items-center ${daraltilmis ? "justify-center" : ""} gap-3 px-4 py-3 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 text-sm font-medium`}
          title={daraltilmis ? "Çıkış Yap" : ""}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!daraltilmis && <span>Çıkış Yap</span>}
        </NavLink>
      </div>
    </aside>
  );
}
