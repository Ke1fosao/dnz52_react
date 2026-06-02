import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, FileText, Users, Sparkles, GraduationCap, Newspaper } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useSearch } from '@/hooks/useApi';
import { stripHtml, truncate } from '@/lib/utils';
import type { SearchResultType } from '@/types';

const TYPE_META: Record<SearchResultType, {
  icon: React.ReactNode;
  label: string;
  pathPrefix: (slug: string) => string;
}> = {
  news: { icon: <Newspaper className="h-4 w-4" />, label: 'Новина', pathPrefix: s => `/news/${s}` },
  page: { icon: <FileText className="h-4 w-4" />, label: 'Сторінка', pathPrefix: s => `/page/${s}` },
  group: { icon: <Users className="h-4 w-4" />, label: 'Група', pathPrefix: s => `/groups/${s}` },
  circle: { icon: <Sparkles className="h-4 w-4" />, label: 'Гурток', pathPrefix: s => `/circles/${s}` },
  specialist: { icon: <GraduationCap className="h-4 w-4" />, label: 'Спеціаліст', pathPrefix: s => `/specialists/${s}` },
  document: { icon: <FileText className="h-4 w-4" />, label: 'Документ', pathPrefix: () => `/documents` },
};

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { data, isLoading } = useSearch(q);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <Seo title={`Пошук: ${q}`} />
      <PageHero title="Пошук" subtitle={q ? `Результати за запитом «${q}»` : 'Введіть запит для пошуку'} icon="🔍" variant="soft" />

      <div className="pb-12">
        {!q || q.length < 2 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title="Введіть запит" description="Мінімум 2 символи для початку пошуку" />
        ) : isLoading ? (
          <Spinner />
        ) : !data || data.results.length === 0 ? (
          <EmptyState icon={<SearchIcon className="h-16 w-16" />} title="Нічого не знайдено" description="Спробуйте інший запит або перевірте написання" />
        ) : (
          <>
            <p className="text-sm text-gray-400 dark:text-slate-500 font-medium mb-6 px-1">
              Знайдено результатів: <strong className="text-gray-700 dark:text-slate-300">{data.count}</strong>
            </p>
            <div className="space-y-3">
              {data.results.map((result, i) => {
                const meta = TYPE_META[result.type];
                return (
                  <Link key={`${result.type}-${result.slug}-${i}`} to={meta.pathPrefix(result.slug)}
                    className="block bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-black px-3 py-1 rounded-full mb-2 uppercase tracking-wide">
                      {meta.icon} {meta.label}
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white mb-1">{result.title}</h3>
                    {result.excerpt && <p className="text-sm text-gray-500 dark:text-slate-400">{truncate(stripHtml(result.excerpt), 200)}</p>}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
