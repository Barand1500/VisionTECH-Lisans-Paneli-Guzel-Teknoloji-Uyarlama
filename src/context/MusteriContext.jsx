/* ============================================= */
/*  Güzel Teknoloji - Müşteri Veri Bağlamı       */
/*  Uygulamada müşteri verilerini tüm sayfalarda */
/*  paylaşmak için kullanılan React Context       */
/*  Sayfa yenilenene kadar veriler bellekte kalır */
/* ============================================= */

import { createContext, useContext, useState } from "react";

const MusteriContext = createContext();

/* ---- Hazır Örnek Müşteriler (geliştirme amaçlı) ---- */
const ORNEK_MUSTERILER = [
  {
    id: 1001,
    tur: "gercek",
    adSoyad: "Ercan Güzel",
    yetkiliKisi: "Ercan Güzel",
    eposta: "ercan@guzelteknoloji.com",
    tcKimlikNo: "12345678901",
    telefonlar: ["(532) 111 22 33"],
    adresler: ["İstanbul, Kadıköy"],
    durum: "Aktif",
    sektor: "Teknoloji",
    kayitTarihi: "2025-06-15",
    ustMusteriId: null,
  },
  {
    id: 1002,
    tur: "gercek",
    adSoyad: "Baran Ürüncan",
    yetkiliKisi: "Baran Ürüncan",
    eposta: "baran@guzelteknoloji.com",
    tcKimlikNo: "98765432109",
    telefonlar: ["(542) 333 44 55"],
    adresler: ["Ankara, Çankaya"],
    durum: "Aktif",
    sektor: "Yazılım",
    kayitTarihi: "2025-09-20",
    ustMusteriId: 1001,
  },
  {
    id: 1003,
    tur: "tuzel",
    sirketAdi: "Güzel Teknoloji A.Ş.",
    yetkiliKisi: "Sercan Güzel",
    eposta: "sercan@guzelteknoloji.com",
    vergiNo: "1234567890",
    vergiDairesi: "Konak",
    telefonlar: ["(555) 666 77 88"],
    adresler: ["İzmir, Bornova"],
    durum: "Aktif",
    sektor: "E-Ticaret",
    kayitTarihi: "2026-01-10",
    ustMusteriId: null,
  },
  {
    id: 1004,
    tur: "yabanci",
    adSoyad: "John Smith",
    yetkiliKisi: "John Smith",
    eposta: "john@globaltech.com",
    pasaportNo: "AB1234567",
    telefonlar: ["(212) 555 99 00"],
    adresler: ["İstanbul, Levent"],
    durum: "Pasif",
    sektor: "Danışmanlık",
    kayitTarihi: "2026-02-05",
    ustMusteriId: null,
  },
  {
    id: 1005,
    tur: "tuzel",
    sirketAdi: "Veri Sistemleri Ltd.",
    yetkiliKisi: "Ayşe Kara",
    eposta: "ayse@verisistem.com",
    vergiNo: "9876543210",
    vergiDairesi: "Çankaya",
    telefonlar: ["(312) 444 55 66"],
    adresler: ["Ankara, Kızılay"],
    durum: "Aktif",
    sektor: "Bilişim",
    kayitTarihi: "2026-03-01",
    ustMusteriId: 1001,
  },
];

export function MusteriProvider({ children }) {
  const [musteriler, setMusteriler] = useState(ORNEK_MUSTERILER);

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

  const musteriSil = (id) => {
    setMusteriler((onceki) => onceki.filter((m) => m.id !== id));
  };

  const topluSil = (idler) => {
    const silSet = new Set(idler);
    setMusteriler((onceki) => onceki.filter((m) => !silSet.has(m.id)));
  };

  const topluDurumGuncelle = (idler, durum) => {
    const idSet = new Set(idler);
    setMusteriler((onceki) =>
      onceki.map((m) => (idSet.has(m.id) ? { ...m, durum } : m))
    );
  };

  return (
    <MusteriContext.Provider value={{ musteriler, musteriEkle, musteriGuncelle, musteriSil, topluSil, topluDurumGuncelle }}>
      {children}
    </MusteriContext.Provider>
  );
}

export function useMusteriler() {
  const context = useContext(MusteriContext);
  if (!context) throw new Error("useMusteriler, MusteriProvider içinde kullanılmalıdır.");
  return context;
}
