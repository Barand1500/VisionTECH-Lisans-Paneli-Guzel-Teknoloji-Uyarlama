/* ============================================= */
/*  Güzel Teknoloji - Aktivite Log Bağlamı       */
/*  Uygulama genelindeki kullanıcı işlemlerini   */
/*  kaydeden ve takip eden React Context          */
/* ============================================= */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "../yardimcilar/api";

const AktiviteLogContext = createContext();

/* ---- Log Türü Etiketleri ---- */
const TUR_ETIKETLERI = {
  musteri_ekleme: { etiket: "Müşteri Ekleme", renk: "emerald" },
  musteri_guncelleme: { etiket: "Müşteri Güncelleme", renk: "blue" },
  musteri_silme: { etiket: "Müşteri Silme", renk: "red" },
  toplu_silme: { etiket: "Toplu Silme", renk: "red" },
  musteri_durum: { etiket: "Durum Değişikliği", renk: "amber" },
  lisans_goruntuleme: { etiket: "Lisans Görüntüleme", renk: "violet" },
  lisans_olusturma: { etiket: "Lisans Oluşturma", renk: "violet" },
  bayi_ekleme: { etiket: "Bayi Ekleme", renk: "emerald" },
  giris: { etiket: "Giriş", renk: "blue" },
  cikis: { etiket: "Çıkış", renk: "amber" },
  diger: { etiket: "Diğer", renk: "gray" },
};

export function AktiviteLogProvider({ children }) {
  const [loglar, setLoglar] = useState([]);

  const loglariYukle = useCallback(async () => {
    try {
      const yanit = await apiGet("/aktivite-loglar");
      setLoglar(yanit.veri.map((l) => ({
        id: l.id,
        tur: l.tip,
        detay: l.mesaj,
        tarih: l.tarih,
      })));
    } catch (e) {
      console.error("Aktivite loglari yuklenemedi:", e);
    }
  }, []);

  useEffect(() => { loglariYukle(); }, [loglariYukle]);

  const logSil = async (periyot, baslangic, bitis) => {
    try {
      let url = `/aktivite-loglar?periyot=${periyot}`;
      if (periyot === "aralik" && baslangic && bitis) {
        url += `&baslangic=${baslangic}&bitis=${bitis}`;
      }
      const yanit = await apiDelete(url);
      await loglariYukle();
      return yanit;
    } catch (e) {
      console.error("Loglar silinemedi:", e);
      throw e;
    }
  };

  const logEkle = async (tur, detay) => {
    try {
      await apiPost("/aktivite-loglar", { tip: tur, mesaj: detay });
      await loglariYukle();
    } catch (e) {
      console.error("Log eklenemedi:", e);
    }
  };

  return (
    <AktiviteLogContext.Provider value={{ loglar, logEkle, logSil, TUR_ETIKETLERI, loglariYukle }}>
      {children}
    </AktiviteLogContext.Provider>
  );
}

export function useAktiviteLog() {
  const context = useContext(AktiviteLogContext);
  if (!context) throw new Error("useAktiviteLog, AktiviteLogProvider içinde kullanılmalıdır.");
  return context;
}
