import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RichContent } from '@/components/common/RichContent';
import { useCircle } from '@/hooks/useApi';
import { NotFoundPage } from '../NotFoundPage';

export function CircleDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useCircle(slug);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  return (
    <>
      <Seo title={data.name} />

      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}cc)` }}
      >
        <div className="absolute inset-0 bg-clouds opacity-30" />
        <div className="container relative py-12 text-white">
          <Button asChild variant="ghost" size="sm" className="mb-4 text-white hover:bg-white/20">
            <Link to="/circles"><ArrowLeft className="h-4 w-4" /> До усіх гуртків</Link>
          </Button>
          <div className="flex items-start gap-4">
            <i className={`${data.icon} text-6xl drop-shadow-lg`} aria-hidden />
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">{data.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-white/90">
                {data.leader && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" /> {data.leader}
                  </span>
                )}
                {data.age_group && (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> {data.age_group}
                  </span>
                )}
                {data.schedule && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {data.schedule}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {data.goal && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-2xl font-bold mb-3">🎯 Мета та завдання</h2>
                <RichContent content={data.goal} />
              </CardContent>
            </Card>
          )}

          {data.description && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-2xl font-bold mb-3">Опис діяльності</h2>
                <RichContent content={data.description} />
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
          {data.album_slug && (
            <Card>
              <CardContent className="p-6 text-center">
                <ImageIcon className="h-10 w-10 mx-auto text-primary mb-3" />
                <h3 className="font-display font-bold text-lg mb-2">Фотоальбом</h3>
                <p className="text-sm text-muted-foreground mb-4">Подивіться на фото з гуртка</p>
                <Button asChild variant="gradient" size="sm">
                  <Link to={`/gallery/album/${data.album_slug}`}>Відкрити альбом</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
