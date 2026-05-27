import { Link } from 'react-router-dom';
import { Sparkles, User, Clock, ArrowRight } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { useCircles } from '@/hooks/useApi';

export function CirclesListPage() {
  const { data: circles, isLoading } = useCircles();

  return (
    <>
      <Seo title="Гуртки" description="Творчі та розвиваючі гуртки закладу дошкільної освіти №52" />
      <PageHero
        title="Гуртки та секції"
        subtitle="Кожна дитина знайде заняття до душі"
        icon="🎨"
        variant="warm"
      />

      <div className="container py-10">
        {isLoading ? (
          <Spinner />
        ) : !circles || circles.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-16 w-16" />}
            title="Поки немає гуртків"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map(circle => (
              <Card
                key={circle.id}
                className="group hover:shadow-card-hover hover:-translate-y-1 transition-all overflow-hidden"
              >
                <Link to={`/circles/${circle.slug}`}>
                  <div
                    className="h-32 flex items-center justify-center text-white relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${circle.color}, ${circle.color}dd)` }}
                  >
                    <div className="absolute inset-0 bg-clouds opacity-30" />
                    <i className={`${circle.icon} text-6xl drop-shadow-lg relative`} aria-hidden />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary-700 transition-colors">
                      {circle.name}
                    </h3>
                    <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0" />
                        <span>{circle.leader}</span>
                      </div>
                      {circle.age_group && (
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 shrink-0" />
                          <span>{circle.age_group}</span>
                        </div>
                      )}
                      {circle.schedule && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{circle.schedule}</span>
                        </div>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                      Детальніше <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
