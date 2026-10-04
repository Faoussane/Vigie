import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import { api, errorMessage } from "../../lib/api";
import { btn, btnGhost, card, input } from "../../ui";
import type { Category } from "../../types";

/** CRUD des catégories. */
export default function AdminCategoriesPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(() => api.get<Category[]>("/categories/").then((r) => setItems(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setEditing(null); setName(""); setDescription(""); };
  const edit = (c: Category) => { setEditing(c); setName(c.name); setDescription(c.description); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.patch(`/categories/${editing.slug}/`, { name, description });
      else await api.post("/categories/", { name, description });
      notify(editing ? "Catégorie modifiée" : "Catégorie créée");
      reset(); load();
    } catch (err) { notify(errorMessage(err), "error"); }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Supprimer « ${c.name} » ? Ses articles resteront sans catégorie.`)) return;
    try { await api.delete(`/categories/${c.slug}/`); load(); } catch (err) { notify(errorMessage(err), "error"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Catégories</h1>
      <form onSubmit={submit} className={`${card} space-y-2`}>
        <h2 className="font-semibold">{editing ? `Modifier « ${editing.name} »` : "Nouvelle catégorie"}</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nom" className={input} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (facultative)" className={input} />
        <div className="flex gap-2"><button className={btn}>{editing ? "Enregistrer" : "Créer"}</button>{editing && <button type="button" onClick={reset} className={btnGhost}>Annuler</button>}</div>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Nom</th><th>Slug</th><th>Articles publiés</th><th></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td><td className="text-muted">{c.slug}</td><td>{c.articles_count ?? 0}</td>
                <td className="space-x-2 whitespace-nowrap ">
                  <button onClick={() => edit(c)} className="text-brand">Modifier</button>
                  <button onClick={() => remove(c)} className="btn btn-danger btn-sm">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
