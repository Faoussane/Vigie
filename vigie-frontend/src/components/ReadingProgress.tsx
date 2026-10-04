import { useEffect, useState } from "react";

/** Fine barre de progression de lecture en haut de l'écran. */
export default function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? h.scrollTop / max : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return <div aria-hidden className="fixed left-0 top-0 z-[60] h-0.5 bg-signal" style={{ width: `${p * 100}%` }} />;
}
