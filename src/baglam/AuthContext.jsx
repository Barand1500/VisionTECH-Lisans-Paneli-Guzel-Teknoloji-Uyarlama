/* ============================================= */
/*  Güzel Teknoloji - Kimlik Doğrulama Context   */
/*  Login/Logout, token yönetimi                  */
/* ============================================= */

import { createContext, useContext, useState, useEffect } from "react";
import { apiPost, apiGet } from "../yardimcilar/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gt_kullanici")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("gt_token"));
  const [yukleniyor, setYukleniyor] = useState(true);

  /* Sayfa yüklendiğinde token geçerli mi kontrol et */
  useEffect(() => {
    if (!token) { setYukleniyor(false); return; }
    apiGet("/yetki/ben")
      .then((v) => { setKullanici(v.veri); localStorage.setItem("gt_kullanici", JSON.stringify(v.veri)); })
      .catch(() => { setToken(null); setKullanici(null); localStorage.removeItem("gt_token"); localStorage.removeItem("gt_kullanici"); })
      .finally(() => setYukleniyor(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const girisYap = async (eposta, sifre) => {
    const yanit = await apiPost("/yetki/giris", { eposta, sifre });
    if (!yanit?.token || !yanit?.kullanici) throw new Error("Giri\u015F yan\u0131t\u0131 ge\u00E7ersiz.");
    setToken(yanit.token);
    setKullanici(yanit.kullanici);
    localStorage.setItem("gt_token", yanit.token);
    localStorage.setItem("gt_kullanici", JSON.stringify(yanit.kullanici));
    return yanit;
  };

  const cikisYap = async () => {
    try { await apiPost("/yetki/cikis", {}); } catch { /* tokensiz de temizle */ }
    setToken(null);
    setKullanici(null);
    localStorage.removeItem("gt_token");
    localStorage.removeItem("gt_kullanici");
  };

  return (
    <AuthContext.Provider value={{ kullanici, token, yukleniyor, girisYap, cikisYap }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
