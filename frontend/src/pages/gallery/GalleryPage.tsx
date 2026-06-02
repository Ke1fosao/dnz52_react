import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Calendar, Filter } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Pagination } from '@/components/common/Pagination';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useAlbums, useGalleryCategories } from '@/hooks/useApi';
import { formatDate, cn } from '@/lib/utils';

const PAGE_SIZE = 12;

export function GalleryPage() {
  const [activeCat, setActiveCat] = useState<string>('all'); // 'all' або slug категорії
  const [page, setPage] = useState(1);

  const { data: categories } = useGalleryCategories();
  const { data, isLoading } = useAlbums({
    page,
    category__slug: activeCat === 'all' ? undefined : activeCat,
  });

  const totalAlbums = categories?.reduce((s, c) => s + c.albums_count, 0) ?? 0;

  const selectCat = (slug: string) => {
    setActiveCat(slug);
    setPage(1);
  };

  return (
    <div className="mesh-bg-gallery min-h-screen pb-16 -mt-24 md:-mt-28 pt-28 md:pt-32 animate-page-fade-in">
      <Seo title="Фотогалерея" description="Фотоальбоми закладу дошкільної освіти №52 — свята, заняття, життя груп" />

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Заголовок */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl mb-5 shadow-lg shadow-blue-500/30 -rotate-6">
            <ImageIcon size={32} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Фотогалерея</h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 font-medium">Моменти, які залишаються в серці</p>
        </div>

        {/* Капсули-фільтри — переносяться на новий рядок, ніколи не вилазять */}
        <div className="flex flex-wrap justify-center gap-2.5 md:gap-3 mb-10 px-1">
          <FilterPill label="Усі альбоми" count={totalAlbums} active={activeCat === 'all'} onClick={() => selectCat('all')} />
          {categories?.map(cat => (
            <FilterPill key={cat.id} label={cat.name} count={cat.albums_count} active={activeCat === cat.slug} onClick={() => selectCat(cat.slug)} />
          ))}
        </div>

        {/* Сітка альбомів */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-200/60 dark:bg-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : !data || data.results.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
              <Filter size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">У цій категорії поки немає альбомів</h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.results.map((album, idx) => (
                <Link
                  key={album.id}
                  to={`/gallery/album/${album.slug}`}
                  className="group animate-scale-in"
                  style={{ animationDelay: `${(idx % 8) * 0.05}s` }}
                >
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-md bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                    <OptimizedImage src={album.cover} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <ImageIcon size={12} /> {album.photos_count} фото
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <h3 className="text-xl font-extrabold text-white mb-1 drop-shadow-md line-clamp-2">{album.title}</h3>
                      <p className="text-xs text-gray-300 font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Calendar size={12} /> {formatDate(album.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.count} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 border shadow-sm hover:-translate-y-1 shrink-0',
        active
          ? 'bg-blue-500 border-blue-500 text-white shadow-blue-500/25'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500',
      )}
    >
      {label}
      <span className={cn('text-[10px] px-2 py-0.5 rounded-full', active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400')}>
        {count}
      </span>
    </button>
  );
}
