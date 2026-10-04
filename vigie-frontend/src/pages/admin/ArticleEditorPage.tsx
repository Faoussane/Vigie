import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useToast } from "../../components/Toast";
import { api, errorMessage } from "../../lib/api";
import { btn, btnDanger, btnGhost, card, input } from "../../ui";
import type { ArticleDetail, Category, Paginated, Source, Tag } from "../../types";

const schema = z
  .object({
    title: z.string().min(3, "3 caractères minimum").max(200),
    summary: z.string(),
    content: z.string().min(1, "Le contenu est obligatoire"),
    category: z.string(),
    status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
    published_at: z.string(),
  })
  .refine((v) => v.status !== "SCHEDULED" || v.published_at !== "", { path: ["published_at"], message: "Date requise pour un article planifié" });
type Values = z.infer<typeof schema>;

interface SourceRow { source_id: number; consulted_at: string }

const ASSIST_ACTIONS: [string, string][] = [
  ["summary", "Résumé"], ["outline", "Plan"], ["titles", "Titres"], ["tags", "Tags"], ["rewrite", "Reformuler"], ["conclusion", "Conclusion"],
];

/** datetime ISO → valeur d'un <input type="datetime-local"> (heure locale). */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/** Création / édition d'un article : champs, tags, sources, image de couverture, assistant IA. */
export default function ArticleEditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", summary: "", content: "", category: "", status: "DRAFT", published_at: "" },
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [newTag, setNewTag] = useState("");
  const [pickSource, setPickSource] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [assistAction, setAssistAction] = useState("summary");
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const status = watch("status");

  useEffect(() => {
    api.get<Category[]>("/categories/").then((r) => setCategories(r.data));
    api.get<Paginated<Tag>>("/tags/", { params: { page_size: 100 } }).then((r) => setAllTags(r.data.results));
    api.get<Paginated<Source>>("/sources/", { params: { page_size: 100 } }).then((r) => setAllSources(r.data.results));
  }, []);

  useEffect(() => {
    if (!slug) return;
    api.get<ArticleDetail>(`/articles/${slug}/`).then(({ data: a }) => {
      reset({
        title: a.title, summary: a.summary, content: a.content, category: a.category ? String(a.category.id) : "",
        status: a.status, published_at: a.published_at ? toLocalInput(a.published_at) : "",
      });
      setSelectedTags(a.tags.map((t) => t.id));
      setRows(a.article_sources.map((s) => ({ source_id: s.source.id, consulted_at: s.consulted_at })));
      setCover(a.cover_image);
    }).catch((e) => notify(errorMessage(e), "error"));
  }, [slug, reset, notify]);

  const onSubmit = async (v: Values) => {
    const payload = {
      title: v.title, summary: v.summary, content: v.content,
      category_id: v.category ? Number(v.category) : null,
      tag_ids: selectedTags, status: v.status,
      published_at: v.published_at ? new Date(v.published_at).toISOString() : null,
      article_sources: rows,
    };
    try {
      const { data } = slug
        ? await api.patch<ArticleDetail>(`/articles/${slug}/`, payload)
        : await api.post<ArticleDetail>("/articles/", payload);
      if (coverFile) {
        const fd = new FormData();
        fd.append("cover_image", coverFile);
        const r = await api.post<{ cover_image: string }>(`/articles/${data.slug}/cover/`, fd);
        setCover(r.data.cover_image);
        setCoverFile(null);
      }
      notify("Article enregistré");
      if (!slug) navigate(`/admin/articles/${data.slug}/edit`, { replace: true });
    } catch (e) { notify(errorMessage(e), "error"); }
  };

  const removeCover = async () => {
    if (!slug) return;
    await api.delete(`/articles/${slug}/cover/`);
    setCover(null);
  };

  const createTag = async () => {
    if (!newTag.trim()) return;
    try {
      const { data } = await api.post<Tag>("/tags/", { name: newTag.trim() });
      setAllTags([...allTags, data]);
      setSelectedTags([...selectedTags, data.id]);
      setNewTag("");
    } catch (e) { notify(errorMessage(e), "error"); }
  };

  const addSource = () => {
    if (!pickSource || rows.some((r) => r.source_id === Number(pickSource))) return;
    setRows([...rows, { source_id: Number(pickSource), consulted_at: new Date().toISOString().slice(0, 10) }]);
    setPickSource("");
  };

  const runAssist = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<{ result: string }>("/ai/assist/", { action: assistAction, title: getValues("title"), content: getValues("content") });
      setSuggestion(data.result);
    } catch (e) { notify(errorMessage(e), "error"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold sm:text-3xl">{slug ? "Modifier l'article" : "Nouvel article"}</h1>
        {slug && <Link to={`/articles/${slug}`} className={btnGhost}>Voir</Link>}
        <button disabled={isSubmitting} className={btn}>Enregistrer</button>
      </div>

      <div className={`${card} space-y-3`}>
        <label className="block text-sm font-medium">Titre
          <input {...register("title")} className={input} />
          {errors.title && <span className="text-danger">{errors.title.message}</span>}
        </label>
        <label className="block text-sm font-medium">Résumé <span className="font-normal text-muted">(sert de description pour Google, 120–160 caractères idéalement)</span>
          <textarea {...register("summary")} rows={2} className={input} />
        </label>
        <label className="block text-sm font-medium">Contenu
          <textarea {...register("content")} rows={14} className={`${input} font-mono`} />
          {errors.content && <span className="text-danger">{errors.content.message}</span>}
        </label>
      </div>

      <div className={`${card} grid gap-3 sm:grid-cols-3`}>
        <label className="text-sm font-medium">Catégorie
          <select {...register("category")} className={input}>
            <option value="">— aucune —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Statut
          <select {...register("status")} className={input}>
            <option value="DRAFT">Brouillon</option><option value="SCHEDULED">Planifié</option>
            <option value="PUBLISHED">Publié</option><option value="ARCHIVED">Archivé</option>
          </select>
        </label>
        <label className="text-sm font-medium">Date de publication {status === "SCHEDULED" && <span className="text-danger">*</span>}
          <input type="datetime-local" {...register("published_at")} className={input} />
          {errors.published_at && <span className="text-danger">{errors.published_at.message}</span>}
        </label>
        <p className="text-xs text-muted sm:col-span-3">
          « Publié » sans date = publié maintenant. « Planifié » = publié automatiquement à la date choisie. Brouillon et archivé restent invisibles du public.
        </p>
      </div>

      <div className={`${card} space-y-2`}>
        <h2 className="font-semibold">Tags</h2>
        <div className="flex flex-wrap gap-3">
          {allTags.map((t) => (
            <label key={t.id} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={selectedTags.includes(t.id)} onChange={(e) => setSelectedTags(e.target.checked ? [...selectedTags, t.id] : selectedTags.filter((i) => i !== t.id))} />
              #{t.name}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Nouveau tag" className={`${input} max-w-xs`} />
          <button type="button" onClick={createTag} className={btnGhost}>Créer</button>
        </div>
      </div>

      <div className={`${card} space-y-2`}>
        <h2 className="font-semibold">Sources</h2>
        {rows.map((r, i) => {
          const s = allSources.find((x) => x.id === r.source_id);
          return (
            <div key={r.source_id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-40 font-medium">{s?.name ?? `Source #${r.source_id}`}</span>
              <input type="date" value={r.consulted_at} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, consulted_at: e.target.value } : x)))} className={`${input} w-44`} />
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className={`${btnDanger} !px-2 !py-0.5`}>Retirer</button>
            </div>
          );
        })}
        <div className="flex gap-2">
          <select value={pickSource} onChange={(e) => setPickSource(e.target.value)} className={`${input} max-w-xs`}>
            <option value="">Ajouter une source…</option>
            {allSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="button" onClick={addSource} className={btnGhost}>Ajouter</button>
          <Link to="/admin/sources" className="self-center text-sm text-brand">Gérer les sources</Link>
        </div>
      </div>

      <div className={`${card} space-y-2`}>
        <h2 className="font-semibold">Image de couverture</h2>
        {cover && <img src={cover} alt="" className="max-h-48 rounded" />}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
          {cover && slug && <button type="button" onClick={removeCover} className={btnDanger}>Supprimer l'image</button>}
        </div>
        <p className="text-xs text-muted">5 Mo maximum. L'image est envoyée à l'enregistrement. Elle sert aussi d'aperçu sur les réseaux sociaux.</p>
      </div>

      <div className={`${card} space-y-2`}>
        <h2 className="font-semibold">✨ Assistant de rédaction</h2>
        <p className="text-xs text-muted">Propositions de l'IA : vous gardez la validation finale. Plan, titres, reformulation et conclusion exigent un fournisseur IA (Gemini) ; résumé et tags fonctionnent aussi en mode local.</p>
        <div className="flex flex-wrap gap-2">
          <select value={assistAction} onChange={(e) => setAssistAction(e.target.value)} className={`${input} max-w-[12rem]`}>
            {ASSIST_ACTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="button" disabled={busy} onClick={runAssist} className={btn}>{busy ? "…" : "Générer"}</button>
        </div>
        {suggestion && (
          <div className="space-y-2">
            <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={6} className={input} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnGhost} onClick={() => setValue("summary", suggestion)}>Remplacer le résumé</button>
              <button type="button" className={btnGhost} onClick={() => setValue("content", `${getValues("content")}\n\n${suggestion}`)}>Ajouter au contenu</button>
              <button type="button" className={btnGhost} onClick={() => setValue("title", suggestion.split("\n")[0].replace(/^[-*\d.\s]+/, ""))}>Première ligne → titre</button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
