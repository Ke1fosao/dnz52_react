import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { m as motion } from '@/lib/motion';
import { ChevronLeft, ChevronRight, MapPin, Compass } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';

interface TourStop {
  id: number;
  title: string;
  description: string;
  image: string;
  order: number;
}

export function TourPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tour'],
    queryFn: () => api.get<TourStop[]>('/tour/').then(r => r.data),
  });
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const reduced = useReducedMotion();
  const touchX = useRef<number | null>(null);

  const stops = data || [];
  const total = stops.length;

  const go = useCallback((step: number) => {
    if (total < 2) return;
    setDir(step);
    setIndex(i => (i + step + total) % total);
  }, [total]);

  const jump = (i: number) => { setDir(i > index ? 1 : -1); setIndex(i); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (isLoading) return <PageSpinner />;

  const stop = stops[index];

  return (
    <div className="container mx-auto px-4 max-w-5xl pb-16">
      <Seo
        title="Віртуальний тур"
        description="Віртуальна прогулянка закладом дошкільної освіти №52, м. Рівне — подивіться на наші групи, зали та майданчики онлайн."
      />
      <PageHero
        title="Віртуальний тур"
        subtitle="Прогуляйтеся садочком, не виходячи з дому"
        icon="🏫"
        variant="sky"
      />

      {!total || !stop ? (
        <EmptyState icon={<Compass className="h-16 w-16" />} title="Тур ще готується"
          description="Незабаром ви зможете прогулятися нашим садочком віртуально. Завітайте трохи згодом!" />
      ) : (
        <>
          {/* Сцена */}
          <div
            className="relative rounded-[2rem] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.22)] bg-gray-900 select-none"
            onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              if (touchX.current === null) return;
              const delta = e.changedTouches[0].clientX - touchX.current;
              if (delta > 50) go(-1); else if (delta < -50) go(1);
              touchX.current = null;
            }}
          >
            <div className="relative h-[58vh] min-h-[340px]">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div
                  key={stop.id}
                  custom={dir}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? 60 : -60 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? -60 : 60 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <OptimizedImage src={stop.image} alt={stop.title} className="w-full h-full object-cover" />
                </motion.div>
              </AnimatePresence>

              {/* Затемнення + підпис */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white pointer-events-none">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-3">
                  <MapPin size={13} /> Зупинка {index + 1} з {total}
                </div>
                <h2 className="text-2xl md:text-4xl font-black drop-shadow-lg mb-2">{stop.title}</h2>
                {stop.description && (
                  <p className="text-sm md:text-base text-gray-100 max-w-2xl drop-shadow leading-relaxed whitespace-pre-line line-clamp-4">
                    {stop.description}
                  </p>
                )}
              </div>

              {/* Стрілки */}
              {total > 1 && (
                <>
                  <button onClick={() => go(-1)} aria-label="Попередня зупинка"
                    className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full grid place-items-center bg-white/20 backdrop-blur-md text-white hover:bg-white/35 transition-colors">
                    <ChevronLeft size={26} />
                  </button>
                  <button onClick={() => go(1)} aria-label="Наступна зупинка"
                    className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full grid place-items-center bg-white/20 backdrop-blur-md text-white hover:bg-white/35 transition-colors">
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Мініатюри-навігація */}
          {total > 1 && (
            <div className="flex gap-3 mt-5 overflow-x-auto pb-2 snap-x">
              {stops.map((s, i) => (
                <button key={s.id} onClick={() => jump(i)} aria-label={s.title}
                  className={cn(
                    'relative shrink-0 w-28 h-20 rounded-2xl overflow-hidden snap-start transition-all',
                    i === index ? 'ring-4 ring-blue-500 scale-100' : 'ring-2 ring-transparent opacity-70 hover:opacity-100',
                  )}>
                  <img src={s.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-bold px-1.5 py-1 truncate text-left">{s.title}</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-slate-500 font-medium mt-4">
            Гортайте стрілками ← →, свайпом або клікніть на мініатюру
          </p>
        </>
      )}
    </div>
  );
}
