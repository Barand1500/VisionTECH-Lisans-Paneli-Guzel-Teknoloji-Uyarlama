/* ============================================= */
/*  Güzel Teknoloji - Müşteri Veri Bağlamı       */
/*  Uygulamada müşteri verilerini tüm sayfalarda */
/*  paylaşmak için kullanılan React Context       */
/*  Sayfa yenilenene kadar veriler bellekte kalır */
/* ============================================= */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../yardimcilar/api";

const MusteriContext = createContext();

export function MusteriProvider({ children }) {
  const [musteriler, setMusteriler] = useState([]);
  const [notlar, setNotlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  /* ---- Backend'den müşteri ve not verilerini çek ---- */
  const verileriYukle = useCallback(async () => {
    try {
      const [mRes, nRes] = await Promise.all([
        apiGet("/musteriler"),
        apiGet("/notlar"),
      ]);
      /* Backend snake_case → camelCase dönüşümü */
      const donustur = (m) => ({
        id: m.id,
        tur: m.tur,
        adSoyad: m.ad_soyad,
        sirketAdi: m.sirket_adi,
        yetkiliKisi: m.yetkili_kisi,
        eposta: m.eposta,
        tcKimlikNo: m.tc_kimlik_no,
        vergiNo: m.vergi_no,
        vergiDairesi: m.vergi_dairesi,
        pasaportNo: m.pasaport_no,
        sektorId: m.sektor_id,
        sektor: m.sektor_adi || '',
        etiketler: m.etiketler || [],
        durum: m.durum,
        ustMusteriId: m.ust_musteri_id,
        kayitTarihi: m.kayit_tarihi,
        telefonlar: m.telefonlar || [],
        adresler: m.adresler || [],
      });
      setMusteriler(mRes.veri.map(donustur));
      setNotlar(nRes.veri.map((n) => ({
        id: n.id,
        musteriId: n.musteri_id,
        metin: n.metin,
        tarih: n.tarih,
        onemli: !!n.onemli,
      })));
    } catch (e) {
      console.error("Musteri verileri yuklenemedi:", e);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { verileriYukle(); }, [verileriYukle]);

  const musteriEkle = async (musteri) => {
    const govde = {
      tur: musteri.tur,
      ad_soyad: musteri.adSoyad || null,
      sirket_adi: musteri.sirketAdi || null,
      yetkili_kisi: musteri.yetkiliKisi || null,
      eposta: musteri.eposta || null,
      tc_kimlik_no: musteri.tcKimlikNo || null,
      vergi_no: musteri.vergiNo || null,
      vergi_dairesi: musteri.vergiDairesi || null,
      pasaport_no: musteri.pasaportNo || null,
      sektor_id: musteri.sektorId || null,
      etiketler: musteri.etiketler?.length > 0 ? musteri.etiketler : null,
      durum: musteri.durum || "aktif",
      ust_musteri_id: musteri.ustMusteriId || null,
      telefonlar: musteri.telefonlar?.filter(t => t) || [],
      adresler: musteri.adresler?.filter(a => a) || (musteri.adres ? [musteri.adres] : []),
    };
    const yanit = await apiPost("/musteriler", govde);
    
    /* Eğer notlar varsa, ayrıca not ekle */
    if (musteri.notlar && musteri.notlar.trim()) {
      await apiPost("/notlar", {
        musteri_id: yanit.id,
        metin: musteri.notlar.trim(),
        onemli: false,
      });
    }
    
    await verileriYukle();
    return { ...musteri, id: yanit.id };
  };

  const musteriGuncelle = async (id, guncelVeri) => {
    const govde = {};
    if (guncelVeri.adSoyad !== undefined) govde.ad_soyad = guncelVeri.adSoyad;
    if (guncelVeri.sirketAdi !== undefined) govde.sirket_adi = guncelVeri.sirketAdi;
    if (guncelVeri.yetkiliKisi !== undefined) govde.yetkili_kisi = guncelVeri.yetkiliKisi;
    if (guncelVeri.eposta !== undefined) govde.eposta = guncelVeri.eposta;
    if (guncelVeri.tcKimlikNo !== undefined) govde.tc_kimlik_no = guncelVeri.tcKimlikNo;
    if (guncelVeri.vergiNo !== undefined) govde.vergi_no = guncelVeri.vergiNo;
    if (guncelVeri.vergiDairesi !== undefined) govde.vergi_dairesi = guncelVeri.vergiDairesi;
    if (guncelVeri.pasaportNo !== undefined) govde.pasaport_no = guncelVeri.pasaportNo;
    if (guncelVeri.sektorId !== undefined) govde.sektor_id = guncelVeri.sektorId;
    if (guncelVeri.durum !== undefined) govde.durum = guncelVeri.durum;
    if (guncelVeri.telefonlar) govde.telefonlar = guncelVeri.telefonlar.filter(t => t);
    if (guncelVeri.adresler) govde.adresler = guncelVeri.adresler.filter(a => a);
    await apiPut(`/musteriler/${id}`, govde);
    await verileriYukle();
  };

  const musteriSil = async (id) => {
    await apiDelete(`/musteriler/${id}`);
    setMusteriler((onceki) => onceki.filter((m) => m.id !== id));
  };

  const topluSil = async (idler) => {
    await Promise.all(idler.map((id) => apiDelete(`/musteriler/${id}`)));
    const silSet = new Set(idler);
    setMusteriler((onceki) => onceki.filter((m) => !silSet.has(m.id)));
  };

  const topluDurumGuncelle = async (idler, durum) => {
    await Promise.all(idler.map((id) => apiPut(`/musteriler/${id}`, { durum })));
    const idSet = new Set(idler);
    setMusteriler((onceki) =>
      onceki.map((m) => (idSet.has(m.id) ? { ...m, durum } : m))
    );
  };

  /* ---- Not CRUD ---- */
  const notEkle = async (musteriId, metin, onemli = false) => {
    await apiPost("/notlar", { musteri_id: musteriId, metin, onemli });
    await verileriYukle();
  };

  const notSil = async (notId) => {
    await apiDelete(`/notlar/${notId}`);
    setNotlar((onceki) => onceki.filter((n) => n.id !== notId));
  };

  return (
    <MusteriContext.Provider value={{ musteriler, yukleniyor, musteriEkle, musteriGuncelle, musteriSil, topluSil, topluDurumGuncelle, notlar, notEkle, notSil, verileriYukle }}>
      {children}
    </MusteriContext.Provider>
  );
}

export function useMusteriler() {
  const context = useContext(MusteriContext);
  if (!context) throw new Error("useMusteriler, MusteriProvider içinde kullanılmalıdır.");
  return context;
}
