/* ============================================= */
/*  Guzel Teknoloji - Musteri Detay Sayfasi       */
/*  Musteri bilgileri, kisiler, paketler,         */
/*  dosyalar ve notlar sekmeli gorunum            */
/* ============================================= */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "../yardimcilar/api";
import KopyalaButonu from "../bilesenler/KopyalaButonu";

/* ---- Sekme Tanimlari ---- */
const SEKMELER = [
  { id: "genel", etiket: "Genel Bilgiler", ikon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "kisiler", etiket: "Kişiler", ikon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "paketler", etiket: "Paketler", ikon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { id: "dosyalar", etiket: "Dosyalar", ikon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "notlar", etiket: "Notlar", ikon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" },
];

/* ---- Telefon Formatlama ---- */
const telefonFormatla = (numara) => {
  if (!numara) return "";
  const temiz = numara.replace(/\D/g, "");
  if (temiz.length < 10) return numara;
  return `(${temiz.slice(0, 3)}) ${temiz.slice(3, 6)} ${temiz.slice(6, 8)} ${temiz.slice(8, 10)}`;
};

/* ---- Tarih Formatlama ---- */
const tarihFormatla = (tarih) => {
  if (!tarih) return "-";
  return new Date(tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
};

export default function MusteriDetayPage() {
  const { id } = useParams();
  const git = useNavigate();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [musteri, setMusteri] = useState(null);
  const [aktifSekme, setAktifSekme] = useState("genel");

  /* Alt veriler */
  const [kisiler, setKisiler] = useState([]);
  const [paketler, setPaketler] = useState([]);
  const [dosyalar, setDosyalar] = useState([]);
  const [notlar, setNotlar] = useState([]);
  const [telefonlar, setTelefonlar] = useState([]);
  const [adresler, setAdresler] = useState([]);

  /* Modal state'leri */
  const [kisiModal, setKisiModal] = useState(null); // null = kapali, {} = yeni, {id:..} = duzenleme
  const [kisiSilOnay, setKisiSilOnay] = useState(null);
  const [notModal, setNotModal] = useState(false);
  const [yeniNot, setYeniNot] = useState("");
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false);
  const dosyaInputRef = useRef(null);

  /* ---- Verileri Yukle ---- */
  useEffect(() => {
    const veriYukle = async () => {
      setYukleniyor(true);
      try {
        /* Musteri bilgileri */
        const musteriYanit = await apiGet(`/musteriler/${id}`);
        setMusteri(musteriYanit.veri);

        /* Telefonlar */
        try {
          const telYanit = await apiGet(`/musteriler/${id}/telefonlar`);
          setTelefonlar(telYanit.veri || []);
        } catch { setTelefonlar([]); }

        /* Adresler */
        try {
          const adrYanit = await apiGet(`/musteriler/${id}/adresler`);
          setAdresler(adrYanit.veri || []);
        } catch { setAdresler([]); }

        /* Kisiler */
        try {
          const kisiYanit = await apiGet(`/kisiler/musteri/${id}`);
          setKisiler(kisiYanit.veri || []);
        } catch { setKisiler([]); }

        /* Paketler */
        try {
          const paketYanit = await apiGet(`/lisanslar/musteri/${id}`);
          setPaketler(paketYanit.veri || []);
        } catch { setPaketler([]); }

        /* Dosyalar */
        try {
          const dosyaYanit = await apiGet(`/musteriler/${id}/dosyalar`);
          setDosyalar(dosyaYanit.veri || []);
        } catch { setDosyalar([]); }

        /* Notlar */
        try {
          const notYanit = await apiGet(`/notlar/musteri/${id}`);
          setNotlar(notYanit.veri || []);
        } catch { setNotlar([]); }

      } catch (e) {
        console.error("Musteri yuklenemedi:", e);
        git("/dashboard/musteriler");
      } finally {
        setYukleniyor(false);
      }
    };
    veriYukle();
  }, [id, git]);

  /* ---- Musteri Adi ---- */
  const musteriAdi = musteri?.ad_soyad || musteri?.sirket_adi || `Müşteri #${id}`;

  /* ---- Tip Etiketi ---- */
  const tipEtiket = (tur) => {
    if (tur === "gercek") return { ad: "Gerçek Kişi", renk: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" };
    if (tur === "tuzel") return { ad: "Tüzel Kişi", renk: "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400" };
    return { ad: "Yabancı", renk: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" };
  };

  /* ---- Kisi Kaydet ---- */
  const kisiKaydet = async (form) => {
    try {
      if (kisiModal?.id) {
        await apiPut(`/kisiler/musteri/${id}/${kisiModal.id}`, form);
      } else {
        await apiPost(`/kisiler/musteri/${id}`, form);
      }
      const kisiYanit = await apiGet(`/kisiler/musteri/${id}`);
      setKisiler(kisiYanit.veri || []);
      setKisiModal(null);
    } catch (e) {
      console.error("Kisi kaydedilemedi:", e);
    }
  };

  /* ---- Kisi Sil ---- */
  const kisiSil = async () => {
    if (!kisiSilOnay) return;
    try {
      await apiDelete(`/kisiler/musteri/${id}/${kisiSilOnay.id}`);
      setKisiler((prev) => prev.filter((k) => k.id !== kisiSilOnay.id));
      setKisiSilOnay(null);
    } catch (e) {
      console.error("Kisi silinemedi:", e);
    }
  };

  /* ---- Not Ekle ---- */
  const notEkle = async () => {
    if (!yeniNot.trim()) return;
    try {
      await apiPost(`/notlar/musteri/${id}`, { metin: yeniNot, onemli: false });
      const notYanit = await apiGet(`/notlar/musteri/${id}`);
      setNotlar(notYanit.veri || []);
      setYeniNot("");
      setNotModal(false);
    } catch (e) {
      console.error("Not eklenemedi:", e);
    }
  };

  /* ---- Not Sil ---- */
  const notSil = async (notId) => {
    try {
      await apiDelete(`/notlar/${notId}`);
      setNotlar((prev) => prev.filter((n) => n.id !== notId));
    } catch (e) {
      console.error("Not silinemedi:", e);
    }
  };

  /* ---- Dosya Yukle ---- */
  const dosyaYukle = async (e) => {
    const secilen = e.target.files;
    if (!secilen || secilen.length === 0) return;
    setDosyaYukleniyor(true);
    try {
      const formData = new FormData();
      for (const dosya of secilen) {
        formData.append("dosyalar", dosya);
      }
      await apiUpload(`/musteriler/${id}/dosyalar`, formData);
      const dosyaYanit = await apiGet(`/musteriler/${id}/dosyalar`);
      setDosyalar(dosyaYanit.veri || []);
    } catch (e) {
      console.error("Dosya yuklenemedi:", e);
    } finally {
      setDosyaYukleniyor(false);
      if (dosyaInputRef.current) dosyaInputRef.current.value = "";
    }
  };

  /* ---- Dosya Sil ---- */
  const dosyaSil = async (dosyaId) => {
    try {
      await apiDelete(`/musteriler/${id}/dosyalar/${dosyaId}`);
      setDosyalar((prev) => prev.filter((d) => d.id !== dosyaId));
    } catch (e) {
      console.error("Dosya silinemedi:", e);
    }
  };

  /* ---- Dosya Boyutu Formatla ---- */
  const dosyaBoyutuFormatla = (boyut) => {
    if (boyut < 1024) return `${boyut} B`;
    if (boyut < 1024 * 1024) return `${(boyut / 1024).toFixed(1)} KB`;
    return `${(boyut / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ---- Yukleniyor ---- */
  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ---- Musteri bulunamadi ---- */
  if (!musteri) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-slate-400">Müşteri bulunamadı.</p>
        <button onClick={() => git("/dashboard/musteriler")} className="mt-4 text-blue-600 hover:underline">
          Müşterilere Dön
        </button>
      </div>
    );
  }

  const tip = tipEtiket(musteri.tur);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Ust Bar */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => git("/dashboard/musteriler")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{musteriAdi}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Müşteri Detayları</p>
        </div>
        <button onClick={() => git(`/dashboard/musteri-duzenle/${id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Düzenle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sol Panel - Ozet */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 sticky top-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
                <span className="text-3xl font-bold text-white">{musteriAdi.charAt(0).toUpperCase()}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center">{musteriAdi}</h2>
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${tip.renk}`}>{tip.ad}</span>
            </div>

            {/* Durum */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                musteri.durum === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400"
              }`}>
                <span className={`w-2 h-2 rounded-full ${musteri.durum === "aktif" ? "bg-emerald-500" : "bg-gray-400"}`} />
                {musteri.durum === "aktif" ? "Aktif" : "Pasif"}
              </span>
            </div>

            {/* Hizli Bilgiler */}
            <div className="space-y-4">
              {musteri.eposta && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">E-posta</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900 dark:text-white break-all">{musteri.eposta}</p>
                    <KopyalaButonu metin={musteri.eposta} />
                  </div>
                </div>
              )}
              {telefonlar.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Telefon</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900 dark:text-white">{telefonFormatla(telefonlar[0].telefon)}</p>
                    <KopyalaButonu metin={telefonlar[0].telefon} />
                  </div>
                </div>
              )}
              {musteri.sektor_adi && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Sektör</p>
                  <p className="text-sm text-gray-900 dark:text-white">{musteri.sektor_adi}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Kayıt Tarihi</p>
                <p className="text-sm text-gray-900 dark:text-white">{tarihFormatla(musteri.kayit_tarihi)}</p>
              </div>
            </div>

            {/* Istatistikler */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kisiler.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Kişi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{paketler.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Paket</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{dosyalar.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Dosya</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{notlar.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Not</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sag Panel - Sekmeler */}
        <div className="lg:col-span-3">
          {/* Sekme Basliklari */}
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto">
            {SEKMELER.map((sekme) => (
              <button key={sekme.id} onClick={() => setAktifSekme(sekme.id)}
                className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  aktifSekme === sekme.id
                    ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5"
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={sekme.ikon} />
                </svg>
                {sekme.etiket}
              </button>
            ))}
          </div>

          {/* Sekme Icerik */}
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
            {/* GENEL BILGILER */}
            {aktifSekme === "genel" && (
              <div className="space-y-6">
                {/* Kimlik/Vergi Bilgileri */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Kimlik / Vergi Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {musteri.tc_kimlik_no && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">TC Kimlik No</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{musteri.tc_kimlik_no}</p>
                          <KopyalaButonu metin={musteri.tc_kimlik_no} />
                        </div>
                      </div>
                    )}
                    {musteri.vergi_no && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Vergi No</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{musteri.vergi_no}</p>
                          <KopyalaButonu metin={musteri.vergi_no} />
                        </div>
                      </div>
                    )}
                    {musteri.vergi_dairesi && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Vergi Dairesi</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{musteri.vergi_dairesi}</p>
                          <KopyalaButonu metin={musteri.vergi_dairesi} />
                        </div>
                      </div>
                    )}
                    {musteri.pasaport_no && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Pasaport No</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{musteri.pasaport_no}</p>
                          <KopyalaButonu metin={musteri.pasaport_no} />
                        </div>
                      </div>
                    )}
                    {musteri.yetkili_kisi && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Yetkili Kişi</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{musteri.yetkili_kisi}</p>
                          <KopyalaButonu metin={musteri.yetkili_kisi} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Telefonlar */}
                {telefonlar.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Telefonlar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {telefonlar.map((tel, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Telefon {idx + 1}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{telefonFormatla(tel.telefon)}</p>
                            <KopyalaButonu metin={tel.telefon} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Adresler */}
                {adresler.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Adresler</h3>
                    <div className="space-y-4">
                      {adresler.map((adr, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Adres {idx + 1}</p>
                          <div className="flex items-start gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">{adr.adres}</p>
                            <KopyalaButonu metin={adr.adres} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Etiketler */}
                {musteri.etiketler && musteri.etiketler.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Etiketler</h3>
                    <div className="flex flex-wrap gap-2">
                      {(typeof musteri.etiketler === "string" ? JSON.parse(musteri.etiketler) : musteri.etiketler).map((etiket, idx) => (
                        <span key={idx} className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                          {etiket}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* KISILER */}
            {aktifSekme === "kisiler" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">İletişim Kişileri ({kisiler.length})</h3>
                  <button onClick={() => setKisiModal({})}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Kişi Ekle
                  </button>
                </div>

                {kisiler.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-slate-400 mb-2">Henüz kişi eklenmemiş</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">Bu müşteriye ait iletişim kişilerini ekleyin</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kisiler.map((kisi) => (
                      <div key={kisi.id} className={`p-4 rounded-xl border transition-all ${
                        kisi.birincil ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{kisi.ad_soyad?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">{kisi.ad_soyad}</p>
                                {kisi.birincil === 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">Birincil</span>
                                )}
                              </div>
                              {kisi.unvan && <p className="text-xs text-gray-500 dark:text-slate-400">{kisi.unvan}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setKisiModal(kisi)} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => setKisiSilOnay(kisi)} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {kisi.departman && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                              </svg>
                              <span>{kisi.departman}</span>
                            </div>
                          )}
                          {kisi.telefon && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{telefonFormatla(kisi.telefon)}</span>
                              <KopyalaButonu metin={kisi.telefon} />
                            </div>
                          )}
                          {kisi.cep_telefon && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span>{telefonFormatla(kisi.cep_telefon)}</span>
                              <KopyalaButonu metin={kisi.cep_telefon} />
                            </div>
                          )}
                          {kisi.eposta && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate">{kisi.eposta}</span>
                              <KopyalaButonu metin={kisi.eposta} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAKETLER */}
            {aktifSekme === "paketler" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Satın Alınan Paketler ({paketler.length})</h3>
                  <button onClick={() => git(`/dashboard/musteri-paketleri/${id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Paket Yönetimi
                  </button>
                </div>

                {paketler.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-gray-500 dark:text-slate-400 mb-2">Henüz paket eklenmemiş</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">Bu müşteriye ait lisans paketlerini ekleyin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paketler.map((paket) => (
                      <div key={paket.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{paket.urun_adi || "Ürün"}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{paket.lisans_tipi || "Standart"} • {paket.kullanici_sayisi || 1} Kullanıcı</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            paket.durum === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                          }`}>
                            {paket.durum === "aktif" ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500">Başlangıç</p>
                            <p className="text-gray-900 dark:text-white">{tarihFormatla(paket.baslangic_tarihi)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 dark:text-slate-500">Bitiş</p>
                            <p className="text-gray-900 dark:text-white">{tarihFormatla(paket.bitis_tarihi)}</p>
                          </div>
                          {paket.lisans_anahtari && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-400 dark:text-slate-500">Lisans Anahtarı</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded font-mono text-gray-900 dark:text-white">{paket.lisans_anahtari}</code>
                                <KopyalaButonu metin={paket.lisans_anahtari} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DOSYALAR */}
            {aktifSekme === "dosyalar" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Dosyalar ({dosyalar.length})</h3>
                  <div>
                    <input type="file" ref={dosyaInputRef} onChange={dosyaYukle} multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" />
                    <button onClick={() => dosyaInputRef.current?.click()} disabled={dosyaYukleniyor}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50">
                      {dosyaYukleniyor ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      Dosya Yükle
                    </button>
                  </div>
                </div>

                {dosyalar.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-slate-400 mb-2">Henüz dosya yüklenmemiş</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">PDF, PNG, JPG formatlarını destekler</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dosyalar.map((dosya) => (
                      <div key={dosya.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{dosya.orijinal_ad}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{dosyaBoyutuFormatla(dosya.boyut)} • {tarihFormatla(dosya.yuklenme_tarihi)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={`${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}/uploads/${dosya.dosya_adi}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                          <button onClick={() => dosyaSil(dosya.id)} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NOTLAR */}
            {aktifSekme === "notlar" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Notlar ({notlar.length})</h3>
                  <button onClick={() => setNotModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Not Ekle
                  </button>
                </div>

                {notlar.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <p className="text-gray-500 dark:text-slate-400 mb-2">Henüz not eklenmemiş</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">Bu müşteriye ait notlarınızı ekleyin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notlar.map((not) => (
                      <div key={not.id} className={`p-4 rounded-xl border ${
                        not.onemli ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {not.onemli === 1 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500 text-white">Önemli</span>
                            )}
                            <p className="text-xs text-gray-400 dark:text-slate-500">{tarihFormatla(not.tarih)}</p>
                          </div>
                          <button onClick={() => notSil(not.id)} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{not.metin}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Kisi Modal ---- */}
      {kisiModal && <KisiModal kisi={kisiModal} onKapat={() => setKisiModal(null)} onKaydet={kisiKaydet} />}

      {/* ---- Kisi Sil Onay ---- */}
      {kisiSilOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setKisiSilOnay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Kişiyi Sil</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                <span className="font-semibold text-gray-900 dark:text-white">{kisiSilOnay.ad_soyad}</span> adlı kişiyi silmek istediğinize emin misiniz?
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setKisiSilOnay(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
                <button onClick={kisiSil} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer">Sil</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Not Modal ---- */}
      {notModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setNotModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Yeni Not Ekle</h3>
            <textarea value={yeniNot} onChange={(e) => setYeniNot(e.target.value)} rows={4} placeholder="Notunuzu yazın..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setNotModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
              <button onClick={notEkle} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold cursor-pointer">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Kisi Modal Bileseni ---- */
function KisiModal({ kisi, onKapat, onKaydet }) {
  const [form, setForm] = useState({
    ad_soyad: kisi?.ad_soyad || "",
    unvan: kisi?.unvan || "",
    departman: kisi?.departman || "",
    telefon: kisi?.telefon || "",
    cep_telefon: kisi?.cep_telefon || "",
    eposta: kisi?.eposta || "",
    notlar: kisi?.notlar || "",
    birincil: kisi?.birincil === 1,
  });

  const guncelle = (alan, deger) => setForm((prev) => ({ ...prev, [alan]: deger }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onKapat}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{kisi?.id ? "Kişi Düzenle" : "Yeni Kişi Ekle"}</h3>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Soyad <span className="text-red-500">*</span></label>
            <input type="text" value={form.ad_soyad} onChange={(e) => guncelle("ad_soyad", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Unvan</label>
              <input type="text" value={form.unvan} onChange={(e) => guncelle("unvan", e.target.value)} placeholder="Genel Müdür"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Departman</label>
              <input type="text" value={form.departman} onChange={(e) => guncelle("departman", e.target.value)} placeholder="Satın Alma"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Telefon</label>
              <input type="text" value={form.telefon} onChange={(e) => guncelle("telefon", e.target.value)} placeholder="(5XX) XXX XX XX"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Cep Telefon</label>
              <input type="text" value={form.cep_telefon} onChange={(e) => guncelle("cep_telefon", e.target.value)} placeholder="(5XX) XXX XX XX"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">E-posta</label>
            <input type="email" value={form.eposta} onChange={(e) => guncelle("eposta", e.target.value)} placeholder="kisi@sirket.com"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Notlar</label>
            <textarea value={form.notlar} onChange={(e) => guncelle("notlar", e.target.value)} rows={2} placeholder="Kişi hakkında notlar..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="birincil" checked={form.birincil} onChange={(e) => guncelle("birincil", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
            <label htmlFor="birincil" className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer">Birincil İletişim Kişisi</label>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
          <button onClick={onKapat} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
          <button onClick={() => onKaydet(form)} disabled={!form.ad_soyad.trim()}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
