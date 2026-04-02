/* ============================================= */
/*  Güzel Teknoloji - Ana Uygulama Bileşeni      */
/*  Rota tanımlamaları ve sayfa yönlendirmeleri   */
/* ============================================= */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./baglam/AuthContext";

/* ---- Sayfa Bilesenleri ---- */
import LoginPage from "./sayfalar/LoginPage";
import DashboardLayout from "./duzenler/DashboardLayout";
import DashboardHome from "./sayfalar/DashboardHome";
import MusterilerPage from "./sayfalar/MusterilerPage";
import MusteriEklePage from "./sayfalar/MusteriEklePage";
import MusteriDetayPage from "./sayfalar/MusteriDetayPage";
import BayilerPage from "./sayfalar/BayilerPage";
import BayiEklePage from "./sayfalar/BayiEklePage";
import BayiDetayPage from "./sayfalar/BayiDetayPage";
import LisansYonetimiPage from "./sayfalar/LisansYonetimiPage";
import YonetimPage from "./sayfalar/YonetimPage";
import RaporlarPage from "./sayfalar/RaporlarPage";
import MusteriPaketleriPage from "./sayfalar/MusteriPaketleriPage";
import AktiviteLoguPage from "./sayfalar/AktiviteLoguPage";
import TakvimPage from "./sayfalar/TakvimPage";

/* ---- Korunmus Rota Bileşeni ---- */
function KorunmusRota({ children }) {
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
      <div className="text-gray-500 dark:text-slate-400">Yükleniyor...</div>
    </div>
  );
  if (!kullanici) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---- Varsayilan Yonlendirme: Anasayfa -> Login ---- */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ---- Giris Sayfasi Rotasi ---- */}
        <Route path="/login" element={<LoginPage />} />

        {/* ---- Dashboard Rotalari (Ic ice / Nested) ---- */}
        <Route path="/dashboard" element={<KorunmusRota><DashboardLayout /></KorunmusRota>}>
          {/* Varsayilan alt sayfa: Ozet */}
          <Route index element={<DashboardHome />} />

          {/* Musteriler Sayfasi */}
          <Route path="musteriler" element={<MusterilerPage />} />

          {/* Musteri Ekleme Sayfasi */}
          <Route path="musteri-ekle" element={<MusteriEklePage />} />

          {/* Musteri Detay Sayfasi */}
          <Route path="musteri/:id" element={<MusteriDetayPage />} />

          {/* Musteri Duzenleme Sayfasi (ayni form) */}
          <Route path="musteri-duzenle/:id" element={<MusteriEklePage />} />

          {/* Musteri Paketleri Sayfasi */}
          <Route path="musteri-paketleri/:id" element={<MusteriPaketleriPage />} />

          {/* Bayiler Sayfasi */}
          <Route path="bayiler" element={<BayilerPage />} />

          {/* Bayi Ekleme Sayfasi */}
          <Route path="bayi-ekle" element={<BayiEklePage />} />

          {/* Bayi Detay Sayfasi */}
          <Route path="bayi/:id" element={<BayiDetayPage />} />

          {/* Bayi Duzenleme Sayfasi (ayni form) */}
          <Route path="bayi-duzenle/:id" element={<BayiEklePage />} />

          {/* Yonetim Sayfasi */}
          <Route path="yonetim" element={<YonetimPage />} />

          {/* Raporlar Sayfasi */}
          <Route path="raporlar" element={<RaporlarPage />} />

          {/* Takvim / Hatirlatma Sayfasi */}
          <Route path="takvim" element={<TakvimPage />} />

          {/* Aktivite Logu Sayfasi */}
          <Route path="aktivite-logu" element={<AktiviteLoguPage />} />

          {/* Lisans Yonetimi Sayfasi - simdilik pasif */}
          {/* <Route path="yonetim/lisanslar" element={<LisansYonetimiPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
