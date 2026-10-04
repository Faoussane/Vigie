import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type Kind = "success" | "error";
interface ToastItem { id: number; kind: Kind; text: string }

const Ctx = createContext<{ notify: (text: string, kind?: Kind) => void }>({ notify: () => {} });

/** Accès aux notifications éphémères : ``const { notify } = useToast()``. */
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const notify = useCallback((text: string, kind: Kind = "success") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className={`flex items-start gap-2 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lg ${t.kind === "error" ? "border-danger/50" : "border-ok/50"}`}>
            {t.kind === "error" ? <XCircle size={18} className="mt-0.5 shrink-0 text-danger" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
