import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GripVertical, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { adminFaqItemsApi, adminFaqCategoriesApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox, SearchInput, CollapsiblePanel } from '../components/AdminUI';
import { SortableList, persistOrder } from '../components/SortableList';
import { CategoryManager } from '../components/CategoryManager';
import type { AdminFAQItem } from '../types';

export function FaqItemsListPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin-faq-items'], queryFn: adminFaqItemsApi.list });
  const remove = useMutation({
    mutationFn: adminFaqItemsApi.remove,
    onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-faq-items'] }); },
    onError: () => toast.error('Помилка'),
  });
  const reorder = async (next: AdminFAQItem[]) => {
    qc.setQueryData(['admin-faq-items'], next);
    try { await persistOrder(next, adminFaqItemsApi.update); } catch { toast.error('Помилка'); }
    qc.invalidateQueries({ queryKey: ['admin-faq-items'] });
  };

  const searching = q.trim().length > 0;
  const filtered = (data || []).filter(f => f.question.toLowerCase().includes(q.trim().toLowerCase()));

  const row = (f: AdminFAQItem, dnd?: { setNodeRef: (el: HTMLElement | null) => void; style: React.CSSProperties; handleProps: Record<string, unknown> }): ReactNode => (
    <div ref={dnd?.setNodeRef} style={dnd?.style} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
      {dnd && <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 shrink-0" aria-label="Перетягнути"><GripVertical size={18} /></button>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {f.category_name && <span className="text-xs text-gray-400 dark:text-slate-500">{f.category_name}</span>}
          {!f.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Прихована</span>}
        </div>
        <h3 className="font-black text-gray-900 dark:text-white truncate">{f.question}</h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">👍 {f.likes} · порядок: {f.order}</p>
      </div>
      <Link to={`/manage/faq/${f.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
      <button onClick={() => { if (window.confirm('Видалити це питання?')) remove.mutate(f.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
    </div>
  );

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">FAQ — відповіді</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Готові відповіді на часті запитання · перетягуйте за ⠿ для порядку</p>
        </div>
        <Link to="/manage/faq/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          <Plus size={18} /> Додати
        </Link>
      </div>

      <CollapsiblePanel title="Категорії FAQ" icon={Tags}><CategoryManager qKey="faq-cat" api={adminFaqCategoriesApi} hasIcon hasColor hasOrder /></CollapsiblePanel>

      {data && data.length > 6 && <SearchInput value={q} onChange={setQ} placeholder="Пошук питання…" />}

      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає питань-відповідей" /> : searching ? (
        !filtered.length ? <EmptyBox text="Нічого не знайдено" /> : <div className="space-y-3">{filtered.map(f => <div key={f.id}>{row(f)}</div>)}</div>
      ) : (
        <SortableList items={data} getId={f => f.id} onReorder={reorder} className="space-y-3">
          {(f, dnd) => row(f, dnd)}
        </SortableList>
      )}
    </div>
  );
}
