import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Скелетон картки (для новин, альбомів, гуртків) */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-3xl border bg-card overflow-hidden', className)}>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/** Сітка скелетонів */
export function CardSkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const colsClass = cols === 4
    ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'md:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={cn('grid grid-cols-1 gap-6', colsClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
