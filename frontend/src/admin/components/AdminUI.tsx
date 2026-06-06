import { type ReactNode, useState } from 'react';
import { Star, Inbox, Search, X, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Поле пошуку (клієнтська фільтрація списків)
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Пошук…'}
        className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-900 dark:text-white"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300" aria-label="Очистити"><X size={15} /></button>
      )}
    </div>
  );
}

// Згортна панель (для менеджерів категорій усередині сторінок контенту)
export function CollapsiblePanel({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon?: LucideIcon; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="premium-glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 px-4 py-3 font-bold text-gray-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
        {Icon && <Icon size={17} className="text-blue-500" />}
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={cn('transition-transform text-gray-400', open && 'rotate-180')} size={18} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

// Простий стовпчиковий графік (без зовнішніх залежностей)
export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2 md:gap-3 h-44 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
          <span className="text-xs font-black text-gray-700 dark:text-slate-200">{d.value}</span>
          <div
            className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400 dark:from-blue-500 dark:to-cyan-300 shadow-sm transition-[height] duration-700"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '6px' : '2px' }}
          />
          <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={15} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600'} />
      ))}
    </div>
  );
}

export function FilterTabs<T extends string>({ value, onChange, tabs }: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all',
            value === t.value
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'premium-glass text-gray-600 dark:text-slate-300 hover:-translate-y-0.5',
          )}
        >
          {t.label}
          {t.count != null && (
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-black',
              value === t.value ? 'bg-white/25' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

const ACT_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  rose: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400',
  slate: 'bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300',
};

export function ActButton({ onClick, color = 'slate', icon: Icon, children, disabled }: {
  onClick: () => void;
  color?: keyof typeof ACT_COLORS;
  icon?: LucideIcon;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn('inline-flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50', ACT_COLORS[color])}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="premium-glass rounded-[1.5rem] p-5">
          <div className="h-5 w-40 bg-gray-200/60 dark:bg-slate-700/60 rounded-full animate-pulse mb-3" />
          <div className="h-4 w-full bg-gray-200/60 dark:bg-slate-700/60 rounded-full animate-pulse mb-2" />
          <div className="h-4 w-2/3 bg-gray-200/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function EmptyBox({ text }: { text: string }) {
  return (
    <div className="premium-glass rounded-[1.5rem] p-12 text-center">
      <div className="inline-grid place-items-center w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mb-3">
        <Inbox className="text-gray-400" size={28} />
      </div>
      <p className="font-bold text-gray-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
