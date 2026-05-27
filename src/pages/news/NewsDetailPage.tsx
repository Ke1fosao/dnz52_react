import { useParams, Link } from 'react-router-dom';
import { Calendar, Eye, ArrowLeft, Tag } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNewsDetail } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';
import { NotFoundPage } from '../NotFoundPage';

export function NewsDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useNewsDetail(slug);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  return (
    <>
      <Seo title={data.title} description={data.title} image={data.image || undefined} />

      <article className="container max-w-4xl py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/news">
            <ArrowLeft className="h-4 w-4" /> До усіх новин
          </Link>
        </Button>

        {data.image && (
          <ZoomableImage
            src={data.image}
            alt={data.title}
            zoomTitle={data.title}
            wrapperClassName="aspect-video rounded-3xl overflow-hidden mb-6 shadow-soft-lg"
            className="w-full h-full object-cover"
          />
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(data.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {data.views} переглядів
          </span>
          {data.category && (
            <Link to={`/news/category/${data.category.slug}`}>
              <Badge>
                <Tag className="h-3 w-3 mr-1" />
                {data.category.name}
              </Badge>
            </Link>
          )}
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight">
          {data.title}
        </h1>

        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: data.content }}
        />
      </article>
    </>
  );
}
