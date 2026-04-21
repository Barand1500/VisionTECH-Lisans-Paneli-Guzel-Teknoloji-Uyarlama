/* ============================================= */
/*  Güzel Teknoloji - Müşteri Ekleme Sayfası     */
/*  Gerçek / Tüzel / Yabancı müşteri kayıt formu */
/*  Üst müşteri aramalı seçim en üstte,          */
/*  durum toggle (aktif/pasif), zorunlu alan      */
/*  doğrulaması, dinamik telefon/adres listeleri  */
/*  ve console çıktısı ile backend hazırlığı      */
/* ============================================= */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMusteriler } from "../baglam/MusteriContext";
import { useAktiviteLog } from "../baglam/AktiviteLogContext";
import { useAuth } from "../baglam/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "../yardimcilar/api";

/* ============================================= */
/*  Sabit Tanımlamalar                            */
/* ============================================= */

const SEKMELER = [
  {
    id: "gercek",
    etiket: "Gerçek",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "tuzel",
    etiket: "Tüzel",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "yabanci",
    etiket: "Yabancı",
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

/* Sektörler artık API'den çekilecek */

/* ---- Boş Form Verisi Şablonu ---- */
const bosFormOlustur = () => ({
  sirketAdi: "",
  yetkiliKisi: "",
  adSoyad: "",
  eposta: "",
  telefon: "",
  sektor: "",
  sektorDiger: "",
  vergiDairesi: "",
  vergiNo: "",
  tcKimlikNo: "",
  pasaportNo: "",
  bayi: "",
  bayiAdi: "",
  bayiArama: "",
  adres: "",
  kisiler: [],
  notlar: "",
  etiketler: [],
  yeniEtiket: "",
  durum: true,
});

/* ============================================= */
/*  Yardımcı Fonksiyonlar                        */
/* ============================================= */

const telefonFormatla = (deger) => {
  const r = deger.replace(/\D/g, "").slice(0, 10);
  if (!r) return "";
  if (r.length <= 3) return `(${r}`;
  if (r.length <= 6) return `(${r.slice(0, 3)}) ${r.slice(3)}`;
  if (r.length <= 8) return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6)}`;
  return `(${r.slice(0, 3)}) ${r.slice(3, 6)} ${r.slice(6, 8)} ${r.slice(8)}`;
};

const sadeceSayi = (deger, maxUzunluk) =>
  deger.replace(/\D/g, "").slice(0, maxUzunluk);

const epostaGecerliMi = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* TC Kimlik No algoritma kontrolü */
const tcKimlikGecerliMi = (tc) => {
  if (!tc || tc.length !== 11) return false;
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false;
  const h = tc.split("").map(Number);
  const t10 = ((h[0]+h[2]+h[4]+h[6]+h[8])*7 - (h[1]+h[3]+h[5]+h[7])) % 10;
  if (t10 < 0) return false;
  if (h[9] !== t10) return false;
  const t11 = (h[0]+h[1]+h[2]+h[3]+h[4]+h[5]+h[6]+h[7]+h[8]+h[9]) % 10;
  return h[10] === t11;
};

/* ============================================= */
/*  Ortak Stil Sabitleri                          */
/* ============================================= */

const INPUT_STIL =
  "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

const LABEL_STIL =
  "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5";

const HATA_INPUT_STIL =
  "w-full px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm";

/* ============================================= */
/*  Ana Bileşen: MusteriEklePage                  */
/* ============================================= */

export default function MusteriEklePage() {
  const git = useNavigate();
  const { id } = useParams(); // Düzenleme modu için id
  const duzenleModu = !!id;
  const { musteriler, musteriEkle, musteriGuncelle } = useMusteriler();
  const { logEkle } = useAktiviteLog();
  const { kullanici } = useAuth();

  const [yukleniyor, setYukleniyor] = useState(duzenleModu);
  const [aktifSekme, setAktifSekme] = useState("gercek");
  const [form, setForm] = useState(bosFormOlustur());
  const [hatalar, setHatalar] = useState({});
  const [basarili, setBasarili] = useState(false);
  const [bayiAcik, setBayiAcik] = useState(false);
  const [sektorler, setSektorler] = useState([]);
  const [bayiler, setBayiler] = useState([]);
  const [dosyalar, setDosyalar] = useState([]);
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false);
  const [mevcutDosyalar, setMevcutDosyalar] = useState([]);
  const [dosyaAdDuzen, setDosyaAdDuzen] = useState(null); // {id, ad}
  const [notListesi, setNotListesi] = useState([]);
  const [yeniNotMetni, setYeniNotMetni] = useState("");
  const [duzenNot, setDuzenNot] = useState(null); // {id, metin}
  const dosyaInputRef = useRef(null);
  const bayiRef = useRef(null);

  /* ---- Düzenleme modunda mevcut müşteriyi yükle ---- */
  useEffect(() => {
    if (duzenleModu) {
      setYukleniyor(true);
      const musteriYukle = async () => {
        try {
          const yanit = await apiGet(`/musteriler/${id}`);
          const m = yanit.veri;
          if (m) {
            /* Kişileri ayrı endpoint'ten çek */
            let kisilerData = [];
            try {
              const kisiYanit = await apiGet(`/kisiler/musteri/${id}`);
              kisilerData = (kisiYanit.veri || []).map(k => ({
                adSoyad: k.ad_soyad || "",
                telefon: k.telefon || "",
                eposta: k.eposta || "",
                gorev: k.unvan || "",
                adres: k.adres || "",
              }));
            } catch { /* Kişiler yüklenemezse boş bırak */ }

            /* Notları ayrı endpoint'ten çek */
            let notlarData = [];
            try {
              const notYanit = await apiGet(`/notlar/musteri/${id}`);
              notlarData = (notYanit.veri || []).map(n => ({ id: n.id, metin: n.metin || "", onemli: n.onemli || false, tarih: n.tarih, kullanici_adi: n.kullanici_adi || null }));
            } catch { /* Notlar yüklenemezse boş bırak */ }
            setNotListesi(notlarData);

            /* Dosyaları ayrı endpoint'ten çek */
            try {
              const dosyaYanit = await apiGet(`/musteriler/${id}/dosyalar`);
              setMevcutDosyalar(dosyaYanit.veri || []);
            } catch { /* Dosyalar yüklenemezse boş bırak */ }

            /* Telefon: telefonlar dizisinin ilk elemanı */
            const telefonDeger = Array.isArray(m.telefonlar) && m.telefonlar.length > 0
              ? m.telefonlar[0] : "";

            /* Adres: adresler dizisinin ilk elemanı */
            const adresDeger = Array.isArray(m.adresler) && m.adresler.length > 0
              ? m.adresler[0] : "";

            /* Bayi adını bayiler listesinden bul */
            let bayiAdiDeger = "";
            if (m.bayi_id) {
              try {
                const bayiYanit = await apiGet("/bayiler");
                const bulunan = (bayiYanit.veri || []).find(b => b.id === m.bayi_id);
                if (bulunan) bayiAdiDeger = bulunan.ad || bulunan.sirket_adi || `Bayi #${bulunan.id}`;
              } catch { /* Bayi bulunamazsa boş bırak */ }
            }

            setAktifSekme(m.tur || "gercek");
            setForm({
              sirketAdi: m.sirket_adi || "",
              yetkiliKisi: m.yetkili_kisi || "",
              adSoyad: m.ad_soyad || "",
              eposta: m.eposta || "",
              telefon: telefonDeger,
              sektor: m.sektor_id ? String(m.sektor_id) : "",
              sektorDiger: "",
              vergiDairesi: m.vergi_dairesi || "",
              vergiNo: m.vergi_no || "",
              tcKimlikNo: m.tc_kimlik_no || "",
              pasaportNo: m.pasaport_no || "",
              bayi: m.bayi_id ? String(m.bayi_id) : "",
              bayiAdi: bayiAdiDeger,
              bayiArama: "",
              adres: adresDeger,
              kisiler: kisilerData,
              notlar: "",
              etiketler: Array.isArray(m.etiketler) ? m.etiketler : [],
              yeniEtiket: "",
              durum: (m.durum || "").toLowerCase() === "aktif",
            });
          }
        } catch (e) {
          console.error("Müşteri yüklenemedi:", e);
          git("/dashboard/musteriler");
        } finally {
          setYukleniyor(false);
        }
      };
      musteriYukle();
    }
  }, [id, duzenleModu, git]);

  /* ---- Sektörleri ve Bayileri API'den Çek ---- */
  useEffect(() => {
    apiGet("/sektorler").then((yanit) => {
      if (yanit?.veri) setSektorler(yanit.veri);
    }).catch(() => {});
    apiGet("/bayiler").then((yanit) => {
      if (yanit?.veri) setBayiler(yanit.veri);
    }).catch(() => {});
  }, []);

  /* ---- Bayi dropdown dışına tıklanınca kapat ---- */
  useEffect(() => {
    const disariTikla = (e) => {
      if (bayiRef.current && !bayiRef.current.contains(e.target)) {
        setBayiAcik(false);
      }
    };
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, []);

  /* ---- Bayi listesi ---- */
  const tumBayiler = bayiler
    .filter(b => !b.silinme_tarihi)
    .map((b) => ({
      id: b.id,
      ad: b.ad || b.sirket_adi || `Bayi #${b.id}`,
    }));

  const filtreliBayiler = tumBayiler.filter((b) =>
    b.ad.toLowerCase().includes(form.bayiArama.toLowerCase())
  );

  /* ---- Tekil Alan Güncelleme ---- */
  const alanGuncelle = (alan, deger) => {
    setForm((o) => ({ ...o, [alan]: deger }));
    if (hatalar[alan]) {
      setHatalar((o) => { const y = { ...o }; delete y[alan]; return y; });
    }
  };

  /* ---- Sekme Değiştirme ---- */
  const sekmeDegistir = (id) => {
    setAktifSekme(id);
    setHatalar({});
  };

  /* ---- Dinamik Liste İşlemleri ---- */
  const listeEkle = (alan) => setForm((o) => ({ ...o, [alan]: [...o[alan], ""] }));
  const listeGuncelle = (alan, idx, deger) => {
    setForm((o) => { const yeni = [...o[alan]]; yeni[idx] = deger; return { ...o, [alan]: yeni }; });
  };
  const listeSil = (alan, idx) => {
    setForm((o) => { const yeni = o[alan].filter((_, i) => i !== idx); return { ...o, [alan]: yeni.length === 0 ? [""] : yeni }; });
  };

  /* ---- Kişi İşlemleri ---- */
  const bosKisi = () => ({ adSoyad: "", telefon: "", eposta: "", gorev: "", adres: "", birincil: false });
  const kisiEkle = () => setForm((o) => ({ ...o, kisiler: [...o.kisiler, bosKisi()] }));
  const kisiGuncelle = (idx, alan, deger) => {
    setForm((o) => {
      const yeni = [...o.kisiler];
      yeni[idx] = { ...yeni[idx], [alan]: alan === "telefon" ? telefonFormatla(deger) : deger };
      return { ...o, kisiler: yeni };
    });
  };
  const kisiSil = (idx) => setForm((o) => ({ ...o, kisiler: o.kisiler.filter((_, i) => i !== idx) }));

  /* ---- Etiketler ---- */
  const [tumEtiketler, setTumEtiketler] = useState([]);
  const [etiketOneriAcik, setEtiketOneriAcik] = useState(false);
  const etiketRef = useRef(null);

  useEffect(() => {
    const disariTikla = (e) => { if (etiketRef.current && !etiketRef.current.contains(e.target)) setEtiketOneriAcik(false); };
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, []);

  useEffect(() => {
    /* Tüm müşteri ve bayilerden mevcut etiketleri topla */
    const topla = async () => {
      const set = new Set();
      try {
        const [mRes, bRes] = await Promise.all([apiGet("/musteriler"), apiGet("/bayiler")]);
        if (mRes?.veri) mRes.veri.forEach((m) => {
          const arr = Array.isArray(m.etiketler) ? m.etiketler : (typeof m.etiketler === "string" ? (() => { try { return JSON.parse(m.etiketler); } catch { return []; } })() : []);
          arr.forEach((e) => set.add(e));
        });
        if (bRes?.veri) bRes.veri.forEach((b) => {
          const arr = Array.isArray(b.etiketler) ? b.etiketler : (typeof b.etiketler === "string" ? (() => { try { return JSON.parse(b.etiketler); } catch { return []; } })() : []);
          arr.forEach((e) => set.add(e));
        });
      } catch {}
      setTumEtiketler([...set].sort((a, b) => a.localeCompare(b, "tr")));
    };
    topla();
  }, []);

  const filtrelenmisEtiketler = tumEtiketler.filter(
    (e) => e.toLowerCase().includes((form.yeniEtiket || "").toLowerCase()) && !(form.etiketler || []).includes(e)
  );

  const etiketSec = (etiket) => {
    if (etiket && !form.etiketler.includes(etiket)) {
      setForm((o) => ({ ...o, etiketler: [...o.etiketler, etiket], yeniEtiket: "" }));
    }
    setEtiketOneriAcik(false);
  };

  const etiketEkle = () => {
    const etiket = form.yeniEtiket.trim();
    if (etiket && !form.etiketler.includes(etiket)) {
      setForm((o) => ({ ...o, etiketler: [...o.etiketler, etiket], yeniEtiket: "" }));
    }
    setEtiketOneriAcik(false);
  };
  const etiketSil = (idx) => setForm((o) => ({ ...o, etiketler: o.etiketler.filter((_, i) => i !== idx) }));
  const etiketKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); etiketEkle(); } };

  /* ============================================= */
  /*  Form Doğrulama                               */
  /* ============================================= */

  const formuDogrula = () => {
    const h = {};

    /* Adres zorunlu (Fatura Bilgileri) */
    if (!form.adres.trim()) h.adres = "Adres zorunludur.";

    /* E-Posta zorunlu (Fatura Bilgileri) */
    if (!form.eposta.trim()) h.eposta = "E-Posta zorunludur.";
    else if (!epostaGecerliMi(form.eposta)) h.eposta = "Geçerli bir e-posta adresi giriniz.";

    /* Gerçek müşteri */
    if (aktifSekme === "gercek") {
      if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      if (!form.tcKimlikNo.trim()) h.tcKimlikNo = "TC Kimlik No zorunludur.";
      else if (form.tcKimlikNo.length !== 11) h.tcKimlikNo = "TC Kimlik No 11 haneli olmalıdır.";
      else if (!tcKimlikGecerliMi(form.tcKimlikNo)) h.tcKimlikNo = "Geçersiz TC Kimlik numarası. Lütfen doğru giriniz.";
    }

    /* Tüzel müşteri */
    if (aktifSekme === "tuzel") {
      if (!form.sirketAdi.trim()) h.sirketAdi = "Şirket Ünvanı zorunludur.";
      if (!form.vergiNo.trim()) h.vergiNo = "Vergi Numarası zorunludur.";
      else if (form.vergiNo.length < 10 || form.vergiNo.length > 11) h.vergiNo = "Vergi Numarası 10 veya 11 haneli olmalıdır.";
      if (!form.vergiDairesi.trim()) h.vergiDairesi = "Vergi Dairesi zorunludur.";
    }

    /* Yabancı müşteri */
    if (aktifSekme === "yabanci") {
      if (!form.adSoyad.trim()) h.adSoyad = "Ad Soyad zorunludur.";
      if (!form.pasaportNo.trim()) h.pasaportNo = "Pasaport No zorunludur.";
    }

    setHatalar(h);
    return Object.keys(h).length === 0;
  };

  /* ============================================= */
  /*  Not İşlemleri                                */
  /* ============================================= */

  const notEkle = async () => {
    if (!yeniNotMetni.trim()) return;
    if (duzenleModu) {
      try {
        await apiPost(`/notlar/musteri/${id}`, { metin: yeniNotMetni.trim(), onemli: false });
        const notYanit = await apiGet(`/notlar/musteri/${id}`);
        setNotListesi((notYanit.veri || []).map(n => ({ id: n.id, metin: n.metin || "", onemli: n.onemli || false, tarih: n.tarih, kullanici_adi: n.kullanici_adi || null })));
      } catch { /* hata */ }
    } else {
      setNotListesi(prev => [...prev, { id: Date.now(), metin: yeniNotMetni.trim(), onemli: false, tarih: new Date().toISOString(), yeni: true, kullanici_adi: kullanici?.ad_soyad || null }]);
    }
    setYeniNotMetni("");
  };

  const notSil = async (notId) => {
    const not = notListesi.find(n => n.id === notId);
    if (not && !not.yeni && duzenleModu) {
      try { await apiDelete(`/notlar/${notId}`); } catch { /* hata */ }
    }
    setNotListesi(prev => prev.filter(n => n.id !== notId));
  };

  const notGuncelle = async (notId, yeniMetin) => {
    if (!yeniMetin.trim()) return;
    const not = notListesi.find(n => n.id === notId);
    if (not && !not.yeni && duzenleModu) {
      try { await apiPut(`/notlar/${notId}`, { metin: yeniMetin.trim() }); } catch { /* hata */ }
    }
    setNotListesi(prev => prev.map(n => n.id === notId ? { ...n, metin: yeniMetin.trim() } : n));
    setDuzenNot(null);
  };

  /* ============================================= */
  /*  Dosya İşlemleri                              */
  /* ============================================= */

  const mevcutDosyaSil = async (dosyaId) => {
    if (!duzenleModu) return;
    try {
      await apiDelete(`/musteriler/${id}/dosyalar/${dosyaId}`);
      setMevcutDosyalar(prev => prev.filter(d => d.id !== dosyaId));
    } catch { /* hata */ }
  };

  const dosyaBoyutFormatla = (boyut) => {
    if (!boyut) return "";
    if (boyut < 1024) return boyut + " B";
    if (boyut < 1024 * 1024) return (boyut / 1024).toFixed(0) + " KB";
    return (boyut / (1024 * 1024)).toFixed(1) + " MB";
  };

  /* ============================================= */
  /*  Form Gönderme                                */
  /* ============================================= */

  const formGonder = async (e) => {
    e.preventDefault();
    if (!formuDogrula()) return;

    const veri = {
      tur: aktifSekme,
      eposta: form.eposta,
      sektorId: form.sektor ? Number(form.sektor) : null,
      bayiId: form.bayi ? Number(form.bayi) : null,
      telefonlar: [form.telefon, ...form.kisiler.map((k) => k.telefon)].filter(Boolean),
      adresler: form.adres.trim() ? [form.adres.trim()] : [],
      kisiler: form.kisiler.filter((k) => k.adSoyad.trim() || k.telefon.trim()),
      etiketler: form.etiketler,
      durum: form.durum ? "aktif" : "pasif",
      ...(aktifSekme === "gercek" && {
        adSoyad: form.adSoyad,
        tcKimlikNo: form.tcKimlikNo,
      }),
      ...(aktifSekme === "tuzel" && {
        sirketAdi: form.sirketAdi,
        yetkiliKisi: form.yetkiliKisi,
        vergiDairesi: form.vergiDairesi,
        vergiNo: form.vergiNo,
      }),
      ...(aktifSekme === "yabanci" && {
        adSoyad: form.adSoyad,
        sirketAdi: form.sirketAdi || undefined,
        pasaportNo: form.pasaportNo,
      }),
    };

    console.log("📦 Müşteri verisi (backend'e gönderilecek):", veri);
    
    let sonuc;
    if (duzenleModu) {
      /* Düzenleme modu - PUT isteği */
      sonuc = await musteriGuncelle(id, veri);
      logEkle("musteri_guncelleme", `"${veri.adSoyad || veri.sirketAdi || 'Müşteri'}" adlı müşteri güncellendi.`);
    } else {
      /* Ekleme modu - POST isteği */
      sonuc = await musteriEkle(veri);
      logEkle("musteri_ekleme", `"${veri.adSoyad || veri.sirketAdi || 'Yeni Müşteri'}" adlı müşteri eklendi.`);
    }

    /* Dosya varsa yükle */
    const musteriId = duzenleModu ? id : sonuc?.id;
    if (dosyalar.length > 0 && musteriId) {
      setDosyaYukleniyor(true);
      for (const dosya of dosyalar) {
        const fd = new FormData();
        fd.append("dosyalar", dosya);
        try {
          const token = localStorage.getItem("gt_token");
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/musteriler/${musteriId}/dosyalar`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          });
        } catch (err) {
          console.error("Dosya yükleme hatası:", err);
        }
      }
      setDosyaYukleniyor(false);
    }

    /* Yeni müşteri için notları kaydet */
    if (!duzenleModu && musteriId && notListesi.length > 0) {
      for (const n of notListesi) {
        try {
          await apiPost(`/notlar/musteri/${musteriId}`, { metin: n.metin, onemli: n.onemli || false });
        } catch { /* not kaydedilemezse devam et */ }
      }
    }

    setBasarili(true);
    setTimeout(() => git("/dashboard/musteriler"), 2000);
  };

  /* ============================================= */
  /*  Başarılı Kayıt Ekranı                        */
  /* ============================================= */

  if (basarili) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {duzenleModu ? "Müşteri Başarıyla Güncellendi!" : "Müşteri Başarıyla Kaydedildi!"}
          </h2>
          <p className="text-gray-500 dark:text-slate-400">
            {duzenleModu ? "Müşteri detay sayfasına yönlendiriliyorsunuz..." : "Müşteriler sayfasına yönlendiriliyorsunuz..."}
          </p>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Yükleniyor Ekranı (Düzenleme modu)           */
  /* ============================================= */

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-slate-400">Müşteri bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  /* ============================================= */
  /*  Sayfa Render                                 */
  /* ============================================= */

  return (
    <div className="max-w-4xl mx-auto">

      {/* ---- Sayfa Başlığı ve Geri Butonu ---- */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => git("/dashboard/musteriler")}
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Müşterilere Dön
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {duzenleModu ? "Müşteri Düzenle" : "Yeni Müşteri Kaydı"}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            {duzenleModu ? "Müşteri bilgilerini güncelleyin." : "Müşteri bilgilerini doldurun ve kaydedin."}
          </p>
        </div>
      </div>

      <form onSubmit={formGonder} className="space-y-8">

        {/* ============================================= */}
        {/*  Bölüm 0: Bayi Seçimi (En Üstte)             */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Bayi
          </h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Bu müşteriyi bir bayiye bağlamak istiyorsanız aşağıdan arayın.</p>

          <div className="relative" ref={bayiRef}>
            {form.bayi ? (
              <div className="flex items-center gap-2">
                <div className={INPUT_STIL + " flex items-center justify-between"}>
                  <span>{form.bayiAdi}</span>
                  <button
                    type="button"
                    onClick={() => { alanGuncelle("bayi", ""); alanGuncelle("bayiAdi", ""); alanGuncelle("bayiArama", ""); }}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Bayi adı yazarak arayın..."
                  value={form.bayiArama}
                  onChange={(e) => {
                    alanGuncelle("bayiArama", e.target.value);
                    setBayiAcik(true);
                  }}
                  onFocus={() => setBayiAcik(true)}
                  className={INPUT_STIL}
                />
                {bayiAcik && form.bayiArama.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 shadow-xl max-h-56 overflow-y-auto">
                    {filtreliBayiler.length > 0 ? (
                      filtreliBayiler.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            alanGuncelle("bayi", String(b.id));
                            alanGuncelle("bayiAdi", b.ad);
                            alanGuncelle("bayiArama", "");
                            setBayiAcik(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          {b.ad}
                        </button>
                      ))
                    ) : (
                      <div className="p-4">
                        <p className="text-sm text-gray-400 dark:text-slate-500">Eşleşen bayi bulunamadı.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ---- Sekme (Tab) Çubuğu: Gerçek / Tüzel / Yabancı ---- */}
        <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-xl border border-gray-200 dark:border-white/10">
          {SEKMELER.map((sekme) => (
            <button
              key={sekme.id}
              type="button"
              onClick={() => sekmeDegistir(sekme.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                aktifSekme === sekme.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {sekme.ikon}
              {sekme.etiket}
            </button>
          ))}
        </div>

        {/* ============================================= */}
        {/*  Bölüm 1: Fatura Bilgileri (Tipe Göre)       */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Fatura Bilgileri
            </h3>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${form.durum ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                {form.durum ? "Aktif" : "Pasif"}
              </span>
              <button
                type="button"
                onClick={() => alanGuncelle("durum", !form.durum)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                  form.durum ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/20"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  form.durum ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ======== GERÇEK MÜŞTERİ ALANLARI ======== */}
            {aktifSekme === "gercek" && (
              <>
                <div>
                  <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Ad ve soyadını giriniz" value={form.adSoyad}
                    onChange={(e) => alanGuncelle("adSoyad", e.target.value)}
                    className={hatalar.adSoyad ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.adSoyad && <p className="text-red-500 text-xs mt-1">{hatalar.adSoyad}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>TC Kimlik No <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="11 haneli TC kimlik numarası" value={form.tcKimlikNo}
                    onChange={(e) => alanGuncelle("tcKimlikNo", sadeceSayi(e.target.value, 11))}
                    className={hatalar.tcKimlikNo ? HATA_INPUT_STIL : INPUT_STIL} maxLength={11} />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.tcKimlikNo.length}/11 hane</p>
                  {hatalar.tcKimlikNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.tcKimlikNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>E-Posta <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="ornek@sirket.com" value={form.eposta}
                    onChange={(e) => alanGuncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Telefon</label>
                  <input type="text" placeholder="(XXX) XXX XX XX" value={form.telefon}
                    onChange={(e) => alanGuncelle("telefon", telefonFormatla(e.target.value))}
                    className={INPUT_STIL} maxLength={15} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Adres <span className="text-red-500">*</span></label>
                  <textarea placeholder="Adres bilgisi" value={form.adres}
                    onChange={(e) => alanGuncelle("adres", e.target.value)}
                    rows={2} className={(hatalar.adres ? HATA_INPUT_STIL : INPUT_STIL) + " resize-none"} />
                  {hatalar.adres && <p className="text-red-500 text-xs mt-1">{hatalar.adres}</p>}
                </div>
              </>
            )}

            {/* ======== TÜZEL MÜŞTERİ ALANLARI ======== */}
            {aktifSekme === "tuzel" && (
              <>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Şirket Ünvanı <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Şirket ünvanını giriniz" value={form.sirketAdi}
                    onChange={(e) => alanGuncelle("sirketAdi", e.target.value)}
                    className={hatalar.sirketAdi ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.sirketAdi && <p className="text-red-500 text-xs mt-1">{hatalar.sirketAdi}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Vergi Dairesi <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Vergi dairesi adı" value={form.vergiDairesi}
                    onChange={(e) => alanGuncelle("vergiDairesi", e.target.value)}
                    className={hatalar.vergiDairesi ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.vergiDairesi && <p className="text-red-500 text-xs mt-1">{hatalar.vergiDairesi}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Vergi Numarası <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="10 haneli vergi numarası" value={form.vergiNo}
                    onChange={(e) => alanGuncelle("vergiNo", sadeceSayi(e.target.value, 10))}
                    className={hatalar.vergiNo ? HATA_INPUT_STIL : INPUT_STIL} maxLength={10} />
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.vergiNo.length}/10 hane</p>
                  {hatalar.vergiNo && <p className="text-red-500 text-xs mt-0.5">{hatalar.vergiNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>E-Posta <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="ornek@sirket.com" value={form.eposta}
                    onChange={(e) => alanGuncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Telefon</label>
                  <input type="text" placeholder="(XXX) XXX XX XX" value={form.telefon}
                    onChange={(e) => alanGuncelle("telefon", telefonFormatla(e.target.value))}
                    className={INPUT_STIL} maxLength={15} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Adres <span className="text-red-500">*</span></label>
                  <textarea placeholder="Adres bilgisi" value={form.adres}
                    onChange={(e) => alanGuncelle("adres", e.target.value)}
                    rows={2} className={(hatalar.adres ? HATA_INPUT_STIL : INPUT_STIL) + " resize-none"} />
                  {hatalar.adres && <p className="text-red-500 text-xs mt-1">{hatalar.adres}</p>}
                </div>
              </>
            )}

            {/* ======== YABANCI MÜŞTERİ ALANLARI ======== */}
            {aktifSekme === "yabanci" && (
              <>
                <div>
                  <label className={LABEL_STIL}>Ad Soyad <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Ad ve soyadını giriniz" value={form.adSoyad}
                    onChange={(e) => alanGuncelle("adSoyad", e.target.value)}
                    className={hatalar.adSoyad ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.adSoyad && <p className="text-red-500 text-xs mt-1">{hatalar.adSoyad}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Pasaport No <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Pasaport numarası" value={form.pasaportNo}
                    onChange={(e) => alanGuncelle("pasaportNo", e.target.value)}
                    className={hatalar.pasaportNo ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.pasaportNo && <p className="text-red-500 text-xs mt-1">{hatalar.pasaportNo}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>E-Posta <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="ornek@sirket.com" value={form.eposta}
                    onChange={(e) => alanGuncelle("eposta", e.target.value)}
                    className={hatalar.eposta ? HATA_INPUT_STIL : INPUT_STIL} />
                  {hatalar.eposta && <p className="text-red-500 text-xs mt-1">{hatalar.eposta}</p>}
                </div>
                <div>
                  <label className={LABEL_STIL}>Telefon</label>
                  <input type="text" placeholder="(XXX) XXX XX XX" value={form.telefon}
                    onChange={(e) => alanGuncelle("telefon", telefonFormatla(e.target.value))}
                    className={INPUT_STIL} maxLength={15} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_STIL}>Adres <span className="text-red-500">*</span></label>
                  <textarea placeholder="Adres bilgisi" value={form.adres}
                    onChange={(e) => alanGuncelle("adres", e.target.value)}
                    rows={2} className={(hatalar.adres ? HATA_INPUT_STIL : INPUT_STIL) + " resize-none"} />
                  {hatalar.adres && <p className="text-red-500 text-xs mt-1">{hatalar.adres}</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ============================================= */}
        {/*  Bölüm 2: Kişi Ekleme                        */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Kişi Ekleme
            </h3>
            <button type="button" onClick={kisiEkle}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Kişi Ekle
            </button>
          </div>

          {form.kisiler.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
              Henüz kişi eklenmedi. Kişi eklemek için yukarıdaki butona tıklayın.
            </p>
          ) : (
            <div className="space-y-4">
              {form.kisiler.map((kisi, idx) => (
                <div key={idx} className="relative rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-4">
                  <button type="button" onClick={() => kisiSil(idx)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                    <div>
                      <label className={LABEL_STIL}>Ad Soyad</label>
                      <input type="text" placeholder="Ad ve soyad" value={kisi.adSoyad}
                        onChange={(e) => kisiGuncelle(idx, "adSoyad", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Görevi</label>
                      <input type="text" placeholder="Görevi" value={kisi.gorev}
                        onChange={(e) => kisiGuncelle(idx, "gorev", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>E-Posta</label>
                      <input type="email" placeholder="ornek@sirket.com" value={kisi.eposta}
                        onChange={(e) => kisiGuncelle(idx, "eposta", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div>
                      <label className={LABEL_STIL}>Telefon</label>
                      <input type="text" placeholder="(XXX) XXX XX XX" value={kisi.telefon}
                        onChange={(e) => kisiGuncelle(idx, "telefon", e.target.value)} className={INPUT_STIL} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={LABEL_STIL}>Adres</label>
                      <textarea placeholder="Adres bilgisi" value={kisi.adres}
                        onChange={(e) => kisiGuncelle(idx, "adres", e.target.value)}
                        rows={2} className={INPUT_STIL + " resize-none"} />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" id={`birincil-${idx}`} checked={!!kisi.birincil}
                        onChange={(e) => {
                          /* Birincil seçildiğinde diğerlerini kaldır */
                          if (e.target.checked) {
                            setForm((o) => ({
                              ...o,
                              kisiler: o.kisiler.map((k, i) => ({ ...k, birincil: i === idx }))
                            }));
                          } else {
                            kisiGuncelle(idx, "birincil", false);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      <label htmlFor={`birincil-${idx}`} className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer">Birincil İletişim Kişisi</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================= */}
        {/*  Bölüm 3: Ek Bilgiler                        */}
        {/* ============================================= */}
        <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Ek Bilgiler
          </h3>

          {/* ---- Sektör ---- */}
          <div className="mb-6">
            <label className={LABEL_STIL}>Sektör</label>
            <select value={form.sektor} onChange={(e) => alanGuncelle("sektor", e.target.value)}
              className={INPUT_STIL + " [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-gray-900 [&>option]:dark:text-white"}>
              <option value="">Sektör seçiniz</option>
              {sektorler.filter((s) => s.aktif).map((s) => (<option key={s.id} value={s.id}>{s.ad}</option>))}
            </select>
          </div>

          <div className="mb-6">
            <label className={LABEL_STIL}>Notlar</label>

            {/* Mevcut notlar listesi */}
            {notListesi.length > 0 && (
              <div className="space-y-3 mb-4">
                {notListesi.map((not) => (
                  <div key={not.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    {duzenNot && duzenNot.id === not.id ? (
                      <div className="flex-1 flex flex-col gap-2">
                        <textarea
                          value={duzenNot.metin}
                          onChange={(e) => setDuzenNot({ ...duzenNot, metin: e.target.value })}
                          rows={3}
                          className={INPUT_STIL + " resize-none"}
                        />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setDuzenNot(null)}
                            className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            İptal
                          </button>
                          <button type="button" onClick={() => notGuncelle(not.id, duzenNot.metin)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                            Kaydet
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{not.metin}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {not.kullanici_adi && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {not.kullanici_adi}
                              </span>
                            )}
                            {not.tarih && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(not.tarih).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => setDuzenNot({ id: not.id, metin: not.metin })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Düzenle">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button type="button" onClick={() => notSil(not.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Sil">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Yeni not ekleme */}
            <div className="flex gap-2">
              <textarea
                placeholder="Yeni not ekleyin..."
                value={yeniNotMetni}
                onChange={(e) => setYeniNotMetni(e.target.value)}
                rows={2}
                className={INPUT_STIL + " resize-none flex-1"}
              />
              <button type="button" onClick={notEkle} disabled={!yeniNotMetni.trim()}
                className="self-end px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                Ekle
              </button>
            </div>
          </div>

          {/* ---- Dosyalar ---- */}
          <div className="mb-6">
            <label className={LABEL_STIL}>Dosyalar</label>

            {/* Mevcut yüklü dosyalar */}
            {mevcutDosyalar.length > 0 && (
              <div className="space-y-3 mb-4">
                {mevcutDosyalar.map((dosya) => (
                  <div key={dosya.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      {dosya.dosya_tipi?.startsWith("image/") ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{dosya.orijinal_ad}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">({dosyaBoyutFormatla(dosya.boyut)})</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/musteriler/${id}/dosyalar/${dosya.id}/indir`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="İndir">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                      <button type="button" onClick={() => mevcutDosyaSil(dosya.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Sil">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Yeni dosya ekleme */}
            <input type="file" ref={dosyaInputRef} multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(e) => {
                const yeniDosyalar = Array.from(e.target.files);
                setDosyalar((o) => [...o, ...yeniDosyalar]);
                e.target.value = "";
              }}
              className="hidden" />
            <div
              onClick={() => dosyaInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-blue-500", "bg-blue-50", "dark:bg-blue-500/10"); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-500/10"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-500/10");
                const birakilan = Array.from(e.dataTransfer.files).filter((f) =>
                  /\.(pdf|png|jpe?g|gif|webp)$/i.test(f.name)
                );
                setDosyalar((o) => [...o, ...birakilan]);
              }}
              className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/40 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-auto mb-1 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Dosya sürükleyip bırakın veya <span className="text-blue-600 dark:text-blue-400 font-medium">tıklayarak seçin</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PDF, PNG, JPG, GIF, WEBP — maks. 10MB</p>
            </div>
            {dosyalar.length > 0 && (
              <div className="mt-3 space-y-2">
                {dosyalar.map((dosya, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      {dosya.type?.startsWith("image/") ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{dosya.name}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">({(dosya.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button type="button" onClick={() => setDosyalar((o) => o.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- Etiketler ---- */}
          <div>
            <label className={LABEL_STIL}>Etiketler</label>
            {form.etiketler.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.etiketler.map((etiket, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
                    {etiket}
                    <button type="button" onClick={() => etiketSil(idx)} className="hover:text-red-500 transition-colors cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 relative" ref={etiketRef}>
              <div className="relative flex-1">
                <input type="text" placeholder="Etiket yazın ve ekleyin" value={form.yeniEtiket}
                  onChange={(e) => { alanGuncelle("yeniEtiket", e.target.value); setEtiketOneriAcik(true); }}
                  onFocus={() => setEtiketOneriAcik(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); etiketEkle(); }
                    if (e.key === "Escape") setEtiketOneriAcik(false);
                  }}
                  className={INPUT_STIL} />
                {etiketOneriAcik && filtrelenmisEtiketler.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-xl">
                    {filtrelenmisEtiketler.map((e, i) => (
                      <button key={i} type="button"
                        onMouseDown={(ev) => { ev.preventDefault(); etiketSec(e); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer">
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={etiketEkle} disabled={!form.yeniEtiket.trim()}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ---- Hata Özeti ---- */}
        {Object.keys(hatalar).length > 0 && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Lütfen aşağıdaki hataları düzeltin:
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 space-y-1">
              {Object.values(hatalar).map((hata, idx) => (<li key={idx}>{hata}</li>))}
            </ul>
          </div>
        )}

        {/* ---- Form Aksiyon Butonları ---- */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button type="button" onClick={() => git("/dashboard/musteriler")}
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium cursor-pointer">
            İptal
          </button>
          <button type="submit"
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-600/25 cursor-pointer inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Müşteriyi Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
