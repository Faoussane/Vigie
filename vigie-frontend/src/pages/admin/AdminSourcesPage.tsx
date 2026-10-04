import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { api, errorMessage } from "../../lib/api";
import { btn, btnGhost, card, input } from "../../ui";
import type { Category, Paginated, Source } from "../../types";

const TYPES: [string, string][] = [
  ["WEBSITE", "Site web"], ["BLOG", "Blog"], ["DOCS", "Documentation"], ["GITHUB", "GitHub"],
  ["YOUTUBE", "YouTube"], ["PODCAST", "Podcast"], ["SOCIAL", "Réseau social"], ["PAPER", "Article scientifique"],
];

const EMPTY = { name: "", url: "", source_type: "BLOG", category: "", feed_url: "", check_frequency_minutes: "", is_active: true };

/** CRUD des sources, avec les champs de collecte automatique (flux RSS, fréquence). */
export default function AdminSourcesPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Source | null>(null);
  const [collecting, setCollecting] = useState<number | null>(null);

  const load = useCallback(() => api.get<Paginated<Source>>("/sources/", { params: { page_size: 100 } }).then((r) => setItems(r.data.results)), []);
  useEffect(() => { load(); api.get<Category[]>("/categories/").then((r) => setCategories(r.data)); }, [load]);

  const reset = () => { setEditing(null); setForm(EMPTY); };
  const edit = (s: Source) => {
    setEditing(s);
    setForm({
      name: s.name, url: s.url, source_type: s.source_type, category: s.category ? String(s.category) : "",
      feed_url: s.feed_url, check_frequency_minutes: s.check_frequency_minutes ? String(s.check_frequency_minutes) : "", is_active: s.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      category: form.category ? Number(form.category) : null,
      check_frequency_minutes: form.check_frequency_minutes ? Number(form.check_frequency_minutes) : null,
    };
    try {
      if (editing) await api.patch(`/sources/${editing.id}/`, payload);
      else await api.post("/sources/", payload);
      notify(editing ? "Source modifiée" : "Source créée");
      reset(); load();
    } catch (err) { notify(errorMessage(err), "error"); }
  };

  const remove = async (s: Source) => {
    if (!confirm(`Supprimer la source « ${s.name} » ? Ses éléments de veille seront supprimés aussi.`)) return;
    try { await api.delete(`/sources/${s.id}/`); load(); } catch (err) { notify(errorMessage(err), "error"); }
  };

  const collect = async (s: Source) => {
    setCollecting(s.id);
    try {
      const r = await api.post<{ new_items?: number }>(`/sources/${s.id}/collect/`);
      notify(r.data?.new_items !== undefined ? `${r.data.new_items} nouvel(s) élément(s) collecté(s)` : "Collecte lancée (traitée par le worker Celery)");
    } catch (err) { notify(errorMessage(err), "error"); }
    finally { setCollecting(null); }
  };

  const set = (k: keyof typeof EMPTY, v: string | boolean) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Sources</h1>

      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h2 className="font-semibold">{editing ? `Modifier « ${editing.name} »` : "Nouvelle source"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Nom (ex. React Blog)" className={input} />
          <input value={form.url} onChange={(e) => set("url", e.target.value)} required type="url" placeholder="URL du site (https://…)" className={input} />
          <select value={form.source_type} onChange={(e) => set("source_type", e.target.value)} className={input}>{TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={input}>
            <option value="">Catégorie (facultative)</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <fieldset className="space-y-3 rounded-lg bg-sunken p-3">
          <legend className="px-1 text-sm font-semibold">Collecte automatique (facultatif)</legend>
          <label className="block text-sm">Flux RSS
            <input value={form.feed_url} onChange={(e) => set("feed_url", e.target.value)} type="url" placeholder="https://exemple.com/feed.xml" className={input} />
          </label>
          <label className="block text-sm">Fréquence de vérification (minutes)
            <input value={form.check_frequency_minutes} onChange={(e) => set("check_frequency_minutes", e.target.value)} type="number" min={5} placeholder="60 par défaut" className={`${input} max-w-[12rem]`} />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Source active</label>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer font-medium">Comment trouver l'adresse du flux RSS ?</summary>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Cherchez l'icône RSS sur le site, ou essayez <code>/feed</code>, <code>/rss</code>, <code>/feed.xml</code>, <code>/atom.xml</code>.</li>
              <li>Code source de la page : cherchez <code>application/rss+xml</code> ou <code>application/atom+xml</code>.</li>
              <li>GitHub (versions) : <code>https://github.com/ORG/REPO/releases.atom</code></li>
              <li>YouTube : <code>https://www.youtube.com/feeds/videos.xml?channel_id=ID_DE_LA_CHAINE</code></li>
              <li>Sans flux RSS, la source reste utilisable comme référence dans les articles, mais n'est pas collectée.</li>
              <li>Fréquence vide = toutes les 60 minutes. La collecte exige un worker Celery (ou <code>CELERY_EAGER=True</code> en dev) ; sinon utilisez « Collecter maintenant ».</li>
            </ul>
          </details>
        </fieldset>
        <div className="flex gap-2"><button className={btn}>{editing ? "Enregistrer" : "Créer la source"}</button>{editing && <button type="button" onClick={reset} className={btnGhost}>Annuler</button>}</div>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Nom</th><th>Type</th><th>Flux RSS</th><th>Fréq.</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td><a href={s.url} target="_blank" rel="noreferrer noopener" className="font-medium text-brand">{s.name}</a></td>
                <td>{s.source_type}</td>
                <td className="max-w-[14rem] truncate text-muted" title={s.feed_url}>{s.feed_url || "—"}</td>
                <td>{s.check_frequency_minutes ?? (s.feed_url ? "60" : "—")}</td>
                <td>{s.is_active ? "✔" : "—"}</td>
                <td className="space-x-2 whitespace-nowrap ">
                  {s.feed_url && <button disabled={collecting === s.id} onClick={() => collect(s)} className="btn btn-ghost btn-sm">{collecting === s.id ? "…" : "Collecter maintenant"}</button>}
                  <button onClick={() => edit(s)} className="text-brand">Modifier</button>
                  <button onClick={() => remove(s)} className="btn btn-danger btn-sm">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
