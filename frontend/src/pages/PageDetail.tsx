import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage, PhotoGalleryLightbox } from '@/components/common/ZoomableImage';
import { RichContent } from '@/components/common/RichContent';
import { usePage } from '@/hooks/useApi';
import { NotFoundPage } from './NotFoundPage';

export function PageDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = usePage(slug);
  const [galleryIdx, setGalleryIdx] = useState(-1);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  return (
    <>
      <Seo title={data.title} image={data.image || undefined} />
      <PageHero title={data.title} variant="soft" />

      <article className="container max-w-4xl py-10">
        {data.image && (
          <ZoomableImage
            src={data.image}
            alt={data.title}
            zoomTitle={data.title}
            wrapperClassName="w-full aspect-video rounded-3xl overflow-hidden shadow-soft-lg mb-8"
            className="w-full h-full object-cover"
          />
        )}
        <RichContent content={data.content} />

        {data.images.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
              {data.images.map((img, i) => (
                <figure key={img.id} className="rounded-2xl overflow-hidden shadow-card">
                  <button
                    onClick={() => setGalleryIdx(i)}
                    className="w-full block cursor-zoom-in group"
                  >
                    <img
                      src={img.image}
                      alt={img.caption}
                      loading="lazy"
                      className="aspect-square object-cover w-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </button>
                  {img.caption && (
                    <figcaption className="p-3 text-xs text-muted-foreground">{img.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
            <PhotoGalleryLightbox
              photos={data.images.map(img => ({ src: img.image, title: img.caption }))}
              open={galleryIdx >= 0}
              index={galleryIdx}
              onClose={() => setGalleryIdx(-1)}
            />
          </>
        )}
      </article>
    </>
  );
}
