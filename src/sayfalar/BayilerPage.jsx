/* ============================================= */
/*  Güzel Teknoloji - Bayi Yönetimi Sayfası      */
/*  Bayi listeleme (tablo + İşlemler kolonu),     */
/*  yeni bayi ekleme (Gerçek/Tüzel/Yabancı form),*/
/*  düzenleme (ok tuşları ile gezinme),           */
/*  hiyerarşi ağacı (odaklanma efekti)            */
/*  Gece/Gündüz modu destekli                     */
/* ============================================= */

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
          <p className="text-xs text-gray-400 dark:text-slate-500">{bayi.sektor} — {bayi.yetkili}</p>
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
  const git = useNavigate();
  const [bayiler, setBayiler] = useState([]);
  const [arama, setArama] = useState("");
  const [etiketFiltresi, setEtiketFiltresi] = useState(new Set());
  const [etiketDropdownAcik, setEtiketDropdownAcik] = useState(false);
  const [etiketArama, setEtiketArama] = useState("");
  const etiketDropdownRef = useRef(null);
  const [kartFiltre, setKartFiltre] = useState(null);
  const [aktifGorunum, setAktifGorunum] = useState("tablo");
  const [odakliId, setOdakliId] = useState(null);
  const [detayModal, setDetayModal] = useState(null);

  /* ---- Toplu İşlem State'leri ---- */
  const [seciliIdler, setSeciliIdler] = useState(new Set());
  const [topluSilOnay, setTopluSilOnay] = useState(false);
  const [silOnay, setSilOnay] = useState(null);

  /* ---- Sayfalama ---- */
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);
  const [aktifSayfa, setAktifSayfa] = useState(1);

  /* ---- Not Modalı ---- */
  const [notModal, setNotModal] = useState(null);
  const [yeniNot, setYeniNot] = useState("");
  const [yeniNotOnemli, setYeniNotOnemli] = useState(false);
  const [bayiNotlar, setBayiNotlar] = useState([]);

  /* ---- Detay Modal Dosyalar ---- */
  const [detayDosyalar, setDetayDosyalar] = useState([]);
  const [detayDosyalarYukleniyor, setDetayDosyalarYukleniyor] = useState(false);

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
        sektorId: b.sektor_id,
        sektor: b.sektor_adi,
        durum: b.durum,
        tur: b.tur,
        tcKimlikNo: b.tc_kimlik_no || "",
        pasaportNo: b.pasaport_no || "",
        adSoyad: b.ad_soyad || "",
        sirketAdi: b.sirket_adi || "",
        telefonlar: b.telefon ? [b.telefon] : [],
        adresler: b.sektor ? [b.sektor] : [],
        etiketler: Array.isArray(b.etiketler) ? b.etiketler : (b.etiketler ? JSON.parse(b.etiketler) : []),
      })));
    } catch (e) {
      console.error("Bayiler yuklenemedi:", e);
    }
  };

  useEffect(() => { bayileriYukle(); }, []);

  /* Escape tuşu ile modal kapat */
  useEffect(() => {
    const escKapat = (e) => {
      if (e.key === "Escape") {
        setDetayModal(null);
        setDuzenleModal(null);
        setTopluSilOnay(false);
        setSilOnay(null);
        setNotModal(null);
        setEtiketDropdownAcik(false);
      }
    };
    window.addEventListener("keydown", escKapat);
    return () => window.removeEventListener("keydown", escKapat);
  }, []);

  /* Etiket dropdown dışına tıklanınca kapat */
  useEffect(() => {
    const disariTiklama = (e) => {
      if (etiketDropdownRef.current && !etiketDropdownRef.current.contains(e.target)) {
        setEtiketDropdownAcik(false);
      }
    };
    if (etiketDropdownAcik) {
      document.addEventListener("mousedown", disariTiklama);
    }
    return () => document.removeEventListener("mousedown", disariTiklama);
  }, [etiketDropdownAcik]);

  /* Detay modalı açıldığında dosyaları yükle */
  useEffect(() => {
    if (detayModal) {
      setDetayDosyalarYukleniyor(true);
      apiGet(`/bayiler/${detayModal.id}/dosyalar`)
        .then((res) => setDetayDosyalar(res.veri || []))
        .catch(() => setDetayDosyalar([]))
        .finally(() => setDetayDosyalarYukleniyor(false));
    } else {
      setDetayDosyalar([]);
    }
  }, [detayModal]);

  /* Not modalı açıldığında notları yükle */
  useEffect(() => {
    if (notModal) {
      apiGet(`/bayiler/${notModal.id}/notlar`)
        .then((res) => setBayiNotlar(res.veri || []))
        .catch(() => setBayiNotlar([]));
    } else {
      setBayiNotlar([]);
    }
  }, [notModal]);

  /* ---- Tüm benzersiz etiketler ---- */
  const tumEtiketler = useMemo(() => {
    const set = new Set();
    bayiler.forEach((b) => {
      if (Array.isArray(b.etiketler)) {
        b.etiketler.forEach((e) => set.add(e));
      }
    });
    return [...set].sort();
  }, [bayiler]);

  /* ---- Etiket filtresi toggle ---- */
  const etiketFiltresiToggle = (etiket) => {
    setEtiketFiltresi((prev) => {
      const yeni = new Set(prev);
      if (yeni.has(etiket)) {
        yeni.delete(etiket);
      } else {
        yeni.add(etiket);
      }
      return yeni;
    });
    setAktifSayfa(1);
  };

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
  const [duzenleModal, setDuzenleModal] = useState(null);

  /* Kart Filtreleme + Etiket Filtresi */
  const filtreliBayiler = bayiler.filter((b) => {
    const aramaUygun = b.ad.toLowerCase().includes(arama.toLowerCase()) || (b.sektor || "").toLowerCase().includes(arama.toLowerCase());
    if (!aramaUygun) return false;
    
    /* Etiket filtresi */
    if (etiketFiltresi.size > 0) {
      const bayiEtiketleri = Array.isArray(b.etiketler) ? b.etiketler : [];
      const eslesme = [...etiketFiltresi].some((e) => bayiEtiketleri.includes(e));
      if (!eslesme) return false;
    }
    
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
      case "sektor": dA = a.sektor.toLowerCase(); dB = b.sektor.toLowerCase(); break;
      case "durum": dA = a.durum; dB = b.durum; break;
      case "tur": dA = a.ustBayiId ? "alt" : "ana"; dB = b.ustBayiId ? "alt" : "ana"; break;
      default: return 0;
    }
    if (dA < dB) return siralamaYonu === "asc" ? -1 : 1;
    if (dA > dB) return siralamaYonu === "asc" ? 1 : -1;
    return 0;
  });

  /* ---- Sayfalama Hesaplaması ---- */
  const toplamSayfa = Math.max(1, Math.ceil(siraliBayiler.length / sayfaBoyutu));
  const sayfalananlar = siraliBayiler.slice(
    (aktifSayfa - 1) * sayfaBoyutu,
    aktifSayfa * sayfaBoyutu
  );

  /* ---- Toplu İşlem Yardımcıları ---- */
  const tekSecimToggle = (id) => {
    const yeni = new Set(seciliIdler);
    if (yeni.has(id)) yeni.delete(id);
    else yeni.add(id);
    setSeciliIdler(yeni);
  };

  const tumunuSec = () => {
    if (seciliIdler.size === sayfalananlar.length && sayfalananlar.every((b) => seciliIdler.has(b.id))) {
      setSeciliIdler(new Set());
    } else {
      setSeciliIdler(new Set(sayfalananlar.map((b) => b.id)));
    }
  };

  const hepsiSecili = sayfalananlar.length > 0 && sayfalananlar.every((b) => seciliIdler.has(b.id));

  /* ---- Toplu Silme (Çöp Kutusuna Gönder) ---- */
  const topluSilIslem = async () => {
    const silinecekler = bayiler.filter((b) => seciliIdler.has(b.id));
    for (const bayi of silinecekler) {
      try {
        await apiDelete(`/bayiler/${bayi.id}`);
      } catch (e) {
        console.error("Bayi silinemedi:", bayi.id, e);
      }
    }
    setSeciliIdler(new Set());
    setTopluSilOnay(false);
    bayileriYukle();
  };

  /* ---- Toplu Durum Değiştir ---- */
  const topluDurumIslem = async (yeniDurum) => {
    const hedefler = bayiler.filter((b) => seciliIdler.has(b.id));
    for (const bayi of hedefler) {
      try {
        await apiPut(`/bayiler/${bayi.id}`, { durum: yeniDurum });
      } catch (e) {
        console.error("Bayi durumu guncellenemedi:", bayi.id, e);
      }
    }
    setSeciliIdler(new Set());
    bayileriYukle();
  };

  /* ---- Tekil Silme (Çöp Kutusuna Gönder) ---- */
  const bayiSilIslem = async (bayi) => {
    try {
      await apiDelete(`/bayiler/${bayi.id}`);
      seciliIdler.delete(bayi.id);
      setSeciliIdler(new Set(seciliIdler));
      setSilOnay(null);
      bayileriYukle();
    } catch (e) {
      console.error("Bayi silinemedi:", bayi.id, e);
    }
  };

  /* ---- CSV Dışa Aktar ---- */
  const topluDisaAktar = () => {
    const secililer = bayiler.filter((b) => seciliIdler.has(b.id));
    const basliklar = ["Ad", "Türü", "Yetkili", "E-posta", "Telefon", "Durum"];
    const satirlar = secililer.map((b) => [
      b.ad,
      bayiTuruBelirle(b),
      b.yetkili || "",
      b.eposta || "",
      b.telefon || "",
      b.durum || "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = "\uFEFF" + [basliklar.join(","), ...satirlar].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bayiler_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- Not Ekleme (Liste Üzerinden) ---- */
  const bayiNotEkle = async () => {
    if (!yeniNot.trim() || !notModal) return;
    try {
      await apiPost(`/bayiler/${notModal.id}/notlar`, { metin: yeniNot.trim(), onemli: yeniNotOnemli });
      const res = await apiGet(`/bayiler/${notModal.id}/notlar`);
      setBayiNotlar(res.veri || []);
      setYeniNot("");
      setYeniNotOnemli(false);
    } catch (e) {
      console.error("Not eklenemedi:", e);
    }
  };

  /* ---- Not Silme ---- */
  const bayiNotSil = async (notId) => {
    try {
      await apiDelete(`/bayiler/notlar/${notId}`);
      setBayiNotlar((prev) => prev.filter((n) => n.id !== notId));
    } catch (e) {
      console.error("Not silinemedi:", e);
    }
  };

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
      sektorId: duzenleModal.sektorId || "",
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
        sektorId: bayi.sektorId || "",
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
        sektorId: form.sektorId || null,
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
        sektor_id: guncellenen.sektorId || null,
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
                  <label className={LABEL_STIL}>Sektör</label>
                  <input type="text" value={form.sektor} onChange={(e) => guncelle("sektor", e.target.value)} className={INPUT_STIL} />
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
      <BayiDuzenleModal />

      {/* ---- Toplu Silme Onay Modalı ---- */}
      {topluSilOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setTopluSilOnay(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Toplu Silme Onayı</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Seçili <span className="font-semibold text-gray-700 dark:text-white">{seciliIdler.size} bayi</span> çöp kutusuna taşınacaktır.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setTopluSilOnay(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">İptal</button>
              <button onClick={topluSilIslem}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                {seciliIdler.size} Bayi Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Tekil Silme Onay Modalı ---- */}
      {silOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSilOnay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bayi Silinecek</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                <span className="font-semibold text-gray-700 dark:text-white">"{silOnay.ad}"</span> adlı bayi çöp kutusuna taşınacaktır.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setSilOnay(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">İptal</button>
              <button onClick={() => bayiSilIslem(silOnay)}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Başlık */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bayiler</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Bayi ağınızı görüntüleyin ve yönetin.</p>
        </div>
        <button onClick={() => git("/dashboard/bayi-ekle")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-600/25 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Bayi Ekle
        </button>
      </div>

      {/* Arama + Etiket Filtresi + Görünüm */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Bayi adı veya sektör ile arayın..." value={arama} onChange={(e) => { setArama(e.target.value); setAktifSayfa(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
        </div>
        
        {/* Etiket Filtresi */}
        {tumEtiketler.length > 0 && (
          <div className="relative" ref={etiketDropdownRef}>
            <button type="button" onClick={() => setEtiketDropdownAcik(!etiketDropdownAcik)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                etiketFiltresi.size > 0
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10"
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Etiketler
              {etiketFiltresi.size > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs">{etiketFiltresi.size}</span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${etiketDropdownAcik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {etiketDropdownAcik && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-30 p-2 max-h-64 overflow-y-auto">
                <input type="text" placeholder="Etiket ara..." value={etiketArama} onChange={(e) => setEtiketArama(e.target.value)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                {etiketFiltresi.size > 0 && (
                  <button type="button" onClick={() => setEtiketFiltresi(new Set())}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer mb-1">
                    Filtreyi Temizle
                  </button>
                )}
                {tumEtiketler.filter((e) => !etiketArama || e.toLowerCase().includes(etiketArama.toLowerCase())).map((etiket) => (
                  <label key={etiket} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" checked={etiketFiltresi.has(etiket)} onChange={() => etiketFiltresiToggle(etiket)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">{etiket}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        
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

      {/* ---- Toplu İşlem Barı ---- */}
      {seciliIdler.size > 0 && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{seciliIdler.size} bayi seçildi</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400/80">Toplu işlem yapmak için bir aksiyon seçin</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Aktif Yap */}
              <button onClick={() => topluDurumIslem("aktif")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Aktif Yap
              </button>
              {/* Pasif Yap */}
              <button onClick={() => topluDurumIslem("pasif")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                Pasif Yap
              </button>
              {/* CSV Dışa Aktar */}
              <button onClick={topluDisaAktar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                CSV İndir
              </button>
              {/* Toplu Sil */}
              <button onClick={() => setTopluSilOnay(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Toplu Sil
              </button>
              {/* Seçimi Temizle */}
              <button onClick={() => setSeciliIdler(new Set())}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Seçimi Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tablo Görünümü */}
      {aktifGorunum === "tablo" && (
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="px-4 py-4 w-12">
                    <input type="checkbox" checked={hepsiSecili} onChange={tumunuSec}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  </th>
                  <th onClick={() => siralamaToggle("ad")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Bayi Adı<SiralamaIkon alan="ad" /></span></th>
                  <th onClick={() => siralamaToggle("tur")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Türü<SiralamaIkon alan="tur" /></span></th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Üst Bayi</th>
                  <th onClick={() => siralamaToggle("sehir")} className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center">Şehir<SiralamaIkon alan="sehir" /></span></th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Telefon</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Etiketler</th>
                  <th onClick={() => siralamaToggle("durum")} className="text-center px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"><span className="inline-flex items-center justify-center">Durum<SiralamaIkon alan="durum" /></span></th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sayfalananlar.length > 0 ? sayfalananlar.map((bayi) => (
                  <tr key={bayi.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${seciliIdler.has(bayi.id) ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""} ${bayi.durum !== "aktif" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={seciliIdler.has(bayi.id)} onChange={() => tekSecimToggle(bayi.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                    </td>
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
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400 whitespace-nowrap">
                      <span className="inline-flex items-center group">
                        {bayi.telefon || (bayi.telefonlar && bayi.telefonlar[0]) || "—"}
                        <KopyalaButonu metin={bayi.telefon || (bayi.telefonlar && bayi.telefonlar[0])} />
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Array.isArray(bayi.etiketler) && bayi.etiketler.length > 0 ? (
                          bayi.etiketler.map((etiket, idx) => (
                            <span key={idx} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                              {etiket}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${bayi.durum === "aktif" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bayi.durum === "aktif" ? "bg-emerald-500" : "bg-gray-400 dark:bg-slate-500"}`} />
                        {bayi.durum === "aktif" ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => git(`/dashboard/bayi/${bayi.id}`)} title="Detay Görüntüle"
                          className="w-8 h-8 rounded-lg bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center cursor-pointer transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => setDuzenleModal(bayi)} title="Düzenle"
                          className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => { setNotModal(bayi); setYeniNot(""); setYeniNotOnemli(false); }} title="Notlar"
                          className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center cursor-pointer transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        </button>
                        <button onClick={() => setSilOnay(bayi)} title="Sil"
                          className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                      {arama || kartFiltre ? `"${arama}" ile eşleşen bayi bulunamadı.` : "Henüz bayi kaydı bulunmamaktadır."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <select value={sayfaBoyutu} onChange={(e) => { setSayfaBoyutu(Number(e.target.value)); setAktifSayfa(1); }}
                  className="px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm cursor-pointer">
                  {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>kayıt göster</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                — Toplam {siraliBayiler.length} kayıttan {Math.min((aktifSayfa - 1) * sayfaBoyutu + 1, siraliBayiler.length)}-{Math.min(aktifSayfa * sayfaBoyutu, siraliBayiler.length)} arası
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setAktifSayfa((o) => Math.max(1, o - 1))} disabled={aktifSayfa === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Önceki</button>
              {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
                <button key={s} onClick={() => setAktifSayfa(s)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${aktifSayfa === s ? "bg-emerald-600 text-white" : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}>{s}</button>
              ))}
              <button onClick={() => setAktifSayfa((o) => Math.min(toplamSayfa, o + 1))} disabled={aktifSayfa === toplamSayfa}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer">Sonraki</button>
            </div>
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

      {/* ---- Bayi Detay Modalı ---- */}
      {detayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Başlık */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{detayModal.ad}</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{detayModal.tur === "gercek" ? "Gerçek Kişi" : detayModal.tur === "tuzel" ? "Tüzel Kişi" : "Yabancı"}</p>
                </div>
              </div>
              <button onClick={() => setDetayModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Durum */}
              <div className="flex justify-end">
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                  detayModal.durum === "aktif" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${detayModal.durum === "aktif" ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {detayModal.durum === "aktif" ? "Aktif" : "Pasif"}
                </span>
              </div>

              {/* Temel Bilgiler */}
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Temel Bilgiler</p>
                <div className="space-y-3">
                  {detayModal.yetkili && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Yetkili</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.yetkili}</p></div>
                      <KopyalaButonu metin={detayModal.yetkili} />
                    </div>
                  )}
                  {detayModal.sektor && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Sektör</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.sektor}</p></div>
                    </div>
                  )}
                  {detayModal.ustBayiId && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Üst Bayi</p><p className="text-sm text-gray-900 dark:text-white font-medium">{ustBayiAdiBul(detayModal.ustBayiId)}</p></div>
                    </div>
                  )}
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">İletişim</p>
                <div className="space-y-3">
                  {detayModal.telefon && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">Telefon</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.telefon}</p></div>
                      <KopyalaButonu metin={detayModal.telefon} />
                    </div>
                  )}
                  {detayModal.eposta && (
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-400 dark:text-slate-500">E-posta</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.eposta}</p></div>
                      <KopyalaButonu metin={detayModal.eposta} />
                    </div>
                  )}
                </div>
              </div>

              {/* Vergi Bilgileri */}
              {(detayModal.vergiNo || detayModal.vergiDairesi || detayModal.tcKimlikNo || detayModal.pasaportNo) && (
                <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Vergi / Kimlik</p>
                  <div className="space-y-3">
                    {detayModal.vergiNo && (
                      <div className="flex items-center justify-between">
                        <div><p className="text-xs text-gray-400 dark:text-slate-500">Vergi No</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.vergiNo}</p></div>
                        <KopyalaButonu metin={detayModal.vergiNo} />
                      </div>
                    )}
                    {detayModal.vergiDairesi && (
                      <div className="flex items-center justify-between">
                        <div><p className="text-xs text-gray-400 dark:text-slate-500">Vergi Dairesi</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.vergiDairesi}</p></div>
                      </div>
                    )}
                    {detayModal.tcKimlikNo && (
                      <div className="flex items-center justify-between">
                        <div><p className="text-xs text-gray-400 dark:text-slate-500">TC Kimlik No</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.tcKimlikNo}</p></div>
                        <KopyalaButonu metin={detayModal.tcKimlikNo} />
                      </div>
                    )}
                    {detayModal.pasaportNo && (
                      <div className="flex items-center justify-between">
                        <div><p className="text-xs text-gray-400 dark:text-slate-500">Pasaport No</p><p className="text-sm text-gray-900 dark:text-white font-medium">{detayModal.pasaportNo}</p></div>
                        <KopyalaButonu metin={detayModal.pasaportNo} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Etiketler */}
              {Array.isArray(detayModal.etiketler) && detayModal.etiketler.length > 0 && (
                <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Etiketler</p>
                  <div className="flex flex-wrap gap-2">
                    {detayModal.etiketler.map((etiket, idx) => (
                      <span key={idx} className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        {etiket}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dosyalar */}
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Dosyalar</p>
                {detayDosyalarYukleniyor ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-3">Yükleniyor...</p>
                ) : detayDosyalar.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-3">Dosya bulunmamaktadır.</p>
                ) : (
                  <div className="space-y-2">
                    {detayDosyalar.map((dosya) => (
                      <div key={dosya.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{dosya.orijinal_ad}</span>
                        </div>
                        <a href={`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/uploads/${dosya.dosya_adi}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 ml-2">İndir</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Düzenle Butonu */}
              <div className="pt-2">
                <button onClick={() => { setDetayModal(null); setDuzenleModal(detayModal); }}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer">
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Not Modalı ---- */}
      {notModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setNotModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Başlık */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notlar</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{notModal.ad}</p>
              </div>
              <button onClick={() => setNotModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer text-gray-500 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Yeni Not Ekle */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
              <textarea value={yeniNot} onChange={(e) => setYeniNot(e.target.value)} rows={2}
                placeholder="Yeni not yazın..."
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none" />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked={yeniNotOnemli} onChange={(e) => setYeniNotOnemli(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-white/20 text-amber-500 focus:ring-amber-500 cursor-pointer" />
                  Önemli olarak işaretle
                </label>
                <button onClick={bayiNotEkle}
                  disabled={!yeniNot.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors">
                  Ekle
                </button>
              </div>
            </div>
            {/* Not Listesi */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {bayiNotlar.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-slate-500 py-6 text-sm">Henüz not eklenmemiş.</p>
              ) : (
                bayiNotlar.sort((a, b) => new Date(b.olusturma_tarihi || b.tarih) - new Date(a.olusturma_tarihi || a.tarih)).map((n) => (
                  <div key={n.id} className={`p-3 rounded-lg border ${
                    n.onemli
                      ? "border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5"
                      : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-800 dark:text-slate-200 flex-1">
                        {n.onemli ? <span className="text-amber-500 mr-1">★</span> : null}
                        {n.metin}
                      </p>
                      <button onClick={() => bayiNotSil(n.id)} title="Notu Sil" className="shrink-0 w-6 h-6 rounded hover:bg-red-100 dark:hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{new Date(n.olusturma_tarihi || n.tarih).toLocaleString("tr-TR")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
