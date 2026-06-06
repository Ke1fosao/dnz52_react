import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, History } from 'lucide-react';
import { adminHistoryApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';
import type { AdminHistoryItem } from '../types';

function when(iso: string) {
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

const STYLE: Record<string, { icon: typeof Plus; cls: string }> = {
  '+': { icon: Plus, cls: 'bg-emerald-500' },
  '~': { icon: Pencil, cls: 'bg-blue-500' },
  '-': { icon: Trash2, cls: 'bg-rose-500' },
};

export function HistoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-history'], queryFn: adminHistoryApi.list });

  return (
    <div className="space-y-5 animate-page-fade-in max-w-3xl">
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-white grid place-items-center shrink-0"><History size={24} /></span>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Історія змін</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Хто і коли змінював новини, сторінки та меню</p>
        </div>
      </div>

      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Поки що немає записів історії" /> : (
        <div className="premium-glass rounded-[1.8rem] p-5 sm:p-6">
          <ol className="relative border-l-2 border-gray-200 dark:border-slate-700 ml-3">
            {data.map((h: AdminHistoryItem, i) => {
              const s = STYLE[h.type] || STYLE['~'];
              return (
                <li key={i} className="ml-6 pb-5 last:pb-0">
                  <span className={`absolute -left-[0.7rem] w-6 h-6 rounded-full grid place-items-center text-white ${s.cls} ring-4 ring-white/70 dark:ring-slate-900/70`}><s.icon size={13} /></span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">{h.model}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{h.repr}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {h.type_display} · <span className="font-semibold text-gray-500 dark:text-slate-400">{h.user}</span> · {when(h.date)}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <p className="text-xs text-gray-400 dark:text-slate-500">Записуються зміни Новин, Сторінок і Денних меню (через simple_history).</p>
    </div>
  );
}
