/* ============================================= */
/*  Güzel Teknoloji - Yönetim Sayfası            */
/*  Sekmeler: Ürünler, Ürün Grupları,            */
/*  Sürümler, Kullanıcılar                        */
/*  Gece/Gündüz modu destekli                    */
/* ============================================= */

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import KopyalaButonu from "../bilesenler/KopyalaButonu";
import SilmeOnayModal from "../bilesenler/SilmeOnayModal";
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "../yardimcilar/api";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";
import UrunSablonlariSekmesi, { OZELLIK_TIPLERI, OzellikFormu } from "../bilesenler/UrunSablonlariSekmesi";

/* ============================================= */
/*  Sabitler                                      */
/* ============================================= */

const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

/* ---- Sallanma Animasyonu ---- */
const _sallanmaYonetim = document.getElementById("sallanma-stili-yon") || (() => {
  const s = document.createElement("style");
  s.id = "sallanma-stili-yon";
  s.textContent = `@keyframes sallanma { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(5px)} 45%{transform:translateX(-4px)} 60%{transform:translateX(3px)} 75%{transform:translateX(-2px)} } .sallan { animation: sallanma 0.5s ease-in-out; }`;
  document.head.appendChild(s);
  return s;
})();

/* ---- Sekme Tanımları ---- */
const SEKMELER = [
  {
    id: "tipYonetimi", etiket: "Tip Yönetimi",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  },
  {
    id: "sablonlar", etiket: "Şablonlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
  },
  {
    id: "urunler", etiket: "Ürünler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    id: "surumler", etiket: "Sürümler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>,
  },
  {
    id: "kullanicilar", etiket: "Kullanıcılar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    id: "roller", etiket: "Roller",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },  {
    id: "sektorler", etiket: "Sektörler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    id: "lisansTipleri", etiket: "Lisans Tipleri",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
  },
  {
    id: "copKutusu", etiket: "Çöp Kutusu",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  },
];

/* ============================================= */
/*  Sabitler (Dropdown Seçenekleri)                */
/* ============================================= */

// Paket tipleri artık DB'den geliyor (/api/paket-tipleri)



/* ============================================= */
/*  Ana Bileşen                                   */
/* ============================================= */

export default function YonetimPage() {
  const [aktifSekme, setAktifSekme] = useState("tipYonetimi");

  return (
    <div>
      {/* ---- Sayfa Basligi ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yönetim</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Ürün, grup, sürüm ve kullanıcı yönetimi.</p>
      </div>

      {/* ---- Sekme Navigasyonu ---- */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl p-1.5 border border-gray-200 dark:border-white/10 overflow-x-auto">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            onClick={() => setAktifSekme(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              aktifSekme === s.id
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            }`}
          >
            {s.ikon}
            {s.etiket}
          </button>
        ))}
      </div>

      {/* ---- Sekme Icerigi ---- */}
      {aktifSekme === "urunler" && <UrunlerSekmesi />}
      {aktifSekme === "sablonlar" && <UrunSablonlariSekmesi />}
      {aktifSekme === "tipYonetimi" && <TipYonetimiSekmesi />}
      {aktifSekme === "surumler" && <SurumlerSekmesi />}
      {aktifSekme === "kullanicilar" && <KullanicilarSekmesi />}
      {aktifSekme === "roller" && <RollerSekmesi />}
      {aktifSekme === "sektorler" && <SektorlerSekmesi />}
      {aktifSekme === "lisansTipleri" && <LisansTipleriSekmesi />}
      {aktifSekme === "copKutusu" && <CopKutusuSekmesi />}
    </div>
  );
}

/* ============================================= */
/*  Ürünler Sekmesi                               */
/* ============================================= */

function UrunlerSekmesi() {
  const { logEkle } = useAktiviteLog();
  const [urunler, setUrunler] = useState([]);
  const [paketler, setPaketler] = useState([]);
  const [urunGruplari, setUrunGruplari] = useState([]);
  const [urunTipleri, setUrunTipleri] = useState([]);
  const [uygulamaTipleri, setUygulamaTipleri] = useState([]);
  const [sablonlar, setSablonlar] = useState([]); // Şablon listesi
  const [filtreGrup, setFiltreGrup] = useState("");
  const [filtreTip, setFiltreTip] = useState("");
  const [filtreUygulamaTip, setFiltreUygulamaTip] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");
  const [filtreOzelProje, setFiltreOzelProje] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [modal, setModal] = useState(null); // null | "yeni" | urunObjesi (düzenleme)
  const [paketModal, setPaketModal] = useState(null); // null | urunObjesi (paketleri göster)
  const [silinecekUrun, setSilinecekUrun] = useState(null);
  const [urunKullanimBilgisi, setUrunKullanimBilgisi] = useState(null);
  const [kullanimYukleniyor, setKullanimYukleniyor] = useState(false);
  const [silinecekPaket, setSilinecekPaket] = useState(null);
  const [silmeYukleniyor, setSilmeYukleniyor] = useState(false);
  const sayfaBasi = 10;

  const verileriYukle = async () => {
    try {
      const [uRes, pRes, gRes, tRes, utRes, sRes] = await Promise.all([
        apiGet("/urunler"),
        apiGet("/urunler/paketler/tumu"),
        apiGet("/urunler/gruplar"),
        apiGet("/urunler/tipler"),
        apiGet("/urunler/uygulama-tipler"),
        apiGet("/sablonlar"),
      ]);
      setUrunGruplari(gRes.veri || []);
      setUrunTipleri(tRes.veri || []);
      setUygulamaTipleri(utRes.veri || []);
      setSablonlar((sRes.veri || []).filter((s) => s.aktif)); // Sadece aktif şablonlar
      setUrunler(uRes.veri.map((u) => ({
        id: u.id,
        grubu: u.grup_adi || "",
        adi: u.ad,
        aciklama: u.aciklama || "",
        urunTipi: u.urun_tipi || "",
        uygulamaTipi: u.uygulama_tipi || "-",
        ozelProje: !!u.ozel_proje,
        aktif: !!u.aktif,
        grup_id: u.grup_id,
        varsayilanGun: u.varsayilan_gun || 365,
        // Yeni alanlar
        minKullanici: u.min_kullanici || 1,
        maxKullanici: u.max_kullanici || null,
        demoGun: u.demo_gun || 30,
        temelFiyat: u.temel_fiyat || 0,
        paraBirimi: u.para_birimi || "TL",
        lisansTipiId: u.lisans_tipi_id || "",
        versiyon: u.versiyon || "",
        sablonId: u.sablon_id || null,
        sablonAdi: u.sablon_adi || "",
        // Gelişmiş ayarlar (ozellikler JSON'dan)
        ozelliklerRaw: u.ozellikler || null,
        ...((() => { try { return typeof u.ozellikler === "string" ? JSON.parse(u.ozellikler) : (u.ozellikler || {}); } catch { return {}; } })()),
      })));
      setPaketler(pRes.veri.map((p) => ({
        id: p.id,
        urunId: p.urun_id,
        urunAdi: p.urun_adi || "",
        tipi: p.tipi || "",
        adi: p.ad,
        kullanimGunu: p.kullanim_gunu || 365,
        fiyati: p.fiyat || 0,
        kullaniciSayisi: p.kullanici_sayisi || 0,
        aktif: !!p.aktif,
        ozellikler: p.ozellikler || null,
      })));
    } catch (e) {
      console.error("Urun verileri yuklenemedi:", e);
    }
  };

  useEffect(() => { verileriYukle(); }, []);

  /* ---- Ürün Silme Öncesi Kullanım Kontrolü ---- */
  useEffect(() => {
    if (silinecekUrun) {
      setKullanimYukleniyor(true);
      setUrunKullanimBilgisi(null);
      apiGet(`/urunler/${silinecekUrun.id}/kullanim`)
        .then(res => {
          setUrunKullanimBilgisi(res.veri);
        })
        .catch(err => {
          console.error("Kullanim bilgisi alinamadi:", err);
          setUrunKullanimBilgisi({ musteri_sayisi: 0, lisans_sayisi: 0 });
        })
        .finally(() => setKullanimYukleniyor(false));
    } else {
      setUrunKullanimBilgisi(null);
    }
  }, [silinecekUrun]);

  /* ---- Kaskat filtre listeleri ---- */
  const filtreliUrunTipleri = useMemo(() => {
    if (!filtreGrup) return urunTipleri;
    const seciliGrup = urunGruplari.find(g => g.ad === filtreGrup);
    if (!seciliGrup) return urunTipleri;
    return urunTipleri.filter(t => t.grup_id === seciliGrup.id);
  }, [filtreGrup, urunTipleri, urunGruplari]);

  const filtreliUygulamaTipleri = useMemo(() => {
    if (!filtreTip) return uygulamaTipleri;
    return uygulamaTipleri.filter(t => t.urun_tipi_adi === filtreTip);
  }, [filtreTip, uygulamaTipleri]);

  /* ---- Filtreleme ---- */
  const filtrelenmis = urunler.filter((u) => {
    if (filtreGrup && u.grubu !== filtreGrup) return false;
    if (filtreTip && u.urunTipi !== filtreTip) return false;
    if (filtreUygulamaTip && u.uygulamaTipi !== filtreUygulamaTip) return false;
    if (filtreDurum === "aktif" && !u.aktif) return false;
    if (filtreDurum === "pasif" && u.aktif) return false;
    if (filtreOzelProje === "evet" && !u.ozelProje) return false;
    if (filtreOzelProje === "hayir" && u.ozelProje) return false;
    return true;
  });

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaUrunler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const sifirla = () => { setFiltreGrup(""); setFiltreTip(""); setFiltreUygulamaTip(""); setFiltreDurum(""); setFiltreOzelProje(""); setSayfa(1); };

  /* ---- İstatistikler ---- */
  const istatistikler = useMemo(() => {
    const grupSayilari = {};
    const tipSayilari = {};
    const uygulamaTipSayilari = {};
    
    urunler.forEach(u => {
      if (u.grubu) grupSayilari[u.grubu] = (grupSayilari[u.grubu] || 0) + 1;
      if (u.urunTipi) tipSayilari[u.urunTipi] = (tipSayilari[u.urunTipi] || 0) + 1;
      if (u.uygulamaTipi && u.uygulamaTipi !== "-") uygulamaTipSayilari[u.uygulamaTipi] = (uygulamaTipSayilari[u.uygulamaTipi] || 0) + 1;
    });
    
    return {
      toplam: urunler.length,
      aktif: urunler.filter(u => u.aktif).length,
      pasif: urunler.filter(u => !u.aktif).length,
      gruplar: grupSayilari,
      tipler: tipSayilari,
      uygulamaTipler: uygulamaTipSayilari
    };
  }, [urunler]);

  /* ---- Ürün Kaydet (Ekle veya Güncelle) ---- */
  const urunKaydet = async (veri) => {
    try {
      /* FK ID'leri isim eşleşmesiyle çöz */
      const urunTipiObj = urunTipleri.find(t => t.ad === veri.urunTipi);
      const uygulamaTipiObj = uygulamaTipleri.find(t => t.ad === veri.uygulamaTipi);
      const gonder = {
        grup_id: veri.grup_id || null,
        ad: veri.adi,
        aciklama: veri.aciklama || null,
        urun_tipi: veri.urunTipi,
        uygulama_tipi: veri.uygulamaTipi,
        urun_tipi_id: urunTipiObj?.id || null,
        uygulama_tipi_id: uygulamaTipiObj?.id || null,
        ozel_proje: veri.ozelProje,
        aktif: veri.aktif,
        varsayilan_gun: veri.varsayilanGun || 365,
        min_kullanici: veri.gelismisAyarlar?.kullanici_sayisi?.min || 1,
        max_kullanici: veri.gelismisAyarlar?.kullanici_sayisi?.max || null,
        demo_gun: veri.gelismisAyarlar?.demo_suresi?.gun || 30,
        temel_fiyat: Number(veri.fiyat) > 0 ? Number(veri.fiyat) : (veri.gelismisAyarlar?.temel_fiyat?.fiyat || 0),
        para_birimi: veri.paraBirimi || veri.gelismisAyarlar?.temel_fiyat?.para_birimi || "TL",
        lisans_tipi_id: veri.lisansTipiId ? Number(veri.lisansTipiId) : null,
        versiyon: veri.versiyon || null,
        sablon_id: veri.sablonId || null,
        ozellikler: JSON.stringify((() => {
          const oz = { ...(veri.gelismisAyarlar || {}) };
          if (Number(veri.fiyat) > 0) {
            oz.temel_fiyat = { fiyat: Number(veri.fiyat), para_birimi: veri.paraBirimi || "TL" };
          }
          return oz;
        })()),
      };
      let urunId = veri.id;
      if (veri.id) {
        await apiPut(`/urunler/${veri.id}`, gonder);
      } else {
        const res = await apiPost("/urunler", gonder);
        urunId = res.id;
      }
      
      /* Eğer versiyon girildiyse otomatik sürüm oluştur */
      if (veri.versiyon && urunId) {
        try {
          await apiPost("/surumler", {
            urun_id: urunId,
            urun_adi: veri.adi,
            surum: veri.versiyon,
            tarih: new Date().toISOString(),
            eklenenler: veri.id ? "Versiyon güncellendi" : "İlk sürüm oluşturuldu",
          });
        } catch (surumHata) {
          console.warn("Otomatik sürüm oluşturulamadı:", surumHata);
        }
      }
      
      await verileriYukle();
      setModal(null);
    } catch (e) {
      console.error("Urun kaydetme hatasi:", e);
    }
  };

  /* ---- Ürün Sil ---- */
  const urunSil = async () => {
    if (!silinecekUrun) return;
    setSilmeYukleniyor(true);
    try {
      const ad = silinecekUrun.adi || silinecekUrun.ad;
      await apiDelete(`/urunler/${silinecekUrun.id}`);
      await verileriYukle();
      setSilinecekUrun(null);
      await logEkle("urun_silme", `"${ad}" ürünü silindi`);
    } catch (e) {
      console.error("Urun silme hatasi:", e);
    } finally {
      setSilmeYukleniyor(false);
    }
  };

  return (
    <div>
      {/* ---- İstatistik Kartları ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Toplam */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Toplam Ürün</p>
          <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{istatistikler.toplam}</p>
        </div>
        {/* Aktif */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Aktif</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{istatistikler.aktif}</p>
        </div>
        {/* Pasif */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Pasif</p>
          <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{istatistikler.pasif}</p>
        </div>
        {/* Grup Sayısı */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Grup Sayısı</p>
          <p className="text-2xl font-bold mt-1 text-violet-600 dark:text-violet-400">{Object.keys(istatistikler.gruplar).length}</p>
        </div>
      </div>

      {/* Tip Filtreleri - Sade Butonlar */}
      {Object.keys(istatistikler.tipler).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 mr-1">Tipe Göre:</span>
          {Object.entries(istatistikler.tipler).map(([tip, sayi]) => (
            <button key={tip} onClick={() => { setFiltreTip(filtreTip === tip ? "" : tip); setSayfa(1); }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filtreTip === tip 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/15"
              }`}>
              {tip}
              <span className={`px-1 rounded text-[10px] font-bold ${
                filtreTip === tip ? "bg-white/20" : "bg-gray-200 dark:bg-white/10"
              }`}>{sayi}</span>
            </button>
          ))}
        </div>
      )}

      {/* ---- Filtre Cubugu ---- */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Grup Filtresi */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Grubu</label>
            <select value={filtreGrup} onChange={(e) => { setFiltreGrup(e.target.value); setFiltreTip(""); setFiltreUygulamaTip(""); setSayfa(1); }} className={INPUT_STIL}>
              <option value="">Tümü</option>
              {urunGruplari.map((g) => <option key={g.id} value={g.ad}>{g.ad}</option>)}
            </select>
          </div>

          {/* Ürün Tipi Filtresi */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Tipi</label>
            <select value={filtreTip} onChange={(e) => { setFiltreTip(e.target.value); setFiltreUygulamaTip(""); setSayfa(1); }} disabled={!filtreGrup} className={`${INPUT_STIL} ${!filtreGrup ? "opacity-50 cursor-not-allowed" : ""}`}>
              <option value="">Tümü</option>
              {filtreliUrunTipleri.map((t) => <option key={t.id} value={t.ad}>{t.ad}</option>)}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
            <select value={filtreDurum} onChange={(e) => { setFiltreDurum(e.target.value); setSayfa(1); }} className={INPUT_STIL}>
              <option value="">Tümü</option>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </div>

          {/* Özel Proje Filtresi */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Özel Proje</label>
            <select value={filtreOzelProje} onChange={(e) => { setFiltreOzelProje(e.target.value); setSayfa(1); }} className={INPUT_STIL}>
              <option value="">Tümü</option>
              <option value="evet">Evet</option>
              <option value="hayir">Hayır</option>
            </select>
          </div>

          {/* Butonlar */}
          <div className="flex items-center gap-2">
            <button onClick={sifirla}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              Sıfırla
            </button>
          </div>

          {/* Yeni Ürün Butonu */}
          <div className="ml-auto">
            <button onClick={() => setModal("yeni")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Yeni Ürün
            </button>
          </div>
        </div>
      </div>

      {/* ---- Tablo ---- */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Grubu", "Adı", "Ürün Tipi", "Uygulama Tipi", "Özel Proje", "Aktif", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaUrunler.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">Ürün bulunamadı.</td></tr>
              ) : sayfaUrunler.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${!u.aktif ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">{u.grubu}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">{u.adi}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{u.urunTipi}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{u.uygulamaTipi}</td>
                  <td className="px-4 py-3.5 text-center">
                    {u.ozelProje ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">EVET</span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                      {u.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* Paketler */}
                      <button onClick={() => setPaketModal(u)} title="Paketler"
                        className="w-8 h-8 rounded-lg bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </button>
                      {/* Düzenle */}
                      <button onClick={() => setModal(u)} title="Düzenle"
                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {/* Sil */}
                      <button onClick={() => setSilinecekUrun(u)} title="Sil"
                        className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- Sayfalama ---- */}
        <div className="px-4 py-3.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {filtrelenmis.length} kayıttan <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min((sayfa - 1) * sayfaBasi + 1, filtrelenmis.length)}</span> ile <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min(sayfa * sayfaBasi, filtrelenmis.length)}</span> arasındakiler gösteriliyor
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>
                {s}
              </button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa === toplamSayfa || toplamSayfa === 0}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ---- Ürün Oluştur/Düzenle Modalı ---- */}
      {modal && <UrunModal modal={modal} kapat={() => setModal(null)} kaydet={urunKaydet} urunGruplari={urunGruplari} urunTipleri={urunTipleri} uygulamaTipleri={uygulamaTipleri} sablonlar={sablonlar} tumUrunler={urunler} />}

      {/* ---- Paketler Modalı ---- */}
      {paketModal && <PaketlerModal urun={paketModal} kapat={() => setPaketModal(null)} paketler={paketler} setPaketler={setPaketler} tumUrunler={urunler} paketleriYenile={verileriYukle} urunGruplari={urunGruplari} />}

      {/* ---- Ürün Silme Onay Modalı ---- */}
      <SilmeOnayModal
        acik={!!silinecekUrun}
        kapat={() => setSilinecekUrun(null)}
        onay={urunSil}
        baslik="Ürünü silmek istediğinizden emin misiniz?"
        mesaj={
          kullanimYukleniyor ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Kullanım bilgisi kontrol ediliyor...
            </span>
          ) : urunKullanimBilgisi && urunKullanimBilgisi.musteri_sayisi > 0 ? (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Dikkat! Bu ürünü kullanan müşteriler var.
                </div>
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
                  <span className="font-bold">{urunKullanimBilgisi.musteri_sayisi}</span> müşterinin <span className="font-bold">{urunKullanimBilgisi.lisans_sayisi}</span> lisansında bu ürün kullanılıyor.
                </p>
                {urunKullanimBilgisi.musteriler && urunKullanimBilgisi.musteriler.length > 0 && (
                  <div className="mt-2 text-xs text-amber-600/80 dark:text-amber-400/80">
                    Örn: {urunKullanimBilgisi.musteriler.slice(0, 3).map(m => m.ad).join(", ")}
                    {urunKullanimBilgisi.musteriler.length > 3 && ` ve ${urunKullanimBilgisi.musteriler.length - 3} diğer...`}
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-slate-400">
                Sildiğinizde bu ürün tüm müşteri lisanslarından kaldırılacak ve çöp kutusuna taşınacak.
              </p>
            </div>
          ) : silinecekUrun ? (
            `"${silinecekUrun.adi}" ürünü çöp kutusuna taşınacak.`
          ) : ""
        }
        yukleniyor={silmeYukleniyor || kullanimYukleniyor}
      />
    </div>
  );
}

/* ============================================= */
/*  Paketler Modalı (Ürünün Paketleri)           */
/* ============================================= */

function PaketlerModal({ urun, kapat, paketler, setPaketler, tumUrunler, paketleriYenile, urunGruplari }) {
  const { logEkle } = useAktiviteLog();
  const [arama, setArama] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [paketForm, setPaketForm] = useState(null); // null | "yeni" | paketObjesi
  const [silinecekPaket, setSilinecekPaket] = useState(null);
  const [silmeYukleniyor, setSilmeYukleniyor] = useState(false);
  const sayfaBasi = 10;
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const urunPaketleri = paketler.filter((p) => p.urunId === urun.id);
  const filtrelenmis = arama
    ? urunPaketleri.filter((p) => p.adi.toLowerCase().includes(arama.toLowerCase()))
    : urunPaketleri;

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaPaketler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const paketKaydet = async (veri) => {
    try {
      const gonder = {
        urun_id: veri.urunId || urun.id,
        ad: veri.adi,
        tipi: veri.tipi,
        kullanim_gunu: veri.kullanimGunu,
        aktif: veri.aktif,
        ozellikler: veri.ozellikler,
      };
      if (veri.id) {
        await apiPut(`/urunler/paketler/${veri.id}`, gonder);
      } else {
        await apiPost("/urunler/paketler", gonder);
      }
      await paketleriYenile();
      setPaketForm(null);
      await logEkle(veri.id ? "paket_guncelleme" : "paket_ekleme", `"${veri.adi}" paketi ${veri.id ? "güncellendi" : "eklendi"}`);
    } catch (e) {
      console.error("Paket kaydetme hatasi:", e);
    }
  };

  const paketSil = async () => {
    if (!silinecekPaket) return;
    setSilmeYukleniyor(true);
    try {
      const ad = silinecekPaket.adi || silinecekPaket.ad;
      await apiDelete(`/urunler/paketler/${silinecekPaket.id}`);
      await paketleriYenile();
      setSilinecekPaket(null);
      await logEkle("paket_silme", `"${ad}" paketi silindi`);
    } catch (e) {
      console.error("Paket silme hatasi:", e);
    } finally {
      setSilmeYukleniyor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Başlık */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paketler</h3>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">{urun.adi}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPaketForm("yeni")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Yeni Paket
            </button>
            <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Kontroller */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span>{filtrelenmis.length} kayıt</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-slate-400">Ara:</span>
            <input type="text" value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48" />
          </div>
        </div>

        {/* Tablo */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Ürün Adı", "Adı", "Aktif", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaPaketler.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">Bu ürüne ait paket bulunamadı.</td></tr>
              ) : sayfaPaketler.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${!p.aktif ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">{p.urunAdi}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-sm">{p.adi}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                      {p.aktif ? "E" : "H"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setPaketForm(p)} title="Düzenle"
                        className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setSilinecekPaket(p)} title="Sil"
                        className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {filtrelenmis.length} kayıttan <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min((sayfa - 1) * sayfaBasi + 1, filtrelenmis.length)}</span> ile <span className="font-semibold text-gray-700 dark:text-slate-300">{Math.min(sayfa * sayfaBasi, filtrelenmis.length)}</span> arasındakiler gösteriliyor
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa || 1 }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa || 1, s + 1))} disabled={sayfa >= (toplamSayfa || 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      </div>

      {/* Paket Oluştur/Düzenle Alt Modalı */}
      {paketForm && <PaketOlusturModal modal={paketForm} kapat={() => setPaketForm(null)} kaydet={paketKaydet} urun={urun} tumUrunler={tumUrunler} urunGruplari={urunGruplari} />}

      {/* Paket Silme Onay Modalı */}
      <SilmeOnayModal
        acik={!!silinecekPaket}
        kapat={() => setSilinecekPaket(null)}
        onay={paketSil}
        baslik="Paketi silmek istediğinizden emin misiniz?"
        mesaj={silinecekPaket ? `"${silinecekPaket.adi}" paketi kalıcı olarak silinecek.` : ""}
        yukleniyor={silmeYukleniyor}
      />
    </div>
  );
}

/* ============================================= */
/*  Paket Oluştur / Düzenle Modalı               */
/* ============================================= */

function PaketOlusturModal({ modal, kapat, kaydet, urun, tumUrunler, urunGruplari }) {
  const duzenle = modal !== "yeni";
  const mevcutOzellikler = duzenle && modal.ozellikler ? (typeof modal.ozellikler === 'string' ? JSON.parse(modal.ozellikler) : modal.ozellikler) : [];
  
  // Mevcut özellikleri metin kartlarına dönüştür (geriye uyumluluk)
  const mevcutMetinler = mevcutOzellikler
    .filter(oz => oz.ozellik_tipi === "metin_karti" || oz.tip === "metin_karti")
    .map(oz => oz.deger || "");
  
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    urunGrubu: duzenle ? (tumUrunler.find((u) => u.id === modal.urunId)?.grubu || urun.grubu) : urun.grubu,
    urunId: duzenle ? modal.urunId : urun.id,
    tipi: duzenle ? (modal.tipi || "") : "",
    adi: duzenle ? modal.adi : "",
    kullanimGunu: duzenle ? modal.kullanimGunu : 0,
    aktif: duzenle ? modal.aktif : true,
  });
  const [kartlar, setKartlar] = useState(mevcutMetinler.length > 0 ? mevcutMetinler : []);
  const [yeniKart, setYeniKart] = useState("");
  const [duzenleIdx, setDuzenleIdx] = useState(null);
  const [duzenleMetin, setDuzenleMetin] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const guncelle = (alan, val) => setForm((o) => ({ ...o, [alan]: val }));

  const kartEkle = () => {
    const temiz = yeniKart.trim();
    if (!temiz) return;
    setKartlar(prev => [...prev, temiz]);
    setYeniKart("");
    inputRef.current?.focus();
  };

  const kartSil = (idx) => {
    setKartlar(prev => prev.filter((_, i) => i !== idx));
  };

  const kartDuzenleBitir = (idx) => {
    const temiz = duzenleMetin.trim();
    if (temiz) {
      setKartlar(prev => prev.map((k, i) => i === idx ? temiz : k));
    } else {
      kartSil(idx);
    }
    setDuzenleIdx(null);
    setDuzenleMetin("");
  };

  const gonder = (e) => {
    e.preventDefault();
    if (!form.adi) return;
    // Metin kartlarını ozellikler formatına dönüştür
    const ozellikler = kartlar.map((metin, i) => ({
      id: Date.now() + i,
      ozellik_tipi: "metin_karti",
      tip: "metin_karti",
      deger: metin,
    }));
    kaydet({ ...form, urunId: urun.id, urunAdi: urun.adi, ozellikler: ozellikler.length > 0 ? ozellikler : null });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Paket Düzenle" : "Paket Oluştur"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={gonder} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Adı */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Paket Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.adi} onChange={(e) => guncelle("adi", e.target.value)} placeholder="Paket adını giriniz" className={INPUT_STIL} required autoFocus />
          </div>

          {/* Kart Tabanlı Özellikler */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Paket Özellikleri</label>
                {kartlar.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400">{kartlar.length}</span>
                )}
              </div>
            </div>

            {/* Yeni Özellik Ekleme */}
            <div className="flex items-center gap-2 mb-3">
              <input
                ref={inputRef}
                type="text"
                value={yeniKart}
                onChange={(e) => setYeniKart(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); kartEkle(); } }}
                placeholder="Özellik yazın ve Enter'a basın..."
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-violet-500 outline-none"
              />
              <button
                type="button"
                onClick={kartEkle}
                disabled={!yeniKart.trim()}
                className="w-9 h-9 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white flex items-center justify-center cursor-pointer shrink-0"
                title="Ekle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Kartlar Listesi */}
            <div className="space-y-2">
              {kartlar.length === 0 ? (
                <div className="text-center py-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-gray-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Henüz özellik eklenmedi</p>
                  <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-1">Yukarıdaki alandan özellik ekleyebilirsiniz</p>
                </div>
              ) : (
                kartlar.map((kart, idx) => (
                  <div key={idx} className="group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                    <span className="text-violet-500 dark:text-violet-400 text-sm font-bold shrink-0">{idx + 1}.</span>
                    {duzenleIdx === idx ? (
                      <input
                        type="text"
                        value={duzenleMetin}
                        onChange={(e) => setDuzenleMetin(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); kartDuzenleBitir(idx); } if (e.key === "Escape") { setDuzenleIdx(null); setDuzenleMetin(""); } }}
                        onBlur={() => kartDuzenleBitir(idx)}
                        className="flex-1 px-2 py-1 text-sm rounded border border-violet-300 dark:border-violet-500/30 bg-white dark:bg-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="flex-1 text-sm text-gray-800 dark:text-slate-200 cursor-pointer"
                        onDoubleClick={() => { setDuzenleIdx(idx); setDuzenleMetin(kart); }}
                        title="Düzenlemek için çift tıklayın"
                      >
                        {kart}
                      </span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => { setDuzenleIdx(idx); setDuzenleMetin(kart); }}
                        className="w-6 h-6 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer"
                        title="Düzenle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => kartSil(idx)}
                        className="w-6 h-6 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                        title="Sil"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kaydet */}
          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Özellik Ekleme Yan Paneli                    */
/* ============================================= */

function OzellikEklePanel({ ozellikEkle, tumUrunler }) {
  const [tip, setTip] = useState("");
  const [deger, setDeger] = useState("");
  const [seciliUrun, setSeciliUrun] = useState(null);
  // Kademeli fiyat için state
  const [kademeler, setKademeler] = useState([{ adet: "", fiyat: "", birim: "" }]);
  // Domain fiyat için state
  const [uzantilar, setUzantilar] = useState([{ uzanti: "", aktivasyon: "", yenileme: "" }]);
  // Aktivasyon/Yenileme için state
  const [aktivasyonFiyat, setAktivasyonFiyat] = useState("");
  const [yenilemeFiyat, setYenilemeFiyat] = useState("");
  // Kullanıcı sayısı için state
  const [minKullanici, setMinKullanici] = useState("");
  const [maxKullanici, setMaxKullanici] = useState("");
  const [ekKullaniciFiyat, setEkKullaniciFiyat] = useState("");
  // sicil_domain için state
  const [alanTipi, setAlanTipi] = useState("domain");
  const [zorunlu, setZorunlu] = useState(true);

  const ozellikTipleri = [
    { kod: "temel_fiyat", baslik: "Temel Fiyat", icon: "💰", aciklama: "Ürünün temel fiyatı" },
    { kod: "aktivasyon_yenileme", baslik: "Aktivasyon & Yenileme", icon: "🔄", aciklama: "Aktivasyon ve yenileme fiyatları" },
    { kod: "kullanici_sayisi", baslik: "Kullanıcı Sayısı", icon: "👤", aciklama: "Min-max kullanıcı ve ek fiyat" },
    { kod: "ek_sure", baslik: "Ek Süre (Kullanım Günü)", icon: "⏱️", aciklama: "Ek kullanım günü" },
    { kod: "hediye_urun", baslik: "Hediye Ürün", icon: "🎁", aciklama: "Bu pakete hediye ürün ekle" },
    { kod: "ek_kullanici_fiyat", baslik: "Ek Kullanıcı Fiyatı", icon: "👥", aciklama: "Her ek kullanıcı için fiyat" },
    { kod: "indirim", baslik: "İndirim", icon: "🏷️", aciklama: "Yüzde indirim oranı" },
    { kod: "ozel_not", baslik: "Özel Not", icon: "📝", aciklama: "Pakete özel not ekle" },
    { kod: "sicil_domain", baslik: "Sicil / Domain", icon: "🌐", aciklama: "Sicil no veya domain alanı" },
    { kod: "kademeli_fiyat", baslik: "Kademeli Fiyat", icon: "📊", aciklama: "Adet/kapasite bazlı fiyatlandırma" },
    { kod: "domain_fiyat", baslik: "Domain Uzantı Fiyat", icon: "🔗", aciklama: "Domain uzantılarına göre fiyat" },
    { kod: "demo_suresi", baslik: "Demo Süresi", icon: "⏰", aciklama: "Demo/deneme süresi (gün)" },
  ];

  const sifirla = () => {
    setTip("");
    setDeger("");
    setSeciliUrun(null);
    setKademeler([{ adet: "", fiyat: "", birim: "" }]);
    setUzantilar([{ uzanti: "", aktivasyon: "", yenileme: "" }]);
    setAktivasyonFiyat("");
    setYenilemeFiyat("");
    setMinKullanici("");
    setMaxKullanici("");
    setEkKullaniciFiyat("");
    setAlanTipi("domain");
    setZorunlu(true);
  };

  const kaydet = () => {
    if (!tip) return;
    let yeniOzellik = { ozellik_tipi: tip, tip };

    switch (tip) {
      case "hediye_urun":
        if (!seciliUrun) return;
        yeniOzellik.urunId = seciliUrun.id;
        yeniOzellik.urunAdi = seciliUrun.adi;
        break;
      case "ek_kullanici_fiyat":
      case "indirim":
      case "ek_sure":
      case "ozel_not":
        yeniOzellik.deger = deger;
        break;
      case "temel_fiyat":
        yeniOzellik.deger = { fiyat: Number(deger) || 0, para_birimi: "TL" };
        break;
      case "aktivasyon_yenileme":
        yeniOzellik.deger = { aktivasyon_fiyat: Number(aktivasyonFiyat) || 0, yenileme_fiyat: Number(yenilemeFiyat) || 0 };
        break;
      case "kullanici_sayisi":
        yeniOzellik.deger = { min: Number(minKullanici) || 1, max: Number(maxKullanici) || 0, ek_kullanici_fiyat: Number(ekKullaniciFiyat) || 0 };
        break;
      case "sicil_domain":
        yeniOzellik.deger = { alan_tipi: alanTipi, zorunlu: zorunlu };
        break;
      case "kademeli_fiyat":
        yeniOzellik.deger = { tip: "adet", kademeler: kademeler.filter(k => k.adet && k.fiyat !== "") };
        break;
      case "domain_fiyat":
        yeniOzellik.deger = { uzantilar: uzantilar.filter(u => u.uzanti) };
        break;
      case "demo_suresi":
        yeniOzellik.deger = { gun: Number(deger) || 30 };
        break;
      default:
        yeniOzellik.deger = deger;
    }

    ozellikEkle(yeniOzellik);
    sifirla();
  };

  // Kademe ekleme/silme
  const kademeEkle = () => setKademeler([...kademeler, { adet: "", fiyat: "", birim: "" }]);
  const kademeSil = (idx) => setKademeler(kademeler.filter((_, i) => i !== idx));
  const kademeGuncelle = (idx, alan, val) => {
    const yeni = [...kademeler];
    yeni[idx][alan] = val;
    setKademeler(yeni);
  };

  // Uzantı ekleme/silme
  const uzantiEkle = () => setUzantilar([...uzantilar, { uzanti: "", aktivasyon: "", yenileme: "" }]);
  const uzantiSil = (idx) => setUzantilar(uzantilar.filter((_, i) => i !== idx));
  const uzantiGuncelle = (idx, alan, val) => {
    const yeni = [...uzantilar];
    yeni[idx][alan] = val;
    setUzantilar(yeni);
  };

  return (
    <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-slate-800/50 overflow-hidden">
      {/* Panel Başlığı */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 shrink-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Özellik Ekle
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Özellik Tipi Seçimi */}
        {!tip ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Eklemek istediğiniz özelliği seçin:</p>
            <div className="grid grid-cols-2 gap-2">
              {ozellikTipleri.map((ot) => (
                <button key={ot.kod} type="button" onClick={() => setTip(ot.kod)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all cursor-pointer text-left bg-white dark:bg-slate-900">
                  <span className="text-lg shrink-0">{ot.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{ot.baslik}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{ot.aciklama}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Seçili Tip Göster */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
              <span className="text-lg">{ozellikTipleri.find(t => t.kod === tip)?.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-violet-700 dark:text-violet-400 truncate">{ozellikTipleri.find(t => t.kod === tip)?.baslik}</p>
              </div>
              <button type="button" onClick={sifirla}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">Değiştir</button>
              </div>

              {/* Değer Girişi - Hediye Ürün */}
              {tip === "hediye_urun" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Hediye Ürün Seç</label>
                  <select value={seciliUrun?.id || ""} onChange={(e) => setSeciliUrun(tumUrunler.find(u => u.id === Number(e.target.value)))} className={INPUT_STIL}>
                    <option value="">Ürün seçin...</option>
                    {tumUrunler.map((u) => <option key={u.id} value={u.id}>{u.grubu ? `[${u.grubu}] ` : ""}{u.adi}</option>)}
                  </select>
                </div>
              )}

              {/* Ek Kullanıcı Fiyatı */}
              {tip === "ek_kullanici_fiyat" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ek Kullanıcı Fiyatı (₺)</label>
                  <input type="number" value={deger} onChange={(e) => setDeger(e.target.value)} className={INPUT_STIL} min={0} step="0.01" placeholder="500" />
                </div>
              )}

              {/* İndirim */}
              {tip === "indirim" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">İndirim Oranı (%)</label>
                  <input type="number" value={deger} onChange={(e) => setDeger(e.target.value)} className={INPUT_STIL} min={0} max={100} placeholder="10" />
                </div>
              )}

              {/* Ek Süre */}
              {tip === "ek_sure" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ek Süre (Gün)</label>
                  <input type="number" value={deger} onChange={(e) => setDeger(e.target.value)} className={INPUT_STIL} min={0} placeholder="30" />
                </div>
              )}

              {/* Özel Not */}
              {tip === "ozel_not" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Not</label>
                  <textarea value={deger} onChange={(e) => setDeger(e.target.value)} className={INPUT_STIL + " min-h-[60px]"} placeholder="Pakete özel notunuz..." />
                </div>
              )}

              {/* Temel Fiyat */}
              {tip === "temel_fiyat" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Temel Fiyat (₺)</label>
                  <input type="number" value={deger} onChange={(e) => setDeger(e.target.value)} className={INPUT_STIL} min={0} step="0.01" placeholder="1000" />
                </div>
              )}

              {/* Aktivasyon & Yenileme */}
              {tip === "aktivasyon_yenileme" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Aktivasyon Fiyatı (₺)</label>
                    <input type="number" value={aktivasyonFiyat} onChange={(e) => setAktivasyonFiyat(e.target.value)} className={INPUT_STIL} min={0} step="0.01" placeholder="500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Yenileme Fiyatı (₺)</label>
                    <input type="number" value={yenilemeFiyat} onChange={(e) => setYenilemeFiyat(e.target.value)} className={INPUT_STIL} min={0} step="0.01" placeholder="300" />
                  </div>
                </div>
              )}

              {/* Kullanıcı Sayısı */}
              {tip === "kullanici_sayisi" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Min Kullanıcı</label>
                      <input type="number" value={minKullanici} onChange={(e) => setMinKullanici(e.target.value)} className={INPUT_STIL} min={1} placeholder="1" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Max Kullanıcı (0=sınırsız)</label>
                      <input type="number" value={maxKullanici} onChange={(e) => setMaxKullanici(e.target.value)} className={INPUT_STIL} min={0} placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ek Kullanıcı Fiyatı (₺)</label>
                    <input type="number" value={ekKullaniciFiyat} onChange={(e) => setEkKullaniciFiyat(e.target.value)} className={INPUT_STIL} min={0} step="0.01" placeholder="100" />
                  </div>
                </div>
              )}

              {/* Sicil / Domain */}
              {tip === "sicil_domain" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Alan Tipi</label>
                    <div className="flex gap-2">
                      <label className={`flex-1 p-3 rounded-lg border text-center cursor-pointer transition-all ${alanTipi === "domain" ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-200 dark:border-white/10"}`}>
                        <input type="radio" name="alanTipi" value="domain" checked={alanTipi === "domain"} onChange={(e) => setAlanTipi(e.target.value)} className="sr-only" />
                        <span className={`text-sm font-medium ${alanTipi === "domain" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}>🌐 Domain</span>
                      </label>
                      <label className={`flex-1 p-3 rounded-lg border text-center cursor-pointer transition-all ${alanTipi === "sicil" ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-200 dark:border-white/10"}`}>
                        <input type="radio" name="alanTipi" value="sicil" checked={alanTipi === "sicil"} onChange={(e) => setAlanTipi(e.target.value)} className="sr-only" />
                        <span className={`text-sm font-medium ${alanTipi === "sicil" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}>📋 Sicil No</span>
                      </label>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={zorunlu} onChange={(e) => setZorunlu(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">Bu alan zorunlu olsun</span>
                  </label>
                </div>
              )}

              {/* Kademeli Fiyat */}
              {tip === "kademeli_fiyat" && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">Kademeler</label>
                  {kademeler.map((k, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="number" value={k.adet} onChange={(e) => kademeGuncelle(idx, "adet", e.target.value)} className={INPUT_STIL + " w-20"} placeholder="Adet" min={1} />
                      <input type="text" value={k.birim} onChange={(e) => kademeGuncelle(idx, "birim", e.target.value)} className={INPUT_STIL + " w-24"} placeholder="Birim" />
                      <input type="number" value={k.fiyat} onChange={(e) => kademeGuncelle(idx, "fiyat", e.target.value)} className={INPUT_STIL + " flex-1"} placeholder="Fiyat (₺)" min={0} step="0.01" />
                      {kademeler.length > 1 && (
                        <button type="button" onClick={() => kademeSil(idx)} className="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center text-red-500 cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={kademeEkle} className="text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">+ Kademe Ekle</button>
                </div>
              )}

              {/* Domain Uzantı Fiyat */}
              {tip === "domain_fiyat" && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">Domain Uzantıları</label>
                  {uzantilar.map((u, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="text" value={u.uzanti} onChange={(e) => uzantiGuncelle(idx, "uzanti", e.target.value)} className={INPUT_STIL + " w-24"} placeholder=".com.tr" />
                      <input type="number" value={u.aktivasyon} onChange={(e) => uzantiGuncelle(idx, "aktivasyon", e.target.value)} className={INPUT_STIL + " flex-1"} placeholder="Akt. (₺)" min={0} />
                      <input type="number" value={u.yenileme} onChange={(e) => uzantiGuncelle(idx, "yenileme", e.target.value)} className={INPUT_STIL + " flex-1"} placeholder="Yen. (₺)" min={0} />
                      {uzantilar.length > 1 && (
                        <button type="button" onClick={() => uzantiSil(idx)} className="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center text-red-500 cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={uzantiEkle} className="text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">+ Uzantı Ekle</button>
                </div>
              )}

              {/* Demo Süresi */}
              {tip === "demo_suresi" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Demo Süresi (Gün)</label>
                  <input type="number" value={deger} onChange={(e) => setDeger(e.target.value)} className={INPUT_STIL} min={1} placeholder="30" />
                </div>
              )}

              {/* Ekle Butonu */}
              <button type="button" onClick={kaydet}
                className="w-full mt-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Özelliği Ekle
              </button>
            </div>
          )}
        </div>
      </div>
  );
}

/* ============================================= */
/*  Ürün Oluştur / Düzenle Modalı                */
/* ============================================= */

function UrunModal({ modal, kapat, kaydet, urunGruplari, urunTipleri, uygulamaTipleri, sablonlar, tumUrunler = [] }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    grubu: duzenle ? modal.grubu : "",
    grup_id: duzenle ? modal.grup_id : null,
    adi: duzenle ? modal.adi : "",
    aciklama: duzenle ? (modal.aciklama || "") : "",
    urunTipi: duzenle ? modal.urunTipi : "",
    uygulamaTipi: duzenle ? modal.uygulamaTipi : "-",
    varsayilanGun: duzenle ? (modal.varsayilanGun || 365) : 365,
    ozelProje: duzenle ? modal.ozelProje : false,
    aktif: duzenle ? modal.aktif : true,
    versiyon: duzenle ? (modal.versiyon || "") : "",
    fiyat: duzenle ? (modal.temelFiyat || "") : "",
    paraBirimi: duzenle ? (modal.paraBirimi || "TL") : "TL",
    lisansTipiId: duzenle ? (modal.lisansTipiId || "") : "",
    sablonId: duzenle ? (modal.sablonId || null) : null,
    gelismisAyarlar: duzenle ? (() => {
      try {
        const oz = typeof modal.ozelliklerRaw === "string" ? JSON.parse(modal.ozelliklerRaw) : (modal.ozelliklerRaw || {});
        // Eski format kontrolü (bildirimGun, otomatikYenileme vs.)
        if (oz && (oz.bildirimGun !== undefined || oz.yenilemeSuresi !== undefined)) {
          const yeni = {};
          if (modal.temelFiyat) yeni.temel_fiyat = { fiyat: Number(modal.temelFiyat) || 0, para_birimi: "TL" };
          if (modal.minKullanici > 1 || modal.maxKullanici) yeni.kullanici_sayisi = { min: modal.minKullanici || 1, max: modal.maxKullanici || null, ek_kullanici_fiyat: 0 };
          if (modal.demoGun && modal.demoGun !== 30) yeni.demo_suresi = { gun: modal.demoGun };
          if (oz.otomatikYenileme) yeni.otomatik_yenileme = { aktif: true, bildirim_gun: oz.bildirimGun || 30, aciklama: "" };
          return yeni;
        }
        return oz || {};
      } catch { return {}; }
    })() : {},
  });
  const [aktifSekme, setAktifSekme] = useState("temel"); // "temel" | "gelismis"
  const [mevcutSurumler, setMevcutSurumler] = useState([]);
  const [mevcutSurumBilgisi, setMevcutSurumBilgisi] = useState(null);
  const [benzerUrunBilgisi, setBenzerUrunBilgisi] = useState(null);
  const [lisansTipleri, setLisansTipleri] = useState([]);
  const ref = useRef(null);

  /* Lisans tiplerini yükle */
  useEffect(() => {
    apiGet("/lisans-tipleri/aktif").then((r) => {
      if (r.basarili) setLisansTipleri(r.veri || []);
    }).catch(() => {});
  }, []);

  /* Mevcut sürümleri yükle */
  useEffect(() => {
    apiGet("/surumler").then((res) => {
      setMevcutSurumler(res.veri || []);
    }).catch(() => {});
  }, []);

  /* Ürün tipi + uygulama tipi değişince mevcut sürümü kontrol et */
  useEffect(() => {
    if (form.urunTipi && form.uygulamaTipi && form.uygulamaTipi !== "-") {
      const benzerUrunler = mevcutSurumler.filter(s => {
        const urunAdiLower = (s.urun_adi || "").toLowerCase();
        const tipler = `${form.urunTipi} ${form.uygulamaTipi}`.toLowerCase();
        return urunAdiLower.includes(form.urunTipi.toLowerCase()) || urunAdiLower.includes(form.uygulamaTipi.toLowerCase());
      });
      if (benzerUrunler.length > 0) {
        const enSonSurum = benzerUrunler.sort((a, b) => (b.surum || "").localeCompare(a.surum || ""))[0];
        const sonVersiyon = enSonSurum.surum || "1.0.0";
        /* Bir üst versiyon hesapla */
        const parcalar = sonVersiyon.split(".").map(Number);
        const yeniMajor = parcalar[0] || 1;
        const yeniMinor = parcalar[1] || 0;
        const yeniPatch = (parcalar[2] || 0) + 1;
        const onerilenVersiyon = `${yeniMajor}.${yeniMinor}.${yeniPatch}`;
        setMevcutSurumBilgisi({ urun: enSonSurum.urun_adi, surum: sonVersiyon, onerilen: onerilenVersiyon });
        /* Eğer versiyon boşsa önerilen versiyonu koy */
        if (!form.versiyon && !duzenle) {
          setForm(o => ({ ...o, versiyon: onerilenVersiyon }));
        }
      } else {
        setMevcutSurumBilgisi(null);
      }
    } else {
      setMevcutSurumBilgisi(null);
    }
  }, [form.urunTipi, form.uygulamaTipi, mevcutSurumler]);

  /* Şablon, grup veya ürün adı değişince benzer ürün kontrolü */
  useEffect(() => {
    if (duzenle) {
      setBenzerUrunBilgisi(null);
      return;
    }
    
    let benzerUrun = null;
    
    /* Önce aynı şablonu kullanan ürünleri kontrol et */
    if (form.sablonId) {
      const ayniSablonlu = tumUrunler.filter(u => u.sablonId === form.sablonId && u.id !== form.id);
      if (ayniSablonlu.length > 0) {
        /* En yüksek versiyonlu olanı bul */
        benzerUrun = ayniSablonlu.sort((a, b) => (b.versiyon || "0.0.0").localeCompare(a.versiyon || "0.0.0"))[0];
      }
    }
    
    /* Şablonla bulunamadıysa, aynı gruptaki benzer isimli ürünleri kontrol et */
    if (!benzerUrun && form.grup_id && form.adi && form.adi.length >= 3) {
      const formAdiLower = form.adi.toLowerCase();
      const ayniGruptakiler = tumUrunler.filter(u => {
        if (u.grup_id !== form.grup_id || u.id === form.id) return false;
        const urunAdiLower = (u.adi || "").toLowerCase();
        /* İsmin ilk 3 karakteri veya kelime eşleşmesi */
        return urunAdiLower.includes(formAdiLower.slice(0, 3)) || 
               formAdiLower.includes(urunAdiLower.slice(0, 3));
      });
      if (ayniGruptakiler.length > 0) {
        benzerUrun = ayniGruptakiler.sort((a, b) => (b.versiyon || "0.0.0").localeCompare(a.versiyon || "0.0.0"))[0];
      }
    }
    
    if (benzerUrun && benzerUrun.versiyon) {
      /* Bir üst versiyon hesapla */
      const sonVersiyon = benzerUrun.versiyon;
      const parcalar = sonVersiyon.split(".").map(Number);
      const yeniMajor = parcalar[0] || 1;
      const yeniMinor = parcalar[1] || 0;
      const yeniPatch = (parcalar[2] || 0) + 1;
      const onerilenVersiyon = `${yeniMajor}.${yeniMinor}.${yeniPatch}`;
      
      setBenzerUrunBilgisi({
        urun: benzerUrun,
        mevcutVersiyon: sonVersiyon,
        onerilenVersiyon
      });
      
      /* Eğer versiyon boşsa önerilen versiyonu otomatik koy */
      if (!form.versiyon) {
        setForm(o => ({ ...o, versiyon: onerilenVersiyon }));
      }
    } else {
      setBenzerUrunBilgisi(null);
    }
  }, [form.sablonId, form.grup_id, form.adi, tumUrunler, duzenle]);

  /* Versiyon formatlama (otomatik nokta ekleme) */
  const versiyonFormatla = (deger) => {
    /* Sadece rakam ve nokta karakterlerine izin ver */
    let sonuc = deger.replace(/[^\d.]/g, "");
    /* Baştaki noktaları temizle */
    sonuc = sonuc.replace(/^\.+/, "");
    /* Ardışık noktaları tek noktaya indir */
    sonuc = sonuc.replace(/\.{2,}/g, ".");
    /* En fazla 2 nokta (X.Y.Z formatı) */
    const parcalar = sonuc.split(".");
    if (parcalar.length > 3) {
      sonuc = parcalar.slice(0, 3).join(".");
    }
    return sonuc;
  };

  const sallanma = () => {
    if (ref.current) {
      ref.current.classList.remove("sallan");
      void ref.current.offsetWidth;
      ref.current.classList.add("sallan");
    }
  };

  const guncelle = (alan, val) => setForm((o) => ({ ...o, [alan]: val }));

  /* Gelişmiş Ayarlar toggle/güncelle yardımcıları */
  const RENK_HEX = { emerald: "#10b981", blue: "#3b82f6", violet: "#8b5cf6", pink: "#ec4899", amber: "#f59e0b", teal: "#14b8a6", orange: "#f97316", indigo: "#6366f1", sky: "#0ea5e9", cyan: "#06b6d4", yellow: "#eab308", rose: "#f43f5e", purple: "#a855f7", green: "#22c55e", red: "#ef4444", fuchsia: "#d946ef", slate: "#64748b", lime: "#84cc16", gray: "#9ca3af" };
  const ozToggle = (tipId, varsayilan) => {
    setForm(o => {
      const mevcut = o.gelismisAyarlar[tipId];
      if (mevcut) {
        const yeni = { ...o.gelismisAyarlar };
        delete yeni[tipId];
        return { ...o, gelismisAyarlar: yeni };
      }
      return { ...o, gelismisAyarlar: { ...o.gelismisAyarlar, [tipId]: JSON.parse(JSON.stringify(varsayilan)) } };
    });
  };
  const ozGuncelle = (tipId, alan, val) => {
    setForm(o => ({
      ...o,
      gelismisAyarlar: {
        ...o.gelismisAyarlar,
        [tipId]: { ...(o.gelismisAyarlar[tipId] || {}), [alan]: val }
      }
    }));
  };

  const gonder = (e) => {
    e.preventDefault();
    if (!form.adi) return;
    kaydet(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Ürün Düzenle" : "Yeni Ürün Oluştur"}</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Ürün bilgilerini doldurun</p>
          </div>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Şablon Seçimi - En Üstte */}
        {!duzenle && sablonlar && sablonlar.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-500/5 dark:to-violet-500/5 border-b border-gray-200 dark:border-white/10">
            <label className="block text-xs font-medium text-purple-700 dark:text-purple-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Şablondan Oluştur (Opsiyonel)
            </label>
            <select
              value={form.sablonId || ""}
              onChange={(e) => {
                const seciliSablonId = e.target.value ? Number(e.target.value) : null;
                const seciliSablon = sablonlar.find((s) => s.id === seciliSablonId);
                if (seciliSablon) {
                  /* Şablondan alanları doldur */
                  const yeniForm = {
                    ...form,
                    sablonId: seciliSablonId,
                    grup_id: seciliSablon.grup_id || seciliSablon.grup?.id || null,
                    grubu: seciliSablon.grup?.ad || "",
                  };
                  /* Ürün Tipi */
                  if (seciliSablon.urunTipi || seciliSablon.urun_tipi_id) {
                    const urunTipiAdi = seciliSablon.urunTipi?.ad || urunTipleri.find(t => t.id === seciliSablon.urun_tipi_id)?.ad || "";
                    yeniForm.urunTipi = urunTipiAdi;
                  }
                  /* Uygulama Tipi */
                  if (seciliSablon.uygulamaTipi || seciliSablon.uygulama_tipi_id) {
                    const uygulamaTipiAdi = seciliSablon.uygulamaTipi?.ad || uygulamaTipleri.find(t => t.id === seciliSablon.uygulama_tipi_id)?.ad || "-";
                    yeniForm.uygulamaTipi = uygulamaTipiAdi;
                  }
                  /* Şablon adını default olarak ürün adına yaz */
                  if (!form.adi) {
                    yeniForm.adi = seciliSablon.ad;
                  }
                  setForm(yeniForm);
                } else {
                  guncelle("sablonId", null);
                }
              }}
              className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-white/10 border border-purple-300 dark:border-purple-500/30 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="">Şablon seçin veya manuel girin...</option>
              {sablonlar.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ad} {s.grup?.ad ? `(${s.grup.ad})` : ""} {s.urunTipi?.ad ? `- ${s.urunTipi.ad}` : ""}
                </option>
              ))}
            </select>
            {form.sablonId && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Şablon seçildi, alanlar otomatik dolduruldu
              </p>
            )}
          </div>
        )}

        {/* Sekme Navigasyonu */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-gray-200 dark:border-white/10 shrink-0">
          <button
            onClick={() => setAktifSekme("temel")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${
              aktifSekme === "temel"
                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700"
            }`}
          >
            Temel Bilgiler
          </button>
          <button
            onClick={() => setAktifSekme("gelismis")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${
              aktifSekme === "gelismis"
                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700"
            }`}
          >
            Gelişmiş Ayarlar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={gonder} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {aktifSekme === "temel" ? (
              <>
                {/* Ürün Grubu */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Grubu</label>
                  <select value={form.grup_id || ""} onChange={(e) => {
                    const gid = e.target.value ? Number(e.target.value) : null;
                    const seciliGrup = urunGruplari.find((g) => g.id === gid);
                    guncelle("grup_id", gid);
                    guncelle("grubu", seciliGrup?.ad || "");
                  }} className={INPUT_STIL}>
                    <option value="">Grup Yok</option>
                    {urunGruplari.map((g) => <option key={g.id} value={g.id}>{g.ad}</option>)}
                  </select>
                </div>

                {/* Ürün Tipi ve Uygulama Tipi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Tipi</label>
                    <select value={form.urunTipi} onChange={(e) => {
                      guncelle("urunTipi", e.target.value);
                      guncelle("uygulamaTipi", "-"); // Ürün tipi değişince uygulama tipini sıfırla
                    }} className={INPUT_STIL}>
                      <option value="">Seçiniz</option>
                      {urunTipleri.filter(t => !form.grup_id || t.grup_id === form.grup_id).map((t) => <option key={t.id} value={t.ad}>{t.ad}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Uygulama Tipi</label>
                    <select 
                      value={form.uygulamaTipi} 
                      onChange={(e) => guncelle("uygulamaTipi", e.target.value)} 
                      className={INPUT_STIL}
                    >
                      <option value="-">-</option>
                      {uygulamaTipleri
                        .filter((t) => !form.urunTipi || t.urun_tipi_adi === form.urunTipi)
                        .map((t) => <option key={t.id} value={t.ad}>{t.ad}</option>)}
                    </select>
                  </div>
                </div>

                {/* Adı */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Adı <span className="text-red-500">*</span></label>
                  <input type="text" value={form.adi} onChange={(e) => guncelle("adi", e.target.value)} placeholder="Ürün adını giriniz" className={INPUT_STIL} required />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Açıklama</label>
                  <textarea 
                    value={form.aciklama} 
                    onChange={(e) => guncelle("aciklama", e.target.value)} 
                    placeholder="Ürün açıklaması..." 
                    rows={2}
                    className={INPUT_STIL + " resize-none"}
                  />
                </div>

                {/* Fiyat + Para Birimi */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Fiyat</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={form.fiyat} 
                      onChange={(e) => guncelle("fiyat", e.target.value)} 
                      placeholder="0.00" 
                      className={INPUT_STIL + " flex-1"} 
                    />
                    <select 
                      value={form.paraBirimi} 
                      onChange={(e) => guncelle("paraBirimi", e.target.value)} 
                      className={INPUT_STIL + " w-24 shrink-0"}
                    >
                      <option value="TL">₺ TL</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                    </select>
                  </div>
                </div>

                {/* Lisans Tipi */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Lisans Tipi</label>
                  <select 
                    value={form.lisansTipiId} 
                    onChange={(e) => {
                      const id = e.target.value;
                      guncelle("lisansTipiId", id);
                      if (id) {
                        const tip = lisansTipleri.find((t) => String(t.id) === String(id));
                        if (tip) guncelle("varsayilanGun", tip.suresiz ? 0 : (tip.gun || 365));
                      }
                    }} 
                    className={INPUT_STIL}
                  >
                    <option value="">Seçiniz...</option>
                    {lisansTipleri.map((tip) => (
                      <option key={tip.id} value={tip.id}>
                        {tip.ad} {tip.suresiz ? "(Süresiz)" : `(${tip.gun} gün)`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Versiyon */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Varsayılan Versiyon</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={form.versiyon} 
                      onChange={(e) => guncelle("versiyon", versiyonFormatla(e.target.value))} 
                      placeholder="Örn: 1.0.0" 
                      className={INPUT_STIL + " flex-1"} 
                    />
                    {(benzerUrunBilgisi || mevcutSurumBilgisi) && (
                      <button
                        type="button"
                        onClick={() => guncelle("versiyon", benzerUrunBilgisi?.onerilenVersiyon || mevcutSurumBilgisi?.onerilen)}
                        className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors cursor-pointer shrink-0"
                        title={`Önerilen versiyona ayarla: ${benzerUrunBilgisi?.onerilenVersiyon || mevcutSurumBilgisi?.onerilen}`}
                      >
                        +
                      </button>
                    )}
                  </div>
                  
                  {/* Benzer ürün bilgisi (şablon/grup bazlı) */}
                  {benzerUrunBilgisi && (
                    <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Bu uygulamanın mevcut bir versiyonu var!</span>
                      </div>
                      <p className="text-[11px] text-blue-600 dark:text-blue-300 ml-6">
                        <span className="font-semibold">"{benzerUrunBilgisi.urun.adi}"</span> ürünü 
                        <span className="font-mono font-bold mx-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20">{benzerUrunBilgisi.mevcutVersiyon}</span> 
                        versiyonunda
                      </p>
                      <p className="text-[10px] text-blue-500 dark:text-blue-400 ml-6 mt-1 flex items-center gap-1">
                        <span>→</span>
                        <span>Önerilen sonraki versiyon:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{benzerUrunBilgisi.onerilenVersiyon}</span>
                        <span className="text-blue-400 dark:text-blue-500 ml-1">(+ butonuyla uygula)</span>
                      </p>
                    </div>
                  )}
                  
                  {/* Mevcut sürüm bilgisi (tip bazlı - eski sistem) */}
                  {!benzerUrunBilgisi && mevcutSurumBilgisi && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        <span className="font-semibold">{mevcutSurumBilgisi.urun}</span> için mevcut sürüm: <span className="font-mono font-bold">{mevcutSurumBilgisi.surum}</span>
                        <span className="mx-2">→</span>
                        Önerilen: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{mevcutSurumBilgisi.onerilen}</span>
                        <span className="text-[9px] ml-2 opacity-70">(+ butonuna tıklayarak uygulayın)</span>
                      </p>
                    </div>
                  )}

                  {/* Otomatik sürüm oluşturma bilgilendirme */}
                  {form.versiyon && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Kaydettiğinizde <span className="font-mono font-bold">{form.versiyon}</span> versiyonu için otomatik olarak <strong>Sürüm kaydı</strong> oluşturulacaktır.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Özel Proje & Durum */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.ozelProje} onChange={(e) => guncelle("ozelProje", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">Özel Proje</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.aktif} onChange={(e) => guncelle("aktif", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">Aktif</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Şablon seçiliyken: uyarı göster, özellikleri tamamen gizle */}
                {form.sablonId ? (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Şablon Aktif</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                        Şablon seçili olduğunda gelişmiş ayarlar şablondan gelir. Özelleştirmek için şablon seçimini kaldırın.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Tüm Özellik Tipleri - Toggle Kartlar */
                  <div className="space-y-2">
                    {OZELLIK_TIPLERI.filter(oz => !(oz.id === "temel_fiyat" && Number(form.fiyat) > 0)).map(oz => {
                      const aktif = !!form.gelismisAyarlar[oz.id];
                      return (
                        <div key={oz.id} className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                          <button type="button" onClick={() => ozToggle(oz.id, oz.varsayilan)}
                            className="w-full p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="inline-flex items-center justify-center text-base w-6 h-6 shrink-0">{oz.ikon}</span>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 truncate leading-none">{oz.ad}</h4>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate leading-none mt-0.5">{oz.aciklama}</p>
                              </div>
                            </div>
                            <div
                              className={`w-10 h-5 rounded-full transition-colors flex items-center shrink-0 ml-2 ${aktif ? "justify-end" : "bg-gray-300 dark:bg-white/20 justify-start"}`}
                              style={aktif ? { backgroundColor: RENK_HEX[oz.renk] || "#6b7280" } : undefined}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow mx-0.5"></div>
                            </div>
                          </button>
                          {aktif && (
                            <div className="px-4 pb-3 pt-1 bg-gray-50 dark:bg-white/5">
                              <OzellikFormu tip={oz.id} deger={form.gelismisAyarlar[oz.id] || {}} guncelle={(alan, val) => ozGuncelle(oz.id, alan, val)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Kaydet */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Tip Yönetimi Sekmesi (3 Sütunlu Hiyerarşik)   */
/* ============================================= */

function TipYonetimiSekmesi() {
  // Veriler
  const [gruplar, setGruplar] = useState([]);
  const [urunTipleri, setUrunTipleri] = useState([]);
  const [uygulamaTipleri, setUygulamaTipleri] = useState([]);
  
  // Seçilen öğeler
  const [seciliGrup, setSeciliGrup] = useState(null);
  const [seciliUrunTipleri, setSeciliUrunTipleri] = useState([]); // Çoklu seçim için array
  
  // Yeni ekleme inputları - useRef ile focus koruma
  const [yeniGrup, setYeniGrup] = useState("");
  const [yeniUrunTipi, setYeniUrunTipi] = useState("");
  const [yeniUygulamaTipi, setYeniUygulamaTipi] = useState("");
  
  // Input ref'leri - focus kaybını önlemek için
  const grupInputRef = useRef(null);
  const urunTipiInputRef = useRef(null);
  const uygulamaTipiInputRef = useRef(null);
  
  // Modal
  const [grupModal, setGrupModal] = useState(null);
  const [hizliEkleModal, setHizliEkleModal] = useState(null); // "urunTipi" | "uygulamaTipi" | null
  
  // Silme onay state'leri
  const [silinecekGrup, setSilinecekGrup] = useState(null);
  const [silinecekUrunTipi, setSilinecekUrunTipi] = useState(null);
  const [silinecekUygulamaTipi, setSilinecekUygulamaTipi] = useState(null);
  const [silmeYukleniyor, setSilmeYukleniyor] = useState(false);
  
  // Unique uyarı state'leri
  const [grupUyari, setGrupUyari] = useState("");
  const [urunTipiUyari, setUrunTipiUyari] = useState("");
  const [uygulamaTipiUyari, setUygulamaTipiUyari] = useState("");
  
  // Düzenleme modal state'leri
  const [duzenleUrunTipi, setDuzenleUrunTipi] = useState(null);
  const [duzenleUygulamaTipi, setDuzenleUygulamaTipi] = useState(null);

  // Grupları yükle
  const gruplariYukle = useCallback(async () => {
    try {
      const res = await apiGet("/urunler/gruplar");
      setGruplar(res.veri || []);
    } catch (e) {
      console.error("Gruplar yuklenemedi:", e);
    }
  }, []);

  // Ürün tiplerini yükle (seçili gruba göre)
  const urunTipleriniYukle = useCallback(async (grupId) => {
    try {
      const url = grupId ? `/urunler/tipler?grup_id=${grupId}` : "/urunler/tipler";
      const res = await apiGet(url);
      setUrunTipleri(res.veri || []);
    } catch (e) {
      console.error("Urun tipleri yuklenemedi:", e);
    }
  }, []);

  // Uygulama tiplerini yükle (seçili ürün tiplerine göre - çoklu)
  const uygulamaTipleriniYukle = useCallback(async (urunTipiIdler) => {
    try {
      if (!urunTipiIdler || urunTipiIdler.length === 0) {
        setUygulamaTipleri([]);
        return;
      }
      // Tüm seçili tiplerin uygulama tiplerini paralel yükle
      const promises = urunTipiIdler.map(id => apiGet(`/urunler/uygulama-tipler?urun_tipi_id=${id}`));
      const sonuclar = await Promise.all(promises);
      
      // Uygulama tiplerini birleştir ve hangi ürün tipine ait olduğunu ekle
      const tumTipler = [];
      sonuclar.forEach((res, index) => {
        const urunTipi = urunTipleri.find(t => t.id === urunTipiIdler[index]);
        (res.veri || []).forEach(tip => {
          tumTipler.push({
            ...tip,
            urunTipiAdi: urunTipi?.ad || 'Bilinmiyor',
            urunTipiId: urunTipiIdler[index]
          });
        });
      });
      setUygulamaTipleri(tumTipler);
    } catch (e) {
      console.error("Uygulama tipleri yuklenemedi:", e);
    }
  }, [urunTipleri]);

  // İlk yükleme
  useEffect(() => { gruplariYukle(); }, [gruplariYukle]);

  // Grup seçilince ürün tiplerini yükle
  useEffect(() => {
    if (seciliGrup) {
      urunTipleriniYukle(seciliGrup.id);
      setSeciliUrunTipleri([]);
      setUygulamaTipleri([]);
    } else {
      setUrunTipleri([]);
      setSeciliUrunTipleri([]);
      setUygulamaTipleri([]);
    }
  }, [seciliGrup, urunTipleriniYukle]);

  // Ürün tipleri seçilince uygulama tiplerini yükle (çoklu)
  useEffect(() => {
    if (seciliUrunTipleri.length > 0) {
      uygulamaTipleriniYukle(seciliUrunTipleri.map(t => t.id));
    } else {
      setUygulamaTipleri([]);
    }
  }, [seciliUrunTipleri, uygulamaTipleriniYukle]);

  // CRUD İşlemleri
  const grupEkle = async () => {
    if (!yeniGrup.trim()) return;
    if (gruplar.some(g => g.ad.toLocaleLowerCase('tr') === yeniGrup.trim().toLocaleLowerCase('tr'))) {
      setGrupUyari("Bu isimde bir grup zaten mevcut.");
      setTimeout(() => setGrupUyari(""), 3000);
      return;
    }
    try {
      await apiPost("/urunler/gruplar", { ad: yeniGrup.trim(), aktif: true });
      setYeniGrup("");
      setGrupUyari("");
      await gruplariYukle();
      grupInputRef.current?.focus();
    } catch (e) {
      const msg = e?.message || e?.mesaj || "Bir hata oluştu.";
      setGrupUyari(msg);
      setTimeout(() => setGrupUyari(""), 4000);
      console.error("Grup ekleme hatasi:", e);
    }
  };

  const grupKaydet = async (veri) => {
    try {
      const gonder = { ad: veri.ad, aciklama: veri.aciklama, aktif: veri.aktif };
      if (veri.id) {
        await apiPut(`/urunler/gruplar/${veri.id}`, gonder);
      } else {
        await apiPost("/urunler/gruplar", gonder);
      }
      await gruplariYukle();
      setGrupModal(null);
    } catch (e) {
      const msg = e?.message || e?.mesaj || "Bir hata oluştu.";
      setGrupUyari(msg); setTimeout(() => setGrupUyari(""), 4000);
      console.error("Grup kaydetme hatasi:", e);
    }
  };

  const grupSil = async () => {
    if (!silinecekGrup) return;
    setSilmeYukleniyor(true);
    try {
      await apiDelete(`/urunler/gruplar/${silinecekGrup.id}`);
      if (seciliGrup?.id === silinecekGrup.id) setSeciliGrup(null);
      await gruplariYukle();
      setSilinecekGrup(null);
    } catch (e) {
      console.error("Grup silme hatasi:", e);
    } finally {
      setSilmeYukleniyor(false);
    }
  };

  const urunTipiEkle = async (grupIdOverride = null) => {
    if (!yeniUrunTipi.trim()) return;
    if (urunTipleri.some(t => t.ad.toLocaleLowerCase('tr') === yeniUrunTipi.trim().toLocaleLowerCase('tr'))) {
      setUrunTipiUyari("Bu isimde bir ürün tipi zaten mevcut.");
      setTimeout(() => setUrunTipiUyari(""), 3000);
      return;
    }
    const hedefGrupId = grupIdOverride || seciliGrup?.id;
    try {
      await apiPost("/urunler/tipler", { ad: yeniUrunTipi.trim(), grup_id: hedefGrupId || null });
      setYeniUrunTipi("");
      setUrunTipiUyari("");
      if (seciliGrup) {
        await urunTipleriniYukle(seciliGrup.id);
      }
      urunTipiInputRef.current?.focus();
    } catch (e) {
      const msg = e?.message || e?.mesaj || "Bir hata oluştu.";
      setUrunTipiUyari(msg);
      setTimeout(() => setUrunTipiUyari(""), 4000);
      console.error("Urun tipi ekleme hatasi:", e);
    }
  };

  const urunTipiSil = async () => {
    if (!silinecekUrunTipi) return;
    setSilmeYukleniyor(true);
    try {
      await apiDelete(`/urunler/tipler/${silinecekUrunTipi.id}`);
      setSeciliUrunTipleri(prev => prev.filter(t => t.id !== silinecekUrunTipi.id));
      if (seciliGrup) {
        await urunTipleriniYukle(seciliGrup.id);
      }
      setSilinecekUrunTipi(null);
    } catch (e) {
      console.error("Urun tipi silme hatasi:", e);
    } finally {
      setSilmeYukleniyor(false);
    }
  };

  const urunTipiKaydet = async (veri) => {
    try {
      await apiPut(`/urunler/tipler/${veri.id}`, { ad: veri.ad });
      if (seciliGrup) await urunTipleriniYukle(seciliGrup.id);
      setSeciliUrunTipleri(prev => prev.map(t => t.id === veri.id ? { ...t, ad: veri.ad } : t));
      setDuzenleUrunTipi(null);
    } catch (e) {
      const msg = e?.message || e?.mesaj || "Bir hata oluştu.";
      setUrunTipiUyari(msg); setTimeout(() => setUrunTipiUyari(""), 4000);
      console.error("Urun tipi kaydetme hatasi:", e);
    }
  };

  const uygulamaTipiEkle = async (urunTipiIdOverride = null) => {
    if (!yeniUygulamaTipi.trim()) return;
    if (uygulamaTipleri.some(t => t.ad.toLocaleLowerCase('tr') === yeniUygulamaTipi.trim().toLocaleLowerCase('tr'))) {
      setUygulamaTipiUyari("Bu isimde bir uygulama tipi zaten mevcut.");
      setTimeout(() => setUygulamaTipiUyari(""), 3000);
      return;
    }
    try {
      // Çoklu seçim varsa toplu ekle
      if (seciliUrunTipleri.length > 1) {
        await apiPost("/urunler/uygulama-tipler/toplu", { 
          ad: yeniUygulamaTipi.trim(), 
          urun_tipi_idler: seciliUrunTipleri.map(t => t.id) 
        });
      } else {
        const hedefUrunTipiId = urunTipiIdOverride || seciliUrunTipleri[0]?.id;
        await apiPost("/urunler/uygulama-tipler", { ad: yeniUygulamaTipi.trim(), urun_tipi_id: hedefUrunTipiId || null });
      }
      setYeniUygulamaTipi("");
      setUygulamaTipiUyari("");
      if (seciliUrunTipleri.length > 0) {
        await uygulamaTipleriniYukle(seciliUrunTipleri.map(t => t.id));
      }
      uygulamaTipiInputRef.current?.focus();
    } catch (e) {
      const msg = e?.message || e?.mesaj || "Bir hata oluştu.";
      setUygulamaTipiUyari(msg);
      setTimeout(() => setUygulamaTipiUyari(""), 4000);
      console.error("Uygulama tipi ekleme hatasi:", e);
    }
  };

  const uygulamaTipiSil = async () => {
    if (!silinecekUygulamaTipi) return;
    setSilmeYukleniyor(true);
    try {
      await apiDelete(`/urunler/uygulama-tipler/${silinecekUygulamaTipi.id}`);
      if (seciliUrunTipleri.length > 0) {
        await uygulamaTipleriniYukle(seciliUrunTipleri.map(t => t.id));
      }
      setSilinecekUygulamaTipi(null);
    } catch (e) {
      console.error("Uygulama tipi silme hatasi:", e);
    } finally {
      setSilmeYukleniyor(false);
    }
  };

  const uygulamaTipiKaydet = async (veri) => {
    try {
      await apiPut(`/urunler/uygulama-tipler/${veri.id}`, { ad: veri.ad });
      if (seciliUrunTipleri.length > 0) {
        await uygulamaTipleriniYukle(seciliUrunTipleri.map(t => t.id));
      }
      setDuzenleUygulamaTipi(null);
    } catch (e) {
      const msg = e?.message || e?.mesaj || "Bir hata oluştu.";
      setUygulamaTipiUyari(msg); setTimeout(() => setUygulamaTipiUyari(""), 4000);
      console.error("Uygulama tipi kaydetme hatasi:", e);
    }
  };

  // Ürün tipi seçim toggle
  const urunTipiSecimToggle = (tip) => {
    setSeciliUrunTipleri(prev => {
      const mevcutMu = prev.some(t => t.id === tip.id);
      if (mevcutMu) {
        return prev.filter(t => t.id !== tip.id);
      } else {
        return [...prev, tip];
      }
    });
  };

  // Tümünü seç/kaldır
  const tumUrunTipleriniSec = () => {
    if (seciliUrunTipleri.length === urunTipleri.length) {
      setSeciliUrunTipleri([]);
    } else {
      setSeciliUrunTipleri([...urunTipleri]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hızlı Ekle Butonları */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-white/5 dark:to-white/[0.02] border border-gray-200 dark:border-white/10">
        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Hızlı Ekle:</span>
        <button
          onClick={() => setHizliEkleModal("urunTipi")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium shadow-sm cursor-pointer transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ürün Tipi (Grupsuz)
        </button>
        <button
          onClick={() => setHizliEkleModal("uygulamaTipi")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium shadow-sm cursor-pointer transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Uygulama Tipi (Tipsiz)
        </button>
      </div>

      {/* 3 Sütunlu Panel */}
      <div className="h-[calc(100vh-340px)] min-h-[400px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Sol: Ürün Grupları */}
          <PanelKutusu baslik="Ürün Grupları" aciklama="Ana kategorileri yönetin" renk="from-blue-500 to-blue-600">
            {/* Yeni Grup Ekleme */}
            <div className="flex items-center gap-2 mb-3">
              <input
                ref={grupInputRef}
                type="text"
                value={yeniGrup}
                onChange={(e) => setYeniGrup(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && grupEkle()}
                placeholder="Yeni grup adı..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={grupEkle}
                disabled={!yeniGrup.trim()}
                className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white flex items-center justify-center cursor-pointer"
                title="Ekle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {grupUyari && (
              <p className="text-xs text-red-500 -mt-1 mb-2 px-1">{grupUyari}</p>
            )}

            {/* Grup Listesi */}
            <div className="space-y-2">
              {gruplar.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-slate-500 py-6 text-sm">Henüz grup eklenmemiş</p>
              ) : (
                gruplar.map((g) => (
                  <TipListeOgesi
                    key={g.id}
                    oge={g}
                    secili={seciliGrup?.id === g.id}
                    onClick={() => setSeciliGrup(seciliGrup?.id === g.id ? null : g)}
                    onEdit={setGrupModal}
                    onDelete={setSilinecekGrup}
                    aktifGoster={true}
                  />
                ))
              )}
            </div>
          </PanelKutusu>

          {/* Orta: Ürün Tipleri */}
          <PanelKutusu 
            baslik="Ürün Tipleri" 
            aciklama={seciliGrup ? (
              seciliUrunTipleri.length > 0 
                ? `${seciliUrunTipleri.length} tip seçili` 
                : `"${seciliGrup.ad}" için tipler`
            ) : "Grup seçilmedi"} 
            renk="from-emerald-500 to-emerald-600"
          >
            {!seciliGrup ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-slate-400 text-sm">Sol taraftan bir grup seçin</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">veya üstten "Hızlı Ekle" kullanın</p>
              </div>
            ) : (
              <>
                {/* Yeni Ürün Tipi Ekleme */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    ref={urunTipiInputRef}
                    type="text"
                    value={yeniUrunTipi}
                    onChange={(e) => setYeniUrunTipi(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && urunTipiEkle()}
                    placeholder="Yeni ürün tipi..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={() => urunTipiEkle()}
                    disabled={!yeniUrunTipi.trim()}
                    className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white flex items-center justify-center cursor-pointer"
                    title="Ekle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {urunTipiUyari && (
                  <p className="text-xs text-red-500 -mt-1 mb-2 px-1">{urunTipiUyari}</p>
                )}

                {/* Ürün Tipi Listesi - Çoklu Seçim */}
                {urunTipleri.length > 1 && (
                  <button
                    onClick={tumUrunTipleriniSec}
                    className="w-full mb-2 px-3 py-1.5 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                  >
                    {seciliUrunTipleri.length === urunTipleri.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                  </button>
                )}
                <div className="space-y-2">
                  {urunTipleri.length === 0 ? (
                    <p className="text-center text-gray-400 dark:text-slate-500 py-6 text-sm">Bu grupta henüz ürün tipi yok</p>
                  ) : (
                    urunTipleri.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => urunTipiSecimToggle(t)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                          seciliUrunTipleri.some(s => s.id === t.id)
                            ? "bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-500"
                            : "bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10"
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${
                          seciliUrunTipleri.some(s => s.id === t.id)
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-gray-300 dark:border-white/20"
                        }`}>
                          {seciliUrunTipleri.some(s => s.id === t.id) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {/* İsim */}
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{t.ad}</span>
                        {/* Düzenle butonu */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDuzenleUrunTipi(t); }}
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Sil butonu */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSilinecekUrunTipi(t); }}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </PanelKutusu>

          {/* Sağ: Uygulama Tipleri */}
          <PanelKutusu 
            baslik="Uygulama Tipleri" 
            aciklama={
              seciliUrunTipleri.length > 0 
                ? (seciliUrunTipleri.length === 1 
                    ? `"${seciliUrunTipleri[0].ad}" için uygulamalar`
                    : `${seciliUrunTipleri.length} tipin uygulamaları`
                  )
                : "Ürün tipi seçilmedi"
            } 
            renk="from-purple-500 to-purple-600"
          >
            {seciliUrunTipleri.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-slate-400 text-sm">Ortadan bir ürün tipi seçin</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">veya üstten "Hızlı Ekle" kullanın</p>
              </div>
            ) : (
              <>
                {/* Yeni Uygulama Tipi Ekleme */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    ref={uygulamaTipiInputRef}
                    type="text"
                    value={yeniUygulamaTipi}
                    onChange={(e) => setYeniUygulamaTipi(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && uygulamaTipiEkle()}
                    placeholder="Yeni uygulama tipi..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <button
                    onClick={() => uygulamaTipiEkle()}
                    disabled={!yeniUygulamaTipi.trim()}
                    className="w-8 h-8 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white flex items-center justify-center cursor-pointer"
                    title="Ekle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {uygulamaTipiUyari && (
                  <p className="text-xs text-red-500 -mt-1 mb-2 px-1">{uygulamaTipiUyari}</p>
                )}

                {/* Uygulama Tipi Listesi - Ürün tipi etiketi ile */}
                <div className="space-y-2">
                  {uygulamaTipleri.length === 0 ? (
                    <p className="text-center text-gray-400 dark:text-slate-500 py-6 text-sm">
                      {seciliUrunTipleri.length > 1 
                        ? "Seçili tiplerde henüz uygulama tipi yok"
                        : "Bu ürün tipinde henüz uygulama tipi yok"
                      }
                    </p>
                  ) : (
                    uygulamaTipleri.map((t, idx) => (
                      <div
                        key={`${t.id}-${t.urunTipiId || idx}`}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                      >
                        {/* Uygulama adı */}
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{t.ad}</span>
                        {/* Ürün tipi etiketi (sadece çoklu seçimde göster) */}
                        {seciliUrunTipleri.length > 1 && t.urunTipiAdi && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                            {t.urunTipiAdi}
                          </span>
                        )}
                        {/* Düzenle butonu */}
                        <button
                          onClick={() => setDuzenleUygulamaTipi(t)}
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Sil butonu */}
                        <button
                          onClick={() => setSilinecekUygulamaTipi(t)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </PanelKutusu>
        </div>
      </div>

      {/* Grup Düzenleme Modal */}
      {grupModal && <GrupDuzenlemeModal modal={grupModal} kapat={() => setGrupModal(null)} kaydet={grupKaydet} />}
      
      {/* Ürün Tipi Düzenleme Modal */}
      {duzenleUrunTipi && (
        <TipDuzenlemeModal 
          modal={duzenleUrunTipi} 
          baslik="Ürün Tipi Düzenle"
          kapat={() => setDuzenleUrunTipi(null)} 
          kaydet={urunTipiKaydet} 
        />
      )}
      
      {/* Uygulama Tipi Düzenleme Modal */}
      {duzenleUygulamaTipi && (
        <TipDuzenlemeModal 
          modal={duzenleUygulamaTipi} 
          baslik="Uygulama Tipi Düzenle"
          kapat={() => setDuzenleUygulamaTipi(null)} 
          kaydet={uygulamaTipiKaydet} 
        />
      )}
      
      {/* Hızlı Ekle Modal */}
      {hizliEkleModal && (
        <HizliEkleModal
          tip={hizliEkleModal}
          gruplar={gruplar}
          urunTipleri={urunTipleri}
          kapat={() => setHizliEkleModal(null)}
          onEkle={async (tip, ad, parentIdOrArray) => {
            try {
              if (tip === "urunTipi") {
                await apiPost("/urunler/tipler", { ad, grup_id: parentIdOrArray || null });
              } else {
                // Çoklu seçim kontrolü
                if (Array.isArray(parentIdOrArray) && parentIdOrArray.length > 0) {
                  // Toplu ekleme
                  await apiPost("/urunler/uygulama-tipler/toplu", { ad, urun_tipi_idler: parentIdOrArray });
                } else {
                  // Tekli ekleme
                  await apiPost("/urunler/uygulama-tipler", { ad, urun_tipi_id: parentIdOrArray || null });
                }
              }
              // Listeleri yenile
              if (seciliGrup) await urunTipleriniYukle(seciliGrup.id);
              if (seciliUrunTipleri.length > 0) await uygulamaTipleriniYukle(seciliUrunTipleri.map(t => t.id));
              setHizliEkleModal(null);
            } catch (e) {
              console.error("Hizli ekleme hatasi:", e);
            }
          }}
        />
      )}

      {/* Grup Silme Onay Modalı */}
      <SilmeOnayModal
        acik={!!silinecekGrup}
        kapat={() => setSilinecekGrup(null)}
        onay={grupSil}
        baslik="Grubu silmek istediğinizden emin misiniz?"
        mesaj={silinecekGrup ? `"${silinecekGrup.ad}" grubu ve ilişkili tüm tipler silinecek.` : ""}
        yukleniyor={silmeYukleniyor}
      />

      {/* Ürün Tipi Silme Onay Modalı */}
      <SilmeOnayModal
        acik={!!silinecekUrunTipi}
        kapat={() => setSilinecekUrunTipi(null)}
        onay={urunTipiSil}
        baslik="Ürün tipini silmek istediğinizden emin misiniz?"
        mesaj={silinecekUrunTipi ? `"${silinecekUrunTipi.ad}" tipi kalıcı olarak silinecek.` : ""}
        yukleniyor={silmeYukleniyor}
      />

      {/* Uygulama Tipi Silme Onay Modalı */}
      <SilmeOnayModal
        acik={!!silinecekUygulamaTipi}
        kapat={() => setSilinecekUygulamaTipi(null)}
        onay={uygulamaTipiSil}
        baslik="Uygulama tipini silmek istediğinizden emin misiniz?"
        mesaj={silinecekUygulamaTipi ? `"${silinecekUygulamaTipi.ad}" uygulama tipi kalıcı olarak silinecek.` : ""}
        yukleniyor={silmeYukleniyor}
      />
    </div>
  );
}

// Panel Kutusu bileşeni (memoized)
const PanelKutusu = memo(function PanelKutusu({ baslik, aciklama, renk, children }) {
  return (
    <div className="flex flex-col h-full rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className={`px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r ${renk}`}>
        <h3 className="font-bold text-white text-sm">{baslik}</h3>
        <p className="text-xs text-white/70 mt-0.5">{aciklama}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {children}
      </div>
    </div>
  );
});

// Tip Liste Öğesi bileşeni (memoized)
const TipListeOgesi = memo(function TipListeOgesi({ oge, secili, onClick, onEdit, onDelete, aktifGoster = false }) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
        secili
          ? "bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-500"
          : "bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`font-medium truncate ${secili ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
          {oge.ad}
        </span>
        {aktifGoster && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${oge.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"}`}>
            {oge.aktif ? "Aktif" : "Pasif"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(oge); }}
            className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
            title="Düzenle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(oge); }}
          className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
          title="Sil"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// Hızlı Ekle Modal - Multi-select destekli
function HizliEkleModal({ tip, gruplar, urunTipleri, kapat, onEkle }) {
  const [ad, setAd] = useState("");
  const [parentId, setParentId] = useState("");
  const [seciliTipler, setSeciliTipler] = useState([]); // Çoklu seçim için
  const [tumTipler, setTumTipler] = useState([]);
  const [cokluMod, setCokluMod] = useState(false); // Çoklu seçim modu
  const ref = useRef(null);
  const inputRef = useRef(null);
  
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  // Uygulama tipi eklerken tüm ürün tiplerini yükle
  useEffect(() => {
    if (tip === "uygulamaTipi") {
      apiGet("/urunler/tipler").then(res => setTumTipler(res.veri || [])).catch(() => {});
    }
  }, [tip]);

  // Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Çoklu seçim toggle
  const tipSecimToggle = (tipId) => {
    setSeciliTipler(prev => 
      prev.includes(tipId) 
        ? prev.filter(id => id !== tipId) 
        : [...prev, tipId]
    );
  };

  // Tümünü seç/kaldır
  const tumunuSec = () => {
    if (seciliTipler.length === tumTipler.length) {
      setSeciliTipler([]);
    } else {
      setSeciliTipler(tumTipler.map(t => t.id));
    }
  };

  const gonder = (e) => {
    e.preventDefault();
    if (!ad.trim()) return;
    
    if (tip === "uygulamaTipi" && cokluMod && seciliTipler.length > 0) {
      // Çoklu ekleme
      onEkle(tip, ad.trim(), seciliTipler);
    } else {
      // Tekli ekleme
      onEkle(tip, ad.trim(), parentId || null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r ${tip === "urunTipi" ? "from-emerald-500 to-emerald-600" : "from-purple-500 to-purple-600"} rounded-t-2xl`}>
          <h3 className="text-lg font-bold text-white">
            {tip === "urunTipi" ? "Hızlı Ürün Tipi Ekle" : "Hızlı Uygulama Tipi Ekle"}
          </h3>
          <p className="text-sm text-white/70 mt-0.5">
            {tip === "urunTipi" ? "İsteğe bağlı olarak bir gruba atayabilirsiniz" : "Tek veya çoklu ürün tipine atayabilirsiniz"}
          </p>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              {tip === "urunTipi" ? "Ürün Tipi Adı" : "Uygulama Tipi Adı"} <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder={tip === "urunTipi" ? "Örn: ERP, CRM, Muhasebe..." : "Örn: Web, Windows, Mobil..."}
              className={INPUT_STIL}
              required
            />
          </div>

          {tip === "uygulamaTipi" && (
            <>
              {/* Çoklu Mod Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Çoklu Seçim Modu</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={cokluMod} 
                    onChange={(e) => {
                      setCokluMod(e.target.checked);
                      if (!e.target.checked) setSeciliTipler([]);
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-gray-300 dark:bg-white/20 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </>
          )}

          {tip === "urunTipi" ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Grup (Opsiyonel)</label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={INPUT_STIL}>
                <option value="">-- Grupsuz --</option>
                {gruplar.map((g) => <option key={g.id} value={g.id}>{g.ad}</option>)}
              </select>
            </div>
          ) : cokluMod ? (
            /* Çoklu Seçim Listesi */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                  Ürün Tipleri ({seciliTipler.length} seçili)
                </label>
                <button 
                  type="button" 
                  onClick={tumunuSec}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  {seciliTipler.length === tumTipler.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 divide-y divide-gray-200 dark:divide-white/10">
                {tumTipler.length === 0 ? (
                  <p className="p-3 text-center text-gray-400 dark:text-slate-500 text-sm">Ürün tipi bulunamadı</p>
                ) : (
                  tumTipler.map((t) => (
                    <label 
                      key={t.id} 
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox"
                        checked={seciliTipler.includes(t.id)}
                        onChange={() => tipSecimToggle(t.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">{t.ad}</span>
                      {t.grup_adi && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">{t.grup_adi}</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Tipi (Opsiyonel)</label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={INPUT_STIL}>
                <option value="">-- Tipsiz --</option>
                {tumTipler.map((t) => <option key={t.id} value={t.id}>{t.ad} {t.grup_adi ? `(${t.grup_adi})` : ""}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button 
              type="submit"
              disabled={tip === "uygulamaTipi" && cokluMod && seciliTipler.length === 0}
              className={`px-5 py-2 rounded-lg text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${tip === "urunTipi" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-purple-600 hover:bg-purple-700"}`}
            >
              {cokluMod && seciliTipler.length > 1 ? `${seciliTipler.length} Tipe Ekle` : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GrupDuzenlemeModal({ modal, kapat, kaydet }) {
  const [form, setForm] = useState({
    id: modal.id,
    ad: modal.ad,
    aciklama: modal.aciklama || "",
    aktif: modal.aktif !== false,
  });
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const gonder = (e) => {
    e.preventDefault();
    if (!form.ad) return;
    kaydet(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Grup Düzenle</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Grup Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.ad} onChange={(e) => setForm((o) => ({ ...o, ad: e.target.value }))} placeholder="Grup adını giriniz" className={INPUT_STIL} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Açıklama</label>
            <input type="text" value={form.aciklama} onChange={(e) => setForm((o) => ({ ...o, aciklama: e.target.value }))} placeholder="Kısa açıklama" className={INPUT_STIL} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.aktif} onChange={(e) => setForm((o) => ({ ...o, aktif: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Aktif</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Tip Düzenleme Modal (Ürün Tipi / Uygulama)  */
/* ============================================= */
function TipDuzenlemeModal({ modal, baslik, kapat, kaydet }) {
  const [ad, setAd] = useState(modal.ad || "");
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const gonder = (e) => {
    e.preventDefault();
    if (!ad.trim()) return;
    kaydet({ id: modal.id, ad: ad.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{baslik}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ad <span className="text-red-500">*</span></label>
            <input type="text" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Ad giriniz" className={INPUT_STIL} required autoFocus />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Sürümler Sekmesi                              */
/* ============================================= */

/* Sürüm notlarını özetle (accordion alt yazısı için) */
const surumOzet = (s) => {
  const parcalar = [];
  if (s.duzenlenenler) parcalar.push(s.duzenlenenler);
  if (s.eklenenler) parcalar.push(s.eklenenler);
  if (s.cikarilanlar) parcalar.push(s.cikarilanlar);
  return parcalar.join(" Â· ") || "Not eklenmemiş";
};

function SurumlerSekmesi() {
  const [surumler, setSurumler] = useState([]);
  const [modal, setModal] = useState(null);
  const [detayModal, setDetayModal] = useState(null);
  const [acikGruplar, setAcikGruplar] = useState({});
  const [dosyaDegistirId, setDosyaDegistirId] = useState(null);
  const [silOnay, setSilOnay] = useState(null);
  const [dosyaSilOnay, setDosyaSilOnay] = useState(null);
  const dosyaInputRef = useRef(null);

  const verileriYukle = async () => {
    try {
      const res = await apiGet("/surumler");
      setSurumler(res.veri.map((s) => ({
        id: s.id,
        urunAdi: s.urun_adi || "",
        surum: s.surum,
        tarih: s.tarih ? s.tarih.slice(0, 10) : "",
        duzenlenenler: s.duzenlenenler || "",
        eklenenler: s.eklenenler || "",
        cikarilanlar: s.cikarilanlar || "",
        dosyaAdi: s.dosya_adi || "",
        aktif: !!s.aktif,
      })));
    } catch (e) {
      console.error("Surum verileri yuklenemedi:", e);
    }
  };

  useEffect(() => { verileriYukle(); }, []);

  /* Dosya değiştir / kaldır */
  const dosyaDegistir = (id) => {
    setDosyaDegistirId(id);
    setTimeout(() => dosyaInputRef.current?.click(), 0);
  };
  const dosyaKaldirOnayla = async () => {
    if (!dosyaSilOnay) return;
    try {
      await apiDelete(`/surumler/${dosyaSilOnay.id}/dosya`);
      setSurumler((o) => o.map((s) => s.id === dosyaSilOnay.id ? { ...s, dosyaAdi: "" } : s));
      if (detayModal && detayModal.id === dosyaSilOnay.id) setDetayModal((o) => ({ ...o, dosyaAdi: "" }));
    } catch (e) {
      console.error("Dosya silme hatasi:", e);
    }
    setDosyaSilOnay(null);
  };
  const dosyaSecildi = async (e) => {
    const dosya = e.target.files[0];
    if (dosya && dosyaDegistirId) {
      try {
        const fd = new FormData();
        fd.append("dosya", dosya);
        const res = await apiUpload(`/surumler/${dosyaDegistirId}/dosya`, fd);
        const yeniAd = res.dosya_adi || dosya.name;
        setSurumler((o) => o.map((s) => s.id === dosyaDegistirId ? { ...s, dosyaAdi: yeniAd } : s));
        if (detayModal && detayModal.id === dosyaDegistirId) setDetayModal((o) => ({ ...o, dosyaAdi: yeniAd }));
      } catch (err) {
        console.error("Dosya yukleme hatasi:", err);
      }
    }
    setDosyaDegistirId(null);
    if (dosyaInputRef.current) dosyaInputRef.current.value = "";
  };

  /* Sürüm sil (onaylı) */
  const surumSilOnayla = async () => {
    if (!silOnay) return;
    try {
      await apiDelete(`/surumler/${silOnay.id}`);
      await verileriYukle();
      if (detayModal && detayModal.id === silOnay.id) setDetayModal(null);
      setSilOnay(null);
    } catch (e) {
      console.error("Surum silme hatasi:", e);
    }
  };

  const kaydet = async (veri) => {
    try {
      const gonder = {
        urun_adi: veri.urunAdi,
        surum: veri.surum,
        tarih: veri.tarih,
        duzenlenenler: veri.duzenlenenler,
        eklenenler: veri.eklenenler,
        cikarilanlar: veri.cikarilanlar,
        dosya_adi: veri.dosyaAdi,
        aktif: veri.aktif,
      };
      let surumId = veri.id;
      if (veri.id) {
        await apiPut(`/surumler/${veri.id}`, gonder);
      } else {
        const res = await apiPost("/surumler", gonder);
        surumId = res.id;
      }
      // Dosya varsa yükle
      if (veri._dosyaObj && surumId) {
        const fd = new FormData();
        fd.append("dosya", veri._dosyaObj);
        await apiUpload(`/surumler/${surumId}/dosya`, fd);
      }
      await verileriYukle();
      setModal(null);
    } catch (e) {
      console.error("Surum kaydetme hatasi:", e);
    }
  };

  /* ---- Ürün adına göre grupla, her grupta tarihe göre sırala (en yeni ilk) ---- */
  const gruplar = {};
  surumler.forEach((s) => {
    if (!gruplar[s.urunAdi]) gruplar[s.urunAdi] = [];
    gruplar[s.urunAdi].push(s);
  });
  Object.values(gruplar).forEach((liste) => liste.sort((a, b) => b.tarih.localeCompare(a.tarih)));

  const grupToggle = (urunAdi) => {
    setAcikGruplar((o) => ({ ...o, [urunAdi]: !o[urunAdi] }));
  };

  const benzersizUrunSayisi = Object.keys(gruplar).length;

  return (
    <div>
      {/* Gizli dosya input - dosya değiştirmek için */}
      <input ref={dosyaInputRef} type="file" accept=".zip" onChange={dosyaSecildi} className="hidden" />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{benzersizUrunSayisi} ürün, {surumler.length} sürüm kaydı</p>
        <button onClick={() => setModal("yeni")}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Sürüm
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(gruplar).map(([urunAdi, urunSurumleri]) => {
          const guncel = urunSurumleri[0];
          const eskiler = urunSurumleri.slice(1);
          const acik = acikGruplar[urunAdi];

          return (
            <div key={urunAdi} className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden transition-all">
              {/* Ana Satır - Güncel Sürüm */}
              <div
                onClick={() => eskiler.length > 0 && grupToggle(urunAdi)}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  eskiler.length > 0 ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]" : ""
                } ${acik ? "bg-gray-50/50 dark:bg-white/[0.02]" : ""}`}
              >
                {/* Açılır/Kapanır İkon */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {eskiler.length > 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${acik ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600" />
                  )}
                </div>

                {/* Ürün Bilgileri */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{urunAdi}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      v{guncel.surum}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      Güncel
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 dark:text-slate-500">{guncel.tarih}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{surumOzet(guncel)}</span>
                  </div>
                  {/* Dosya Gösterimi */}
                  {guncel.dosyaAdi ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 max-w-[180px] truncate">{guncel.dosyaAdi}</span>
                      </div>
                      <a href={`/api/surumler/${guncel.id}/indir`} download onClick={(e) => e.stopPropagation()} title="İndir"
                        className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </a>
                      <button onClick={(e) => { e.stopPropagation(); dosyaDegistir(guncel.id); }} title="Dosyayı Değiştir"
                        className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-500/15 hover:bg-blue-200 dark:hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDosyaSilOnay(guncel); }} title="Dosyayı Kaldır"
                        className="w-6 h-6 rounded-md bg-red-100 dark:bg-red-500/15 hover:bg-red-200 dark:hover:bg-red-500/25 text-red-600 dark:text-red-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1.5">
                      <button onClick={(e) => { e.stopPropagation(); dosyaDegistir(guncel.id); }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Dosya Ekle
                      </button>
                    </div>
                  )}
                </div>

                {/* Sürüm Sayısı Rozeti */}
                {eskiler.length > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    {eskiler.length} eski sürüm
                  </span>
                )}

                {/* Detay Butonu */}
                <button onClick={(e) => { e.stopPropagation(); setDetayModal(guncel); }} title="Detay"
                  className="w-8 h-8 rounded-lg bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>

                {/* Düzenle Butonu */}
                <button onClick={(e) => { e.stopPropagation(); setModal(guncel); }} title="Düzenle"
                  className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>

                {/* Sil Butonu */}
                <button onClick={(e) => { e.stopPropagation(); setSilOnay(guncel); }} title="Sil"
                  className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              {/* Eski Sürümler - Accordion İçeriği */}
              {acik && eskiler.length > 0 && (
                <div className="border-t border-gray-200 dark:border-white/10">
                  <div className="px-5 py-2 bg-gray-50 dark:bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Geçmiş Sürümler</p>
                  </div>
                  {eskiler.map((s, i) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 px-5 py-3 ml-6 border-l-2 border-gray-200 dark:border-white/10 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${
                        i < eskiler.length - 1 ? "border-b border-b-gray-100 dark:border-b-white/5" : ""
                      }`}
                    >
                      {/* Timeline Noktası */}
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 -ml-[19px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-slate-600 ring-2 ring-white dark:ring-slate-900" />
                      </div>

                      {/* Sürüm Bilgileri */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400">
                            v{s.surum}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">{s.tarih}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">{surumOzet(s)}</p>
                        {/* Dosya Gösterimi */}
                        {s.dosyaAdi ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 max-w-[140px] truncate">{s.dosyaAdi}</span>
                            </div>
                            <a href={`/api/surumler/${s.id}/indir`} download onClick={(e) => e.stopPropagation()} title="İndir"
                              className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center cursor-pointer transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                            <button onClick={(e) => { e.stopPropagation(); dosyaDegistir(s.id); }} title="Değiştir"
                              className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/15 hover:bg-blue-200 dark:hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDosyaSilOnay(s); }} title="Kaldır"
                              className="w-5 h-5 rounded bg-red-100 dark:bg-red-500/15 hover:bg-red-200 dark:hover:bg-red-500/25 text-red-600 dark:text-red-400 flex items-center justify-center cursor-pointer transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); dosyaDegistir(s.id); }}
                            className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Dosya Ekle
                          </button>
                        )}
                      </div>

                      {/* Detay */}
                      <button onClick={() => setDetayModal(s)} title="Detay"
                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-violet-500 hover:text-white text-gray-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>

                      {/* Düzenle */}
                      <button onClick={() => setModal(s)} title="Düzenle"
                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-blue-500 hover:text-white text-gray-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>

                      {/* Sil */}
                      <button onClick={() => setSilOnay(s)} title="Sil"
                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-red-500 hover:text-white text-gray-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && <SurumModal modal={modal} kapat={() => setModal(null)} kaydet={kaydet} surumler={surumler} />}

      {/* Silme Onay Modalı */}
      {silOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSilOnay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sürümü Sil</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-gray-700 dark:text-slate-300">{silOnay.urunAdi}</span> ürününün
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                <span className="font-mono font-semibold text-violet-600 dark:text-violet-400">v{silOnay.surum}</span> sürümünü silmek istediğinize emin misiniz?
              </p>
              {silOnay.aktif && (
                <div className="mb-4 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">âš  Bu güncel (aktif) sürüm. Silindikten sonra bir önceki sürüm otomatik güncel yapılmayacaktır.</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setSilOnay(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Vazgeç
                </button>
                <button onClick={surumSilOnayla}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-red-600/25 transition-colors">
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dosya Silme Onay Modalı */}
      {dosyaSilOnay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDosyaSilOnay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Dosyayı Kaldır</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                <span className="font-semibold text-gray-700 dark:text-slate-300">{dosyaSilOnay.urunAdi} v{dosyaSilOnay.surum}</span> sürümüne ait
              </p>
              <p className="text-sm mb-5">
                <span className="font-medium text-amber-600 dark:text-amber-400">{dosyaSilOnay.dosyaAdi}</span>
                <span className="text-gray-500 dark:text-slate-400"> dosyasını kaldırmak istediğinize emin misiniz?</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDosyaSilOnay(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Vazgeç
                </button>
                <button onClick={dosyaKaldirOnayla}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer shadow-lg shadow-red-600/25 transition-colors">
                  Evet, Kaldır
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detay Modal */}
      {detayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDetayModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{detayModal.urunAdi}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400">v{detayModal.surum}</span>
                {detayModal.aktif && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">Güncel</span>
                )}
              </div>
              <button onClick={() => setDetayModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span>{detayModal.tarih}</span>
                </div>
              </div>

              {/* Dosya Kartı */}
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] overflow-hidden">
                {detayModal.dosyaAdi ? (
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{detayModal.dosyaAdi}</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Yüklü dosya</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a href={`/api/surumler/${detayModal.id}/indir`} download title="Dosyayı İndir"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200/60 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium cursor-pointer transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          İndir
                        </a>
                        <button onClick={() => dosyaDegistir(detayModal.id)} title="Dosyayı Değiştir"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200/60 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium cursor-pointer transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          Değiştir
                        </button>
                        <button onClick={() => setDosyaSilOnay(detayModal)} title="Dosyayı Kaldır"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200/60 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium cursor-pointer transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Kaldır
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => dosyaDegistir(detayModal.id)}
                    className="w-full p-4 flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 cursor-pointer transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="text-xs font-medium">Bu sürüme dosya eklenmemiş - yüklemek için tıklayın</span>
                  </button>
                )}
              </div>

              {detayModal.duzenlenenler && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Düzenlenenler</p>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-line">{detayModal.duzenlenenler}</p>
                </div>
              )}

              {detayModal.eklenenler && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Yeni Eklenenler</p>
                  </div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 whitespace-pre-line">{detayModal.eklenenler}</p>
                </div>
              )}

              {detayModal.cikarilanlar && (
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">Çıkarılanlar</p>
                  </div>
                  <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-line">{detayModal.cikarilanlar}</p>
                </div>
              )}

              {!detayModal.duzenlenenler && !detayModal.eklenenler && !detayModal.cikarilanlar && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 dark:text-slate-500">Bu sürüm için detaylı not eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SurumModal({ modal, kapat, kaydet, surumler }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    urunAdi: duzenle ? modal.urunAdi : "",
    surum: duzenle ? modal.surum : "",
    tarih: duzenle ? modal.tarih : new Date().toISOString().slice(0, 10),
    duzenlenenler: duzenle ? (modal.duzenlenenler || "") : "",
    eklenenler: duzenle ? (modal.eklenenler || "") : "",
    cikarilanlar: duzenle ? (modal.cikarilanlar || "") : "",
    dosyaAdi: duzenle ? (modal.dosyaAdi || "") : "",
    aktif: duzenle ? modal.aktif : true,
  });
  const [oneriAcik, setOneriAcik] = useState(false);
  const ref = useRef(null);
  const dosyaRef = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  // Benzersiz ürün adları (öneri listesi)
  const benzersizUrunler = [...new Set(surumler.map((s) => s.urunAdi))];
  const filtreliOneriler = form.urunAdi
    ? benzersizUrunler.filter((u) => u.toLowerCase().includes(form.urunAdi.toLowerCase()) && u !== form.urunAdi)
    : benzersizUrunler;

  const urunSec = (urunAdi) => {
    const urunSurumleri = surumler.filter((s) => s.urunAdi === urunAdi).sort((a, b) => b.id - a.id);
    const sonSurum = urunSurumleri[0];
    setForm((o) => ({
      ...o,
      urunAdi,
      surum: sonSurum ? sonSurum.surum : "",
      duzenlenenler: "",
      eklenenler: "",
      cikarilanlar: "",
    }));
    setOneriAcik(false);
  };

  const dosyaSec = (e) => {
    const dosya = e.target.files[0];
    if (dosya) setForm((o) => ({ ...o, dosyaAdi: dosya.name, _dosyaObj: dosya }));
  };

  const gonder = (e) => {
    e.preventDefault();
    if (!form.urunAdi || !form.surum) return;
    kaydet(form);
  };

  const mevcutSurumler = surumler.filter((s) => s.urunAdi === form.urunAdi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Sürüm Düzenle" : "Yeni Sürüm"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4 overflow-y-auto">
          {/* Ürün Adı - otomatik doldurma */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ürün Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.urunAdi}
              onChange={(e) => { setForm((o) => ({ ...o, urunAdi: e.target.value })); setOneriAcik(true); }}
              onFocus={() => setOneriAcik(true)}
              onBlur={() => setTimeout(() => setOneriAcik(false), 200)}
              placeholder="Ürün adını yazın veya seçin"
              className={INPUT_STIL} required autoComplete="off" />
            {oneriAcik && filtreliOneriler.length > 0 && !duzenle && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl max-h-40 overflow-auto">
                {filtreliOneriler.map((u) => (
                  <button type="button" key={u} onMouseDown={() => urunSec(u)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer transition-colors">
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mevcut sürümler bilgisi */}
          {!duzenle && mevcutSurumler.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">Mevcut Sürümler:</p>
              <div className="flex flex-wrap gap-1.5">
                {mevcutSurumler.map((s) => (
                  <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full font-mono ${s.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"}`}>
                    v{s.surum} {s.aktif ? "(Güncel)" : "(Eski)"}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60 mt-1.5">Yeni sürüm eklediğinizde mevcut güncel sürüm otomatik olarak "Eski" yapılır.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Sürüm No <span className="text-red-500">*</span></label>
              <input type="text" value={form.surum} onChange={(e) => setForm((o) => ({ ...o, surum: e.target.value }))} placeholder="1.0.0" className={INPUT_STIL} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tarih <span className="text-red-500">*</span></label>
              <input type="date" value={form.tarih} onChange={(e) => setForm((o) => ({ ...o, tarih: e.target.value }))} className={INPUT_STIL} required />
            </div>
          </div>

          {/* Değişiklik Notları */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wider">Değişiklik Notları</p>

            <div>
              <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Neleri Düzenledin?
                </span>
              </label>
              <textarea value={form.duzenlenenler} onChange={(e) => setForm((o) => ({ ...o, duzenlenenler: e.target.value }))} placeholder="Düzenlenen özellikler, hata düzeltmeleri..." className={INPUT_STIL + " resize-none"} rows={2} />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Yeni Neler Ekledin?
                </span>
              </label>
              <textarea value={form.eklenenler} onChange={(e) => setForm((o) => ({ ...o, eklenenler: e.target.value }))} placeholder="Yeni özellikler, modüller..." className={INPUT_STIL + " resize-none"} rows={2} />
            </div>

            <div>
              <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                  Neler Çıktı?
                </span>
              </label>
              <textarea value={form.cikarilanlar} onChange={(e) => setForm((o) => ({ ...o, cikarilanlar: e.target.value }))} placeholder="Kaldırılan özellikler, eski modüller..." className={INPUT_STIL + " resize-none"} rows={2} />
            </div>
          </div>

          {/* ZIP Dosya Yükleme */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Dosya Yükle (ZIP)</label>
            <input ref={dosyaRef} type="file" accept=".zip" onChange={dosyaSec} className="hidden" />
            <div
              onClick={() => dosyaRef.current?.click()}
              className="flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] hover:border-blue-400 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 cursor-pointer transition-all"
            >
              {form.dosyaAdi ? (
                <div className="flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  <span className="font-medium text-gray-700 dark:text-slate-300">{form.dosyaAdi}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setForm((o) => ({ ...o, dosyaAdi: "", _dosyaObj: null })); if (dosyaRef.current) dosyaRef.current.value = ""; }}
                    className="ml-1 text-red-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-gray-300 dark:text-slate-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-xs text-gray-400 dark:text-slate-500">ZIP dosyası yüklemek için tıklayın</p>
                </div>
              )}
            </div>
          </div>

          {duzenle && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.aktif} onChange={(e) => setForm((o) => ({ ...o, aktif: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Güncel Sürüm</span>
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Kullanıcılar Sekmesi                          */
/* ============================================= */

function KullanicilarSekmesi() {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [modal, setModal] = useState(null);
  const [bildirim, setBildirim] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const kullanicilariGetir = () => {
    setYukleniyor(true);
    apiGet("/yetki/kullanicilar")
      .then((v) => setKullanicilar(v.veri))
      .catch((h) => setBildirim("Kullanıcılar yüklenemedi: " + h.message))
      .finally(() => setYukleniyor(false));
  };

  useEffect(() => { kullanicilariGetir(); }, []);

  /* rol map: backend enum → frontend label */
  const rolMap = { admin: "Admin", kullanici: "Editör", izleyici: "Görüntüleyici" };
  const rolLabel = (r) => rolMap[r] || r;

  const kaydet = async (veri) => {
    try {
      if (veri.id) {
        /* Güncelleme */
        const gonderilecek = { ad_soyad: veri.ad_soyad, eposta: veri.eposta, rol: veri.rol, aktif: veri.aktif === "aktif" || veri.aktif === true };
        if (veri.sifre) gonderilecek.sifre = veri.sifre;
        await apiPut("/yetki/kullanicilar/" + veri.id, gonderilecek);
      } else {
        /* Yeni kayıt */
        await apiPost("/yetki/kullanicilar", { ad_soyad: veri.ad_soyad, eposta: veri.eposta, sifre: veri.sifre, rol: veri.rol, aktif: veri.aktif === "aktif" || veri.aktif === true });
      }
      setModal(null);
      kullanicilariGetir();
      setBildirim(veri.id ? "Kullanıcı güncellendi." : "Kullanıcı eklendi.");
      setTimeout(() => setBildirim(null), 3000);
    } catch (h) {
      setBildirim("Hata: " + h.message);
      setTimeout(() => setBildirim(null), 4000);
    }
  };

  const sil = async (id) => {
    try {
      await apiDelete("/yetki/kullanicilar/" + id);
      kullanicilariGetir();
    } catch (h) {
      setBildirim("Silme hatası: " + h.message);
      setTimeout(() => setBildirim(null), 4000);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{kullanicilar.length} kullanıcı</p>
        <button onClick={() => setModal("yeni")}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Kullanıcı
        </button>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.03]">
              {["Ad Soyad", "E-Posta", "Rol", "Durum", "Son Giriş", "İşlemler"].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {kullanicilar.map((k) => (
              <tr key={k.id} className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${!k.aktif ? "opacity-50" : ""}`}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{(k.ad_soyad || "").split(" ").map((x) => x[0]).join("")}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{k.ad_soyad}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm"><span className="inline-flex items-center group">{k.eposta}<KopyalaButonu metin={k.eposta} /></span></td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    k.rol === "admin" ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"
                    : k.rol === "kullanici" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400"
                  }`}>{rolLabel(k.rol)}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${k.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                    {k.aktif ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{k.son_giris ? new Date(k.son_giris).toLocaleString("tr-TR") : "-"}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setModal(k)} title="Düzenle"
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => sil(k.id)} title="Sil"
                      className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* E-posta bildirim toast */}
      {bildirim && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 animate-[slideInRight_0.3s_ease-out]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <span className="text-sm font-medium">{bildirim}</span>
        </div>
      )}

      {modal && <KullaniciModal modal={modal} kapat={() => setModal(null)} kaydet={kaydet} />}
    </div>
  );
}

function KullaniciModal({ modal, kapat, kaydet }) {
  const duzenle = modal !== "yeni";
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    ad_soyad: duzenle ? modal.ad_soyad : "",
    eposta: duzenle ? modal.eposta : "",
    sifre: "",
    rol: duzenle ? modal.rol : "izleyici",
    aktif: duzenle ? (modal.aktif ? "aktif" : "pasif") : "aktif",
  });
  const [roller, setRoller] = useState([]);
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  useEffect(() => {
    apiGet("/roller").then((res) => setRoller(res.veri || [])).catch(() => {});
  }, []);

  const gonder = (e) => {
    e.preventDefault();
    if (!form.ad_soyad || !form.eposta) return;
    if (!duzenle && !form.sifre) return;
    kaydet(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}</h3>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={gonder} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Soyad <span className="text-red-500">*</span></label>
            <input type="text" value={form.ad_soyad} onChange={(e) => setForm((o) => ({ ...o, ad_soyad: e.target.value }))} className={INPUT_STIL} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">E-Posta <span className="text-red-500">*</span></label>
            <input type="email" value={form.eposta} onChange={(e) => setForm((o) => ({ ...o, eposta: e.target.value }))} className={INPUT_STIL} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Sifre {!duzenle && <span className="text-red-500">*</span>}{duzenle && <span className="text-gray-400 text-[10px]">(boş bırakılırsa değişmez)</span>}</label>
            <input type="password" value={form.sifre} onChange={(e) => setForm((o) => ({ ...o, sifre: e.target.value }))} className={INPUT_STIL} required={!duzenle} placeholder={duzenle ? "●●●●●●●●" : ""} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Rol</label>
            <select value={form.rol} onChange={(e) => setForm((o) => ({ ...o, rol: e.target.value }))} className={INPUT_STIL}>
              {roller.length > 0 ? roller.map((r) => (
                <option key={r.id} value={r.ad}>{r.ad.charAt(0).toUpperCase() + r.ad.slice(1)}</option>
              )) : (
                <>
                  <option value="admin">Admin</option>
                  <option value="kullanici">Editör</option>
                  <option value="izleyici">Görüntüleyici</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
            <select value={form.aktif} onChange={(e) => setForm((o) => ({ ...o, aktif: e.target.value }))} className={INPUT_STIL}>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Roller Sekmesi                                */
/* ============================================= */

/*İzin tanımları - anahtar → etiket */
const IZIN_TANIMLARI = {
  ozet:            { etiket: "Özet Paneli" },
  musteriler:      { etiket: "Müşteriler" },
  bayiler:         { etiket: "Bayiler" },
  yonetim:         { etiket: "Yönetim" },
  lisans_yonetimi: { etiket: "Lisans Yönetimi" },
  raporlar:        { etiket: "Raporlar" },
  takvim:          { etiket: "Takvim" },
  aktivite_logu:   { etiket: "Aktivite Logu" },
  yedekleme:       { etiket: "Yedekleme" },
};

const TUM_IZIN_ANAHTARLARI = Object.keys(IZIN_TANIMLARI);

function RollerSekmesi() {
  const [roller, setRoller] = useState([]);
  const [modal, setModal] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const rolleriGetir = async () => {
    setYukleniyor(true);
    try {
      const res = await apiGet("/roller");
      setRoller(res.veri || []);
    } catch (e) {
      console.error("Roller yuklenemedi:", e);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { rolleriGetir(); }, []);

  const kaydet = async (veri) => {
    try {
      const gonder = { ad: veri.ad, aciklama: veri.aciklama, izinler: veri.izinler, aktif: veri.aktif };
      if (veri.id) {
        await apiPut("/roller/" + veri.id, gonder);
      } else {
        await apiPost("/roller", gonder);
      }
      setModal(null);
      rolleriGetir();
    } catch (e) {
      console.error("Rol kaydetme hatasi:", e);
    }
  };

  const sil = async (id) => {
    try {
      await apiDelete("/roller/" + id);
      rolleriGetir();
    } catch (e) {
      alert(e.message || "Silme hatası oluştu.");
    }
  };

  return (
    <div>
      {/* ---- Üst Bar ---- */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{roller.length} rol tanımlı</p>
        <button onClick={() => setModal("yeni")}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Rol
        </button>
      </div>

      {/* ---- Rol Kartları ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {roller.map((rol) => {
          const izinler = Array.isArray(rol.izinler) ? rol.izinler : [];
          return (
            <div key={rol.id} className={`rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-white/20 ${!rol.aktif ? "opacity-50" : ""}`}>
              {/* Kart Başlık */}
              <div className="px-5 py-4 flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    rol.ad === "admin" ? "bg-violet-100 dark:bg-violet-500/15" :
                    rol.ad === "kullanici" ? "bg-blue-100 dark:bg-blue-500/15" :
                    rol.ad === "izleyici" ? "bg-gray-100 dark:bg-white/10" :
                    "bg-amber-100 dark:bg-amber-500/15"
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${
                      rol.ad === "admin" ? "text-violet-600 dark:text-violet-400" :
                      rol.ad === "kullanici" ? "text-blue-600 dark:text-blue-400" :
                      rol.ad === "izleyici" ? "text-gray-500 dark:text-slate-400" :
                      "text-amber-600 dark:text-amber-400"
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white capitalize truncate">{rol.ad}</h4>
                      {rol.varsayilan ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400 font-medium shrink-0">SİSTEM</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{rol.aciklama || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={() => setModal(rol)} title="Düzenle"
                    className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  {!rol.varsayilan && (
                    <button onClick={() => sil(rol.id)} title="Sil"
                      className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* İzin Çipleri */}
              <div className="px-5 pb-4">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Erişim İzinleri ({izinler.length}/{TUM_IZIN_ANAHTARLARI.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {TUM_IZIN_ANAHTARLARI.map((anahtar) => {
                    const aktif = izinler.includes(anahtar);
                    const tanim = IZIN_TANIMLARI[anahtar];
                    return (
                      <span key={anahtar} className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium transition-all ${
                        aktif
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                          : "bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-white/5 line-through opacity-50"
                      }`}>
                        {aktif ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {tanim.etiket}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Kart Alt Bilgi */}
              <div className="px-5 py-2.5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${rol.aktif ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                  {rol.aktif ? "Aktif" : "Pasif"}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-slate-500">
                  {rol.olusturma_tarihi ? new Date(rol.olusturma_tarihi).toLocaleDateString("tr-TR") : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {yukleniyor && roller.length === 0 && (
        <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500 text-sm">Yükleniyor...</div>
      )}

      {modal && <RolModal modal={modal} kapat={() => setModal(null)} kaydet={kaydet} />}
    </div>
  );
}

/* ============================================= */
/*  Rol Oluştur/Düzenle Modalı                   */
/* ============================================= */

function RolModal({ modal, kapat, kaydet }) {
  const duzenle = modal !== "yeni";
  const mevcutIzinler = duzenle && Array.isArray(modal.izinler) ? modal.izinler : [];
  const [form, setForm] = useState({
    id: duzenle ? modal.id : null,
    ad: duzenle ? modal.ad : "",
    aciklama: duzenle ? (modal.aciklama || "") : "",
    izinler: duzenle ? [...mevcutIzinler] : [],
    aktif: duzenle ? !!modal.aktif : true,
  });
  const ref = useRef(null);
  const sallanma = () => { if (ref.current) { ref.current.classList.remove("sallan"); void ref.current.offsetWidth; ref.current.classList.add("sallan"); } };

  const izinToggle = (anahtar) => {
    setForm((o) => ({
      ...o,
      izinler: o.izinler.includes(anahtar)
        ? o.izinler.filter((i) => i !== anahtar)
        : [...o.izinler, anahtar],
    }));
  };

  const tumunuSec = () => setForm((o) => ({ ...o, izinler: [...TUM_IZIN_ANAHTARLARI] }));
  const tumunuKaldir = () => setForm((o) => ({ ...o, izinler: [] }));

  const gonder = (e) => {
    e.preventDefault();
    if (!form.ad.trim()) return;
    if (form.izinler.length === 0) return;
    kaydet(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={sallanma}>
      <div ref={ref} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Başlık */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{duzenle ? "Rol Düzenle" : "Yeni Rol"}</h3>
          </div>
          <button onClick={kapat} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={gonder} className="p-6 space-y-5">
          {/* Rol Adı */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Rol Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.ad} onChange={(e) => setForm((o) => ({ ...o, ad: e.target.value }))} className={INPUT_STIL} placeholder="Örn: muhasebeci" required />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Açıklama</label>
            <input type="text" value={form.aciklama} onChange={(e) => setForm((o) => ({ ...o, aciklama: e.target.value }))} className={INPUT_STIL} placeholder="Rolün kısa açıklaması" />
          </div>

          {/* İzinler */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">Erişim İzinleri <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={tumunuSec} className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Tümünü Seç</button>
                <span className="text-gray-300 dark:text-slate-600">|</span>
                <button type="button" onClick={tumunuKaldir} className="text-[11px] text-red-500 dark:text-red-400 hover:underline cursor-pointer">Temizle</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TUM_IZIN_ANAHTARLARI.map((anahtar) => {
                const tanim = IZIN_TANIMLARI[anahtar];
                const secili = form.izinler.includes(anahtar);
                return (
                  <button
                    key={anahtar}
                    type="button"
                    onClick={() => izinToggle(anahtar)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-sm font-medium transition-all cursor-pointer ${
                      secili
                        ? "border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      secili ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-white/20"
                    }`}>
                      {secili && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                    {tanim.etiket}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">{form.izinler.length}/{TUM_IZIN_ANAHTARLARI.length} modül seçili</p>
          </div>

          {/* Durum */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Durum</label>
            <select value={form.aktif ? "aktif" : "pasif"} onChange={(e) => setForm((o) => ({ ...o, aktif: e.target.value === "aktif" }))} className={INPUT_STIL}>
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={kapat}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
            <button type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer">
              {duzenle ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Lisans Tipleri Sekmesi                        */
/* ============================================= */

const RENK_SECENEKLERI = [
  { id: "gray", ad: "Gri" },
  { id: "blue", ad: "Mavi" },
  { id: "violet", ad: "Mor" },
  { id: "emerald", ad: "Yeşil" },
  { id: "red", ad: "Kırmızı" },
  { id: "amber", ad: "Turuncu" },
  { id: "pink", ad: "Pembe" },
  { id: "cyan", ad: "Camgöbeği" },
  { id: "indigo", ad: "İndigo" },
];

function LisansTipleriSekmesi() {
  const [tipler, setTipler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modal, setModal] = useState(null); // null | "yeni" | tipObjesi
  const [form, setForm] = useState({ ad: "", kod: "", renk: "blue", gun: 365, sira: 0, aktif: true, suresiz: false });
  const [kaydediyor, setKaydediyor] = useState(false);
  const [sallan, setSallan] = useState(false);

  const yukle = async () => {
    setYukleniyor(true);
    try {
      const yanit = await apiGet("/lisans-tipleri");
      if (yanit.basarili) setTipler(yanit.veri);
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  useEffect(() => { yukle(); }, []);

  const modalAc = (tip) => {
    if (tip === "yeni") {
      setForm({ ad: "", kod: "", renk: "blue", gun: 365, sira: 0, aktif: true, suresiz: false });
      setModal("yeni");
    } else {
      setForm({ ad: tip.ad, kod: tip.kod, renk: tip.renk, gun: tip.gun, sira: tip.sira, aktif: !!tip.aktif, suresiz: !!tip.suresiz });
      setModal(tip);
    }
  };

  const kaydet = async () => {
    if (!form.ad.trim() || !form.kod.trim()) {
      setSallan(true);
      setTimeout(() => setSallan(false), 600);
      return;
    }
    setKaydediyor(true);
    try {
      if (modal === "yeni") {
        await apiPost("/lisans-tipleri", form);
      } else {
        await apiPut(`/lisans-tipleri/${modal.id}`, form);
      }
      setModal(null);
      yukle();
    } catch (e) { console.error(e); }
    finally { setKaydediyor(false); }
  };

  const sil = async (tip) => {
    if (!confirm(`"${tip.ad}" lisans tipini silmek istediğinize emin misiniz?`)) return;
    try {
      const yanit = await apiDelete(`/lisans-tipleri/${tip.id}`);
      if (yanit.basarili) yukle();
      else alert(yanit.mesaj || "Silinemedi.");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lisans Tipleri</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Paket oluştururken kullanılacak lisans tiplerini yönetin.</p>
        </div>
        <button onClick={() => modalAc("yeni")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Yeni Tip Ekle
        </button>
      </div>

      {/* Tablo */}
      {yukleniyor ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : tipler.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-slate-400">Henüz lisans tipi tanımlanmamış.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Sıra</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Ad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Kod</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Renk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Gün</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Durum</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {tipler.map((t) => (
                <tr key={t.id} className={`border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.02] ${!t.aktif ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{t.sira}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.ad}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs">{t.kod}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-6 h-6 rounded-full bg-${t.renk}-500`} title={t.renk} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{t.suresiz ? <span className="text-xs font-medium text-purple-600 dark:text-purple-400">♾ Süresiz</span> : `${t.gun} gün`}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.aktif ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-slate-400"}`}>
                      {t.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => modalAc(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer" title="Düzenle">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => sil(t)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer" title="Sil">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg mx-4 p-6 ${sallan ? "sallan" : ""}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{modal === "yeni" ? "Yeni Lisans Tipi" : "Lisans Tipi Düzenle"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ad <span className="text-red-500">*</span></label>
                <input value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className={INPUT_STIL} placeholder="Ör: Profesyonel" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Kod <span className="text-red-500">*</span></label>
                <input value={form.kod} onChange={(e) => setForm({ ...form, kod: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} className={INPUT_STIL} placeholder="Ör: profesyonel" />
                <p className="text-xs text-gray-400 mt-1">Benzersiz kod (küçük harf, rakam, tire)</p>
              </div>
              {/* Süresiz Toggle */}
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">♾</span>
                    <div>
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Süresiz Lisans</span>
                      <p className="text-xs text-purple-500 dark:text-purple-400">Bu tip bitiş tarihi olmayan lisanslar için kullanılır</p>
                    </div>
                  </div>
                  <div onClick={() => setForm({ ...form, suresiz: !form.suresiz, gun: !form.suresiz ? 0 : 365 })}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center cursor-pointer ${form.suresiz ? "bg-purple-500 justify-end" : "bg-gray-300 dark:bg-white/20 justify-start"}`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow mx-0.5"></div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Renk</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {RENK_SECENEKLERI.map((r) => (
                      <button key={r.id} onClick={() => setForm({ ...form, renk: r.id })} title={r.ad}
                        className={`w-7 h-7 rounded-full bg-${r.id}-500 border-2 transition-all cursor-pointer ${form.renk === r.id ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`} />
                    ))}
                  </div>
                </div>
                {!form.suresiz && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Varsayılan Gün</label>
                    <input type="number" value={form.gun} onChange={(e) => setForm({ ...form, gun: parseInt(e.target.value) || 0 })} className={INPUT_STIL} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Sıra</label>
                  <input type="number" value={form.sira} onChange={(e) => setForm({ ...form, sira: parseInt(e.target.value) || 0 })} className={INPUT_STIL} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">Aktif</span>
                  </label>
                </div>
              </div>

              {/* Önizleme */}
              <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-400 mb-2">Önizleme</p>
                <button className={`p-3 rounded-lg border text-center transition-all border-${form.renk}-500 bg-${form.renk}-50 dark:bg-${form.renk}-500/10`}>
                  <p className={`text-sm font-medium text-${form.renk}-700 dark:text-${form.renk}-400`}>{form.ad || "Tip Adı"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{form.suresiz ? "♾ Süresiz" : `${form.gun} gün`}</p>
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium cursor-pointer">İptal</button>
              <button onClick={kaydet} disabled={kaydediyor} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-50">
                {kaydediyor ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  p Kutusu Sekmesi                            */
/* ============================================= */

function CopKutusuSekmesi() {
  const [silinen, setSilinen] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState("tumu"); // tumu, musteri, bayi, urun, paket, lisans, etc.
  const [geriYuklemeOnay, setGeriYuklemeOnay] = useState(null);
  const [seciliKayitlar, setSeciliKayitlar] = useState([]); // [{ tip, id }, ...]
  const [topluSilOnay, setTopluSilOnay] = useState(false);

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      const res = await apiGet("/cop-kutusu");
      setSilinen(res.veri || []);
      setSeciliKayitlar([]); // Veriler yenilenince seçim sıfırlansın
    } catch (e) {
      console.error("Cop kutusu verileri yuklenemedi:", e);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { verileriYukle(); }, []);

  const geriYukle = async (tip, id) => {
    try {
      await apiPost(`/cop-kutusu/${tip}/${id}/geri-yukle`);
      setGeriYuklemeOnay(null);
      verileriYukle();
    } catch (e) {
      console.error("Geri yukleme hatasi:", e);
      alert(e.message || "Geri yukleme hatasi");
    }
  };

  const kaliciSil = async (tip, id) => {
    if (!confirm("Bu kayit kalici olarak silinecek. Emin misiniz?")) return;
    try {
      await apiDelete(`/cop-kutusu/${tip}/${id}/kalici`);
      verileriYukle();
    } catch (e) {
      console.error("Kalici silme hatasi:", e);
    }
  };

  const topluKaliciSil = async () => {
    if (seciliKayitlar.length === 0) return;
    try {
      const res = await apiPost("/cop-kutusu/toplu-sil", { kayitlar: seciliKayitlar });
      setTopluSilOnay(false);
      verileriYukle();
      if (res.hatalar && res.hatalar.length > 0) {
        console.warn("Bazı kayıtlar silinemedi:", res.hatalar);
      }
    } catch (e) {
      console.error("Toplu silme hatasi:", e);
      alert(e.message || "Toplu silme hatası");
    }
  };

  const kayitSecToggle = (tip, id) => {
    const key = `${tip}-${id}`;
    setSeciliKayitlar((prev) => {
      const var_mi = prev.some(k => `${k.tip}-${k.id}` === key);
      if (var_mi) return prev.filter(k => `${k.tip}-${k.id}` !== key);
      return [...prev, { tip, id }];
    });
  };

  const tumunuSecToggle = () => {
    if (seciliKayitlar.length === filtrelenmis.length) {
      setSeciliKayitlar([]);
    } else {
      setSeciliKayitlar(filtrelenmis.map(item => ({ tip: item.tip, id: item.id })));
    }
  };

  const tarihFormatla = (tarih) => {
    if (!tarih) return "-";
    return new Date(tarih).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const filtrelenmis = silinen.filter((item) => {
    if (filtre === "tumu") return true;
    return item.tip === filtre;
  });

  const TIP_ETIKETLERI = {
    musteri: "M\u00fc\u015fteri", bayi: "Bayi", urun: "\u00dcr\u00fcn", paket: "Paket",
    lisans: "Lisans", lisansTipi: "Lisans Tipi", urunTipi: "\u00dcr\u00fcn Tipi",
    uygulamaTipi: "Uygulama Tipi", urunGrubu: "\u00dcr\u00fcn Grubu", surum: "S\u00fcr\u00fcm",
    urunSablon: "\u015eablon", rol: "Rol", sektor: "Sekt\u00f6r", kullanici: "Kullan\u0131c\u0131",
  };

  return (
    <div className="space-y-4">
      {/* Üst Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="tumu">Tüm Kayıtlar</option>
            <option value="musteri">Müşteriler</option>
            <option value="bayi">Bayiler</option>
            <option value="urun">Ürünler</option>
            <option value="paket">Paketler</option>
            <option value="lisans">Lisanslar</option>
            <option value="lisansTipi">Lisans Tipleri</option>
            <option value="surum">Sürümler</option>
            <option value="urunSablon">Şablonlar</option>
            <option value="rol">Roller</option>
            <option value="sektor">Sektörler</option>
            <option value="kullanici">Kullanıcılar</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
          {seciliKayitlar.length > 0 && (
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">({seciliKayitlar.length} seçili)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {seciliKayitlar.length > 0 && (
            <button onClick={() => setTopluSilOnay(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Toplu Sil ({seciliKayitlar.length})
            </button>
          )}
          <button onClick={verileriYukle} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Yenile
          </button>
        </div>
      </div>

      {/* İçerik */}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtrelenmis.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          <p className="text-sm text-gray-500 dark:text-slate-400">Çöp kutusu boş</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Silinen kayıtlar burada görüntülenir</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/[0.06]">
                <th className="text-center px-3 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={filtrelenmis.length > 0 && seciliKayitlar.length === filtrelenmis.length}
                    onChange={tumunuSecToggle}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tip</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Silinme Tarihi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {filtrelenmis.map((item) => {
                const secili = seciliKayitlar.some(k => k.tip === item.tip && k.id === item.id);
                return (
                <tr key={`${item.tip}-${item.id}`} className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${secili ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}>
                  <td className="text-center px-3 py-3">
                    <input 
                      type="checkbox"
                      checked={secili}
                      onChange={() => kayitSecToggle(item.tip, item.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {TIP_ETIKETLERI[item.tip] || item.tip}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">{item.unvan || item.ad || "-"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{tarihFormatla(item.silinme_tarihi)}</td>
                                    <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setGeriYuklemeOnay(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Geri Yükle
                      </button>
                      <button onClick={() => kaliciSil(item.tip, item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Kalıcı Sil
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Geri Yükleme Onay Modal */}
      {geriYuklemeOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setGeriYuklemeOnay(null)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Geri Yükle</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Bu kaydı geri yüklemek istiyor musunuz?</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{geriYuklemeOnay.unvan || geriYuklemeOnay.ad}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {TIP_ETIKETLERI[geriYuklemeOnay.tip] || geriYuklemeOnay.tip}  Silinme: {tarihFormatla(geriYuklemeOnay.silinme_tarihi)}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setGeriYuklemeOnay(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
                İptal
              </button>
              <button onClick={() => geriYukle(geriYuklemeOnay.tip, geriYuklemeOnay.id)} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer">
                Geri Yükle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Silme Onay Modal */}
      {topluSilOnay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setTopluSilOnay(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Toplu Kalıcı Silme</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Bu işlem geri alınamaz!</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {seciliKayitlar.length} kayıt kalıcı olarak silinecek.
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                Bu kayıtlar veritabanından tamamen kaldırılacak ve kurtarılamayacak.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTopluSilOnay(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
                İptal
              </button>
              <button onClick={topluKaliciSil} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors cursor-pointer">
                Tümünü Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ============================================= */
/*  Sektörler Sekmesi                             */
/* ============================================= */

function SektorlerSekmesi() {
  const [sektorler, setSektorler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modal, setModal] = useState(null); // null | "yeni" | sektorObjesi
  const [form, setForm] = useState({ ad: "", aktif: true });

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      const res = await apiGet("/sektorler");
      setSektorler(res.veri || []);
    } catch (e) {
      console.error("Sektorler yuklenemedi:", e);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { verileriYukle(); }, []);

  const modalAc = (sektor = null) => {
    if (sektor) {
      setForm({ ad: sektor.ad, aktif: !!sektor.aktif });
      setModal(sektor);
    } else {
      setForm({ ad: "", aktif: true });
      setModal("yeni");
    }
  };

  const kaydet = async () => {
    if (!form.ad.trim()) return alert("Sektör adı zorunludur.");
    try {
      if (modal === "yeni") {
        await apiPost("/sektorler", { ad: form.ad.trim() });
      } else {
        await apiPut(`/sektorler/${modal.id}`, { ad: form.ad.trim(), aktif: form.aktif });
      }
      setModal(null);
      verileriYukle();
    } catch (e) {
      alert(e.message || "Kaydetme hatası");
    }
  };

  const sil = async (id) => {
    if (!confirm("Bu sektörü silmek istediğinize emin misiniz?")) return;
    try {
      await apiDelete(`/sektorler/${id}`);
      verileriYukle();
    } catch (e) {
      alert(e.message || "Silme hatası");
    }
  };

  return (
    <div className="space-y-4">
      {/* Üst Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{sektorler.length} sektör tanımlı</p>
        <button onClick={() => modalAc()}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Yeni Sektör
        </button>
      </div>

      {/* İçerik */}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : sektorler.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <p className="text-sm text-gray-500 dark:text-slate-400">Henüz sektör tanımlanmamış</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sektorler.map((s) => (
            <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:shadow-md transition-all ${!s.aktif ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.aktif ? "bg-blue-100 dark:bg-blue-500/15" : "bg-gray-100 dark:bg-white/10"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${s.aktif ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{s.ad}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-xs ${s.aktif ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`}>{s.aktif ? "Aktif" : "Pasif"}</p>
                    {(s.musteri_sayisi > 0 || s.bayi_sayisi > 0) && (
                      <span className="text-xs text-gray-400 dark:text-slate-500">•</span>
                    )}
                    {s.musteri_sayisi > 0 && (
                      <span className="inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">{s.musteri_sayisi} müşteri</span>
                    )}
                    {s.bayi_sayisi > 0 && (
                      <span className="inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400">{s.bayi_sayisi} bayi</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => modalAc(s)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-slate-400 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => sil(s.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{modal === "yeni" ? "Yeni Sektör" : "Sektör Düzenle"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sektör Adı</label>
                <input type="text" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  placeholder="Sektör adı girin..." />
              </div>
              {modal !== "yeni" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-slate-300">Aktif</span>
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
                İptal
              </button>
              <button onClick={kaydet} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer">
                {modal === "yeni" ? "Ekle" : "Güncelle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

