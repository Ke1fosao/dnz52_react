import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Film, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { adminSlidersApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';
import { SortableList, persistOrder } from '../components/SortableList';
import type { AdminSlider } from '../types';

export function SlidersListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-sliders'], queryFn: adminSlidersApi.list });
  const remove = useMutation({ mutationFn: adminSlidersApi.remove, onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-sliders'] }); }, onError: () => toast.error('Помилка') });
  const reorder = async (next: AdminSlider[]) => {
    qc.setQueryData(['admin-sliders'], next);
    try { await persistOrder(next, adminSlidersApi.update); } catch { toast.error('Помилка'); }
    qc.invalidateQueries({ queryKey: ['admin-sliders'] });
  };

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Слайдер головної</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Банери на головній сторінці сайту</p>
        </div>
        <Link to="/manage/sliders/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"><Plus size={18} /> Додати слайд</Link>
      </div>
      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає слайдів" /> : (
        <SortableList items={data} getId={s => s.id} onReorder={reorder} className="space-y-3">
          {(s, dnd) => (
            <div ref={dnd.setNodeRef} style={dnd.style} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
              <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 shrink-0" aria-label="Перетягнути"><GripVertical size={18} /></button>
              {s.image
                ? <img src={s.image} alt="" className="w-24 h-14 rounded-lg object-cover shrink-0" />
                : <div className="w-24 h-14 rounded-lg bg-blue-100 dark:bg-blue-900/30 grid place-items-center text-xl shrink-0">🖼️</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  {s.video && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 inline-flex items-center gap-1"><Film size={11} /> Відео</span>}
                  {!s.is_active && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Вимкнено</span>}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white truncate">{s.title}</h3>
                {s.description && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{s.description}</p>}
              </div>
              <Link to={`/manage/sliders/${s.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
              <button onClick={() => { if (window.confirm('Видалити слайд?')) remove.mutate(s.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
            </div>
          )}
        </SortableList>
      )}
    </div>
  );
}
