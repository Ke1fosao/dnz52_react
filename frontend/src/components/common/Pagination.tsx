import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  const add = (p: number | '...') => pages.push(p);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 3) add('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
    if (page < totalPages - 2) add('...');
    add(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Попередня"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {pages.map((p, i) => (
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'h-10 w-10 rounded-full font-semibold text-sm transition-colors',
              p === page
                ? 'bg-gradient-primary text-white shadow-soft'
                : 'hover:bg-primary-50 hover:text-primary-700',
            )}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      ))}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Наступна"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
