import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useAlbum } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';
import { NotFoundPage } from '../NotFoundPage';

export function AlbumDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useAlbum(slug);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Swipe (мишка + палець)
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const photos = data?.photos ?? [];

  const close = () => setLightboxIndex(null);
  const next = useCallback(() => {
    setLightboxIndex(prev => (prev === null ? null : (prev === photos.length - 1 ? 0 : prev + 1)));
  }, [photos.length]);
  const prev = useCallback(() => {
    setLightboxIndex(p => (p === null ? null : (p === 0 ? photos.length - 1 : p - 1)));
  }, [photos.length]);

  // Блокування скролу + клавіатура
  useEffect(() => {
    if (lightboxIndex === null) { document.body.style.overflow = ''; return; }
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightboxIndex, next, prev]);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const MIN_SWIPE = 50;
  const getX = (e: React.TouchEvent | React.MouseEvent) =>
    'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).pageX;

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).pageX;
    setDragStartX(x); setDragOffset(0);
  };
  const onMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX === null) return;
    const x = getX(e);
    if (x != null) setDragOffset((x - dragStartX) * 0.85);
  };
  const onEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX === null) return;
    const endX = 'changedTouches' in e ? e.changedTouches[0]?.clientX : (e as React.MouseEvent).pageX;
    const dist = dragStartX - (endX ?? dragStartX);
    if (dist > MIN_SWIPE) next();
    else if (dist < -MIN_SWIPE) prev();
    setDragStartX(null); setDragOffset(0);
  };

  return (
    <div className="mesh-bg-gallery min-h-screen pb-16 -mt-24 md:-mt-28 pt-28 md:pt-32 animate-page-fade-in">
      <Seo title={data.title} description={data.description} image={data.cover} />

      <div className="container mx-auto px-4 max-w-7xl">
        <button
          onClick={() => window.history.back()}
          className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-6 bg-white dark:bg-slate-800 py-2 px-4 rounded-full shadow-sm w-fit border border-gray-100 dark:border-slate-700"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> До всіх альбомів
        </button>

        {/* Заголовок альбому */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {data.category && (
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" style={{ background: data.category.color }}>
                  {data.category.name}
                </span>
              )}
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar size={14} /> {formatDate(data.created_at)}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{data.title}</h1>
            {data.description && <p className="text-gray-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">{data.description}</p>}
          </div>
          <div className="text-gray-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 w-fit">
            {photos.length} світлин
          </div>
        </div>

        {/* Сітка фото */}
        {photos.length === 0 ? (
          <p className="text-center text-gray-400 py-16">В альбомі поки немає фотографій</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 animate-scale-in border border-gray-100 dark:border-slate-800"
                style={{ animationDelay: `${(index % 12) * 0.03}s` }}
              >
                <OptimizedImage src={photo.image} alt={photo.title || `Фото ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
                    <ImageIcon size={20} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-page-fade-in select-none">
          {/* Верхня панель */}
          <div className="absolute top-0 w-full p-4 md:p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
            <div className="text-white font-medium text-sm md:text-base bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
              {lightboxIndex + 1} / {photos.length}
            </div>
            <button onClick={close} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all" aria-label="Закрити">
              <X size={24} />
            </button>
          </div>

          {/* Зображення зі swipe */}
          <div
            className="flex-1 flex items-center justify-center w-full h-full p-2 md:p-12 relative cursor-grab active:cursor-grabbing overflow-hidden"
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          >
            <div
              className="flex items-center justify-center w-full h-full"
              style={{ transform: `translateX(${dragOffset}px)`, transition: dragStartX === null ? 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none' }}
            >
              <img
                key={lightboxIndex}
                src={photos[lightboxIndex].image}
                alt={photos[lightboxIndex].title || 'Фото'}
                onDragStart={e => e.preventDefault()}
                className="max-w-full max-h-[85vh] object-contain rounded-lg md:rounded-2xl shadow-2xl animate-scale-in pointer-events-none"
              />
            </div>
          </div>

          {/* Підпис фото */}
          {photos[lightboxIndex].title && (
            <div className="absolute bottom-16 md:bottom-8 w-full text-center text-white/90 font-medium px-4 z-40 pointer-events-none">
              {photos[lightboxIndex].title}
            </div>
          )}

          {/* Стрілки (десктоп) — показуємо лише якщо фото більше одного */}
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} className="hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-all hover:scale-110 z-50" aria-label="Попереднє">
                <ChevronLeft size={32} />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }} className="hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-all hover:scale-110 z-50" aria-label="Наступне">
                <ChevronRight size={32} />
              </button>
              <div className="md:hidden absolute bottom-4 w-full text-center text-white/50 text-xs z-50 pointer-events-none">
                Свайпайте вліво або вправо
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
