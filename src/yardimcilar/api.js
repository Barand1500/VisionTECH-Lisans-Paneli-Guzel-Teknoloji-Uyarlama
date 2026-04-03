/* ============================================= */
/*  Güzel Teknoloji - API Yardımcı Fonksiyonları */
/*  Merkezi fetch helper                          */
/* ============================================= */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

function tokenAl() {
  return localStorage.getItem("gt_token");
}

async function apiIstek(yol, secenekler = {}) {
  const token = tokenAl();
  const basliklar = { "Content-Type": "application/json", ...secenekler.headers };
  if (token) basliklar["Authorization"] = `Bearer ${token}`;

  const yanit = await fetch(`${API_URL}${yol}`, { ...secenekler, headers: basliklar });

  /* 401 = Yetki yok → tokeni temizle ve login'e yönlendir (giris istekleri hariç) */
  if (yanit.status === 401 && !yol.includes("/yetki/giris")) {
    localStorage.removeItem("gt_token");
    localStorage.removeItem("gt_kullanici");
    window.location.href = "/login";
    throw new Error("Oturum süresi doldu.");
  }

  const veri = await yanit.json();
  if (!yanit.ok) {
    console.error(`API Hatası [${yol}]:`, veri);
    throw new Error(veri.mesaj || `Sunucu hatası: ${yanit.status}`);
  }
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

export async function apiUpload(yol, formData) {
  const token = tokenAl();
  const basliklar = {};
  if (token) basliklar["Authorization"] = `Bearer ${token}`;

  const yanit = await fetch(`${API_URL}${yol}`, {
    method: "POST",
    headers: basliklar,
    body: formData,
  });

  if (yanit.status === 401 && !yol.includes("/yetki/giris")) {
    localStorage.removeItem("gt_token");
    localStorage.removeItem("gt_kullanici");
    window.location.href = "/login";
    throw new Error("Oturum süresi doldu.");
  }

  const veri = await yanit.json();
  if (!yanit.ok) {
    console.error(`API Upload Hatası [${yol}]:`, veri);
    throw new Error(veri.mesaj || `Sunucu hatası: ${yanit.status}`);
  }
  return veri;
}
