/* ============================================= */
/*  Güzel Teknoloji - Giriş Sayfası (Login)      */
/*  Kullanıcı kimlik doğrulama ekranı            */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ---- Geçici Test Kullanıcı Bilgileri ---- */
const GECERLI_EPOSTA = "test@test.com";
const GECERLI_SIFRE = "123";

export default function LoginPage() {
  /* ---- Form State Tanımlamaları ---- */
  const [epostaAdresi, setEpostaAdresi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const yonlendirici = useNavigate();

  /* ---- Giriş Formu Gönderme İşlemi ---- */
  const girisYap = (e) => {
    e.preventDefault();
    setHataMesaji("");
    setYukleniyor(true);

    // Küçük bir gecikme ile gerçekçi bir deneyim simülasyonu
    setTimeout(() => {
      if (epostaAdresi === GECERLI_EPOSTA && sifre === GECERLI_SIFRE) {
        /* Başarılı giriş - Dashboard'a yönlendir */
        yonlendirici("/dashboard");
      } else {
        /* Hatalı giriş - Uyarı mesajı göster */
        setHataMesaji("E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.");
      }
      setYukleniyor(false);
    }, 600);
  };

  /* ---- Sayfa Render ---- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* ---- Giriş Kartı ---- */}
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-8">

          {/* ---- Logo ve Başlık Alanı ---- */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-600 mb-4">
              <span className="text-xl font-bold text-white">GT</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Güzel Teknoloji</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Yönetim paneline giriş yapın</p>
          </div>

          {/* ---- Hata Mesajı Alanı ---- */}
          {hataMesaji && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-sm text-center">
              {hataMesaji}
            </div>
          )}

          {/* ---- Giriş Formu ---- */}
          <form onSubmit={girisYap} className="space-y-5">

            {/* ---- E-posta Alanı ---- */}
            <div>
              <label htmlFor="eposta" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                E-posta Adresi
              </label>
              <input
                id="eposta"
                type="email"
                placeholder="ornek@sirket.com"
                value={epostaAdresi}
                onChange={(e) => setEpostaAdresi(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* ---- Şifre Alanı ---- */}
            <div>
              <label htmlFor="sifre" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Şifre
              </label>
              <input
                id="sifre"
                type="password"
                placeholder="••••••••"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* ---- Giriş Butonu ---- */}
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          {/* ---- Alt Bilgi ---- */}
          <p className="text-center text-gray-400 dark:text-slate-500 text-xs mt-6">
            Demo: test@test.com / 123
          </p>
        </div>
      </div>
    </div>
  );
}
