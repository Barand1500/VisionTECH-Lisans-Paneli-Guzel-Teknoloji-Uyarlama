/* ============================================= */
/*  Güzel Teknoloji - Müşteri Paketleri Sayfası  */
/*  Müşteri paket listesi, arama, sayfalama,     */
/*  cihaz, lisans, fatura, ek kullanıcı yönetimi */
/*  ve gelişmiş yeni paket ekleme modalı         */
/* ============================================= */

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMusteriler } from "../baglam/MusteriContext";
import { apiGet, apiPost, apiPut, apiDelete } from "../yardimcilar/api";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";
import KopyalaButonu from "../bilesenler/KopyalaButonu";

/* ---- Stil Sabitleri ---- */
const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";
const LABEL_STIL = "block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1";

/* ---- Sabit Değerler ---- */
// Lisans tipleri artık DB'den yükleniyor (/api/lisans-tipleri/aktif)

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
  const { logEkle } = useAktiviteLog();

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
  const [dbGruplar, setDbGruplar] = useState([]);
  const [lisansTipleri, setLisansTipleri] = useState([]);

  /* Verileri yükle */
  useEffect(() => {
    /* Lisans tiplerini DB'den yükle */
    apiGet("/lisans-tipleri/aktif").then((res) => {
      if (res.basarili && Array.isArray(res.veri) && res.veri.length > 0) {
        setLisansTipleri(res.veri.map((lt) => ({
          id: lt.kod || lt.id,
          ad: lt.ad,
          renk: lt.renk || "blue",
          gun: lt.gun || 365,
          suresiz: !!lt.suresiz,
        })));
      }
    }).catch(() => {});

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
          suresiz: !!l.suresiz,
          macAdresi: l.mac_adresi || "",
          ipAdresi: l.ip_adresi || "",
          moduller: l.moduller || null,
          musteriId: l.musteri_id,
          bayiId: l.bayi_id,
          lisansTipiId: l.lisans_tipi_id,
          surumId: l.surum_id,
        })));
      }
    }).catch(() => {}).finally(() => setYukleniyor(false));

    /* Ürünleri yükle */
    apiGet("/urunler").then((r) => {
      if (r.basarili) setDbUrunler(r.veri);
    }).catch(() => {});

    /* Ürün gruplarını yükle */
    apiGet("/urunler/gruplar").then((r) => {
      if (r.basarili) setDbGruplar(r.veri.filter((g) => g.aktif));
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
          ozellikler: p.ozellikler,
        })));
      }
    }).catch(() => {});

    /* Bayileri yükle */
    apiGet("/bayiler").then((r) => {
      if (r.basarili) setDbBayiler(r.veri.filter((b) => b.durum === "aktif"));
    }).catch(() => {});
  }, [id]);

  /* Sütun sırası (sürüklenebilir) */
  const [sutunSirasiTemel, setSutunSirasiTemel] = useState(["urun", "paket", "domain", "baslangic", "bitis", "gun", "kalan", "kullanici", "fiyat"]);
  const [suruklenenSutun, setSuruklenenSutun] = useState(null);

  /* Domain sütununu sadece en az bir pakette domain varsa göster */
  const domainVarMi = useMemo(() => paketler.some((p) => p.domain && p.domain.trim() !== ""), [paketler]);
  const sutunSirasi = useMemo(() => {
    if (domainVarMi) return sutunSirasiTemel;
    return sutunSirasiTemel.filter((s) => s !== "domain");
  }, [sutunSirasiTemel, domainVarMi]);

  /* Sütun sırasını güncelle (domain filtreli) */
  const setSutunSirasi = (guncelleyici) => {
    setSutunSirasiTemel((o) => {
      const yeni = typeof guncelleyici === "function" ? guncelleyici(o) : guncelleyici;
      return yeni;
    });
  };

  /* Tablo çizgi stili: "yok" | "yatay" | "dikey" | "tam" */
  const [cizgiStil, setCizgiStil] = useState("yok");

  /* Alt modal states */
  const [cihazlarModal, setCihazlarModal] = useState(null);
  const [silOnay, setSilOnay] = useState(null);
  const [lisansKeyModal, setLisansKeyModal] = useState(null);
  const [ekKullaniciModal, setEkKullaniciModal] = useState(null);
  const [ekKullaniciDuzenle, setEkKullaniciDuzenle] = useState({ yeniEk: 0, kaydetmeUygun: false });
  const [faturaModal, setFaturaModal] = useState(null);
  const [yeniPaketModal, setYeniPaketModal] = useState(false);
  const [bilgiModal, setBilgiModal] = useState(null);
  const [bilgiDetay, setBilgiDetay] = useState(null);
  const [bilgiYukleniyor, setBilgiYukleniyor] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [transferArama, setTransferArama] = useState("");
  const [transferMusteri, setTransferMusteri] = useState(null);
  const [transferYukleniyor, setTransferYukleniyor] = useState(false);
  const [tumMusteriler, setTumMusteriler] = useState([]);

  /* Filtre & sayfalama */
  const filtreliPaketler = paketler.filter((p) => {
    const q = paketArama.toLowerCase();
    return p.urun.toLowerCase().includes(q) || p.paket.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
  });
  const topSayfa = Math.max(1, Math.ceil(filtreliPaketler.length / paketBoyut));
  const sayfaliPaketler = filtreliPaketler.slice((paketSayfa - 1) * paketBoyut, paketSayfa * paketBoyut);

  /* Aksiyonlar */
  const paketSil = async (pid) => {
    try {
      const silinecek = paketler.find((p) => p.id === pid);
      await apiDelete(`/lisanslar/${pid}`);
      setPaketler((o) => o.filter((p) => p.id !== pid));
      setSilOnay(null);
      await logEkle("lisans_silme", `${silinecek?.urun || ""} - ${silinecek?.paket || ""} lisansı silindi`);
    } catch (err) {
      console.error("Paket silinemedi:", err);
      setSilOnay(null);
    }
  };

  /* Ek kullanıcı güncelle */
  const ekKullaniciGuncelle = async () => {
    if (!ekKullaniciModal) return;
    const yeniEkKullaniciSayisi = (Number(ekKullaniciModal.ekKullanici) || 0) + Number(ekKullaniciDuzenle.yeniEk);
    try {
      await apiPut(`/lisanslar/${ekKullaniciModal.id}`, {
        ek_kullanici: yeniEkKullaniciSayisi
      });
      /* Listeyi güncelle */
      setPaketler((o) => o.map((p) =>
        p.id === ekKullaniciModal.id
          ? { ...p, ekKullanici: yeniEkKullaniciSayisi }
          : p
      ));
      setEkKullaniciModal(null);
      setEkKullaniciDuzenle({ yeniEk: 0, kaydetmeUygun: false });
      await logEkle("lisans_guncelleme", `Ek kullanıcı sayısı ${yeniEkKullaniciSayisi} olarak güncellendi`);
    } catch (err) {
      console.error("Ek kullanıcı güncellenemedi:", err);
    }
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
    logEkle("lisans_olusturma", `${yeni.urun} - ${yeni.paket} yeni lisans oluşturuldu`);
  };

  /* Sallanma ref */
  const modalRef = useRef(null);
  const sallanma = () => { if (modalRef.current) { modalRef.current.classList.remove("sallan"); void modalRef.current.offsetWidth; modalRef.current.classList.add("sallan"); } };

  /* ---- Kalan gün hesapla ---- */
  const kalanGun = (bitisTarihi, suresiz) => {
    if (suresiz) return "Süresiz";
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
        const kalan = kalanGun(p.bitisTarihi, p.suresiz);
        const kalanNegatif = typeof kalan === "number" && kalan < 0;
        const kalanAz = typeof kalan === "number" && kalan >= 0 && kalan <= 30;
        const suresizMi = kalan === "Süresiz";
        return <td key={key} className={`px-4 py-3.5 text-center font-medium whitespace-nowrap ${suresizMi ? "text-emerald-600 dark:text-emerald-400" : kalanNegatif ? "text-red-600 dark:text-red-400" : kalanAz ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-slate-400"}`}>{suresizMi ? <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>Süresiz</span> : typeof kalan === "number" ? (kalan < 0 ? `${Math.abs(kalan)} gün geçti` : `${kalan} gün`) : kalan}</td>;
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
                        {/* Bilgi */}
                        <button onClick={async () => {
                          setBilgiModal(p);
                          setBilgiYukleniyor(true);
                          try {
                            const r = await apiGet(`/lisanslar/${p.id}/detay`);
                            if (r.basarili) setBilgiDetay(r.veri);
                          } catch { }
                          setBilgiYukleniyor(false);
                        }} title="Ürün Bilgisi"
                          className="w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Lisans Anahtarı</h4>
                  <p className="text-white/70 text-xs">{lisansKeyModal.urun || "Ürün"}</p>
                </div>
              </div>
              <button onClick={() => setLisansKeyModal(null)} className="text-white/70 hover:text-white cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Body */}
            <div className="px-6 py-5">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 mb-4 border border-gray-200 dark:border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-2 font-semibold">Mevcut Anahtar</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-[0.15em] select-all flex-1">
                    {lisansKeyModal.lisansAnahtari}
                  </p>
                  <KopyalaButonu metin={lisansKeyModal.lisansAnahtari} />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const yeniKey = rastgeleLisansAnahtari();
                    setPaketler((o) => o.map((p) => p.id === lisansKeyModal.id ? { ...p, lisansAnahtari: yeniKey } : p));
                    setLisansKeyModal({ ...lisansKeyModal, lisansAnahtari: yeniKey });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 transition-colors shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Yeni Anahtar Oluştur
                </button>
                <button
                  onClick={() => setLisansKeyModal(null)}
                  className="px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ek Kullanıcı */}
      {ekKullaniciModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setEkKullaniciModal(null); setEkKullaniciDuzenle({ yeniEk: 0, kaydetmeUygun: false }); }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Ek Kullanıcı Yönetimi</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{ekKullaniciModal.urun}</p>
              </div>
              <button onClick={() => { setEkKullaniciModal(null); setEkKullaniciDuzenle({ yeniEk: 0, kaydetmeUygun: false }); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Mevcut Bilgiler */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Temel Kullanıcı:</span>
                <span className="font-medium text-gray-900 dark:text-white">{Number(ekKullaniciModal.kullanici) || 1}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Mevcut Ek Kullanıcı:</span>
                <span className="font-medium text-gray-900 dark:text-white">{Number(ekKullaniciModal.ekKullanici) || 0}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 dark:border-white/10 pt-3">
                <span className="text-gray-500 dark:text-slate-400">Toplam Kullanıcı:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{(Number(ekKullaniciModal.kullanici) || 1) + (Number(ekKullaniciModal.ekKullanici) || 0)}</span>
              </div>
            </div>

            {/* Ek Kullanıcı Düzenleme */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">Kaç Ek Kullanıcı Eklensin?</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEkKullaniciDuzenle(o => ({ ...o, yeniEk: Math.max(0, o.yeniEk - 1), kaydetmeUygun: o.yeniEk > 1 }))}
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </button>
                <input
                  type="number"
                  value={ekKullaniciDuzenle.yeniEk}
                  onChange={(e) => setEkKullaniciDuzenle({ yeniEk: Math.max(0, Number(e.target.value)), kaydetmeUygun: Number(e.target.value) > 0 })}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-center text-lg font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
                <button
                  onClick={() => setEkKullaniciDuzenle(o => ({ ...o, yeniEk: o.yeniEk + 1, kaydetmeUygun: true }))}
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              
              {/* Yeni Toplam */}
              {ekKullaniciDuzenle.yeniEk > 0 && (
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-3 border border-blue-200 dark:border-blue-500/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Mevcut Ek Kullanıcı:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{Number(ekKullaniciModal.ekKullanici) || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">Eklenecek:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">+{ekKullaniciDuzenle.yeniEk}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-500/30">
                    <span className="text-blue-600 dark:text-blue-400">Yeni Ek Kullanıcı:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">{(Number(ekKullaniciModal.ekKullanici) || 0) + Number(ekKullaniciDuzenle.yeniEk)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Yeni Toplam Kullanıcı:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">{(Number(ekKullaniciModal.kullanici) || 1) + (Number(ekKullaniciModal.ekKullanici) || 0) + Number(ekKullaniciDuzenle.yeniEk)}</span>
                  </div>
                </div>
              )}

              {/* Kaydet Butonu */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setEkKullaniciModal(null); setEkKullaniciDuzenle({ yeniEk: 0, kaydetmeUygun: false }); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                  İptal
                </button>
                <button
                  onClick={ekKullaniciGuncelle}
                  disabled={!ekKullaniciDuzenle.kaydetmeUygun}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fatura Bilgisi */}
      {faturaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setFaturaModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Fatura Bilgisi</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{faturaModal.urun}</p>
              </div>
              <button onClick={() => setFaturaModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Fatura Detayları */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Fatura No:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{faturaModal.faturaNo || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Fatura Tarihi:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{faturaModal.faturaTarihi ? tarihGosterTR(faturaModal.faturaTarihi) : "-"}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 dark:border-white/10 pt-3">
                  <span className="text-gray-500 dark:text-slate-400">Tutar:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">₺{Number(faturaModal.fiyat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Net Tutar:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₺{Number(faturaModal.netTutar || faturaModal.fiyat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              {/* Ödeme Durumu */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10">
                <span className="text-sm text-gray-600 dark:text-slate-400">Ödeme Durumu:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  faturaModal.odemeDurumu === "odendi" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                  faturaModal.odemeDurumu === "kismi" ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                }`}>
                  {faturaModal.odemeDurumu === "odendi" ? "Ödendi" : faturaModal.odemeDurumu === "kismi" ? "Kısmi Ödeme" : "Ödenmedi"}
                </span>
              </div>
              
              {/* Fatura Geldi Mi? */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10">
                <span className="text-sm text-gray-600 dark:text-slate-400">Fatura Durumu:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  faturaModal.faturaGeldi ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                  "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400"
                }`}>
                  {faturaModal.faturaGeldi ? "Fatura Geldi" : "Fatura Bekleniyor"}
                </span>
              </div>
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
          gruplar={dbGruplar}
          paketler={dbPaketler}
          bayiler={dbBayiler}
          lisansTipleri={lisansTipleri}
          git={git}
        />
      )}

      {/* ========== Bilgi Modalı ========== */}
      {bilgiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setBilgiModal(null); setBilgiDetay(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Ürün Bilgisi</h4>
                  <p className="text-white/70 text-xs">{bilgiModal.urun} {bilgiModal.paket !== "-" ? `• ${bilgiModal.paket}` : ""}</p>
                </div>
              </div>
              <button onClick={() => { setBilgiModal(null); setBilgiDetay(null); }} className="text-white/70 hover:text-white cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {bilgiYukleniyor ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">Bilgiler yükleniyor...</p>
                </div>
              ) : bilgiDetay ? (
                <>
                  {/* Ürün Bilgileri */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                      <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ürün Bilgileri</h5>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Ürün</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.urun_adi || "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Grup</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.grup_adi || "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Ürün Tipi</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.urun_tipi || "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Uygulama Tipi</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.uygulama_tipi || "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Paket</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.paket_adi || "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Versiyon</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.versiyon || bilgiDetay.surum_no || "-"}</p></div>
                    </div>
                  </div>

                  {/* Lisans Bilgileri */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                      <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Lisans Bilgileri</h5>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Lisans Anahtarı</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white flex items-center gap-1">{bilgiDetay.lisans_anahtari || "-"}{bilgiDetay.lisans_anahtari && <KopyalaButonu metin={bilgiDetay.lisans_anahtari} />}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Lisans Tipi</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.lisans_tipi_adi || bilgiDetay.lisans_tipi || "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Başlangıç</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.baslangic_tarihi ? tarihGosterTR(bilgiDetay.baslangic_tarihi.slice(0, 10)) : "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Bitiş</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.suresiz ? "Süresiz" : bilgiDetay.bitis_tarihi ? tarihGosterTR(bilgiDetay.bitis_tarihi.slice(0, 10)) : "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Durum</p><p className={`text-sm font-semibold ${bilgiDetay.durum === "aktif" ? "text-emerald-600" : bilgiDetay.durum === "suresi-dolmus" ? "text-red-600" : "text-amber-600"}`}>{bilgiDetay.durum === "aktif" ? "Aktif" : bilgiDetay.durum === "suresi-dolmus" ? "Süresi Dolmuş" : bilgiDetay.durum === "dondurulmuş" ? "Dondurulmuş" : bilgiDetay.durum}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Kullanıcı</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.kullanici_sayisi || 1}{bilgiDetay.ek_kullanici > 0 ? ` (+${bilgiDetay.ek_kullanici} ek)` : ""}</p></div>
                    </div>
                  </div>

                  {/* Teknik Bilgiler */}
                  {(bilgiDetay.domain || bilgiDetay.mac_adresi || bilgiDetay.ip_adresi) && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                        <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Teknik Bilgiler</h5>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {bilgiDetay.domain && <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Domain</p><p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">{bilgiDetay.domain}<KopyalaButonu metin={bilgiDetay.domain} /></p></div>}
                        {bilgiDetay.mac_adresi && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">MAC Adresi</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bilgiDetay.mac_adresi}</p></div>}
                        {bilgiDetay.ip_adresi && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">IP Adresi</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bilgiDetay.ip_adresi}</p></div>}
                      </div>
                    </div>
                  )}

                  {/* Finansal Bilgiler */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                      <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Finansal Bilgiler</h5>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Fiyat</p><p className="text-sm font-bold text-gray-900 dark:text-white">{Number(bilgiDetay.fiyat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Net Tutar</p><p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Number(bilgiDetay.net_tutar || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</p></div>
                      {Number(bilgiDetay.indirim_orani) > 0 && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">İndirim</p><p className="text-sm font-medium text-orange-600">%{bilgiDetay.indirim_orani}</p></div>}
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Ödeme Durumu</p><p className={`text-sm font-semibold ${bilgiDetay.odeme_durumu === "odendi" ? "text-emerald-600" : bilgiDetay.odeme_durumu === "kismi" ? "text-amber-600" : "text-red-600"}`}>{bilgiDetay.odeme_durumu === "odendi" ? "Ödendi" : bilgiDetay.odeme_durumu === "kismi" ? "Kısmi" : "Ödenmedi"}</p></div>
                      {bilgiDetay.fatura_no && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Fatura No</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.fatura_no}</p></div>}
                      {bilgiDetay.odeme_yontemi && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Ödeme Yöntemi</p><p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{bilgiDetay.odeme_yontemi}</p></div>}
                    </div>
                  </div>

                  {/* Şablon Özellikleri */}
                  {bilgiDetay.sablon_ozellikleri?.length > 0 && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                        <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Şablon Özellikleri</h5>
                      </div>
                      <div className="p-4 space-y-2">
                        {bilgiDetay.sablon_ozellikleri.map((oz) => {
                          const deger = typeof oz.deger === "string" ? (() => { try { return JSON.parse(oz.deger); } catch { return oz.deger; } })() : oz.deger;
                          return (
                            <div key={oz.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-white/5">
                              <span className="text-sm">{oz.baslik || oz.ozellik_tipi}</span>
                              <span className="ml-auto text-xs text-gray-500 dark:text-slate-400 text-right">
                                {typeof deger === "object" ? Object.entries(deger).map(([k, v]) => <span key={k} className="block">{k}: {String(v)}</span>) : String(deger)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Garanti & Güvenlik (sablon_verileri içinden) */}
                  {bilgiDetay.moduller?.sablon_verileri && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                        <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ek Bilgiler (Şablon)</h5>
                      </div>
                      <div className="p-4 space-y-2">
                        {Object.entries(bilgiDetay.moduller.sablon_verileri).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <span className="text-sm text-gray-700 dark:text-slate-300 capitalize">{key.replace(/_/g, " ")}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transfer Geçmişi */}
                  {bilgiDetay.moduller?.transfer_gecmisi?.length > 0 && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 overflow-hidden">
                      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
                        <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Transfer Geçmişi</h5>
                      </div>
                      <div className="p-4 space-y-2">
                        {bilgiDetay.moduller.transfer_gecmisi.map((t, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${t.geri_alma ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400" : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"}`}>
                              {t.geri_alma ? "Geri Alma" : "Transfer"}
                            </span>
                            <span className="text-gray-500 dark:text-slate-400">Müşteri #{t.eski_musteri_id} → #{t.yeni_musteri_id}</span>
                            <span className="ml-auto text-gray-400 dark:text-slate-500">{new Date(t.tarih).toLocaleDateString("tr-TR")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Domain İşlemleri */}
                  {bilgiDetay.domain && (
                    <div className="rounded-xl border border-fuchsia-200 dark:border-fuchsia-500/20 overflow-hidden">
                      <div className="px-4 py-2.5 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-b border-fuchsia-200 dark:border-fuchsia-500/20">
                        <h5 className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider">Domain İşlemleri</h5>
                      </div>
                      <div className="p-4 flex gap-3">
                        <button onClick={async () => {
                          setTransferModal(true);
                          setTransferArama("");
                          setTransferMusteri(null);
                          try { const r = await apiGet("/musteriler"); if (r.basarili) setTumMusteriler(r.veri.filter(m => String(m.id) !== String(id))); } catch {}
                        }}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          Transfer Et
                        </button>
                        {bilgiDetay.moduller?.transfer_gecmisi?.length > 0 && (
                          <button onClick={async () => {
                            if (!confirm("Son transferi geri almak istediğinize emin misiniz?")) return;
                            try {
                              const r = await apiPost(`/lisanslar/${bilgiDetay.id}/domain-geri-al`);
                              if (r.basarili) {
                                alert(r.mesaj);
                                setBilgiModal(null); setBilgiDetay(null);
                                apiGet(`/lisanslar/musteri/${id}`).then((r2) => { if (r2.basarili) setPaketler(r2.veri.map((l) => ({ id: l.id, urun: l.urun_adi || "-", urunId: l.urun_id, paket: l.paket_adi || "-", paketId: l.paket_id, bayiAdi: l.bayi_adi || "", lisansTipi: l.lisans_tipi || "standart", domain: l.domain || "", faturaNo: l.fatura_no || "", faturaTarihi: l.fatura_tarihi ? l.fatura_tarihi.slice(0, 10) : "", kullanimGunu: l.kullanim_gunu || 365, baslangicTarihi: l.baslangic_tarihi ? l.baslangic_tarihi.slice(0, 10) : "", bitisTarihi: l.bitis_tarihi ? l.bitis_tarihi.slice(0, 10) : "", kullanici: l.kullanici_sayisi ? String(l.kullanici_sayisi) : "1", ekKullanici: l.ek_kullanici || 0, fiyat: l.fiyat ? Number(l.fiyat).toFixed(2) : "0.00", indirimOrani: l.indirim_orani || 0, netTutar: l.net_tutar ? Number(l.net_tutar).toFixed(2) : "0.00", odemeDurumu: l.odeme_durumu || "odenmedi", odemeYontemi: l.odeme_yontemi || "", faturaGeldi: !!l.fatura_geldi, lisansAnahtari: l.lisans_anahtari || "", otomatikYenileme: !!l.otomatik_yenileme, bildirimGun: l.bildirim_gun || 30, notlar: l.notlar || "", suresiz: !!l.suresiz, macAdresi: l.mac_adresi || "", ipAdresi: l.ip_adresi || "", moduller: l.moduller || null, musteriId: l.musteri_id, bayiId: l.bayi_id, lisansTipiId: l.lisans_tipi_id, surumId: l.surum_id }))); });
                              }
                            } catch (e) { alert(e.message || "Geri alma başarısız."); }
                          }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            Geri Al
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {bilgiDetay.notlar && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">Notlar</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{bilgiDetay.notlar}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Bilgi yüklenemedi.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-white/10 shrink-0">
              <button onClick={() => { setBilgiModal(null); setBilgiDetay(null); }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Domain Transfer Modalı ========== */}
      {transferModal && bilgiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setTransferModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h4 className="font-bold text-white">Domain Transfer</h4>
                <p className="text-white/70 text-xs">{bilgiDetay?.domain}</p>
              </div>
              <button onClick={() => setTransferModal(false)} className="text-white/70 hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={LABEL_STIL}>Hedef Müşteri</label>
                <input type="text" value={transferArama} onChange={(e) => setTransferArama(e.target.value)} placeholder="Müşteri adı ara..."
                  className={INPUT_STIL} />
              </div>
              {transferArama.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg">
                  {tumMusteriler.filter(m => (m.ad_soyad || m.sirket_adi || "").toLowerCase().includes(transferArama.toLowerCase())).slice(0, 20).map((m) => (
                    <button key={m.id} onClick={() => { setTransferMusteri(m); setTransferArama(m.ad_soyad || m.sirket_adi || `#${m.id}`); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-100 dark:border-white/5 last:border-0 ${transferMusteri?.id === m.id ? "bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 font-medium" : "text-gray-700 dark:text-slate-300"}`}>
                      <p className="font-medium">{m.ad_soyad || m.sirket_adi || `Müşteri #${m.id}`}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{m.eposta || ""} {m.tur === "tuzel" ? "• Tüzel" : m.tur === "yabanci" ? "• Yabancı" : "• Gerçek"}</p>
                    </button>
                  ))}
                  {tumMusteriler.filter(m => (m.ad_soyad || m.sirket_adi || "").toLowerCase().includes(transferArama.toLowerCase())).length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-400 dark:text-slate-500 text-center">Eşleşen müşteri bulunamadı.</p>
                  )}
                </div>
              )}
              {transferMusteri && (
                <div className="p-3 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-200 dark:border-fuchsia-500/20">
                  <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-medium">Seçilen: {transferMusteri.ad_soyad || transferMusteri.sirket_adi || `#${transferMusteri.id}`}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setTransferModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">İptal</button>
                <button disabled={!transferMusteri || transferYukleniyor}
                  onClick={async () => {
                    setTransferYukleniyor(true);
                    try {
                      const r = await apiPost(`/lisanslar/${bilgiDetay.id}/domain-transfer`, { hedef_musteri_id: transferMusteri.id });
                      if (r.basarili) {
                        alert(r.mesaj);
                        setTransferModal(false);
                        setBilgiModal(null); setBilgiDetay(null);
                        apiGet(`/lisanslar/musteri/${id}`).then((r2) => { if (r2.basarili) setPaketler(r2.veri.map((l) => ({ id: l.id, urun: l.urun_adi || "-", urunId: l.urun_id, paket: l.paket_adi || "-", paketId: l.paket_id, bayiAdi: l.bayi_adi || "", lisansTipi: l.lisans_tipi || "standart", domain: l.domain || "", faturaNo: l.fatura_no || "", faturaTarihi: l.fatura_tarihi ? l.fatura_tarihi.slice(0, 10) : "", kullanimGunu: l.kullanim_gunu || 365, baslangicTarihi: l.baslangic_tarihi ? l.baslangic_tarihi.slice(0, 10) : "", bitisTarihi: l.bitis_tarihi ? l.bitis_tarihi.slice(0, 10) : "", kullanici: l.kullanici_sayisi ? String(l.kullanici_sayisi) : "1", ekKullanici: l.ek_kullanici || 0, fiyat: l.fiyat ? Number(l.fiyat).toFixed(2) : "0.00", indirimOrani: l.indirim_orani || 0, netTutar: l.net_tutar ? Number(l.net_tutar).toFixed(2) : "0.00", odemeDurumu: l.odeme_durumu || "odenmedi", odemeYontemi: l.odeme_yontemi || "", faturaGeldi: !!l.fatura_geldi, lisansAnahtari: l.lisans_anahtari || "", otomatikYenileme: !!l.otomatik_yenileme, bildirimGun: l.bildirim_gun || 30, notlar: l.notlar || "", suresiz: !!l.suresiz, macAdresi: l.mac_adresi || "", ipAdresi: l.ip_adresi || "", moduller: l.moduller || null, musteriId: l.musteri_id, bayiId: l.bayi_id, lisansTipiId: l.lisans_tipi_id, surumId: l.surum_id }))); });
                      }
                    } catch (e) { alert(e.message || "Transfer başarısız."); }
                    setTransferYukleniyor(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer transition-colors">
                  {transferYukleniyor ? "Transfer ediliyor..." : "Transfer Et"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
/*  Adım adım wizard tarzı, tüm özellikler       */
/* ============================================= */

function YeniPaketModal({ musteriId, kapat, onBasarili, urunler, gruplar = [], paketler, bayiler, lisansTipleri, git }) {
  const modalRef = useRef(null);
  const sallanma = () => { if (modalRef.current) { modalRef.current.classList.remove("sallan"); void modalRef.current.offsetWidth; modalRef.current.classList.add("sallan"); } };

  /* Seçili grup ve ürün arama */
  const [seciliGrupId, setSeciliGrupId] = useState(null);
  const [urunArama, setUrunArama] = useState("");
  const [urunDropdownAcik, setUrunDropdownAcik] = useState(false);

  /* Aktif adım: 1=Ürün, 2=Lisans, 3=Fiyat, 4=Özet */
  const [adim, setAdim] = useState(1);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  /* Şablon state */
  const [sablon, setSablon] = useState(null);
  const [sablonDegerler, setSablonDegerler] = useState({});
  const [fiyatBreakdown, setFiyatBreakdown] = useState({ temelFiyat: 0, paketFiyat: 0, ekKullaniciFiyat: 0, ekKullaniciAdet: 0, ekKullaniciBirim: 0, toplam: 0 });

  /* Form state */
  const [form, setForm] = useState({
    /* Adım 1: Ürün Seçimi */
    urunId: "",
    paketId: "",
    /* Adım 2: Lisans Bilgileri */
    lisansTipi: "standart",
    suresiz: false,
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

  /* Fiyat hesaplama yardımcısı - breakdown döndürür */
  const hesaplaToplamFiyat = (sablonData, sablonVeri, paket, ekKullaniciSayisi) => {
    let temelFiyat = 0;
    let paketFiyat = 0;
    let ekKullaniciFiyat = 0;
    let ekKullaniciBirim = 0;
    let ekKullaniciAdet = 0;
    let kademeFiyat = 0;
    let kademeAdi = "";
    let aktivasyonFiyat = 0;
    let yenilemeFiyat = 0;
    let domainFiyat = 0;
    let domainUzanti = "";
    let paketOzellikFiyat = 0;
    let paketOzellikDetay = [];
    
    // Paket özellikleri varsa parse et
    let paketOzellikler = [];
    if (paket && paket.ozellikler) {
      try {
        paketOzellikler = typeof paket.ozellikler === 'string' 
          ? JSON.parse(paket.ozellikler) 
          : paket.ozellikler;
      } catch (e) {
        paketOzellikler = [];
      }
    }
    
    if (!sablonData || !sablonData.ozellikler) {
      // Şablon yoksa sadece paket özelliklerinden hesapla
      if (paketOzellikler.length > 0) {
        paketOzellikler.forEach(oz => {
          const deger = oz.deger || {};
          let fiyat = 0;
          let detay = "";
          
          switch (oz.ozellik_tipi) {
            case "temel_fiyat":
              fiyat = Number(deger.fiyat) || 0;
              detay = `Temel Fiyat: ${fiyat} ₺`;
              break;
            case "aktivasyon_yenileme":
              fiyat = Number(deger.aktivasyon_fiyat) || 0;
              aktivasyonFiyat = fiyat;
              yenilemeFiyat = Number(deger.yenileme_fiyat) || 0;
              detay = `Aktivasyon: ${fiyat} ₺`;
              break;
            case "kullanici_sayisi":
              const min = Number(deger.min) || 1;
              ekKullaniciBirim = Number(deger.ek_kullanici_fiyat) || 0;
              detay = `${min} Kullanıcı`;
              break;
            case "kademeli_fiyat":
              if (deger.kademeler && deger.kademeler.length > 0) {
                const ilkKademe = deger.kademeler[0];
                fiyat = Number(ilkKademe.fiyat) || 0;
                detay = `Kademe: ${ilkKademe.adet || ilkKademe.kapasite} ${ilkKademe.birim || ""} - ${fiyat} ₺`;
              }
              break;
            default:
              if (deger.fiyat) {
                fiyat = Number(deger.fiyat) || 0;
                detay = `${oz.ozellik_adi}: ${fiyat} ₺`;
              }
          }
          
          if (fiyat > 0) {
            paketOzellikFiyat += fiyat;
            paketOzellikDetay.push(detay);
          }
        });
      }
      
      return {
        temelFiyat: 0,
        paketFiyat: paket ? Number(paket.fiyati) || 0 : 0,
        ekKullaniciFiyat: 0,
        ekKullaniciAdet: 0,
        ekKullaniciBirim: 0,
        kademeFiyat: 0,
        kademeAdi: "",
        aktivasyonFiyat,
        yenilemeFiyat,
        domainFiyat: 0,
        domainUzanti: "",
        paketOzellikFiyat,
        paketOzellikDetay,
        toplam: (paket ? Number(paket.fiyati) || 0 : 0) + paketOzellikFiyat
      };
    }

    // 1. Şablondan temel fiyat
    const temelFiyatOz = sablonData.ozellikler.find(oz => oz.ozellik_tipi === "temel_fiyat");
    if (temelFiyatOz) {
      const deger = sablonVeri[temelFiyatOz.id] || temelFiyatOz.deger || {};
      temelFiyat = Number(deger.fiyat) || 0;
    }
    
    // 2. Kademeli fiyat (Bireysel/Kurumsal/Profesyonel vb.)
    const kademeliOz = sablonData.ozellikler.find(oz => oz.ozellik_tipi === "kademeli_fiyat");
    if (kademeliOz) {
      const deger = sablonVeri[kademeliOz.id] || kademeliOz.deger || {};
      const kademeler = Array.isArray(deger.kademeler) ? deger.kademeler : [];
      const tip = deger.tip || "adet";
      const birimKey = tip === "kapasite" ? "kapasite" : "adet";
      // Her kademe için hem adet hem kapasite alanını kontrol et
      const ilkKademe = kademeler.length > 0 ? kademeler[0] : null;
      const varsayilanSecim = ilkKademe ? (ilkKademe[birimKey] ?? ilkKademe.adet ?? ilkKademe.kapasite) : null;
      const seciliKademe = deger.secili_kademe ?? varsayilanSecim;
      // Kademeyi bul - her iki alanı da kontrol et
      const kademe = kademeler.find(k => (k[birimKey] ?? k.adet ?? k.kapasite) == seciliKademe);
      if (kademe) {
        kademeFiyat = Number(kademe.fiyat) || 0;
        const kademeValue = kademe[birimKey] ?? kademe.adet ?? kademe.kapasite;
        kademeAdi = `${kademeValue} ${kademe.birim || ""}`;
      }
    }
    
    // 3. Aktivasyon/Yenileme fiyatı
    const aktivasyonOz = sablonData.ozellikler.find(oz => oz.ozellik_tipi === "aktivasyon_yenileme");
    if (aktivasyonOz) {
      const deger = sablonVeri[aktivasyonOz.id] || aktivasyonOz.deger || {};
      aktivasyonFiyat = Number(deger.aktivasyon_fiyat) || 0;
      yenilemeFiyat = Number(deger.yenileme_fiyat) || 0;
    }
    
    // 4. Domain fiyatı
    const domainOz = sablonData.ozellikler.find(oz => oz.ozellik_tipi === "domain_fiyat");
    if (domainOz) {
      const deger = sablonVeri[domainOz.id] || domainOz.deger || {};
      const uzantilar = Array.isArray(deger.uzantilar) ? deger.uzantilar : [];
      const seciliUzanti = deger.secili_uzanti || (uzantilar.length > 0 ? uzantilar[0].uzanti : null);
      const uzanti = uzantilar.find(u => u.uzanti === seciliUzanti);
      if (uzanti) {
        domainFiyat = Number(uzanti.aktivasyon) || 0;
        domainUzanti = uzanti.uzanti || "";
      }
    }
    
    // 5. Paket fiyatı
    if (paket) {
      paketFiyat = Number(paket.fiyati) || 0;
    }
    
    // 6. Ek kullanıcı fiyatı - şablondan hesapla
    const kullaniciOz = sablonData.ozellikler.find(oz => oz.ozellik_tipi === "kullanici_sayisi");
    if (kullaniciOz) {
      const orijinalDeger = kullaniciOz.deger || {};
      const secilenDeger = sablonVeri[kullaniciOz.id] || orijinalDeger;
      const orijinalMin = Number(orijinalDeger.min) || 1;
      const secilenMin = Number(secilenDeger.min) || orijinalMin;
      ekKullaniciBirim = Number(orijinalDeger.ek_kullanici_fiyat) || 0;
      
      // Ek kullanıcı = seçilen - orijinal min
      const hesaplananEk = secilenMin - orijinalMin;
      const toplamEk = Math.max(0, hesaplananEk) + (Number(ekKullaniciSayisi) || 0);
      ekKullaniciFiyat = toplamEk * ekKullaniciBirim;
      ekKullaniciAdet = toplamEk;
    }
    
    // 7. Paket özelliklerinden ek fiyatlar (şablonda olmayan özellikler)
    if (paketOzellikler.length > 0) {
      paketOzellikler.forEach(oz => {
        const deger = oz.deger || {};
        let fiyat = 0;
        let detay = "";
        
        // Şablonda zaten işlenen tipleri atla
        const sablondaVar = sablonData.ozellikler.some(s => s.ozellik_tipi === oz.ozellik_tipi);
        if (sablondaVar) return;
        
        switch (oz.ozellik_tipi) {
          case "temel_fiyat":
            fiyat = Number(deger.fiyat) || 0;
            if (fiyat > 0) detay = `Paket Temel Fiyat: ${fiyat} ₺`;
            break;
          case "aktivasyon_yenileme":
            fiyat = Number(deger.aktivasyon_fiyat) || 0;
            if (fiyat > 0) {
              aktivasyonFiyat += fiyat;
              detay = `Paket Aktivasyon: ${fiyat} ₺`;
            }
            break;
          case "kademeli_fiyat":
            if (deger.kademeler && deger.kademeler.length > 0) {
              const ilkKademe = deger.kademeler[0];
              fiyat = Number(ilkKademe.fiyat) || 0;
              if (fiyat > 0) detay = `Paket Kademe: ${fiyat} ₺`;
            }
            break;
          default:
            if (deger.fiyat) {
              fiyat = Number(deger.fiyat) || 0;
              if (fiyat > 0) detay = `${oz.ozellik_adi}: ${fiyat} ₺`;
            }
        }
        
        if (fiyat > 0) {
          paketOzellikFiyat += fiyat;
          paketOzellikDetay.push(detay);
        }
      });
    }
    
    // Toplam hesapla (aktivasyon_yenileme varsa aktivasyon fiyatı, yoksa temel fiyat)
    const anaFiyat = aktivasyonFiyat > 0 ? aktivasyonFiyat : temelFiyat;
    const toplam = anaFiyat + paketFiyat + ekKullaniciFiyat + kademeFiyat + domainFiyat + paketOzellikFiyat;
    
    // KDV hesapla
    const kdvAktif = sablonData?.kdv_aktif || false;
    const kdvOran = sablonData?.kdv_oran ?? 20;
    const kdvTutar = kdvAktif ? toplam * kdvOran / 100 : 0;
    const toplamKdvli = toplam + kdvTutar;
    
    return {
      temelFiyat,
      paketFiyat,
      ekKullaniciFiyat,
      ekKullaniciAdet,
      ekKullaniciBirim,
      kademeFiyat,
      kademeAdi,
      aktivasyonFiyat,
      yenilemeFiyat,
      domainFiyat,
      domainUzanti,
      paketOzellikFiyat,
      paketOzellikDetay,
      toplam,
      kdvAktif,
      kdvOran,
      kdvTutar,
      toplamKdvli
    };
  };

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
        const tip = lisansTipleri.find((t) => t.id === deger);
        if (tip) {
          /* Lisans tipi her zaman süreyi belirler */
          yeni.kullanimGunu = tip.gun;
          yeni.bitisTarihi = tarihEkle(o.baslangicTarihi, tip.gun);
        }
      }
      
      if (alan === "paketId" && deger) {
        const paket = paketler.find((p) => p.id === Number(deger));
        if (paket) {
          /* Sadece kullanıcı sayısı paketten alınır - süre lisans tipinden gelir */
          yeni.kullaniciSayisi = paket.kullaniciSayisi || 1;
          /* Fiyat hesaplaması useEffect'te yapılacak */
        }
      }
      
      /* Paket kaldırılırsa varsayılan değerlere dön */
      if (alan === "paketId" && !deger) {
        yeni.kullaniciSayisi = 1;
        /* Süre zaten lisans tipinden geliyor - ek işlem gerekmez */
        /* Fiyat hesaplaması useEffect'te yapılacak */
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

  /* Fiyat hesaplama useEffect */
  useEffect(() => {
    const breakdown = hesaplaToplamFiyat(sablon, sablonDegerler, seciliPaket, form.ekKullanici);
    setFiyatBreakdown(breakdown);
    const brutFiyat = breakdown.kdvAktif ? breakdown.toplamKdvli : breakdown.toplam;
    if (brutFiyat !== form.fiyat) {
      setForm(o => {
        const brut = brutFiyat;
        const tutar = brut * o.indirimOrani / 100;
        return {
          ...o,
          fiyat: brut,
          indirimTutari: tutar,
          netTutar: brut - tutar
        };
      });
    }
  }, [sablon, sablonDegerler, seciliPaket, form.ekKullanici]);

  /* Ürün seçildiğinde */
  const urunSec = async (urunId) => {
    guncelle("urunId", urunId);
    guncelle("paketId", "");
    /* Ürünün şablonunu getir */
    try {
      const res = await apiGet(`/urunler/${urunId}/sablon`);
      if (res.basarili && res.veri) {
        setSablon(res.veri);
        /* Şablon özellik varsayılan değerlerini hazırla */
        const varsayilanlar = {};
        (res.veri.ozellikler || []).forEach((oz) => {
          varsayilanlar[oz.id] = oz.deger || {};
        });
        setSablonDegerler(varsayilanlar);
      } else {
        setSablon(null);
        setSablonDegerler({});
      }
    } catch {
      setSablon(null);
      setSablonDegerler({});
    }
  };

  /* Adım validasyonu */
  const adimGecerliMi = (a) => {
    switch (a) {
      case 1: return !!form.urunId;
      case 2: return !!form.baslangicTarihi && (form.suresiz || !!form.bitisTarihi);
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
        suresiz: form.suresiz,
        baslangic_tarihi: form.baslangicTarihi,
        bitis_tarihi: form.suresiz ? null : form.bitisTarihi,
        kullanim_gunu: form.suresiz ? 0 : Number(form.kullanimGunu),
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
        sablon_verileri: Object.keys(sablonDegerler).length > 0 ? sablonDegerler : null,
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
      <div ref={modalRef} className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-h-[90vh] flex flex-col transition-all ${adim === 2 ? "max-w-5xl" : "max-w-3xl"}`} onClick={(e) => e.stopPropagation()}>

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
        <div className={`flex-1 p-6 ${adim === 1 && urunDropdownAcik ? "overflow-visible" : "overflow-y-auto"}`}>
          {/* Adım 1: Grup ve Ürün Seçimi */}
          {adim === 1 && (
            <div className="space-y-5">
              {/* Ürün Arama ve Seçim - Combobox */}
              <div className="relative">
                <label className={LABEL_STIL}>Ürün veya Kategori Ara <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Ürün veya kategori adı yazarak arayın..."
                      value={urunArama}
                      onChange={(e) => { setUrunArama(e.target.value); setUrunDropdownAcik(true); }}
                      onFocus={() => setUrunDropdownAcik(true)}
                      className={`${INPUT_STIL} pl-10 pr-10`}
                    />
                    {urunArama && (
                      <button onClick={() => { setUrunArama(""); setUrunDropdownAcik(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown Listesi */}
                  {urunDropdownAcik && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-72 overflow-auto">
                      {/* Grupları ve Ürünleri Listele */}
                      {gruplar.map((g) => {
                        const aramaKucuk = urunArama.toLowerCase();
                        const grupEslesiyor = g.ad.toLowerCase().includes(aramaKucuk);
                        const grupUrunleri = urunler.filter((u) => u.aktif && u.grup_id === g.id && (grupEslesiyor || u.ad.toLowerCase().includes(aramaKucuk)));
                        if (grupUrunleri.length === 0) return null;
                        
                        return (
                          <div key={g.id}>
                            {/* Grup Başlığı */}
                            <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 sticky top-0 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              {g.ad}
                              <span className="ml-auto text-gray-400">({grupUrunleri.length})</span>
                            </div>
                            {/* Ürünler */}
                            {grupUrunleri.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => {
                                  urunSec(u.id);
                                  setSeciliGrupId(g.id);
                                  setUrunArama("");
                                  setUrunDropdownAcik(false);
                                }}
                                className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-3 ${
                                  form.urunId === u.id ? "bg-blue-50 dark:bg-blue-500/10" : ""
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  form.urunId === u.id ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400"
                                }`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${form.urunId === u.id ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>{u.ad}</p>
                                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.urun_tipi || u.grubu || g.ad}</p>
                                </div>
                                {form.urunId === u.id && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                      {/* Sonuç Yoksa */}
                      {(() => {
                        const aramaKucuk = urunArama.toLowerCase();
                        const sonucVar = gruplar.some(g => {
                          const grupEslesiyor = g.ad.toLowerCase().includes(aramaKucuk);
                          return urunler.some(u => u.aktif && u.grup_id === g.id && (grupEslesiyor || u.ad.toLowerCase().includes(aramaKucuk)));
                        });
                        if (sonucVar) return null;
                        return (
                          <div className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">"{urunArama}" ile eşleşen ürün veya kategori bulunamadı</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {/* Seçili Ürün Gösterimi */}
                {form.urunId && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{seciliUrun?.ad}</p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{gruplar.find(g => g.id === seciliGrupId)?.ad} • {seciliUrun?.urun_tipi || "Genel"}</p>
                      </div>
                      <button 
                        onClick={() => { guncelle("urunId", ""); guncelle("paketId", ""); setSeciliGrupId(null); }}
                        className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dropdown dışına tıklandığında kapat */}
              {urunDropdownAcik && (
                <div className="fixed inset-0 z-40" onClick={() => setUrunDropdownAcik(false)} />
              )}

              {/* Paket Seçimi */}
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
            <div className="flex gap-6">
              {/* Sol Taraf - Lisans Bilgileri */}
              <div className="flex-1 space-y-5">

              {/* Lisans Tipi - Kompakt kartlar */}
              <div>
                <label className={LABEL_STIL}>Lisans Tipi</label>
                {lisansTipleri.length === 0 ? (
                  <div className="mt-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Lisans tipi bulunamadı</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Lisans oluşturabilmek için önce Yönetim sekmesinden lisans tipi eklemeniz gerekiyor.</p>
                        <button
                          type="button"
                          onClick={() => { kapat(); git("/yonetim"); }}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Yönetim Sayfasına Git
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className={`grid gap-2 mt-1 ${({ 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" })[lisansTipleri.length] || "grid-cols-4"}`}>
                  {lisansTipleri.map((t) => {
                    const secili = form.lisansTipi === t.id;
                    const renkler = {
                      purple: secili ? "border-purple-500 bg-purple-50 dark:bg-purple-500/15 ring-1 ring-purple-500" : "",
                      blue: secili ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15 ring-1 ring-blue-500" : "",
                      emerald: secili ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 ring-1 ring-emerald-500" : "",
                      amber: secili ? "border-amber-500 bg-amber-50 dark:bg-amber-500/15 ring-1 ring-amber-500" : ""
                    };
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          guncelle("lisansTipi", t.id);
                          if (t.suresiz) {
                            setForm(o => ({ ...o, lisansTipi: t.id, suresiz: true, kullanimGunu: 0 }));
                          } else {
                            setForm(o => ({ ...o, lisansTipi: t.id, suresiz: false, kullanimGunu: t.gun, bitisTarihi: tarihEkle(o.baslangicTarihi, t.gun) }));
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          secili ? renkler[t.renk] : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${secili ? `text-${t.renk}-700 dark:text-${t.renk}-400` : "text-gray-700 dark:text-slate-300"}`}>{t.ad}</p>
                        <p className={`text-[11px] mt-0.5 ${secili ? `text-${t.renk}-600 dark:text-${t.renk}-500` : "text-gray-400"}`}>{t.suresiz ? "♾ Süresiz" : `${t.gun} gün`}</p>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>

              {/* Tarih Bilgileri - Lisans tipine göre */}
              {!form.suresiz ? (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={LABEL_STIL}>Başlangıç Tarihi <span className="text-red-500">*</span></label>
                    <input type="date" value={form.baslangicTarihi} onChange={(e) => guncelle("baslangicTarihi", e.target.value)} className={INPUT_STIL} />
                  </div>
                  <div className="flex items-end gap-2 text-sm text-gray-500 dark:text-slate-400 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium">{form.kullanimGunu} gün</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label className={LABEL_STIL}>Bitiş Tarihi</label>
                    <input type="date" value={form.bitisTarihi} className={`${INPUT_STIL} bg-gray-50 dark:bg-white/5 cursor-not-allowed`} readOnly />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Süresiz Lisans</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Bu lisans süresiz olarak tanımlanacaktır. Bitiş tarihi olmadan geçerli kalacaktır.</p>
                      <div className="mt-3 flex gap-4">
                        <div>
                          <label className={`${LABEL_STIL} text-emerald-700 dark:text-emerald-400`}>Başlangıç Tarihi</label>
                          <input type="date" value={form.baslangicTarihi} onChange={(e) => guncelle("baslangicTarihi", e.target.value)} className={`${INPUT_STIL} border-emerald-300 dark:border-emerald-500/30 max-w-[160px]`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Şablon Özellikleri (Ürüne özel alanlar) */}
              {sablon && sablon.ozellikler && sablon.ozellikler.length > 0 && (() => {
                /* Özellikleri mantıklı sıraya göre sırala:
                   1. sicil_domain (önce müşteriyi tanımla)
                   2. kademeli_fiyat (paket seçimi)
                   3. domain_fiyat
                   4. kullanici_sayisi
                   5. aktivasyon_yenileme
                   6. temel_fiyat
                   7. demo_suresi
                   8. diğerleri
                */
                const siraPriority = {
                  sicil_domain: 1,
                  kademeli_fiyat: 2,
                  domain_fiyat: 3,
                  hediye_urun: 4,
                  kullanici_sayisi: 5,
                  aktivasyon_yenileme: 6,
                  temel_fiyat: 7,
                  demo_suresi: 8,
                };
                const siraliOzellikler = [...sablon.ozellikler].sort((a, b) => {
                  const aPriority = siraPriority[a.ozellik_tipi] || 99;
                  const bPriority = siraPriority[b.ozellik_tipi] || 99;
                  return aPriority - bPriority;
                });
                
                return (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-500/5 dark:to-gray-500/5 border border-gray-200 dark:border-white/10">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {sablon.ad} - Ürün Özellikleri
                    </h4>
                    <div className="space-y-4">
                      {siraliOzellikler.map((oz) => {
                        const deger = sablonDegerler[oz.id] || oz.deger || {};
                        const sablonGuncelle = (alan, val) => {
                          setSablonDegerler((prev) => ({
                            ...prev,
                            [oz.id]: { ...(prev[oz.id] || oz.deger || {}), [alan]: val },
                          }));
                        };

                        switch (oz.ozellik_tipi) {
                          case "temel_fiyat":
                            return (
                              <div key={oz.id}>
                                <label className={LABEL_STIL}>{oz.baslik || "Temel Fiyat"} <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                  <input type="number" value={deger.fiyat || 0} onChange={(e) => sablonGuncelle("fiyat", Number(e.target.value))} className={INPUT_STIL + " flex-1"} min={0} step="0.01" />
                                  <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 text-sm">{deger.para_birimi || "TL"}</span>
                                </div>
                            </div>
                          );

                        case "aktivasyon_yenileme":
                          return (
                            <div key={oz.id} className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={LABEL_STIL}>Aktivasyon Fiyat <span className="text-red-500">*</span></label>
                                <div className="relative">
                                  <input type="number" value={deger.aktivasyon_fiyat || 0} onChange={(e) => sablonGuncelle("aktivasyon_fiyat", Number(e.target.value))} className={`${INPUT_STIL} pr-8`} min={0} step="0.01" />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₺</span>
                                </div>
                              </div>
                              <div>
                                <label className={LABEL_STIL}>Yenileme Fiyat</label>
                                <div className="relative">
                                  <input type="number" value={deger.yenileme_fiyat || 0} onChange={(e) => sablonGuncelle("yenileme_fiyat", Number(e.target.value))} className={`${INPUT_STIL} pr-8`} min={0} step="0.01" />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₺</span>
                                </div>
                              </div>
                            </div>
                          );

                        case "kullanici_sayisi":
                          return (
                            <div key={oz.id}>
                              <label className={LABEL_STIL}>{oz.baslik || "Kullanıcı Sayısı"}</label>
                              <div className="grid grid-cols-2 gap-3 mt-1">
                                <div className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => sablonGuncelle("min", Math.max(1, (deger.min || 1) - 1))}
                                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-gray-600 dark:text-slate-300 transition-colors"
                                  >−</button>
                                  <input 
                                    type="number" 
                                    value={deger.min || 1} 
                                    onChange={(e) => sablonGuncelle("min", Math.max(1, Number(e.target.value)))} 
                                    className={`${INPUT_STIL} text-center flex-1`} 
                                    min={1} 
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => sablonGuncelle("min", (deger.min || 1) + 1)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-gray-600 dark:text-slate-300 transition-colors"
                                  >+</button>
                                </div>
                                {deger.ek_kullanici_fiyat > 0 && (
                                  <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">+₺{Number(deger.ek_kullanici_fiyat).toLocaleString("tr-TR")}</span>
                                    <span className="ml-1">/ ek kullanıcı</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );

                          case "sicil_domain":
                          return (
                            <div key={oz.id}>
                              <label className={LABEL_STIL}>
                                {oz.baslik || (deger.alan_tipi === "domain" ? "Alan Adı" : "Sicil No")} 
                                {deger.zorunlu && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <input 
                                type="text" 
                                value={deger.deger || ""} 
                                onChange={(e) => { 
                                  const val = e.target.value;
                                  sablonGuncelle("deger", val); 
                                  guncelle("domain", val);
                                  // Domain uzantısını otomatik seç
                                  if (deger.alan_tipi === "domain" && val.includes(".")) {
                                    const domainFiyatOz = siraliOzellikler.find(o => o.ozellik_tipi === "domain_fiyat");
                                    if (domainFiyatOz) {
                                      const dfDeger = sablonDegerler[domainFiyatOz.id] || domainFiyatOz.deger || {};
                                      const uzantilar = dfDeger.uzantilar || [];
                                      // Uzantıları uzunluğuna göre sırala (uzun olanlar önce - .com.tr vs .com)
                                      const siraliUzantilar = [...uzantilar].sort((a, b) => b.uzanti.length - a.uzanti.length);
                                      for (const u of siraliUzantilar) {
                                        if (val.toLowerCase().endsWith(u.uzanti.toLowerCase())) {
                                          setSablonDegerler((prev) => ({
                                            ...prev,
                                            [domainFiyatOz.id]: { ...(prev[domainFiyatOz.id] || domainFiyatOz.deger || {}), secili_uzanti: u.uzanti }
                                          }));
                                          break;
                                        }
                                      }
                                    }
                                  }
                                }} 
                                className={INPUT_STIL}
                                placeholder={deger.alan_tipi === "domain" ? "ornek.com" : "Sicil numarasını girin"} 
                              />
                            </div>
                          );

                        case "kademeli_fiyat": {
                          const rawKademeler = deger.kademeler;
                          const kademeler = Array.isArray(rawKademeler) ? rawKademeler : [];
                          if (kademeler.length === 0) return null;
                          const tip = deger.tip || "adet";
                          // Hem adet hem kapasite alanını kontrol et
                          const birimKey = tip === "kapasite" ? "kapasite" : "adet";
                          const ilkKademe = kademeler[0] || {};
                          // İlk kademeden değeri bul - her iki alanı da kontrol et
                          const ilkDeger = ilkKademe[birimKey] ?? ilkKademe.adet ?? ilkKademe.kapasite;
                          const seciliKademe = deger.secili_kademe ?? ilkDeger;
                          return (
                            <div key={oz.id}>
                              <label className={LABEL_STIL}>{oz.baslik || "Paket Tipi"} <span className="text-red-500">*</span></label>
                              <div className="space-y-2 mt-2">
                                {kademeler.map((kademe, idx) => {
                                  // Her iki alanı da kontrol et
                                  const kademeValue = kademe[birimKey] ?? kademe.adet ?? kademe.kapasite;
                                  const birimAdi = kademe.birim || "";
                                  const fiyat = Number(kademe.fiyat || 0);
                                  const secili = seciliKademe == kademeValue;
                                  return (
                                    <label
                                      key={idx}
                                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                        secili 
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15" 
                                          : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                      }`}
                                    >
                                      <input 
                                        type="radio" 
                                        name={`kademe_${oz.id}`}
                                        checked={secili}
                                        onChange={() => sablonGuncelle("secili_kademe", kademeValue)}
                                        className="w-4 h-4 text-blue-600"
                                      />
                                      <div className="flex-1 flex items-center justify-between">
                                        <span className={`font-semibold ${secili ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}>
                                          {kademeValue} {birimAdi}
                                        </span>
                                        <span className={`font-bold ${fiyat === 0 ? "text-green-600" : secili ? "text-blue-600" : "text-gray-500"}`}>
                                          {fiyat === 0 ? "Dahil" : `+₺${fiyat.toLocaleString("tr-TR")}`}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        case "hediye_urun": {
                          const hediyeler = Array.isArray(deger.hediyeler) ? deger.hediyeler : [];
                          if (hediyeler.length === 0) return null;
                          return (
                            <div key={oz.id} className="p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200 dark:border-green-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Hediye Ürünler</span>
                              </div>
                              <p className="text-xs text-green-600 dark:text-green-500 mb-2">Bu paketle birlikte aşağıdaki ürünler ücretsiz verilecek:</p>
                              <div className="space-y-1">
                                {hediyeler.map((hediye, idx) => (
                                  <div key={idx} className="flex items-center gap-2 px-2 py-1.5 bg-white/60 dark:bg-white/5 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{hediye.ad || hediye.label || hediye}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        case "domain_fiyat": {
                          const rawUzantilar = deger.uzantilar;
                          const uzantilar = Array.isArray(rawUzantilar) ? rawUzantilar : [];
                          if (uzantilar.length === 0) return null;
                          const seciliUzanti = deger.secili_uzanti || uzantilar[0]?.uzanti || null;
                          return (
                            <div key={oz.id}>
                              <label className={LABEL_STIL}>{oz.baslik || "Domain Uzantısı"} <span className="text-red-500">*</span></label>
                              <div className="space-y-1.5 mt-1">
                                {uzantilar.map((uzanti, idx) => {
                                  const secili = seciliUzanti === uzanti.uzanti;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => sablonGuncelle("secili_uzanti", uzanti.uzanti)}
                                      className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                                        secili 
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15" 
                                          : "border-gray-200 dark:border-white/10 hover:border-gray-300"
                                      }`}
                                    >
                                      <span className={`font-mono font-semibold text-sm ${secili ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}>
                                        {uzanti.uzanti}
                                      </span>
                                      <div className="flex items-center gap-3 text-xs">
                                        <span className={secili ? "text-blue-600" : "text-gray-500"}>Akt: ₺{uzanti.aktivasyon}</span>
                                        <span className={secili ? "text-blue-600" : "text-gray-500"}>Yen: ₺{uzanti.yenileme}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        case "demo_suresi":
                          return (
                            <div key={oz.id}>
                              <label className={LABEL_STIL}>{oz.baslik || "Demo Süresi"}</label>
                              <div className="flex items-center gap-2">
                                <input type="number" value={deger.gun || 30} onChange={(e) => sablonGuncelle("gun", Number(e.target.value))} className={`${INPUT_STIL} w-24`} min={1} />
                                <span className="text-sm text-gray-500">gün</span>
                              </div>
                            </div>
                          );

                        default:
                          return null;
                      }
                    })}
                    </div>
                  </div>
                );
              })()}

              {/* Ek Ayarlar - Collapsible */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Ek Ayarlar
                </summary>
                <div className="mt-3 pl-6 space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={form.otomatikYenileme} 
                      onChange={(e) => guncelle("otomatikYenileme", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Otomatik Yenileme</p>
                      <p className="text-xs text-gray-400">Süre bitince lisansı otomatik uzat</p>
                    </div>
                  </label>
                  {form.otomatikYenileme && (
                    <div>
                      <label className={LABEL_STIL}>Bildirim Süresi (Bitiş öncesi kaç gün)</label>
                      <input type="number" value={form.bildirimGun} onChange={(e) => guncelle("bildirimGun", Number(e.target.value))} className={`${INPUT_STIL} w-32`} min={1} placeholder="30" />
                    </div>
                  )}
                </div>
              </details>
              </div>
              
              {/* Sağ Taraf - Paket Özellikleri Paneli */}
              <div className="w-72 shrink-0 border-l border-gray-200 dark:border-white/10 pl-6 space-y-4">
                {/* Paket Başlığı */}
                <div className="pb-3 border-b border-gray-200 dark:border-white/10">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {seciliPaket ? seciliPaket.adi : "Paket Seçilmedi"}
                  </h4>
                  {seciliPaket && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{seciliPaket.tipi} • {seciliPaket.kullanimGunu} gün</p>
                  )}
                </div>

                {/* Paket Özellikleri Listesi */}
                {seciliPaket && seciliPaket.ozellikler && (() => {
                  const paketOzellikler = typeof seciliPaket.ozellikler === 'string' 
                    ? JSON.parse(seciliPaket.ozellikler) 
                    : seciliPaket.ozellikler;
                  
                  if (paketOzellikler.length === 0) return (
                    <p className="text-xs text-gray-400 dark:text-slate-500 py-4 text-center">Bu pakette özellik bulunmuyor</p>
                  );

                  const ozellikStilleri = {
                    hediye_urun: { icon: "🎁", baslik: "Hediye Ürün", renk: "emerald" },
                    ek_kullanici_fiyat: { icon: "👥", baslik: "Ek Kullanıcı", renk: "blue" },
                    indirim: { icon: "🏷️", baslik: "İndirim", renk: "amber" },
                    ozel_not: { icon: "📝", baslik: "Not", renk: "purple" },
                    ek_sure: { icon: "⏱️", baslik: "Ek Süre", renk: "cyan" },
                    temel_fiyat: { icon: "💰", baslik: "Temel Fiyat", renk: "emerald" },
                    aktivasyon_yenileme: { icon: "🔄", baslik: "Aktivasyon", renk: "amber" },
                    kullanici_sayisi: { icon: "👤", baslik: "Kullanıcı", renk: "blue" },
                    sicil_domain: { icon: "🌐", baslik: "Domain", renk: "cyan" },
                    kademeli_fiyat: { icon: "📊", baslik: "Kademeli", renk: "purple" },
                    domain_fiyat: { icon: "🔗", baslik: "Domain Fiyat", renk: "teal" },
                    demo_suresi: { icon: "⏰", baslik: "Demo", renk: "rose" },
                  };

                  const degerGoster = (oz) => {
                    const d = oz.deger;
                    switch (oz.tip) {
                      case "hediye_urun": return oz.urunAdi || "Ürün hediye";
                      case "ek_kullanici_fiyat": return `+${Number(d).toLocaleString("tr-TR")}₺/kişi`;
                      case "indirim": return `%${d} indirim`;
                      case "ozel_not": return d || "-";
                      case "ek_sure": return `+${d} gün`;
                      case "temel_fiyat": return d?.fiyat ? `${Number(d.fiyat).toLocaleString("tr-TR")}₺` : "-";
                      case "aktivasyon_yenileme": return d ? `Akt: ${Number(d.aktivasyon_fiyat || 0).toLocaleString("tr-TR")}₺` : "-";
                      case "kullanici_sayisi": return d ? `${d.min || 1}-${d.max || "∞"} kişi` : "-";
                      case "sicil_domain": return d ? (d.alan_tipi === "domain" ? "Domain" : "Sicil") : "-";
                      case "kademeli_fiyat": return d?.kademeler?.length ? `${d.kademeler.length} kademe` : "-";
                      case "domain_fiyat": return d?.uzantilar?.length ? `${d.uzantilar.length} uzantı` : "-";
                      case "demo_suresi": return d?.gun ? `${d.gun} gün` : "-";
                      default: return "-";
                    }
                  };

                  return (
                    <div className="space-y-2">
                      {paketOzellikler.map((oz) => {
                        const stil = ozellikStilleri[oz.tip] || { icon: "⚙️", baslik: oz.tip, renk: "gray" };
                        return (
                          <div key={oz.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <span className="text-sm">{stil.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 dark:text-slate-300">{stil.baslik}</p>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{degerGoster(oz)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Ürün Özellikleri (Şablon) */}
                {sablon && sablon.ozellikler && sablon.ozellikler.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                    <h5 className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ürün Özellikleri
                    </h5>
                    <div className="space-y-1">
                      {sablon.ozellikler.slice(0, 5).map((oz) => (
                        <div key={oz.id} className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                          {oz.baslik || oz.ozellik_tipi}
                        </div>
                      ))}
                      {sablon.ozellikler.length > 5 && (
                        <p className="text-[10px] text-gray-400">+{sablon.ozellikler.length - 5} özellik daha</p>
                      )}
                    </div>
                  </div>
                )}

                {!seciliPaket && (
                  <div className="py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Adım 1'de paket seçin</p>
                  </div>
                )}
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
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Fiyat Detayı</h4>
                
                {/* Sade Fiyat Breakdown */}
                <div className="mb-4 space-y-2 text-sm">
                  {fiyatBreakdown.aktivasyonFiyat > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 dark:border-white/10">
                      <span className="text-gray-600 dark:text-slate-400">Aktivasyon</span>
                      <span className="font-medium">₺{fiyatBreakdown.aktivasyonFiyat.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.temelFiyat > 0 && !fiyatBreakdown.aktivasyonFiyat && (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 dark:border-white/10">
                      <span className="text-gray-600 dark:text-slate-400">Temel Fiyat</span>
                      <span className="font-medium">₺{fiyatBreakdown.temelFiyat.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.kademeFiyat > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 dark:border-white/10">
                      <span className="text-gray-600 dark:text-slate-400">Paket ({fiyatBreakdown.kademeAdi})</span>
                      <span className="font-medium">₺{fiyatBreakdown.kademeFiyat.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.domainFiyat > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 dark:border-white/10">
                      <span className="text-gray-600 dark:text-slate-400">Domain ({fiyatBreakdown.domainUzanti})</span>
                      <span className="font-medium">₺{fiyatBreakdown.domainFiyat.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.paketFiyat > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 dark:border-white/10">
                      <span className="text-gray-600 dark:text-slate-400">Ürün Paketi</span>
                      <span className="font-medium">₺{fiyatBreakdown.paketFiyat.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.paketOzellikFiyat > 0 && (
                    <div className="py-1.5 border-b border-gray-200 dark:border-white/10">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-slate-400">Paket Özellikleri</span>
                        <span className="font-medium">₺{fiyatBreakdown.paketOzellikFiyat.toLocaleString("tr-TR")}</span>
                      </div>
                      {fiyatBreakdown.paketOzellikDetay && fiyatBreakdown.paketOzellikDetay.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400 dark:text-slate-500 pl-2">
                          {fiyatBreakdown.paketOzellikDetay.map((detay, idx) => (
                            <div key={idx}>• {detay}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {fiyatBreakdown.ekKullaniciFiyat > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-gray-200 dark:border-white/10">
                      <span className="text-gray-600 dark:text-slate-400">Ek Kullanıcı ({fiyatBreakdown.ekKullaniciAdet}×₺{fiyatBreakdown.ekKullaniciBirim})</span>
                      <span className="font-medium">₺{fiyatBreakdown.ekKullaniciFiyat.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.yenilemeFiyat > 0 && (
                    <div className="flex justify-between py-1 text-xs text-gray-400 dark:text-slate-500">
                      <span>Sonraki yenileme</span>
                      <span>₺{fiyatBreakdown.yenilemeFiyat.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.toplam > 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-white/20">
                      <span className="font-semibold text-gray-700 dark:text-slate-300">Ara Toplam</span>
                      <span className="font-bold text-gray-900 dark:text-white">₺{fiyatBreakdown.toplam.toLocaleString("tr-TR")}</span>
                    </div>
                  )}
                  {fiyatBreakdown.kdvAktif && fiyatBreakdown.toplam > 0 && (
                    <>
                      <div className="flex justify-between py-1.5 text-blue-600 dark:text-blue-400">
                        <span>KDV (%{fiyatBreakdown.kdvOran})</span>
                        <span>+₺{fiyatBreakdown.kdvTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-300 dark:border-blue-500/30">
                        <span className="font-bold text-gray-700 dark:text-slate-200">Genel Toplam (KDV Dahil)</span>
                        <span className="font-bold text-blue-700 dark:text-blue-400">₺{fiyatBreakdown.toplamKdvli.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  {(Number(form.indirimOrani) > 0 || Number(form.indirimTutari) > 0) && (
                    <>
                      <div className="flex justify-between py-1 text-red-600 dark:text-red-400">
                        <span>İndirim {form.indirimOrani > 0 ? `(%${form.indirimOrani})` : ""}</span>
                        <span>-₺{Number(form.indirimTutari).toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-emerald-300 dark:border-emerald-500/30">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Net Tutar</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">₺{Number(form.netTutar).toLocaleString("tr-TR")}</span>
                      </div>
                    </>
                  )}
                  {fiyatBreakdown.toplam === 0 && (
                    <p className="text-center py-2 text-gray-400 text-xs">Fiyat seçeneklere göre hesaplanacak</p>
                  )}
                </div>

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
                      <p className="font-medium text-gray-900 dark:text-white">{lisansTipleri.find((t) => t.id === form.lisansTipi)?.ad}</p>
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
