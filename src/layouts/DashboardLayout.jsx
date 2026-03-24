/* ============================================= */
/*  Güzel Teknoloji - Dashboard Ana Yerleşim     */
/*  Sidebar + Ana İçerik Alanı yapısı            */
/*  Yan menü daraltma/genişletme state yönetimi  */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const [daraltilmis, setDaraltilmis] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* ---- Sol Taraf: Sabit Yan Menü ---- */}
      <Sidebar daraltilmis={daraltilmis} daraltToggle={() => setDaraltilmis((o) => !o)} />

      {/* ---- Sağ Taraf: Dinamik İçerik Alanı ---- */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
