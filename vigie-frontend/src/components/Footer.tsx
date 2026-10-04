import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">Veille technologique sourcée : IA, web, cybersécurité, cloud et DevOps.</p>
        </div>
        <nav aria-label="Explorer" className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">Explorer</span>
          <Link to="/articles" className="text-muted hover:text-brand">Articles</Link>
          <Link to="/categories" className="text-muted hover:text-brand">Catégories</Link>
          <Link to="/sources" className="text-muted hover:text-brand">Sources</Link>
          <Link to="/about" className="text-muted hover:text-brand">À propos</Link>
        </nav>
        <nav aria-label="Suivre" className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">Suivre</span>
          <a href="/feed.xml" className="text-muted hover:text-brand">Flux RSS</a>
          <a href="/sitemap.xml" className="text-muted hover:text-brand">Plan du site</a>
        </nav>
      </div>
      <p className="border-t py-4 text-center text-xs text-muted">© {new Date().getFullYear()} Vigie</p>
    </footer>
  );
}
