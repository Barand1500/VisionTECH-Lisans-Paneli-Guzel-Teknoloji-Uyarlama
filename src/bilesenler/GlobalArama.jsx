import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMusteriler } from "../baglam/MusteriContext";
import { apiGet } from "../yardimcilar/api";

/* ============================================= */
/*  Aranabilir Sabit Veriler                      */
/* ============================================= */

const SAYFALAR = [
  { ad: "Özet", detay: "Dashboard ana sayfası", yol: "/dashboard", anahtar: "özet dashboard ana sayfa istatistik" },
  { ad: "Müşteriler", detay: "Müşteri listesi ve yönetimi", yol: "/dashboard/musteriler", anahtar: "müşteri musteri liste tablo" },
  { ad: "Müşteri Ekle", detay: "Yeni müşteri kaydı oluştur", yol: "/dashboard/musteri-ekle", anahtar: "müşteri ekle yeni kayıt form" },
  { ad: "Bayiler", detay: "Bayi listesi ve hiyerarşi", yol: "/dashboard/bayiler", anahtar: "bayi dealer hiyerarşi ağaç" },
  { ad: "Yönetim", detay: "Ürün, grup, sürüm ve kullanıcı yönetimi", yol: "/dashboard/yonetim", anahtar: "yönetim ürün kullanıcı sürüm grup paket" },
  { ad: "Raporlar", detay: "Satış, paket ve cihaz raporları", yol: "/dashboard/raporlar", anahtar: "rapor satış paket cihaz tahsilat süresi" },
];

/* ============================================= */
/*  Kategori İkonları                             */
/* ============================================= */

const KATEGORI_IKONU = {
  Sayfalar: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Müşteriler: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Bayiler: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Ürünler: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Kullanıcılar: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

const KATEGORI_RENK = {
  Sayfalar: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  Müşteriler: "text-violet-500 bg-violet-50 dark:bg-violet-500/10",
  Bayiler: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
  Ürünler: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
  Kullanıcılar: "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
};

/* ============================================= */
/*  GlobalArama Bileşeni                          */
/* ============================================= */

export default function GlobalArama({ acik, kapat }) {
  const git = useNavigate();
  const { musteriler } = useMusteriler();
  const [sorgu, setSorgu] = useState("");
  const [seciliIndeks, setSeciliIndeks] = useState(0);
  const inputRef = useRef(null);
  const listeRef = useRef(null);

  const [bayiler, setBayiler] = useState([]);
  const [urunler, setUrunler] = useState([]);
  const [kullanicilar, setKullanicilar] = useState([]);

  useEffect(() => {
    if (!acik) return;
    apiGet("/bayiler").then((r) => r.basarili && setBayiler(r.veri)).catch(() => {});
    apiGet("/urunler").then((r) => r.basarili && setUrunler(r.veri)).catch(() => {});
    apiGet("/yetki/kullanicilar").then((r) => r.basarili && setKullanicilar(r.veri)).catch(() => {});
  }, [acik]);

  /* ---- Sonuçları Oluştur ---- */
  const tumSonuclar = (() => {
    const q = sorgu.toLowerCase().trim();
    if (!q) {
      /* Sorgu boşken sayfa navigasyonu + son eklenen müşteriler göster */
      const sonuclar = SAYFALAR.map((s) => ({ ...s, kategori: "Sayfalar" }));
      if (musteriler.length > 0) {
        musteriler.slice(0, 5).forEach((m) => {
          sonuclar.push({
            ad: m.adSoyad || m.sirketAdi || m.yetkiliKisi || `Müşteri #${m.id}`,
            detay: [m.eposta, m.tur === "gercek" ? "Gerçek" : m.tur === "tuzel" ? "Tüzel" : "Yabancı"].filter(Boolean).join(" · "),
            yol: "/dashboard/musteriler",
            kategori: "Müşteriler",
          });
        });
      }
      return sonuclar;
    }

    const sonuclar = [];

    /* Sayfalar */
    SAYFALAR.forEach((s) => {
      if (s.ad.toLowerCase().includes(q) || s.detay.toLowerCase().includes(q) || s.anahtar.toLowerCase().includes(q)) {
        sonuclar.push({ ...s, kategori: "Sayfalar" });
      }
    });

    /* Müşteriler (Context) */
    musteriler.forEach((m) => {
      const ad = m.adSoyad || m.sirketAdi || m.yetkiliKisi || "";
      const birlesik = `${ad} ${m.eposta || ""} ${m.yetkiliKisi || ""} ${(m.telefonlar || []).join(" ")} ${m.vergiNo || ""} ${m.tcKimlikNo || ""}`.toLowerCase();
      if (birlesik.includes(q)) {
        sonuclar.push({
          ad: ad || `Müşteri #${m.id}`,
          detay: [m.eposta, m.tur === "gercek" ? "Gerçek" : m.tur === "tuzel" ? "Tüzel" : "Yabancı"].filter(Boolean).join(" · "),
          yol: "/dashboard/musteriler",
          kategori: "Müşteriler",
        });
      }
    });

    /* Bayiler */
    bayiler.forEach((b) => {
      const ad = b.sirket_adi || b.ad_soyad || b.ad || `Bayi #${b.id}`;
      const detay = [b.eposta, b.sehir].filter(Boolean).join(" · ");
      const birlesik = `${ad} ${detay} ${b.yetkili || ""} ${b.telefon || ""}`.toLowerCase();
      if (birlesik.includes(q)) {
        sonuclar.push({ ad, detay, yol: "/dashboard/bayiler", kategori: "Bayiler" });
      }
    });

    /* Ürünler */
    urunler.forEach((u) => {
      const ad = u.ad || u.ad;
      const detay = u.grup_adi || u.platform || "";
      const birlesik = `${ad} ${detay}`.toLowerCase();
      if (birlesik.includes(q)) {
        sonuclar.push({ ad, detay, yol: "/dashboard/yonetim", kategori: "Ürünler" });
      }
    });

    /* Kullanıcılar */
    kullanicilar.forEach((k) => {
      const ad = k.ad_soyad || k.kullanici_adi || `Kullanıcı #${k.id}`;
      const detay = [k.eposta, k.rol].filter(Boolean).join(" · ");
      const birlesik = `${ad} ${detay}`.toLowerCase();
      if (birlesik.includes(q)) {
        sonuclar.push({ ad, detay, yol: "/dashboard/yonetim", kategori: "Kullanıcılar" });
      }
    });

    return sonuclar;
  })();

  /* ---- Kategorilere Göre Grupla ---- */
  const gruplar = {};
  tumSonuclar.forEach((s) => {
    if (!gruplar[s.kategori]) gruplar[s.kategori] = [];
    gruplar[s.kategori].push(s);
  });

  /* ---- Klavye Navigasyonu ---- */
  useEffect(() => {
    setSeciliIndeks(0);
  }, [sorgu]);

  useEffect(() => {
    if (acik) {
      setSorgu("");
      setSeciliIndeks(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [acik]);

  /* Seçili öğeyi görünür tut */
  useEffect(() => {
    const aktifEl = listeRef.current?.querySelector("[data-aktif='true']");
    if (aktifEl) aktifEl.scrollIntoView({ block: "nearest" });
  }, [seciliIndeks]);

  const sec = (sonuc) => {
    git(sonuc.yol);
    kapat();
  };

  const klavyeYonet = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSeciliIndeks((o) => Math.min(o + 1, tumSonuclar.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSeciliIndeks((o) => Math.max(o - 1, 0));
    } else if (e.key === "Enter" && tumSonuclar[seciliIndeks]) {
      e.preventDefault();
      sec(tumSonuclar[seciliIndeks]);
    } else if (e.key === "Escape") {
      kapat();
    }
  };

  if (!acik) return null;

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={kapat}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arama Girişi */}
        <div className="flex items-center gap-3 px-5 border-b border-gray-200 dark:border-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Sayfa, müşteri, bayi, ürün ara..."
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            onKeyDown={klavyeYonet}
            className="flex-1 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-400 dark:text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Sonuç Listesi */}
        <div ref={listeRef} className="max-h-[50vh] overflow-y-auto py-2">
          {tumSonuclar.length === 0 ? (
            <div className="py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                <span className="font-medium">"{sorgu}"</span> ile eşleşen sonuç bulunamadı
              </p>
            </div>
          ) : (
            Object.entries(gruplar).map(([kategori, ogeler]) => (
              <div key={kategori}>
                {/* Kategori Başlığı */}
                <div className="px-5 py-2 flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center ${KATEGORI_RENK[kategori] || "text-gray-500 bg-gray-100 dark:bg-white/5"}`}>
                    {KATEGORI_IKONU[kategori] || null}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{kategori}</span>
                  <span className="text-xs text-gray-300 dark:text-slate-600">({ogeler.length})</span>
                </div>

                {/* Öğeler */}
                {ogeler.map((oge) => {
                  globalIdx++;
                  const idx = globalIdx;
                  const aktif = idx === seciliIndeks;
                  return (
                    <button
                      key={`${kategori}-${oge.ad}-${idx}`}
                      data-aktif={aktif}
                      onClick={() => sec(oge)}
                      onMouseEnter={() => setSeciliIndeks(idx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer ${
                        aktif
                          ? "bg-blue-50 dark:bg-blue-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${aktif ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                          {sorgu ? vurgulaSorgu(oge.ad, sorgu) : oge.ad}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{oge.detay}</p>
                      </div>
                      {aktif && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 shrink-0">
                          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono">↵</kbd>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Alt Bilgi */}
        <div className="px-5 py-2.5 border-t border-gray-200 dark:border-white/10 flex items-center gap-4 bg-gray-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono">↑↓</kbd>
            <span>gezin</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono">↵</kbd>
            <span>seç</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono">esc</kbd>
            <span>kapat</span>
          </div>
        </div>
      </div>

      {/* Animasyon Stilleri */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </div>
  );
}

/* ---- Sorgu Kelimesini Vurgulama ---- */
function vurgulaSorgu(metin, sorgu) {
  if (!sorgu) return metin;
  const regex = new RegExp(`(${sorgu.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parcalar = metin.split(regex);
  return parcalar.map((parca, i) =>
    regex.test(parca) ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-500/30 text-inherit rounded-sm px-0.5">
        {parca}
      </mark>
    ) : (
      parca
    )
  );
}
