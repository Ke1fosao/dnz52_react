import { useState } from 'react';
import { ChevronLeft, ChevronRight, Utensils, Calendar } from 'lucide-react';
import { addDays, format, startOfWeek } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMenuWeek } from '@/hooks/useApi';
import type { DailyMenu } from '@/types';
import { cn } from '@/lib/utils';

const MEALS: Array<{ key: keyof DailyMenu; label: string; emoji: string; color: string }> = [
  { key: 'breakfast',        label: 'Сніданок',     emoji: '🥣', color: 'from-amber-100 to-yellow-50' },
  { key: 'second_breakfast', label: 'II сніданок',  emoji: '🍎', color: 'from-red-100 to-pink-50' },
  { key: 'lunch',            label: 'Обід',         emoji: '🍲', color: 'from-orange-100 to-amber-50' },
  { key: 'snack',            label: 'Полуденок',    emoji: '🥨', color: 'from-purple-100 to-pink-50' },
  { key: 'dinner',           label: 'Вечеря',       emoji: '🥛', color: 'from-blue-100 to-sky-50' },
];

export function MenuPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const startStr = format(weekStart, 'yyyy-MM-dd');
  const { data, isLoading } = useMenuWeek(startStr);

  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <>
      <Seo title="Меню" description="Меню харчування у закладі дошкільної освіти №52" />
      <PageHero
        title="Меню харчування"
        subtitle="Корисне, смачне та збалансоване меню для наших дітей"
        icon="🍽️"
        variant="warm"
      />

      <div className="container py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" /> Минулий
          </Button>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Тиждень</div>
            <div className="font-display font-bold text-lg">
              {format(weekStart, 'd MMM', { locale: uk })} — {format(addDays(weekStart, 4), 'd MMM yyyy', { locale: uk })}
            </div>
          </div>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Наступний <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const menu = data?.menus.find(m => m.date === dayStr);
              const isToday = dayStr === todayStr;

              return (
                <Card key={dayStr} className={cn(isToday && 'border-2 border-primary shadow-soft-lg')}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className={cn('h-5 w-5', isToday ? 'text-primary' : 'text-muted-foreground')} />
                      <div>
                        <div className={cn('font-display font-bold text-lg capitalize', isToday && 'text-primary')}>
                          {format(day, 'EEEE', { locale: uk })}
                          {isToday && <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">сьогодні</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(day, 'd MMMM yyyy', { locale: uk })}
                        </div>
                      </div>
                    </div>

                    {menu?.note && (
                      <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        💡 {menu.note}
                      </div>
                    )}

                    {!menu || !menu.has_any_meal ? (
                      <p className="text-sm text-muted-foreground italic py-3 text-center">
                        Меню на цей день поки не опубліковано
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {MEALS.map(meal => {
                          const text = menu[meal.key] as string;
                          if (!text) return null;
                          return (
                            <div key={meal.key} className={`rounded-2xl bg-gradient-to-br ${meal.color} p-4`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{meal.emoji}</span>
                                <span className="font-semibold text-sm">{meal.label}</span>
                              </div>
                              <p className="text-xs whitespace-pre-line text-foreground/80">{text}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && (!data || data.menus.length === 0) && (
          <EmptyState
            icon={<Utensils className="h-16 w-16" />}
            title="Меню на цей тиждень поки не опубліковано"
            description="Перейдіть на інший тиждень або зверніться до адміністрації"
          />
        )}
      </div>
    </>
  );
}
