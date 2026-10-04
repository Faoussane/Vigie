/** Logo : un écho radar (anneaux + point d'alerte). */
export default function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" opacity=".35" />
        <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="2" opacity=".6" />
        <path d="M16 16 L27 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3" fill="var(--signal)" />
      </svg>
      <span className={`text-xl ${light ? "text-white" : ""}`}>Vigie</span>
    </span>
  );
}
