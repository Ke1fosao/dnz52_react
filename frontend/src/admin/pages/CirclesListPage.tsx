import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { adminCirclesApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';

export function CirclesListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-circles'], queryFn: adminCirclesApi.list });
  const remove = useMutation({ mutationFn: adminCirclesApi.remove, onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-circles'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); }, onError: () => toast.error('Помилка') });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Гуртки</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Гуртки та секції закладу</p>
        </div>
        <Link to="/manage/circles/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"><Plus size={18} /> Додати гурток</Link>
      </div>
      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає гуртків" /> : (
        <div className="space-y-3">
          {data.map(c => (
            <div key={c.id} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl grid place-items-center text-white text-xl shrink-0" style={{ background: c.color }}>
                <i className={`bi ${c.icon || 'bi-star'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  {c.is_featured && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 inline-flex items-center gap-1"><Star size={10} className="fill-current" /> Рекомендований</span>}
                  {!c.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Прихований</span>}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white truncate">{c.name}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{c.leader}</p>
              </div>
              <Link to={`/manage/circles/${c.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
              <button onClick={() => { if (window.confirm('Видалити гурток?')) remove.mutate(c.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
