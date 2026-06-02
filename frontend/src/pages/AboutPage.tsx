import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { RichContent } from '@/components/common/RichContent';
import { usePage } from '@/hooks/useApi';

export function AboutPage() {
  const { data, isLoading } = usePage('about');

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <Seo title="Про заклад" description="Інформація про заклад дошкільної освіти №52" />
      <PageHero title={data?.title || 'Про наш заклад'} subtitle="Затишний дім для маленьких сердець" icon="🏡" variant="sky" />

      <div className="pb-12">
        {isLoading ? (
          <PageSpinner />
        ) : data ? (
          <>
            {data.image && (
              <ZoomableImage src={data.image} alt={data.title} zoomTitle={data.title}
                wrapperClassName="w-full aspect-video rounded-[2rem] overflow-hidden shadow-xl mb-8" className="w-full h-full object-cover" />
            )}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 dark:border-slate-800">
              <RichContent content={data.content} />
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 text-center shadow-sm border border-gray-100 dark:border-slate-800">
            <p className="text-gray-500 dark:text-slate-400">Інформація про заклад поки не додана.</p>
          </div>
        )}
      </div>
    </div>
  );
}
