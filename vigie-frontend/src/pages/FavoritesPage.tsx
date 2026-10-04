import { useCallback, useEffect, useState } from "react";
import ArticleCard from "../components/ArticleCard";
import Seo from "../components/Seo";
import { useToast } from "../components/Toast";
import { api, errorMessage } from "../lib/api";
import { btn, btnDanger, btnGhost, input } from "../ui";
import type { Collection, Favorite, Paginated } from "../types";

/** Favoris, rangés en collections (« Intelligence artificielle », « React »…). */
export default function FavoritesPage() {
  const { notify } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [name, setName] = useState("");

  const loadCollections = useCallback(() => api.get<Collection[]>("/collections/").then((r) => setCollections(r.data)), []);
  const loadFavorites = useCallback(
    () => api.get<Paginated<Favorite>>("/favorites/", { params: { collection: active ?? undefined, page_size: 50 } }).then((r) => setFavorites(r.data.results)),
    [active],
  );
  useEffect(() => { loadCollections(); }, [loadCollections]);
  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/collections/", { name });
      setName("");
      loadCollections();
    } catch (err) { notify(errorMessage(err), "error"); }
  };
  const removeCollection = async (c: Collection) => {
    if (!confirm(`Supprimer la collection « ${c.name} » ? (les articles restent dans vos favoris)`)) return;
    await api.delete(`/collections/${c.id}/`);
    setActive(null);
    loadCollections();
  };
  const unfavorite = async (slug: string) => { await api.post(`/articles/${slug}/favorite/`); loadFavorites(); loadCollections(); };

  return (
    <div>
      <Seo title="Mes favoris" noindex />
      <h1 className="mb-4 text-2xl font-bold">Mes favoris</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setActive(null)} className={active === null ? btn : btnGhost}>Tous</button>
        {collections.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)} className={active === c.id ? btn : btnGhost}>📁 {c.name} ({c.favorites_count})</button>
        ))}
        <form onSubmit={create} className="ml-auto flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nouvelle collection" className={`${input} w-44`} />
          <button className={btn}>Créer</button>
        </form>
      </div>
      {active !== null && <button onClick={() => removeCollection(collections.find((c) => c.id === active)!)} className={`${btnDanger} mb-4`}>Supprimer cette collection</button>}
      {favorites.length === 0 && <p className="text-muted">Aucun favori ici. Sauvegardez des articles depuis leur page.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((f) => (
          <div key={f.id}>
            <ArticleCard article={f.article} />
            <button onClick={() => unfavorite(f.article.slug)} className="mt-2 text-xs text-muted hover:text-danger">Retirer des favoris</button>
          </div>
        ))}
      </div>
    </div>
  );
}
