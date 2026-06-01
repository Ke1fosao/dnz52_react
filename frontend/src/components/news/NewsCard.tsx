import { Link } from 'react-router-dom';
import { Calendar, Eye, ArrowRight, Newspaper } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { formatDate } from '@/lib/utils';
import type { NewsListItem } from '@/types';

export function NewsCard({ item }: { item: NewsListItem }) {
  return (
    <Card className="group overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all">
      <Link to={`/news/${item.slug}`} className="block">
        <div className="aspect-video overflow-hidden bg-muted relative">
          {item.image ? (
            <OptimizedImage
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-sky flex items-center justify-center">
              <Newspaper className="h-16 w-16 text-white/80" />
            </div>
          )}
          {item.category && (
            <Badge className="absolute top-3 left-3 shadow-soft">
              {item.category.name}
            </Badge>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(item.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {item.views}
            </span>
          </div>

          <h3 className="font-display font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {item.excerpt}
          </p>
          <span className="inline-flex items-center gap-1 text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
            Читати далі <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
