import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Pencil, ImagePlus, X, ArrowLeft, Save, Trash2, Loader2, type LucideIcon,
} from 'lucide-react';
import { RichContent } from '@/components/common/RichContent';
import { cn } from '@/lib/utils';

export const inputCls =
  'w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white';

export function Field({ label, hint, children, required }: {
  label: string; hint?: string; children: ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-slate-300">
        {label}{required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: {
  active: boolean; onClick: () => void; icon: LucideIcon; children: ReactNode;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl transition-colors',
        active ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60')}
    >
      <Icon size={15} /> {children}
    </button>
  );
}

// Редактор Markdown із перемикачем «Текст ↔ Прев'ю» (рендер через RichContent сайту)
export function MarkdownEditor({ value, onChange, rows = 10 }: {
  value: string; onChange: (v: string) => void; rows?: number;
}) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="rounded-2xl border border-white/60 dark:border-slate-700 overflow-hidden bg-white/70 dark:bg-slate-800/70">
      <div className="flex items-center gap-1 p-1.5 border-b border-white/60 dark:border-slate-700">
        <TabBtn active={!preview} onClick={() => setPreview(false)} icon={Pencil}>Текст</TabBtn>
        <TabBtn active={preview} onClick={() => setPreview(true)} icon={Eye}>Прев'ю</TabBtn>
        <span className="ml-auto text-[11px] text-gray-400 dark:text-slate-500 pr-2 font-bold uppercase">Markdown</span>
      </div>
      {preview ? (
        <div className="p-4 min-h-[220px]">
          {value.trim() ? <RichContent content={value} /> : <p className="text-gray-400 dark:text-slate-500 italic">Нічого для перегляду…</p>}
        </div>
      ) : (
        <textarea
          value={value} onChange={e => onChange(e.target.value)} rows={rows}
          placeholder="Текст у форматі Markdown: **жирний**, *курсив*, [посилання](https://…), - списки…"
          className="w-full px-4 py-3 bg-transparent outline-none text-gray-900 dark:text-white resize-y"
        />
      )}
    </div>
  );
}

// Поле зображення: прев'ю + вибір/заміна файлу
export function ImageField({ url, file, onPick }: {
  url: string | null; file: File | null; onPick: (f: File | null) => void;
}) {
  const preview = file ? URL.createObjectURL(file) : url;
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="" className="w-28 h-28 object-cover rounded-2xl border border-white/60 dark:border-slate-700" />
          {file && (
            <button type="button" onClick={() => onPick(null)} className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 text-white grid place-items-center shadow" aria-label="Прибрати">
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 grid place-items-center text-gray-300 dark:text-slate-600">
          <ImagePlus size={28} />
        </div>
      )}
      <label className="cursor-pointer bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl text-gray-700 dark:text-slate-300 transition-colors">
        {preview ? 'Замінити фото' : 'Вибрати фото'}
        <input type="file" accept="image/*" className="hidden" onChange={e => onPick(e.target.files?.[0] || null)} />
      </label>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5">
      <span className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0', checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600')}>
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', checked ? 'left-[1.375rem]' : 'left-0.5')} />
      </span>
      <span className="font-bold text-sm text-gray-700 dark:text-slate-300">{label}</span>
    </button>
  );
}

export function FormHeader({ title, backTo }: { title: string; backTo: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Link to={backTo} className="w-10 h-10 grid place-items-center rounded-xl premium-glass hover:-translate-y-0.5 transition-transform" aria-label="Назад">
        <ArrowLeft size={20} />
      </Link>
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{title}</h1>
    </div>
  );
}

export function FormActions({ onSave, saving, onDelete, cancelTo }: {
  onSave: () => void; saving?: boolean; onDelete?: () => void; cancelTo: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <button type="button" onClick={onSave} disabled={saving}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Зберегти
      </button>
      <Link to={cancelTo} className="font-bold px-5 py-2.5 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Скасувати</Link>
      {onDelete && (
        <button type="button" onClick={onDelete}
          className="ml-auto inline-flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold px-4 py-2.5 rounded-xl transition-colors">
          <Trash2 size={18} /> Видалити
        </button>
      )}
    </div>
  );
}
