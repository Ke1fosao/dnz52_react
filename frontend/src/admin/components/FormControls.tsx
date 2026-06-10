import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Pencil, ImagePlus, X, ArrowLeft, Save, Trash2, Loader2, Sparkles,
  File as FileIcon, Download, ChevronUp, ChevronDown, type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { RichContent } from '@/components/common/RichContent';
import { adminAiApi } from '../lib/adminApi';
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

// Редактор Markdown/HTML із перемикачем «Текст ↔ Прев'ю» + кнопка ШІ-генерації.
// aiKind вмикає кнопку «✨ ШІ» і визначає стиль/довжину тексту (news/event/faq/page/bio/section).
export function MarkdownEditor({ value, onChange, rows = 10, aiKind }: {
  value: string; onChange: (v: string) => void; rows?: number; aiKind?: string;
}) {
  const [preview, setPreview] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState<'official' | 'warm' | 'dynamic'>('warm');
  const [aiBusy, setAiBusy] = useState(false);

  const openAi = () => { setBrief(value && value.length < 280 ? value : ''); setAiOpen(true); };
  const runAi = async () => {
    if (brief.trim().length < 3) { toast.error('Опишіть коротко, про що текст'); return; }
    setAiBusy(true);
    try {
      const r = await adminAiApi.generate(brief.trim(), aiKind || 'generic', tone);
      onChange(r.text);
      setAiOpen(false); setPreview(true);
      toast.success('Готово! Перевірте і за потреби відредагуйте.');
    } catch (e) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'ШІ зараз недоступний');
    } finally { setAiBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-white/60 dark:border-slate-700 overflow-hidden bg-white/70 dark:bg-slate-800/70">
      <div className="flex items-center gap-1 p-1.5 border-b border-white/60 dark:border-slate-700">
        <TabBtn active={!preview} onClick={() => setPreview(false)} icon={Pencil}>Текст</TabBtn>
        <TabBtn active={preview} onClick={() => setPreview(true)} icon={Eye}>Прев'ю</TabBtn>
        {aiKind && (
          <button type="button" onClick={openAi}
            className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
            <Sparkles size={15} /> ШІ
          </button>
        )}
        <span className="ml-auto text-[11px] text-gray-400 dark:text-slate-500 pr-2 font-bold uppercase">Markdown / HTML</span>
      </div>

      {aiOpen && (
        <div className="p-3 border-b border-white/60 dark:border-slate-700 bg-violet-50/60 dark:bg-violet-900/10 space-y-2">
          <p className="text-xs font-bold text-violet-700 dark:text-violet-300">✨ Опишіть коротко, про що текст — ШІ напише гарно з форматуванням:</p>
          <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={2} autoFocus
            placeholder="Напр.: свято осені, діти співали й танцювали, батьки були в захваті"
            className="w-full px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-violet-200 dark:border-violet-800 outline-none text-sm text-gray-900 dark:text-white resize-y" />
          
          <div className="flex flex-wrap items-center gap-2 mb-2 mt-2">
            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">Стиль тексту:</span>
            {(['official', 'warm', 'dynamic'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTone(t)}
                className={cn('text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors',
                  tone === t ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40')}>
                {t === 'official' ? '🎩 Офіційно' : t === 'warm' ? '🤗 Дуже тепло' : '🏃‍♂️ Коротко і жваво'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={runAi} disabled={aiBusy}
              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
              {aiBusy ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} Згенерувати
            </button>
            <button type="button" onClick={() => setAiOpen(false)} className="font-bold text-sm px-3 py-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors">Скасувати</button>
          </div>
        </div>
      )}

      {preview ? (
        <div className="p-4 min-h-[220px]">
          {value.trim() ? <RichContent content={value} /> : <p className="text-gray-400 dark:text-slate-500 italic">Нічого для перегляду…</p>}
        </div>
      ) : (
        <textarea
          value={value} onChange={e => onChange(e.target.value)} rows={rows}
          placeholder="Текст у форматі Markdown або HTML: **жирний**, &lt;p&gt;абзац&lt;/p&gt;, списки…"
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

// Завантаження файлу (документи тощо)
export function FileField({ url, file, onPick, accept }: {
  url: string | null; file: File | null; onPick: (f: File | null) => void; accept?: string;
}) {
  const name = file ? file.name : (url ? decodeURIComponent(url.split('/').pop() || '') : null);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {name ? (
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 max-w-full">
          <FileIcon size={16} className="text-blue-500 shrink-0" />
          <span className="truncate max-w-[200px]">{name}</span>
          {url && !file && <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 shrink-0" title="Відкрити"><Download size={14} /></a>}
        </span>
      ) : <span className="text-sm text-gray-400 dark:text-slate-500">Файл не вибрано</span>}
      <label className="cursor-pointer bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm px-4 py-2 rounded-xl text-gray-700 dark:text-slate-300 transition-colors">
        {name ? 'Замінити файл' : 'Вибрати файл'}
        <input type="file" accept={accept} className="hidden" onChange={e => onPick(e.target.files?.[0] || null)} />
      </label>
    </div>
  );
}

const PRESET_COLORS = ['#4A90E2', '#34C8A8', '#50E3C2', '#38C2DD', '#7C4DCB', '#B388FF', '#FF9F1A', '#FFD93D', '#E5677E', '#FF8FA3', '#22C55E', '#64748B'];

export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-1.5 flex-wrap">
        {PRESET_COLORS.map(c => (
          <button type="button" key={c} onClick={() => onChange(c)} title={c}
            className={cn('w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110',
              value?.toLowerCase() === c.toLowerCase() ? 'border-gray-900 dark:border-white scale-110' : 'border-white/60 dark:border-slate-700')}
            style={{ background: c }} />
        ))}
      </div>
      <span className="inline-flex items-center gap-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 px-2 py-1.5">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#4A90E2'} onChange={e => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
        <input value={value} onChange={e => onChange(e.target.value)} className="w-20 bg-transparent outline-none text-sm font-mono text-gray-700 dark:text-slate-300" placeholder="#RRGGBB" />
      </span>
    </div>
  );
}

const COMMON_ICONS = [
  'bi-star-fill', 'bi-heart-fill', 'bi-house-fill', 'bi-book-fill', 'bi-mortarboard-fill', 'bi-palette-fill',
  'bi-music-note-beamed', 'bi-bicycle', 'bi-heart-pulse-fill', 'bi-snow', 'bi-sun-fill', 'bi-tree-fill',
  'bi-flower1', 'bi-balloon-fill', 'bi-gift-fill', 'bi-trophy-fill', 'bi-people-fill', 'bi-emoji-smile-fill',
  'bi-lightbulb-fill', 'bi-puzzle-fill', 'bi-pencil-fill', 'bi-brush-fill', 'bi-camera-fill', 'bi-image-fill',
  'bi-calendar-event-fill', 'bi-clock-fill', 'bi-shield-fill-check', 'bi-award-fill', 'bi-bell-fill',
  'bi-chat-heart-fill', 'bi-info-circle-fill', 'bi-question-circle-fill', 'bi-file-earmark-text-fill',
  'bi-folder-fill', 'bi-globe', 'bi-telephone-fill', 'bi-envelope-fill', 'bi-geo-alt-fill', 'bi-cup-hot-fill',
  'bi-egg-fried', 'bi-basket-fill', 'bi-droplet-fill', 'bi-flag-fill', 'bi-stars', 'bi-magic',
  'bi-rocket-takeoff-fill', 'bi-controller', 'bi-music-note-list', 'bi-journal-bookmark-fill',
];

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = q ? COMMON_ICONS.filter(ic => ic.includes(q.toLowerCase().replace(/\s/g, '-'))) : COMMON_ICONS;
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="w-11 h-11 grid place-items-center rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 text-blue-500 text-xl shrink-0">
          {value ? <i className={`bi ${value}`} /> : <span className="text-gray-300 text-base">?</span>}
        </span>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="bi-star-fill" className={cn(inputCls, 'flex-1')} />
        <button type="button" onClick={() => setOpen(o => !o)} className="px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 font-bold text-sm shrink-0 text-gray-700 dark:text-slate-300">Вибрати</button>
      </div>
      {open && (
        <div className="mt-2 premium-glass rounded-2xl p-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Пошук іконки…" className={cn(inputCls, 'mb-2')} />
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-52 overflow-y-auto">
            {filtered.map(ic => (
              <button type="button" key={ic} title={ic} onClick={() => { onChange(ic); setOpen(false); }}
                className={cn('aspect-square grid place-items-center rounded-lg text-lg transition-colors',
                  value === ic ? 'bg-blue-500 text-white' : 'bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40')}>
                <i className={`bi ${ic}`} />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">
            Будь-яку іконку з <a href="https://icons.getbootstrap.com" target="_blank" rel="noreferrer" className="text-blue-500">Bootstrap Icons</a> можна вписати вручну (напр. <code>bi-snow</code>).
          </p>
        </div>
      )}
    </div>
  );
}

// Кнопки ↑/↓ для зміни порядку (батьківський список реалізує саму перестановку)
export function OrderControls({ onUp, onDown, isFirst, isLast }: {
  onUp: () => void; onDown: () => void; isFirst?: boolean; isLast?: boolean;
}) {
  return (
    <div className="flex flex-col shrink-0">
      <button type="button" onClick={onUp} disabled={isFirst} aria-label="Вгору"
        className="w-7 h-6 grid place-items-center rounded-t-lg bg-white/60 dark:bg-slate-800/60 disabled:opacity-30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-500 dark:text-slate-400 transition-colors"><ChevronUp size={15} /></button>
      <button type="button" onClick={onDown} disabled={isLast} aria-label="Вниз"
        className="w-7 h-6 grid place-items-center rounded-b-lg bg-white/60 dark:bg-slate-800/60 disabled:opacity-30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-500 dark:text-slate-400 transition-colors"><ChevronDown size={15} /></button>
    </div>
  );
}
