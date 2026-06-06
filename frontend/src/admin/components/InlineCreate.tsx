import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { inputCls } from './FormControls';
import { cn } from '@/lib/utils';

interface IdName { id: number; name: string }
interface CreateApi { create: (data: object) => Promise<IdName> }

// Select із можливістю одразу створити нову опцію (категорію). Оновлює admin-meta.
export function InlineCreateSelect({ value, onChange, options, placeholder, createApi }: {
  value: string;
  onChange: (v: string) => void;
  options: IdName[];
  placeholder?: string;
  createApi: CreateApi;
}) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const c = await createApi.create({ name: name.trim() });
      await qc.invalidateQueries({ queryKey: ['admin-meta'] });
      onChange(String(c.id));
      setName(''); setAdding(false);
      toast.success('Категорію додано');
    } catch { toast.error('Не вдалося додати'); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex gap-2">
        <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">{placeholder || '— не вказано —'}</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <button type="button" onClick={() => setAdding(a => !a)} title="Створити нову" className="px-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 text-blue-600 hover:bg-white dark:hover:bg-slate-700 shrink-0 transition-colors"><Plus size={16} /></button>
      </div>
      {adding && (
        <div className="flex gap-2 mt-2">
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Назва нової категорії" autoFocus
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); create(); } }} />
          <button type="button" onClick={create} disabled={busy} className="px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shrink-0 inline-flex items-center gap-1 transition-colors">{busy ? <Loader2 className="animate-spin" size={15} /> : 'Додати'}</button>
        </div>
      )}
    </div>
  );
}

// Теги-пігулки з можливістю створити новий тег і одразу його вибрати.
export function InlineCreateTags({ all, selected, onChange, createApi }: {
  all: IdName[];
  selected: number[];
  onChange: (ids: number[]) => void;
  createApi: CreateApi;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const t = await createApi.create({ name: name.trim() });
      await qc.invalidateQueries({ queryKey: ['admin-meta'] });
      onChange([...selected, t.id]);
      setName('');
      toast.success('Тег додано');
    } catch { toast.error('Не вдалося додати'); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      {all.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {all.map(t => {
            const on = selected.includes(t.id);
            return (
              <button type="button" key={t.id} onClick={() => onChange(on ? selected.filter(x => x !== t.id) : [...selected, t.id])}
                className={cn('px-3 py-1.5 rounded-full text-sm font-bold transition-colors',
                  on ? 'bg-blue-600 text-white' : 'bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700')}>
                {t.name}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Новий тег…"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} disabled={busy} className="px-4 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 text-blue-600 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm shrink-0 inline-flex items-center gap-1 transition-colors">{busy ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} Тег</button>
      </div>
    </div>
  );
}
