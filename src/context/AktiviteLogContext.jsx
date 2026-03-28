/* ============================================= */
/*  Güzel Teknoloji - Aktivite Log Bağlamı       */
/*  Uygulama genelindeki kullanıcı işlemlerini   */
/*  kaydeden ve takip eden React Context          */
/* ============================================= */

import { createContext, useContext, useState } from "react";

const AktiviteLogContext = createContext();

/* ---- Log Türü Etiketleri ---- */
const TUR_ETIKETLERI = {
  musteri_ekleme: { etiket: "Müşteri Ekleme", renk: "emerald" },
  musteri_guncelleme: { etiket: "Müşteri Güncelleme", renk: "blue" },
  musteri_silme: { etiket: "Müşteri Silme", renk: "red" },
  toplu_silme: { etiket: "Toplu Silme", renk: "red" },
  musteri_durum: { etiket: "Durum Değişikliği", renk: "amber" },
  lisans_goruntuleme: { etiket: "Lisans Görüntüleme", renk: "violet" },
  diger: { etiket: "Diğer", renk: "gray" },
};

/* ---- Hazır Örnek Log Kayıtları (geliştirme amaçlı) ---- */
const ORNEK_LOGLAR = [
  {
    id: 9001,
    tur: "musteri_ekleme",
    detay: '"Ercan Güzel" adlı müşteri eklendi.',
    tarih: "2025-06-15T09:30:00.000Z",
  },
  {
    id: 9002,
    tur: "musteri_ekleme",
    detay: '"Baran Ürüncan" adlı müşteri eklendi. (Üst müşteri: Ercan Güzel)',
    tarih: "2025-09-20T14:15:00.000Z",
  },
  {
    id: 9003,
    tur: "musteri_ekleme",
    detay: '"Güzel Teknoloji A.Ş." adlı tüzel müşteri eklendi.',
    tarih: "2025-10-05T11:00:00.000Z",
  },
  {
    id: 9004,
    tur: "musteri_ekleme",
    detay: '"John Smith" adlı yabancı müşteri eklendi.',
    tarih: "2025-11-22T16:45:00.000Z",
  },
  {
    id: 9005,
    tur: "musteri_ekleme",
    detay: '"Veri Sistemleri Ltd." adlı tüzel müşteri eklendi. (Üst müşteri: Ercan Güzel)',
    tarih: "2026-01-10T14:20:00.000Z",
  },
  {
    id: 9006,
    tur: "musteri_guncelleme",
    detay: '"Ercan Güzel" adlı müşterinin sektörü güncellendi.',
    tarih: "2026-02-05T10:30:00.000Z",
  },
  {
    id: 9007,
    tur: "musteri_durum",
    detay: '"John Smith" adlı müşterinin durumu "Pasif" olarak değiştirildi.',
    tarih: "2026-02-18T11:00:00.000Z",
  },
  {
    id: 9008,
    tur: "lisans_goruntuleme",
    detay: '"Güzel Teknoloji A.Ş." için lisans belgesi görüntülendi.',
    tarih: "2026-03-12T08:30:00.000Z",
  },
];

export function AktiviteLogProvider({ children }) {
  const [loglar, setLoglar] = useState(ORNEK_LOGLAR);

  const logEkle = (tur, detay) => {
    const yeniLog = {
      id: Date.now() + Math.random(),
      tur,
      detay,
      tarih: new Date().toISOString(),
    };
    setLoglar((onceki) => [yeniLog, ...onceki]);
  };

  return (
    <AktiviteLogContext.Provider value={{ loglar, logEkle, TUR_ETIKETLERI }}>
      {children}
    </AktiviteLogContext.Provider>
  );
}

export function useAktiviteLog() {
  const context = useContext(AktiviteLogContext);
  if (!context) throw new Error("useAktiviteLog, AktiviteLogProvider içinde kullanılmalıdır.");
  return context;
}
