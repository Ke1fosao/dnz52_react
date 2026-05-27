import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { AlbumCard } from '@/components/gallery/AlbumCard';
import { useAlbums, useGalleryCategories } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

export function GalleryPage() {
  const { slug: categorySlug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const { data: categories } = useGalleryCategories();
  const { data, isLoading } = useAlbums({ page, category__slug: categorySlug });
  const currentCategory = categorySlug ? categories?.find(c => c.slug === categorySlug) : null;

  return (
    <>
      <Seo title={currentCategory ? `Галерея: ${currentCategory.name}` : 'Галерея'} />
      <PageHero
        title="Фотогалерея"
        subtitle="Моменти, які залишаються в серці"
        icon="🖼️"
        variant="sky"
      />

      {categories && categories.length > 0 && (
        <div className="container pt-8">
          <div className="flex flex-wrap gap-2">
            <Link to="/gallery">
              <button className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold transition-all',
                !categorySlug
                  ? 'bg-gradient-primary text-white shadow-soft'
                  : 'bg-muted hover:bg-primary-50 text-foreground'
              )}>
                Усі альбоми
              </button>
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} to={`/gallery/category/${cat.slug}`}>
                <button
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2',
                    categorySlug === cat.slug
                      ? 'shadow-soft text-white'
                      : 'bg-muted hover:opacity-80 text-foreground',
                  )}
                  style={categorySlug === cat.slug ? { background: cat.color } : undefined}
                >
                  <i className={cat.icon} aria-hidden />
                  {cat.name}
                  <span className="text-xs opacity-75">({cat.albums_count})</span>
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="container py-10">
        {isLoading ? (
          <Spinner />
        ) : !data || data.results.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-16 w-16" />}
            title="Поки немає альбомів"
            description="Слідкуйте за новинами — ми регулярно додаємо нові фотоальбоми"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.results.map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.count} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
