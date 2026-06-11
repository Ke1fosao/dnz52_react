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
  const [loadingPano, setLoadingPano] = useState(true);

  const stops = data || [];
  const total = stops.length;

  const jump = (i: number) => { 
    if (i !== index) setLoadingPano(true);
    setIndex(i); 
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLoadingPano(true);
        setIndex(i => (i - 1 + total) % total);
      }
      else if (e.key === 'ArrowRight') {
        setLoadingPano(true);
        setIndex(i => (i + 1) % total);
      }
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
          <div className="relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 group">
            <div className="relative w-full h-[65vh] min-h-[450px]">
              {loadingPano && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 bg-gray-900">
                  <img src={stop.image} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60 transition-all duration-700" />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
                    <span className="text-white text-sm font-bold tracking-widest uppercase drop-shadow-md">Завантаження...</span>
                  </div>
                </div>
              )}
              
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
                onLoad={() => setLoadingPano(false)}
              />
            </div>
            
            {/* Затемнення + підпис у старому стилі */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white pointer-events-none z-20">
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
          </div>

          {/* Мініатюри-навігація */}
          {total > 1 && (
            <div className="flex gap-4 mt-6 overflow-x-auto pt-2 px-2 pb-4 snap-x hide-scrollbar">
              {stops.map((s, i) => (
                <button key={s.id} onClick={() => jump(i)} aria-label={s.title}
                  className={cn(
                    'relative shrink-0 w-36 h-28 md:w-44 md:h-32 rounded-2xl md:rounded-3xl overflow-hidden snap-start transition-all duration-300 ease-out outline-none focus-visible:ring-4 focus-visible:ring-blue-500',
                    i === index 
                      ? 'ring-4 ring-sky-400 scale-100 shadow-xl opacity-100' 
                      : 'ring-2 ring-transparent opacity-60 hover:opacity-100 hover:scale-[1.03] hover:shadow-lg filter grayscale-[30%] hover:grayscale-0'
                  )}>
                  <img src={s.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 ease-in-out hover:scale-110" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-3 px-3 text-white text-xs md:text-sm font-bold truncate text-left shadow-sm">
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
