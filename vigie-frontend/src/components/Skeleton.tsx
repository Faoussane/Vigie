export const Skeleton = ({ className = "" }: { className?: string }) => <div className={`skeleton ${className}`} />;

/** Carte fantôme affichée pendant le chargement d'une liste d'articles. */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-surface">
      <Skeleton className="aspect-[16/9] !rounded-none" />
      <div className="space-y-3 p-4"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-11/12" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}</div>;
}
