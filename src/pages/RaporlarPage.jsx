/* ============================================= */
/*  Güzel Teknoloji - Raporlar Sayfası            */
/*  Sekmeler: Satışlar, Aktif Paketler,           */
/*  Aktif Cihazlar, Süresi Yaklaşanlar,           */
/*  Süresi Bitenler, Tahsilatlar                   */
/*  Gece/Gündüz modu destekli                     */
/* ============================================= */

import { useState } from "react";
import KopyalaButonu from "../components/KopyalaButonu";

/* ============================================= */
/*  Sabitler                                      */
/* ============================================= */

const INPUT_STIL =
  "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

/* ---- Excel (CSV) Dışa Aktarma ---- */
const excelAktar = (veri, sutunlar, dosyaAdi) => {
  const bom = "\uFEFF";
  const basliklar = sutunlar.map((s) => s.baslik).join(";");
  const satirlar = veri.map((item) =>
    sutunlar.map((s) => {
      let deger = String(s.al(item) ?? "");
      if (deger.includes(";") || deger.includes('"') || deger.includes("\n")) {
        deger = `"${deger.replace(/"/g, '""')}"`;
      }
      return deger;
    }).join(";")
  );
  const csv = bom + basliklar + "\n" + satirlar.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dosyaAdi}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const ExcelButonu = ({ onClick }) => (
  <button onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Excel'e Aktar
  </button>
);

/* ---- Sekme Tanımları ---- */
const SEKMELER = [
  {
    id: "satislar", etiket: "Satışlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    id: "aktifPaketler", etiket: "Aktif Paketler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    id: "aktifCihazlar", etiket: "Aktif Cihazlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    id: "suresiYaklasanlar", etiket: "Süresi Yaklaşanlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    id: "suresiBitenler", etiket: "Süresi Bitenler",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
  },
  {
    id: "tahsilatlar", etiket: "Tahsilatlar",
    ikon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
];

/* ============================================= */
/*  Mock Veriler                                  */
/* ============================================= */

const SATISLAR = [
  { id: 1, musteri: "ABC Teknoloji Ltd.", urun: "CRM Yazılımı", paket: "CRM Pro - Aktivasyon", domain: "https://tahsilat.pozitifbilgisayar.com.tr/", kullanici: "admin", tutar: 2500, tarih: "2026-03-20", durum: "Tamamlandı" },
  { id: 2, musteri: "XYZ Medya A.Ş.", urun: "Kurumsal E-Posta 5GB", paket: "Business Starter - Aktivasyon", domain: "", kullanici: "", tutar: 0, tarih: "2026-03-19", durum: "Tamamlandı" },
  { id: 3, musteri: "Demo Yazılım", urun: "E-Ticaret Paketi", paket: "E-Ticaret Başlangıç", domain: "https://demo-eticaret.com/", kullanici: "demo_user", tutar: 1500, tarih: "2026-03-18", durum: "Bekliyor" },
  { id: 4, musteri: "Mega Holding", urun: "Muhasebe Pro", paket: "Muhasebe Pro - Lisans", domain: "", kullanici: "finans01", tutar: 3000, tarih: "2026-03-17", durum: "Tamamlandı" },
  { id: 5, musteri: "Star İletişim", urun: "Toplu SMS 1000", paket: "1000 SMS Paketi", domain: "", kullanici: "", tutar: 200, tarih: "2026-03-16", durum: "Tamamlandı" },
  { id: 6, musteri: "Kardeşler Tic.", urun: "Başlangıç Hosting", paket: "Hosting Başlangıç - Aktivasyon", domain: "http://kardeslertic.com/", kullanici: "", tutar: 250, tarih: "2026-03-15", durum: "İptal" },
  { id: 7, musteri: "Pilot Bilişim", urun: "Standart SSL", paket: "SSL Standart - 1 Yıl", domain: "https://pilotbilisim.com/", kullanici: "", tutar: 150, tarih: "2026-03-14", durum: "Tamamlandı" },
  { id: 8, musteri: "Nova Danışmanlık", urun: "CRM Yazılımı", paket: "CRM Pro - Enterprise Upgrade", domain: "", kullanici: "nova_admin", tutar: 3500, tarih: "2026-03-13", durum: "Bekliyor" },
  { id: 9, musteri: "Lider Oto", urun: "Stok Takip Sistemi", paket: "Stok Takip - Aktivasyon", domain: "", kullanici: "stok_mgr", tutar: 1800, tarih: "2026-03-12", durum: "Tamamlandı" },
  { id: 10, musteri: "Güneş Enerji", urun: "Profesyonel Hosting", paket: "Hosting Pro - Aktivasyon", domain: "http://gunesenerji.com.tr/", kullanici: "", tutar: 500, tarih: "2026-03-11", durum: "Tamamlandı" },
  { id: 11, musteri: "Doruk İnşaat", urun: "Kurumsal E-Posta 10GB", paket: "Business Plus - Aktivasyon", domain: "", kullanici: "doruk_it", tutar: 120, tarih: "2026-03-10", durum: "Tamamlandı" },
  { id: 12, musteri: "Akdeniz Turizm", urun: "Mobil Uygulama Paketi", paket: "Mobil - Aktivasyon", domain: "https://akdenizturizm.app/", kullanici: "akdeniz_app", tutar: 4500, tarih: "2026-03-09", durum: "Bekliyor" },
  { id: 13, musteri: "Bilge Eğitim", urun: "WordPress Hosting", paket: "WP Hosting - Aktivasyon", domain: "http://bilgeegitim.com/", kullanici: "", tutar: 180, tarih: "2026-03-08", durum: "Tamamlandı" },
  { id: 14, musteri: "Yıldız Lojistik", urun: "KEP Hesabı Kurumsal", paket: "KEP Kurumsal - Aktivasyon", domain: "", kullanici: "kep_admin", tutar: 350, tarih: "2026-03-07", durum: "Tamamlandı" },
  { id: 15, musteri: "Ofis Plus", urun: "Bakım Anlaşması Pro", paket: "Bakım Pro - Yıllık", domain: "", kullanici: "", tutar: 1200, tarih: "2026-03-06", durum: "Tamamlandı" },
];

const AKTIF_PAKETLER = [
  { id: 1, musteri: "ABC Teknoloji Ltd.", urun: "CRM Yazılımı", paketAdi: "CRM Pro - Aktivasyon", baslangic: "2026-01-15", bitis: "2027-01-15", kalanGun: 297, kullaniciSayisi: 5 },
  { id: 2, musteri: "XYZ Medya A.Ş.", urun: "Kurumsal E-Posta 5GB", paketAdi: "Business Starter", baslangic: "2026-02-01", bitis: "2027-02-01", kalanGun: 314, kullaniciSayisi: 10 },
  { id: 3, musteri: "Mega Holding", urun: "Muhasebe Pro", paketAdi: "Muhasebe Pro - Lisans", baslangic: "2025-12-10", bitis: "2026-12-10", kalanGun: 261, kullaniciSayisi: 3 },
  { id: 4, musteri: "Demo Yazılım", urun: "E-Ticaret Paketi", paketAdi: "E-Ticaret Başlangıç", baslangic: "2026-03-01", bitis: "2027-03-01", kalanGun: 342, kullaniciSayisi: 2 },
  { id: 5, musteri: "Pilot Bilişim", urun: "Standart SSL", paketAdi: "SSL Standart - 1 Yıl", baslangic: "2026-01-20", bitis: "2027-01-20", kalanGun: 302, kullaniciSayisi: 0 },
  { id: 6, musteri: "Lider Oto", urun: "Stok Takip Sistemi", paketAdi: "Stok Takip - Aktivasyon", baslangic: "2026-02-15", bitis: "2027-02-15", kalanGun: 328, kullaniciSayisi: 4 },
  { id: 7, musteri: "Güneş Enerji", urun: "Profesyonel Hosting", paketAdi: "Hosting Pro", baslangic: "2026-03-10", bitis: "2027-03-10", kalanGun: 351, kullaniciSayisi: 1 },
  { id: 8, musteri: "Doruk İnşaat", urun: "Kurumsal E-Posta 10GB", paketAdi: "Business Plus", baslangic: "2026-01-05", bitis: "2027-01-05", kalanGun: 287, kullaniciSayisi: 15 },
  { id: 9, musteri: "Yıldız Lojistik", urun: "KEP Hesabı Kurumsal", paketAdi: "KEP Kurumsal", baslangic: "2025-11-20", bitis: "2026-11-20", kalanGun: 241, kullaniciSayisi: 0 },
  { id: 10, musteri: "Bilge Eğitim", urun: "WordPress Hosting", paketAdi: "WP Hosting", baslangic: "2026-02-20", bitis: "2027-02-20", kalanGun: 333, kullaniciSayisi: 1 },
  { id: 11, musteri: "Star İletişim", urun: "Toplu SMS 1000", paketAdi: "1000 SMS Paketi", baslangic: "2026-03-15", bitis: "2026-09-12", kalanGun: 172, kullaniciSayisi: 0 },
  { id: 12, musteri: "Ofis Plus", urun: "Bakım Anlaşması Pro", paketAdi: "Bakım Pro - Yıllık", baslangic: "2026-01-10", bitis: "2027-01-10", kalanGun: 292, kullaniciSayisi: 0 },
];

const AKTIF_CIHAZLAR = [
  { id: 1, musteri: "ABC Teknoloji Ltd.", bilgisayarAdi: "DESKTOP-CRM01", ipAdresi: "192.168.1.10", islemciNo: "BFEBFBFF-000906A3", surum: "v4.2.1", aktivasyonZamani: "15.01.2026 10:30", sonBaglanti: "2026-03-24 09:45", durum: "Çevrimiçi" },
  { id: 2, musteri: "ABC Teknoloji Ltd.", bilgisayarAdi: "LAPTOP-SATIS02", ipAdresi: "192.168.1.22", islemciNo: "BFEBFBFF-000806C1", surum: "v4.2.1", aktivasyonZamani: "18.01.2026 14:15", sonBaglanti: "2026-03-24 10:12", durum: "Çevrimiçi" },
  { id: 3, musteri: "Mega Holding", bilgisayarAdi: "SERVER-MUHASEBE", ipAdresi: "10.0.0.5", islemciNo: "BFEBFBFF-000A0671", surum: "v4.1.0", aktivasyonZamani: "10.12.2025 09:00", sonBaglanti: "2026-03-24 08:30", durum: "Çevrimiçi" },
  { id: 4, musteri: "Mega Holding", bilgisayarAdi: "PC-FINANS01", ipAdresi: "10.0.0.18", islemciNo: "BFEBFBFF-000806EC", surum: "v4.1.0", aktivasyonZamani: "12.12.2025 11:45", sonBaglanti: "2026-03-23 17:50", durum: "Çevrimdışı" },
  { id: 5, musteri: "Lider Oto", bilgisayarAdi: "KASA-STOK01", ipAdresi: "172.16.0.3", islemciNo: "BFEBFBFF-000706E5", surum: "v4.2.0", aktivasyonZamani: "15.02.2026 08:20", sonBaglanti: "2026-03-24 11:00", durum: "Çevrimiçi" },
  { id: 6, musteri: "Lider Oto", bilgisayarAdi: "TABLET-DEPO01", ipAdresi: "172.16.0.15", islemciNo: "BFEBFBFF-000506C9", surum: "v4.0.3", aktivasyonZamani: "20.02.2026 16:00", sonBaglanti: "2026-03-22 14:20", durum: "Çevrimdışı" },
  { id: 7, musteri: "Demo Yazılım", bilgisayarAdi: "WEB-SERVER01", ipAdresi: "89.252.134.10", islemciNo: "BFEBFBFF-000B0671", surum: "v4.2.1", aktivasyonZamani: "01.03.2026 12:00", sonBaglanti: "2026-03-24 10:55", durum: "Çevrimiçi" },
  { id: 8, musteri: "Pilot Bilişim", bilgisayarAdi: "NB-GENEL01", ipAdresi: "192.168.5.8", islemciNo: "BFEBFBFF-000906ED", surum: "v4.1.2", aktivasyonZamani: "20.01.2026 13:30", sonBaglanti: "2026-03-24 09:10", durum: "Çevrimiçi" },
  { id: 9, musteri: "Doruk İnşaat", bilgisayarAdi: "MAIL-SERVER", ipAdresi: "10.10.1.2", islemciNo: "BFEBFBFF-000806EA", surum: "v4.0.5", aktivasyonZamani: "05.01.2026 10:00", sonBaglanti: "2026-03-24 07:45", durum: "Çevrimiçi" },
  { id: 10, musteri: "Nova Danışmanlık", bilgisayarAdi: "PC-DANISMA01", ipAdresi: "192.168.3.40", islemciNo: "BFEBFBFF-000706A1", surum: "v3.9.8", aktivasyonZamani: "10.11.2025 15:45", sonBaglanti: "2026-03-21 16:30", durum: "Çevrimdışı" },
  { id: 11, musteri: "Star İletişim", bilgisayarAdi: "API-SERVER", ipAdresi: "45.67.89.12", islemciNo: "BFEBFBFF-000A0653", surum: "v4.2.1", aktivasyonZamani: "15.03.2026 09:15", sonBaglanti: "2026-03-24 10:40", durum: "Çevrimiçi" },
  { id: 12, musteri: "Güneş Enerji", bilgisayarAdi: "WEB-HOST01", ipAdresi: "95.123.45.67", islemciNo: "BFEBFBFF-000806C2", surum: "v4.2.0", aktivasyonZamani: "10.03.2026 11:30", sonBaglanti: "2026-03-24 11:05", durum: "Çevrimiçi" },
];

const SURESI_YAKLASANLAR = [
  { id: 1, musteri: "Kardeşler Tic.", urun: "Başlangıç Hosting", paket: "Hosting Başlangıç - Yenileme", bitis: "2026-04-05", kalanGun: 12 },
  { id: 2, musteri: "Nova Danışmanlık", urun: "CRM Yazılımı", paket: "CRM Pro - Yenileme", bitis: "2026-04-10", kalanGun: 17 },
  { id: 3, musteri: "Akdeniz Turizm", urun: ".com.tr Alan Adı", paket: "Domain - Yenileme", bitis: "2026-04-15", kalanGun: 22 },
  { id: 4, musteri: "Bilge Eğitim", urun: "Standart SSL", paket: "SSL - Yenileme", bitis: "2026-04-18", kalanGun: 25 },
  { id: 5, musteri: "Yıldız Lojistik", urun: "Toplu SMS 5000", paket: "5000 SMS - Yenileme", bitis: "2026-03-30", kalanGun: 6 },
  { id: 6, musteri: "Ofis Plus", urun: "E-İmza Başlangıç", paket: "E-İmza - Yenileme", bitis: "2026-04-02", kalanGun: 9 },
  { id: 7, musteri: "Demo Yazılım", urun: "Wildcard SSL", paket: "Wildcard SSL - Yenileme", bitis: "2026-04-22", kalanGun: 29 },
  { id: 8, musteri: "Güneş Enerji", urun: ".com Alan Adı", paket: "Domain - Yenileme", bitis: "2026-03-28", kalanGun: 4 },
  { id: 9, musteri: "ABC Teknoloji Ltd.", urun: "Bulut Depolama 50GB", paket: "Bulut - Yenileme", bitis: "2026-03-26", kalanGun: 2 },
  { id: 10, musteri: "Star İletişim", urun: "KEP Hesabı Bireysel", paket: "KEP - Yenileme", bitis: "2026-04-20", kalanGun: 27 },
];

const SURESI_BITENLER = [
  { id: 1, musteri: "Kardeşler Tic.", urun: "Profesyonel Hosting", paket: "Hosting Pro - Yenileme", bitis: "2026-03-10", gecenGun: 14 },
  { id: 2, musteri: "Akdeniz Turizm", urun: "Kurumsal E-Posta 5GB", paket: "Business Starter - Yenileme", bitis: "2026-02-28", gecenGun: 24 },
  { id: 3, musteri: "Nova Danışmanlık", urun: ".net Alan Adı", paket: "Domain - Yenileme", bitis: "2026-03-01", gecenGun: 23 },
  { id: 4, musteri: "Doruk İnşaat", urun: "Bakım Anlaşması Temel", paket: "Bakım - Yenileme", bitis: "2026-02-15", gecenGun: 37 },
  { id: 5, musteri: "Pilot Bilişim", urun: "VPS Başlangıç", paket: "VPS - Yenileme", bitis: "2026-03-05", gecenGun: 19 },
  { id: 6, musteri: "Lider Oto", urun: ".org Alan Adı", paket: "Domain - Yenileme", bitis: "2026-01-20", gecenGun: 63 },
  { id: 7, musteri: "Bilge Eğitim", urun: "Toplu SMS 1000", paket: "SMS - Yenileme", bitis: "2026-03-15", gecenGun: 9 },
  { id: 8, musteri: "Ofis Plus", urun: "EV SSL Sertifikası", paket: "EV SSL - Yenileme", bitis: "2026-02-10", gecenGun: 42 },
];

const TAHSILATLAR = [
  { id: 1, musteri: "ABC Teknoloji Ltd.", faturaNo: "FTR-2026-0142", tutar: 2500, odemeTarihi: "2026-03-22", yontem: "Havale", durum: "Ödendi" },
  { id: 2, musteri: "Mega Holding", faturaNo: "FTR-2026-0141", tutar: 3000, odemeTarihi: "2026-03-20", yontem: "Kredi Kartı", durum: "Ödendi" },
  { id: 3, musteri: "Demo Yazılım", faturaNo: "FTR-2026-0140", tutar: 1500, odemeTarihi: "2026-03-18", yontem: "Havale", durum: "Bekliyor" },
  { id: 4, musteri: "Nova Danışmanlık", faturaNo: "FTR-2026-0139", tutar: 3500, odemeTarihi: "2026-03-15", yontem: "Kredi Kartı", durum: "Bekliyor" },
  { id: 5, musteri: "Star İletişim", faturaNo: "FTR-2026-0138", tutar: 200, odemeTarihi: "2026-03-16", yontem: "Nakit", durum: "Ödendi" },
  { id: 6, musteri: "Güneş Enerji", faturaNo: "FTR-2026-0137", tutar: 500, odemeTarihi: "2026-03-14", yontem: "Havale", durum: "Ödendi" },
  { id: 7, musteri: "Kardeşler Tic.", faturaNo: "FTR-2026-0136", tutar: 250, odemeTarihi: "2026-03-10", yontem: "Kredi Kartı", durum: "Gecikmiş" },
  { id: 8, musteri: "Lider Oto", faturaNo: "FTR-2026-0135", tutar: 1800, odemeTarihi: "2026-03-12", yontem: "Havale", durum: "Ödendi" },
  { id: 9, musteri: "Doruk İnşaat", faturaNo: "FTR-2026-0134", tutar: 120, odemeTarihi: "2026-03-10", yontem: "Kredi Kartı", durum: "Ödendi" },
  { id: 10, musteri: "Akdeniz Turizm", faturaNo: "FTR-2026-0133", tutar: 4500, odemeTarihi: "2026-03-09", yontem: "Havale", durum: "Gecikmiş" },
  { id: 11, musteri: "Bilge Eğitim", faturaNo: "FTR-2026-0132", tutar: 180, odemeTarihi: "2026-03-08", yontem: "Nakit", durum: "Ödendi" },
  { id: 12, musteri: "Yıldız Lojistik", faturaNo: "FTR-2026-0131", tutar: 350, odemeTarihi: "2026-03-07", yontem: "Havale", durum: "Ödendi" },
  { id: 13, musteri: "Ofis Plus", faturaNo: "FTR-2026-0130", tutar: 1200, odemeTarihi: "2026-03-06", yontem: "Kredi Kartı", durum: "Ödendi" },
  { id: 14, musteri: "Pilot Bilişim", faturaNo: "FTR-2026-0129", tutar: 150, odemeTarihi: "2026-03-05", yontem: "Nakit", durum: "Ödendi" },
  { id: 15, musteri: "XYZ Medya A.Ş.", faturaNo: "FTR-2026-0128", tutar: 0, odemeTarihi: "2026-03-04", yontem: "-", durum: "Ödendi" },
];

/* ============================================= */
/*  Ana Bileşen                                   */
/* ============================================= */

export default function RaporlarPage() {
  const [aktifSekme, setAktifSekme] = useState("satislar");

  return (
    <div>
      {/* ---- Sayfa Başlığı ---- */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Satış, paket, cihaz ve tahsilat raporlarını inceleyin</p>
      </div>

      {/* ---- Sekme Navigasyonu ---- */}
      <div className="flex flex-wrap gap-1 p-1 mb-6 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
        {SEKMELER.map((s) => (
          <button key={s.id} onClick={() => setAktifSekme(s.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              aktifSekme === s.id
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-white/10"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            }`}>
            {s.ikon}
            {s.etiket}
          </button>
        ))}
      </div>

      {/* ---- Sekme İçerikleri ---- */}
      {aktifSekme === "satislar" && <SatislarSekmesi />}
      {aktifSekme === "aktifPaketler" && <AktifPaketlerSekmesi />}
      {aktifSekme === "aktifCihazlar" && <AktifCihazlarSekmesi />}
      {aktifSekme === "suresiYaklasanlar" && <SuresiYaklasanlarSekmesi />}
      {aktifSekme === "suresiBitenler" && <SuresiBitenlerSekmesi />}
      {aktifSekme === "tahsilatlar" && <TahsilatlarSekmesi />}
    </div>
  );
}

/* ============================================= */
/*  Ortak Bileşenler                              */
/* ============================================= */

function OzetKart({ baslik, deger, ikon, renk }) {
  const renkler = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
    cyan: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20",
  };

  return (
    <div className={`rounded-xl border p-4 ${renkler[renk] || renkler.blue}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-center shrink-0">
          {ikon}
        </div>
        <div>
          <p className="text-xs font-medium opacity-70">{baslik}</p>
          <p className="text-lg font-bold">{deger}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Satışlar Sekmesi                              */
/* ============================================= */

function SatislarSekmesi() {
  const [arama, setArama] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const sayfaBasi = 10;

  const filtrelenmis = SATISLAR.filter((s) => {
    const aramaUygun = !arama || s.musteri.toLowerCase().includes(arama.toLowerCase()) || s.urun.toLowerCase().includes(arama.toLowerCase());
    const durumUygun = !filtreDurum || s.durum === filtreDurum;
    return aramaUygun && durumUygun;
  });

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaVeriler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const toplamCiro = SATISLAR.filter((s) => s.durum === "Tamamlandı").reduce((t, s) => t + s.tutar, 0);
  const bekleyenTutar = SATISLAR.filter((s) => s.durum === "Bekliyor").reduce((t, s) => t + s.tutar, 0);

  return (
    <div>
      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OzetKart baslik="Toplam Satış" deger={SATISLAR.length} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <OzetKart baslik="Toplam Ciro" deger={`₺${toplamCiro.toLocaleString("tr-TR")}`} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <OzetKart baslik="Bekleyen Tutar" deger={`₺${bekleyenTutar.toLocaleString("tr-TR")}`} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <OzetKart baslik="Tamamlanan" deger={SATISLAR.filter((s) => s.durum === "Tamamlandı").length} renk="violet"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>} />
      </div>

      {/* Filtre Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya ürün ara..." value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
          className={`${INPUT_STIL} !w-64`} />
        <select value={filtreDurum} onChange={(e) => { setFiltreDurum(e.target.value); setSayfa(1); }} className={`${INPUT_STIL} !w-44`}>
          <option value="">Tüm Durumlar</option>
          <option value="Tamamlandı">Tamamlandı</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="İptal">İptal</option>
        </select>
        {(arama || filtreDurum) && (
          <button onClick={() => { setArama(""); setFiltreDurum(""); setSayfa(1); }}
            className="text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 cursor-pointer">Sıfırla</button>
        )}
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Ünvanı", al: (s) => s.musteri },
          { baslik: "Ürün", al: (s) => s.urun },
          { baslik: "Paket", al: (s) => s.paket },
          { baslik: "Domain", al: (s) => s.domain || "" },
          { baslik: "Kullanıcı", al: (s) => s.kullanici || "" },
          { baslik: "Tutar", al: (s) => s.tutar },
          { baslik: "Tarih", al: (s) => s.tarih },
          { baslik: "Durum", al: (s) => s.durum },
        ], "satislar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      {/* Tablo */}
      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Ünvanı", "Ürün", "Paket", "Domain", "Kullanıcı", "Tutar", "Tarih", "Durum"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaVeriler.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white text-xs">{s.musteri}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.urun}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.paket}</td>
                  <td className="px-3 py-3 text-xs max-w-[180px]"><span className="inline-flex items-center group truncate">{s.domain ? <span className="text-blue-600 dark:text-blue-400 truncate">{s.domain}</span> : <span className="text-gray-400 dark:text-slate-600">—</span>}<KopyalaButonu metin={s.domain} /></span></td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.kullanici || "—"}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white text-xs">₺{s.tutar.toLocaleString("tr-TR")}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{s.tarih}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.durum === "Tamamlandı" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : s.durum === "Bekliyor" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}>{s.durum}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sayfalama */}
      {toplamSayfa > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}-{Math.min(sayfa * sayfaBasi, filtrelenmis.length)} arası</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa >= toplamSayfa}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  Aktif Paketler Sekmesi                        */
/* ============================================= */

function AktifPaketlerSekmesi() {
  const [arama, setArama] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const sayfaBasi = 10;

  const filtrelenmis = AKTIF_PAKETLER.filter((p) =>
    !arama || p.musteri.toLowerCase().includes(arama.toLowerCase()) || p.urun.toLowerCase().includes(arama.toLowerCase()) || p.paketAdi.toLowerCase().includes(arama.toLowerCase())
  );

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaVeriler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);
  const toplamKullanici = AKTIF_PAKETLER.reduce((t, p) => t + p.kullaniciSayisi, 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Aktif Paket" deger={AKTIF_PAKETLER.length} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        <OzetKart baslik="Toplam Kullanıcı" deger={toplamKullanici} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <OzetKart baslik="Ortalama Kalan Gün" deger={Math.round(AKTIF_PAKETLER.reduce((t, p) => t + p.kalanGun, 0) / AKTIF_PAKETLER.length)} renk="violet"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri, ürün veya paket ara..." value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
          className={`${INPUT_STIL} !w-72`} />
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (p) => p.musteri },
          { baslik: "Ürün", al: (p) => p.urun },
          { baslik: "Paket Adı", al: (p) => p.paketAdi },
          { baslik: "Başlangıç", al: (p) => p.baslangic },
          { baslik: "Bitiş", al: (p) => p.bitis },
          { baslik: "Kalan Gün", al: (p) => p.kalanGun },
          { baslik: "Kullanıcı Sayısı", al: (p) => p.kullaniciSayisi },
        ], "aktif_paketler")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Ürün", "Paket Adı", "Başlangıç", "Bitiş", "Kalan Gün", "Kullanıcı"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaVeriler.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{p.musteri}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.urun}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.paketAdi}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.baslangic}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{p.bitis}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      p.kalanGun > 180 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : p.kalanGun > 60 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}>{p.kalanGun} gün</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm text-center">{p.kullaniciSayisi || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toplamSayfa > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}-{Math.min(sayfa * sayfaBasi, filtrelenmis.length)} arası</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa >= toplamSayfa}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================= */
/*  Aktif Cihazlar Sekmesi                        */
/* ============================================= */

function AktifCihazlarSekmesi() {
  const [arama, setArama] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");

  const filtrelenmis = AKTIF_CIHAZLAR.filter((c) => {
    const aramaUygun = !arama || c.musteri.toLowerCase().includes(arama.toLowerCase()) || c.bilgisayarAdi.toLowerCase().includes(arama.toLowerCase()) || c.ipAdresi.includes(arama);
    const durumUygun = !filtreDurum || c.durum === filtreDurum;
    return aramaUygun && durumUygun;
  });

  const cevrimici = AKTIF_CIHAZLAR.filter((c) => c.durum === "Çevrimiçi").length;
  const cevrimdisi = AKTIF_CIHAZLAR.filter((c) => c.durum === "Çevrimdışı").length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Toplam Cihaz" deger={AKTIF_CIHAZLAR.length} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
        <OzetKart baslik="Çevrimiçi" deger={cevrimici} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a4 4 0 010-7.656m5.656 0a4 4 0 010 7.656" /></svg>} />
        <OzetKart baslik="Çevrimdışı" deger={cevrimdisi} renk="red"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri, bilgisayar veya IP ara..." value={arama} onChange={(e) => setArama(e.target.value)}
          className={`${INPUT_STIL} !w-64`} />
        <select value={filtreDurum} onChange={(e) => setFiltreDurum(e.target.value)} className={`${INPUT_STIL} !w-44`}>
          <option value="">Tüm Durumlar</option>
          <option value="Çevrimiçi">Çevrimiçi</option>
          <option value="Çevrimdışı">Çevrimdışı</option>
        </select>
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (c) => c.musteri },
          { baslik: "Bilgisayar Adı", al: (c) => c.bilgisayarAdi },
          { baslik: "IP Adresi", al: (c) => c.ipAdresi },
          { baslik: "İşlemci No", al: (c) => c.islemciNo },
          { baslik: "Sürüm", al: (c) => c.surum },
          { baslik: "Aktivasyon Zamanı", al: (c) => c.aktivasyonZamani },
          { baslik: "Son Bağlantı", al: (c) => c.sonBaglanti },
          { baslik: "Durum", al: (c) => c.durum },
        ], "aktif_cihazlar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Bilgisayar Adı", "IP Adresi", "İşlemci No", "Sürüm", "Aktivasyon Zamanı", "Son Bağlantı", "Durum"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtrelenmis.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white text-xs">{c.musteri}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-mono text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded">{c.bilgisayarAdi}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs font-mono"><span className="inline-flex items-center group">{c.ipAdresi}<KopyalaButonu metin={c.ipAdresi} /></span></td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs font-mono"><span className="inline-flex items-center group">{c.islemciNo}<KopyalaButonu metin={c.islemciNo} /></span></td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">{c.surum}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{c.aktivasyonZamani}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-slate-400 text-xs">{c.sonBaglanti}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.durum === "Çevrimiçi" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.durum === "Çevrimiçi" ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                      {c.durum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Süresi Yaklaşanlar Sekmesi                    */
/* ============================================= */

function SuresiYaklasanlarSekmesi() {
  const [arama, setArama] = useState("");
  const [kritikEsik, setKritikEsik] = useState(7);

  const filtrelenmis = SURESI_YAKLASANLAR.filter((s) =>
    !arama || s.musteri.toLowerCase().includes(arama.toLowerCase()) || s.urun.toLowerCase().includes(arama.toLowerCase())
  ).sort((a, b) => a.kalanGun - b.kalanGun);

  const kritik = SURESI_YAKLASANLAR.filter((s) => s.kalanGun <= kritikEsik).length;
  const uyari = SURESI_YAKLASANLAR.filter((s) => s.kalanGun > kritikEsik && s.kalanGun <= kritikEsik * 2).length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Toplam Yaklaşan" deger={SURESI_YAKLASANLAR.length} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <div className="rounded-xl border p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium opacity-70">Kritik</p>
                <select value={kritikEsik} onChange={(e) => setKritikEsik(Number(e.target.value))}
                  className="text-xs rounded-md border border-red-300 dark:border-red-500/30 bg-white dark:bg-white/10 text-red-700 dark:text-red-400 px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-400">
                  <option value={5}>≤5 gün</option>
                  <option value={7}>≤7 gün</option>
                  <option value={10}>≤10 gün</option>
                  <option value={15}>≤15 gün</option>
                  <option value={20}>≤20 gün</option>
                  <option value={30}>≤30 gün</option>
                </select>
              </div>
              <p className="text-lg font-bold">{kritik}</p>
            </div>
          </div>
        </div>
        <OzetKart baslik={`Uyarı (${kritikEsik + 1}-${kritikEsik * 2} gün)`} deger={uyari} renk="cyan"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya ürün ara..." value={arama} onChange={(e) => setArama(e.target.value)}
          className={`${INPUT_STIL} !w-64`} />
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (s) => s.musteri },
          { baslik: "Ürün", al: (s) => s.urun },
          { baslik: "Paket", al: (s) => s.paket },
          { baslik: "Bitiş Tarihi", al: (s) => s.bitis },
          { baslik: "Kalan Gün", al: (s) => s.kalanGun },
        ], "suresi_yaklasanlar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Ürün", "Paket", "Bitiş Tarihi", "Kalan Gün"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtrelenmis.map((s) => (
                <tr key={s.id} className={`transition-colors ${s.kalanGun <= kritikEsik ? "bg-red-50/50 dark:bg-red-500/[0.03]" : s.kalanGun <= kritikEsik * 2 ? "bg-amber-50/50 dark:bg-amber-500/[0.03]" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{s.musteri}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.urun}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.paket}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.bitis}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      s.kalanGun <= kritikEsik ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      : s.kalanGun <= kritikEsik * 2 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                    }`}>{s.kalanGun} gün</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Süresi Bitenler Sekmesi                       */
/* ============================================= */

function SuresiBitenlerSekmesi() {
  const [arama, setArama] = useState("");

  const filtrelenmis = SURESI_BITENLER.filter((s) =>
    !arama || s.musteri.toLowerCase().includes(arama.toLowerCase()) || s.urun.toLowerCase().includes(arama.toLowerCase())
  ).sort((a, b) => b.gecenGun - a.gecenGun);

  const toplamGecen30 = SURESI_BITENLER.filter((s) => s.gecenGun > 30).length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OzetKart baslik="Süresi Biten" deger={SURESI_BITENLER.length} renk="red"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
        <OzetKart baslik="30+ Gün Geçen" deger={toplamGecen30} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        <OzetKart baslik="Son 2 Hafta" deger={SURESI_BITENLER.filter((s) => s.gecenGun <= 14).length} renk="cyan"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya ürün ara..." value={arama} onChange={(e) => setArama(e.target.value)}
          className={`${INPUT_STIL} !w-64`} />
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (s) => s.musteri },
          { baslik: "Ürün", al: (s) => s.urun },
          { baslik: "Paket", al: (s) => s.paket },
          { baslik: "Bitiş Tarihi", al: (s) => s.bitis },
          { baslik: "Geçen Gün", al: (s) => s.gecenGun },
        ], "suresi_bitenler")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Ürün", "Paket", "Bitiş Tarihi", "Geçen Gün", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtrelenmis.map((s) => (
                <tr key={s.id} className={`transition-colors ${s.gecenGun > 30 ? "bg-red-50/50 dark:bg-red-500/[0.03]" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{s.musteri}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.urun}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.paket}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{s.bitis}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      s.gecenGun > 30 ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    }`}>{s.gecenGun} gün</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer">
                      Yenile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================= */
/*  Tahsilatlar Sekmesi                           */
/* ============================================= */

function TahsilatlarSekmesi() {
  const [arama, setArama] = useState("");
  const [filtreDurum, setFiltreDurum] = useState("");
  const [filtreYontem, setFiltreYontem] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const sayfaBasi = 10;

  const filtrelenmis = TAHSILATLAR.filter((t) => {
    const aramaUygun = !arama || t.musteri.toLowerCase().includes(arama.toLowerCase()) || t.faturaNo.toLowerCase().includes(arama.toLowerCase());
    const durumUygun = !filtreDurum || t.durum === filtreDurum;
    const yontemUygun = !filtreYontem || t.yontem === filtreYontem;
    return aramaUygun && durumUygun && yontemUygun;
  });

  const toplamSayfa = Math.ceil(filtrelenmis.length / sayfaBasi);
  const sayfaVeriler = filtrelenmis.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi);

  const odenen = TAHSILATLAR.filter((t) => t.durum === "Ödendi").reduce((t, s) => t + s.tutar, 0);
  const bekleyen = TAHSILATLAR.filter((t) => t.durum === "Bekliyor").reduce((t, s) => t + s.tutar, 0);
  const gecikmis = TAHSILATLAR.filter((t) => t.durum === "Gecikmiş").reduce((t, s) => t + s.tutar, 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OzetKart baslik="Toplam Tahsilat" deger={TAHSILATLAR.length} renk="blue"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <OzetKart baslik="Ödenen" deger={`₺${odenen.toLocaleString("tr-TR")}`} renk="emerald"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>} />
        <OzetKart baslik="Bekleyen" deger={`₺${bekleyen.toLocaleString("tr-TR")}`} renk="amber"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <OzetKart baslik="Gecikmiş" deger={`₺${gecikmis.toLocaleString("tr-TR")}`} renk="red"
          ikon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="text" placeholder="Müşteri veya fatura no ara..." value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }}
          className={`${INPUT_STIL} !w-64`} />
        <select value={filtreDurum} onChange={(e) => { setFiltreDurum(e.target.value); setSayfa(1); }} className={`${INPUT_STIL} !w-40`}>
          <option value="">Tüm Durumlar</option>
          <option value="Ödendi">Ödendi</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="Gecikmiş">Gecikmiş</option>
        </select>
        <select value={filtreYontem} onChange={(e) => { setFiltreYontem(e.target.value); setSayfa(1); }} className={`${INPUT_STIL} !w-40`}>
          <option value="">Tüm Yöntemler</option>
          <option value="Havale">Havale</option>
          <option value="Kredi Kartı">Kredi Kartı</option>
          <option value="Nakit">Nakit</option>
        </select>
        {(arama || filtreDurum || filtreYontem) && (
          <button onClick={() => { setArama(""); setFiltreDurum(""); setFiltreYontem(""); setSayfa(1); }}
            className="text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 cursor-pointer">Sıfırla</button>
        )}
        <ExcelButonu onClick={() => excelAktar(filtrelenmis, [
          { baslik: "Müşteri", al: (t) => t.musteri },
          { baslik: "Fatura No", al: (t) => t.faturaNo },
          { baslik: "Tutar", al: (t) => t.tutar },
          { baslik: "Ödeme Tarihi", al: (t) => t.odemeTarihi },
          { baslik: "Yöntem", al: (t) => t.yontem },
          { baslik: "Durum", al: (t) => t.durum },
        ], "tahsilatlar")} />
        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıt</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03]">
                {["Müşteri", "Fatura No", "Tutar", "Ödeme Tarihi", "Yöntem", "Durum"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sayfaVeriler.map((t) => (
                <tr key={t.id} className={`transition-colors ${t.durum === "Gecikmiş" ? "bg-red-50/50 dark:bg-red-500/[0.03]" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}`}>
                  <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white text-sm">{t.musteri}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center group">
                      <span className="text-sm font-mono text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">{t.faturaNo}</span>
                      <KopyalaButonu metin={t.faturaNo} />
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">₺{t.tutar.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 text-sm">{t.odemeTarihi}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      t.yontem === "Havale" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : t.yontem === "Kredi Kartı" ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"
                      : t.yontem === "Nakit" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-500"
                    }`}>{t.yontem}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      t.durum === "Ödendi" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : t.durum === "Bekliyor" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}>{t.durum}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toplamSayfa > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 dark:text-slate-400">{filtrelenmis.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}-{Math.min(sayfa * sayfaBasi, filtrelenmis.length)} arası</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setSayfa((s) => Math.max(1, s - 1))} disabled={sayfa === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Önceki</button>
            {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map((s) => (
              <button key={s} onClick={() => setSayfa(s)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  s === sayfa ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>{s}</button>
            ))}
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa, s + 1))} disabled={sayfa >= toplamSayfa}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">Sonraki</button>
          </div>
        </div>
      )}
    </div>
  );
}
