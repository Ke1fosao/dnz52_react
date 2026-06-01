import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="container py-20">
      <Spinner />
    </div>
  );
}
