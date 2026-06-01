import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { RichContent } from '@/components/common/RichContent';
import { Card, CardContent } from '@/components/ui/card';
import { usePage } from '@/hooks/useApi';

export function AboutPage() {
  const { data, isLoading } = usePage('about');

  return (
    <>
      <Seo title="Про заклад" description="Інформація про заклад дошкільної освіти №52" />
      <PageHero
        title={data?.title || 'Про наш заклад'}
        subtitle="Затишний дім для маленьких сердець"
        icon="🏡"
        variant="sky"
      />

      <div className="container max-w-4xl py-10">
        {isLoading ? (
          <PageSpinner />
        ) : data ? (
          <>
            {data.image && (
              <ZoomableImage
                src={data.image}
                alt={data.title}
                zoomTitle={data.title}
                wrapperClassName="w-full aspect-video rounded-3xl overflow-hidden shadow-soft-lg mb-8"
                className="w-full h-full object-cover"
              />
            )}
            <Card>
              <CardContent className="p-6 md:p-10">
                <RichContent content={data.content} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">Інформація про заклад поки не додана.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
