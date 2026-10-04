import { ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Search, Sun, User as UserIcon, Bookmark, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { useAuth } from "../store/auth";
import Avatar from "./Avatar";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";

const NAV: [string, string, boolean?][] = [
  ["/", "Accueil", true], ["/articles", "Articles"], ["/categories", "Catégories"], ["/sources", "Sources"], ["/smart-search", "Recherche IA"],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);      // menu mobile
  const [menu, setMenu] = useState(false);      // menu utilisateur
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setOpen(false); setMenu(false); }, [location.pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/articles?search=${encodeURIComponent(q)}`);
    setOpen(false);
  };
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"}`;

  const searchForm = (
    <form onSubmit={onSearch} role="search" className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un article" className="field !rounded-full !py-1.5 !pl-9 md:w-48 md:focus:w-64 md:transition-all" />
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link to="/" aria-label="Vigie, accueil"><Logo /></Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={link}>{label}</NavLink>)}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {searchForm}
          <button onClick={toggle} className="btn btn-ghost btn-icon" aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <>
              <NotificationBell />
              <div className="relative" ref={ref}>
                <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-full border bg-surface py-1 pl-1 pr-3 text-sm font-medium hover:bg-sunken" aria-expanded={menu}>
                  <Avatar name={user.username} src={user.avatar} size={28} />{user.username}<ChevronDown size={14} />
                </button>
                {menu && (
                  <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border bg-surface p-1.5 text-sm shadow-xl">
                    <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sunken"><UserIcon size={16} />Mon profil</Link>
                    <Link to="/favorites" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sunken"><Bookmark size={16} />Mes favoris</Link>
                    {user.role === "ADMIN" && <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sunken"><LayoutDashboard size={16} />Administration</Link>}
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-danger hover:bg-danger-soft"><LogOut size={16} />Se déconnecter</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Se connecter</Link>
              <Link to="/register" className="btn btn-primary">Créer un compte</Link>
            </>
          )}
        </div>

        <button className="btn btn-ghost btn-icon ml-auto md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 md:hidden">
          {searchForm}
          <nav className="mt-3 flex flex-col gap-1">
            {NAV.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={link}>{label}</NavLink>)}
            {user && <NavLink to="/favorites" className={link}>Mes favoris</NavLink>}
            {user && <NavLink to="/profile" className={link}>Mon profil</NavLink>}
            {user?.role === "ADMIN" && <NavLink to="/admin" className={link}>Administration</NavLink>}
          </nav>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={toggle} className="btn btn-ghost">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}Thème</button>
            {user ? <button onClick={logout} className="btn btn-danger"><LogOut size={16} />Se déconnecter</button> : (
              <>
                <Link to="/login" className="btn btn-ghost">Se connecter</Link>
                <Link to="/register" className="btn btn-primary">Créer un compte</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
