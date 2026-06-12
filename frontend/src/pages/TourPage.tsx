import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Compass, Plus, Minus, Maximize, Minimize } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panoRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoom = (delta: number) => {
    const viewer = panoRef.current?.getViewer();
    if (viewer) viewer.setHfov(viewer.getHfov() + delta);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => {
        console.error('Помилка повноекранного режиму:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const stops = data || [];
  const total = stops.length;

  const jump = (i: number) => { 
    if (i !== index) setLoadingPano(true);
    setIndex(i); 
  };

  useEffect(() => {
    let timer: any;
    if (loadingPano) {
      timer = setTimeout(() => {
        setLoadingPano(false);
      }, 1500); // Резервний таймер: якщо подія onLoad загубилась
    }
    return () => clearTimeout(timer);
  }, [loadingPano, index]);

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
          <div ref={wrapperRef} className={cn(
            "relative overflow-hidden group transition-all duration-500",
            isFullscreen ? "fixed inset-0 z-50 bg-slate-900 rounded-none w-full h-full" : "rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10"
          )}>
            <div className={cn("relative w-full", isFullscreen ? "h-full" : "h-[65vh] min-h-[450px]")}>
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
                key={stop.image}
                ref={panoRef}
                width="100%"
                height="100%"
                image={stop.image}
                pitch={0}
                yaw={0}
                hfov={100}
                autoLoad
                crossOrigin="anonymous"
                showZoomCtrl={false}
                showFullscreenCtrl={false}
                compass={false}
                onLoad={() => setLoadingPano(false)}
                onError={(err: any) => {
                  console.error("Помилка Pannellum:", err);
                  setLoadingPano(false);
                }}
              />
              
              {/* Кастомні кнопки управління */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                <div className="flex flex-col bg-black/40 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden shadow-lg">
                  <button onClick={() => handleZoom(-15)} className="p-2 md:p-3 text-white hover:bg-white/20 transition-colors" aria-label="Збільшити">
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                  <div className="h-[1px] w-full bg-white/20" />
                  <button onClick={() => handleZoom(15)} className="p-2 md:p-3 text-white hover:bg-white/20 transition-colors" aria-label="Зменшити">
                    <Minus size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <button onClick={handleFullscreen} className="p-2 md:p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-colors shadow-lg" aria-label="Повноекранний режим">
                  {isFullscreen ? <Minimize size={20} strokeWidth={2.5} /> : <Maximize size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
            
            {/* Затемнення + підпис у старому стилі */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white pointer-events-none z-20">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-3">
                <MapPin size={13} /> Зупинка {index + 1} з {total}
              </div>
              <h2 className={cn("font-black drop-shadow-lg mb-2 transition-all", isFullscreen ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl")}>{stop.title}</h2>
              {stop.description && (
                <p className={cn("text-gray-100 max-w-2xl drop-shadow leading-relaxed whitespace-pre-line transition-all", isFullscreen ? "text-base md:text-lg line-clamp-none" : "text-sm md:text-base line-clamp-4")}>
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
