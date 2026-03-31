/* ============================================= */
/*  Güzel Teknoloji - Takvim / Hatırlatma Sayfası */
/*  Lisans bitiş tarihlerini takvim üzerinde      */
/*  gün gün gösteren sayfa. Filtre çubukları,     */
/*  renk kodlaması ve detay modalı içerir.         */
/* ============================================= */

import { useState, useMemo, useEffect } from "react";
import { useMusteriler } from "../baglam/MusteriContext";
import { apiGet } from "../yardimcilar/api";

/* ---- Lisans durumu hesaplama ---- */
function lisansDurumuHesapla(baslangic, bitis) {
  const bugun = new Date();
  const bitisTarih = new Date(bitis);
  if (bitisTarih < bugun) return "suresi-dolmus";
  const kalanGun = Math.ceil((bitisTarih - bugun) / (1000 * 60 * 60 * 24));
  if (kalanGun <= 30) return "yaklasan";
  return "aktif";
}

/* ---- Yardımcı fonksiyonlar ---- */
const ayAdlari = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const gunAdlari = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function ayGunleri(yil, ay) {
  const ilkGun = new Date(yil, ay, 1);
  const sonGun = new Date(yil, ay + 1, 0);
  const gunSayisi = sonGun.getDate();
  let baslangicGunu = ilkGun.getDay(); // 0=Paz
  baslangicGunu = baslangicGunu === 0 ? 6 : baslangicGunu - 1; // Pzt=0

  const gunler = [];
  // Önceki ayın günleri
  const oncekiAySon = new Date(yil, ay, 0).getDate();
  for (let i = baslangicGunu - 1; i >= 0; i--) {
    gunler.push({ gun: oncekiAySon - i, buAy: false, tarih: new Date(yil, ay - 1, oncekiAySon - i) });
  }
  // Bu ayın günleri
  for (let i = 1; i <= gunSayisi; i++) {
    gunler.push({ gun: i, buAy: true, tarih: new Date(yil, ay, i) });
  }
  // Sonraki ayın günleri (6 satır = 42 hücre)
  const kalan = 42 - gunler.length;
  for (let i = 1; i <= kalan; i++) {
    gunler.push({ gun: i, buAy: false, tarih: new Date(yil, ay + 1, i) });
  }
  return gunler;
}

function tarihEsit(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function durumRenk(durum) {
  switch (durum) {
    case "aktif":          return { bg: "bg-emerald-100 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" };
    case "yaklasan":       return { bg: "bg-amber-100 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" };
    case "suresi-dolmus":  return { bg: "bg-red-100 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20" };
    default:               return { bg: "bg-gray-100 dark:bg-white/5", text: "text-gray-600 dark:text-slate-400", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-white/10" };
  }
}

function durumEtiket(durum) {
  switch (durum) {
    case "aktif":          return "Aktif";
    case "yaklasan":       return "Yaklaşan";
    case "suresi-dolmus":  return "Süresi Dolmuş";
    default:               return durum;
  }
}

export default function TakvimPage() {
  const { musteriler } = useMusteriler();

  const bugun = new Date();
  const [yil, setYil] = useState(bugun.getFullYear());
  const [ay, setAy] = useState(bugun.getMonth());
  const [aramaTerimi, setAramaTerimi] = useState("");
  const [durumFiltre, setDurumFiltre] = useState("hepsi");
  const [seciliGun, setSeciliGun] = useState(null);
  const [detayModal, setDetayModal] = useState(null);
  const [lisanslar, setLisanslar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  /* ---- API'den lisansları çek ---- */
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const yanit = await apiGet("/lisanslar");
        if (!iptal && yanit.basarili) {
          setLisanslar(yanit.veri.map((l) => ({
            id: `L-${String(l.id).padStart(3, "0")}`,
            musteriId: l.musteri_id,
            musteriAdi: l.musteri_adi || "",
            urun: l.urun_adi || l.paket_adi || "",
            baslangic: l.baslangic_tarihi ? l.baslangic_tarihi.slice(0, 10) : "",
            bitis: l.bitis_tarihi ? l.bitis_tarihi.slice(0, 10) : "",
            durum: lisansDurumuHesapla(l.baslangic_tarihi, l.bitis_tarihi),
          })));
        }
      } catch { /* sessiz */ }
      if (!iptal) setYukleniyor(false);
    })();
    return () => { iptal = true; };
  }, []);

  /* ---- Filtrelenmiş lisanslar ---- */
  const filtrelenmisLisanslar = useMemo(() => {
    return lisanslar.filter((l) => {
      if (durumFiltre !== "hepsi" && l.durum !== durumFiltre) return false;
      if (aramaTerimi) {
        const a = aramaTerimi.toLowerCase();
        if (!l.musteriAdi.toLowerCase().includes(a) && !l.urun.toLowerCase().includes(a) && !l.id.toLowerCase().includes(a)) return false;
      }
      return true;
    });
  }, [lisanslar, durumFiltre, aramaTerimi]);

  /* ---- Takvim günleri ---- */
  const gunler = useMemo(() => ayGunleri(yil, ay), [yil, ay]);

  /* ---- Gün bazlı lisans eşleştirmesi (bitiş tarihine göre) ---- */
  const gunLisansMap = useMemo(() => {
    const map = {};
    filtrelenmisLisanslar.forEach((l) => {
      const bitis = new Date(l.bitis + "T00:00:00");
      const key = `${bitis.getFullYear()}-${bitis.getMonth()}-${bitis.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  }, [filtrelenmisLisanslar]);

  function gunLisanslari(tarih) {
    const key = `${tarih.getFullYear()}-${tarih.getMonth()}-${tarih.getDate()}`;
    return gunLisansMap[key] || [];
  }

  /* ---- Ay geçişi ---- */
  function oncekiAy() {
    if (ay === 0) { setAy(11); setYil(yil - 1); } else setAy(ay - 1);
  }
  function sonrakiAy() {
    if (ay === 11) { setAy(0); setYil(yil + 1); } else setAy(ay + 1);
  }
  function bugune() {
    setAy(bugun.getMonth());
    setYil(bugun.getFullYear());
  }

  /* ---- İstatistikler ---- */
  const istatistikler = useMemo(() => {
    const toplam = filtrelenmisLisanslar.length;
    const aktif = filtrelenmisLisanslar.filter((l) => l.durum === "aktif").length;
    const yaklasan = filtrelenmisLisanslar.filter((l) => l.durum === "yaklasan").length;
    const suresiDolmus = filtrelenmisLisanslar.filter((l) => l.durum === "suresi-dolmus").length;
    // Bu ay biten
    const buAyBiten = filtrelenmisLisanslar.filter((l) => {
      const b = new Date(l.bitis + "T00:00:00");
      return b.getFullYear() === yil && b.getMonth() === ay;
    }).length;
    return { toplam, aktif, yaklasan, suresiDolmus, buAyBiten };
  }, [filtrelenmisLisanslar, yil, ay]);

  /* ---- Seçili günün lisansları ---- */
  const seciliGunLisanslari = seciliGun ? gunLisanslari(seciliGun) : [];

  return (
    <div className="space-y-6">
      {/* ===== BAŞLIK ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Takvim &amp; Hatırlatmalar
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-[52px]">Lisans bitiş tarihlerini takvim üzerinde takip edin</p>
        </div>
      </div>

      {/* ===== İSTATİSTİK KARTLARI ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { etiket: "Toplam Lisans", deger: istatistikler.toplam, renk: "from-blue-500 to-blue-600", ikon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { etiket: "Aktif", deger: istatistikler.aktif, renk: "from-emerald-500 to-emerald-600", ikon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { etiket: "Yaklaşan", deger: istatistikler.yaklasan, renk: "from-amber-500 to-amber-600", ikon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" },
          { etiket: "Süresi Dolmuş", deger: istatistikler.suresiDolmus, renk: "from-red-500 to-red-600", ikon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { etiket: "Bu Ay Biten", deger: istatistikler.buAyBiten, renk: "from-violet-500 to-purple-600", ikon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
        ].map((k) => (
          <div key={k.etiket} className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.renk} flex items-center justify-center text-white shrink-0 shadow-lg`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={k.ikon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.deger}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{k.etiket}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== FİLTRE ÇUBUKLARI ===== */}
      <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Arama */}
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
              placeholder="Müşteri, ürün veya lisans ID ara..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>
          {/* Durum filtresi */}
          <select
            value={durumFiltre}
            onChange={(e) => setDurumFiltre(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <option value="hepsi">Tüm Durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="yaklasan">Yaklaşan</option>
            <option value="suresi-dolmus">Süresi Dolmuş</option>
          </select>
          {/* Bugüne git */}
          <button
            onClick={bugune}
            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold cursor-pointer transition-colors shrink-0"
          >
            Bugün
          </button>
        </div>
      </div>

      {/* ===== TAKVİM + YAN PANEL ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Takvim Kartı ---- */}
        <div className="lg:col-span-2 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
          {/* Ay navigasyonu */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
            <button onClick={oncekiAy} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-600 dark:text-slate-400 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{ayAdlari[ay]} {yil}</h2>
            <button onClick={sonrakiAy} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-600 dark:text-slate-400 cursor-pointer transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/[0.06]">
            {gunAdlari.map((g) => (
              <div key={g} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{g}</div>
            ))}
          </div>

          {/* Gün hücreleri */}
          <div className="grid grid-cols-7">
            {gunler.map((g, i) => {
              const lisanslar = gunLisanslari(g.tarih);
              const bugunMu = tarihEsit(g.tarih, bugun);
              const seciliMi = seciliGun && tarihEsit(g.tarih, seciliGun);

              return (
                <div
                  key={i}
                  onClick={() => setSeciliGun(g.tarih)}
                  className={`min-h-[80px] p-1.5 border-b border-r border-gray-100 dark:border-white/[0.04] cursor-pointer transition-colors relative
                    ${!g.buAy ? "bg-gray-50 dark:bg-white/[0.01]" : "hover:bg-violet-50 dark:hover:bg-violet-500/5"}
                    ${seciliMi ? "bg-violet-50 dark:bg-violet-500/10 ring-2 ring-violet-500 ring-inset" : ""}
                  `}
                >
                  {/* Gün numarası */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mb-1
                    ${bugunMu ? "bg-violet-500 text-white" : g.buAy ? "text-gray-700 dark:text-slate-300" : "text-gray-400 dark:text-slate-600"}
                  `}>
                    {g.gun}
                  </div>

                  {/* Lisans göstergeleri */}
                  <div className="space-y-0.5">
                    {lisanslar.slice(0, 2).map((l) => {
                      const r = durumRenk(l.durum);
                      return (
                        <div
                          key={l.id}
                          onClick={(e) => { e.stopPropagation(); setDetayModal(l); }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${r.bg} ${r.text} hover:opacity-80 transition-opacity`}
                          title={`${l.musteriAdi} - ${l.urun}`}
                        >
                          {l.musteriAdi.split(" ")[0]}
                        </div>
                      );
                    })}
                    {lisanslar.length > 2 && (
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 pl-1">+{lisanslar.length - 2} daha</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- Yan Panel: Seçili Gün Detayı + Yaklaşan Lisanslar ---- */}
        <div className="space-y-6">
          {/* Seçili gün */}
          <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-white/[0.06]">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {seciliGun
                  ? seciliGun.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
                  : "Bir gün seçin"}
              </h3>
              {seciliGun && (
                <p className="text-xs text-gray-500 dark:text-slate-400">{seciliGunLisanslari.length} lisans bitiş</p>
              )}
            </div>
            <div className="p-4 max-h-[260px] overflow-y-auto">
              {!seciliGun ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">Takvimden bir gün seçerek detayları görün.</p>
              ) : seciliGunLisanslari.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">Bu günde biten lisans yok.</p>
              ) : (
                <div className="space-y-2.5">
                  {seciliGunLisanslari.map((l) => {
                    const r = durumRenk(l.durum);
                    return (
                      <div
                        key={l.id}
                        onClick={() => setDetayModal(l)}
                        className="p-3 rounded-lg border border-gray-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/30 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{l.musteriAdi}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${r.badge}`}>{durumEtiket(l.durum)}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{l.urun}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{l.id}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Yaklaşan bitiş tarihleri listesi */}
          <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-white/[0.06] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Yaklaşan Bitiş Tarihleri</h3>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {filtrelenmisLisanslar.filter((l) => l.durum === "yaklasan").length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">Yaklaşan bitiş tarihi yok.</p>
              ) : (
                <div className="space-y-2.5">
                  {filtrelenmisLisanslar
                    .filter((l) => l.durum === "yaklasan")
                    .sort((a, b) => new Date(a.bitis) - new Date(b.bitis))
                    .map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setDetayModal(l)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0 text-xs font-bold">
                          {new Date(l.bitis + "T00:00:00").getDate()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{l.musteriAdi}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">{l.urun} — {new Date(l.bitis + "T00:00:00").toLocaleDateString("tr-TR")}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== TÜM LİSANSLAR TABLOSU ===== */}
      <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/[0.06]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Lisans Listesi</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">{filtrelenmisLisanslar.length} lisans gösteriliyor</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ürün</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Başlangıç</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Bitiş</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {filtrelenmisLisanslar.map((l) => {
                const r = durumRenk(l.durum);
                return (
                  <tr key={l.id} onClick={() => setDetayModal(l)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                    <td className="px-6 py-3 text-xs font-mono text-gray-500 dark:text-slate-400">{l.id}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{l.musteriAdi}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300">{l.urun}</td>
                    <td className="px-6 py-3 text-xs text-gray-500 dark:text-slate-400">{new Date(l.baslangic + "T00:00:00").toLocaleDateString("tr-TR")}</td>
                    <td className="px-6 py-3 text-xs text-gray-500 dark:text-slate-400">{new Date(l.bitis + "T00:00:00").toLocaleDateString("tr-TR")}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${r.badge}`}>{durumEtiket(l.durum)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== DETAY MODALI ===== */}
      {detayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDetayModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lisans Detayı</h3>
              <button onClick={() => setDetayModal(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Durum badge */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${durumRenk(detayModal.durum).dot}`} />
                <span className={`text-sm font-semibold ${durumRenk(detayModal.durum).text}`}>{durumEtiket(detayModal.durum)}</span>
              </div>

              {/* Detay satırları */}
              <div className="space-y-3">
                {[
                  ["Lisans ID", detayModal.id],
                  ["Müşteri", detayModal.musteriAdi],
                  ["Ürün", detayModal.urun],
                  ["Başlangıç", new Date(detayModal.baslangic + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })],
                  ["Bitiş", new Date(detayModal.bitis + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })],
                ].map(([etiket, deger]) => (
                  <div key={etiket} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-slate-400">{etiket}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{deger}</span>
                  </div>
                ))}
              </div>

              {/* Kalan gün */}
              {(() => {
                const bitis = new Date(detayModal.bitis + "T00:00:00");
                const fark = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24));
                return (
                  <div className={`p-3 rounded-xl text-center ${
                    fark < 0 ? "bg-red-50 dark:bg-red-500/10" : fark < 30 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"
                  }`}>
                    <p className={`text-2xl font-bold ${
                      fark < 0 ? "text-red-600 dark:text-red-400" : fark < 30 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {fark < 0 ? `${Math.abs(fark)} gün geçti` : fark === 0 ? "Bugün bitiyor!" : `${fark} gün kaldı`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">lisans bitiş tarihine</p>
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
              <button onClick={() => setDetayModal(null)} className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-slate-300 text-sm font-semibold cursor-pointer transition-colors">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
