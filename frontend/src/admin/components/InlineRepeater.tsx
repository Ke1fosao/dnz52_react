import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { inputCls, ImageField, IconPicker } from './FormControls';
import { SortableList, persistOrder } from './SortableList';

export type InlineFieldDef =
  | { key: string; label: string; type: 'text' | 'textarea' | 'date'; placeholder?: string; col?: string }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; col?: string }
  | { key: string; label: string; type: 'icon'; col?: string }
  | { key: string; label: string; type: 'image'; col?: string };

interface InlineChild { id: number; order?: number }

interface ChildApi<T> {
  listFor: (parentId: number) => Promise<T[]>;
  create: (data: FormData | object) => Promise<T>;
  update: (id: number, data: FormData | object) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
}

export function InlineRepeater<T extends InlineChild>({ parentId, parentKey, api, fields, addLabel, defaults, qKey }: {
  parentId: number;
  parentKey: string;
  api: ChildApi<T>;
  fields: InlineFieldDef[];
  addLabel: string;
  defaults?: Record<string, unknown>;
  qKey: string;
}) {
  const qc = useQueryClient();
  const key = ['admin-inline', qKey, parentId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.listFor(parentId) });
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const add = useMutation({
    mutationFn: () => api.create({ [parentKey]: parentId, order: data?.length || 0, ...(defaults || {}) }),
    onSuccess: invalidate,
    onError: () => toast.error('Помилка'),
  });
  const remove = useMutation({ mutationFn: api.remove, onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка') });

  const patchField = async (id: number, field: string, value: unknown, isFile = false) => {
    try {
      if (isFile) { const fd = new FormData(); fd.append(field, value as File); await api.update(id, fd); }
      else await api.update(id, { [field]: value });
      invalidate();
    } catch { toast.error('Не вдалося зберегти'); }
  };

  const rows = data || [];

  const handleReorder = async (next: T[]) => {
    qc.setQueryData(key, next);
    try { await persistOrder(next, (id, data) => api.update(id, data)); } catch { toast.error('Помилка'); }
    invalidate();
  };

  return (
    <div className="space-y-2">
      {isLoading ? <p className="text-sm text-gray-400 dark:text-slate-500">Завантаження…</p> : (
        <SortableList items={rows} getId={item => item.id} onReorder={handleReorder} className="space-y-2">
          {(item, dnd) => (
            <div ref={dnd.setNodeRef} style={dnd.style} className="premium-glass rounded-2xl p-3 flex items-start gap-2">
              <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 shrink-0 mt-1" aria-label="Перетягнути"><GripVertical size={17} /></button>
              <div className="flex-1 grid sm:grid-cols-2 gap-2.5 min-w-0">
                {fields.map(f => (
                  <div key={f.key} className={f.col}>
                    <InlineFieldInput field={f} value={(item as Record<string, unknown>)[f.key]} onCommit={(v, isFile) => patchField(item.id, f.key, v, isFile)} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => { if (window.confirm('Видалити цей запис?')) remove.mutate(item.id); }} className="w-8 h-8 grid place-items-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shrink-0 transition-colors" aria-label="Видалити"><Trash2 size={15} /></button>
            </div>
          )}
        </SortableList>
      )}
      <button type="button" onClick={() => add.mutate()} disabled={add.isPending} className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm px-4 py-2 rounded-xl text-gray-700 dark:text-slate-300 transition-colors">
        {add.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} {addLabel}
      </button>
    </div>
  );
}

function InlineFieldInput({ field, value, onCommit }: {
  field: InlineFieldDef;
  value: unknown;
  onCommit: (v: unknown, isFile?: boolean) => void;
}) {
  const label = <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">{field.label}</span>;
  const v = (value as string) || '';

  if (field.type === 'image') {
    return <div>{label}<ImageField url={typeof value === 'string' ? value : null} file={null} onPick={f => { if (f) onCommit(f, true); }} /></div>;
  }
  if (field.type === 'icon') {
    return <div>{label}<IconPicker value={v} onChange={val => onCommit(val)} /></div>;
  }
  if (field.type === 'select') {
    return <div>{label}<select className={inputCls} defaultValue={v} onChange={e => onCommit(e.target.value)}>{field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
  }
  if (field.type === 'textarea') {
    return <div>{label}<textarea className={inputCls} rows={2} defaultValue={v} placeholder={field.placeholder} onBlur={e => { if (e.target.value !== v) onCommit(e.target.value); }} /></div>;
  }
  if (field.type === 'date') {
    return <div>{label}<input type="date" className={inputCls} defaultValue={v} onChange={e => onCommit(e.target.value || null)} /></div>;
  }
  return <div>{label}<input className={inputCls} defaultValue={v} placeholder={field.placeholder} onBlur={e => { if (e.target.value !== v) onCommit(e.target.value); }} /></div>;
}
