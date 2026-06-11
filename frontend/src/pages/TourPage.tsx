import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Compass } from 'lucide-react';
import { Pannellum } from 'pannellum-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
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

  const stops = data || [];
  const total = stops.length;

  const jump = (i: number) => { setIndex(i); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + total) % total);
      else if (e.key === 'ArrowRight') setIndex(i => (i + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

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
          {/* Сцена Pannellum */}
          <div className="relative rounded-[2rem] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.22)] bg-gray-900 border-4 border-white/10">
            <div className="relative w-full h-[60vh] min-h-[400px]">
              <Pannellum
                width="100%"
                height="100%"
                image={stop.image}
                pitch={0}
                yaw={0}
                hfov={100}
                autoLoad
                showZoomCtrl={true}
                showFullscreenCtrl={true}
                compass={true}
                title={stop.title}
                author="ЗДО №52"
                onLoad={() => { console.log('Panorama loaded'); }}
              >
                {/* Custom hotspots could be added here later */}
              </Pannellum>
            </div>
            
            {/* Напівпрозорий блок з описом (якщо є) */}
            {stop.description && (
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white mb-2 shadow-sm">
                  <MapPin size={13} className="text-blue-400" /> Зупинка {index + 1} з {total}
                </div>
                <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-md mb-1">{stop.title}</h2>
                <p className="text-sm text-gray-200 drop-shadow max-w-3xl line-clamp-2">
                  {stop.description}
                </p>
              </div>
            )}
          </div>

          {/* Мініатюри-навігація */}
          {total > 1 && (
            <div className="flex gap-3 mt-6 overflow-x-auto pb-2 snap-x">
              {stops.map((s, i) => (
                <button key={s.id} onClick={() => jump(i)} aria-label={s.title}
                  className={cn(
                    'relative shrink-0 w-32 h-24 rounded-2xl overflow-hidden snap-start transition-all',
                    i === index ? 'ring-4 ring-blue-500 scale-100 shadow-lg' : 'ring-2 ring-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]',
                  )}>
                  <img src={s.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-2 px-2 text-white text-xs font-bold truncate text-left shadow-sm">
                    {s.title}
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 dark:text-slate-400 font-medium mt-4">
            Тягніть мишкою або пальцем, щоб озирнутися навколо (360°). Клікайте на мініатюри для переходу.
          </p>
        </>
      )}
    </div>
  );
}
