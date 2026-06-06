import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminNewsCategoriesApi, adminNewsTagsApi, adminGalleryCategoriesApi,
  adminDocumentCategoriesApi, adminFaqCategoriesApi,
} from '../lib/adminApi';
import { Field, inputCls, IconPicker, ColorField, OrderControls } from '../components/FormControls';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';
import { cn } from '@/lib/utils';
import type { AdminCategory } from '../types';

type CatApi = typeof adminNewsCategoriesApi;

const TABS: { key: string; label: string; api: CatApi; icon: boolean; color: boolean; order: boolean }[] = [
  { key: 'news-cat', label: 'Категорії новин', api: adminNewsCategoriesApi, icon: false, color: false, order: false },
  { key: 'news-tag', label: 'Теги новин', api: adminNewsTagsApi, icon: false, color: false, order: false },
  { key: 'gallery', label: 'Категорії галереї', api: adminGalleryCategoriesApi, icon: true, color: true, order: true },
  { key: 'docs', label: 'Категорії документів', api: adminDocumentCategoriesApi, icon: false, color: false, order: true },
  { key: 'faq', label: 'Категорії FAQ', api: adminFaqCategoriesApi, icon: true, color: true, order: true },
];

export function DirectoriesPage() {
  const [tab, setTab] = useState(0);
  const t = TABS[tab];
  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Довідники</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Категорії та теги для контенту сайту</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tb, i) => (
          <button key={tb.key} onClick={() => setTab(i)}
            className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all',
              i === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'premium-glass text-gray-600 dark:text-slate-300 hover:-translate-y-0.5')}>
            {tb.label}
          </button>
        ))}
      </div>
      <CategoryManager key={t.key} qKey={t.key} api={t.api} hasIcon={t.icon} hasColor={t.color} hasOrder={t.order} />
    </div>
  );
}

function CategoryManager({ qKey, api, hasIcon, hasColor, hasOrder }: {
  qKey: string; api: CatApi; hasIcon: boolean; hasColor: boolean; hasOrder: boolean;
}) {
  const qc = useQueryClient();
  const key = ['admin-cat', qKey];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: api.list });
  const [editing, setEditing] = useState<Partial<AdminCategory> | null>(null);

  const invalidate = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ['admin-meta'] }); };
  const save = useMutation({
    mutationFn: (cat: Partial<AdminCategory>) => (cat.id ? api.update(cat.id, cat) : api.create(cat)),
    onSuccess: () => { toast.success('Збережено'); invalidate(); setEditing(null); }, onError: () => toast.error('Помилка'),
  });
  const remove = useMutation({ mutationFn: api.remove, onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка') });

  const move = async (idx: number, dir: 'up' | 'down') => {
    if (!data) return;
    const arr = [...data];
    const j = dir === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    const updates = arr
      .map((c, i) => (c.order !== i ? api.update(c.id, { order: i }) : null))
      .filter((p): p is Promise<AdminCategory> => p !== null);
    await Promise.all(updates);
    invalidate();
  };

  const blank = (): Partial<AdminCategory> => ({
    name: '', icon: hasIcon ? 'bi-star-fill' : undefined, color: hasColor ? '#4A90E2' : undefined,
    order: hasOrder ? (data?.length || 0) : undefined,
  });

  return (
    <div className="space-y-3">
      {!editing && (
        <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Додати
        </button>
      )}
      {editing && (
        <div className="premium-glass rounded-2xl p-4 space-y-3">
          <Field label="Назва" required>
            <input className={inputCls} value={editing.name || ''} onChange={e => setEditing(s => ({ ...s!, name: e.target.value }))} autoFocus />
          </Field>
          {hasIcon && <Field label="Іконка"><IconPicker value={editing.icon || ''} onChange={v => setEditing(s => ({ ...s!, icon: v }))} /></Field>}
          {hasColor && <Field label="Колір"><ColorField value={editing.color || ''} onChange={v => setEditing(s => ({ ...s!, color: v }))} /></Field>}
          <div className="flex gap-2">
            <button onClick={() => { if (!editing.name?.trim()) { toast.error('Вкажіть назву'); return; } save.mutate(editing); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">Зберегти</button>
            <button onClick={() => setEditing(null)} className="font-bold text-sm px-4 py-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Скасувати</button>
          </div>
        </div>
      )}
      {isLoading ? <ListSkeleton rows={3} /> : !data?.length ? <EmptyBox text="Ще немає записів" /> : (
        <div className="space-y-2">
          {data.map((c, idx) => (
            <div key={c.id} className="premium-glass rounded-2xl p-3 flex items-center gap-3">
              {hasOrder && <OrderControls onUp={() => move(idx, 'up')} onDown={() => move(idx, 'down')} isFirst={idx === 0} isLast={idx === data.length - 1} />}
              {hasColor && <span className="w-6 h-6 rounded-lg shrink-0 border border-white/40 dark:border-white/10" style={{ background: c.color }} />}
              {hasIcon && c.icon && <span className="text-blue-500 text-lg w-6 text-center shrink-0"><i className={`bi ${c.icon}`} /></span>}
              <span className="font-bold text-gray-900 dark:text-white flex-1 truncate">{c.name}</span>
              <span className="text-xs text-gray-400 dark:text-slate-500 font-mono hidden sm:inline truncate max-w-[120px]">{c.slug}</span>
              <button onClick={() => setEditing(c)} className="w-8 h-8 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors" aria-label="Редагувати"><Pencil size={15} /></button>
              <button onClick={() => { if (window.confirm('Видалити цей запис?')) remove.mutate(c.id); }} className="w-8 h-8 grid place-items-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" aria-label="Видалити"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
