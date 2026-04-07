/* ============================================= */
/*  Güzel Teknoloji - Bayi Ekleme Sayfası        */
/*  Gerçek / Tüzel / Yabancı bayi kayıt formu    */
/*  Üst bayi aramalı seçim, durum toggle,         */
/*  zorunlu alan doğrulaması, dinamik telefon/    */
/*  adres listeleri — MusteriEklePage tarzında    */
/* ============================================= */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../yardimcilar/api";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";

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

/* ---- Boş Form Verisi Şablonu ---- */
const bosFormOlustur = () => ({
  sirketAdi: "",
  yetkili: "",
  adSoyad: "",
  eposta: "",
  telefon: "",
  vergiDairesi: "",
  vergiNo: "",
  tcKimlikNo: "",
  pasaportNo: "",
  sektor: "",
  sektorDiger: "",
  ustBayiId: "",
  ustBayiArama: "",
  ustBayi: "",
  adres: "",
  kisiler: [],
  notlar: "",
  etiketler: [],
  yeniEtiket: "",
  durum: true,
});

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
  "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm";

const LABEL_STIL =
  "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5";

const HATA_INPUT_STIL =
  "w-full px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm";

/* ============================================= */
/*  Ana Bileşen: BayiEklePage                     */
/* ============================================= */

export default function BayiEklePage() {
  const git = useNavigate();
  const { id } = useParams();
  const duzenleModu = !!id;
  const { logEkle } = useAktiviteLog();

  const [aktifSekme, setAktifSekme] = useState("tuzel");
  const [form, setForm] = useState(bosFormOlustur());
  const [hatalar, setHatalar] = useState({});
  const [basarili, setBasarili] = useState(false);
  const [kayitYapiliyor, setKayitYapiliyor] = useState(false);
  const [ustBayiAcik, setUstBayiAcik] = useState(false);
  const [bayiler, setBayiler] = useState([]);
  const [sektorler, setSektorler] = useState([]);
  const ustBayiRef = useRef(null);
  const dosyaInputRef = useRef(null);
  const [dosyalar, setDosyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  /* ---- Bayileri ve Sektörleri API'den Çek ---- */
  useEffect(() => {
    apiGet("/bayiler").then((yanit) => {
      if (yanit?.veri) setBayiler(yanit.veri);
    }).catch(() => {});
    apiGet("/sektorler").then((yanit) => {
      if (yanit?.veri) setSektorler(yanit.veri);
    }).catch(() => {});
  }, []);

  /* ---- Düzenleme modunda mevcut bayi verisini yükle ---- */
  useEffect(() => {
    if (!duzenleModu) return;
    setYukleniyor(true);
    apiGet(`/bayiler/${id}`).then((yanit) => {
      if (yanit?.veri) {
        const b = yanit.veri;
        setAktifSekme(b.tur || "tuzel");
        const ustBayiObj = bayiler.find((x) => x.id === b.ust_bayi_id);
        setForm({
          sirketAdi: b.sirket_adi || "",
          adSoyad: b.ad_soyad || "",
          yetkili: b.yetkili || "",
          eposta: b.eposta || "",
          vergiDairesi: b.vergi_dairesi || "",
          vergiNo: b.vergi_no || "",
          tcKimlikNo: b.tc_kimlik_no || "",
          pasaportNo: b.pasaport_no || "",
          sektor: b.sektor_id ? String(b.sektor_id) : "",
          sektorDiger: "",
          ustBayiId: b.ust_bayi_id ? String(b.ust_bayi_id) : "",
          ustBayiArama: "",
          ustBayi: ustBayiObj ? ustBayiObj.ad : "",
          adres: b.adres || "",
          kisiler: [],
          notlar: b.notlar || "",
          etiketler: b.etiketler ? (typeof b.etiketler === "string" ? JSON.parse(b.etiketler) : b.etiketler) : [],
          yeniEtiket: "",
          durum: b.durum === "aktif",
        });
      }
    }).catch(() => {}).finally(() => setYukleniyor(false));
  }, [duzenleModu, id, bayiler.length]);

  /* ---- Üst Bayi dropdown dışına tıklanınca kapat ---- */
  useEffect(() => {
    const disariTikla = (e) => {
      if (ustBayiRef.current && !ustBayiRef.current.contains(e.target)) {
        setUstBayiAcik(false);
      }
    };
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, []);

  /* ---- Ana Bayiler (üst bayi olabilecekler) ---- */
  const anaBayiler = bayiler.filter((b) => !b.ust_bayi_id);
  const filtreliUstler = anaBayiler.filter((b) =>
    b.ad.toLowerCase().includes(form.ustBayiArama.toLowerCase())
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

  /* ---- Kişi İşlemleri ---- */
  const bosKisi = () => ({ adSoyad: "", telefon: "", eposta: "", gorev: "", adres: "" });
  const kisiEkle = () => setForm((o) => ({ ...o, kisiler: [...o.kisiler, bosKisi()] }));
  const kisiGuncelle = (idx, alan, deger) => {
    setForm((o) => {
      const yeni = [...o.kisiler];
      yeni[idx] = { ...yeni[idx], [alan]: alan === "telefon" ? telefonFormatla(deger) : deger };
      return { ...o, kisiler: yeni };
    });
  };
  const kisiSil = (idx) => setForm((o) => ({ ...o, kisiler: o.kisiler.filter((_, i) => i !== idx) }));

  /* ---- Etiket Yardımcıları ---- */
  const etiketEkle = () => {
    const yeni = form.yeniEtiket.trim();
    if (!yeni) return;
    if (form.etiketler.includes(yeni)) { alanGuncelle("yeniEtiket", ""); return; }
    setForm((o) => ({ ...o, etiketler: [...o.etiketler, yeni], yeniEtiket: "" }));
  };
  const etiketSil = (idx) => setForm((o) => ({ ...o, etiketler: o.etiketler.filter((_, i) => i !== idx) }));
  const etiketKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); etiketEkle(); } };

  /* ============================================= */
  /*  Form Doğrulama                               */
  /* ============================================= */

  const formuDogrula = () => {
    const h = {};

    /* Adres zorunlu (Fatura Bilgileri) */
    if (!form.adres.trim()) h.adres = "Adres zorunludur.";

    /* E-Posta zorunlu (Fatura Bilgileri) */
    if (!form.eposta.trim()) h.eposta = "E-Posta zorunludur.";
    else if (!epostaGecerliMi(form.eposta)) h.eposta = "Geçerli bir e-posta adresi giriniz.";

    /* Gerçek bayi */
    if (aktifSekme === "gercek") {
      if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      if (!form.tcKimlikNo.trim()) h.tcKimlikNo = "TC Kimlik No zorunludur.";
      else if (form.tcKimlikNo.length !== 11) h.tcKimlikNo = "TC Kimlik No 11 haneli olmalıdır.";
    }

    /* Tüzel bayi */
    if (aktifSekme === "tuzel") {
      if (!form.sirketAdi.trim()) h.sirketAdi = "Şirket Ünvanı zorunludur.";
      if (!form.vergiNo.trim()) h.vergiNo = "Vergi Numarası zorunludur.";
      else if (form.vergiNo.length !== 10) h.vergiNo = "Vergi Numarası 10 haneli olmalıdır.";
      if (!form.vergiDairesi.trim()) h.vergiDairesi = "Vergi Dairesi zorunludur.";
    }

    /* Yabancı bayi */
    if (aktifSekme === "yabanci") {
      if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      if (!form.pasaportNo.trim()) h.pasaportNo = "Pasaport No zorunludur.";
    }

    setHatalar(h);
    return Object.keys(h).length === 0;
  };

  /* ============================================= */
  /*  Form Gönderme                                */
  /* ============================================= */

  const formGonder = async (e) => {
    e.preventDefault();
    if (!formuDogrula()) return;

    setKayitYapiliyor(true);

    const bayiAdi = aktifSekme === "gercek" ? form.adSoyad : (form.sirketAdi || form.adSoyad || form.yetkili);

    try {
      const govde = {
        ad: bayiAdi,
        yetkili: form.yetkili || form.adSoyad,
        eposta: form.eposta,
        telefon: form.kisiler[0]?.telefon || "",
        vergi_no: form.vergiNo,
        vergi_dairesi: form.vergiDairesi,
        sektor_id: form.sektor ? Number(form.sektor) : null,
        durum: form.durum ? "aktif" : "pasif",
        tur: aktifSekme,
        ust_bayi_id: form.ustBayiId ? Number(form.ustBayiId) : null,
        tc_kimlik_no: form.tcKimlikNo,
        pasaport_no: form.pasaportNo,
        ad_soyad: form.adSoyad,
        sirket_adi: form.sirketAdi,
        adres: form.adres || null,
        notlar: form.notlar || null,
        etiketler: form.etiketler.length > 0 ? form.etiketler : null,
      };

      let yanit;
      if (duzenleModu) {
        yanit = await apiPut(`/bayiler/${id}`, govde);
      } else {
        yanit = await apiPost("/bayiler", govde);
      }

      /* Dosya varsa yükle */
      const bayiId = duzenleModu ? id : yanit?.id;
      if (dosyalar.length > 0 && bayiId) {
        for (const dosya of dosyalar) {
          const fd = new FormData();
          fd.append("dosyalar", dosya);
          try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:5000/api/bayiler/${bayiId}/dosyalar`, {
              method: "POST",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: fd,
            });
          } catch (err) {
            console.error("Dosya yükleme hatası:", err);
          }
        }
      }

      setBasarili(true);
      if (duzenleModu) {
        await logEkle("bayi_guncelleme", `"${bayiAdi}" bayisi güncellendi`);
      } else {
        await logEkle("bayi_ekleme", `"${bayiAdi}" bayisi eklendi`);
      }
      setTimeout(() => git("/dashboard/bayiler"), 2000);
    } catch (err) {
      console.error("Bayi eklenemedi:", err);
      setKayitYapiliyor(false);
    }
  };

  /* ============================================= */
  /*  Başarılı Kayıt Ekranı                        */
  /* ============================================= */

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400">Bayi bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (basarili) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{duzenleModu ? "Bayi Başarıyla Güncellendi!" : "Bayi Başarıyla Kaydedildi!"}</h2>
          <p className="text-gray-500 dark:text-slate-400">Bayiler sayfasına yönlendiriliyorsunuz...</p>
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
            onClick={() => git("/dashboard/bayiler")}
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Bayilere Dön
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{duzenleModu ? "Bayi Düzenle" : "Yeni Bayi Kaydı"}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{duzenleModu ? "Bayi bilgilerini güncelleyin." : "Bayi bilgilerini doldurun ve kaydedin."}</p>
        </div>
      </div>

      <form onSubmit={formGonder} className="space-y-8">

        {/* ============================================= */}
        {/*  Bölüm 0: Üst Bayi (En Üstte)                */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Üst Bayi
          </h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Bu bayiyi bir üst bayiye bağlamak istiyorsanız aşağıdan arayın. Boş bırakırsanız "Ana Bayi" olarak kaydedilir.</p>

          <div className="relative" ref={ustBayiRef}>
            {form.ustBayi ? (
              <div className="flex items-center gap-2">
                <div className={INPUT_STIL + " flex items-center justify-between"}>
                  <span>{form.ustBayi}</span>
                  <button
                    type="button"
                    onClick={() => { alanGuncelle("ustBayi", ""); alanGuncelle("ustBayiId", ""); alanGuncelle("ustBayiArama", ""); }}
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
                  placeholder="Üst bayi adı yazarak arayın..."
                  value={form.ustBayiArama}
                  onChange={(e) => {
                    alanGuncelle("ustBayiArama", e.target.value);
                    setUstBayiAcik(true);
                  }}
                  onFocus={() => setUstBayiAcik(true)}
                  className={INPUT_STIL}
                />
                {ustBayiAcik && form.ustBayiArama.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl max-h-56 overflow-y-auto">
                    {filtreliUstler.length > 0 ? (
                      filtreliUstler.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            alanGuncelle("ustBayi", b.ad);
                            alanGuncelle("ustBayiId", String(b.id));
                            alanGuncelle("ustBayiArama", "");
                            setUstBayiAcik(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          {b.ad}
                        </button>
                      ))
                    ) : (
                      <div className="p-4">
                        <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">Üst bayi bulunamadı.</p>
                        <button type="button" onClick={() => { alanGuncelle("ustBayiArama", ""); setUstBayiAcik(false); }}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400 text-xs cursor-pointer">
                          Kapat
                        </button>
                      </div>
                    )}
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
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                  : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {sekme.ikon}
              {sekme.etiket}
            </button>
          ))}
        </div>

        {/* ============================================= */}
        {/*  Bölüm 1: Fatura Bilgileri (Tipe Göre)       */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Fatura Bilgileri
            </h3>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${form.durum ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                {form.durum ? "Aktif" : "Pasif"}
              </span>
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ======== GERÇEK BAYİ ALANLARI ======== */}
            {aktifSekme === "gercek" && (
              <>
                <div>
                  <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Ad ve soyadını giriniz" value={form.adSoyad}
                    onChange={(e) => alanGuncelle("adSoyad", e.target.value)}
                    className={hatalar.adSoyad ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.adSoyad && <p className="text-red-500 text-xs mt-1">{hatalar.adSoyad}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>TC Kimlik No <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="11 haneli TC kimlik numarası" value={form.tcKimlikNo}
                    onChange={(e) => alanGuncelle("tcKimlikNo", sadeceSayi(e.target.value, 11))}
                    className={hatalar.tcKimlikNo ? HATA_INPUT_STIL : INPUT_STIL} maxLength={11} />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.tcKimlikNo.length}/11 hane</p>
                  {hatalar.tcKimlikNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.tcKimlikNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>E-Posta <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="ornek@bayi.com" value={form.eposta}
                    onChange={(e) => alanGuncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Telefon</label>
                  <input type="text" placeholder="(XXX) XXX XX XX" value={form.telefon}
                    onChange={(e) => alanGuncelle("telefon", telefonFormatla(e.target.value))}
                    className={INPUT_STIL} maxLength={15} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Adres <span className="text-red-500">*</span></label>
                  <textarea placeholder="Adres bilgisi" value={form.adres}
                    onChange={(e) => alanGuncelle("adres", e.target.value)}
                    rows={2} className={(hatalar.adres ? HATA_INPUT_STIL : INPUT_STIL) + " resize-none"} />
                  {hatalar.adres && <p className="text-red-500 text-xs mt-1">{hatalar.adres}</p>}
                </div>
              </>
            )}

            {/* ======== TÜZEL BAYİ ALANLARI ======== */}
            {aktifSekme === "tuzel" && (
              <>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Şirket Ünvanı <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Şirket ünvanını giriniz" value={form.sirketAdi}
                    onChange={(e) => alanGuncelle("sirketAdi", e.target.value)}
                    className={hatalar.sirketAdi ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.sirketAdi && <p className="text-red-500 text-xs mt-1">{hatalar.sirketAdi}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Vergi Dairesi <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Vergi dairesi adı" value={form.vergiDairesi}
                    onChange={(e) => alanGuncelle("vergiDairesi", e.target.value)}
                    className={hatalar.vergiDairesi ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.vergiDairesi && <p className="text-red-500 text-xs mt-1">{hatalar.vergiDairesi}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Vergi Numarası <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="10 haneli vergi numarası" value={form.vergiNo}
                    onChange={(e) => alanGuncelle("vergiNo", sadeceSayi(e.target.value, 10))}
                    className={hatalar.vergiNo ? HATA_INPUT_STIL : INPUT_STIL} maxLength={10} />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.vergiNo.length}/10 hane</p>
                  {hatalar.vergiNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>E-Posta <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="ornek@bayi.com" value={form.eposta}
                    onChange={(e) => alanGuncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Telefon</label>
                  <input type="text" placeholder="(XXX) XXX XX XX" value={form.telefon}
                    onChange={(e) => alanGuncelle("telefon", telefonFormatla(e.target.value))}
                    className={INPUT_STIL} maxLength={15} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Adres <span className="text-red-500">*</span></label>
                  <textarea placeholder="Adres bilgisi" value={form.adres}
                    onChange={(e) => alanGuncelle("adres", e.target.value)}
                    rows={2} className={(hatalar.adres ? HATA_INPUT_STIL : INPUT_STIL) + " resize-none"} />
                  {hatalar.adres && <p className="text-red-500 text-xs mt-1">{hatalar.adres}</p>}
                </div>
              </>
            )}

            {/* ======== YABANCI BAYİ ALANLARI ======== */}
            {aktifSekme === "yabanci" && (
              <>
                <div>
                  <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Ad ve soyadını giriniz" value={form.adSoyad}
                    onChange={(e) => alanGuncelle("adSoyad", e.target.value)}
                    className={hatalar.adSoyad ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.adSoyad && <p className="text-red-500 text-xs mt-1">{hatalar.adSoyad}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Pasaport No <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Pasaport numarası" value={form.pasaportNo}
                    onChange={(e) => alanGuncelle("pasaportNo", e.target.value)}
                    className={hatalar.pasaportNo ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.pasaportNo && <p className="text-red-500 text-xs mt-1">{hatalar.pasaportNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>E-Posta <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="ornek@bayi.com" value={form.eposta}
                    onChange={(e) => alanGuncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Telefon</label>
                  <input type="text" placeholder="(XXX) XXX XX XX" value={form.telefon}
                    onChange={(e) => alanGuncelle("telefon", telefonFormatla(e.target.value))}
                    className={INPUT_STIL} maxLength={15} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Adres <span className="text-red-500">*</span></label>
                  <textarea placeholder="Adres bilgisi" value={form.adres}
                    onChange={(e) => alanGuncelle("adres", e.target.value)}
                    rows={2} className={(hatalar.adres ? HATA_INPUT_STIL : INPUT_STIL) + " resize-none"} />
                  {hatalar.adres && <p className="text-red-500 text-xs mt-1">{hatalar.adres}</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ============================================= */}
        {/*  Bölüm 2: Kişi Ekleme                        */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Kişi Ekleme
            </h3>
            <button type="button" onClick={kisiEkle}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Kişi Ekle
            </button>
          </div>

          {form.kisiler.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
              Henüz kişi eklenmedi. Kişi eklemek için yukarıdaki butona tıklayın.
            </p>
          ) : (
            <div className="space-y-4">
              {form.kisiler.map((kisi, idx) => (
                <div key={idx} className="relative rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-4">
                  <button type="button" onClick={() => kisiSil(idx)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad</label>
                      <input type="text" placeholder="Ad ve soyad" value={kisi.adSoyad}
                        onChange={(e) => kisiGuncelle(idx, "adSoyad", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Görevi</label>
                      <input type="text" placeholder="Görevi" value={kisi.gorev}
                        onChange={(e) => kisiGuncelle(idx, "gorev", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>E-Posta</label>
                      <input type="email" placeholder="ornek@bayi.com" value={kisi.eposta}
                        onChange={(e) => kisiGuncelle(idx, "eposta", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Telefon</label>
                      <input type="text" placeholder="(XXX) XXX XX XX" value={kisi.telefon}
                        onChange={(e) => kisiGuncelle(idx, "telefon", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={LABEL_STIL}>Adres</label>
                      <textarea placeholder="Adres bilgisi" value={kisi.adres}
                        onChange={(e) => kisiGuncelle(idx, "adres", e.target.value)}
                        rows={2} className={INPUT_STIL + " resize-none"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================= */}
        {/*  Bölüm 3: Ek Bilgiler                        */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Ek Bilgiler
          </h3>

          {/* ---- Sektör ---- */}
          <div className="mb-6">
            <label className={LABEL_STIL}>Sektör</label>
            <select value={form.sektor} onChange={(e) => alanGuncelle("sektor", e.target.value)}
              className={INPUT_STIL + " [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-gray-900 [&>option]:dark:text-white"}>
              <option value="">Sektör seçiniz</option>
              {sektorler.filter((s) => s.aktif).map((s) => (<option key={s.id} value={s.id}>{s.ad}</option>))}
            </select>
          </div>

          {/* ---- Notlar ---- */}
          <div className="mb-6">
            <label className={LABEL_STIL}>Notlar</label>
            <textarea placeholder="Bayiyle ilgili notlarınızı yazınız..." value={form.notlar}
              onChange={(e) => alanGuncelle("notlar", e.target.value)} rows={4} className={INPUT_STIL + " resize-none"} />
          </div>

          {/* ---- Dosya Yükleme ---- */}
          <div className="mb-6">
            <label className={LABEL_STIL}>Dosya Ekle (PDF, Resim)</label>
            <input type="file" ref={dosyaInputRef} multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(e) => {
                const yeniDosyalar = Array.from(e.target.files);
                setDosyalar((o) => [...o, ...yeniDosyalar]);
                e.target.value = "";
              }}
              className="hidden" />
            <div
              onClick={() => dosyaInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-emerald-500", "bg-emerald-50", "dark:bg-emerald-500/10"); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-emerald-500", "bg-emerald-50", "dark:bg-emerald-500/10"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-emerald-500", "bg-emerald-50", "dark:bg-emerald-500/10");
                const birakilan = Array.from(e.dataTransfer.files).filter((f) =>
                  /\.(pdf|png|jpe?g|gif|webp)$/i.test(f.name)
                );
                setDosyalar((o) => [...o, ...birakilan]);
              }}
              className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-auto mb-1 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Dosya sürükleyip bırakın veya <span className="text-emerald-600 dark:text-emerald-400 font-medium">tıklayarak seçin</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PDF, PNG, JPG, GIF, WEBP — maks. 10MB</p>
            </div>
            {dosyalar.length > 0 && (
              <div className="mt-3 space-y-2">
                {dosyalar.map((dosya, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      {dosya.type?.startsWith("image/") ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{dosya.name}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">({(dosya.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button type="button" onClick={() => setDosyalar((o) => o.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- Etiketler ---- */}
          <div>
            <label className={LABEL_STIL}>Etiketler</label>
            {form.etiketler.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.etiketler.map((etiket, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
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
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
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
          <button type="button" onClick={() => git("/dashboard/bayiler")}
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium cursor-pointer">
            İptal
          </button>
          <button type="submit" disabled={kayitYapiliyor}
            className="px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-600/25 cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {kayitYapiliyor ? (duzenleModu ? "Güncelleniyor..." : "Kaydediliyor...") : (duzenleModu ? "Bayiyi Güncelle" : "Bayiyi Kaydet")}
          </button>
        </div>
      </form>
    </div>
  );
}
