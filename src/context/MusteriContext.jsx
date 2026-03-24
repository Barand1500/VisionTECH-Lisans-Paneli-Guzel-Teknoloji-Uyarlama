/* ============================================= */
/*  Güzel Teknoloji - Müşteri Veri Bağlamı       */
/*  Uygulamada müşteri verilerini tüm sayfalarda */
/*  paylaşmak için kullanılan React Context       */
/*  Sayfa yenilenene kadar veriler bellekte kalır */
/* ============================================= */

import { createContext, useContext, useState } from "react";

const MusteriContext = createContext();

export function MusteriProvider({ children }) {
  const [musteriler, setMusteriler] = useState([]);

  const musteriEkle = (musteri) => {
    const yeniMusteri = {
      ...musteri,
      id: Date.now(),
      kayitTarihi: new Date().toISOString().slice(0, 10),
    };
    setMusteriler((onceki) => [...onceki, yeniMusteri]);
    return yeniMusteri;
  };

  const musteriGuncelle = (id, guncelVeri) => {
    setMusteriler((onceki) =>
      onceki.map((m) => (m.id === id ? { ...m, ...guncelVeri } : m))
    );
  };

  return (
    <MusteriContext.Provider value={{ musteriler, musteriEkle, musteriGuncelle }}>
      {children}
    </MusteriContext.Provider>
  );
}

export function useMusteriler() {
  const context = useContext(MusteriContext);
  if (!context) throw new Error("useMusteriler, MusteriProvider içinde kullanılmalıdır.");
  return context;
}
