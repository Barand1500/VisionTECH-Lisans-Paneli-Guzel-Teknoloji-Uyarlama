import { useState } from "react";

export default function KopyalaButonu({ metin }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  if (!metin || metin === "-" || metin === "—" || metin === "") return null;

  const kopyala = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(metin);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 1500);
  };

  return (
    <button
      onClick={kopyala}
      title={kopyalandi ? "Kopyalandı!" : "Kopyala"}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-all ml-1.5 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100"
    >
      {kopyalandi ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}
