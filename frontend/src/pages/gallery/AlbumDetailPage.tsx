import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Image as ImageIcon } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useAlbum } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';
import { NotFoundPage } from '../NotFoundPage';

export function AlbumDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useAlbum(slug);
  const [index, setIndex] = useState(-1);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const photos = data.photos ?? [];
  const slides = photos.map(p => ({
    src: p.image,
    title: p.title || undefined,
    description: p.description || undefined,
  }));

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
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setIndex(i)}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 animate-scale-in border border-gray-100 dark:border-slate-800 cursor-zoom-in"
                style={{ animationDelay: `${(i % 12) * 0.03}s` }}
              >
                <OptimizedImage src={photo.image} alt={photo.title || `Фото ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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

      {/* Lightbox (через портал — zoom, лічильник, підписи, мініатюри, swipe) */}
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Zoom, Counter, Captions, ...(photos.length > 1 ? [Thumbnails] : [])]}
        counter={{ container: { style: { top: 'unset', bottom: 0, left: 0 } } }}
        carousel={{ finite: photos.length <= 1, padding: 0 }}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        thumbnails={{ width: 90, height: 64, borderRadius: 12, padding: 4, gap: 10 }}
        styles={{
          container: { backgroundColor: 'rgba(8, 12, 24, 0.96)', backdropFilter: 'blur(8px)' },
          slide: { padding: '16px' },
        }}
        animation={{ swipe: 350 }}
        controller={{ closeOnBackdropClick: true }}
        render={photos.length <= 1 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
      />
    </div>
  );
}
