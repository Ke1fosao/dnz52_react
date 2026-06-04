import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search as SearchIcon, FileText, Users, Sparkles, GraduationCap,
  Newspaper, CalendarDays, HelpCircle, Image as ImageIcon, ArrowRight, Lightbulb,
} from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { EmptyState } from '@/components/common/EmptyState';
import { useSearch } from '@/hooks/useApi';
import { stripHtml, truncate, cn } from '@/lib/utils';
import type { SearchResultType, SearchResult } from '@/types';

const TYPE_META: Record<SearchResultType, {
  icon: ReactNode;
  label: string;
  badge: string;
  to: (r: SearchResult) => string;
}> = {
  news:       { icon: <Newspaper className="h-3.5 w-3.5" />,     label: 'Новина',     badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',          to: r => `/news/${r.slug}` },
  page:       { icon: <FileText className="h-3.5 w-3.5" />,      label: 'Сторінка',   badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',         to: r => `/page/${r.slug}` },
  group:      { icon: <Users className="h-3.5 w-3.5" />,         label: 'Група',      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',  to: r => `/groups/${r.slug}` },
  circle:     { icon: <Sparkles className="h-3.5 w-3.5" />,      label: 'Гурток',     badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',      to: r => `/circles/${r.slug}` },
  specialist: { icon: <GraduationCap className="h-3.5 w-3.5" />, label: 'Спеціаліст', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',          to: r => `/specialists/${r.slug}` },
  document:   { icon: <FileText className="h-3.5 w-3.5" />,      label: 'Документ',   badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',          to: () => `/documents` },
  event:      { icon: <CalendarDays className="h-3.5 w-3.5" />,  label: 'Подія',      badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',          to: () => `/events` },
  faq:        { icon: <HelpCircle className="h-3.5 w-3.5" />,    label: 'Питання',    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',  to: () => `/faq` },
  album:      { icon: <ImageIcon className="h-3.5 w-3.5" />,     label: 'Альбом',     badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300', to: r => `/gallery/album/${r.slug}` },
};

const TYPE_ORDER = Object.keys(TYPE_META) as SearchResultType[];

// Підсвічування знайдених слів у тексті
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!text) return null;
  const uniq = [...new Set(terms.filter(t => t && t.length >= 2).map(t => t.toLowerCase()))]
    .sort((a, b) => b.length - a.length);
  if (!uniq.length) return <>{text}</>;
  const re = new RegExp(`(${uniq.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'iu');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1
        ? <mark key={i} className="bg-yellow-200/70 dark:bg-yellow-400/25 text-inherit rounded px-0.5">{part}</mark>
        : <span key={i}>{part}</span>
      ))}
    </>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const { data, isLoading } = useSearch(q);

  const [input, setInput] = useState(q);
  const [activeType, setActiveType] = useState<SearchResultType | 'all'>('all');

  // Синхронізуємо поле та фільтр коли змінюється запит (навбар / «можливо, ви мали на увазі»)
  useEffect(() => { setInput(q); setActiveType('all'); }, [q]);

  const results = data?.results ?? [];

  const counts = useMemo(() => {
    const c: Partial<Record<SearchResultType, number>> = {};
    for (const r of results) c[r.type] = (c[r.type] ?? 0) + 1;
    return c;
  }, [results]);
  const typesPresent = TYPE_ORDER.filter(t => counts[t]);
  const shown = activeType === 'all' ? results : results.filter(r => r.type === activeType);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (v) setParams({ q: v });
  };

  const termsFor = (r: SearchResult) => [...(r.matched ?? []), ...q.toLowerCase().split(/\s+/)].filter(Boolean);

  return (
    <div className="mesh-bg-gallery min-h-screen -mt-24 md:-mt-28 pt-24 md:pt-28 pb-12 animate-page-fade-in">
      <Seo title={q ? `Пошук: ${q}` : 'Пошук'} description="Пошук по сайту ЗДО №52" />
      <div className="container mx-auto px-4 max-w-4xl">
        <PageHero
          title="Пошук"
          subtitle={q ? `Результати за запитом «${q}»` : 'Шукайте новини, групи, гуртки, документи та інше'}
          icon="🔍"
          variant="soft"
        />

        {/* Поле пошуку (можна уточнити запит прямо тут) */}
        <form onSubmit={submit} className="relative mb-8">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          <input
            type="search"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Введіть запит…"
            aria-label="Пошуковий запит"
            className="w-full premium-glass rounded-full pl-14 pr-28 py-4 font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-400/70"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors"
          >
            Знайти
          </button>
        </form>

        <div className="pb-12">
          {!q || q.length < 2 ? (
            <EmptyState icon={<SearchIcon className="h-16 w-16" />} title="Введіть запит" description="Мінімум 2 символи для початку пошуку" />
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="premium-glass rounded-[1.5rem] p-5">
                  <div className="h-5 w-24 bg-gray-200/60 dark:bg-slate-700/60 rounded-full animate-pulse mb-3" />
                  <div className="h-5 w-2/3 bg-gray-200/60 dark:bg-slate-700/60 rounded-full animate-pulse mb-2.5" />
                  <div className="h-4 w-full bg-gray-200/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="space-y-5">
              {data?.suggestion && <DidYouMean suggestion={data.suggestion} onPick={() => setParams({ q: data.suggestion! })} />}
              <EmptyState icon={<SearchIcon className="h-16 w-16" />} title={`Нічого не знайдено за «${q}»`} description="Спробуйте інші слова або перевірте написання" />
            </div>
          ) : (
            <>
              {data?.suggestion && <DidYouMean suggestion={data.suggestion} onPick={() => setParams({ q: data.suggestion! })} />}

              {/* Фільтри за типом */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Chip active={activeType === 'all'} onClick={() => setActiveType('all')} label="Усі" count={results.length} />
                {typesPresent.map(t => (
                  <Chip key={t} active={activeType === t} onClick={() => setActiveType(t)} label={TYPE_META[t].label} count={counts[t]!} icon={TYPE_META[t].icon} />
                ))}
              </div>

              <div className="space-y-3">
                {shown.map((r, i) => {
                  const meta = TYPE_META[r.type];
                  const terms = termsFor(r);
                  return (
                    <Link
                      key={`${r.type}-${r.slug}-${i}`}
                      to={meta.to(r)}
                      className="group block premium-glass rounded-[1.5rem] p-5 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide', meta.badge)}>
                          {meta.icon} {meta.label}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white mb-1 leading-snug">
                        <Highlight text={r.title} terms={terms} />
                      </h3>
                      {r.excerpt && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                          <Highlight text={truncate(stripHtml(r.excerpt), 220)} terms={terms} />
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DidYouMean({ suggestion, onPick }: { suggestion: string; onPick: () => void }) {
  return (
    <div className="premium-glass rounded-2xl px-5 py-4 mb-6 flex items-center gap-2.5 flex-wrap">
      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
      <span className="text-gray-600 dark:text-slate-300 font-medium">Можливо, ви мали на увазі:</span>
      <button onClick={onPick} className="font-black text-blue-600 dark:text-blue-400 hover:underline italic">{suggestion}</button>
    </div>
  );
}

function Chip({ active, onClick, label, count, icon }: {
  active: boolean; onClick: () => void; label: string; count: number; icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all',
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
          : 'premium-glass text-gray-600 dark:text-slate-300 hover:-translate-y-0.5',
      )}
    >
      {icon}{label}
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-black', active ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400')}>
        {count}
      </span>
    </button>
  );
}
