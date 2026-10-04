import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { api, errorMessage } from "../../lib/api";
import { btn, btnGhost, card, input } from "../../ui";
import type { Paginated, Tag } from "../../types";

/** CRUD des tags. */
export default function AdminTagsPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<Tag[]>([]);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState("");

  const load = useCallback(() => api.get<Paginated<Tag>>("/tags/", { params: { page_size: 100 } }).then((r) => setItems(r.data.results)), []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setEditing(null); setName(""); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.patch(`/tags/${editing.slug}/`, { name });
      else await api.post("/tags/", { name });
      notify(editing ? "Tag modifié" : "Tag créé");
      reset(); load();
    } catch (err) { notify(errorMessage(err), "error"); }
  };
  const remove = async (t: Tag) => {
    if (!confirm(`Supprimer le tag #${t.name} ?`)) return;
    try { await api.delete(`/tags/${t.slug}/`); load(); } catch (err) { notify(errorMessage(err), "error"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Tags</h1>
      <form onSubmit={submit} className={`${card} flex flex-wrap gap-2`}>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={editing ? "Nouveau nom" : "Nouveau tag (ex. Python)"} className={`${input} max-w-xs`} />
        <button className={btn}>{editing ? "Enregistrer" : "Créer"}</button>
        {editing && <button type="button" onClick={reset} className={btnGhost}>Annuler</button>}
      </form>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <span key={t.id} className="flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-sm">
            #{t.name}
            <button onClick={() => { setEditing(t); setName(t.name); }} className="text-brand">✎</button>
            <button onClick={() => remove(t)} className="text-danger">✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}
