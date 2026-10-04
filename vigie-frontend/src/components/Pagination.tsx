import { ChevronLeft, ChevronRight } from "lucide-react";

/** Pagination : ``page`` commence à 1. */
export default function Pagination({ page, count, pageSize, onChange }: { page: number; count: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-sm">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} />Précédent</button>
      <span className="text-muted">Page {page} sur {pages}</span>
      <button className="btn btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>Suivant<ChevronRight size={16} /></button>
    </nav>
  );
}
