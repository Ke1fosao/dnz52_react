import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, FileText, Image, Users, Sparkles, GraduationCap, Newspaper } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useApi';
import { stripHtml, truncate } from '@/lib/utils';
import type { SearchResultType } from '@/types';

const TYPE_META: Record<SearchResultType, {
  icon: React.ReactNode;
  label: string;
  pathPrefix: (slug: string) => string;
}> = {
  news: { icon: <Newspaper className="h-4 w-4" />, label: 'Новина', pathPrefix: s => `/news/${s}` },
  page: { icon: <FileText className="h-4 w-4" />, label: 'Сторінка', pathPrefix: s => `/page/${s}` },
  group: { icon: <Users className="h-4 w-4" />, label: 'Група', pathPrefix: s => `/groups/${s}` },
  circle: { icon: <Sparkles className="h-4 w-4" />, label: 'Гурток', pathPrefix: s => `/circles/${s}` },
  specialist: { icon: <GraduationCap className="h-4 w-4" />, label: 'Спеціаліст', pathPrefix: s => `/specialists/${s}` },
  document: { icon: <FileText className="h-4 w-4" />, label: 'Документ', pathPrefix: () => `/documents` },
};

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { data, isLoading } = useSearch(q);

  return (
    <>
      <Seo title={`Пошук: ${q}`} />
      <PageHero
        title="Пошук"
        subtitle={q ? `Результати за запитом «${q}»` : 'Введіть запит для пошуку'}
        icon="🔍"
        variant="soft"
      />

      <div className="container py-10 max-w-4xl">
        {!q || q.length < 2 ? (
          <EmptyState
            icon={<SearchIcon className="h-16 w-16" />}
            title="Введіть запит"
            description="Мінімум 2 символи для початку пошуку"
          />
        ) : isLoading ? (
          <Spinner />
        ) : !data || data.results.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-16 w-16" />}
            title="Нічого не знайдено"
            description="Спробуйте інший запит або перевірте написання"
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Знайдено результатів: <strong>{data.count}</strong>
            </p>
            <div className="space-y-3">
              {data.results.map((result, i) => {
                const meta = TYPE_META[result.type];
                return (
                  <Card key={`${result.type}-${result.slug}-${i}`} className="hover:shadow-card-hover transition-shadow">
                    <Link to={meta.pathPrefix(result.slug)}>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default">
                            {meta.icon}
                            <span className="ml-1">{meta.label}</span>
                          </Badge>
                        </div>
                        <h3 className="font-display font-bold mb-1">{result.title}</h3>
                        {result.excerpt && (
                          <p className="text-sm text-muted-foreground">
                            {truncate(stripHtml(result.excerpt), 200)}
                          </p>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
