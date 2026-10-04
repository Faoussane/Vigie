import { Link2 } from "lucide-react";
import { useToast } from "./Toast";

/** Partage d'un article : copie du lien, X, LinkedIn, Facebook. */
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const { notify } = useToast();
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); notify("Lien copié"); }
    catch { notify("Copie impossible : copiez l'adresse depuis la barre du navigateur.", "error"); }
  };
  const links: [string, string][] = [
    ["X", `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={copy} className="btn btn-ghost btn-sm"><Link2 size={14} />Copier le lien</button>
      {links.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer noopener" className="btn btn-ghost btn-sm">{label}</a>)}
    </div>
  );
}
