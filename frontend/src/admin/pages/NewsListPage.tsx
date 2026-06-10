import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, Clock, Tags, Hash, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { adminNewsApi, adminNewsCategoriesApi, adminNewsTagsApi, adminAiApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox, SearchInput, CollapsiblePanel } from '../components/AdminUI';
import { CategoryManager } from '../components/CategoryManager';
import { formatDate, cn } from '@/lib/utils';

const STATUS_CLS: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  draft: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400',
  scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export function NewsListPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin-news'], queryFn: adminNewsApi.list });
  const remove = useMutation({
    mutationFn: adminNewsApi.remove,
    onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-news'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
    onError: () => toast.error('Помилка'),
  });
  const { data: holiday } = useQuery({ queryKey: ['admin-upcoming-holiday'], queryFn: adminAiApi.upcomingHoliday });
  const filtered = (data || []).filter(n => n.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Новини</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Створення та редагування новин</p>
        </div>
        <Link to="/manage/news/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          <Plus size={18} /> Додати новину
        </Link>
      </div>

      {holiday && (
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-lg font-black text-purple-900 dark:text-purple-100 mb-1 flex items-center gap-2">
              🎁 Скоро свято: {holiday.name}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              До свята залишилося {holiday.days_until} дн. Бажаєте підготувати привітання для батьків заздалегідь?
            </p>
          </div>
          <button
            onClick={() => nav('/manage/news/new', { state: { holidayName: holiday.name } })}
            className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-purple-500/30 flex items-center gap-2"
          >
            <Sparkles size={18} /> Згенерувати чернетку ШІ
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <CollapsiblePanel title="Категорії новин" icon={Tags}><CategoryManager qKey="news-cat" api={adminNewsCategoriesApi} /></CollapsiblePanel>
        <CollapsiblePanel title="Теги" icon={Hash}><CategoryManager qKey="news-tag" api={adminNewsTagsApi} /></CollapsiblePanel>
      </div>

      {data && data.length > 6 && <SearchInput value={q} onChange={setQ} placeholder="Пошук новини за назвою…" />}

      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає новин — натисніть «Додати новину»" /> : !filtered.length ? <EmptyBox text="Нічого не знайдено" /> : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div key={n.id} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
              {n.image
                ? <img src={n.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                : <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 grid place-items-center text-2xl shrink-0">📰</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={cn('text-[11px] font-black px-2 py-0.5 rounded-full uppercase', STATUS_CLS[n.status])}>{n.status_display}</span>
                  {n.category_name && <span className="text-xs text-gray-400 dark:text-slate-500">{n.category_name}</span>}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white truncate">{n.title}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Clock size={12} /> {formatDate(n.created_at)} · <Eye size={12} /> {n.views}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Link to={`/manage/news/${n.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors" aria-label="Редагувати"><Pencil size={16} /></Link>
                <button onClick={() => { if (window.confirm('Видалити новину?')) remove.mutate(n.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" aria-label="Видалити"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
