import { useState } from 'react';
import { ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { addDays, format, startOfWeek } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useMenuWeek } from '@/hooks/useApi';
import type { DailyMenu } from '@/types';
import { cn } from '@/lib/utils';

const MEALS: Array<{ key: keyof DailyMenu; label: string; emoji: string; color: string }> = [
  { key: 'breakfast',        label: 'Сніданок',    emoji: '🥣', color: 'from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-amber-900/10' },
  { key: 'second_breakfast', label: 'II сніданок', emoji: '🍎', color: 'from-red-100 to-pink-50 dark:from-red-900/30 dark:to-red-900/10' },
  { key: 'lunch',            label: 'Обід',        emoji: '🍲', color: 'from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-orange-900/10' },
  { key: 'snack',            label: 'Полуденок',   emoji: '🥨', color: 'from-purple-100 to-pink-50 dark:from-purple-900/30 dark:to-purple-900/10' },
  { key: 'dinner',           label: 'Вечеря',      emoji: '🥛', color: 'from-blue-100 to-sky-50 dark:from-blue-900/30 dark:to-blue-900/10' },
];

export function MenuPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const startStr = format(weekStart, 'yyyy-MM-dd');
  const { data, isLoading } = useMenuWeek(startStr);

  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <Seo title="Меню" description="Меню харчування у закладі дошкільної освіти №52" />
      <PageHero title="Меню харчування" subtitle="Корисне, смачне та збалансоване меню для наших дітей" icon="🍽️" variant="warm" />

      <div className="pb-12">
        {/* Навігація тижнями */}
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-900 rounded-[1.5rem] p-2 shadow-sm border border-gray-100 dark:border-slate-800">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={18} /> <span className="hidden sm:inline">Минулий</span>
          </button>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-slate-500">Тиждень</div>
            <div className="font-black text-base md:text-lg text-gray-900 dark:text-white">
              {format(weekStart, 'd MMM', { locale: uk })} — {format(addDays(weekStart, 4), 'd MMM yyyy', { locale: uk })}
            </div>
          </div>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <span className="hidden sm:inline">Наступний</span> <ChevronRight size={18} />
          </button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-5">
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const menu = data?.menus.find(m => m.date === dayStr);
              const isToday = dayStr === todayStr;

              return (
                <div key={dayStr} className={cn(
                  'bg-white dark:bg-slate-900 rounded-[2rem] p-5 md:p-6 shadow-sm border transition-all',
                  isToday ? 'border-2 border-orange-400 shadow-lg shadow-orange-500/10' : 'border-gray-100 dark:border-slate-800',
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn('w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shrink-0', isToday ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300')}>
                      <span className="text-lg leading-none">{format(day, 'd')}</span>
                      <span className="text-[9px] uppercase">{format(day, 'MMM', { locale: uk })}</span>
                    </div>
                    <div>
                      <div className="font-black text-lg capitalize text-gray-900 dark:text-white flex items-center gap-2">
                        {format(day, 'EEEE', { locale: uk })}
                        {isToday && <span className="text-[10px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide">сьогодні</span>}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 font-medium">{format(day, 'd MMMM yyyy', { locale: uk })}</div>
                    </div>
                  </div>

                  {menu?.note && (
                    <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm font-medium text-amber-800 dark:text-amber-300">
                      💡 {menu.note}
                    </div>
                  )}

                  {!menu || !menu.has_any_meal ? (
                    <p className="text-sm text-gray-400 dark:text-slate-500 italic py-3 text-center">Меню на цей день поки не опубліковано</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {MEALS.map(meal => {
                        const text = menu[meal.key] as string;
                        if (!text) return null;
                        return (
                          <div key={meal.key} className={`rounded-2xl bg-gradient-to-br ${meal.color} p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{meal.emoji}</span>
                              <span className="font-black text-sm text-gray-800 dark:text-slate-200">{meal.label}</span>
                            </div>
                            <p className="text-xs font-medium whitespace-pre-line text-gray-600 dark:text-slate-400 leading-relaxed">{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && (!data || data.menus.length === 0) && (
          <EmptyState icon={<Utensils className="h-16 w-16" />} title="Меню на цей тиждень поки не опубліковано"
            description="Перейдіть на інший тиждень або зверніться до адміністрації" />
        )}
      </div>
    </div>
  );
}
