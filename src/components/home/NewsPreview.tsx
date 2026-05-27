import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsCard } from '@/components/news/NewsCard';
import { useNewsList } from '@/hooks/useApi';

export function NewsPreview() {
  const { data, isLoading } = useNewsList({ page: 1 });
  const items = data?.results.slice(0, 6) || [];

  return (
    <section className="container py-12 md:py-16">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-1">
            Останні новини 📰
          </h2>
          <p className="text-muted-foreground">Що нового у нашому садочку</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/news">
            Усі новини <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Поки немає новин</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
