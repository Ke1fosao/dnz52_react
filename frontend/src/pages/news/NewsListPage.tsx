import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Newspaper, Rss, Tag as TagIcon, CalendarDays, X } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { NewsCard } from '@/components/news/NewsCard';
import { PushSubscribeButton } from '@/components/common/PushSubscribeButton';
import { useNewsList, useNewsCategories, useNewsArchive } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;
const MONTHS = ['', 'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

export function NewsListPage() {
  const { slug: categorySlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const tag = searchParams.get('tag') || undefined;
  const year = searchParams.get('year') || undefined;
  const month = searchParams.get('month') || undefined;

  const { data: categories } = useNewsCategories();
  const { data: archive } = useNewsArchive();
  const { data, isLoading } = useNewsList({
    page,
    category__slug: categorySlug,
    tags__slug: tag,
    year: year ? Number(year) : undefined,
    month: month ? Number(month) : undefined,
  });

  // Скидаємо сторінку коли змінюється будь-який фільтр
  useEffect(() => { setPage(1); }, [categorySlug, tag, year, month]);

  const currentCategory = categorySlug ? categories?.find(c => c.slug === categorySlug) : null;
  const hasArchive = !!(year && month);
  const tagName = tag ? (data?.results.flatMap(n => n.tags).find(t => t.slug === tag)?.name || tag) : '';

  const toggleArchive = (y: number, m: number) => {
    const next = new URLSearchParams(searchParams);
    if (year === String(y) && month === String(m)) { next.delete('year'); next.delete('month'); }
    else { next.set('year', String(y)); next.set('month', String(m)); }
    setSearchParams(next);
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <Seo
        title={currentCategory ? `Новини: ${currentCategory.name}` : 'Новини'}
        description="Свіжі новини, оголошення та події закладу дошкільної освіти №52"
      />
      <PageHero
        title={currentCategory ? currentCategory.name : 'Новини та події'}
        subtitle="Будьте в курсі того, що відбувається у нашому садочку"
        icon="📰"
      >
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PushSubscribeButton />
          <a href="/rss/" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 px-4 py-2.5 rounded-full transition-colors">
            <Rss size={16} /> RSS-стрічка
          </a>
        </div>
      </PageHero>

      {/* Капсули-фільтри категорій */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2.5 md:gap-3 mb-5">
          <FilterPill label="Усі новини" active={!categorySlug} onClick={() => navigate('/news')} />
          {categories.map(cat => (
            <FilterPill key={cat.id} label={cat.name} active={categorySlug === cat.slug} onClick={() => navigate(`/news/category/${cat.slug}`)} />
          ))}
        </div>
      )}

      {/* Архів за місяцями */}
      {archive && archive.length > 0 && (
        <div className="flex items-center gap-2 mb-5 overflow-x-auto hide-scrollbar pb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-gray-400 dark:text-slate-500 shrink-0">
            <CalendarDays size={14} /> Архів:
          </span>
          {archive.map(a => {
            const active = year === String(a.year) && month === String(a.month);
            return (
              <button key={`${a.year}-${a.month}`} onClick={() => toggleArchive(a.year, a.month)}
                className={cn('shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors',
                  active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500')}>
                {MONTHS[a.month]} {a.year} <span className="opacity-60">· {a.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Активний фільтр (тег / архів) */}
      {(tag || hasArchive) && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Фільтр:</span>
          {tag && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
              <TagIcon size={13} /> #{tagName}
            </span>
          )}
          {hasArchive && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
              <CalendarDays size={13} /> {MONTHS[Number(month)]} {year}
            </span>
          )}
          <button onClick={() => navigate('/news')} className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <X size={14} /> Очистити
          </button>
        </div>
      )}

      <div className="pb-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[16/11] rounded-3xl bg-gray-200/60 dark:bg-slate-800/60 animate-pulse mb-4" />
                <div className="h-5 w-2/3 bg-gray-200/60 dark:bg-slate-800/60 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : !data || data.results.length === 0 ? (
          <EmptyState icon={<Newspaper className="h-12 w-12" />} title="Новин не знайдено"
            description={tag || hasArchive ? 'За обраним фільтром новин немає — спробуйте інший' : 'Заходьте пізніше — ми регулярно публікуємо новини про життя садочка'} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {data.results.map(item => <NewsCard key={item.id} item={item} />)}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.count} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      'px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 border shadow-sm hover:-translate-y-1',
      active
        ? 'bg-blue-500 border-blue-500 text-white shadow-blue-500/25'
        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500',
    )}>
      {label}
    </button>
  );
}
