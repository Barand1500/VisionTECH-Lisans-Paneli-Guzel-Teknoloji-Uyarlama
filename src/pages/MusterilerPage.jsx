/* ============================================= */
/*  Güzel Teknoloji - Müşteriler Sayfası         */
/*  Müşteri listesi tablo görünümü, arama,       */
/*  düzenleme modalı (MusteriEklePage formlu),    */
/*  müşteri paket yönetimi (tablo + aksiyonlar)   */
/*  ve lisans belgesi önizleme/indirme            */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMusteriler } from "../context/MusteriContext";

/* ---- Sekme Tanımları ---- */
const SEKMELER = [
  {
    id: "gercek",
    etiket: "Gerçek",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "tuzel",
    etiket: "Tüzel",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "yabanci",
    etiket: "Yabancı",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

/* ---- Stil Sabitleri ---- */
const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

const LABEL_STIL = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

const HATA_INPUT =
  "w-full px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm";

/* ---- Sallanma Animasyonu Stili ---- */
const sallanmaStili = document.getElementById("sallanma-stili") || (() => {
  const s = document.createElement("style");
  s.id = "sallanma-stili";
  s.textContent = `@keyframes sallanma { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(5px)} 45%{transform:translateX(-4px)} 60%{transform:translateX(3px)} 75%{transform:translateX(-2px)} } .sallan { animation: sallanma 0.5s ease-in-out; }`;
  document.head.appendChild(s);
  return s;
})();

/* ---- Mock Üst Müşteri Listesi ---- */
const MEVCUT_MUSTERILER = [
  { id: 1, ad: "Ercan Güzel" },
  { id: 2, ad: "Mehmet Yılmaz" },
  { id: 3, ad: "Ayşe Kara" },
  { id: 4, ad: "ABC Teknoloji A.Ş." },
  { id: 5, ad: "Veri Sistemleri Ltd." },
];

/* ---- Mock Paket Verileri (Her Müşteri için Şablon) ---- */
const URUN_LISTESI = [
  "Yazılım - VEMobil Ana Modül",
  "Yazılım - VEMobil Yıllık Yenileme",
  "Yazılım - Vega E-Dönüşüm",
  "Yazılım - Vega Muhasebe Pro",
  "Yazılım - Vega CRM Enterprise",
];

const PAKET_TIPLERI = ["Aktivasyon", "Yenileme", "Yükseltme"];

const rastgeleTarih = (yilOnce = 0) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yilOnce);
  d.setMonth(Math.floor(Math.random() * 12));
  d.setDate(Math.floor(Math.random() * 28) + 1);
  return d.toISOString().slice(0, 10);
};

const tarihEkle = (tarih, gun) => {
  const d = new Date(tarih);
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
};

const rastgeleLisansAnahtari = () => {
  const h = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const blok = () => Array.from({ length: 4 }, () => h[Math.floor(Math.random() * h.length)]).join("");
  return `${blok()}-${blok()}-${blok()}-${blok()}`;
};

const mockPaketlerOlustur = () =>
  Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, i) => {
    const bas = rastgeleTarih(Math.floor(Math.random() * 3));
    return {
      id: Date.now() + i + Math.random(),
      urun: URUN_LISTESI[Math.floor(Math.random() * URUN_LISTESI.length)],
      paket: PAKET_TIPLERI[Math.floor(Math.random() * PAKET_TIPLERI.length)],
      domain: `http://ornek${i + 1}.vemobil.com:9090/`,
      faturaNo: Math.random() > 0.5 ? `VEF${Date.now().toString().slice(-10)}` : "",
      kullanimGunu: 365,
      baslangicTarihi: bas,
      bitisTarihi: tarihEkle(bas, 365),
      kullanici: Math.random() > 0.5 ? "1 + 1" : "1",
      fiyat: Math.random() > 0.6 ? (Math.random() * 5000).toFixed(2) : "0.00",
      faturaGeldi: Math.random() > 0.7,
      lisansAnahtari: rastgeleLisansAnahtari(),
    };
  });

/* ---- Yardımcı Fonksiyonlar ---- */
const telefonFormatla = (deger) => {
  const r = deger.replace(/\D/g, "").slice(0, 10);
  if (!r) return "";
  if (r.length <= 3) return `(${r}`;
  if (r.length <= 6) return `(${r.slice(0, 3)}) ${r.slice(3)}`;
  if (r.length <= 8) return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6)}`;
  return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6, 8)} ${r.slice(8)}`;
};

const tarihGosterTR = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

const suAnGecmisMi = (tarih) => {
  if (!tarih) return false;
  return new Date(tarih) < new Date();
};

/* ============================================= */
/*  Ana Bileşen                                   */
/* ============================================= */

export default function MusterilerPage() {
  const git = useNavigate();
  const { musteriler, musteriGuncelle } = useMusteriler();

  const [arama, setArama] = useState("");
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);
  const [aktifSayfa, setAktifSayfa] = useState(1);

  /* Modal states */
  const [duzenleModal, setDuzenleModal] = useState(null);
  const [paketModal, setPaketModal] = useState(null);
  const [lisansModal, setLisansModal] = useState(null);

  useEffect(() => {
    const escKapat = (e) => {
      if (e.key === "Escape") {
        setDuzenleModal(null);
        setPaketModal(null);
        setLisansModal(null);
      }
    };
    window.addEventListener("keydown", escKapat);
    return () => window.removeEventListener("keydown", escKapat);
  }, []);

  /* ---- Arama filtresi ---- */
  const filtrelenenler = musteriler.filter((m) => {
    const q = arama.toLowerCase();
    return (
      (m.adSoyad || "").toLowerCase().includes(q) ||
      (m.sirketAdi || "").toLowerCase().includes(q) ||
      (m.yetkiliKisi || "").toLowerCase().includes(q) ||
      (m.eposta || "").toLowerCase().includes(q) ||
      (m.tur || "").toLowerCase().includes(q)
    );
  });

  const toplamSayfa = Math.max(1, Math.ceil(filtrelenenler.length / sayfaBoyutu));
  const sayfalananlar = filtrelenenler.slice(
    (aktifSayfa - 1) * sayfaBoyutu,
    aktifSayfa * sayfaBoyutu
  );

  const musteriAdi = (m) => m.adSoyad || m.sirketAdi || m.yetkiliKisi || `Müşteri #${m.id}`;

  const tipRenk = (tur) => {
    if (tur === "gercek") return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300";
    if (tur === "tuzel") return "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300";
    return "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300";
  };

  const tipEtiket = (tur) => {
    if (tur === "gercek") return "Gerçek";
    if (tur === "tuzel") return "Tüzel";
    return "Yabancı";
  };

  /* ============================================= */
  /*  Düzenleme Modalı - MusteriEklePage Tarzı     */
  /* ============================================= */

  function DuzenleModalBilesen() {
    const m = duzenleModal;
    if (!m) return null;

    const [aktifSekme, setAktifSekme] = useState(m.tur || "gercek");
    const [form, setForm] = useState({
      adSoyad: m.adSoyad || "",
      sirketAdi: m.sirketAdi || "",
      yetkiliKisi: m.yetkiliKisi || "",
      eposta: m.eposta || "",
      tcKimlikNo: m.tcKimlikNo || "",
      vergiNo: m.vergiNo || "",
      vergiDairesi: m.vergiDairesi || "",
      pasaportNo: m.pasaportNo || "",
      ustMusteri: m.ustMusteri || "",
      ustMusteriArama: "",
      telefonlar: (m.telefonlar && m.telefonlar.length > 0) ? [...m.telefonlar] : [""],
      adresler: (m.adresler && m.adresler.length > 0) ? [...m.adresler] : [""],
      durum: m.durum === "Aktif" || m.durum === true,
      sektor: m.sektor || "",
    });
    const [hatalar, setHatalar] = useState({});
    const [ustAcik, setUstAcik] = useState(false);
    const ustRef = useRef(null);

    useEffect(() => {
      const disari = (e) => {
        if (ustRef.current && !ustRef.current.contains(e.target)) setUstAcik(false);
      };
      document.addEventListener("mousedown", disari);
      return () => document.removeEventListener("mousedown", disari);
    }, []);

    const tumMusteriler = [
      ...MEVCUT_MUSTERILER,
      ...musteriler.filter((x) => x.id !== m.id).map((x) => ({ id: x.id, ad: x.adSoyad || x.sirketAdi || `Müşteri #${x.id}` })),
    ];

    const filtreliUstler = tumMusteriler.filter((x) =>
      x.ad.toLowerCase().includes(form.ustMusteriArama.toLowerCase())
    );

    const guncelle = (alan, deger) => {
      setForm((o) => ({ ...o, [alan]: deger }));
      if (hatalar[alan]) setHatalar((o) => { const y = { ...o }; delete y[alan]; return y; });
    };

    const listeEkle = (alan) => setForm((o) => ({ ...o, [alan]: [...o[alan], ""] }));
    const listeGuncelle = (alan, idx, val) => setForm((o) => { const y = [...o[alan]]; y[idx] = val; return { ...o, [alan]: y }; });
    const listeSil = (alan, idx) => setForm((o) => { const y = o[alan].filter((_, i) => i !== idx); return { ...o, [alan]: y.length === 0 ? [""] : y }; });

    const dogrula = () => {
      const h = {};
      if (!form.eposta.trim()) h.eposta = "E-posta zorunludur.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.eposta.trim())) h.eposta = "Geçerli bir e-posta adresi giriniz.";
      if (!form.telefonlar[0] || !form.telefonlar[0].trim()) h.telefonlar = "Telefon zorunludur.";
      else if (form.telefonlar[0].replace(/\D/g, "").length < 10) h.telefonlar = "Telefon en az 10 haneli olmalıdır.";
      if (!form.adresler[0] || !form.adresler[0].trim()) h.adresler = "Adres zorunludur.";
      if (aktifSekme === "gercek") {
        if (!form.tcKimlikNo.trim()) h.tcKimlikNo = "TC Kimlik No zorunludur.";
        else if (form.tcKimlikNo.replace(/\D/g, "").length !== 11) h.tcKimlikNo = "TC Kimlik No 11 haneli olmalıdır.";
        if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      }
      if (aktifSekme === "tuzel") {
        if (!form.vergiNo.trim()) h.vergiNo = "Vergi No zorunludur.";
        else if (form.vergiNo.replace(/\D/g, "").length !== 10) h.vergiNo = "Vergi No 10 haneli olmalıdır.";
        if (!form.vergiDairesi.trim()) h.vergiDairesi = "Vergi Dairesi zorunludur.";
      }
      if (aktifSekme === "yabanci") {
        if (!form.pasaportNo.trim()) h.pasaportNo = "Pasaport No zorunludur.";
        if (!form.yetkiliKisi.trim()) h.yetkiliKisi = "Yetkili Kişi zorunludur.";
      }
      setHatalar(h);
      return Object.keys(h).length === 0;
    };

    const kaydet = () => {
      if (!dogrula()) return;
      const veri = {
        tur: aktifSekme,
        eposta: form.eposta,
        sektor: form.sektor,
        ustMusteri: form.ustMusteri,
        telefonlar: form.telefonlar.filter((t) => t.trim()),
        adresler: form.adresler.filter((a) => a.trim()),
        durum: form.durum ? "Aktif" : "Pasif",
        ...(aktifSekme === "gercek" && { adSoyad: form.adSoyad, tcKimlikNo: form.tcKimlikNo, yetkiliKisi: form.yetkiliKisi, sirketAdi: form.sirketAdi }),
        ...(aktifSekme === "tuzel" && { sirketAdi: form.sirketAdi, yetkiliKisi: form.yetkiliKisi, vergiDairesi: form.vergiDairesi, vergiNo: form.vergiNo }),
        ...(aktifSekme === "yabanci" && { adSoyad: form.adSoyad, sirketAdi: form.sirketAdi, pasaportNo: form.pasaportNo, yetkiliKisi: form.yetkiliKisi }),
      };
      musteriGuncelle(m.id, veri);
      console.log("✏️ Müşteri güncellendi:", veri);
      setDuzenleModal(null);
    };

    const duzenleRef = useRef(null);
    const sallanmaUygula = () => { if (duzenleRef.current) { duzenleRef.current.classList.remove("sallan"); void duzenleRef.current.offsetWidth; duzenleRef.current.classList.add("sallan"); } };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanmaUygula}>
        <div ref={duzenleRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-3xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Başlık */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between rounded-t-2xl">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Müşteri Düzenle</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">{musteriAdi(m)}</p>
            </div>
            <button onClick={() => setDuzenleModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* ---- Üst Müşteri ---- */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Üst Müşteri</p>
              <div className="relative" ref={ustRef}>
                {form.ustMusteri ? (
                  <div className={INPUT_STIL + " flex items-center justify-between"}>
                    <span className="text-sm">{form.ustMusteri}</span>
                    <button type="button" onClick={() => { guncelle("ustMusteri", ""); guncelle("ustMusteriArama", ""); }}
                      className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="text" placeholder="Müşteri adı yazarak arayın..." value={form.ustMusteriArama}
                      onChange={(e) => { guncelle("ustMusteriArama", e.target.value); setUstAcik(true); }}
                      onFocus={() => setUstAcik(true)} className={INPUT_STIL} />
                    {ustAcik && form.ustMusteriArama.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl max-h-40 overflow-y-auto">
                        {filtreliUstler.length > 0 ? filtreliUstler.map((x) => (
                          <button key={x.id} type="button" onClick={() => { guncelle("ustMusteri", x.ad); guncelle("ustMusteriArama", ""); setUstAcik(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer">
                            {x.ad}
                          </button>
                        )) : (
                          <div className="p-3">
                            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Bu kullanıcı kayıtlı değil. Yine de eklemek ister misiniz?</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => { guncelle("ustMusteri", form.ustMusteriArama); guncelle("ustMusteriArama", ""); setUstAcik(false); }}
                                className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 cursor-pointer">Evet</button>
                              <button type="button" onClick={() => { guncelle("ustMusteriArama", ""); setUstAcik(false); }}
                                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400 text-xs cursor-pointer">Hayır</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ---- Tip Sekmeleri ---- */}
            <div className="flex gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
              {SEKMELER.map((s) => (
                <button key={s.id} type="button" onClick={() => { setAktifSekme(s.id); setHatalar({}); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    aktifSekme === s.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5"
                  }`}>
                  {s.ikon}{s.etiket}
                </button>
              ))}
            </div>

            {/* ---- Temel Bilgiler ---- */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Temel Bilgiler</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aktifSekme === "gercek" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>TC Kimlik No <span className="text-red-500">*</span></label>
                      <input type="text" value={form.tcKimlikNo} onChange={(e) => guncelle("tcKimlikNo", e.target.value.replace(/\D/g, "").slice(0, 11))}
                        className={hatalar.tcKimlikNo ? HATA_INPUT : INPUT_STIL} maxLength={11} placeholder="11 haneli" />
                      {hatalar.tcKimlikNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.tcKimlikNo}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                      <input type="text" value={form.adSoyad} onChange={(e) => guncelle("adSoyad", e.target.value)}
                        className={hatalar.adSoyad ? HATA_INPUT : INPUT_STIL} placeholder="Ad Soyad" />
                      {hatalar.adSoyad && <p className="text-red-500 text-xs mt-0.5">{hatalar.adSoyad}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Yetkili Kişi</label>
                      <input type="text" value={form.yetkiliKisi} onChange={(e) => guncelle("yetkiliKisi", e.target.value)} className={INPUT_STIL} placeholder="Yetkili" />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Şirket Adı</label>
                      <input type="text" value={form.sirketAdi} onChange={(e) => guncelle("sirketAdi", e.target.value)} className={INPUT_STIL} placeholder="Şirket (opsiyonel)" />
                    </div>
                  </>
                )}
                {aktifSekme === "tuzel" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>Vergi Numarası <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vergiNo} onChange={(e) => guncelle("vergiNo", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={hatalar.vergiNo ? HATA_INPUT : INPUT_STIL} maxLength={10} placeholder="10 haneli" />
                      {hatalar.vergiNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiNo}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Vergi Dairesi <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vergiDairesi} onChange={(e) => guncelle("vergiDairesi", e.target.value)}
                        className={hatalar.vergiDairesi ? HATA_INPUT : INPUT_STIL} placeholder="Vergi Dairesi" />
                      {hatalar.vergiDairesi && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiDairesi}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Şirket Adı</label>
                      <input type="text" value={form.sirketAdi} onChange={(e) => guncelle("sirketAdi", e.target.value)} className={INPUT_STIL} placeholder="Şirket adı" />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Yetkili Kişi</label>
                      <input type="text" value={form.yetkiliKisi} onChange={(e) => guncelle("yetkiliKisi", e.target.value)} className={INPUT_STIL} placeholder="Yetkili" />
                    </div>
                  </>
                )}
                {aktifSekme === "yabanci" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>Pasaport No <span className="text-red-500">*</span></label>
                      <input type="text" value={form.pasaportNo} onChange={(e) => guncelle("pasaportNo", e.target.value)}
                        className={hatalar.pasaportNo ? HATA_INPUT : INPUT_STIL} placeholder="Pasaport No" />
                      {hatalar.pasaportNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.pasaportNo}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Yetkili Kişi <span className="text-red-500">*</span></label>
                      <input type="text" value={form.yetkiliKisi} onChange={(e) => guncelle("yetkiliKisi", e.target.value)}
                        className={hatalar.yetkiliKisi ? HATA_INPUT : INPUT_STIL} placeholder="Yetkili" />
                      {hatalar.yetkiliKisi && <p className="text-red-500 text-xs mt-0.5">{hatalar.yetkiliKisi}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad</label>
                      <input type="text" value={form.adSoyad} onChange={(e) => guncelle("adSoyad", e.target.value)} className={INPUT_STIL} placeholder="Opsiyonel" />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Şirket Adı</label>
                      <input type="text" value={form.sirketAdi} onChange={(e) => guncelle("sirketAdi", e.target.value)} className={INPUT_STIL} placeholder="Opsiyonel" />
                    </div>
                  </>
                )}
                <div>
                  <label className={LABEL_STIL}>E-posta <span className="text-red-500">*</span></label>
                  <input type="email" value={form.eposta} onChange={(e) => guncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT : INPUT_STIL} placeholder="ornek@sirket.com" />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-0.5">{hatalar.eposta}</p>}
                </div>
              </div>
            </div>

            {/* ---- İletişim ---- */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">İletişim</p>
              {/* Telefonlar */}
              <div className="mb-3">
                <label className={LABEL_STIL}>Telefonlar <span className="text-red-500">*</span></label>
                {hatalar.telefonlar && <p className="text-red-500 text-xs mb-1">{hatalar.telefonlar}</p>}
                {form.telefonlar.map((tel, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input type="text" placeholder="(5XX) XXX XX XX" value={tel}
                      onChange={(e) => listeGuncelle("telefonlar", idx, telefonFormatla(e.target.value))} className={INPUT_STIL} />
                    {form.telefonlar.length > 1 && (
                      <button type="button" onClick={() => listeSil("telefonlar", idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 cursor-pointer shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => listeEkle("telefonlar")}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer font-medium inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Telefon Ekle
                </button>
              </div>
              {/* Adresler */}
              <div>
                <label className={LABEL_STIL}>Adresler <span className="text-red-500">*</span></label>
                {hatalar.adresler && <p className="text-red-500 text-xs mb-1">{hatalar.adresler}</p>}
                {form.adresler.map((adres, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-2">
                    <textarea placeholder="Adres" value={adres} onChange={(e) => listeGuncelle("adresler", idx, e.target.value)}
                      rows={2} className={INPUT_STIL + " resize-none"} />
                    {form.adresler.length > 1 && (
                      <button type="button" onClick={() => listeSil("adresler", idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 cursor-pointer shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => listeEkle("adresler")}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer font-medium inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Adres Ekle
                </button>
              </div>
            </div>

            {/* ---- Durum Toggle ---- */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Müşteri Durumu</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => guncelle("durum", !form.durum)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${form.durum ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/20"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${form.durum ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className={`text-sm font-medium ${form.durum ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                    {form.durum ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>
            </div>

            {/* ---- Hata Özeti ---- */}
            {Object.keys(hatalar).length > 0 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Lütfen zorunlu alanları doldurun.</p>
              </div>
            )}
          </div>

          {/* ---- Alt Butonlar ---- */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={() => setDuzenleModal(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">İptal</button>
            <button onClick={kaydet}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Kaydet
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Müşteri Paketleri Modalı - Tablo Görünümü   */
  /* ============================================= */

  function PaketModalBilesen() {
    const m = paketModal;
    if (!m) return null;

    const [paketler, setPaketler] = useState(() => mockPaketlerOlustur());
    const [paketArama, setPaketArama] = useState("");
    const [paketSayfa, setPaketSayfa] = useState(1);
    const [paketBoyut, setPaketBoyut] = useState(10);

    /* Alt modal states */
    const [cihazlarModal, setCihazlarModal] = useState(null);
    const [silOnay, setSilOnay] = useState(null);
    const [lisansKeyModal, setLisansKeyModal] = useState(null);
    const [ekKullaniciModal, setEkKullaniciModal] = useState(null);
    const [faturaModal, setFaturaModal] = useState(null);
    const [yeniPaketModal, setYeniPaketModal] = useState(false);

    /* Yeni paket form */
    const [yeniForm, setYeniForm] = useState({
      urun: URUN_LISTESI[0], paket: PAKET_TIPLERI[0], domain: "", faturaNo: "", kullanimGunu: 365,
      baslangicTarihi: new Date().toISOString().slice(0, 10), kullanici: "1", fiyat: "0.00",
    });

    const filtreliPaketler = paketler.filter((p) => {
      const q = paketArama.toLowerCase();
      return p.urun.toLowerCase().includes(q) || p.paket.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
    });

    const topSayfa = Math.max(1, Math.ceil(filtreliPaketler.length / paketBoyut));
    const sayfaliPaketler = filtreliPaketler.slice((paketSayfa - 1) * paketBoyut, paketSayfa * paketBoyut);

    const paketSil = (id) => {
      setPaketler((o) => o.filter((p) => p.id !== id));
      setSilOnay(null);
    };

    const yeniPaketEkle = () => {
      const yeni = {
        ...yeniForm,
        id: Date.now() + Math.random(),
        bitisTarihi: tarihEkle(yeniForm.baslangicTarihi, yeniForm.kullanimGunu),
        faturaGeldi: false,
        lisansAnahtari: rastgeleLisansAnahtari(),
      };
      setPaketler((o) => [yeni, ...o]);
      setYeniPaketModal(false);
      setYeniForm({ urun: URUN_LISTESI[0], paket: PAKET_TIPLERI[0], domain: "", faturaNo: "", kullanimGunu: 365, baslangicTarihi: new Date().toISOString().slice(0, 10), kullanici: "1", fiyat: "0.00" });
    };

    const paketRef = useRef(null);
    const sallanmaPaket = () => { if (paketRef.current) { paketRef.current.classList.remove("sallan"); void paketRef.current.offsetWidth; paketRef.current.classList.add("sallan"); } };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanmaPaket}>
        <div ref={paketRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-7xl max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

          {/* Başlık */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Müşteri Paketleri</h3>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">{musteriAdi(m)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setYeniPaketModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Yeni Müşteri Paketi
              </button>
              <button onClick={() => setPaketModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Kontroller */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
              <select value={paketBoyut} onChange={(e) => { setPaketBoyut(Number(e.target.value)); setPaketSayfa(1); }}
                className="px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm cursor-pointer text-gray-900 dark:text-white">
                {[5, 10, 25].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>kayıt göster</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-slate-400">Ara:</span>
              <input type="text" value={paketArama} onChange={(e) => { setPaketArama(e.target.value); setPaketSayfa(1); }}
                placeholder="Paket ara..." className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
            </div>
          </div>

          {/* Tablo */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-white/[0.03]">
                <tr className="border-b border-gray-200 dark:border-white/10">
                  {["Ürün", "Paket", "Domain", "Fatura No", "Gün", "Başlangıç", "Bitiş", "Kullanıcı", "Fiyat", "Fatura", "İşlemler"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sayfaliPaketler.length > 0 ? sayfaliPaketler.map((p) => {
                  const gecmis = suAnGecmisMi(p.bitisTarihi);
                  return (
                    <tr key={p.id} className={`transition-colors ${gecmis ? "bg-red-50 dark:bg-red-500/5" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}>
                      <td className={`px-4 py-3.5 font-medium whitespace-nowrap ${gecmis ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{p.urun}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400">{p.paket}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 max-w-[220px] truncate text-xs">{p.domain || "-"}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-xs font-mono">{p.faturaNo || "-"}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-center">{p.kullanimGunu}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 whitespace-nowrap">{tarihGosterTR(p.baslangicTarihi)}</td>
                      <td className={`px-4 py-3.5 whitespace-nowrap font-medium ${gecmis ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-slate-400"}`}>{tarihGosterTR(p.bitisTarihi)}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-center">{p.kullanici}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400">{Number(p.fiyat).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.faturaGeldi ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                          {p.faturaGeldi ? "EVET" : "HAYIR"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Cihazlar */}
                          <button onClick={() => setCihazlarModal(p)} title="Cihazlar"
                            className="w-8 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </button>
                          {/* Sil */}
                          <button onClick={() => setSilOnay(p)} title="Sil"
                            className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          {/* Lisans Anahtarı */}
                          <button onClick={() => setLisansKeyModal(p)} title="Lisans Anahtarı"
                            className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                          </button>
                          {/* Ek Kullanıcı */}
                          <button onClick={() => setEkKullaniciModal(p)} title="Ek Kullanıcı"
                            className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                          </button>
                          {/* Fatura Bilgisi */}
                          <button onClick={() => setFaturaModal(p)} title="Fatura Bilgisi"
                            className="w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">Paket bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-white/10 shrink-0">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {filtreliPaketler.length} kayıttan {Math.min((paketSayfa - 1) * paketBoyut + 1, filtreliPaketler.length)} ile {Math.min(paketSayfa * paketBoyut, filtreliPaketler.length)} arasındakiler gösteriliyor
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPaketSayfa((o) => Math.max(1, o - 1))} disabled={paketSayfa === 1}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Önceki</button>
              {Array.from({ length: topSayfa }, (_, i) => i + 1).map((s) => (
                <button key={s} onClick={() => setPaketSayfa(s)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium cursor-pointer ${paketSayfa === s ? "bg-blue-600 text-white" : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>{s}</button>
              ))}
              <button onClick={() => setPaketSayfa((o) => Math.min(topSayfa, o + 1))} disabled={paketSayfa === topSayfa}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Sonraki</button>
            </div>
          </div>
        </div>

        {/* ========== Alt Modallar ========== */}

        {/* Cihazlar */}
        {cihazlarModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setCihazlarModal(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Cihaz Yönetimi</h4>
                <button onClick={() => setCihazlarModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Cihaz yönetimi modülü hazırlanıyor...</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Bu alan yakında aktif olacaktır.</p>
              </div>
            </div>
          </div>
        )}

        {/* Silme Onayı */}
        {silOnay && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setSilOnay(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Paketi Sil</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Bu paketi silmek istediğinize emin misiniz?</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 font-medium">{silOnay.urun}</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setSilOnay(null)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">İptal</button>
                  <button onClick={() => paketSil(silOnay.id)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer">Evet, Sil</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lisans Anahtarı */}
        {lisansKeyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setLisansKeyModal(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Lisans Anahtarı</h4>
                <button onClick={() => setLisansKeyModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Mevcut Anahtar</p>
                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white tracking-wider">{lisansKeyModal.lisansAnahtari}</p>
              </div>
              <button
                onClick={() => {
                  const yeniKey = rastgeleLisansAnahtari();
                  setPaketler((o) => o.map((p) => p.id === lisansKeyModal.id ? { ...p, lisansAnahtari: yeniKey } : p));
                  setLisansKeyModal({ ...lisansKeyModal, lisansAnahtari: yeniKey });
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Yeni Anahtar Oluştur
              </button>
            </div>
          </div>
        )}

        {/* Ek Kullanıcı */}
        {ekKullaniciModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setEkKullaniciModal(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Ek Kullanıcı</h4>
                <button onClick={() => setEkKullaniciModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Ek kullanıcı yönetimi hazırlanıyor...</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Bu alan yakında aktif olacaktır.</p>
              </div>
            </div>
          </div>
        )}

        {/* Fatura Bilgisi */}
        {faturaModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setFaturaModal(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 dark:text-white">Fatura Bilgisi</h4>
                <button onClick={() => setFaturaModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-500/20 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Fatura bilgisi modülü hazırlanıyor...</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Bu alan yakında aktif olacaktır.</p>
              </div>
            </div>
          </div>
        )}

        {/* Yeni Paket Ekleme */}
        {yeniPaketModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setYeniPaketModal(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-gray-900 dark:text-white">Yeni Müşteri Paketi</h4>
                <button onClick={() => setYeniPaketModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={LABEL_STIL}>Ürün</label>
                  <select value={yeniForm.urun} onChange={(e) => setYeniForm({ ...yeniForm, urun: e.target.value })}
                    className={INPUT_STIL + " [&>option]:bg-white [&>option]:dark:bg-slate-800"}>
                    {URUN_LISTESI.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_STIL}>Paket Tipi</label>
                    <select value={yeniForm.paket} onChange={(e) => setYeniForm({ ...yeniForm, paket: e.target.value })}
                      className={INPUT_STIL + " [&>option]:bg-white [&>option]:dark:bg-slate-800"}>
                      {PAKET_TIPLERI.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_STIL}>Kullanım Günü</label>
                    <input type="number" value={yeniForm.kullanimGunu} onChange={(e) => setYeniForm({ ...yeniForm, kullanimGunu: Number(e.target.value) })} className={INPUT_STIL} />
                  </div>
                </div>
                <div>
                  <label className={LABEL_STIL}>Domain</label>
                  <input type="text" value={yeniForm.domain} onChange={(e) => setYeniForm({ ...yeniForm, domain: e.target.value })} className={INPUT_STIL} placeholder="http://ornek.com:9090/" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_STIL}>Başlangıç Tarihi</label>
                    <input type="date" value={yeniForm.baslangicTarihi} onChange={(e) => setYeniForm({ ...yeniForm, baslangicTarihi: e.target.value })} className={INPUT_STIL} />
                  </div>
                  <div>
                    <label className={LABEL_STIL}>Fiyat</label>
                    <input type="text" value={yeniForm.fiyat} onChange={(e) => setYeniForm({ ...yeniForm, fiyat: e.target.value })} className={INPUT_STIL} placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_STIL}>Kullanıcı</label>
                    <input type="text" value={yeniForm.kullanici} onChange={(e) => setYeniForm({ ...yeniForm, kullanici: e.target.value })} className={INPUT_STIL} placeholder="1 + 1" />
                  </div>
                  <div>
                    <label className={LABEL_STIL}>Fatura No</label>
                    <input type="text" value={yeniForm.faturaNo} onChange={(e) => setYeniForm({ ...yeniForm, faturaNo: e.target.value })} className={INPUT_STIL} placeholder="Opsiyonel" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setYeniPaketModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
                  <button onClick={yeniPaketEkle}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">Paket Ekle</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ============================================= */
  /*  Lisans Belgesi Modalı                        */
  /* ============================================= */

  function LisansModalBilesen() {
    const m = lisansModal;
    if (!m) return null;

    const bugun = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
    const belgeNo = `GT-${String(m.id).slice(-6)}-${new Date().getFullYear()}`;

    const yazdir = () => {
      const pencere = window.open("", "_blank");
      if (!pencere) return;
      pencere.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lisans Belgesi - ${musteriAdi(m)}</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1a1a1a}.header{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:30px}.header h1{color:#2563eb;margin:0;font-size:24px}.header p{color:#666;margin:5px 0 0}.info{margin:20px 0}.info table{width:100%;border-collapse:collapse}.info td{padding:8px 12px;border:1px solid #e5e7eb;font-size:14px}.info td:first-child{background:#f9fafb;font-weight:600;width:40%}.footer{margin-top:40px;text-align:center;color:#666;font-size:12px;border-top:1px solid #e5e7eb;padding-top:20px}.badge{display:inline-block;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:600}.aktif{background:#d1fae5;color:#065f46}.pasif{background:#fee2e2;color:#991b1b}</style></head><body>
        <div class="header"><h1>GÜZEL TEKNOLOJİ</h1><p>Lisans Belgesi</p></div>
        <div class="info"><table>
          <tr><td>Belge No</td><td>${belgeNo}</td></tr>
          <tr><td>Müşteri Adı</td><td>${musteriAdi(m)}</td></tr>
          <tr><td>Müşteri Tipi</td><td>${tipEtiket(m.tur)}</td></tr>
          ${m.tcKimlikNo ? `<tr><td>TC Kimlik No</td><td>${m.tcKimlikNo}</td></tr>` : ""}
          ${m.vergiNo ? `<tr><td>Vergi No</td><td>${m.vergiNo}</td></tr>` : ""}
          ${m.pasaportNo ? `<tr><td>Pasaport No</td><td>${m.pasaportNo}</td></tr>` : ""}
          <tr><td>E-posta</td><td>${m.eposta || "-"}</td></tr>
          <tr><td>Telefon</td><td>${(m.telefonlar || []).join(", ") || "-"}</td></tr>
          <tr><td>Durum</td><td><span class="badge ${m.durum === "Aktif" ? "aktif" : "pasif"}">${m.durum}</span></td></tr>
          <tr><td>Tarih</td><td>${bugun}</td></tr>
        </table></div>
        <div class="footer"><p>Bu belge Güzel Teknoloji Yönetim Paneli tarafından oluşturulmuştur.</p><p>&copy; ${new Date().getFullYear()} Güzel Teknoloji</p></div>
        </body></html>`);
      pencere.document.close();
      pencere.print();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLisansModal(null)}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-xl mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lisans Belgesi</h3>
            <button onClick={() => setLisansModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6">
            <div className="border border-gray-200 dark:border-white/10 rounded-xl p-6 bg-gray-50 dark:bg-white/[0.02]">
              <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
                <h4 className="text-xl font-bold text-blue-600">GÜZEL TEKNOLOJİ</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">Lisans Belgesi</p>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Belge No", <span className="font-mono">{belgeNo}</span>],
                  ["Müşteri", musteriAdi(m)],
                  ["Tip", <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipRenk(m.tur)}`}>{tipEtiket(m.tur)}</span>],
                  m.eposta && ["E-posta", m.eposta],
                  ["Durum", <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.durum === "Aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>{m.durum}</span>],
                  ["Tarih", bugun],
                ].filter(Boolean).map(([label, val], i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5">
                    <span className="font-medium text-gray-600 dark:text-slate-400">{label}</span>
                    <span className="text-gray-900 dark:text-white">{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">Güzel Teknoloji Yönetim Paneli tarafından oluşturulmuştur.</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
            <button onClick={() => setLisansModal(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">Kapat</button>
            <button onClick={yazdir}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              İndir / Yazdır
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Sayfa Render                                 */
  /* ============================================= */

  return (
    <div>
      <DuzenleModalBilesen />
      <PaketModalBilesen />
      <LisansModalBilesen />

      {/* Başlık */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Müşteriler</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Müşteri kayıtlarını görüntüleyin ve yönetin.</p>
        </div>
        <button onClick={() => git("/dashboard/musteri-ekle")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Müşteri Ekle
        </button>
      </div>

      {musteriler.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="text-gray-500 dark:text-slate-400">Henüz müşteri kaydı bulunmamaktadır.</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Yukarıdaki butonu kullanarak ilk müşterinizi ekleyin.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
          {/* Kontroller */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
              <select value={sayfaBoyutu} onChange={(e) => { setSayfaBoyutu(Number(e.target.value)); setAktifSayfa(1); }}
                className="px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm cursor-pointer">
                {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>kayıt göster</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-slate-400">Ara:</span>
              <input type="text" value={arama} onChange={(e) => { setArama(e.target.value); setAktifSayfa(1); }}
                placeholder="Müşteri ara..." className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
            </div>
          </div>

          {/* Tablo */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.03]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Müşteri Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tipi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Yetkili Kişi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">E-posta</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sayfalananlar.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{musteriAdi(m)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${tipRenk(m.tur)}`}>{tipEtiket(m.tur)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-400">{m.yetkiliKisi || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-400">{(m.telefonlar || [])[0] || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-400">{m.eposta || "-"}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        m.durum === "Aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      }`}>{m.durum}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setDuzenleModal(m)} title="Düzenle"
                          className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setPaketModal(m)} title="Müşteri Paketleri"
                          className="w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </button>
                        <button onClick={() => setLisansModal(m)} title="Lisans Belgesi"
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Toplam {filtrelenenler.length} kayıttan {Math.min((aktifSayfa - 1) * sayfaBoyutu + 1, filtrelenenler.length)}-{Math.min(aktifSayfa * sayfaBoyutu, filtrelenenler.length)} arası gösteriliyor
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setAktifSayfa((o) => Math.max(1, o - 1))} disabled={aktifSayfa === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Önceki</button>
              {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
                <button key={s} onClick={() => setAktifSayfa(s)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${aktifSayfa === s ? "bg-blue-600 text-white" : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>{s}</button>
              ))}
              <button onClick={() => setAktifSayfa((o) => Math.min(toplamSayfa, o + 1))} disabled={aktifSayfa === toplamSayfa}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Sonraki</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
