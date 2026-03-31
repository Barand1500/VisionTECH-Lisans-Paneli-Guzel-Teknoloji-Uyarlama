/* ============================================= */
/*  Güzel Teknoloji - Bayi Yönetimi Sayfası      */
/*  Bayi listeleme (tablo + İşlemler kolonu),     */
/*  yeni bayi ekleme (Gerçek/Tüzel/Yabancı form),*/
/*  düzenleme (ok tuşları ile gezinme),           */
/*  hiyerarşi ağacı (odaklanma efekti)            */
/*  Gece/Gündüz modu destekli                     */
/* ============================================= */

import { useState, useRef, useEffect } from "react";
import KopyalaButonu from "../bilesenler/KopyalaButonu";
import { apiGet, apiPost, apiPut, apiDelete } from "../yardimcilar/api";

/* ============================================= */
/*  Sabitler                                      */
/* ============================================= */

const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm";

const LABEL_STIL = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

const HATA_INPUT =
  "w-full px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm";

/* ---- Sallanma Animasyonu Stili ---- */
const sallanmaStiliBayi = document.getElementById("sallanma-stili-bayi") || (() => {
  const s = document.createElement("style");
  s.id = "sallanma-stili-bayi";
  s.textContent = `@keyframes sallanma { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(5px)} 45%{transform:translateX(-4px)} 60%{transform:translateX(3px)} 75%{transform:translateX(-2px)} } .sallan { animation: sallanma 0.5s ease-in-out; }`;
  document.head.appendChild(s);
  return s;
})();

/* ---- Hiyerarşi: Düğümün odaklanan bayinin alt şirketi olup olmadığını kontrol et ---- */
function odakliAltMi(bayiId, odakliId, tumBayiler) {
  if (!odakliId) return false;
  let mevcut = tumBayiler.find((b) => b.id === bayiId);
  while (mevcut) {
    if (mevcut.ustBayiId === odakliId) return true;
    mevcut = tumBayiler.find((b) => b.id === mevcut.ustBayiId);
  }
  return false;
}

const SEKMELER = [
  {
    id: "gercek", etiket: "Gerçek",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    id: "tuzel", etiket: "Tüzel",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    id: "yabanci", etiket: "Yabancı",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

const telefonFormatla = (deger) => {
  const r = deger.replace(/\D/g, "").slice(0, 10);
  if (!r) return "";
  if (r.length <= 3) return `(${r}`;
  if (r.length <= 6) return `(${r.slice(0, 3)}) ${r.slice(3)}`;
  if (r.length <= 8) return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6)}`;
  return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6, 8)} ${r.slice(8)}`;
};

const bosFormOlustur = () => ({
  ad: "", yetkili: "", eposta: "", telefon: "", vergiNo: "", vergiDairesi: "",
  tcKimlikNo: "", pasaportNo: "", adSoyad: "", sirketAdi: "", sehir: "",
  ustBayiId: "", ustBayiArama: "", ustBayi: "",
  telefonlar: [""], adresler: [""], durum: true,
});

/* ============================================= */
/*  Hiyerarşi Ağaç Düğümü                        */
/* ============================================= */

function AgacDugumu({ bayi, tumBayiler, seviye = 0, odakliId, setOdakliId }) {
  const altBayiler = tumBayiler.filter((b) => b.ustBayiId === bayi.id);
  const odakli = odakliId === bayi.id;
  const altSirket = odakliAltMi(bayi.id, odakliId, tumBayiler);
  const soluk = odakliId !== null && odakliId !== bayi.id && !altSirket;

  return (
    <div>
      <div
        onClick={() => setOdakliId(odakli ? null : bayi.id)}
        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-300 ${
          seviye > 0 ? "ml-6 border-l-2 border-blue-200 dark:border-blue-500/30 pl-4" : ""
        } ${
          odakli
            ? "bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-400 dark:ring-blue-500/50 shadow-md"
            : soluk
            ? "opacity-40 hover:opacity-70"
            : "hover:bg-gray-50 dark:hover:bg-white/5"
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          bayi.durum === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-gray-100 dark:bg-white/10"
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${bayi.durum === "aktif" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${odakli ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"}`}>{bayi.ad}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{bayi.sehir} — {bayi.yetkili}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bayi.durum === "aktif" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"}`}>
          {bayi.durum === "aktif" ? "Aktif" : "Pasif"}
        </span>
      </div>
      {altBayiler.map((alt) => (
        <AgacDugumu key={alt.id} bayi={alt} tumBayiler={tumBayiler} seviye={seviye + 1} odakliId={odakliId} setOdakliId={setOdakliId} />
      ))}
    </div>
  );
}

/* ============================================= */
/*  Ana Bileşen                                   */
/* ============================================= */

export default function BayilerPage() {
  const [bayiler, setBayiler] = useState([]);
  const [arama, setArama] = useState("");
  const [kartFiltre, setKartFiltre] = useState(null);
  const [aktifGorunum, setAktifGorunum] = useState("tablo");
  const [odakliId, setOdakliId] = useState(null);

  /* ---- Backend'den bayileri çek ---- */
  const bayileriYukle = async () => {
    try {
      const yanit = await apiGet("/bayiler");
      setBayiler(yanit.veri.map((b) => ({
        id: b.id,
        ad: b.ad,
        yetkili: b.yetkili,
        eposta: b.eposta,
        telefon: b.telefon,
        vergiNo: b.vergi_no,
        vergiDairesi: b.vergi_dairesi,
        ustBayiId: b.ust_bayi_id,
        sehir: b.sehir,
        durum: b.durum,
        tur: b.tur,
        tcKimlikNo: b.tc_kimlik_no || "",
        pasaportNo: b.pasaport_no || "",
        adSoyad: b.ad_soyad || "",
        sirketAdi: b.sirket_adi || "",
        telefonlar: b.telefon ? [b.telefon] : [],
        adresler: b.sehir ? [b.sehir] : [],
      })));
    } catch (e) {
      console.error("Bayiler yuklenemedi:", e);
    }
  };

  useEffect(() => { bayileriYukle(); }, []);

  /* Sıralama */
  const [siralamaAlani, setSiralamaAlani] = useState(null);
  const [siralamaYonu, setSiralamaYonu] = useState("asc");

  const siralamaToggle = (alan) => {
    if (siralamaAlani === alan) {
      setSiralamaYonu((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSiralamaAlani(alan);
      setSiralamaYonu("asc");
    }
  };

  const SiralamaIkon = ({ alan }) => {
    if (siralamaAlani !== alan) return <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>;
    return siralamaYonu === "asc"
      ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
      : <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;
  };

  /* Modal states */
  const [ekleModalAcik, setEkleModalAcik] = useState(false);
  const [duzenleModal, setDuzenleModal] = useState(null);

  /* Kart Filtreleme */
  const filtreliBayiler = bayiler.filter((b) => {
    const aramaUygun = b.ad.toLowerCase().includes(arama.toLowerCase()) || b.sehir.toLowerCase().includes(arama.toLowerCase());
    if (!aramaUygun) return false;
    if (!kartFiltre) return true;
    if (kartFiltre === "toplam") return true;
    if (kartFiltre === "anaBayi") return !b.ustBayiId;
    if (kartFiltre === "aktif") return b.durum === "aktif";
    if (kartFiltre === "pasif") return b.durum === "pasif";
    return true;
  });

  const ustBayiAdiBul = (id) => {
    const bulunan = bayiler.find((b) => b.id === id);
    return bulunan ? bulunan.ad : "—";
  };

  const bayiTuruBelirle = (bayi) => bayi.ustBayiId ? "Alt Bayi" : "Ana Bayi";

  const kokBayiler = bayiler.filter((b) => !b.ustBayiId);

  /* Sıralanmış Bayi Listesi */
  const siraliBayiler = [...filtreliBayiler].sort((a, b) => {
    if (!siralamaAlani) return 0;
    let dA, dB;
    switch (siralamaAlani) {
      case "ad": dA = a.ad.toLowerCase(); dB = b.ad.toLowerCase(); break;
      case "sehir": dA = a.sehir.toLowerCase(); dB = b.sehir.toLowerCase(); break;
      case "durum": dA = a.durum; dB = b.durum; break;
      case "tur": dA = a.ustBayiId ? "alt" : "ana"; dB = b.ustBayiId ? "alt" : "ana"; break;
      default: return 0;
    }
    if (dA < dB) return siralamaYonu === "asc" ? -1 : 1;
    if (dA > dB) return siralamaYonu === "asc" ? 1 : -1;
    return 0;
  });

  /* ============================================= */
  /*  Yeni Bayi Ekleme Modalı                      */
  /* ============================================= */

  function BayiEkleModal() {
    if (!ekleModalAcik) return null;

    const [aktifSekme, setAktifSekme] = useState("tuzel");
    const [form, setForm] = useState(bosFormOlustur());
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

    const anaBayiler = bayiler.filter((b) => !b.ustBayiId);
    const filtreliUstler = anaBayiler.filter((b) =>
      b.ad.toLowerCase().includes(form.ustBayiArama.toLowerCase())
    );

    const guncelle = (alan, val) => {
      setForm((o) => ({ ...o, [alan]: val }));
      if (hatalar[alan]) setHatalar((o) => { const y = { ...o }; delete y[alan]; return y; });
    };

    const listeEkle = (alan) => setForm((o) => ({ ...o, [alan]: [...o[alan], ""] }));
    const listeGuncelle = (alan, idx, val) => setForm((o) => { const y = [...o[alan]]; y[idx] = val; return { ...o, [alan]: y }; });
    const listeSil = (alan, idx) => setForm((o) => { const y = o[alan].filter((_, i) => i !== idx); return { ...o, [alan]: y.length === 0 ? [""] : y }; });

    const dogrula = () => {
      const h = {};
      if (!form.telefonlar[0] || !form.telefonlar[0].trim()) h.telefonlar = "Telefon zorunludur.";
      if (!form.adresler[0] || !form.adresler[0].trim()) h.adresler = "Adres zorunludur.";
      if (aktifSekme === "gercek") {
        if (!form.tcKimlikNo.trim()) h.tcKimlikNo = "TC zorunludur.";
        if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      }
      if (aktifSekme === "tuzel") {
        if (!form.sirketAdi.trim()) h.sirketAdi = "Şirket adı zorunludur.";
        if (!form.vergiNo.trim()) h.vergiNo = "Vergi No zorunludur.";
        if (!form.vergiDairesi.trim()) h.vergiDairesi = "Vergi Dairesi zorunludur.";
        if (!form.yetkili.trim()) h.yetkili = "Yetkili zorunludur.";
      }
      if (aktifSekme === "yabanci") {
        if (!form.pasaportNo.trim()) h.pasaportNo = "Pasaport No zorunludur.";
        if (!form.yetkili.trim()) h.yetkili = "Yetkili zorunludur.";
      }
      setHatalar(h);
      return Object.keys(h).length === 0;
    };

    const kaydet = (e) => {
      e.preventDefault();
      if (!dogrula()) return;

      const bayiAdi = aktifSekme === "gercek" ? form.adSoyad : (form.sirketAdi || form.adSoyad || form.yetkili);
      const yeni = {
        id: Date.now(),
        ad: bayiAdi,
        yetkili: form.yetkili || form.adSoyad,
        eposta: form.eposta,
        telefon: form.telefonlar[0] || "",
        vergiNo: form.vergiNo,
        vergiDairesi: form.vergiDairesi,
        tcKimlikNo: form.tcKimlikNo,
        pasaportNo: form.pasaportNo,
        adSoyad: form.adSoyad,
        sirketAdi: form.sirketAdi,
        ustBayiId: form.ustBayiId ? Number(form.ustBayiId) : null,
        sehir: form.sehir || "Belirtilmedi",
        durum: form.durum ? "aktif" : "pasif",
        tur: aktifSekme,
        telefonlar: form.telefonlar.filter((t) => t.trim()),
        adresler: form.adresler.filter((a) => a.trim()),
      };

      console.log("📦 Yeni bayi:", yeni);
      apiPost("/bayiler", {
        ad: yeni.ad,
        yetkili: yeni.yetkili,
        eposta: yeni.eposta,
        telefon: yeni.telefon,
        vergi_no: yeni.vergiNo,
        vergi_dairesi: yeni.vergiDairesi,
        sehir: yeni.sehir,
        durum: yeni.durum,
        tur: yeni.tur,
        ust_bayi_id: yeni.ustBayiId,
        tc_kimlik_no: yeni.tcKimlikNo,
        pasaport_no: yeni.pasaportNo,
        ad_soyad: yeni.adSoyad,
        sirket_adi: yeni.sirketAdi,
      }).then(() => bayileriYukle()).catch((e) => console.error("Bayi eklenemedi:", e));
      setEkleModalAcik(false);
    };

    const ekleRef = useRef(null);
    const sallanmaEkle = () => { if (ekleRef.current) { ekleRef.current.classList.remove("sallan"); void ekleRef.current.offsetWidth; ekleRef.current.classList.add("sallan"); } };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanmaEkle}>
        <div ref={ekleRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-3xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

          {/* Başlık */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Yeni Bayi Ekle</h3>
            <button onClick={() => setEkleModalAcik(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={kaydet} className="p-6 space-y-5">
            {/* Üst Bayi */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Üst Bayi</p>
              <div className="relative" ref={ustRef}>
                {form.ustBayi ? (
                  <div className={INPUT_STIL + " flex items-center justify-between"}>
                    <span className="text-sm">{form.ustBayi}</span>
                    <button type="button" onClick={() => { guncelle("ustBayi", ""); guncelle("ustBayiId", ""); guncelle("ustBayiArama", ""); }}
                      className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="text" placeholder="Üst bayi adı yazarak arayın..." value={form.ustBayiArama}
                      onChange={(e) => { guncelle("ustBayiArama", e.target.value); setUstAcik(true); }}
                      onFocus={() => setUstAcik(true)} className={INPUT_STIL} />
                    {ustAcik && form.ustBayiArama.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl max-h-40 overflow-y-auto">
                        {filtreliUstler.length > 0 ? filtreliUstler.map((b) => (
                          <button key={b.id} type="button" onClick={() => { guncelle("ustBayi", b.ad); guncelle("ustBayiId", String(b.id)); guncelle("ustBayiArama", ""); setUstAcik(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer">
                            {b.ad}
                          </button>
                        )) : (
                          <div className="p-3">
                            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Üst bayi bulunamadı.</p>
                            <button type="button" onClick={() => { guncelle("ustBayiArama", ""); setUstAcik(false); }}
                              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400 text-xs cursor-pointer">Kapat</button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Boş bırakırsanız "Ana Bayi" olarak kaydedilir.</p>
            </div>

            {/* Tip Sekmeleri */}
            <div className="flex gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
              {SEKMELER.map((s) => (
                <button key={s.id} type="button" onClick={() => { setAktifSekme(s.id); setHatalar({}); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    aktifSekme === s.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5"
                  }`}>
                  {s.ikon}{s.etiket}
                </button>
              ))}
            </div>

            {/* Temel Bilgiler */}
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
                      <input type="text" value={form.yetkili} onChange={(e) => guncelle("yetkili", e.target.value)} className={INPUT_STIL} placeholder="Yetkili" />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Şehir</label>
                      <input type="text" value={form.sehir} onChange={(e) => guncelle("sehir", e.target.value)} className={INPUT_STIL} placeholder="Şehir" />
                    </div>
                  </>
                )}
                {aktifSekme === "tuzel" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>Şirket Adı <span className="text-red-500">*</span></label>
                      <input type="text" value={form.sirketAdi} onChange={(e) => guncelle("sirketAdi", e.target.value)}
                        className={hatalar.sirketAdi ? HATA_INPUT : INPUT_STIL} placeholder="Şirket adı" />
                      {hatalar.sirketAdi && <p className="text-red-500 text-xs mt-0.5">{hatalar.sirketAdi}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Vergi No <span className="text-red-500">*</span></label>
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
                      <label className={LABEL_STIL}>Yetkili Kişi <span className="text-red-500">*</span></label>
                      <input type="text" value={form.yetkili} onChange={(e) => guncelle("yetkili", e.target.value)}
                        className={hatalar.yetkili ? HATA_INPUT : INPUT_STIL} placeholder="Yetkili" />
                      {hatalar.yetkili && <p className="text-red-500 text-xs mt-0.5">{hatalar.yetkili}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Şehir</label>
                      <input type="text" value={form.sehir} onChange={(e) => guncelle("sehir", e.target.value)} className={INPUT_STIL} placeholder="Şehir" />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>E-posta</label>
                      <input type="email" value={form.eposta} onChange={(e) => guncelle("eposta", e.target.value)} className={INPUT_STIL} placeholder="ornek@bayi.com" />
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
                      <input type="text" value={form.yetkili} onChange={(e) => guncelle("yetkili", e.target.value)}
                        className={hatalar.yetkili ? HATA_INPUT : INPUT_STIL} placeholder="Yetkili" />
                      {hatalar.yetkili && <p className="text-red-500 text-xs mt-0.5">{hatalar.yetkili}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad</label>
                      <input type="text" value={form.adSoyad} onChange={(e) => guncelle("adSoyad", e.target.value)} className={INPUT_STIL} placeholder="Opsiyonel" />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Şehir</label>
                      <input type="text" value={form.sehir} onChange={(e) => guncelle("sehir", e.target.value)} className={INPUT_STIL} placeholder="Şehir" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* İletişim */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">İletişim</p>
              <div className="mb-3">
                <label className={LABEL_STIL}>Telefonlar <span className="text-red-500">*</span></label>
                {hatalar.telefonlar && <p className="text-red-500 text-xs mb-1">{hatalar.telefonlar}</p>}
                {form.telefonlar.map((tel, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input type="text" placeholder="(5XX) XXX XX XX" value={tel}
                      onChange={(e) => listeGuncelle("telefonlar", idx, telefonFormatla(e.target.value))} className={INPUT_STIL} />
                    {form.telefonlar.length > 1 && (
                      <button type="button" onClick={() => listeSil("telefonlar", idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => listeEkle("telefonlar")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer font-medium inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Telefon Ekle
                </button>
              </div>
              <div>
                <label className={LABEL_STIL}>Adresler <span className="text-red-500">*</span></label>
                {hatalar.adresler && <p className="text-red-500 text-xs mb-1">{hatalar.adresler}</p>}
                {form.adresler.map((adres, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-2">
                    <textarea placeholder="Adres" value={adres} onChange={(e) => listeGuncelle("adresler", idx, e.target.value)}
                      rows={2} className={INPUT_STIL + " resize-none"} />
                    {form.adresler.length > 1 && (
                      <button type="button" onClick={() => listeSil("adresler", idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => listeEkle("adresler")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer font-medium inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Adres Ekle
                </button>
              </div>
            </div>

            {/* Durum */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bayi Durumu</p>
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

            {/* Hatalar */}
            {Object.keys(hatalar).length > 0 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Lütfen zorunlu alanları doldurun.</p>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEkleModalAcik(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
              <button type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Bayi Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Bayi Düzenleme Modalı (Ok İle Gezinme)      */
  /* ============================================= */

  function BayiDuzenleModal() {
    if (!duzenleModal) return null;

    const liste = filtreliBayiler.length > 0 ? filtreliBayiler : bayiler;
    const mevcutIdx = liste.findIndex((b) => b.id === duzenleModal.id);

    const [form, setForm] = useState({
      ad: duzenleModal.ad || "",
      yetkili: duzenleModal.yetkili || "",
      eposta: duzenleModal.eposta || "",
      telefon: duzenleModal.telefon || "",
      vergiNo: duzenleModal.vergiNo || "",
      vergiDairesi: duzenleModal.vergiDairesi || "",
      tcKimlikNo: duzenleModal.tcKimlikNo || "",
      pasaportNo: duzenleModal.pasaportNo || "",
      adSoyad: duzenleModal.adSoyad || "",
      sirketAdi: duzenleModal.sirketAdi || "",
      sehir: duzenleModal.sehir || "",
      durum: duzenleModal.durum === "aktif",
      telefonlar: (duzenleModal.telefonlar && duzenleModal.telefonlar.length > 0) ? [...duzenleModal.telefonlar] : [duzenleModal.telefon || ""],
      adresler: (duzenleModal.adresler && duzenleModal.adresler.length > 0) ? [...duzenleModal.adresler] : [""],
      tur: duzenleModal.tur || "tuzel",
    });

    /* Formu bayiye göre güncelle (ok ile geçiş) */
    const bayiYukle = (bayi) => {
      setDuzenleModal(bayi);
      setForm({
        ad: bayi.ad || "",
        yetkili: bayi.yetkili || "",
        eposta: bayi.eposta || "",
        telefon: bayi.telefon || "",
        vergiNo: bayi.vergiNo || "",
        vergiDairesi: bayi.vergiDairesi || "",
        tcKimlikNo: bayi.tcKimlikNo || "",
        pasaportNo: bayi.pasaportNo || "",
        adSoyad: bayi.adSoyad || "",
        sirketAdi: bayi.sirketAdi || "",
        sehir: bayi.sehir || "",
        durum: bayi.durum === "aktif",
        telefonlar: (bayi.telefonlar && bayi.telefonlar.length > 0) ? [...bayi.telefonlar] : [bayi.telefon || ""],
        adresler: (bayi.adresler && bayi.adresler.length > 0) ? [...bayi.adresler] : [""],
        tur: bayi.tur || "tuzel",
      });
    };

    const onceki = () => {
      if (mevcutIdx > 0) bayiYukle(liste[mevcutIdx - 1]);
    };

    const sonraki = () => {
      if (mevcutIdx < liste.length - 1) bayiYukle(liste[mevcutIdx + 1]);
    };

    const [hatalar, setHatalar] = useState({});

    const guncelle = (alan, val) => {
      setForm((o) => ({ ...o, [alan]: val }));
      if (hatalar[alan]) setHatalar((o) => { const y = { ...o }; delete y[alan]; return y; });
    };

    const listeGuncelle = (alan, idx, val) => setForm((o) => { const y = [...o[alan]]; y[idx] = val; return { ...o, [alan]: y }; });
    const listeEkle = (alan) => setForm((o) => ({ ...o, [alan]: [...o[alan], ""] }));
    const listeSil = (alan, idx) => setForm((o) => { const y = o[alan].filter((_, i) => i !== idx); return { ...o, [alan]: y.length === 0 ? [""] : y }; });

    const dogrula = () => {
      const h = {};
      if (!form.eposta.trim()) h.eposta = "E-posta zorunludur.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.eposta.trim())) h.eposta = "Geçerli bir e-posta adresi giriniz.";
      if (!form.telefonlar[0] || !form.telefonlar[0].trim()) h.telefonlar = "Telefon zorunludur.";
      else if (form.telefonlar[0].replace(/\D/g, "").length < 10) h.telefonlar = "Telefon en az 10 haneli olmalıdır.";
      if (!form.adresler[0] || !form.adresler[0].trim()) h.adresler = "Adres zorunludur.";
      if (form.tur === "gercek") {
        if (!form.tcKimlikNo.trim()) h.tcKimlikNo = "TC Kimlik No zorunludur.";
        else if (form.tcKimlikNo.replace(/\D/g, "").length !== 11) h.tcKimlikNo = "TC Kimlik No 11 haneli olmalıdır.";
        if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      }
      if (form.tur === "tuzel") {
        if (!form.sirketAdi.trim()) h.sirketAdi = "Şirket Adı zorunludur.";
        if (!form.vergiNo.trim()) h.vergiNo = "Vergi No zorunludur.";
        else if (form.vergiNo.replace(/\D/g, "").length !== 10) h.vergiNo = "Vergi No 10 haneli olmalıdır.";
        if (!form.vergiDairesi.trim()) h.vergiDairesi = "Vergi Dairesi zorunludur.";
      }
      if (form.tur === "yabanci") {
        if (!form.pasaportNo.trim()) h.pasaportNo = "Pasaport No zorunludur.";
        if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      }
      if (!form.yetkili.trim()) h.yetkili = "Yetkili Kişi zorunludur.";
      setHatalar(h);
      return Object.keys(h).length === 0;
    };

    const kaydet = () => {
      if (!dogrula()) return;
      const guncellenen = {
        ad: form.sirketAdi || form.adSoyad || form.ad,
        yetkili: form.yetkili,
        eposta: form.eposta,
        telefon: form.telefonlar[0] || "",
        vergiNo: form.vergiNo,
        vergiDairesi: form.vergiDairesi,
        tcKimlikNo: form.tcKimlikNo,
        pasaportNo: form.pasaportNo,
        adSoyad: form.adSoyad,
        sirketAdi: form.sirketAdi,
        sehir: form.sehir,
        durum: form.durum ? "aktif" : "pasif",
        tur: form.tur,
        telefonlar: form.telefonlar.filter((t) => t.trim()),
        adresler: form.adresler.filter((a) => a.trim()),
      };
      apiPut(`/bayiler/${duzenleModal.id}`, {
        ad: guncellenen.ad,
        yetkili: guncellenen.yetkili,
        eposta: guncellenen.eposta,
        telefon: guncellenen.telefon,
        vergi_no: guncellenen.vergiNo,
        vergi_dairesi: guncellenen.vergiDairesi,
        sehir: guncellenen.sehir,
        durum: guncellenen.durum,
        tur: guncellenen.tur,
        tc_kimlik_no: guncellenen.tcKimlikNo,
        pasaport_no: guncellenen.pasaportNo,
        ad_soyad: guncellenen.adSoyad,
        sirket_adi: guncellenen.sirketAdi,
      }).then(() => bayileriYukle()).catch((e) => console.error("Bayi guncellenemedi:", e));
      console.log("✏️ Bayi güncellendi:", guncellenen);
      setDuzenleModal(null);
    };

    const duzenleRef = useRef(null);
    const sallanmaDuzenle = () => { if (duzenleRef.current) { duzenleRef.current.classList.remove("sallan"); void duzenleRef.current.offsetWidth; duzenleRef.current.classList.add("sallan"); } };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanmaDuzenle}>
        <div ref={duzenleRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-3xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

          {/* Başlık + Navigasyon */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-white/10 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Sol Ok */}
                <button onClick={onceki} disabled={mevcutIdx <= 0} title="Önceki bayi"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    mevcutIdx <= 0 ? "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-white/5" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bayi Düzenle</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {duzenleModal.ad} — {mevcutIdx + 1} / {liste.length}
                  </p>
                </div>

                {/* Sağ Ok */}
                <button onClick={sonraki} disabled={mevcutIdx >= liste.length - 1} title="Sonraki bayi"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    mevcutIdx >= liste.length - 1 ? "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-white/5" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {/* Durum Toggle + Kapat */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => guncelle("durum", !form.durum)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${form.durum ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/20"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${form.durum ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className={`text-sm font-medium ${form.durum ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                    {form.durum ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <button onClick={() => setDuzenleModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Tip Bilgisi */}
            <div className="flex gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
              {SEKMELER.map((s) => (
                <button key={s.id} type="button" onClick={() => guncelle("tur", s.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    form.tur === s.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5"
                  }`}>
                  {s.ikon}{s.etiket}
                </button>
              ))}
            </div>

            {/* Bilgiler */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Temel Bilgiler</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {form.tur === "gercek" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>TC Kimlik No <span className="text-red-500">*</span></label>
                      <input type="text" value={form.tcKimlikNo} onChange={(e) => guncelle("tcKimlikNo", e.target.value.replace(/\D/g, "").slice(0, 11))} className={hatalar.tcKimlikNo ? HATA_INPUT : INPUT_STIL} maxLength={11} placeholder="11 haneli" />
                      {hatalar.tcKimlikNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.tcKimlikNo}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                      <input type="text" value={form.adSoyad} onChange={(e) => guncelle("adSoyad", e.target.value)} className={hatalar.adSoyad ? HATA_INPUT : INPUT_STIL} placeholder="Ad Soyad" />
                      {hatalar.adSoyad && <p className="text-red-500 text-xs mt-0.5">{hatalar.adSoyad}</p>}
                    </div>
                  </>
                )}
                {form.tur === "tuzel" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>Şirket Adı <span className="text-red-500">*</span></label>
                      <input type="text" value={form.sirketAdi} onChange={(e) => guncelle("sirketAdi", e.target.value)} className={hatalar.sirketAdi ? HATA_INPUT : INPUT_STIL} placeholder="Şirket adı" />
                      {hatalar.sirketAdi && <p className="text-red-500 text-xs mt-0.5">{hatalar.sirketAdi}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Vergi No <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vergiNo} onChange={(e) => guncelle("vergiNo", e.target.value.replace(/\D/g, "").slice(0, 10))} className={hatalar.vergiNo ? HATA_INPUT : INPUT_STIL} maxLength={10} placeholder="10 haneli" />
                      {hatalar.vergiNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiNo}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Vergi Dairesi <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vergiDairesi} onChange={(e) => guncelle("vergiDairesi", e.target.value)} className={hatalar.vergiDairesi ? HATA_INPUT : INPUT_STIL} placeholder="Vergi Dairesi" />
                      {hatalar.vergiDairesi && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiDairesi}</p>}
                    </div>
                  </>
                )}
                {form.tur === "yabanci" && (
                  <>
                    <div>
                      <label className={LABEL_STIL}>Pasaport No <span className="text-red-500">*</span></label>
                      <input type="text" value={form.pasaportNo} onChange={(e) => guncelle("pasaportNo", e.target.value)} className={hatalar.pasaportNo ? HATA_INPUT : INPUT_STIL} placeholder="Pasaport No" />
                      {hatalar.pasaportNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.pasaportNo}</p>}
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                      <input type="text" value={form.adSoyad} onChange={(e) => guncelle("adSoyad", e.target.value)} className={hatalar.adSoyad ? HATA_INPUT : INPUT_STIL} placeholder="Ad Soyad" />
                      {hatalar.adSoyad && <p className="text-red-500 text-xs mt-0.5">{hatalar.adSoyad}</p>}
                    </div>
                  </>
                )}
                <div>
                  <label className={LABEL_STIL}>Yetkili Kişi <span className="text-red-500">*</span></label>
                  <input type="text" value={form.yetkili} onChange={(e) => guncelle("yetkili", e.target.value)} className={hatalar.yetkili ? HATA_INPUT : INPUT_STIL} placeholder="Yetkili" />
                  {hatalar.yetkili && <p className="text-red-500 text-xs mt-0.5">{hatalar.yetkili}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>E-posta <span className="text-red-500">*</span></label>
                  <input type="email" value={form.eposta} onChange={(e) => guncelle("eposta", e.target.value)} className={hatalar.eposta ? HATA_INPUT : INPUT_STIL} placeholder="ornek@sirket.com" />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-0.5">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Şehir</label>
                  <input type="text" value={form.sehir} onChange={(e) => guncelle("sehir", e.target.value)} className={INPUT_STIL} />
                </div>
              </div>
            </div>

            {/* İletişim */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">İletişim</p>
              <div className="mb-3">
                <label className={LABEL_STIL}>Telefonlar <span className="text-red-500">*</span></label>
                {hatalar.telefonlar && <p className="text-red-500 text-xs mb-1">{hatalar.telefonlar}</p>}
                {form.telefonlar.map((tel, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input type="text" placeholder="(5XX) XXX XX XX" value={tel}
                      onChange={(e) => listeGuncelle("telefonlar", idx, telefonFormatla(e.target.value))} className={hatalar.telefonlar ? HATA_INPUT : INPUT_STIL} />
                    {form.telefonlar.length > 1 && (
                      <button type="button" onClick={() => listeSil("telefonlar", idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => listeEkle("telefonlar")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer font-medium inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Telefon Ekle
                </button>
              </div>
              <div>
                <label className={LABEL_STIL}>Adresler <span className="text-red-500">*</span></label>
                {hatalar.adresler && <p className="text-red-500 text-xs mb-1">{hatalar.adresler}</p>}
                {form.adresler.map((adres, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-2">
                    <textarea placeholder="Adres" value={adres} onChange={(e) => listeGuncelle("adresler", idx, e.target.value)}
                      rows={2} className={(hatalar.adresler ? HATA_INPUT : INPUT_STIL) + " resize-none"} />
                    {form.adresler.length > 1 && (
                      <button type="button" onClick={() => listeSil("adresler", idx)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => listeEkle("adresler")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer font-medium inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Adres Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Alt Butonlar */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={() => setDuzenleModal(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button onClick={kaydet}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
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
  /*  Sayfa Render                                 */
  /* ============================================= */

  return (
    <div>
      <BayiEkleModal />
      <BayiDuzenleModal />

      {/* Başlık */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bayiler</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Bayi ağınızı görüntüleyin ve yönetin.</p>
        </div>
        <button onClick={() => setEkleModalAcik(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-600/25 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Bayi Ekle
        </button>
      </div>

      {/* Arama + Görünüm */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Bayi adı veya şehir ile arayın..." value={arama} onChange={(e) => setArama(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
        </div>
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
          <button onClick={() => setAktifGorunum("tablo")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${aktifGorunum === "tablo" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
          <button onClick={() => setAktifGorunum("hiyerarsi")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${aktifGorunum === "hiyerarsi" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
          </button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { etiket: "Toplam Bayi", deger: bayiler.length, renk: "text-blue-600 dark:text-blue-400", filtre: "toplam", borderRenk: "border-blue-500 dark:border-blue-400" },
          { etiket: "Ana Bayi", deger: bayiler.filter((b) => !b.ustBayiId).length, renk: "text-violet-600 dark:text-violet-400", filtre: "anaBayi", borderRenk: "border-violet-500 dark:border-violet-400" },
          { etiket: "Aktif", deger: bayiler.filter((b) => b.durum === "aktif").length, renk: "text-emerald-600 dark:text-emerald-400", filtre: "aktif", borderRenk: "border-emerald-500 dark:border-emerald-400" },
          { etiket: "Pasif", deger: bayiler.filter((b) => b.durum === "pasif").length, renk: "text-gray-500 dark:text-slate-400", filtre: "pasif", borderRenk: "border-gray-500 dark:border-slate-400" },
        ].map((k) => (
          <div key={k.etiket} onClick={() => setKartFiltre(kartFiltre === k.filtre ? null : k.filtre)}
            className={`rounded-xl bg-white dark:bg-white/5 border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              kartFiltre === k.filtre ? `${k.borderRenk} shadow-md` : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            }`}>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{k.etiket}</p>
            <p className={`text-2xl font-bold ${k.renk}`}>{k.deger}</p>
          </div>
        ))}
      </div>

      {/* Tablo Görünümü */}
      {aktifGorunum === "tablo" && (
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th onClick={() => siralamaToggle("ad")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Bayi Adı<SiralamaIkon alan="ad" /></span></th>
                  <th onClick={() => siralamaToggle("tur")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Türü<SiralamaIkon alan="tur" /></span></th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Üst Bayi</th>
                  <th onClick={() => siralamaToggle("sehir")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Şehir<SiralamaIkon alan="sehir" /></span></th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Telefon</th>
                  <th onClick={() => siralamaToggle("durum")} className="text-center px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center justify-center">Durum<SiralamaIkon alan="durum" /></span></th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {siraliBayiler.length > 0 ? siraliBayiler.map((bayi) => (
                  <tr key={bayi.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{bayi.ad}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{bayi.yetkili}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${bayi.ustBayiId ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"}`}>
                        {bayiTuruBelirle(bayi)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                      {bayi.ustBayiId ? ustBayiAdiBul(bayi.ustBayiId) : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{bayi.sehir}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                      <span className="inline-flex items-center group">
                        {bayi.telefon || (bayi.telefonlar && bayi.telefonlar[0]) || "—"}
                        <KopyalaButonu metin={bayi.telefon || (bayi.telefonlar && bayi.telefonlar[0])} />
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${bayi.durum === "aktif" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bayi.durum === "aktif" ? "bg-emerald-500" : "bg-gray-400 dark:bg-slate-500"}`} />
                        {bayi.durum === "aktif" ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setDuzenleModal(bayi)} title="Düzenle"
                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                      "{arama}" ile eşleşen bayi bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hiyerarşi Ağacı */}
      {aktifGorunum === "hiyerarsi" && (
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bayi Hiyerarşisi</h3>
            {odakliId !== null && (
              <button onClick={() => setOdakliId(null)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer font-medium">
                Odağı Kaldır
              </button>
            )}
          </div>
          <div className="space-y-1">
            {kokBayiler.map((bayi) => (
              <AgacDugumu key={bayi.id} bayi={bayi} tumBayiler={bayiler} odakliId={odakliId} setOdakliId={setOdakliId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
