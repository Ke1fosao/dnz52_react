import { useState } from 'react';
import { UtensilsCrossed, CalendarRange } from 'lucide-react';
import { DailyMenuListPage } from './DailyMenuListPage';
import { MenuTemplatesPage } from './MenuTemplatesPage';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Денне меню', icon: UtensilsCrossed },
  { label: 'Шаблон тижня', icon: CalendarRange },
];

export function MenuPage() {
  const [tab, setTab] = useState(0);
  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Меню</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Денне меню за датами та шаблон тижня-основи</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => setTab(i)}
            className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all',
              i === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'premium-glass text-gray-600 dark:text-slate-300 hover:-translate-y-0.5')}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 0 ? <DailyMenuListPage embedded /> : <MenuTemplatesPage embedded />}
    </div>
  );
}
