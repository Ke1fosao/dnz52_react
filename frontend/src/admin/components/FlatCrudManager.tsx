import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  Field, inputCls, ImageField, FileField, IconPicker, ColorField, Toggle,
} from './FormControls';
import { ListSkeleton, EmptyBox } from './AdminUI';
import { SortableList, persistOrder } from './SortableList';
import { cn } from '@/lib/utils';
import type { AdminFlatRow } from '../types';

export interface FlatField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'number' | 'select' | 'image' | 'file' | 'icon' | 'color' | 'toggle';
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  full?: boolean;
  accept?: string;
}

interface FlatApi {
  list: () => Promise<AdminFlatRow[]>;
  create: (data: FormData | object) => Promise<AdminFlatRow>;
  update: (id: number, data: FormData | object) => Promise<AdminFlatRow>;
  remove: (id: number) => Promise<unknown>;
}

// Універсальний менеджер пласких моделей: список (з сортуванням) + інлайн-форма.
// Підтримує text/textarea/url/number/select/image/file/icon/color/toggle. order — авто.
export function FlatCrudManager({ qKey, api, fields, addLabel, titleKey, subtitleKey, extra, emptyText }: {
  qKey: string;
  api: FlatApi;
  fields: FlatField[];
  addLabel: string;
  titleKey?: string;
  subtitleKey?: string;
  extra?: Record<string, unknown>;
  emptyText?: string;
}) {
  const qc = useQueryClient();
  const key = ['admin-flat', qKey];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: api.list });
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);

  const rows = data || [];
  const imgField = fields.find(f => f.type === 'image');
  const iconField = fields.find(f => f.type === 'icon');
  const colorField = fields.find(f => f.type === 'color');
  const titleK = titleKey || (fields.find(f => f.type === 'text')?.key ?? 'title');
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const blank = (): Record<string, unknown> => {
    const b: Record<string, unknown> = { order: rows.length };
    fields.forEach(f => {
      if (f.type === 'toggle') b[f.key] = true;
      else if (f.type === 'color') b[f.key] = '#4A90E2';
      else if (f.type === 'select') b[f.key] = f.options?.[0]?.value ?? '';
      else if (f.type !== 'image' && f.type !== 'file') b[f.key] = '';
    });
    return b;
  };

  const startAdd = () => { setFiles({}); setEditing(blank()); };
  const startEdit = (row: AdminFlatRow) => { setFiles({}); setEditing({ ...row }); };
  const cancel = () => { setEditing(null); setFiles({}); };

  const save = async () => {
    if (!editing) return;
    for (const f of fields) {
      if (!f.required) continue;
      if (f.type === 'image' || f.type === 'file') {
        if (!editing.id && !files[f.key]) { toast.error(`Додайте: ${f.label}`); return; }
      } else if (!String(editing[f.key] ?? '').trim()) {
        toast.error(`Заповніть: ${f.label}`); return;
      }
    }
    setSaving(true);
    const isCreate = !editing.id;
    const base: Record<string, unknown> = { ...editing, ...(isCreate ? (extra || {}) : {}) };
    const hasUpload = fields.some(f => f.type === 'image' || f.type === 'file');
    let payload: FormData | object;
    if (hasUpload) {
      const fd = new FormData();
      Object.entries(base).forEach(([k, v]) => {
        if (k === 'id') return;
        const f = fields.find(ff => ff.key === k);
        if (f && (f.type === 'image' || f.type === 'file')) return; // керується через files
        if (v === null || v === undefined) return;
        fd.append(k, String(v));
      });
      Object.entries(files).forEach(([k, file]) => fd.append(k, file));
      payload = fd;
    } else {
      const { id: _id, ...rest } = base;
      payload = rest;
    }
    try {
      if (isCreate) await api.create(payload); else await api.update(editing.id as number, payload);
      toast.success('Збережено');
      invalidate();
      cancel();
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const remove = useMutation({ mutationFn: api.remove, onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка') });

  const handleReorder = async (next: AdminFlatRow[]) => {
    qc.setQueryData(key, next);
    try { await persistOrder(next, api.update); } catch { toast.error('Не вдалося змінити порядок'); }
    invalidate();
  };

  return (
    <div className="space-y-3">
      {!editing && (
        <button onClick={startAdd} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> {addLabel}
        </button>
      )}

      {editing && (
        <div className="premium-glass rounded-2xl p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={cn(f.full || f.type === 'textarea' ? 'sm:col-span-2' : '', f.type === 'toggle' && 'sm:col-span-2')}>
                <FlatInput
                  field={f}
                  value={editing[f.key]}
                  file={files[f.key] || null}
                  onChange={v => setEditing(s => ({ ...s!, [f.key]: v }))}
                  onPickFile={file => setFiles(s => { const n = { ...s }; if (file) n[f.key] = file; else delete n[f.key]; return n; })}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
              {saving && <Loader2 className="animate-spin" size={15} />} Зберегти
            </button>
            <button onClick={cancel} className="font-bold text-sm px-4 py-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Скасувати</button>
          </div>
        </div>
      )}

      {isLoading ? <ListSkeleton rows={3} /> : !rows.length ? <EmptyBox text={emptyText || 'Ще немає записів'} /> : (
        <SortableList items={rows} getId={r => r.id} onReorder={handleReorder} className="space-y-2">
          {(row, dnd) => {
            const inactive = row.is_active === false;
            const subtitle = subtitleKey ? String(row[subtitleKey] || '') : '';
            return (
              <div ref={dnd.setNodeRef} style={dnd.style} className={cn('premium-glass rounded-2xl p-3 flex items-center gap-3', inactive && 'opacity-60')}>
                <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 shrink-0" aria-label="Перетягнути"><GripVertical size={18} /></button>
                {imgField && typeof row[imgField.key] === 'string' && (row[imgField.key] as string)
                  ? <img src={row[imgField.key] as string} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  : colorField
                    ? <span className="w-9 h-9 rounded-lg shrink-0 grid place-items-center text-white text-sm" style={{ background: (row[colorField.key] as string) || '#4A90E2' }}>{iconField && row[iconField.key] ? <i className={`bi ${row[iconField.key]}`} /> : null}</span>
                    : iconField && row[iconField.key]
                      ? <span className="w-9 h-9 rounded-lg shrink-0 grid place-items-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-lg"><i className={`bi ${row[iconField.key]}`} /></span>
                      : null}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white truncate">{String(row[titleK] || '—')}</span>
                    {inactive && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400 uppercase">Прихований</span>}
                  </div>
                  {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{subtitle}</p>}
                </div>
                <button onClick={() => startEdit(row)} className="w-8 h-8 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={15} /></button>
                <button onClick={() => { if (window.confirm('Видалити цей запис?')) remove.mutate(row.id); }} className="w-8 h-8 grid place-items-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={15} /></button>
              </div>
            );
          }}
        </SortableList>
      )}
    </div>
  );
}

function FlatInput({ field, value, file, onChange, onPickFile }: {
  field: FlatField;
  value: unknown;
  file: File | null;
  onChange: (v: unknown) => void;
  onPickFile: (f: File | null) => void;
}) {
  const v = (value as string) ?? '';
  if (field.type === 'toggle') {
    return <Toggle checked={!!value} onChange={onChange} label={field.label} />;
  }
  if (field.type === 'image') {
    return <Field label={field.label} hint={field.hint}><ImageField url={typeof value === 'string' ? value : null} file={file} onPick={onPickFile} /></Field>;
  }
  if (field.type === 'file') {
    return <Field label={field.label} hint={field.hint}><FileField url={typeof value === 'string' ? value : null} file={file} onPick={onPickFile} accept={field.accept} /></Field>;
  }
  if (field.type === 'icon') {
    return <Field label={field.label}><IconPicker value={v} onChange={onChange} /></Field>;
  }
  if (field.type === 'color') {
    return <Field label={field.label}><ColorField value={v} onChange={onChange} /></Field>;
  }
  if (field.type === 'select') {
    return <Field label={field.label} required={field.required}>
      <select className={inputCls} value={v} onChange={e => onChange(e.target.value)}>
        {(field.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>;
  }
  if (field.type === 'textarea') {
    return <Field label={field.label} hint={field.hint} required={field.required}>
      <textarea className={`${inputCls} resize-y`} rows={3} value={v} placeholder={field.placeholder} onChange={e => onChange(e.target.value)} />
    </Field>;
  }
  return <Field label={field.label} hint={field.hint} required={field.required}>
    <input type={field.type === 'number' ? 'number' : 'text'} className={inputCls} value={v} placeholder={field.placeholder} onChange={e => onChange(e.target.value)} />
  </Field>;
}
