import { hash, initials } from "../lib/format";

/** Pastille d'auteur : photo ou initiales sur fond déterministe. */
export default function Avatar({ name, src, size = 28 }: { name: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (src) return <img src={src} alt="" style={style} className="rounded-full object-cover" />;
  return (
    <span
      aria-hidden
      style={{ ...style, background: `hsl(${190 + (hash(name) % 70)} 45% 32%)` }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
    >
      {initials(name)}
    </span>
  );
}
