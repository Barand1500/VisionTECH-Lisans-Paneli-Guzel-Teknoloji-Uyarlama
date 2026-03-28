/* ============================================= */
/*  Güzel Teknoloji - Müşteri Ekleme Sayfası     */
/*  Gerçek / Tüzel / Yabancı müşteri kayıt formu */
/*  Üst müşteri aramalı seçim en üstte,          */
/*  durum toggle (aktif/pasif), zorunlu alan      */
/*  doğrulaması, dinamik telefon/adres listeleri  */
/*  ve console çıktısı ile backend hazırlığı      */
/* ============================================= */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMusteriler } from "../context/MusteriContext";
import { useAktiviteLog } from "../context/AktiviteLogContext";

/* ============================================= */
/*  Sabit Tanımlamalar                            */
/* ============================================= */

const SEKMELER = [
  {
    id: "gercek",
    etiket: "Gerçek",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "tuzel",
    etiket: "Tüzel",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "yabanci",
    etiket: "Yabancı",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const SEKTORLER = [
  "Teknoloji", "Sağlık", "Eğitim", "Finans", "Üretim",
  "Perakende", "İnşaat", "Hukuk", "Gıda", "Lojistik", "Turizm", "Diğer",
];

/* ---- Boş Form Verisi Şablonu ---- */
const bosFormOlustur = () => ({
  sirketAdi: "",
  yetkiliKisi: "",
  adSoyad: "",
  eposta: "",
  sektor: "",
  sektorDiger: "",
  vergiDairesi: "",
  vergiNo: "",
  tcKimlikNo: "",
  pasaportNo: "",
  ustMusteri: "",
  ustMusteriArama: "",
  telefonlar: [""],
  adresler: [""],
  notlar: "",
  etiketler: [],
  yeniEtiket: "",
  durum: true,
});

/* ---- Mevcut Müşteri Listesi (Backend gelene kadar mock) ---- */
const MEVCUT_MUSTERILER = [
  { id: 1, ad: "Ercan Güzel" },
  { id: 2, ad: "Mehmet Yılmaz" },
  { id: 3, ad: "Ayşe Kara" },
  { id: 4, ad: "ABC Teknoloji A.Ş." },
  { id: 5, ad: "Veri Sistemleri Ltd." },
];

/* ============================================= */
/*  Yardımcı Fonksiyonlar                        */
/* ============================================= */

const telefonFormatla = (deger) => {
  const r = deger.replace(/\D/g, "").slice(0, 10);
  if (!r) return "";
  if (r.length <= 3) return `(${r}`;
  if (r.length <= 6) return `(${r.slice(0, 3)}) ${r.slice(3)}`;
  if (r.length <= 8) return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6)}`;
  return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6, 8)} ${r.slice(8)}`;
};

const sadeceSayi = (deger, maxUzunluk) =>
  deger.replace(/\D/g, "").slice(0, maxUzunluk);

const epostaGecerliMi = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* ============================================= */
/*  Ortak Stil Sabitleri                          */
/* ============================================= */

const INPUT_STIL =
  "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

const LABEL_STIL =
  "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5";

const HATA_INPUT_STIL =
  "w-full px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm";

/* ============================================= */
/*  Ana Bileşen: MusteriEklePage                  */
/* ============================================= */

export default function MusteriEklePage() {
  const git = useNavigate();
  const { musteriler, musteriEkle } = useMusteriler();
  const { logEkle } = useAktiviteLog();

  const [aktifSekme, setAktifSekme] = useState("gercek");
  const [form, setForm] = useState(bosFormOlustur());
  const [hatalar, setHatalar] = useState({});
  const [basarili, setBasarili] = useState(false);
  const [ustMusteriAcik, setUstMusteriAcik] = useState(false);
  const [kayitDisiOnay, setKayitDisiOnay] = useState(false);
  const ustMusteriRef = useRef(null);

  /* ---- Üst Müşteri dropdown dışına tıklanınca kapat ---- */
  useEffect(() => {
    const disariTikla = (e) => {
      if (ustMusteriRef.current && !ustMusteriRef.current.contains(e.target)) {
        setUstMusteriAcik(false);
        setKayitDisiOnay(false);
      }
    };
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, []);

  /* ---- Tüm müşteriler: mock + context ---- */
  const tumMusteriler = [
    ...MEVCUT_MUSTERILER,
    ...musteriler.map((m) => ({
      id: m.id,
      ad: m.adSoyad || m.sirketAdi || `Müşteri #${m.id}`,
    })),
  ];

  const filtrelenmislerMusteriler = tumMusteriler.filter((m) =>
    m.ad.toLowerCase().includes(form.ustMusteriArama.toLowerCase())
  );

  /* ---- Tekil Alan Güncelleme ---- */
  const alanGuncelle = (alan, deger) => {
    setForm((o) => ({ ...o, [alan]: deger }));
    if (hatalar[alan]) {
      setHatalar((o) => { const y = { ...o }; delete y[alan]; return y; });
    }
  };

  /* ---- Sekme Değiştirme ---- */
  const sekmeDegistir = (id) => {
    setAktifSekme(id);
    setHatalar({});
  };

  /* ---- Dinamik Liste İşlemleri ---- */
  const listeEkle = (alan) => setForm((o) => ({ ...o, [alan]: [...o[alan], ""] }));
  const listeGuncelle = (alan, idx, deger) => {
    setForm((o) => { const yeni = [...o[alan]]; yeni[idx] = deger; return { ...o, [alan]: yeni }; });
  };
  const listeSil = (alan, idx) => {
    setForm((o) => { const yeni = o[alan].filter((_, i) => i !== idx); return { ...o, [alan]: yeni.length === 0 ? [""] : yeni }; });
  };

  /* ---- Etiketler ---- */
  const etiketEkle = () => {
    const etiket = form.yeniEtiket.trim();
    if (etiket && !form.etiketler.includes(etiket)) {
      setForm((o) => ({ ...o, etiketler: [...o.etiketler, etiket], yeniEtiket: "" }));
    }
  };
  const etiketSil = (idx) => setForm((o) => ({ ...o, etiketler: o.etiketler.filter((_, i) => i !== idx) }));
  const etiketKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); etiketEkle(); } };

  /* ============================================= */
  /*  Form Doğrulama                               */
  /* ============================================= */

  const formuDogrula = () => {
    const h = {};

    /* Ortak zorunlu alanlar */
    if (!form.eposta.trim()) h.eposta = "E-posta zorunludur.";
    else if (!epostaGecerliMi(form.eposta)) h.eposta = "Geçerli bir e-posta adresi giriniz.";

    if (!form.adresler[0] || !form.adresler[0].trim()) h.adresler = "En az 1 adres girilmelidir.";
    if (!form.telefonlar[0] || !form.telefonlar[0].trim()) h.telefonlar = "En az 1 telefon girilmelidir.";

    /* Gerçek müşteri */
    if (aktifSekme === "gercek") {
      if (!form.tcKimlikNo.trim()) h.tcKimlikNo = "TC Kimlik No zorunludur.";
      else if (form.tcKimlikNo.length !== 11) h.tcKimlikNo = "TC Kimlik No 11 haneli olmalıdır.";
      if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
    }

    /* Tüzel müşteri */
    if (aktifSekme === "tuzel") {
      if (!form.vergiNo.trim()) h.vergiNo = "Vergi Numarası zorunludur.";
      else if (form.vergiNo.length !== 10) h.vergiNo = "Vergi Numarası 10 haneli olmalıdır.";
      if (!form.vergiDairesi.trim()) h.vergiDairesi = "Vergi Dairesi zorunludur.";
    }

    /* Yabancı müşteri */
    if (aktifSekme === "yabanci") {
      if (!form.pasaportNo.trim()) h.pasaportNo = "Pasaport No zorunludur.";
      if (!form.yetkiliKisi.trim()) h.yetkiliKisi = "Yetkili Kişi zorunludur.";
    }

    setHatalar(h);
    return Object.keys(h).length === 0;
  };

  /* ============================================= */
  /*  Form Gönderme                                */
  /* ============================================= */

  const formGonder = (e) => {
    e.preventDefault();
    if (!formuDogrula()) return;

    const veri = {
      tur: aktifSekme,
      eposta: form.eposta,
      sektor: form.sektor === "Diğer" ? form.sektorDiger : form.sektor,
      ustMusteri: form.ustMusteri,
      telefonlar: form.telefonlar.filter((t) => t.trim()),
      adresler: form.adresler.filter((a) => a.trim()),
      notlar: form.notlar,
      etiketler: form.etiketler,
      durum: form.durum ? "Aktif" : "Pasif",
      ...(aktifSekme === "gercek" && {
        adSoyad: form.adSoyad,
        tcKimlikNo: form.tcKimlikNo,
        yetkiliKisi: form.yetkiliKisi,
        sirketAdi: form.sirketAdi || undefined,
      }),
      ...(aktifSekme === "tuzel" && {
        sirketAdi: form.sirketAdi,
        yetkiliKisi: form.yetkiliKisi,
        vergiDairesi: form.vergiDairesi,
        vergiNo: form.vergiNo,
      }),
      ...(aktifSekme === "yabanci" && {
        adSoyad: form.adSoyad || undefined,
        sirketAdi: form.sirketAdi || undefined,
        pasaportNo: form.pasaportNo,
        yetkiliKisi: form.yetkiliKisi,
      }),
    };

    console.log("📦 Müşteri verisi (backend'e gönderilecek):", veri);
    musteriEkle(veri);
    logEkle("musteri_ekleme", `"${veri.adSoyad || veri.sirketAdi || veri.yetkiliKisi || 'Yeni Müşteri'}" adlı müşteri eklendi.`);

    setBasarili(true);
    setTimeout(() => git("/dashboard/musteriler"), 2000);
  };

  /* ============================================= */
  /*  Başarılı Kayıt Ekranı                        */
  /* ============================================= */

  if (basarili) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Müşteri Başarıyla Kaydedildi!</h2>
          <p className="text-gray-500 dark:text-slate-400">Müşteriler sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Sayfa Render                                 */
  /* ============================================= */

  return (
    <div className="max-w-4xl mx-auto">

      {/* ---- Sayfa Başlığı ve Geri Butonu ---- */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => git("/dashboard/musteriler")}
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Müşterilere Dön
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Müşteri Kaydı</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Müşteri bilgilerini doldurun ve kaydedin.</p>
        </div>
      </div>

      <form onSubmit={formGonder} className="space-y-8">

        {/* ============================================= */}
        {/*  Bölüm 0: Üst Müşteri (En Üstte)            */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Üst Müşteri
          </h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Bu müşteriyi bir üst müşteriye bağlamak istiyorsanız aşağıdan arayın.</p>

          <div className="relative" ref={ustMusteriRef}>
            {form.ustMusteri ? (
              <div className="flex items-center gap-2">
                <div className={INPUT_STIL + " flex items-center justify-between"}>
                  <span>{form.ustMusteri}</span>
                  <button
                    type="button"
                    onClick={() => { alanGuncelle("ustMusteri", ""); alanGuncelle("ustMusteriArama", ""); }}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Müşteri adı yazarak arayın..."
                  value={form.ustMusteriArama}
                  onChange={(e) => {
                    alanGuncelle("ustMusteriArama", e.target.value);
                    setUstMusteriAcik(true);
                    setKayitDisiOnay(false);
                  }}
                  onFocus={() => setUstMusteriAcik(true)}
                  className={INPUT_STIL}
                />
                {ustMusteriAcik && form.ustMusteriArama.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl max-h-56 overflow-y-auto">
                    {filtrelenmislerMusteriler.length > 0 ? (
                      filtrelenmislerMusteriler.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            alanGuncelle("ustMusteri", m.ad);
                            alanGuncelle("ustMusteriArama", "");
                            setUstMusteriAcik(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          {m.ad}
                        </button>
                      ))
                    ) : !kayitDisiOnay ? (
                      <div className="p-4">
                        <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                          Bu kullanıcı mevcut sistemde kayıtlı değil. Yine de eklemek ister misiniz?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              alanGuncelle("ustMusteri", form.ustMusteriArama);
                              alanGuncelle("ustMusteriArama", "");
                              setUstMusteriAcik(false);
                              setKayitDisiOnay(false);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            Evet, Ekle
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              alanGuncelle("ustMusteriArama", "");
                              setUstMusteriAcik(false);
                            }}
                            className="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            Hayır
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ---- Sekme (Tab) Çubuğu: Gerçek / Tüzel / Yabancı ---- */}
        <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-xl border border-gray-200 dark:border-white/10">
          {SEKMELER.map((sekme) => (
            <button
              key={sekme.id}
              type="button"
              onClick={() => sekmeDegistir(sekme.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                aktifSekme === sekme.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {sekme.ikon}
              {sekme.etiket}
            </button>
          ))}
        </div>

        {/* ============================================= */}
        {/*  Bölüm 1: Temel Bilgiler (Tipe Göre)         */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Temel Bilgiler
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ======== GERÇEK MÜŞTERİ ALANLARI ======== */}
            {aktifSekme === "gercek" && (
              <>
                <div>
                  <label className={LABEL_STIL}>TC Kimlik No <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="11 haneli TC kimlik numarası" value={form.tcKimlikNo}
                    onChange={(e) => alanGuncelle("tcKimlikNo", sadeceSayi(e.target.value, 11))}
                    className={hatalar.tcKimlikNo ? HATA_INPUT_STIL : INPUT_STIL} maxLength={11} />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.tcKimlikNo.length}/11 hane</p>
                  {hatalar.tcKimlikNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.tcKimlikNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Ad ve soyadını giriniz" value={form.adSoyad}
                    onChange={(e) => alanGuncelle("adSoyad", e.target.value)}
                    className={hatalar.adSoyad ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.adSoyad && <p className="text-red-500 text-xs mt-1">{hatalar.adSoyad}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Yetkili Kişi</label>
                  <input type="text" placeholder="Yetkili kişi adı" value={form.yetkiliKisi}
                    onChange={(e) => alanGuncelle("yetkiliKisi", e.target.value)} className={INPUT_STIL} />
                </div>
                <div>
                  <label className={LABEL_STIL}>
                    Şirket Adı <span className="text-gray-400 dark:text-slate-500 text-xs ml-1">(Opsiyonel)</span>
                  </label>
                  <input type="text" placeholder="Şirket adını giriniz" value={form.sirketAdi}
                    onChange={(e) => alanGuncelle("sirketAdi", e.target.value)} className={INPUT_STIL} />
                </div>
              </>
            )}

            {/* ======== TÜZEL MÜŞTERİ ALANLARI ======== */}
            {aktifSekme === "tuzel" && (
              <>
                <div>
                  <label className={LABEL_STIL}>Vergi Numarası <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="10 haneli vergi numarası" value={form.vergiNo}
                    onChange={(e) => alanGuncelle("vergiNo", sadeceSayi(e.target.value, 10))}
                    className={hatalar.vergiNo ? HATA_INPUT_STIL : INPUT_STIL} maxLength={10} />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.vergiNo.length}/10 hane</p>
                  {hatalar.vergiNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Vergi Dairesi <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Vergi dairesi adı" value={form.vergiDairesi}
                    onChange={(e) => alanGuncelle("vergiDairesi", e.target.value)}
                    className={hatalar.vergiDairesi ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.vergiDairesi && <p className="text-red-500 text-xs mt-1">{hatalar.vergiDairesi}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Şirket Adı</label>
                  <input type="text" placeholder="Şirket adını giriniz" value={form.sirketAdi}
                    onChange={(e) => alanGuncelle("sirketAdi", e.target.value)} className={INPUT_STIL} />
                </div>
                <div>
                  <label className={LABEL_STIL}>Yetkili Kişi</label>
                  <input type="text" placeholder="Yetkili kişi adı" value={form.yetkiliKisi}
                    onChange={(e) => alanGuncelle("yetkiliKisi", e.target.value)} className={INPUT_STIL} />
                </div>
              </>
            )}

            {/* ======== YABANCI MÜŞTERİ ALANLARI ======== */}
            {aktifSekme === "yabanci" && (
              <>
                <div>
                  <label className={LABEL_STIL}>Pasaport No <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Pasaport numarası" value={form.pasaportNo}
                    onChange={(e) => alanGuncelle("pasaportNo", e.target.value)}
                    className={hatalar.pasaportNo ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.pasaportNo && <p className="text-red-500 text-xs mt-1">{hatalar.pasaportNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Yetkili Kişi <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Yetkili kişi adı" value={form.yetkiliKisi}
                    onChange={(e) => alanGuncelle("yetkiliKisi", e.target.value)}
                    className={hatalar.yetkiliKisi ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.yetkiliKisi && <p className="text-red-500 text-xs mt-1">{hatalar.yetkiliKisi}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>
                    Ad Soyad <span className="text-gray-400 dark:text-slate-500 text-xs ml-1">(Opsiyonel)</span>
                  </label>
                  <input type="text" placeholder="Ad ve soyadını giriniz" value={form.adSoyad}
                    onChange={(e) => alanGuncelle("adSoyad", e.target.value)} className={INPUT_STIL} />
                </div>
                <div>
                  <label className={LABEL_STIL}>
                    Şirket Adı <span className="text-gray-400 dark:text-slate-500 text-xs ml-1">(Opsiyonel)</span>
                  </label>
                  <input type="text" placeholder="Şirket adını giriniz" value={form.sirketAdi}
                    onChange={(e) => alanGuncelle("sirketAdi", e.target.value)} className={INPUT_STIL} />
                </div>
              </>
            )}

            {/* ---- E-posta (Tüm Tipler: Zorunlu) ---- */}
            <div>
              <label className={LABEL_STIL}>E-posta <span className="text-red-500">*</span></label>
              <input type="email" placeholder="ornek@sirket.com" value={form.eposta}
                onChange={(e) => alanGuncelle("eposta", e.target.value)}
                className={hatalar.eposta ? HATA_INPUT_STIL : INPUT_STIL} />
              {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
            </div>

            {/* ---- Sektör ---- */}
            <div>
              <label className={LABEL_STIL}>Sektör</label>
              <select value={form.sektor} onChange={(e) => alanGuncelle("sektor", e.target.value)}
                className={INPUT_STIL + " [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-gray-900 [&>option]:dark:text-white"}>
                <option value="">Sektör seçiniz</option>
                {SEKTORLER.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              {form.sektor === "Diğer" && (
                <input type="text" placeholder="Sektör adını yazınız..." value={form.sektorDiger}
                  onChange={(e) => alanGuncelle("sektorDiger", e.target.value)} className={INPUT_STIL + " mt-2"} />
              )}
            </div>
          </div>
        </div>

        {/* ============================================= */}
        {/*  Bölüm 2: İletişim Bilgileri                  */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            İletişim Bilgileri
          </h3>

          {/* ---- Telefonlar ---- */}
          <div className="mb-6">
            <label className={LABEL_STIL}>Telefonlar <span className="text-red-500">*</span></label>
            {hatalar.telefonlar && <p className="text-red-500 text-xs mb-2">{hatalar.telefonlar}</p>}
            <div className="space-y-3">
              {form.telefonlar.map((tel, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" placeholder="(5XX) XXX XX XX" value={tel}
                    onChange={(e) => listeGuncelle("telefonlar", idx, telefonFormatla(e.target.value))} className={INPUT_STIL} />
                  {form.telefonlar.length > 1 && (
                    <button type="button" onClick={() => listeSil("telefonlar", idx)}
                      className="p-2.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => listeEkle("telefonlar")}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Telefon Ekle
            </button>
          </div>

          {/* ---- Adresler ---- */}
          <div>
            <label className={LABEL_STIL}>Adresler <span className="text-red-500">*</span></label>
            {hatalar.adresler && <p className="text-red-500 text-xs mb-2">{hatalar.adresler}</p>}
            <div className="space-y-3">
              {form.adresler.map((adres, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <textarea placeholder="Adres bilgisini giriniz" value={adres}
                    onChange={(e) => listeGuncelle("adresler", idx, e.target.value)}
                    rows={2} className={INPUT_STIL + " resize-none"} />
                  {form.adresler.length > 1 && (
                    <button type="button" onClick={() => listeSil("adresler", idx)}
                      className="p-2.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => listeEkle("adresler")}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Adres Ekle
            </button>
          </div>
        </div>

        {/* ============================================= */}
        {/*  Bölüm 3: Durum (Aktif/Pasif Toggle)         */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Müşteri Durumu <span className="text-red-500">*</span>
          </h3>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => alanGuncelle("durum", !form.durum)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                form.durum ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/20"
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                form.durum ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
            <span className={`text-sm font-medium ${form.durum ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
              {form.durum ? "Aktif" : "Pasif"}
            </span>
          </div>
        </div>

        {/* ============================================= */}
        {/*  Bölüm 4: Ek Bilgiler                        */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Ek Bilgiler
          </h3>

          <div className="mb-6">
            <label className={LABEL_STIL}>Notlar</label>
            <textarea placeholder="Müşteriyle ilgili notlarınızı yazınız..." value={form.notlar}
              onChange={(e) => alanGuncelle("notlar", e.target.value)} rows={4} className={INPUT_STIL + " resize-none"} />
          </div>

          {/* ---- Etiketler ---- */}
          <div>
            <label className={LABEL_STIL}>Etiketler</label>
            {form.etiketler.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.etiketler.map((etiket, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                    {etiket}
                    <button type="button" onClick={() => etiketSil(idx)} className="hover:text-red-500 transition-colors cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Etiket yazın ve ekleyin" value={form.yeniEtiket}
                onChange={(e) => alanGuncelle("yeniEtiket", e.target.value)} onKeyDown={etiketKeyDown} className={INPUT_STIL} />
              <button type="button" onClick={etiketEkle} disabled={!form.yeniEtiket.trim()}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ---- Hata Özeti ---- */}
        {Object.keys(hatalar).length > 0 && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Lütfen aşağıdaki hataları düzeltin:
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 space-y-1">
              {Object.values(hatalar).map((hata, idx) => (<li key={idx}>{hata}</li>))}
            </ul>
          </div>
        )}

        {/* ---- Form Aksiyon Butonları ---- */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button type="button" onClick={() => git("/dashboard/musteriler")}
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium cursor-pointer">
            İptal
          </button>
          <button type="submit"
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-600/25 cursor-pointer inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Müşteriyi Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
