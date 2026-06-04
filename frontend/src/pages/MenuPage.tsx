import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, Utensils, Sparkles } from 'lucide-react';
import { addDays, format, startOfWeek, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Seo } from '@/components/common/Seo';
import { Spinner } from '@/components/common/Spinner';
import { useMenuWeek } from '@/hooks/useApi';
import type { DailyMenu } from '@/types';
import { cn } from '@/lib/utils';

const MEALS: Array<{ key: keyof DailyMenu; label: string; emoji: string; card: string }> = [
  { key: 'breakfast',        label: 'Сніданок',    emoji: '🥣', card: 'from-amber-100/70 to-yellow-50 dark:from-slate-800 dark:to-slate-800/50' },
  { key: 'second_breakfast', label: 'II сніданок', emoji: '🍌', card: 'from-rose-100/70 to-pink-50 dark:from-slate-800 dark:to-slate-800/50' },
  { key: 'lunch',            label: 'Обід',        emoji: '🍲', card: 'from-emerald-100/70 to-teal-50 dark:from-slate-800 dark:to-slate-800/50' },
  { key: 'snack',            label: 'Полуденок',   emoji: '🥐', card: 'from-violet-100/70 to-purple-50 dark:from-slate-800 dark:to-slate-800/50' },
  { key: 'dinner',           label: 'Вечеря',      emoji: '🥛', card: 'from-sky-100/70 to-blue-50 dark:from-slate-800 dark:to-slate-800/50' },
];

const DEFAULT_NOTE = 'Меню складено згідно з нормами МОЗ України. Усі страви готуються на пару або запікаються для максимального збереження вітамінів.';

function defaultIdx(ws: Date): number {
  const today = new Date();
  const i = Array.from({ length: 5 }).findIndex((_, k) => isSameDay(addDays(ws, k), today));
  return i >= 0 ? i : 0;
}

export function MenuPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedIdx, setSelectedIdx] = useState(() => defaultIdx(startOfWeek(new Date(), { weekStartsOn: 1 })));

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const { data, isLoading } = useMenuWeek(startStr);

  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const today = new Date();

  const goWeek = (delta: number) => {
    const ws = addDays(weekStart, delta * 7);
    setWeekStart(ws);
    setSelectedIdx(defaultIdx(ws));
  };

  // На мобільному (горизонтальний скрол днів) — підкручуємо активний день у видиму зону
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedIdx, startStr]);

  const selectedDay = days[selectedIdx];
  const selectedStr = format(selectedDay, 'yyyy-MM-dd');
  const menu = data?.menus.find(m => m.date === selectedStr);
  const presentMeals = MEALS.filter(m => menu && (menu[m.key] as string));

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <Seo title="Меню" description="Меню харчування у закладі дошкільної освіти №52 — збалансований раціон для дітей" />

      {/* HERO */}
      <div className="relative pt-2 pb-8">
        <div className="absolute -top-10 -left-20 w-72 h-72 rounded-full bg-orange-300/20 dark:bg-orange-600/10 blur-[100px] pointer-events-none animate-float-complex" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wide mb-4">
              <Sparkles size={13} /> Смачно та корисно
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Меню харчування</h1>
            <p className="text-lg text-gray-500 dark:text-slate-400 font-medium max-w-xl">Збалансований раціон, розроблений дієтологами для наших дітей.</p>
          </div>

          {/* Тижнева навігація */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-sm border border-gray-100 dark:border-slate-800 shrink-0 self-start md:self-auto">
            <button onClick={() => goWeek(-1)} aria-label="Минулий тиждень" className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 font-bold text-sm text-gray-700 dark:text-slate-200 whitespace-nowrap">
              {format(weekStart, 'd MMM', { locale: uk })} — {format(addDays(weekStart, 4), 'd MMM', { locale: uk })}
            </span>
            <button onClick={() => goWeek(1)} aria-label="Наступний тиждень" className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5 pb-12">
        {/* Дні — горизонтальний скрол на мобільному, бічна панель на десктопі */}
        <div className="flex lg:flex-col gap-2.5 lg:gap-3 overflow-x-auto lg:overflow-visible hide-scrollbar pb-1 lg:pb-0">
          {days.map((day, i) => {
            const active = i === selectedIdx;
            const isToday = isSameDay(day, today);
            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                ref={active ? activeRef : undefined}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  'shrink-0 lg:w-full text-left rounded-[1.5rem] px-5 py-4 border relative overflow-hidden transition-all duration-300',
                  active
                    ? 'bg-gradient-to-br from-slate-800 to-slate-950 text-white border-transparent shadow-xl shadow-slate-900/25 lg:-translate-y-0.5'
                    : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/50 hover:-translate-y-0.5 hover:shadow-lg',
                )}
              >
                {active && <div className="absolute -top-7 -right-7 w-24 h-24 bg-orange-500/40 rounded-full blur-2xl pointer-events-none" />}
                <div className={cn('relative font-black text-lg capitalize', active ? 'text-white' : 'text-gray-900 dark:text-white')}>
                  {format(day, 'EEEE', { locale: uk })}
                </div>
                <div className={cn('relative text-sm font-medium', active ? 'text-white/60' : 'text-gray-400 dark:text-slate-500')}>
                  {format(day, 'd MMM', { locale: uk })}
                </div>
                {isToday && (
                  <span className="relative inline-block mt-2 text-[10px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide font-black">сьогодні</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Страви вибраного дня */}
        <div className="min-w-0">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800"><Spinner /></div>
          ) : !menu || !menu.has_any_meal ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 text-center shadow-sm border border-gray-100 dark:border-slate-800">
              <div className="w-16 h-16 mx-auto rounded-[1.5rem] bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-300 dark:text-slate-600 mb-4">
                <Utensils className="h-8 w-8" />
              </div>
              <p className="font-bold text-gray-500 dark:text-slate-400">Меню на цей день поки не опубліковано</p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Оберіть інший день або завітайте пізніше</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 animate-scale-in">
              {presentMeals.map(meal => (
                <div key={meal.key} className={cn(
                  'group relative overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br border border-black/5 dark:border-white/5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                  meal.card,
                )}>
                  {/* декоративне велике емодзі */}
                  <span className="absolute -right-2 -bottom-5 text-[5rem] sm:text-[7rem] leading-none opacity-[0.13] dark:opacity-[0.05] select-none pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                    {meal.emoji}
                  </span>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-900/70 shadow-sm flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                        {meal.emoji}
                      </span>
                      <h3 className="font-black text-xl text-gray-900 dark:text-white">{meal.label}</h3>
                    </div>
                    <p className="font-medium whitespace-pre-line text-gray-600 dark:text-slate-300 leading-relaxed">{menu[meal.key] as string}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Інформація для батьків */}
          <div className="mt-5 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Info size={22} />
            </div>
            <div>
              <h4 className="font-black text-gray-900 dark:text-white mb-1">Інформація для батьків</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{menu?.note || DEFAULT_NOTE}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
