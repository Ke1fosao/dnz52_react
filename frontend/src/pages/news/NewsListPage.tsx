import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { CardSkeletonGrid } from '@/components/common/CardSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { NewsCard } from '@/components/news/NewsCard';
import { Badge } from '@/components/ui/badge';
import { useNewsList, useNewsCategories } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

export function NewsListPage() {
  const { slug: categorySlug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const { data: categories } = useNewsCategories();
  const { data, isLoading } = useNewsList({
    page,
    category__slug: categorySlug,
  });

  const currentCategory = categorySlug
    ? categories?.find(c => c.slug === categorySlug)
    : null;

  return (
    <>
      <Seo
        title={currentCategory ? `Новини: ${currentCategory.name}` : 'Новини'}
        description="Свіжі новини, оголошення та події закладу дошкільної освіти №52"
      />
      <PageHero
        title={currentCategory ? currentCategory.name : 'Новини та оголошення'}
        subtitle="Будьте в курсі того, що відбувається у нашому садочку"
        icon="📰"
      />

      {categories && categories.length > 0 && (
        <div className="container pt-8">
          <div className="flex flex-wrap gap-2">
            <Link to="/news">
              <Badge
                variant={!categorySlug ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-sm py-2 px-4',
                  !categorySlug && 'bg-gradient-primary text-white',
                )}
              >
                Усі новини
              </Badge>
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} to={`/news/category/${cat.slug}`}>
                <Badge
                  variant={categorySlug === cat.slug ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer text-sm py-2 px-4',
                    categorySlug === cat.slug && 'bg-gradient-primary text-white',
                  )}
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="container py-10">
        {isLoading ? (
          <CardSkeletonGrid count={9} />
        ) : !data || data.results.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="h-16 w-16" />}
            title="Поки немає новин"
            description="Заходьте пізніше — ми регулярно публікуємо новини про життя садочка"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.results.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data.count}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </>
  );
}
