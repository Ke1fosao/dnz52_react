import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAlbum } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';
import { NotFoundPage } from '../NotFoundPage';

export function AlbumDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useAlbum(slug);
  const [index, setIndex] = useState<number>(-1);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const slides = data.photos.map(p => ({
    src: p.image,
    title: p.title,
    description: p.description,
  }));

  return (
    <>
      <Seo title={data.title} description={data.description} image={data.cover} />

      <div className="container py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/gallery">
            <ArrowLeft className="h-4 w-4" /> До галереї
          </Link>
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {data.category && (
              <Badge style={{ background: data.category.color, color: 'white' }}>
                {data.category.name}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(data.created_at)}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{data.title}</h1>
          {data.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">{data.description}</p>
          )}
        </div>

        {data.photos.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">В альбомі поки немає фотографій</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setIndex(i)}
                className="group relative aspect-square overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-all"
              >
                <img
                  src={photo.image}
                  alt={photo.title || `Фото ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        carousel={{ finite: true }}
        render={slides.length <= 1
          ? { buttonPrev: () => null, buttonNext: () => null }
          : undefined}
      />
    </>
  );
}
