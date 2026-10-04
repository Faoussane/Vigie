import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import type { NotificationItem, Paginated } from "../types";

/** Cloche de notifications : compteur interrogé toutes les 60 s (V2). */
export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => api.get<{ count: number }>("/notifications/unread_count/").then((r) => setCount(r.data.count)).catch(() => {}), []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggle = async () => {
    if (!open) {
      const r = await api.get<Paginated<NotificationItem>>("/notifications/");
      setItems(r.data.results);
      if (count > 0) { await api.post("/notifications/read_all/"); setCount(0); }
    }
    setOpen(!open);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label={`Notifications${count ? ` (${count} non lues)` : ""}`} className="btn btn-ghost btn-icon relative">
        <Bell size={18} />
        {count > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-signal px-1 text-center text-[10px] font-bold leading-4 text-white">{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border bg-surface p-2 shadow-xl">
          <p className="px-2 py-1 text-sm font-semibold">Notifications</p>
          {items.length === 0 && <p className="px-2 py-4 text-sm text-muted">Rien de nouveau. Suivez des catégories dans votre profil pour être prévenu des nouvelles publications.</p>}
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link to={n.link || "/"} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 text-sm hover:bg-sunken">
                  {n.message}<span className="block text-xs text-muted">{timeAgo(n.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
