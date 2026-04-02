/* ============================================= */
/*  Güzel Teknoloji - Müşteri Paketleri Sayfası  */
/*  Müşteri paket listesi, arama, sayfalama,     */
/*  cihaz, lisans, fatura, ek kullanıcı yönetimi */
/*  ve gelişmiş yeni paket ekleme modalı         */
/* ============================================= */

import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMusteriler } from "../baglam/MusteriContext";
import { apiGet, apiPost } from "../yardimcilar/api";
import KopyalaButonu from "../bilesenler/KopyalaButonu";

/* ---- Stil Sabitleri ---- */
const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";
const LABEL_STIL = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

/* ---- Sabit Değerler ---- */
const LISANS_TIPLERI = [
  { id: "demo", ad: "Demo", renk: "gray", gun: 30 },
  { id: "standart", ad: "Standart", renk: "blue", gun: 365 },
  { id: "profesyonel", ad: "Profesyonel", renk: "violet", gun: 365 },
  { id: "enterprise", ad: "Enterprise", renk: "emerald", gun: 730 },
];

const ODEME_YONTEMLERI = [
  { id: "nakit", ad: "Nakit" },
  { id: "havale", ad: "Havale/EFT" },
  { id: "eft", ad: "EFT" },
  { id: "kredi_karti", ad: "Kredi Kartı" },
  { id: "cek", ad: "Çek" },
  { id: "senet", ad: "Senet" },
  { id: "diger", ad: "Diğer" },
];

const ODEME_DURUMLARI = [
  { id: "odenmedi", ad: "Ödenmedi", renk: "red" },
  { id: "kismi", ad: "Kısmi Ödeme", renk: "amber" },
  { id: "odendi", ad: "Ödendi", renk: "emerald" },
];

/* ---- Yardımcı Fonksiyonlar ---- */
const tarihGosterTR = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
const suAnGecmisMi = (tarih) => {
  if (!tarih) return false;
  return new Date(tarih) < new Date();
};
const tarihEkle = (baslangic, gun) => {
  const d = new Date(baslangic);
  d.setDate(d.getDate() + gun);
  return d.toISOString().slice(0, 10);
};
const rastgeleLisansAnahtari = () => {
  const karakterler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const gruplar = [];
  for (let g = 0; g < 4; g++) {
    let grup = "";
    for (let i = 0; i < 4; i++) {
      grup += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
    }
    gruplar.push(grup);
  }
  return gruplar.join("-");
};

/* ---- Sallanma Animasyonu ---- */
const sallanmaStili = document.getElementById("sallanma-stili-paket") || (() => {
  const s = document.createElement("style");
  s.id = "sallanma-stili-paket";
  s.textContent = `@keyframes sallanma { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(5px)} 45%{transform:translateX(-4px)} 60%{transform:translateX(3px)} 75%{transform:translateX(-2px)} } .sallan { animation: sallanma 0.5s ease-in-out; }`;
  document.head.appendChild(s);
  return s;
})();

/* ============================================= */
/*  Ana Bileşen                                  */
/* ============================================= */

export default function MusteriPaketleriPage() {
  const { id } = useParams();
  const git = useNavigate();
  const { musteriler } = useMusteriler();

  /* Müşteri bul */
  const musteri = musteriler.find((m) => String(m.id) === String(id));
  const musteriAdi = (m) => m?.adSoyad || m?.sirketAdi || m?.yetkiliKisi || `Müşteri #${m?.id || id}`;

  /* Önceki / Sonraki Müşteri */
  const musteriIndex = musteriler.findIndex((m) => String(m.id) === String(id));
  const oncekiMusteri = musteriIndex > 0 ? musteriler[musteriIndex - 1] : null;
  const sonrakiMusteri = musteriIndex < musteriler.length - 1 ? musteriler[musteriIndex + 1] : null;

  /* State */
  const [paketler, setPaketler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [paketArama, setPaketArama] = useState("");
  const [paketSayfa, setPaketSayfa] = useState(1);
  const [paketBoyut, setPaketBoyut] = useState(10);

  /* Veritabanı verileri */
  const [dbUrunler, setDbUrunler] = useState([]);
  const [dbPaketler, setDbPaketler] = useState([]);
  const [dbBayiler, setDbBayiler] = useState([]);

  /* Verileri yükle */
  useEffect(() => {
    /* Lisansları yükle */
    apiGet(`/lisanslar/musteri/${id}`).then((r) => {
      if (r.basarili) {
        setPaketler(r.veri.map((l) => ({
          id: l.id,
          urun: l.urun_adi || "-",
          urunId: l.urun_id,
          paket: l.paket_adi || "-",
          paketId: l.paket_id,
          bayiAdi: l.bayi_adi || "",
          lisansTipi: l.lisans_tipi || "standart",
          domain: l.domain || "",
          faturaNo: l.fatura_no || "",
          faturaTarihi: l.fatura_tarihi ? l.fatura_tarihi.slice(0, 10) : "",
          kullanimGunu: l.kullanim_gunu || 365,
          baslangicTarihi: l.baslangic_tarihi ? l.baslangic_tarihi.slice(0, 10) : "",
          bitisTarihi: l.bitis_tarihi ? l.bitis_tarihi.slice(0, 10) : "",
          kullanici: l.kullanici_sayisi ? String(l.kullanici_sayisi) : "1",
          ekKullanici: l.ek_kullanici || 0,
          fiyat: l.fiyat ? Number(l.fiyat).toFixed(2) : "0.00",
          indirimOrani: l.indirim_orani || 0,
          netTutar: l.net_tutar ? Number(l.net_tutar).toFixed(2) : "0.00",
          odemeDurumu: l.odeme_durumu || "odenmedi",
          odemeYontemi: l.odeme_yontemi || "",
          faturaGeldi: !!l.fatura_geldi,
          lisansAnahtari: l.lisans_anahtari || "",
          otomatikYenileme: !!l.otomatik_yenileme,
          bildirimGun: l.bildirim_gun || 30,
          notlar: l.notlar || "",
        })));
      }
    }).catch(() => {}).finally(() => setYukleniyor(false));

    /* Ürünleri yükle */
    apiGet("/urunler").then((r) => {
      if (r.basarili) setDbUrunler(r.veri);
    }).catch(() => {});

    /* Paketleri yükle */
    apiGet("/urunler/paketler/tumu").then((r) => {
      if (r.basarili) {
        /* Alan isimlerini camelCase'e dönüştür (modal uyumluluğu için) */
        setDbPaketler(r.veri.map((p) => ({
          id: p.id,
          urunId: p.urun_id,
          adi: p.ad,
          tipi: p.tipi,
          kullanimGunu: p.kullanim_gunu || 365,
          fiyati: p.fiyat || 0,
          kullaniciSayisi: p.kullanici_sayisi || 1,
          aktif: p.aktif,
        })));
      }
    }).catch(() => {});

    /* Bayileri yükle */
    apiGet("/bayiler").then((r) => {
      if (r.basarili) setDbBayiler(r.veri.filter((b) => b.durum === "aktif"));
    }).catch(() => {});
  }, [id]);

  /* Sütun sırası (sürüklenebilir) */
  const [sutunSirasi, setSutunSirasi] = useState(["urun", "paket", "domain", "baslangic", "bitis", "gun", "kalan", "kullanici", "fiyat"]);
  const [suruklenenSutun, setSuruklenenSutun] = useState(null);

  /* Tablo çizgi stili: "yok" | "yatay" | "dikey" | "tam" */
  const [cizgiStil, setCizgiStil] = useState("yok");

  /* Alt modal states */
  const [cihazlarModal, setCihazlarModal] = useState(null);
  const [silOnay, setSilOnay] = useState(null);
  const [lisansKeyModal, setLisansKeyModal] = useState(null);
  const [ekKullaniciModal, setEkKullaniciModal] = useState(null);
  const [faturaModal, setFaturaModal] = useState(null);
  const [yeniPaketModal, setYeniPaketModal] = useState(false);

  /* Filtre & sayfalama */
  const filtreliPaketler = paketler.filter((p) => {
    const q = paketArama.toLowerCase();
    return p.urun.toLowerCase().includes(q) || p.paket.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
  });
  const topSayfa = Math.max(1, Math.ceil(filtreliPaketler.length / paketBoyut));
  const sayfaliPaketler = filtreliPaketler.slice((paketSayfa - 1) * paketBoyut, paketSayfa * paketBoyut);

  /* Aksiyonlar */
  const paketSil = (pid) => {
    setPaketler((o) => o.filter((p) => p.id !== pid));
    setSilOnay(null);
  };

  /* Yeni paket ekleme callback */
  const yeniPaketEklendi = (yeniLisans) => {
    /* API'den dönen veriyi listeye ekle */
    const yeni = {
      id: yeniLisans.id,
      urun: yeniLisans.urun_adi || dbUrunler.find(u => u.id === yeniLisans.urun_id)?.ad || "-",
      paket: yeniLisans.paket_adi || dbPaketler.find(p => p.id === yeniLisans.paket_id)?.ad || "-",
      domain: yeniLisans.domain || "",
      faturaNo: yeniLisans.fatura_no || "",
      kullanimGunu: yeniLisans.kullanim_gunu || 365,
      baslangicTarihi: yeniLisans.baslangic_tarihi ? yeniLisans.baslangic_tarihi.slice(0, 10) : "",
      bitisTarihi: yeniLisans.bitis_tarihi ? yeniLisans.bitis_tarihi.slice(0, 10) : "",
      kullanici: String(yeniLisans.kullanici_sayisi || 1),
      fiyat: Number(yeniLisans.fiyat || 0).toFixed(2),
      netTutar: Number(yeniLisans.net_tutar || 0).toFixed(2),
      odemeDurumu: yeniLisans.odeme_durumu || "odenmedi",
      faturaGeldi: !!yeniLisans.fatura_geldi,
      lisansAnahtari: yeniLisans.lisans_anahtari || "",
    };
    setPaketler((o) => [yeni, ...o]);
    setYeniPaketModal(false);
  };

  /* Sallanma ref */
  const modalRef = useRef(null);
  const sallanma = () => { if (modalRef.current) { modalRef.current.classList.remove("sallan"); void modalRef.current.offsetWidth; modalRef.current.classList.add("sallan"); } };

  /* ---- Kalan gün hesapla ---- */
  const kalanGun = (bitisTarihi) => {
    if (!bitisTarihi) return "-";
    const fark = Math.ceil((new Date(bitisTarihi) - new Date()) / (1000 * 60 * 60 * 24));
    return fark;
  };

  /* ---- Sütun sürükleme ---- */
  const sutunBasliklari = { urun: "Ürün", paket: "Paket", domain: "Domain", baslangic: "Başlangıç", bitis: "Bitiş", gun: "Gün", kalan: "Kalan", kullanici: "Kullanıcı", fiyat: "Fiyat" };
  const sutunDragStart = (e, idx) => { setSuruklenenSutun(idx); e.dataTransfer.effectAllowed = "move"; };
  const sutunDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const sutunDrop = (e, hedefIdx) => {
    e.preventDefault();
    if (suruklenenSutun === null || suruklenenSutun === hedefIdx) return;
    setSutunSirasi((o) => {
      const yeni = [...o];
      const [tasinan] = yeni.splice(suruklenenSutun, 1);
      yeni.splice(hedefIdx, 0, tasinan);
      return yeni;
    });
    setSuruklenenSutun(null);
  };

  /* ---- Sütun hücre render ---- */
  const sutunHucre = (p, key, gecmis) => {
    switch (key) {
      case "urun": return <td key={key} className={`px-4 py-3.5 font-medium whitespace-nowrap ${gecmis ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{p.urun}</td>;
      case "paket": return <td key={key} className="px-4 py-3.5 text-gray-600 dark:text-slate-400">{p.paket}</td>;
      case "domain": return <td key={key} className="px-4 py-3.5 text-gray-600 dark:text-slate-400 max-w-[220px] truncate text-xs"><span className="inline-flex items-center group">{p.domain || "-"}<KopyalaButonu metin={p.domain} /></span></td>;
      case "baslangic": return <td key={key} className="px-4 py-3.5 text-gray-600 dark:text-slate-400 whitespace-nowrap">{tarihGosterTR(p.baslangicTarihi)}</td>;
      case "bitis": return <td key={key} className={`px-4 py-3.5 whitespace-nowrap font-medium ${gecmis ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-slate-400"}`}>{tarihGosterTR(p.bitisTarihi)}</td>;
      case "gun": return <td key={key} className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-center">{p.kullanimGunu}</td>;
      case "kalan": {
        const kalan = kalanGun(p.bitisTarihi);
        const kalanNegatif = typeof kalan === "number" && kalan < 0;
        const kalanAz = typeof kalan === "number" && kalan >= 0 && kalan <= 30;
        return <td key={key} className={`px-4 py-3.5 text-center font-medium whitespace-nowrap ${kalanNegatif ? "text-red-600 dark:text-red-400" : kalanAz ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-slate-400"}`}>{typeof kalan === "number" ? (kalan < 0 ? `${Math.abs(kalan)} gün geçti` : `${kalan} gün`) : kalan}</td>;
      }
      case "kullanici": return <td key={key} className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-center">{p.kullanici}</td>;
      case "fiyat": return <td key={key} className="px-4 py-3.5 text-gray-600 dark:text-slate-400">{Number(p.fiyat).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>;
      default: return null;
    }
  };

  /* Müşteri bulunamazsa */
  if (!musteri) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Müşteri Bulunamadı</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Bu ID ile eşleşen bir müşteri kaydı yok.</p>
        <button onClick={() => git("/dashboard/musteriler")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Müşterilere Dön
        </button>
      </div>
    );
  }

  /* ---- Özet Kartları ---- */
  const toplamPaket = paketler.length;
  const aktifPaket = paketler.filter((p) => !suAnGecmisMi(p.bitisTarihi)).length;
  const suresiDolan = paketler.filter((p) => suAnGecmisMi(p.bitisTarihi)).length;
  const toplamTutar = paketler.reduce((t, p) => t + Number(p.fiyat || 0), 0);

  const ozetKartlar = [
    { baslik: "Toplam Paket", deger: toplamPaket, renk: "blue", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { baslik: "Aktif Paket", deger: aktifPaket, renk: "emerald", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { baslik: "Süresi Dolan", deger: suresiDolan, renk: "red", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { baslik: "Toplam Tutar", deger: toplamTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺", renk: "purple", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="space-y-6">
      {/* ===== Üst Bar: Geri + Başlık + Navigasyon + Yeni Paket ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => git("/dashboard/musteriler")}
            className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-medium">Müşteri Paketleri</p>
            <div className="flex items-center gap-2 mt-0.5">
              {oncekiMusteri && (
                <button onClick={() => git(`/dashboard/musteri-paketleri/${oncekiMusteri.id}`)} title={`Önceki: ${musteriAdi(oncekiMusteri)}`}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{musteriAdi(musteri)}</h1>
              {sonrakiMusteri && (
                <button onClick={() => git(`/dashboard/musteri-paketleri/${sonrakiMusteri.id}`)} title={`Sonraki: ${musteriAdi(sonrakiMusteri)}`}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setYeniPaketModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 cursor-pointer transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Müşteri Paketi
        </button>
      </div>

      {/* ===== Özet Kartları ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ozetKartlar.map((k) => (
          <div key={k.baslik} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${k.renk}-100 dark:bg-${k.renk}-500/20 text-${k.renk}-600 dark:text-${k.renk}-400`}>
              {k.ikon}
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{k.baslik}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{k.deger}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Tablo Kartı ===== */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">

        {/* Kontroller */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
            <select value={paketBoyut} onChange={(e) => { setPaketBoyut(Number(e.target.value)); setPaketSayfa(1); }}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm cursor-pointer text-gray-900 dark:text-white">
              {[5, 10, 25].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>kayıt göster</span>
            {/* Çizgi Stili Toggle */}
            <div className="flex items-center gap-1 ml-2 border-l border-gray-200 dark:border-white/10 pl-3">
              <span className="text-xs text-gray-400 dark:text-slate-500 mr-1">Çizgi:</span>
              {[
                { key: "yok", title: "Çizgi Yok", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> },
                { key: "yatay", title: "Yatay Çizgiler", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5h16v1H2zM2 9.5h16v1H2zM2 14h16v1H2z" /></svg> },
                { key: "dikey", title: "Dikey Çizgiler", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 2v16h1V2zM9.5 2v16h1V2zM14 2v16h1V2z" /></svg> },
                { key: "tam", title: "Tam Izgara", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M1 1h18v18H1V1zm1 1v5h5V2H2zm6 0v5h4V2H8zm5 0v5h5V2h-5zM2 8v4h5V8H2zm6 0v4h4V8H8zm5 0v4h5V8h-5zM2 13v5h5v-5H2zm6 0v5h4v-5H8zm5 0v5h5v-5h-5z" /></svg> },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setCizgiStil(opt.key)} title={opt.title}
                  className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                    cizgiStil === opt.key
                      ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-500/30"
                      : "text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-slate-300"
                  }`}>{opt.ikon}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-slate-400">Ara:</span>
            <input type="text" value={paketArama} onChange={(e) => { setPaketArama(e.target.value); setPaketSayfa(1); }}
              placeholder="Paket ara..." className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${cizgiStil === "dikey" || cizgiStil === "tam" ? "[&_td]:border-x [&_th]:border-x border-gray-200 dark:border-white/10 [&_td]:border-gray-200 [&_td]:dark:border-white/10 [&_th]:border-gray-200 [&_th]:dark:border-white/10" : ""}`}>
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr className="border-b border-gray-200 dark:border-white/10">
                {sutunSirasi.map((key, idx) => (
                  <th key={key} draggable onDragStart={(e) => sutunDragStart(e, idx)} onDragOver={sutunDragOver} onDrop={(e) => sutunDrop(e, idx)} onDragEnd={() => setSuruklenenSutun(null)}
                    className={`px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-grab active:cursor-grabbing select-none transition-opacity ${suruklenenSutun === idx ? "opacity-40" : ""}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-300 dark:text-slate-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      </svg>
                      {sutunBasliklari[key]}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">İşlemler</th>
              </tr>
            </thead>
            <tbody className={`${cizgiStil === "yatay" || cizgiStil === "tam" ? "divide-y divide-gray-200 dark:divide-white/10" : cizgiStil === "yok" ? "" : "divide-y divide-gray-100 dark:divide-white/5"}`}>
              {sayfaliPaketler.length > 0 ? sayfaliPaketler.map((p) => {
                const gecmis = suAnGecmisMi(p.bitisTarihi);
                return (
                  <tr key={p.id} className={`transition-colors ${gecmis ? "bg-red-50 dark:bg-red-500/5" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}>
                    {sutunSirasi.map((key) => sutunHucre(p, key, gecmis))}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {/* Cihazlar */}
                        <button onClick={() => setCihazlarModal(p)} title="Cihazlar"
                          className="w-8 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
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
                        {/* Sil */}
                        <button onClick={() => setSilOnay(p)} title="Sil"
                          className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={sutunSirasi.length + 1} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">Paket bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-white/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCihazlarModal(null)}>
          <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSilOnay(null)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLisansKeyModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 dark:text-white">Lisans Anahtarı</h4>
              <button onClick={() => setLisansKeyModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Mevcut Anahtar</p>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-white tracking-wider inline-flex items-center group">
                {lisansKeyModal.lisansAnahtari}
                <KopyalaButonu metin={lisansKeyModal.lisansAnahtari} />
              </p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEkKullaniciModal(null)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setFaturaModal(null)}>
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

      {/* Yeni Gelişmiş Paket Ekleme Modalı */}
      {yeniPaketModal && (
        <YeniPaketModal
          musteriId={id}
          kapat={() => setYeniPaketModal(false)}
          onBasarili={yeniPaketEklendi}
          urunler={dbUrunler}
          paketler={dbPaketler}
          bayiler={dbBayiler}
        />
      )}
    </div>
  );
}

/* ============================================= */
/*  Gelişmiş Yeni Paket Ekleme Modalı            */
/*  Adım adım wizard tarzı, tüm özellikler       */
/* ============================================= */

function YeniPaketModal({ musteriId, kapat, onBasarili, urunler, paketler, bayiler }) {
  const modalRef = useRef(null);
  const sallanma = () => { if (modalRef.current) { modalRef.current.classList.remove("sallan"); void modalRef.current.offsetWidth; modalRef.current.classList.add("sallan"); } };

  /* Aktif adım: 1=Ürün, 2=Lisans, 3=Fiyat, 4=Özet */
  const [adim, setAdim] = useState(1);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  /* Form state */
  const [form, setForm] = useState({
    /* Adım 1: Ürün Seçimi */
    urunId: "",
    paketId: "",
    /* Adım 2: Lisans Bilgileri */
    lisansTipi: "standart",
    baslangicTarihi: new Date().toISOString().slice(0, 10),
    kullanimGunu: 365,
    bitisTarihi: tarihEkle(new Date().toISOString().slice(0, 10), 365),
    domain: "",
    kullaniciSayisi: 1,
    ekKullanici: 0,
    /* Adım 3: Fiyat ve Ödeme */
    bayiId: "",
    fiyat: 0,
    indirimOrani: 0,
    indirimTutari: 0,
    netTutar: 0,
    odemeYontemi: "",
    odemeDurumu: "odenmedi",
    faturaNo: "",
    faturaTarihi: "",
    faturaGeldi: false,
    /* Ek Özellikler */
    otomatikYenileme: false,
    bildirimGun: 30,
    notlar: "",
  });

  /* Seçili ürün ve paket bilgileri */
  const seciliUrun = urunler.find((u) => u.id === Number(form.urunId));
  const urunPaketleri = paketler.filter((p) => p.urunId === Number(form.urunId));
  const seciliPaket = paketler.find((p) => p.id === Number(form.paketId));

  /* Form güncelle */
  const guncelle = (alan, deger) => {
    setForm((o) => {
      const yeni = { ...o, [alan]: deger };
      
      /* Otomatik hesaplamalar */
      if (alan === "baslangicTarihi" || alan === "kullanimGunu") {
        const baslangic = alan === "baslangicTarihi" ? deger : o.baslangicTarihi;
        const gun = alan === "kullanimGunu" ? deger : o.kullanimGunu;
        yeni.bitisTarihi = tarihEkle(baslangic, gun);
      }
      
      if (alan === "lisansTipi") {
        const tip = LISANS_TIPLERI.find((t) => t.id === deger);
        if (tip) {
          yeni.kullanimGunu = tip.gun;
          yeni.bitisTarihi = tarihEkle(o.baslangicTarihi, tip.gun);
        }
      }
      
      if (alan === "paketId" && deger) {
        const paket = paketler.find((p) => p.id === Number(deger));
        if (paket) {
          yeni.fiyat = Number(paket.fiyati) || 0;
          yeni.kullanimGunu = paket.kullanimGunu || 365;
          yeni.kullaniciSayisi = paket.kullaniciSayisi || 1;
          yeni.bitisTarihi = tarihEkle(o.baslangicTarihi, paket.kullanimGunu || 365);
          yeni.netTutar = Number(paket.fiyati) || 0;
        }
      }
      
      if (alan === "fiyat" || alan === "indirimOrani" || alan === "indirimTutari") {
        const brut = alan === "fiyat" ? Number(deger) : Number(o.fiyat);
        const oran = alan === "indirimOrani" ? Number(deger) : Number(o.indirimOrani);
        let tutar = alan === "indirimTutari" ? Number(deger) : Number(o.indirimTutari);
        
        if (alan === "indirimOrani") {
          tutar = brut * oran / 100;
          yeni.indirimTutari = tutar;
        }
        yeni.netTutar = brut - tutar;
      }
      
      return yeni;
    });
  };

  /* Ürün seçildiğinde */
  const urunSec = (urunId) => {
    guncelle("urunId", urunId);
    guncelle("paketId", "");
  };

  /* Adım validasyonu */
  const adimGecerliMi = (a) => {
    switch (a) {
      case 1: return !!form.urunId;
      case 2: return !!form.baslangicTarihi && !!form.bitisTarihi;
      case 3: return true;
      default: return true;
    }
  };

  /* API'ye gönder */
  const kaydet = async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const gonderilecek = {
        musteri_id: Number(musteriId),
        urun_id: form.urunId ? Number(form.urunId) : null,
        paket_id: form.paketId ? Number(form.paketId) : null,
        bayi_id: form.bayiId ? Number(form.bayiId) : null,
        lisans_tipi: form.lisansTipi,
        baslangic_tarihi: form.baslangicTarihi,
        bitis_tarihi: form.bitisTarihi,
        kullanim_gunu: Number(form.kullanimGunu),
        domain: form.domain || null,
        kullanici_sayisi: Number(form.kullaniciSayisi) || 1,
        ek_kullanici: Number(form.ekKullanici) || 0,
        fiyat: Number(form.fiyat) || 0,
        indirim_orani: Number(form.indirimOrani) || 0,
        indirim_tutari: Number(form.indirimTutari) || 0,
        net_tutar: Number(form.netTutar) || 0,
        odeme_yontemi: form.odemeYontemi || null,
        odeme_durumu: form.odemeDurumu,
        fatura_no: form.faturaNo || null,
        fatura_tarihi: form.faturaTarihi || null,
        fatura_geldi: form.faturaGeldi,
        otomatik_yenileme: form.otomatikYenileme,
        bildirim_gun: Number(form.bildirimGun) || 30,
        notlar: form.notlar || null,
      };
      
      const sonuc = await apiPost("/lisanslar", gonderilecek);
      if (sonuc.basarili) {
        onBasarili({ ...gonderilecek, id: sonuc.id, lisans_anahtari: sonuc.lisans_anahtari });
      } else {
        setHata(sonuc.mesaj || "Bir hata oluştu.");
      }
    } catch (e) {
      setHata("Sunucu hatası: " + (e.message || "Bilinmeyen hata"));
    } finally {
      setYukleniyor(false);
    }
  };

  /* Adım başlıkları */
  const adimlar = [
    { no: 1, baslik: "Ürün Seçimi", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { no: 2, baslik: "Lisans Bilgileri", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> },
    { no: 3, baslik: "Fiyat & Ödeme", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { no: 4, baslik: "Özet & Onay", ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={modalRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Yeni Müşteri Paketi</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Adım {adim} / 4</p>
          </div>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Adım Göstergesi */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            {adimlar.map((a, i) => (
              <div key={a.no} className="flex items-center">
                <button
                  onClick={() => adimGecerliMi(adim) && a.no < adim + 2 && setAdim(a.no)}
                  disabled={a.no > adim + 1}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    adim === a.no
                      ? "bg-blue-600 text-white shadow-sm"
                      : a.no < adim
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-slate-500"
                  } ${a.no > adim + 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {a.ikon}
                  <span className="hidden sm:inline">{a.baslik}</span>
                </button>
                {i < adimlar.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${a.no < adim ? "bg-emerald-400" : "bg-gray-200 dark:bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-auto p-6">
          {/* Adım 1: Ürün Seçimi */}
          {adim === 1 && (
            <div className="space-y-5">
              <div>
                <label className={LABEL_STIL}>Ürün Seçin <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {urunler.filter((u) => u.aktif).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => urunSec(u.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        form.urunId === u.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                          : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          form.urunId === u.id ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400"
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <div>
                          <p className={`font-medium ${form.urunId === u.id ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>{u.ad}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{u.grubu || "Genel"}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {form.urunId && urunPaketleri.length > 0 && (
                <div>
                  <label className={LABEL_STIL}>Paket Seçin (Opsiyonel)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <button
                      onClick={() => guncelle("paketId", "")}
                      className={`p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                        !form.paketId ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400"
                      }`}
                    >
                      Paket Seçme
                    </button>
                    {urunPaketleri.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => guncelle("paketId", p.id)}
                        className={`p-3 rounded-lg border text-sm text-left transition-all cursor-pointer ${
                          form.paketId === p.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                            : "border-gray-200 dark:border-white/10 hover:border-gray-300"
                        }`}
                      >
                        <p className={`font-medium ${form.paketId === p.id ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>{p.adi}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.tipi} • {p.kullanimGunu} gün • ₺{Number(p.fiyati).toLocaleString("tr-TR")}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Adım 2: Lisans Bilgileri */}
          {adim === 2 && (
            <div className="space-y-4">
              {/* Lisans Tipi */}
              <div>
                <label className={LABEL_STIL}>Lisans Tipi</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {LISANS_TIPLERI.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => guncelle("lisansTipi", t.id)}
                      className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                        form.lisansTipi === t.id
                          ? `border-${t.renk}-500 bg-${t.renk}-50 dark:bg-${t.renk}-500/10`
                          : "border-gray-200 dark:border-white/10"
                      }`}
                    >
                      <p className={`text-sm font-medium ${form.lisansTipi === t.id ? `text-${t.renk}-700 dark:text-${t.renk}-400` : "text-gray-700 dark:text-slate-300"}`}>{t.ad}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.gun} gün</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={LABEL_STIL}>Başlangıç Tarihi <span className="text-red-500">*</span></label>
                  <input type="date" value={form.baslangicTarihi} onChange={(e) => guncelle("baslangicTarihi", e.target.value)} className={INPUT_STIL} />
                </div>
                <div>
                  <label className={LABEL_STIL}>Kullanım Günü</label>
                  <input type="number" value={form.kullanimGunu} onChange={(e) => guncelle("kullanimGunu", Number(e.target.value))} className={INPUT_STIL} min={1} />
                </div>
                <div>
                  <label className={LABEL_STIL}>Bitiş Tarihi</label>
                  <input type="date" value={form.bitisTarihi} onChange={(e) => guncelle("bitisTarihi", e.target.value)} className={INPUT_STIL} readOnly />
                </div>
              </div>

              {/* Domain */}
              <div>
                <label className={LABEL_STIL}>Domain / Server Adresi</label>
                <input type="text" value={form.domain} onChange={(e) => guncelle("domain", e.target.value)} className={INPUT_STIL} placeholder="http://musteriadi.sirket.com:9090/" />
              </div>

              {/* Kullanıcı Sayıları */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_STIL}>Temel Kullanıcı Sayısı</label>
                  <input type="number" value={form.kullaniciSayisi} onChange={(e) => guncelle("kullaniciSayisi", Number(e.target.value))} className={INPUT_STIL} min={1} />
                </div>
                <div>
                  <label className={LABEL_STIL}>Ek Kullanıcı</label>
                  <input type="number" value={form.ekKullanici} onChange={(e) => guncelle("ekKullanici", Number(e.target.value))} className={INPUT_STIL} min={0} />
                </div>
              </div>

              {/* Ek Seçenekler */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                  <input type="checkbox" checked={form.otomatikYenileme} onChange={(e) => guncelle("otomatikYenileme", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Otomatik Yenileme</p>
                    <p className="text-xs text-gray-400">Süre bitince otomatik uzat</p>
                  </div>
                </label>
                <div>
                  <label className={LABEL_STIL}>Bildirim Süresi (Gün)</label>
                  <input type="number" value={form.bildirimGun} onChange={(e) => guncelle("bildirimGun", Number(e.target.value))} className={INPUT_STIL} min={1} placeholder="30" />
                </div>
              </div>
            </div>
          )}

          {/* Adım 3: Fiyat ve Ödeme */}
          {adim === 3 && (
            <div className="space-y-4">
              {/* Bayi Seçimi */}
              {bayiler.length > 0 && (
                <div>
                  <label className={LABEL_STIL}>Satış Yapan Bayi (Opsiyonel)</label>
                  <select value={form.bayiId} onChange={(e) => guncelle("bayiId", e.target.value)} className={INPUT_STIL}>
                    <option value="">Bayi Seçilmedi (Doğrudan Satış)</option>
                    {bayiler.map((b) => (
                      <option key={b.id} value={b.id}>{b.ad}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fiyat Bilgileri */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Fiyat Bilgileri</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={LABEL_STIL}>Brüt Fiyat (₺)</label>
                    <input type="number" value={form.fiyat} onChange={(e) => guncelle("fiyat", e.target.value)} className={INPUT_STIL} min={0} step="0.01" />
                  </div>
                  <div>
                    <label className={LABEL_STIL}>İndirim (%)</label>
                    <input type="number" value={form.indirimOrani} onChange={(e) => guncelle("indirimOrani", e.target.value)} className={INPUT_STIL} min={0} max={100} />
                  </div>
                  <div>
                    <label className={LABEL_STIL}>İndirim Tutarı</label>
                    <input type="number" value={form.indirimTutari} onChange={(e) => guncelle("indirimTutari", e.target.value)} className={INPUT_STIL} min={0} step="0.01" />
                  </div>
                  <div>
                    <label className={LABEL_STIL}>Net Tutar (₺)</label>
                    <input type="number" value={form.netTutar} className={`${INPUT_STIL} bg-emerald-50 dark:bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400`} readOnly />
                  </div>
                </div>
              </div>

              {/* Ödeme Bilgileri */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_STIL}>Ödeme Yöntemi</label>
                  <select value={form.odemeYontemi} onChange={(e) => guncelle("odemeYontemi", e.target.value)} className={INPUT_STIL}>
                    <option value="">Seçiniz</option>
                    {ODEME_YONTEMLERI.map((y) => (
                      <option key={y.id} value={y.id}>{y.ad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_STIL}>Ödeme Durumu</label>
                  <select value={form.odemeDurumu} onChange={(e) => guncelle("odemeDurumu", e.target.value)} className={INPUT_STIL}>
                    {ODEME_DURUMLARI.map((d) => (
                      <option key={d.id} value={d.id}>{d.ad}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fatura Bilgileri */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={LABEL_STIL}>Fatura No</label>
                  <input type="text" value={form.faturaNo} onChange={(e) => guncelle("faturaNo", e.target.value)} className={INPUT_STIL} placeholder="FTR-2026-001" />
                </div>
                <div>
                  <label className={LABEL_STIL}>Fatura Tarihi</label>
                  <input type="date" value={form.faturaTarihi} onChange={(e) => guncelle("faturaTarihi", e.target.value)} className={INPUT_STIL} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 w-full">
                    <input type="checkbox" checked={form.faturaGeldi} onChange={(e) => guncelle("faturaGeldi", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">Fatura Geldi</span>
                  </label>
                </div>
              </div>

              {/* Not */}
              <div>
                <label className={LABEL_STIL}>Notlar</label>
                <textarea value={form.notlar} onChange={(e) => guncelle("notlar", e.target.value)} className={`${INPUT_STIL} h-20 resize-none`} placeholder="Ek açıklamalar..." />
              </div>
            </div>
          )}

          {/* Adım 4: Özet */}
          {adim === 4 && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/10 dark:to-violet-500/10 border border-blue-200 dark:border-blue-500/20">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Lisans Özeti</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Ürün</p>
                      <p className="font-medium text-gray-900 dark:text-white">{seciliUrun?.ad || "-"}</p>
                    </div>
                    {seciliPaket && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500">Paket</p>
                        <p className="font-medium text-gray-900 dark:text-white">{seciliPaket.adi}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Lisans Tipi</p>
                      <p className="font-medium text-gray-900 dark:text-white">{LISANS_TIPLERI.find((t) => t.id === form.lisansTipi)?.ad}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Süre</p>
                      <p className="font-medium text-gray-900 dark:text-white">{tarihGosterTR(form.baslangicTarihi)} - {tarihGosterTR(form.bitisTarihi)} ({form.kullanimGunu} gün)</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Kullanıcı Sayısı</p>
                      <p className="font-medium text-gray-900 dark:text-white">{form.kullaniciSayisi} {form.ekKullanici > 0 ? `+ ${form.ekKullanici} ek` : ""}</p>
                    </div>
                    {form.domain && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500">Domain</p>
                        <p className="font-medium text-gray-900 dark:text-white text-sm break-all">{form.domain}</p>
                      </div>
                    )}
                    {form.bayiId && (
                      <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500">Bayi</p>
                        <p className="font-medium text-gray-900 dark:text-white">{bayiler.find((b) => b.id === Number(form.bayiId))?.ad}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Ödeme Durumu</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                        form.odemeDurumu === "odendi" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
                        form.odemeDurumu === "kismi" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" :
                        "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      }`}>
                        {ODEME_DURUMLARI.find((d) => d.id === form.odemeDurumu)?.ad}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-slate-500">Net Tutar</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₺{Number(form.netTutar).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
                      {form.indirimOrani > 0 && (
                        <p className="text-xs text-gray-400 line-through">₺{Number(form.fiyat).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ({form.indirimOrani}% indirim)</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {hata && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
                  {hata}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={() => adim > 1 ? setAdim(adim - 1) : kapat()}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
          >
            {adim === 1 ? "İptal" : "Geri"}
          </button>
          
          {adim < 4 ? (
            <button
              onClick={() => adimGecerliMi(adim) && setAdim(adim + 1)}
              disabled={!adimGecerliMi(adim)}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2"
            >
              İleri
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button
              onClick={kaydet}
              disabled={yukleniyor}
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2"
            >
              {yukleniyor ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Lisans Oluştur
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
