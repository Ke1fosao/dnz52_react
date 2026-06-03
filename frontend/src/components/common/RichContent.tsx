import { lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';

const RichContentInner = lazy(() => import('./RichContentInner'));

interface Props {
  content: string;
  className?: string;
}

/**
 * Рендерить контент що може бути Markdown (новий) або HTML (старий, з CKEditor).
 * Важка бібліотека react-markdown підвантажується ЛЕНИВО окремим чанком —
 * сторінка показується одразу, а контент зʼявляється за мить (зі скелетоном).
 * react-markdown санітизує вивід (безпечніше за dangerouslySetInnerHTML).
 */
export function RichContent({ content, className }: Props) {
  if (!content) return null;
  return (
    <Suspense fallback={
      <div className={cn('prose-content space-y-2.5 animate-pulse', className)}>
        <div className="h-4 w-full rounded bg-gray-200/60 dark:bg-slate-800/60" />
        <div className="h-4 w-11/12 rounded bg-gray-200/60 dark:bg-slate-800/60" />
        <div className="h-4 w-2/3 rounded bg-gray-200/60 dark:bg-slate-800/60" />
      </div>
    }>
      <RichContentInner content={content} className={className} />
    </Suspense>
  );
}
