import { hash } from "../lib/format";

/** Image de couverture ; sans image, un dégradé marine déterministe orné d'anneaux radar. */
export default function Cover({ src, seed, className = "" }: { src?: string | null; seed: string; className?: string }) {
  if (src) return <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />;
  const h = 185 + (hash(seed) % 80);
  const cx = 40 + (hash(seed + "x") % 120);
  return (
    <div aria-hidden className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, hsl(${h} 55% 20%), hsl(${h + 35} 55% 34%))` }}>
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" fill="none" stroke="white" strokeOpacity=".16">
        <circle cx={cx} cy="64" r="22" /><circle cx={cx} cy="64" r="44" /><circle cx={cx} cy="64" r="68" /><circle cx={cx} cy="64" r="94" />
        <circle cx={cx} cy="64" r="3" fill="white" fillOpacity=".5" stroke="none" />
      </svg>
    </div>
  );
}
