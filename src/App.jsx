/* ============================================= */
/*  Güzel Teknoloji - Ana Uygulama Bileşeni      */
/*  Rota tanımlamaları ve sayfa yönlendirmeleri   */
/* ============================================= */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ---- Sayfa Bilesenleri ---- */
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import MusterilerPage from "./pages/MusterilerPage";
import MusteriEklePage from "./pages/MusteriEklePage";
import BayilerPage from "./pages/BayilerPage";
import LisansYonetimiPage from "./pages/LisansYonetimiPage";
import YonetimPage from "./pages/YonetimPage";
import RaporlarPage from "./pages/RaporlarPage";
import MusteriPaketleriPage from "./pages/MusteriPaketleriPage";
import AktiviteLoguPage from "./pages/AktiviteLoguPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---- Varsayilan Yonlendirme: Anasayfa -> Login ---- */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ---- Giris Sayfasi Rotasi ---- */}
        <Route path="/login" element={<LoginPage />} />

        {/* ---- Dashboard Rotalari (Ic ice / Nested) ---- */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Varsayilan alt sayfa: Ozet */}
          <Route index element={<DashboardHome />} />

          {/* Musteriler Sayfasi */}
          <Route path="musteriler" element={<MusterilerPage />} />

          {/* Musteri Ekleme Sayfasi */}
          <Route path="musteri-ekle" element={<MusteriEklePage />} />

          {/* Musteri Paketleri Sayfasi */}
          <Route path="musteri-paketleri/:id" element={<MusteriPaketleriPage />} />

          {/* Bayiler Sayfasi */}
          <Route path="bayiler" element={<BayilerPage />} />

          {/* Yonetim Sayfasi */}
          <Route path="yonetim" element={<YonetimPage />} />

          {/* Raporlar Sayfasi */}
          <Route path="raporlar" element={<RaporlarPage />} />

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
