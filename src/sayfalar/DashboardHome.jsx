/* ============================================= */
/*  Güzel Teknoloji - Dashboard Ana Sayfa (Özet) */
/*  Genel bakış kartları, grafikler (recharts),  */
/*  hızlı aksiyonlar ve son işlemler tablosu     */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../yardimcilar/api";

/* ---- Sayı Sayma Animasyonu Hook'u ---- */
function useCountUp(hedef, sure = 1200) {
  const [deger, setDeger] = useState(0);
  const ref = useRef(null);
  const basladi = useRef(false);

  useEffect(() => {
    const gozlemci = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !basladi.current) {
          basladi.current = true;
          const sayi = typeof hedef === "string" ? parseInt(hedef.replace(/\D/g, ""), 10) : hedef;
          if (isNaN(sayi) || sayi === 0) { setDeger(sayi || 0); return; }
          const baslangicZamani = performance.now();
          const animasyon = (simdikiZaman) => {
            const gecen = simdikiZaman - baslangicZamani;
            const ilerleme = Math.min(gecen / sure, 1);
            // easeOutExpo
            const kolay = ilerleme === 1 ? 1 : 1 - Math.pow(2, -10 * ilerleme);
            setDeger(Math.round(kolay * sayi));
            if (ilerleme < 1) requestAnimationFrame(animasyon);
          };
          requestAnimationFrame(animasyon);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) gozlemci.observe(ref.current);
    return () => gozlemci.disconnect();
  }, [hedef, sure]);

  return { deger, ref };
}

/* ---- Animasyonlu Sayı Bileşeni ---- */
function AnimasyonluSayi({ hedef, className }) {
  const { deger, ref } = useCountUp(hedef);
  return <span ref={ref} className={className}>{deger.toLocaleString("tr-TR")}</span>;
}
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ============================================= */
/*  Sabitler                                       */
/* ============================================= */
const PIE_RENKLERI = ["#3b82f6", "#10b981", "#f59e0b"];

/* ============================================= */
/*  Yardımcı: Tooltip özelleştirme                */
/* ============================================= */

function GrafikTooltip({ active, payload, label, tur }) {
  if (!active || !payload?.length) return null;
  const etiket = tur === "bayiler" ? "bayi" : "müşteri";
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
      <p className="text-blue-600 dark:text-blue-400">{payload[0].value} {etiket}</p>
    </div>
  );
}

function PastaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{payload[0].name}</p>
      <p className="text-gray-600 dark:text-slate-300">{payload[0].value} müşteri</p>
    </div>
  );
}

/* ============================================= */
/*  Ana Bileşen                                    */
/* ============================================= */

/* ---- Dashboard Bölüm Tanımları ---- */
const VARSAYILAN_BOLUMLER = [
  { id: "kartlar",    baslik: "Özet Kartları",    ikon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  { id: "grafikler",  baslik: "Grafikler",        ikon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "yaklasanlar", baslik: "Yaklaşan Bitişler", ikon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "islemler",   baslik: "Son İşlemler",     ikon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

function ayarlariOku() {
  try {
    const kayitli = localStorage.getItem("gt_dashboard_ayar");
    if (kayitli) {
      const parsed = JSON.parse(kayitli);
      // Validate
      if (Array.isArray(parsed) && parsed.length === VARSAYILAN_BOLUMLER.length && parsed.every((b) => b.id && typeof b.gorunur === "boolean")) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return VARSAYILAN_BOLUMLER.map((b) => ({ id: b.id, gorunur: true }));
}

export default function DashboardHome() {
  const navigate = useNavigate();

  /** Yaklaşan lisanslar gün aralığı */
  const [yaklasanGun, setYaklasanGun] = useState(30);
  
  /** Son işlemler sekmesi (müşteriler / lisanslar) */
  const [sonIslemSekme, setSonIslemSekme] = useState("musteriler");
  
  /** Grafik türü seçimi (musteriler / bayiler) */
  const [grafikTuru, setGrafikTuru] = useState("musteriler");

  /* ---- API Verileri ---- */
  const [ozetVerisi, setOzetVerisi] = useState({ toplamMusteri: 0, aktifBayi: 0, toplamBayi: 0, aktifLisans: 0, pasifLisans: 0, suresizLisans: 0, toplamUrun: 0, aylikGelir: 0, buAyBitenLisans: 0 });
  const [aylikMusteriler, setAylikMusteriler] = useState([]);
  const [aylikBayiler, setAylikBayiler] = useState([]);
  const [musteriDagilimi, setMusteriDagilimi] = useState([]);
  const [sonMusteriler, setSonMusteriler] = useState([]);
  const [sonLisanslar, setSonLisanslar] = useState([]);
  const [yaklasanLisanslar, setYaklasanLisanslar] = useState([]);

  useEffect(() => {
    const verileriYukle = async () => {
      try {
        const [ozetRes, aylikMusteriRes, aylikBayiRes, dagilimRes, musteriRes, lisansRes, yaklasanRes] = await Promise.allSettled([
          apiGet("/dashboard/ozet"),
          apiGet("/dashboard/aylik-musteriler"),
          apiGet("/dashboard/aylik-bayiler"),
          apiGet("/dashboard/musteri-dagilimi"),
          apiGet("/dashboard/son-musteriler"),
          apiGet("/dashboard/son-lisanslar"),
          apiGet("/dashboard/yaklasan-lisanslar"),
        ]);
        if (ozetRes.status === "fulfilled" && ozetRes.value?.veri) setOzetVerisi(ozetRes.value.veri);
        if (aylikMusteriRes.status === "fulfilled" && aylikMusteriRes.value?.veri) setAylikMusteriler(aylikMusteriRes.value.veri);
        if (aylikBayiRes.status === "fulfilled" && aylikBayiRes.value?.veri) setAylikBayiler(aylikBayiRes.value.veri);
        if (dagilimRes.status === "fulfilled" && dagilimRes.value?.veri) setMusteriDagilimi(dagilimRes.value.veri);
        if (musteriRes.status === "fulfilled" && musteriRes.value?.veri) setSonMusteriler(musteriRes.value.veri);
        if (lisansRes.status === "fulfilled" && lisansRes.value?.veri) setSonLisanslar(lisansRes.value.veri);
        if (yaklasanRes.status === "fulfilled" && yaklasanRes.value?.veri) setYaklasanLisanslar(yaklasanRes.value.veri);
      } catch (e) {
        console.error("Dashboard verileri yuklenemedi:", e);
      }
    };
    verileriYukle();
  }, []);

  /* Yaklaşan lisanslar - gün değiştiğinde yeniden yükle */
  useEffect(() => {
    const yukle = async () => {
      try {
        const res = await apiGet(`/dashboard/yaklasan-lisanslar?gun=${yaklasanGun}`);
        if (res.veri) setYaklasanLisanslar(res.veri);
      } catch (e) {
        console.error("Yaklaşan lisanslar yüklenemedi:", e);
      }
    };
    yukle();
  }, [yaklasanGun]);

  /* ---- Dashboard Özelleştirme ---- */
  const [bolumSirasi, setBolumSirasi] = useState(ayarlariOku);
  const [ayarPaneli, setAyarPaneli] = useState(false);

  const ayarlariKaydet = (yeni) => {
    setBolumSirasi(yeni);
    localStorage.setItem("gt_dashboard_ayar", JSON.stringify(yeni));
  };

  const bolumGorunurluk = (id) => {
    const yeni = bolumSirasi.map((b) => b.id === id ? { ...b, gorunur: !b.gorunur } : b);
    ayarlariKaydet(yeni);
  };

  const bolumTasi = (idx, yon) => {
    const hedef = idx + yon;
    if (hedef < 0 || hedef >= bolumSirasi.length) return;
    const yeni = [...bolumSirasi];
    [yeni[idx], yeni[hedef]] = [yeni[hedef], yeni[idx]];
    ayarlariKaydet(yeni);
  };

  const ayarlariSifirla = () => {
    ayarlariKaydet(VARSAYILAN_BOLUMLER.map((b) => ({ id: b.id, gorunur: true })));
  };

  const bolumGorunurMu = (id) => bolumSirasi.find((b) => b.id === id)?.gorunur !== false;

  /* ---- Tüm Özet Kart Tanımları ---- */
  const TUMU_KARTLAR = [
    {
      id: "toplamMusteri",
      baslik: "Toplam Müşteri",
      deger: String(ozetVerisi.toplamMusteri),
      degisim: "Toplam kayıtlı",
      degisimPositif: true,
      renk: "from-blue-600 to-blue-400",
      ikonBg: "bg-blue-100 dark:bg-blue-500/20",
      ikonRenk: "text-blue-600 dark:text-blue-400",
      yol: "/dashboard/musteriler",
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
    {
      id: "aktifBayi",
      baslik: "Toplam Aktif Bayi",
      deger: String(ozetVerisi.aktifBayi),
      degisim: "Aktif bayiler",
      degisimPositif: true,
      renk: "from-emerald-600 to-emerald-400",
      ikonBg: "bg-emerald-100 dark:bg-emerald-500/20",
      ikonRenk: "text-emerald-600 dark:text-emerald-400",
      yol: "/dashboard/bayiler",
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
    },
    {
      id: "aktifLisans",
      baslik: "Toplam Aktif Lisans",
      deger: String(ozetVerisi.aktifLisans),
      degisim: "Aktif lisanslar",
      degisimPositif: true,
      renk: "from-violet-600 to-violet-400",
      ikonBg: "bg-violet-100 dark:bg-violet-500/20",
      ikonRenk: "text-violet-600 dark:text-violet-400",
      yol: null,
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
      ),
    },
    {
      id: "buAyBitenLisans",
      baslik: "Bu Ay Biten Lisanslar",
      deger: String(ozetVerisi.buAyBitenLisans),
      degisim: "Acil yenileme gerekli",
      degisimPositif: false,
      renk: "from-red-600 to-red-400",
      ikonBg: "bg-red-100 dark:bg-red-500/20",
      ikonRenk: "text-red-600 dark:text-red-400",
      yol: null,
      vurgulu: true,
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      ),
    },
    {
      id: "toplamBayi",
      baslik: "Toplam Bayi",
      deger: String(ozetVerisi.toplamBayi),
      degisim: "Tüm bayiler",
      degisimPositif: true,
      renk: "from-teal-600 to-teal-400",
      ikonBg: "bg-teal-100 dark:bg-teal-500/20",
      ikonRenk: "text-teal-600 dark:text-teal-400",
      yol: "/dashboard/bayiler",
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
      ),
    },
    {
      id: "toplamUrun",
      baslik: "Toplam Ürün",
      deger: String(ozetVerisi.toplamUrun),
      degisim: "Aktif ürünler",
      degisimPositif: true,
      renk: "from-cyan-600 to-cyan-400",
      ikonBg: "bg-cyan-100 dark:bg-cyan-500/20",
      ikonRenk: "text-cyan-600 dark:text-cyan-400",
      yol: null,
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
    },
    {
      id: "aylikGelir",
      baslik: "Bu Ay Gelir",
      deger: String(ozetVerisi.aylikGelir),
      degisim: "Bu ayki gelir",
      degisimPositif: true,
      renk: "from-amber-600 to-amber-400",
      ikonBg: "bg-amber-100 dark:bg-amber-500/20",
      ikonRenk: "text-amber-600 dark:text-amber-400",
      yol: null,
      paraFormatli: true,
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      id: "pasifLisans",
      baslik: "Pasif Lisanslar",
      deger: String(ozetVerisi.pasifLisans),
      degisim: "Pasif/İptal lisanslar",
      degisimPositif: false,
      renk: "from-gray-600 to-gray-400",
      ikonBg: "bg-gray-100 dark:bg-gray-500/20",
      ikonRenk: "text-gray-600 dark:text-gray-400",
      yol: null,
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
    {
      id: "suresizLisans",
      baslik: "Süresiz Lisanslar",
      deger: String(ozetVerisi.suresizLisans),
      degisim: "Süresiz aktif lisanslar",
      degisimPositif: true,
      renk: "from-indigo-600 to-indigo-400",
      ikonBg: "bg-indigo-100 dark:bg-indigo-500/20",
      ikonRenk: "text-indigo-600 dark:text-indigo-400",
      yol: null,
      ikon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
      ),
    },
  ];

  /* ---- Kart Seçimi (localStorage) ---- */
  const VARSAYILAN_KARTLAR = ["toplamMusteri", "aktifBayi", "aktifLisans", "buAyBitenLisans"];

  function kartSeciminiOku() {
    try {
      const kayitli = localStorage.getItem("gt_dashboard_kartlar");
      if (kayitli) {
        const parsed = JSON.parse(kayitli);
        if (Array.isArray(parsed) && parsed.length <= 4 && parsed.every((k) => typeof k === "string")) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return VARSAYILAN_KARTLAR;
  }

  const [seciliKartlar, setSeciliKartlar] = useState(kartSeciminiOku);
  const [kartAyarPaneli, setKartAyarPaneli] = useState(false);

  const kartSeciminiKaydet = (yeni) => {
    setSeciliKartlar(yeni);
    localStorage.setItem("gt_dashboard_kartlar", JSON.stringify(yeni));
  };

  const kartToggle = (kartId) => {
    if (seciliKartlar.includes(kartId)) {
      kartSeciminiKaydet(seciliKartlar.filter((k) => k !== kartId));
    } else if (seciliKartlar.length < 4) {
      kartSeciminiKaydet([...seciliKartlar, kartId]);
    }
  };

  const kartlariSifirla = () => {
    kartSeciminiKaydet(VARSAYILAN_KARTLAR);
  };

  const ozetKartlari = TUMU_KARTLAR.filter((k) => seciliKartlar.includes(k.id))
    .sort((a, b) => seciliKartlar.indexOf(a.id) - seciliKartlar.indexOf(b.id));

  /* ---- İşlem rozetleri ---- */
  const islemRozeti = (islem) => {
    const harita = {
      aktif: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      pasif: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400",
      donduruldu: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400",
      iptal: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
    };
    return harita[islem] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400";
  };

  const turRozeti = (tur) => {
    const harita = {
      tuzel: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
      gercek: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      yabanci: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
    return harita[tur] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400";
  };

  const turEtiketi = (tur) => {
    const harita = { tuzel: "Tüzel", gercek: "Gerçek", yabanci: "Yabancı" };
    return harita[tur] || tur;
  };

  const islemEtiketi = (islem) => {
    const harita = { aktif: "Aktif", pasif: "Pasif", donduruldu: "Donduruldu", iptal: "İptal" };
    return harita[islem] || islem;
  };

  const kalanGunRozeti = (gun) => {
    if (gun <= 3) return "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400";
    if (gun <= 7) return "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";
    return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
  };

  /* ---- Render ---- */
  return (
    <div className="space-y-6">
      {/* =========== BAŞLIK =========== */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Genel Özet</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Hoş geldiniz! İşte bugünkü genel durumunuz.
          </p>
        </div>

        {/* Yenile + Özelleştirme butonları */}
        <div className="flex items-center gap-2">
          {/* Yenile butonu */}
          <button
            onClick={() => window.location.reload()}
            className="w-9 h-9 rounded-lg border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500/30 flex items-center justify-center cursor-pointer transition-all duration-200"
            title="Sayfayı Yenile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Özelleştirme butonu */}
          <div className="relative">
          <button
            onClick={() => setAyarPaneli(!ayarPaneli)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-200 ${
              ayarPaneli
                ? "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30 text-violet-600 dark:text-violet-400"
                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/20"
            }`}
            title="Dashboard Özelleştir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Ayar Paneli */}
          {ayarPaneli && (
            <div className="absolute right-0 top-11 z-40 w-80 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Dashboard Özelleştir</p>
                <button onClick={() => { ayarlariSifirla(); kartlariSifirla(); }} className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline cursor-pointer font-medium">Tümünü Sıfırla</button>
              </div>

              {/* Bölüm Sıralaması */}
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bölümler</p>
              </div>
              <div className="p-2 space-y-1">
                {bolumSirasi.map((b, idx) => {
                  const tanim = VARSAYILAN_BOLUMLER.find((v) => v.id === b.id);
                  if (!tanim) return null;
                  return (
                    <div key={b.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors ${b.gorunur ? "bg-gray-50 dark:bg-white/[0.03]" : "opacity-50"}`}>
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => bolumTasi(idx, -1)} disabled={idx === 0}
                          className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => bolumTasi(idx, 1)} disabled={idx === bolumSirasi.length - 1}
                          className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tanim.ikon} />
                      </svg>
                      <span className="flex-1 text-sm text-gray-700 dark:text-slate-300 font-medium">{tanim.baslik}</span>
                      <button onClick={() => bolumGorunurluk(b.id)}
                        className={`w-9 h-5 rounded-full relative transition-colors duration-200 cursor-pointer ${
                          b.gorunur ? "bg-violet-500" : "bg-gray-300 dark:bg-white/10"
                        }`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          b.gorunur ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Kart Seçimi */}
              <div className="px-4 pt-3 pb-1 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Özet Kartları</p>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">{seciliKartlar.length}/4 seçili</span>
                </div>
              </div>
              <div className="p-2 space-y-1">
                {TUMU_KARTLAR.map((kart) => {
                  const secili = seciliKartlar.includes(kart.id);
                  const dolu = seciliKartlar.length >= 4 && !secili;
                  return (
                    <button
                      key={kart.id}
                      onClick={() => !dolu && kartToggle(kart.id)}
                      disabled={dolu}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
                        secili ? "bg-violet-50 dark:bg-violet-500/10" : dolu ? "opacity-30" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-md ${kart.ikonBg} flex items-center justify-center ${kart.ikonRenk}`}>
                        <div className="w-4 h-4">{kart.ikon}</div>
                      </div>
                      <span className="flex-1 text-sm text-gray-700 dark:text-slate-300 font-medium text-left">{kart.baslik}</span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        secili ? "bg-violet-500 border-violet-500" : "border-gray-300 dark:border-white/20"
                      }`}>
                        {secili && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="px-4 py-2.5 border-t border-gray-200 dark:border-white/10">
                <p className="text-[11px] text-gray-400 dark:text-slate-500">Bölümleri sıralayın/gizleyin. Kartlardan en fazla 4 adet seçin.</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* =========== BÖLÜMLERİ SIRAYA GÖRE RENDER ET =========== */}
      {bolumSirasi.map((b) => {
        if (!b.gorunur) return null;
        switch (b.id) {
          case "kartlar": return (
            <div key="kartlar" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {ozetKartlari.map((kart, idx) => (
          <div
            key={kart.baslik}
            onClick={() => kart.yol && navigate(kart.yol)}
            style={{ animationDelay: `${idx * 120}ms` }}
            className={`group relative overflow-hidden rounded-xl bg-white dark:bg-white/5 p-5
              transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]
              animate-[kartGir_0.6s_ease-out_both]
              ${kart.yol ? "cursor-pointer" : ""}
              ${
              kart.vurgulu
                ? "border-2 border-red-300 dark:border-red-500/40 ring-1 ring-red-200 dark:ring-red-500/20"
                : "border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            }`}
          >
            {/* Arka plan süs dairesi */}
            <div
              className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-linear-to-br ${kart.renk} opacity-10 group-hover:opacity-25 transition-all duration-500 group-hover:scale-125`}
            />

            {/* Alt çizgi gradyan */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r ${kart.renk} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="flex items-start justify-between relative">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {kart.baslik}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {kart.paraFormatli && "₺"}<AnimasyonluSayi hedef={kart.deger} />
                </p>
                <p
                  className={`text-xs font-medium ${
                    kart.degisimPositif
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {kart.degisim}
                </p>
              </div>

              {/* İkon */}
              <div className={`shrink-0 w-11 h-11 rounded-lg ${kart.ikonBg} flex items-center justify-center ${kart.ikonRenk} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {kart.ikon}
              </div>
            </div>
          </div>
        ))}
      </div>
          ); case "grafikler": return (
            <div key="grafikler" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ---- Bar Chart: Aylara Göre Müşteriler/Bayiler ---- */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Aylara Göre {grafikTuru === "musteriler" ? "Müşteriler" : "Bayiler"}
            </h2>
            {/* Seçim Dropdown */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-white/5 p-0.5">
              <button
                onClick={() => setGrafikTuru("musteriler")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  grafikTuru === "musteriler"
                    ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                }`}
              >
                Müşteriler
              </button>
              <button
                onClick={() => setGrafikTuru("bayiler")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  grafikTuru === "bayiler"
                    ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                }`}
              >
                Bayiler
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={grafikTuru === "musteriler" ? aylikMusteriler : aylikBayiler} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" />
                <XAxis
                  dataKey="ay"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-gray-500 dark:text-slate-400"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-gray-500 dark:text-slate-400"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<GrafikTooltip tur={grafikTuru} />} cursor={{ fill: "rgba(59,130,246,0.08)" }} />
                <Bar dataKey="sayi" fill={grafikTuru === "musteriler" ? "#3b82f6" : "#10b981"} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---- Pie Chart: Müşteri Dağılımı ---- */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Müşteri Dağılımı
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={musteriDagilimi}
                  dataKey="deger"
                  nameKey="ad"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {musteriDagilimi.map((_, i) => (
                    <Cell key={i} fill={PIE_RENKLERI[i % PIE_RENKLERI.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PastaTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-gray-600 dark:text-slate-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
          ); case "yaklasanlar": return (
            <div key="yaklasanlar" className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Yaklaşan Lisans Bitişleri
            </h2>
            {yaklasanLisanslar.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                {yaklasanLisanslar.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={yaklasanGun}
              onChange={(e) => setYaklasanGun(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={30}>30 gün</option>
              <option value={60}>60 gün</option>
              <option value={90}>90 gün</option>
            </select>
            <button
              onClick={() => navigate("/dashboard/raporlar?tab=suresiYaklasanlar")}
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              Tümünü Gör →
            </button>
          </div>
        </div>
        {yaklasanLisanslar.length === 0 ? (
          <div className="py-8 text-center">
            <svg className="w-10 h-10 mx-auto text-emerald-400 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-slate-400">{yaklasanGun} gün içinde biten lisans yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Müşteri</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ürün</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bitiş Tarihi</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Kalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {yaklasanLisanslar.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">{l.musteri}</td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-slate-300">{l.urun}</td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400">
                      {l.bitis_tarihi ? new Date(l.bitis_tarihi).toLocaleDateString("tr-TR") : "-"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${kalanGunRozeti(l.kalan_gun)}`}>
                        {l.kalan_gun} gün
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
          ); case "islemler": return (
            <div key="islemler" className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
        {/* Sekme Başlıkları */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Son İşlemler</h2>
          <div className="flex rounded-lg bg-gray-100 dark:bg-white/5 p-0.5">
            <button
              onClick={() => setSonIslemSekme("musteriler")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sonIslemSekme === "musteriler"
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              Son Müşteriler
            </button>
            <button
              onClick={() => setSonIslemSekme("lisanslar")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                sonIslemSekme === "lisanslar"
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              Son Lisanslar
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          {sonIslemSekme === "musteriler" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Eklenme Tarihi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sonMusteriler.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">
                      {m.ad}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${turRozeti(m.tur)}`}>
                        {turEtiketi(m.tur)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400">{m.tarih ? new Date(m.tarih).toLocaleDateString("tr-TR") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Paket
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    İşlem
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sonLisanslar.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">
                      {l.musteri}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-slate-300">{l.paket}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${islemRozeti(l.islem)}`}>
                        {islemEtiketi(l.islem)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-slate-400">{l.tarih ? new Date(l.tarih).toLocaleDateString("tr-TR") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
          ); default: return null;
        }
      })}
    </div>
  );
}
