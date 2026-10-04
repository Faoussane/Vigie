import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../../components/Pagination";
import { api } from "../../lib/api";
import { btn, btnGhost } from "../../ui";
import type { Comment, Paginated } from "../../types";

/** Modération : tous les commentaires ou seulement les signalés ; masquer / afficher / supprimer. */
export default function AdminCommentsPage() {
  const [data, setData] = useState<Paginated<Comment> | null>(null);
  const [reported, setReported] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(
    () => api.get<Paginated<Comment>>("/comments/", { params: { page, page_size: 15, reported: reported ? 1 : undefined } }).then((r) => setData(r.data)),
    [page, reported],
  );
  useEffect(() => { load(); }, [load]);

  const hide = async (c: Comment) => { await api.post(`/comments/${c.id}/hide/`); load(); };
  const remove = async (c: Comment) => { if (confirm("Supprimer ce commentaire ?")) { await api.delete(`/comments/${c.id}/`); load(); } };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold sm:text-3xl">Commentaires</h1>
        <button onClick={() => { setReported(false); setPage(1); }} className={!reported ? btn : btnGhost}>Tous</button>
        <button onClick={() => { setReported(true); setPage(1); }} className={reported ? btn : btnGhost}>Signalés</button>
      </div>
      <ul className="space-y-2">
        {data?.results.map((c) => (
          <li key={c.id} className={`rounded-xl border p-3 text-sm ${c.is_hidden ? "bg-sunken" : "bg-surface"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <strong>{c.author}</strong> sur <Link to={`/articles/${c.article}`} className="text-brand">{c.article}</Link>
              <span className="text-muted">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
              {c.reports_count > 0 && <span className="rounded bg-danger-soft px-2 text-xs text-danger">⚑ {c.reports_count} signalement(s)</span>}
              {c.is_hidden && <span className="rounded bg-sunken px-2 text-xs">masqué</span>}
            </div>
            <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => hide(c)} className="btn btn-ghost btn-sm">{c.is_hidden ? "Afficher" : "Masquer"}</button>
              <button onClick={() => remove(c)} className="btn btn-danger btn-sm">Supprimer</button>
            </div>
          </li>
        ))}
        {data?.results.length === 0 && <p className="text-muted">Aucun commentaire.</p>}
      </ul>
      {data && <Pagination page={page} count={data.count} pageSize={15} onChange={setPage} />}
    </div>
  );
}
