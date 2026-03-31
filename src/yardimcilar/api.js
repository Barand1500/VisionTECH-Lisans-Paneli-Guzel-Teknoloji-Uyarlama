/* ============================================= */
/*  Güzel Teknoloji - API Yardımcı Fonksiyonları */
/*  Merkezi fetch helper                          */
/* ============================================= */

const API_URL = "http://localhost:5000/api";

function tokenAl() {
  return localStorage.getItem("gt_token");
}

async function apiIstek(yol, secenekler = {}) {
  const token = tokenAl();
  const basliklar = { "Content-Type": "application/json", ...secenekler.headers };
  if (token) basliklar["Authorization"] = `Bearer ${token}`;

  const yanit = await fetch(`${API_URL}${yol}`, { ...secenekler, headers: basliklar });

  /* 401 = Yetki yok → tokeni temizle ve login'e yönlendir */
  if (yanit.status === 401) {
    localStorage.removeItem("gt_token");
    localStorage.removeItem("gt_kullanici");
    window.location.href = "/login";
    throw new Error("Oturum süresi doldu.");
  }

  const veri = await yanit.json();
  if (!yanit.ok) throw new Error(veri.mesaj || "API hatası");
  return veri;
}

export function apiGet(yol) {
  return apiIstek(yol);
}

export function apiPost(yol, govde) {
  return apiIstek(yol, { method: "POST", body: JSON.stringify(govde) });
}

export function apiPut(yol, govde) {
  return apiIstek(yol, { method: "PUT", body: JSON.stringify(govde) });
}

export function apiDelete(yol) {
  return apiIstek(yol, { method: "DELETE" });
}
