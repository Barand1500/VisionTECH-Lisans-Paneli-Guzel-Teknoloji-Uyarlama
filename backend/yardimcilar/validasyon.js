/* ============================================= */
/*  Güzel Teknoloji - Validasyon Yardımcıları    */
/*  E-posta, TC Kimlik, Vergi No kontrolleri     */
/* ============================================= */

/**
 * E-posta format kontrolü
 * @param {string} eposta
 * @returns {boolean}
 */
function epostaGecerliMi(eposta) {
  if (!eposta) return true; // Boş değer kabul edilir (opsiyonel alan)
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(eposta);
}

/**
 * TC Kimlik No algoritma kontrolü
 * - 11 haneli olmalı
 * - İlk hane 0 olamaz
 * - Algoritma kontrolü yapılır
 * @param {string} tcKimlikNo
 * @returns {boolean}
 */
function tcKimlikGecerliMi(tcKimlikNo) {
  if (!tcKimlikNo) return true; // Boş değer kabul edilir (opsiyonel alan)
  
  // Sadece rakam ve 11 hane kontrolü
  if (!/^[1-9][0-9]{10}$/.test(tcKimlikNo)) return false;
  
  const haneler = tcKimlikNo.split("").map(Number);
  
  // 10. hane algoritması: ((h1+h3+h5+h7+h9)*7 - (h2+h4+h6+h8)) mod 10 = h10
  const tekler = haneler[0] + haneler[2] + haneler[4] + haneler[6] + haneler[8];
  const ciftler = haneler[1] + haneler[3] + haneler[5] + haneler[7];
  const onuncuKontrol = (tekler * 7 - ciftler) % 10;
  if (onuncuKontrol < 0 ? onuncuKontrol + 10 : onuncuKontrol !== haneler[9]) return false;
  
  // 11. hane algoritması: (h1+h2+...+h10) mod 10 = h11
  const ilkOnToplam = haneler.slice(0, 10).reduce((a, b) => a + b, 0);
  if (ilkOnToplam % 10 !== haneler[10]) return false;
  
  return true;
}

/**
 * Vergi No format kontrolü
 * - 10 veya 11 haneli olmalı (şirketler 10, şahıs şirketleri 11)
 * - Sadece rakam içermeli
 * @param {string} vergiNo
 * @returns {boolean}
 */
function vergiNoGecerliMi(vergiNo) {
  if (!vergiNo) return true; // Boş değer kabul edilir (opsiyonel alan)
  
  // Sadece rakam ve 10-11 hane kontrolü
  if (!/^[0-9]{10,11}$/.test(vergiNo)) return false;
  
  return true;
}

/**
 * Pasaport No format kontrolü
 * - Alfanumerik karakterler
 * - 6-9 karakter uzunluğunda
 * @param {string} pasaportNo
 * @returns {boolean}
 */
function pasaportNoGecerliMi(pasaportNo) {
  if (!pasaportNo) return true; // Boş değer kabul edilir
  
  // Alfanumerik ve 6-9 karakter
  if (!/^[A-Za-z0-9]{6,9}$/.test(pasaportNo)) return false;
  
  return true;
}

/**
 * Telefon numarası format kontrolü
 * - 10 haneli olmalı (başında 0 olmadan)
 * - Sadece rakam
 * @param {string} telefon
 * @returns {boolean}
 */
function telefonGecerliMi(telefon) {
  if (!telefon) return true; // Boş değer kabul edilir
  
  // Sadece rakamları al
  const temiz = telefon.replace(/\D/g, "");
  
  // 10 veya 11 hane (başında 0 olabilir)
  if (temiz.length < 10 || temiz.length > 11) return false;
  
  return true;
}

module.exports = {
  epostaGecerliMi,
  tcKimlikGecerliMi,
  vergiNoGecerliMi,
  pasaportNoGecerliMi,
  telefonGecerliMi,
};
