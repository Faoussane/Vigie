import Logo from "./Logo";

/** Gabarit des pages de connexion / inscription : panneau marque + formulaire. */
export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border bg-surface md:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0b2239] p-9 text-white md:flex">
        <svg viewBox="0 0 400 400" className="absolute -bottom-24 -right-24 h-[26rem] w-[26rem]" fill="none" stroke="white" strokeOpacity=".14" aria-hidden>
          {[60, 120, 180, 240].map((r) => <circle key={r} cx="200" cy="200" r={r} />)}
          <path d="M200 200 L330 60" strokeOpacity=".4" /><circle cx="200" cy="200" r="5" fill="#ff6b78" stroke="none" />
        </svg>
        <Logo light className="relative text-white" />
        <p className="relative font-serif text-2xl leading-snug">Suivre ce qui change, sans courir après chaque annonce.</p>
      </div>
      <div className="p-7 sm:p-10">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
