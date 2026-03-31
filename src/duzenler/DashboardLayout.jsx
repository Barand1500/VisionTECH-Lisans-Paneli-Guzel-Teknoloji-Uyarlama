/* ============================================= */
/*  Güzel Teknoloji - Dashboard Ana Yerleşim     */
/*  Sidebar + Ana İçerik Alanı yapısı            */
/*  Yan menü daraltma/genişletme state yönetimi  */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../bilesenler/Sidebar";

export default function DashboardLayout() {
  const [daraltilmis, setDaraltilmis] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      {/* ---- Sol Taraf: Sabit Yan Menü ---- */}
      <div className="relative shrink-0">
        <Sidebar daraltilmis={daraltilmis} daraltToggle={() => setDaraltilmis((o) => !o)} />

        {/* ---- Daralt/Genişlet Butonu (aside dışında, clipping olmasın) ---- */}
        <button
          onClick={() => setDaraltilmis((o) => !o)}
          className="absolute -right-3.5 top-8 z-30 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-200 cursor-pointer"
          title={daraltilmis ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-300 ${daraltilmis ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* ---- Sağ Taraf: Dinamik İçerik Alanı ---- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
