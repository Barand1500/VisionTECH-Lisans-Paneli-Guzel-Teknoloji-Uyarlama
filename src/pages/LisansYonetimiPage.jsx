/* ============================================= */
/*  Güzel Teknoloji - Lisans Yönetimi Sayfası    */
/*  Müşterilere tanımlanan yazılım lisanslarının  */
/*  listelenmesi, yeni lisans tanımlama, durum    */
/*  renklendirme (Smart Rows), aksiyon butonları  */
/*  Gece/Gündüz modu destekli                     */
/* ============================================= */

import { useState, useRef, useEffect } from "react";

/* ============================================= */
/*  Sabitler ve Mock Veri                          */
/* ============================================= */

/** Satılabilir ürün/paket listesi */
const PAKETLER = [
  "Vega E-Dönüşüm",
  "VEMobil Ana Modül",
  "Vega Muhasebe Pro",
  "Vega CRM Lite",
  "Vega CRM Enterprise",
  "Vega Stok Yönetimi",
  "Vega İK Modülü",
  "Vega Raporlama",
];

/** Mevcut müşteriler (backend'den gelecek) */
const MEVCUT_MUSTERILER = [
  { id: 1, ad: "Ercan Güzel" },
  { id: 2, ad: "Mehmet Yılmaz" },
  { id: 3, ad: "Ayşe Kara" },
  { id: 4, ad: "ABC Teknoloji A.Ş." },
  { id: 5, ad: "Veri Sistemleri Ltd." },
  { id: 6, ad: "Mega Bilişim A.Ş." },
  { id: 7, ad: "Anadolu Teknoloji" },
];

/** Başlangıç lisans verileri */
const BASLANGIC_LISANSLAR = [
  { id: 1, musteriId: 4, musteriAd: "ABC Teknoloji A.Ş.", paket: "Vega E-Dönüşüm", domain: "abc-teknoloji.com.tr", baslangic: "2025-01-15", bitis: "2026-01-15", durum: "aktif" },
  { id: 2, musteriId: 2, musteriAd: "Mehmet Yılmaz", paket: "VEMobil Ana Modül", domain: "192.168.1.50", baslangic: "2025-06-01", bitis: "2026-06-01", durum: "aktif" },
  { id: 3, musteriId: 5, musteriAd: "Veri Sistemleri Ltd.", paket: "Vega CRM Enterprise", domain: "veri-crm.com", baslangic: "2024-03-10", bitis: "2026-03-10", durum: "aktif" },
  { id: 4, musteriId: 1, musteriAd: "Ercan Güzel", paket: "Vega Muhasebe Pro", domain: "ercan-muhasebe.com", baslangic: "2024-11-01", bitis: "2025-11-01", durum: "aktif" },
  { id: 5, musteriId: 6, musteriAd: "Mega Bilişim A.Ş.", paket: "Vega İK Modülü", domain: "mega-ik.internal", baslangic: "2025-02-20", bitis: "2027-02-20", durum: "aktif" },
  { id: 6, musteriId: 3, musteriAd: "Ayşe Kara", paket: "Vega CRM Lite", domain: "ayse-crm.com.tr", baslangic: "2024-06-15", bitis: "2025-06-15", durum: "aktif" },
  { id: 7, musteriId: 7, musteriAd: "Anadolu Teknoloji", paket: "Vega Stok Yönetimi", domain: "anadolu-stok.net", baslangic: "2023-09-01", bitis: "2025-09-01", durum: "dondurulmuş" },
  { id: 8, musteriId: 4, musteriAd: "ABC Teknoloji A.Ş.", paket: "Vega Raporlama", domain: "abc-rapor.com.tr", baslangic: "2024-01-01", bitis: "2025-01-01", durum: "aktif" },
];

/** Süre seçenekleri */
const SURE_SECENEKLERI = [
  { etiket: "1 Yıllık", deger: 12 },
  { etiket: "2 Yıllık", deger: 24 },
  { etiket: "Özel Tarih", deger: 0 },
];

const INPUT_STIL =
  "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

const LABEL_STIL =
  "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5";

/* ============================================= */
/*  Yardımcı Fonksiyonlar                          */
/* ============================================= */

/**
 * İki tarih arasındaki kalan gün sayısını hesaplar.
 *
 * Mantık:
 * 1. Bitiş tarihini Date nesnesine çevirir
 * 2. Bugünün tarihinden (saat bilgisi sıfırlanmış) farkını ms cinsinden alır
 * 3. ms → gün dönüşümü yapar: ms / (1000 * 60 * 60 * 24)
 * 4. Math.ceil ile yukarı yuvarlar (kısmi gün = 1 gün)
 * 5. Negatif sonuç = lisans süresi dolmuş demektir
 *
 * Backend entegrasyonu notu:
 * Bu fonksiyon backend'de de aynı şekilde çalıştırılmalıdır.
 * API yanıtında "kalanGun" alanı döndürülmeli veya
 * frontend'de hesaplanıp "Expired/Active/Expiring" olarak gönderilmelidir.
 */
function kalanGunHesapla(bitisTarihiStr) {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const bitis = new Date(bitisTarihiStr);
  bitis.setHours(0, 0, 0, 0);
  const farkMs = bitis.getTime() - bugun.getTime();
  return Math.ceil(farkMs / (1000 * 60 * 60 * 24));
}

/**
 * Kalan güne göre durum bilgisi ve renk sınıflarını döndürür.
 *
 * Kurallar:
 * - kalanGun <= 0        → "Süresi Dolmuş"  (kırmızı)
 * - kalanGun <= 30       → "Süresi Doluyor"  (sarı/turuncu)
 * - kalanGun > 30        → "Aktif"            (yeşil)
 * - durum === "dondurulmuş" → "Dondurulmuş"  (mavi)
 *
 * Backend'e gönderirken:
 * POST /api/lisans/:id/durum
 * body: { durum: "Active" | "Expired" | "Expiring" | "Frozen" }
 */
function durumBilgisi(kalanGun, lisansDurum) {
  if (lisansDurum === "dondurulmuş") {
    return {
      etiket: "Dondurulmuş",
      badgeSinif: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400",
      noktaSinif: "bg-sky-500",
      satirSinif: "",
      backendDurum: "Frozen",
    };
  }
  if (kalanGun <= 0) {
    return {
      etiket: "Süresi Dolmuş",
      badgeSinif: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
      noktaSinif: "bg-red-500",
      satirSinif: "bg-red-50/60 dark:bg-red-500/[0.06]",
      backendDurum: "Expired",
    };
  }
  if (kalanGun <= 30) {
    return {
      etiket: "Süresi Doluyor",
      badgeSinif: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
      noktaSinif: "bg-amber-500",
      satirSinif: "bg-amber-50/60 dark:bg-amber-500/[0.06]",
      backendDurum: "Expiring",
    };
  }
  return {
    etiket: "Aktif",
    badgeSinif: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    noktaSinif: "bg-emerald-500",
    satirSinif: "",
    backendDurum: "Active",
  };
}

/** Tarihi dd.MM.yyyy formatında gösterir */
function tarihFormatla(tarihStr) {
  const d = new Date(tarihStr);
  const gun = String(d.getDate()).padStart(2, "0");
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  return `${gun}.${ay}.${d.getFullYear()}`;
}

/** Bugünden `aySayisi` ay sonrasının tarihini YYYY-MM-DD formatında döndürür */
function aySonrasiTarih(aySayisi) {
  const d = new Date();
  d.setMonth(d.getMonth() + aySayisi);
  return d.toISOString().slice(0, 10);
}

/* ============================================= */
/*  Ana Bileşen: LisansYonetimiPage                */
/* ============================================= */

export default function LisansYonetimiPage() {
  const [lisanslar, setLisanslar] = useState(BASLANGIC_LISANSLAR);
  const [arama, setArama] = useState("");
  const [kartFiltre, setKartFiltre] = useState(null);
  const [formAcik, setFormAcik] = useState(false);
  const [formSalla, setFormSalla] = useState(false);
  const [hatalar, setHatalar] = useState({});

  /* ---- Müşteri Seçimi Autocomplete ---- */
  const [musteriArama, setMusteriArama] = useState("");
  const [musteriAcik, setMusteriAcik] = useState(false);
  const [secilenMusteri, setSecilenMusteri] = useState(null);
  const musteriRef = useRef(null);

  /* ---- Yeni Lisans Form State ---- */
  const bosForm = { paket: "", domain: "", sureTipi: 12, ozelBitis: "" };
  const [form, setForm] = useState(bosForm);

  /* ---- Autocomplete dışına tıklama ---- */
  useEffect(() => {
    const disariTikla = (e) => {
      if (musteriRef.current && !musteriRef.current.contains(e.target)) {
        setMusteriAcik(false);
      }
    };
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, []);

  /* ---- ESC engelleme (modal açıkken) ---- */
  useEffect(() => {
    if (!formAcik) return;
    const escEngelle = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        sallanmaTetikle();
      }
    };
    window.addEventListener("keydown", escEngelle);
    return () => window.removeEventListener("keydown", escEngelle);
  }, [formAcik]);

  /* ---- Sallanma efekti ---- */
  const sallanmaTetikle = () => {
    setFormSalla(true);
    setTimeout(() => setFormSalla(false), 500);
  };

  /* ---- Filtrelenmiş müşteriler ---- */
  const filtrelenmisMusteri = MEVCUT_MUSTERILER.filter((m) =>
    m.ad.toLowerCase().includes(musteriArama.toLowerCase())
  );

  /* ---- Arama + Kart Filtreleme ---- */
  const filtreliLisanslar = lisanslar.filter((l) => {
    const aramaUygun =
      l.musteriAd.toLowerCase().includes(arama.toLowerCase()) ||
      l.paket.toLowerCase().includes(arama.toLowerCase()) ||
      l.domain.toLowerCase().includes(arama.toLowerCase());
    if (!aramaUygun) return false;
    if (!kartFiltre) return true;
    if (kartFiltre === "toplam") return true;
    const kg = kalanGunHesapla(l.bitis);
    if (kartFiltre === "aktif") return kg > 30 && l.durum !== "dondurulmu\u015f";
    if (kartFiltre === "suresiDoluyor") return kg > 0 && kg <= 30 && l.durum !== "dondurulmu\u015f";
    if (kartFiltre === "suresiDolmus") return kg <= 0 && l.durum !== "dondurulmu\u015f";
    return true;
  });

  /* ---- Form alan güncelleme ---- */
  const alanGuncelle = (alan, deger) => {
    setForm((o) => ({ ...o, [alan]: deger }));
    if (hatalar[alan]) {
      setHatalar((o) => { const y = { ...o }; delete y[alan]; return y; });
    }
  };

  /* ---- Form doğrulama ---- */
  const formuDogrula = () => {
    const h = {};
    if (!secilenMusteri) h.musteri = "Müşteri seçimi zorunludur.";
    if (!form.paket) h.paket = "Paket seçimi zorunludur.";
    if (!form.domain.trim()) h.domain = "Domain/URL zorunludur.";
    if (form.sureTipi === 0 && !form.ozelBitis) h.ozelBitis = "Bitiş tarihi seçiniz.";
    setHatalar(h);
    return Object.keys(h).length === 0;
  };

  /* ---- Yeni Lisans Kaydet ---- */
  const lisansKaydet = (e) => {
    e.preventDefault();
    if (!formuDogrula()) return;

    const bugun = new Date().toISOString().slice(0, 10);
    const bitisTarihi = form.sureTipi === 0
      ? form.ozelBitis
      : aySonrasiTarih(form.sureTipi);

    const yeniLisans = {
      id: Date.now(),
      musteriId: secilenMusteri.id,
      musteriAd: secilenMusteri.ad,
      paket: form.paket,
      domain: form.domain,
      baslangic: bugun,
      bitis: bitisTarihi,
      durum: "aktif",
    };

    console.log("🔑 Yeni lisans verisi (backend'e gönderilecek):", yeniLisans);

    /*
      TODO: Backend API çağrısı
      const yanit = await fetch('/api/lisanslar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yeniLisans),
      });
    */

    setLisanslar((o) => [...o, yeniLisans]);
    setForm(bosForm);
    setSecilenMusteri(null);
    setMusteriArama("");
    setHatalar({});
    setFormAcik(false);
  };

  /* ---- Lisans Yenile (süresini 1 yıl uzat) ---- */
  const lisansYenile = (id) => {
    setLisanslar((o) =>
      o.map((l) => {
        if (l.id !== id) return l;
        const yeniBitis = new Date(l.bitis);
        yeniBitis.setFullYear(yeniBitis.getFullYear() + 1);
        console.log(`🔄 Lisans yenilendi (ID: ${id}) → Yeni bitiş: ${yeniBitis.toISOString().slice(0, 10)}`);
        return { ...l, bitis: yeniBitis.toISOString().slice(0, 10), durum: "aktif" };
      })
    );
  };

  /* ---- Lisans Dondur/Aktifleştir ---- */
  const lisansDondur = (id) => {
    setLisanslar((o) =>
      o.map((l) => {
        if (l.id !== id) return l;
        const yeniDurum = l.durum === "dondurulmuş" ? "aktif" : "dondurulmuş";
        console.log(`❄️ Lisans durum değişikliği (ID: ${id}) → ${yeniDurum}`);
        return { ...l, durum: yeniDurum };
      })
    );
  };

  /* ---- Özet İstatistikler ---- */
  const istatistikler = {
    toplam: lisanslar.length,
    aktif: lisanslar.filter((l) => {
      const kg = kalanGunHesapla(l.bitis);
      return kg > 30 && l.durum !== "dondurulmuş";
    }).length,
    suresiDoluyor: lisanslar.filter((l) => {
      const kg = kalanGunHesapla(l.bitis);
      return kg > 0 && kg <= 30 && l.durum !== "dondurulmuş";
    }).length,
    suresiDolmus: lisanslar.filter((l) => kalanGunHesapla(l.bitis) <= 0 && l.durum !== "dondurulmuş").length,
  };

  /* ============================================= */
  /*  Sayfa Render                                  */
  /* ============================================= */

  return (
    <div>
      {/* ---- Sayfa Başlığı ---- */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lisans Yönetimi</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Müşteri lisanslarını görüntüleyin, yenileyin ve yönetin.</p>
        </div>
        <button
          onClick={() => setFormAcik(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Lisans Tanımla
        </button>
      </div>

      {/* ---- Özet Kartları ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { etiket: "Toplam Lisans", deger: istatistikler.toplam, renk: "text-blue-600 dark:text-blue-400", ikon: "🔑", filtre: "toplam", borderRenk: "border-blue-500 dark:border-blue-400" },
          { etiket: "Aktif", deger: istatistikler.aktif, renk: "text-emerald-600 dark:text-emerald-400", ikon: "✅", filtre: "aktif", borderRenk: "border-emerald-500 dark:border-emerald-400" },
          { etiket: "Süresi Doluyor", deger: istatistikler.suresiDoluyor, renk: "text-amber-600 dark:text-amber-400", ikon: "⚠️", filtre: "suresiDoluyor", borderRenk: "border-amber-500 dark:border-amber-400" },
          { etiket: "Süresi Dolmuş", deger: istatistikler.suresiDolmus, renk: "text-red-600 dark:text-red-400", ikon: "❌", filtre: "suresiDolmus", borderRenk: "border-red-500 dark:border-red-400" },
        ].map((k) => (
          <div
            key={k.etiket}
            onClick={() => setKartFiltre(kartFiltre === k.filtre ? null : k.filtre)}
            className={`rounded-xl bg-white dark:bg-white/5 border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              kartFiltre === k.filtre
                ? `${k.borderRenk} shadow-md`
                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 dark:text-slate-400">{k.etiket}</p>
              <span className="text-lg">{k.ikon}</span>
            </div>
            <p className={`text-2xl font-bold ${k.renk}`}>{k.deger}</p>
          </div>
        ))}
      </div>

      {/* ---- Arama ---- */}
      <div className="mb-6">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Müşteri adı, paket veya domain ile arayın..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        </div>
      </div>

      {/* ============================================= */}
      {/*  Lisans Tablosu (Smart Rows)                  */}
      {/* ============================================= */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Müşteri Adı</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Ürün/Paket</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Domain/URL</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Başlangıç</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Bitiş</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Kalan Gün</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Durum</th>
                <th className="text-center px-5 py-4 font-semibold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtreliLisanslar.length > 0 ? (
                filtreliLisanslar.map((lisans) => {
                  const kalan = kalanGunHesapla(lisans.bitis);
                  const durum = durumBilgisi(kalan, lisans.durum);

                  return (
                    <tr
                      key={lisans.id}
                      className={`hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${durum.satirSinif}`}
                    >
                      {/* Müşteri Adı */}
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{lisans.musteriAd}</td>

                      {/* Ürün/Paket */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium">
                          {lisans.paket}
                        </span>
                      </td>

                      {/* Domain */}
                      <td className="px-5 py-4 text-gray-600 dark:text-slate-400 font-mono text-xs">{lisans.domain}</td>

                      {/* Başlangıç */}
                      <td className="px-5 py-4 text-center text-gray-600 dark:text-slate-400">{tarihFormatla(lisans.baslangic)}</td>

                      {/* Bitiş */}
                      <td className="px-5 py-4 text-center text-gray-600 dark:text-slate-400">{tarihFormatla(lisans.bitis)}</td>

                      {/* Kalan Gün */}
                      <td className="px-5 py-4 text-center">
                        <span className={`font-bold ${kalan <= 0 ? "text-red-600 dark:text-red-400" : kalan <= 30 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>
                          {kalan <= 0 ? `${Math.abs(kalan)} gün geçmiş` : `${kalan} gün`}
                        </span>
                      </td>

                      {/* Durum Badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${durum.badgeSinif}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${durum.noktaSinif}`} />
                          {durum.etiket}
                        </span>
                      </td>

                      {/* Aksiyonlar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Yenile */}
                          <button
                            onClick={() => lisansYenile(lisans.id)}
                            className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Lisansı 1 yıl uzat"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          {/* Dondur/Aktifleştir */}
                          <button
                            onClick={() => lisansDondur(lisans.id)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${lisans.durum === "dondurulmuş" ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10" : "text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10"}`}
                            title={lisans.durum === "dondurulmuş" ? "Aktifleştir" : "Dondur"}
                          >
                            {lisans.durum === "dondurulmuş" ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          {/* Detay */}
                          <button
                            onClick={() => alert(`Detay Sayfası:\nMüşteri: ${lisans.musteriAd}\nPaket: ${lisans.paket}\nDomain: ${lisans.domain}\nBaşlangıç: ${tarihFormatla(lisans.baslangic)}\nBitiş: ${tarihFormatla(lisans.bitis)}\nKalan: ${kalan > 0 ? kalan + " gün" : Math.abs(kalan) + " gün geçmiş"}`)}
                            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="Detay"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400 dark:text-slate-500">
                    "{arama}" ile eşleşen lisans bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================= */}
      {/*  Yeni Lisans Tanımlama Modalı                 */}
      {/* ============================================= */}
      {formAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Arkaplan overlay - tıklayınca sallanma */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={sallanmaTetikle} />

          {/* Modal içerik */}
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 max-h-[90vh] overflow-y-auto"
            style={formSalla ? { animation: "modalSalla 0.5s ease" } : undefined}
          >
            {/* Başlık */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yeni Lisans Tanımla</h2>
              <button
                onClick={() => { setFormAcik(false); setHatalar({}); setForm(bosForm); setSecilenMusteri(null); setMusteriArama(""); }}
                className="p-2.5 rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 cursor-pointer group"
                title="Kapat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={lisansKaydet} className="space-y-4">
              {/* Müşteri Seç (Autocomplete) */}
              <div ref={musteriRef}>
                <label className={LABEL_STIL}>Müşteri Seç <span className="text-red-500">*</span></label>
                {secilenMusteri ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400 flex-1">{secilenMusteri.ad}</span>
                    <button
                      type="button"
                      onClick={() => { setSecilenMusteri(null); setMusteriArama(""); }}
                      className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Müşteri adı yazarak arayın..."
                      value={musteriArama}
                      onChange={(e) => { setMusteriArama(e.target.value); setMusteriAcik(true); }}
                      onFocus={() => setMusteriAcik(true)}
                      className={hatalar.musteri ? INPUT_STIL.replace("border-gray-300 dark:border-white/10", "border-red-400 dark:border-red-500/40") : INPUT_STIL}
                    />
                    {musteriAcik && filtrelenmisMusteri.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {filtrelenmisMusteri.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSecilenMusteri(m);
                              setMusteriAcik(false);
                              setMusteriArama("");
                              if (hatalar.musteri) {
                                setHatalar((o) => { const y = { ...o }; delete y.musteri; return y; });
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            {m.ad}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {hatalar.musteri && <p className="text-red-500 text-xs mt-1">{hatalar.musteri}</p>}
              </div>

              {/* Paket Seç */}
              <div>
                <label className={LABEL_STIL}>Ürün/Paket <span className="text-red-500">*</span></label>
                <select
                  value={form.paket}
                  onChange={(e) => alanGuncelle("paket", e.target.value)}
                  className={(hatalar.paket ? INPUT_STIL.replace("border-gray-300 dark:border-white/10", "border-red-400 dark:border-red-500/40") : INPUT_STIL) + " [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-gray-900 [&>option]:dark:text-white"}
                >
                  <option value="">Paket seçiniz...</option>
                  {PAKETLER.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {hatalar.paket && <p className="text-red-500 text-xs mt-1">{hatalar.paket}</p>}
              </div>

              {/* Domain/URL */}
              <div>
                <label className={LABEL_STIL}>Domain / URL <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="ornek.com.tr veya 192.168.1.x"
                  value={form.domain}
                  onChange={(e) => alanGuncelle("domain", e.target.value)}
                  className={hatalar.domain ? INPUT_STIL.replace("border-gray-300 dark:border-white/10", "border-red-400 dark:border-red-500/40") : INPUT_STIL}
                />
                {hatalar.domain && <p className="text-red-500 text-xs mt-1">{hatalar.domain}</p>}
              </div>

              {/* Süre Belirleme */}
              <div>
                <label className={LABEL_STIL}>Lisans Süresi <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {SURE_SECENEKLERI.map((s) => (
                    <button
                      key={s.deger}
                      type="button"
                      onClick={() => alanGuncelle("sureTipi", s.deger)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${form.sureTipi === s.deger ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25" : "bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/10"}`}
                    >
                      {s.etiket}
                    </button>
                  ))}
                </div>
                {/* Özel Tarih seçimi */}
                {form.sureTipi === 0 && (
                  <div className="mt-3">
                    <input
                      type="date"
                      value={form.ozelBitis}
                      onChange={(e) => alanGuncelle("ozelBitis", e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className={hatalar.ozelBitis ? INPUT_STIL.replace("border-gray-300 dark:border-white/10", "border-red-400 dark:border-red-500/40") : INPUT_STIL}
                    />
                    {hatalar.ozelBitis && <p className="text-red-500 text-xs mt-1">{hatalar.ozelBitis}</p>}
                  </div>
                )}
              </div>

              {/* Hata Özeti */}
              {Object.keys(hatalar).length > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Lütfen zorunlu alanları doldurun.</p>
                </div>
              )}

              {/* Butonlar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setFormAcik(false); setHatalar({}); setForm(bosForm); setSecilenMusteri(null); setMusteriArama(""); }}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/25 cursor-pointer inline-flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Lisans Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
