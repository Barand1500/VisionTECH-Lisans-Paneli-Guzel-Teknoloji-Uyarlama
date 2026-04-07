/* ============================================= */
/*  Güzel Teknoloji - Lisans Yönetimi Sayfası    */
/*  Müşterilere tanımlanan yazılım lisanslarının  */
/*  listelenmesi, yeni lisans tanımlama, durum    */
/*  renklendirme (Smart Rows), aksiyon butonları  */
/*  Gece/Gündüz modu destekli                     */
/* ============================================= */

import { useState, useRef, useEffect } from "react";
import { apiGet, apiPost, apiPut } from "../yardimcilar/api";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";
import KopyalaButonu from "../bilesenler/KopyalaButonu";

/* ============================================= */
/*  Sabitler                                       */
/* ============================================= */

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
  const { logEkle } = useAktiviteLog();
  const [lisanslar, setLisanslar] = useState([]);
  const [musteriler, setMusteriler] = useState([]);
  const [paketListesi, setPaketListesi] = useState([]);
  const [arama, setArama] = useState("");
  const [kartFiltre, setKartFiltre] = useState(null);
  const [formAcik, setFormAcik] = useState(false);
  const [formSalla, setFormSalla] = useState(false);
  const [hatalar, setHatalar] = useState({});

  /* Bilgi Modalı State */
  const [bilgiModal, setBilgiModal] = useState(null);
  const [bilgiDetay, setBilgiDetay] = useState(null);
  const [bilgiYukleniyor, setBilgiYukleniyor] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [transferArama, setTransferArama] = useState("");
  const [transferMusteri, setTransferMusteri] = useState(null);
  const [transferYukleniyor, setTransferYukleniyor] = useState(false);
  const [tumMusterilerTransfer, setTumMusterilerTransfer] = useState([]);

  /* ---- Müşteri Seçimi Autocomplete ---- */
  const [musteriArama, setMusteriArama] = useState("");
  const [musteriAcik, setMusteriAcik] = useState(false);
  const [secilenMusteri, setSecilenMusteri] = useState(null);
  const musteriRef = useRef(null);

  /* ---- Yeni Lisans Form State ---- */
  const bosForm = { paket: "", domain: "", sureTipi: 12, ozelBitis: "" };
  const [form, setForm] = useState(bosForm);

  /* ---- Backend'den veri çek ---- */
  const verileriYukle = async () => {
    try {
      const [lRes, mRes, uRes] = await Promise.all([
        apiGet("/lisanslar"),
        apiGet("/musteriler"),
        apiGet("/urunler"),
      ]);
      setLisanslar(lRes.veri.map((l) => ({
        id: l.id,
        musteriId: l.musteri_id,
        musteriAd: l.musteri_adi || "Bilinmiyor",
        paket: l.urun_adi || l.paket_adi || "Bilinmiyor",
        domain: l.domain || "",
        baslangic: l.baslangic_tarihi,
        bitis: l.bitis_tarihi,
        durum: l.durum === "suresi-dolmus" ? "aktif" : l.durum,
      })));
      setMusteriler(mRes.veri.map((m) => ({
        id: m.id,
        ad: m.ad_soyad || m.sirket_adi || "Bilinmiyor",
      })));
      setPaketListesi(uRes.veri.map((u) => u.ad));
    } catch (e) {
      console.error("Lisans verileri yuklenemedi:", e);
    }
  };

  useEffect(() => { verileriYukle(); }, []);

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
  const filtrelenmisMusteri = musteriler.filter((m) =>
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
  const lisansKaydet = async (e) => {
    e.preventDefault();
    if (!formuDogrula()) return;

    const bugun = new Date().toISOString().slice(0, 10);
    const bitisTarihi = form.sureTipi === 0
      ? form.ozelBitis
      : aySonrasiTarih(form.sureTipi);

    try {
      await apiPost("/lisanslar", {
        musteri_id: secilenMusteri.id,
        urun_id: null,
        paket_id: null,
        baslangic_tarihi: bugun,
        bitis_tarihi: bitisTarihi,
        durum: "aktif",
        domain: form.domain,
      });
      await verileriYukle();
      setForm(bosForm);
      setSecilenMusteri(null);
      setMusteriArama("");
      setHatalar({});
      setFormAcik(false);
      await logEkle("lisans_olusturma", `${secilenMusteri?.adSoyad || secilenMusteri?.sirketAdi || ""} için yeni lisans oluşturuldu`);
    } catch (err) {
      console.error("Lisans kaydetme hatasi:", err);
    }
  };

  /* ---- Lisans Yenile (süresini 1 yıl uzat) ---- */
  const lisansYenile = async (id) => {
    const lisans = lisanslar.find((l) => l.id === id);
    if (!lisans) return;
    const yeniBitis = new Date(lisans.bitis);
    yeniBitis.setFullYear(yeniBitis.getFullYear() + 1);
    try {
      await apiPut(`/lisanslar/${id}`, {
        bitis_tarihi: yeniBitis.toISOString().slice(0, 10),
        durum: "aktif",
      });
      await verileriYukle();
      await logEkle("lisans_yenileme", `Lisans #${id} 1 yıl uzatıldı`);
    } catch (err) {
      console.error("Lisans yenileme hatasi:", err);
    }
  };

  /* ---- Lisans Dondur/Aktifleştir ---- */
  const lisansDondur = async (id) => {
    const lisans = lisanslar.find((l) => l.id === id);
    if (!lisans) return;
    const yeniDurum = lisans.durum === "dondurulmuş" ? "aktif" : "dondurulmuş";
    try {
      await apiPut(`/lisanslar/${id}`, { durum: yeniDurum });
      await verileriYukle();
      await logEkle("lisans_dondurma", `Lisans #${id} ${yeniDurum === "dondurulmuş" ? "donduruldu" : "aktifleştirildi"}`);
    } catch (err) {
      console.error("Lisans dondurma hatasi:", err);
    }
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
                          {/* Detay / Bilgi */}
                          <button
                            onClick={async () => {
                              setBilgiModal(lisans); setBilgiYukleniyor(true); setBilgiDetay(null);
                              try { const r = await apiGet(`/lisanslar/${lisans.id}/detay`); if (r.basarili) setBilgiDetay(r.veri); } catch {} setBilgiYukleniyor(false);
                            }}
                            className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Bilgi"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                  {paketListesi.map((p) => (
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

      {/* ========== Bilgi Modalı ========== */}
      {bilgiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setBilgiModal(null); setBilgiDetay(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Ürün Bilgisi</h4>
                  <p className="text-white/70 text-xs">{bilgiModal.paket} • {bilgiModal.musteriAd}</p>
                </div>
              </div>
              <button onClick={() => { setBilgiModal(null); setBilgiDetay(null); }} className="text-white/70 hover:text-white cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
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
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10"><h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ürün Bilgileri</h5></div>
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
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10"><h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Lisans Bilgileri</h5></div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Lisans Anahtarı</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white flex items-center gap-1">{bilgiDetay.lisans_anahtari || "-"}{bilgiDetay.lisans_anahtari && <KopyalaButonu metin={bilgiDetay.lisans_anahtari} />}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Lisans Tipi</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.lisans_tipi_adi || bilgiDetay.lisans_tipi || "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Başlangıç</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.baslangic_tarihi ? tarihFormatla(bilgiDetay.baslangic_tarihi) : "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Bitiş</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.suresiz ? "Süresiz" : bilgiDetay.bitis_tarihi ? tarihFormatla(bilgiDetay.bitis_tarihi) : "-"}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Durum</p><p className={`text-sm font-semibold ${bilgiDetay.durum === "aktif" ? "text-emerald-600" : bilgiDetay.durum === "suresi-dolmus" ? "text-red-600" : "text-amber-600"}`}>{bilgiDetay.durum === "aktif" ? "Aktif" : bilgiDetay.durum === "suresi-dolmus" ? "Süresi Dolmuş" : bilgiDetay.durum === "dondurulmuş" ? "Dondurulmuş" : bilgiDetay.durum}</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Kullanıcı</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bilgiDetay.kullanici_sayisi || 1}{bilgiDetay.ek_kullanici > 0 ? ` (+${bilgiDetay.ek_kullanici} ek)` : ""}</p></div>
                    </div>
                  </div>
                  {/* Teknik Bilgiler */}
                  {(bilgiDetay.domain || bilgiDetay.mac_adresi || bilgiDetay.ip_adresi) && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10"><h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Teknik Bilgiler</h5></div>
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {bilgiDetay.domain && <div className="col-span-2"><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Domain</p><p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">{bilgiDetay.domain}<KopyalaButonu metin={bilgiDetay.domain} /></p></div>}
                        {bilgiDetay.mac_adresi && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">MAC Adresi</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bilgiDetay.mac_adresi}</p></div>}
                        {bilgiDetay.ip_adresi && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">IP Adresi</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bilgiDetay.ip_adresi}</p></div>}
                      </div>
                    </div>
                  )}
                  {/* Finansal Bilgiler */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10"><h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Finansal Bilgiler</h5></div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Fiyat</p><p className="text-sm font-bold text-gray-900 dark:text-white">{Number(bilgiDetay.fiyat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</p></div>
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Net Tutar</p><p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Number(bilgiDetay.net_tutar || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</p></div>
                      {Number(bilgiDetay.indirim_orani) > 0 && <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">İndirim</p><p className="text-sm font-medium text-orange-600">%{bilgiDetay.indirim_orani}</p></div>}
                      <div><p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Ödeme Durumu</p><p className={`text-sm font-semibold ${bilgiDetay.odeme_durumu === "odendi" ? "text-emerald-600" : bilgiDetay.odeme_durumu === "kismi" ? "text-amber-600" : "text-red-600"}`}>{bilgiDetay.odeme_durumu === "odendi" ? "Ödendi" : bilgiDetay.odeme_durumu === "kismi" ? "Kısmi" : "Ödenmedi"}</p></div>
                    </div>
                  </div>
                  {/* Şablon Özellikleri */}
                  {bilgiDetay.sablon_ozellikleri?.length > 0 && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10"><h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Şablon Özellikleri</h5></div>
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
                  {/* Transfer Geçmişi */}
                  {bilgiDetay.moduller?.transfer_gecmisi?.length > 0 && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 overflow-hidden">
                      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20"><h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Transfer Geçmişi</h5></div>
                      <div className="p-4 space-y-2">
                        {bilgiDetay.moduller.transfer_gecmisi.map((t, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${t.geri_alma ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400" : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"}`}>{t.geri_alma ? "Geri Alma" : "Transfer"}</span>
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
                      <div className="px-4 py-2.5 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-b border-fuchsia-200 dark:border-fuchsia-500/20"><h5 className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider">Domain İşlemleri</h5></div>
                      <div className="p-4 flex gap-3">
                        <button onClick={async () => {
                          setTransferModal(true); setTransferArama(""); setTransferMusteri(null);
                          try { const r = await apiGet("/musteriler"); if (r.basarili) setTumMusterilerTransfer(r.veri); } catch {}
                        }} className="flex-1 px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          Transfer Et
                        </button>
                        {bilgiDetay.moduller?.transfer_gecmisi?.length > 0 && (
                          <button onClick={async () => {
                            if (!confirm("Son transferi geri almak istediğinize emin misiniz?")) return;
                            try {
                              const r = await apiPost(`/lisanslar/${bilgiDetay.id}/domain-geri-al`);
                              if (r.basarili) { alert(r.mesaj); setBilgiModal(null); setBilgiDetay(null); verileriYukle(); }
                            } catch (e) { alert(e.message || "Geri alma başarısız."); }
                          }} className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 transition-colors">
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
                <div className="text-center py-12"><p className="text-sm text-gray-500 dark:text-slate-400">Bilgi yüklenemedi.</p></div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-200 dark:border-white/10 shrink-0">
              <button onClick={() => { setBilgiModal(null); setBilgiDetay(null); }} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Domain Transfer Modalı ========== */}
      {transferModal && bilgiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setTransferModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div><h4 className="font-bold text-white">Domain Transfer</h4><p className="text-white/70 text-xs">{bilgiDetay?.domain}</p></div>
              <button onClick={() => setTransferModal(false)} className="text-white/70 hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={LABEL_STIL}>Hedef Müşteri</label>
                <input type="text" value={transferArama} onChange={(e) => setTransferArama(e.target.value)} placeholder="Müşteri adı ara..." className={INPUT_STIL} />
              </div>
              {transferArama.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg">
                  {tumMusterilerTransfer.filter(m => (m.ad_soyad || m.sirket_adi || "").toLowerCase().includes(transferArama.toLowerCase())).slice(0, 20).map((m) => (
                    <button key={m.id} onClick={() => { setTransferMusteri(m); setTransferArama(m.ad_soyad || m.sirket_adi || `#${m.id}`); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-gray-100 dark:border-white/5 last:border-0 ${transferMusteri?.id === m.id ? "bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 font-medium" : "text-gray-700 dark:text-slate-300"}`}>
                      <p className="font-medium">{m.ad_soyad || m.sirket_adi || `Müşteri #${m.id}`}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{m.eposta || ""}</p>
                    </button>
                  ))}
                  {tumMusterilerTransfer.filter(m => (m.ad_soyad || m.sirket_adi || "").toLowerCase().includes(transferArama.toLowerCase())).length === 0 && (
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
                <button onClick={() => setTransferModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">İptal</button>
                <button disabled={!transferMusteri || transferYukleniyor}
                  onClick={async () => {
                    setTransferYukleniyor(true);
                    try {
                      const r = await apiPost(`/lisanslar/${bilgiDetay.id}/domain-transfer`, { hedef_musteri_id: transferMusteri.id });
                      if (r.basarili) { alert(r.mesaj); setTransferModal(false); setBilgiModal(null); setBilgiDetay(null); verileriYukle(); }
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
