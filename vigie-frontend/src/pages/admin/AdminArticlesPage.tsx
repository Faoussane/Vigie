import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../components/Pagination";
import { useToast } from "../../components/Toast";
import { api, errorMessage } from "../../lib/api";
import { btn, input } from "../../ui";
import type { Article, Paginated } from "../../types";

const PAGE_SIZE = 15;
export const STATUS_LABEL: Record<string, string> = { DRAFT: "Brouillon", SCHEDULED: "Planifié", PUBLISHED: "Publié", ARCHIVED: "Archivé" };
const STATUS_STYLE: Record<string, string> = {
  DRAFT: "badge", SCHEDULED: "badge badge-warn", PUBLISHED: "badge badge-ok", ARCHIVED: "badge",
};

/** Liste de tous les articles (tous statuts) avec recherche, filtre et suppression. */
export default function AdminArticlesPage() {
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<Paginated<Article> | null>(null);
  const [text, setText] = useState(params.get("search") ?? "");
  const page = Number(params.get("page") ?? 1);

  const load = useCallback(
    () => api.get<Paginated<Article>>("/articles/", { params: { ...Object.fromEntries(params), page_size: PAGE_SIZE, ordering: "-created_at" } }).then((r) => setData(r.data)),
    [params],
  );
  useEffect(() => { load(); }, [load]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k !== "page") next.delete("page");
    setParams(next);
  };

  const remove = async (a: Article) => {
    if (!confirm(`Supprimer définitivement « ${a.title} » ?`)) return;
    try { await api.delete(`/articles/${a.slug}/`); notify("Article supprimé"); load(); }
    catch (e) { notify(errorMessage(e), "error"); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold sm:text-3xl">Articles</h1>
        <Link to="/admin/articles/new" className={btn}>+ Nouvel article</Link>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); setParam("search", text); }} className="mb-4 flex flex-wrap gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Rechercher…" className={`${input} max-w-xs`} />
        <select value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className={`${input} max-w-[10rem]`}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className={btn}>Filtrer</button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Titre</th><th>Statut</th><th>Catégorie</th><th>Vues</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {data?.results.map((a) => (
              <tr key={a.id}>
                <td><Link to={`/admin/articles/${a.slug}/edit`} className="font-medium text-brand">{a.title}</Link></td>
                <td><span className={STATUS_STYLE[a.status]}>{STATUS_LABEL[a.status]}</span></td>
                <td>{a.category?.name ?? "—"}</td>
                <td>{a.view_count}</td>
                <td>{a.published_at ? new Date(a.published_at).toLocaleDateString("fr-FR") : "—"}</td>
                <td className="space-x-2 whitespace-nowrap ">
                  <Link to={`/articles/${a.slug}`} className="text-muted hover:text-brand">Voir</Link>
                  <button onClick={() => remove(a)} className="btn btn-danger btn-sm">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.results.length === 0 && <p className="p-4 text-muted">Aucun article.</p>}
      </div>
      {data && <Pagination page={page} count={data.count} pageSize={PAGE_SIZE} onChange={(p) => setParam("page", String(p))} />}
    </div>
  );
}
