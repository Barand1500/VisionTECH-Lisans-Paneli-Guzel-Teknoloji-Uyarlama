/* ============================================= */
/*  Güzel Teknoloji - Silme Onay Modal Bileşeni  */
/*  Silme işlemlerinde kullanıcı onayı alır       */
/* ============================================= */

import { useEffect, useRef } from "react";

export default function SilmeOnayModal({
  acik,
  kapat,
  onay,
  baslik = "Silmek istediğinizden emin misiniz?",
  mesaj = "Bu işlem geri alınamaz.",
  silButonYazisi = "Sil",
  yukleniyor = false,
}) {
  const modalRef = useRef(null);
  const ilkOdak = useRef(null);

  /* ---- ESC ile kapatma + Focus trap ---- */
  useEffect(() => {
    if (!acik) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") kapat();
    };

    document.addEventListener("keydown", handleKeyDown);
    ilkOdak.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [acik, kapat]);

  /* ---- Dışarı tıklamada kapanmasın - sadece butonlarla ---- */

  if (!acik) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Arka plan overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={kapat}
      />

      {/* Modal içeriği */}
      <div
        ref={modalRef}
        className="relative w-full max-w-sm mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-[modalGir_0.2s_ease-out]"
      >
        {/* Üst kırmızı uyarı çizgisi */}
        <div className="h-1 bg-gradient-to-r from-red-500 to-red-600" />

        <div className="p-5">
          {/* İkon + Başlık */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-11 h-11 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {baslik}
              </h3>
              <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {mesaj}
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              ref={ilkOdak}
              onClick={kapat}
              disabled={yukleniyor}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={onay}
              disabled={yukleniyor}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {yukleniyor ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Siliniyor...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                  {silButonYazisi}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
