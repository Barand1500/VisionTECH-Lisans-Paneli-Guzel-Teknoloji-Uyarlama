/* ============================================= */
/*  Güzel Teknoloji - Tema Yönetim Bağlamı       */
/*  Gece/Gündüz modu değiştirme ve localStorage  */
/*  üzerinden kullanıcı tercihini saklama         */
/* ============================================= */

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  /* ---- Başlangıç değeri: localStorage veya varsayılan olarak karanlık ---- */
  const [karanlikMod, setKaranlikMod] = useState(() => {
    const kayitli = localStorage.getItem("guzelteknoloji-tema");
    return kayitli ? kayitli === "dark" : true;
  });

  /* ---- HTML root elemanına dark sınıfını ekle/kaldır ---- */
  useEffect(() => {
    const root = document.documentElement;
    if (karanlikMod) {
      root.classList.add("dark");
      localStorage.setItem("guzelteknoloji-tema", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("guzelteknoloji-tema", "light");
    }
  }, [karanlikMod]);

  const temaToggle = () => setKaranlikMod((onceki) => !onceki);

  return (
    <ThemeContext.Provider value={{ karanlikMod, temaToggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme, ThemeProvider içinde kullanılmalıdır.");
  return context;
}
