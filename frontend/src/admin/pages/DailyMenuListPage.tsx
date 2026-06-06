import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { adminDailyMenuApi } from '../lib/adminApi';
import { MEALS, localDate } from '../lib/menuMeals';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';
import { cn } from '@/lib/utils';
import type { AdminDailyMenu } from '../types';

function monthLabel(ym: string): string {
  const s = localDate(ym + '-01').toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function DailyMenuListPage({ embedded = false }: { embedded?: boolean } = {}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-menu'], queryFn: adminDailyMenuApi.list });

  const remove = useMutation({
    mutationFn: adminDailyMenuApi.remove,
    onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-menu'] }); },
    onError: () => toast.error('Помилка'),
  });

  const duplicate = useMutation({
    mutationFn: adminDailyMenuApi.duplicateNextWeek,
    onSuccess: (m) => { toast.success(`Скопійовано на ${localDate(m.date).toLocaleDateString('uk-UA')}`); qc.invalidateQueries({ queryKey: ['admin-menu'] }); },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(detail || 'Не вдалося скопіювати');
    },
  });

  // Групування по місяцях (дані вже впорядковані -date з бекенду)
  const groups = useMemo(() => {
    const map = new Map<string, AdminDailyMenu[]>();
    (data || []).forEach(m => {
      const k = m.date.slice(0, 7);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    });
    return [...map.entries()];
  }, [data]);

  return (
    <div className="space-y-5 animate-page-fade-in">
      {!embedded && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Меню на день</h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium">Денні меню за датами (мають пріоритет над шаблоном тижня)</p>
          </div>
          <Link to="/manage/menu/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            <Plus size={18} /> Додати день
          </Link>
        </div>
      )}
      {embedded && (
        <div className="flex justify-end">
          <Link to="/manage/menu/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            <Plus size={18} /> Додати день
          </Link>
        </div>
      )}

      {isLoading ? <ListSkeleton /> : !data?.length ? (
        <EmptyBox text="Ще немає денних меню. Створіть шаблон тижня або додайте окремий день." />
      ) : (
        <div className="space-y-6">
          {groups.map(([ym, items]) => (
            <div key={ym} className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 px-1">{monthLabel(ym)}</h2>
              {items.map(m => {
                const day = localDate(m.date).getDate();
                const present = MEALS.filter(meal => (m[meal.key] || '').trim());
                return (
                  <div key={m.id} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
                    <div className={cn('w-14 h-14 rounded-2xl grid place-items-center shrink-0 text-white',
                      m.is_published ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gradient-to-br from-gray-400 to-slate-500')}>
                      <span className="text-2xl font-black leading-none">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-black text-gray-900 dark:text-white">{m.weekday_display}</h3>
                        {!m.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Чернетка</span>}
                      </div>
                      {present.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {present.map(meal => (
                            <span key={meal.key} title={m[meal.key]} className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300">
                              {meal.emoji} {meal.label}
                            </span>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400 dark:text-slate-500 italic">— порожньо —</p>}
                      {m.note && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">📝 {m.note}</p>}
                    </div>
                    <button onClick={() => duplicate.mutate(m.id)} disabled={duplicate.isPending} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-emerald-600 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0 disabled:opacity-50" title="Копіювати на наступний тиждень (+7 днів)"><CalendarPlus size={16} /></button>
                    <Link to={`/manage/menu/${m.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
                    <button onClick={() => { if (window.confirm('Видалити це меню?')) remove.mutate(m.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
