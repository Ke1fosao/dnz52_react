import { Link } from 'react-router-dom';
import { Sparkles, User, Clock, ArrowRight } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useCircles } from '@/hooks/useApi';

export function CirclesListPage() {
  const { data: circles, isLoading } = useCircles();

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <Seo title="Гуртки" description="Творчі та розвиваючі гуртки закладу дошкільної освіти №52" />
      <PageHero title="Гуртки та секції" subtitle="Кожна дитина знайде заняття до душі" icon="🎨" variant="warm" />

      <div className="pb-12">
        {isLoading ? (
          <Spinner />
        ) : !circles || circles.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-16 w-16" />} title="Поки немає гуртків" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map((circle, idx) => (
              <Link
                key={circle.id}
                to={`/circles/${circle.slug}`}
                className="group block rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-slate-800 animate-scale-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="h-36 flex items-center justify-center text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${circle.color}, ${circle.color}cc)` }}>
                  <div className="absolute inset-0 bg-clouds opacity-25" />
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/15 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <i className={`${circle.icon} text-7xl drop-shadow-lg relative group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`} aria-hidden />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{circle.name}</h3>
                  <div className="space-y-2 text-sm font-medium text-gray-500 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-2"><User size={16} className="shrink-0" style={{ color: circle.color }} /> {circle.leader}</div>
                    {circle.age_group && <div className="flex items-center gap-2"><Sparkles size={16} className="shrink-0" style={{ color: circle.color }} /> {circle.age_group}</div>}
                    {circle.schedule && <div className="flex items-center gap-2"><Clock size={16} className="shrink-0" style={{ color: circle.color }} /> {circle.schedule}</div>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-bold text-sm group-hover:gap-2.5 transition-all" style={{ color: circle.color }}>
                    Детальніше <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
