import { FileText, Folder, LayoutDashboard, MessageSquare, Radar, Rss, Tag, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const LINKS = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/articles", label: "Articles", icon: FileText },
  { to: "/admin/veille", label: "Ma veille", icon: Radar },
  { to: "/admin/sources", label: "Sources", icon: Rss },
  { to: "/admin/categories", label: "Catégories", icon: Folder },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/comments", label: "Commentaires", icon: MessageSquare },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
];

/** Gabarit de l'administration : menu latéral (défilant sur mobile) + contenu. */
export default function AdminLayout() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:sticky lg:top-20 lg:h-fit lg:w-56 lg:shrink-0">
        <nav aria-label="Administration" className="flex gap-1 overflow-x-auto rounded-2xl border bg-surface p-1.5 lg:flex-col">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-brand text-brand-ink" : "text-muted hover:bg-sunken hover:text-ink"}`}
            >
              <Icon size={17} />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1"><Outlet /></section>
    </div>
  );
}
