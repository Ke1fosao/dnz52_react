import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Field, inputCls, IconPicker, ColorField } from './FormControls';
import { ListSkeleton, EmptyBox } from './AdminUI';
import { SortableList, persistOrder } from './SortableList';
import type { AdminCategory } from '../types';

interface CatApi {
  list: () => Promise<AdminCategory[]>;
  create: (data: object) => Promise<AdminCategory>;
  update: (id: number, data: object) => Promise<AdminCategory>;
  remove: (id: number) => Promise<unknown>;
}

// Менеджер довідника (категорії/теги): інлайн додавання/редагування/видалення,
// сортування мишкою (якщо hasOrder). Інвалідовує admin-meta, щоб дропдауни оновлювались.
export function CategoryManager({ qKey, api, hasIcon, hasColor, hasOrder }: {
  qKey: string; api: CatApi; hasIcon?: boolean; hasColor?: boolean; hasOrder?: boolean;
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

  const reorder = async (next: AdminCategory[]) => {
    qc.setQueryData(key, next);
    try { await persistOrder(next, api.update); } catch { toast.error('Помилка'); }
    invalidate();
  };

  const blank = (): Partial<AdminCategory> => ({
    name: '', icon: hasIcon ? 'bi-star-fill' : undefined, color: hasColor ? '#4A90E2' : undefined,
    order: hasOrder ? (data?.length || 0) : undefined,
  });

  const rows = data || [];

  const editForm = editing && (
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
  );

  const renderRow = (c: AdminCategory, dnd?: { setNodeRef: (el: HTMLElement | null) => void; style: React.CSSProperties; handleProps: Record<string, unknown> }) => (
    <div ref={dnd?.setNodeRef} style={dnd?.style} className="premium-glass rounded-2xl p-3 flex items-center gap-3">
      {dnd && <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 shrink-0" aria-label="Перетягнути"><GripVertical size={16} /></button>}
      {hasColor && <span className="w-6 h-6 rounded-lg shrink-0 border border-white/40 dark:border-white/10" style={{ background: c.color }} />}
      {hasIcon && c.icon && <span className="text-blue-500 text-lg w-6 text-center shrink-0"><i className={`bi ${c.icon}`} /></span>}
      <span className="font-bold text-gray-900 dark:text-white flex-1 truncate">{c.name}</span>
      <span className="text-xs text-gray-400 dark:text-slate-500 font-mono hidden sm:inline truncate max-w-[120px]">{c.slug}</span>
      <button onClick={() => setEditing(c)} className="w-8 h-8 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors" aria-label="Редагувати"><Pencil size={15} /></button>
      <button onClick={() => { if (window.confirm('Видалити цей запис?')) remove.mutate(c.id); }} className="w-8 h-8 grid place-items-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" aria-label="Видалити"><Trash2 size={15} /></button>
    </div>
  );

  return (
    <div className="space-y-3">
      {!editing && (
        <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Додати
        </button>
      )}
      {editForm}
      {isLoading ? <ListSkeleton rows={3} /> : !rows.length ? <EmptyBox text="Ще немає записів" /> : (
        hasOrder ? (
          <SortableList items={rows} getId={c => c.id} onReorder={reorder} className="space-y-2">
            {(c, dnd) => renderRow(c, dnd)}
          </SortableList>
        ) : (
          <div className="space-y-2">{rows.map(c => <div key={c.id}>{renderRow(c)}</div>)}</div>
        )
      )}
    </div>
  );
}
