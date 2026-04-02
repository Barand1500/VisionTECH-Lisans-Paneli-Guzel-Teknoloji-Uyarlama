/* ============================================= */
/*  Guzel Teknoloji - Bayi Detay Sayfasi          */
/*  Bayi bilgileri, kisiler, musteriler,          */
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
  { id: "musteriler", etiket: "Müşteriler", ikon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
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

export default function BayiDetayPage() {
  const { id } = useParams();
  const git = useNavigate();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bayi, setBayi] = useState(null);
  const [aktifSekme, setAktifSekme] = useState("genel");

  /* Alt veriler */
  const [kisiler, setKisiler] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [dosyalar, setDosyalar] = useState([]);
  const [notlar, setNotlar] = useState([]);

  /* Modal state'leri */
  const [kisiModal, setKisiModal] = useState(null);
  const [kisiSilOnay, setKisiSilOnay] = useState(null);
  const [dosyaSilOnay, setDosyaSilOnay] = useState(null);
  const [notModal, setNotModal] = useState(false);
  const [yeniNot, setYeniNot] = useState("");
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false);
  const dosyaInputRef = useRef(null);

  /* ---- Verileri Yukle ---- */
  useEffect(() => {
    const veriYukle = async () => {
      setYukleniyor(true);
      try {
        /* Bayi bilgileri */
        const bayiYanit = await apiGet(`/bayiler/${id}`);
        setBayi(bayiYanit.veri);

        /* Kisiler */
        try {
          const kisiYanit = await apiGet(`/kisiler/bayi/${id}`);
          setKisiler(kisiYanit.veri || []);
        } catch { setKisiler([]); }

        /* Musteriler */
        try {
          const musteriYanit = await apiGet(`/bayiler/${id}/musteriler`);
          setMusteriler(musteriYanit.veri || []);
        } catch { setMusteriler([]); }

        /* Dosyalar */
        try {
          const dosyaYanit = await apiGet(`/bayiler/${id}/dosyalar`);
          setDosyalar(dosyaYanit.veri || []);
        } catch { setDosyalar([]); }

        /* Notlar */
        try {
          const notYanit = await apiGet(`/notlar/bayi/${id}`);
          setNotlar(notYanit.veri || []);
        } catch { setNotlar([]); }

      } catch (e) {
        console.error("Bayi yuklenemedi:", e);
        git("/dashboard/bayiler");
      } finally {
        setYukleniyor(false);
      }
    };
    veriYukle();
  }, [id, git]);

  /* ---- Bayi Adi ---- */
  const bayiAdi = bayi?.sirket_adi || `Bayi #${id}`;

  /* ---- Kisi Kaydet ---- */
  const kisiKaydet = async (form) => {
    try {
      if (kisiModal?.id) {
        await apiPut(`/kisiler/bayi/${id}/${kisiModal.id}`, form);
      } else {
        await apiPost(`/kisiler/bayi/${id}`, form);
      }
      const kisiYanit = await apiGet(`/kisiler/bayi/${id}`);
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
      await apiDelete(`/kisiler/bayi/${id}/${kisiSilOnay.id}`);
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
      await apiPost(`/notlar/bayi/${id}`, { metin: yeniNot, onemli: false });
      const notYanit = await apiGet(`/notlar/bayi/${id}`);
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
      await apiUpload(`/bayiler/${id}/dosyalar`, formData);
      const dosyaYanit = await apiGet(`/bayiler/${id}/dosyalar`);
      setDosyalar(dosyaYanit.veri || []);
    } catch (e) {
      console.error("Dosya yuklenemedi:", e);
    } finally {
      setDosyaYukleniyor(false);
      if (dosyaInputRef.current) dosyaInputRef.current.value = "";
    }
  };

  /* ---- Dosya Sil (Onay sonrasi) ---- */
  const dosyaSilOnayla = async () => {
    if (!dosyaSilOnay) return;
    try {
      await apiDelete(`/bayiler/${id}/dosyalar/${dosyaSilOnay.id}`);
      setDosyalar((prev) => prev.filter((d) => d.id !== dosyaSilOnay.id));
      setDosyaSilOnay(null);
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

  /* ---- Bayi bulunamadi ---- */
  if (!bayi) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-slate-400">Bayi bulunamadı.</p>
        <button onClick={() => git("/dashboard/bayiler")} className="mt-4 text-blue-600 hover:underline">
          Bayilere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Ust Bar */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => git("/dashboard/bayiler")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bayiAdi}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Bayi Detayları</p>
        </div>
        <button onClick={() => git(`/dashboard/bayi-duzenle/${id}`)}
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3">
                <span className="text-3xl font-bold text-white">{bayiAdi.charAt(0).toUpperCase()}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center">{bayiAdi}</h2>
              <span className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                Bayi
              </span>
            </div>

            {/* Durum */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                bayi.durum === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400"
              }`}>
                <span className={`w-2 h-2 rounded-full ${bayi.durum === "aktif" ? "bg-emerald-500" : "bg-gray-400"}`} />
                {bayi.durum === "aktif" ? "Aktif" : "Pasif"}
              </span>
            </div>

            {/* Hizli Bilgiler */}
            <div className="space-y-4">
              {bayi.eposta && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">E-posta</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900 dark:text-white break-all">{bayi.eposta}</p>
                    <KopyalaButonu metin={bayi.eposta} />
                  </div>
                </div>
              )}
              {bayi.telefon && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Telefon</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900 dark:text-white">{telefonFormatla(bayi.telefon)}</p>
                    <KopyalaButonu metin={bayi.telefon} />
                  </div>
                </div>
              )}
              {bayi.yetkili_kisi && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Yetkili Kişi</p>
                  <p className="text-sm text-gray-900 dark:text-white">{bayi.yetkili_kisi}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Kayıt Tarihi</p>
                <p className="text-sm text-gray-900 dark:text-white">{tarihFormatla(bayi.kayit_tarihi)}</p>
              </div>
            </div>

            {/* Istatistikler */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kisiler.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Kişi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{musteriler.length}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Müşteri</p>
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
                {/* Sirket Bilgileri */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Şirket Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bayi.vergi_no && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Vergi No</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{bayi.vergi_no}</p>
                          <KopyalaButonu metin={bayi.vergi_no} />
                        </div>
                      </div>
                    )}
                    {bayi.vergi_dairesi && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Vergi Dairesi</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{bayi.vergi_dairesi}</p>
                          <KopyalaButonu metin={bayi.vergi_dairesi} />
                        </div>
                      </div>
                    )}
                    {bayi.yetkili_kisi && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Yetkili Kişi</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{bayi.yetkili_kisi}</p>
                          <KopyalaButonu metin={bayi.yetkili_kisi} />
                        </div>
                      </div>
                    )}
                    {bayi.web_sitesi && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Web Sitesi</p>
                        <div className="flex items-center gap-2">
                          <a href={bayi.web_sitesi.startsWith("http") ? bayi.web_sitesi : `https://${bayi.web_sitesi}`} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">{bayi.web_sitesi}</a>
                          <KopyalaButonu metin={bayi.web_sitesi} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Iletisim Bilgileri */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">İletişim Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bayi.eposta && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">E-posta</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{bayi.eposta}</p>
                          <KopyalaButonu metin={bayi.eposta} />
                        </div>
                      </div>
                    )}
                    {bayi.telefon && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Telefon</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{telefonFormatla(bayi.telefon)}</p>
                          <KopyalaButonu metin={bayi.telefon} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adres */}
                {bayi.adres && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Adres</h3>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">{bayi.adres}</p>
                        <KopyalaButonu metin={bayi.adres} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Etiketler */}
                {bayi.etiketler && bayi.etiketler.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Etiketler</h3>
                    <div className="flex flex-wrap gap-2">
                      {(typeof bayi.etiketler === "string" ? JSON.parse(bayi.etiketler) : bayi.etiketler).map((etiket, idx) => (
                        <span key={idx} className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
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
                    <p className="text-sm text-gray-400 dark:text-slate-500">Bu bayiye ait iletişim kişilerini ekleyin</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kisiler.map((kisi) => (
                      <div key={kisi.id} className={`p-4 rounded-xl border transition-all ${
                        kisi.birincil ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{kisi.ad_soyad?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">{kisi.ad_soyad}</p>
                                {kisi.birincil === 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-600 text-white">Birincil</span>
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

            {/* MUSTERILER */}
            {aktifSekme === "musteriler" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bayiye Bağlı Müşteriler ({musteriler.length})</h3>
                </div>

                {musteriler.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-500 dark:text-slate-400 mb-2">Bu bayiye bağlı müşteri yok</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {musteriler.map((musteri) => (
                      <div key={musteri.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{(musteri.ad_soyad || musteri.sirket_adi || "?").charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{musteri.ad_soyad || musteri.sirket_adi}</p>
                              {musteri.eposta && <p className="text-xs text-gray-500 dark:text-slate-400">{musteri.eposta}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              musteri.durum === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400"
                            }`}>
                              {musteri.durum === "aktif" ? "Aktif" : "Pasif"}
                            </span>
                            <button onClick={() => git(`/dashboard/musteri/${musteri.id}`)}
                              className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
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
                          <button onClick={() => setDosyaSilOnay(dosya)} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer">
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
                    <p className="text-sm text-gray-400 dark:text-slate-500">Bu bayiye ait notlarınızı ekleyin</p>
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

      {/* ---- Dosya Sil Onay ---- */}
      {dosyaSilOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDosyaSilOnay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Dosyayı Sil</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                <span className="font-semibold text-gray-900 dark:text-white">{dosyaSilOnay.orijinal_ad}</span> dosyasını silmek istediğinize emin misiniz?
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setDosyaSilOnay(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
                <button onClick={dosyaSilOnayla} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer">Sil</button>
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
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            <label htmlFor="birincil" className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer">Birincil İletişim Kişisi</label>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
          <button onClick={onKapat} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
          <button onClick={() => onKaydet(form)} disabled={!form.ad_soyad.trim()}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
