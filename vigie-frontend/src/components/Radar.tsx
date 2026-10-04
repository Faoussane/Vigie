import { Link } from "react-router-dom";

/**
 * Radar décoratif et utile : les « échos » sont les thèmes les plus actifs,
 * cliquables pour filtrer les articles. Le balayage s'arrête si l'utilisateur
 * demande moins d'animations.
 */
export default function Radar({ items }: { items: { label: string; to: string }[] }) {
  const radii = [34, 22, 40, 28, 38, 18, 31];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md" role="group" aria-label="Thèmes en ce moment">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        <circle cx="200" cy="200" r="196" fill="var(--surface)" stroke="var(--line)" />
        {[60, 120, 180].map((r) => <circle key={r} cx="200" cy="200" r={r} stroke="var(--line)" />)}
        <path d="M200 6V394M6 200H394" stroke="var(--line)" />
        <g className="radar-sweep">
          <path d="M200 200 L200 20 A180 180 0 0 1 327.3 72.7 Z" fill="var(--brand)" fillOpacity=".14" />
          <path d="M200 200 L327.3 72.7" stroke="var(--brand)" strokeWidth="1.5" strokeOpacity=".8" />
        </g>
        <circle cx="200" cy="200" r="5" fill="var(--signal)" />
        <circle cx="200" cy="200" r="12" stroke="var(--signal)" strokeOpacity=".4" />
      </svg>
      {items.slice(0, 7).map((it, i) => {
        const angle = ((i * 360) / Math.min(items.length, 7) + 25) * (Math.PI / 180);
        const r = radii[i % radii.length];
        return (
          <Link
            key={it.to}
            to={it.to}
            style={{ left: `${50 + r * Math.cos(angle)}%`, top: `${50 + r * Math.sin(angle)}%` }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border bg-surface px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors hover:border-brand hover:text-brand"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
