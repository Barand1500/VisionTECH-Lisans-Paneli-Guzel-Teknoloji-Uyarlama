/* ============================================= */
/*  Güzel Teknoloji - Giriş Sayfası (Login)      */
/*  Kullanıcı kimlik doğrulama ekranı            */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../baglam/AuthContext";

export default function LoginPage() {
  /* ---- Form State Tanımlamaları ---- */
  const [epostaAdresi, setEpostaAdresi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarisizSayi, setBasarisizSayi] = useState(0);

  /* ---- Şifremi Unuttum Modalı ---- */
  const [sifreModalAcik, setSifreModalAcik] = useState(false);
  const [sifirlamaEposta, setSifirlamaEposta] = useState("");
  const [modalGonderiliyor, setModalGonderiliyor] = useState(false);
  const [modalSonuc, setModalSonuc] = useState(""); // "" | "basarili" | "hata"
  const [modalSonucMesaj, setModalSonucMesaj] = useState("");

  const yonlendirici = useNavigate();
  const { girisYap } = useAuth();

  /* ---- Giriş Formu Gönderme İşlemi ---- */
  const girisIsle = async (e) => {
    e.preventDefault();
    setHataMesaji("");
    setYukleniyor(true);

    try {
      await girisYap(epostaAdresi, sifre);
      yonlendirici("/dashboard");
    } catch (hata) {
      const yeniSayi = basarisizSayi + 1;
      setBasarisizSayi(yeniSayi);
      setHataMesaji(hata.message || "Giriş başarısız. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  /* ---- Şifremi Unuttum Modal Aç ---- */
  const sifreModalAc = () => {
    setSifirlamaEposta("");
    setModalSonuc("");
    setModalSonucMesaj("");
    setSifreModalAcik(true);
  };

  /* ---- Tarayıcı / Cihaz Bilgisi ---- */
  const tarayiciBilgisiAl = () => {
    const ua = navigator.userAgent;
    let tarayici = "Bilinmiyor";
    if (ua.includes("Edg/")) tarayici = "Microsoft Edge";
    else if (ua.includes("Chrome/")) tarayici = "Google Chrome";
    else if (ua.includes("Firefox/")) tarayici = "Mozilla Firefox";
    else if (ua.includes("Safari/") && !ua.includes("Chrome")) tarayici = "Safari";
    else if (ua.includes("OPR/") || ua.includes("Opera")) tarayici = "Opera";
    return tarayici;
  };

  const bilgisayarBilgisiAl = () => {
    const ua = navigator.userAgent;
    let platform = navigator.platform || "Bilinmiyor";
    if (ua.includes("Windows NT 10")) platform = "Windows 10/11";
    else if (ua.includes("Windows NT 6.3")) platform = "Windows 8.1";
    else if (ua.includes("Windows NT 6.1")) platform = "Windows 7";
    else if (ua.includes("Mac OS X")) platform = "macOS";
    else if (ua.includes("Linux")) platform = "Linux";
    else if (ua.includes("Android")) platform = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) platform = "iOS";
    return platform;
  };

  /* ---- Şifre Sıfırlama Gönder ---- */
  const sifreSifirlaGonder = async () => {
    if (!sifirlamaEposta.trim()) return;
    setModalGonderiliyor(true);
    setModalSonuc("");

    try {
      const yanit = await fetch("http://localhost:5000/api/yetki/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eposta: sifirlamaEposta.trim(),
          tarayiciBilgisi: tarayiciBilgisiAl(),
          bilgisayarBilgisi: bilgisayarBilgisiAl(),
        }),
      });
      const veri = await yanit.json();
      if (veri.basarili) {
        setModalSonuc("basarili");
        setModalSonucMesaj(veri.mesaj || "Yeni şifreniz e-posta adresinize gönderildi.");
      } else {
        setModalSonuc("hata");
        setModalSonucMesaj(veri.mesaj || "İşlem başarısız oldu.");
      }
    } catch {
      setModalSonuc("hata");
      setModalSonucMesaj("Sunucuya bağlanılamadı.");
    } finally {
      setModalGonderiliyor(false);
    }
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
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-sm">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium">{hataMesaji}</p>
                  {basarisizSayi >= 2 && (
                    <p className="text-xs mt-1 text-red-500 dark:text-red-400">
                      {basarisizSayi} başarısız deneme. Şifrenizi hatırlayamıyorsanız aşağıdaki "Şifremi Unuttum" linkini kullanın.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---- Giriş Formu ---- */}
          <form onSubmit={girisIsle} className="space-y-5">

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

          {/* ---- Şifremi Unuttum Linki ---- */}
          <div className="text-center mt-4">
            <button
              onClick={sifreModalAc}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors cursor-pointer"
            >
              Şifremi Unuttum
            </button>
          </div>

          {/* ---- Alt Bilgi ---- */}
          <p className="text-center text-gray-400 dark:text-slate-500 text-xs mt-4">
            Güzel Teknoloji Yönetim Paneli
          </p>
        </div>
      </div>

      {/* ---- Şifremi Unuttum Modalı ---- */}
      {sifreModalAcik && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSifreModalAcik(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>

            {/* Modal Başlık */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Şifremi Unuttum</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Kayıtlı e-posta adresinize yeni şifre gönderilecek</p>
                </div>
              </div>
              <button
                onClick={() => setSifreModalAcik(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sonuç Mesajı */}
            {modalSonuc === "basarili" && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {modalSonucMesaj}
              </div>
            )}
            {modalSonuc === "hata" && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {modalSonucMesaj}
              </div>
            )}

            {/* E-posta Alanı */}
            {modalSonuc !== "basarili" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    E-posta Adresiniz
                  </label>
                  <input
                    type="email"
                    value={sifirlamaEposta}
                    onChange={(e) => setSifirlamaEposta(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !modalGonderiliyor && sifirlamaEposta.trim() && sifreSifirlaGonder()}
                    placeholder="ornek@sirket.com"
                    className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">Sistemde kayıtlı e-posta adresinizi girin. Yeni şifreniz bu adrese gönderilecektir.</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSifreModalAcik(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    onClick={sifreSifirlaGonder}
                    disabled={modalGonderiliyor || !sifirlamaEposta.trim()}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {modalGonderiliyor ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Şifremi Sıfırla
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Başarılıysa Kapat Butonu */}
            {modalSonuc === "basarili" && (
              <button
                onClick={() => setSifreModalAcik(false)}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                Tamam
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
