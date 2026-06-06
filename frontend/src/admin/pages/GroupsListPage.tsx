import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { adminGroupsApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';
import { SortableList, persistOrder } from '../components/SortableList';
import type { AdminGroup } from '../types';

export function GroupsListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-groups'], queryFn: adminGroupsApi.list });
  const remove = useMutation({ mutationFn: adminGroupsApi.remove, onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-groups'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); }, onError: () => toast.error('Помилка') });
  const reorder = async (next: AdminGroup[]) => {
    qc.setQueryData(['admin-groups'], next);
    try { await persistOrder(next, adminGroupsApi.update); } catch { toast.error('Помилка'); }
    qc.invalidateQueries({ queryKey: ['admin-groups'] });
  };

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Групи</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Вікові групи та їхній персонал</p>
        </div>
        <Link to="/manage/groups/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"><Plus size={18} /> Додати групу</Link>
      </div>
      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає груп" /> : (
        <SortableList items={data} getId={g => g.id} onReorder={reorder} className="space-y-3">
          {(g, dnd) => (
            <div ref={dnd.setNodeRef} style={dnd.style} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
              <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 shrink-0" aria-label="Перетягнути"><GripVertical size={18} /></button>
              {g.cover
                ? <img src={g.cover} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                : <div className="w-14 h-14 rounded-xl grid place-items-center text-white font-black shrink-0" style={{ background: g.color }}>{g.name.charAt(0)}</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  {g.age_group_display && <span className="text-xs text-gray-400 dark:text-slate-500">{g.age_group_display}</span>}
                  {!g.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Прихована</span>}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white truncate">{g.name}</h3>
                {g.motto && <p className="text-xs text-gray-400 dark:text-slate-500 italic truncate">«{g.motto}»</p>}
              </div>
              <Link to={`/manage/groups/${g.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
              <button onClick={() => { if (window.confirm('Видалити групу?')) remove.mutate(g.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
            </div>
          )}
        </SortableList>
      )}
    </div>
  );
}
