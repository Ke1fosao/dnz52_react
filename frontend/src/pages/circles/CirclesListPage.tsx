import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Clock, ArrowRight, Star, Wallet, Heart } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { EmptyState } from '@/components/common/EmptyState';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useCircles } from '@/hooks/useApi';
import type { CircleListItem } from '@/types';

export function CirclesListPage() {
  const { data: circles, isLoading } = useCircles();

  const allFree = !!circles && circles.length > 0 && circles.every(c => /безкоштов/i.test(c.price || ''));

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <Seo title="Гуртки" description="Творчі та розвиваючі гуртки закладу дошкільної освіти №52 — англійська, танці, малювання, шахи, LEGO та інше." />
      <PageHero title="Гуртки та секції" subtitle="Кожна дитина знайде заняття до душі" icon="🎨" variant="warm" />

      <div className="pb-12">
        {/* Стат-рядок */}
        {circles && circles.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            <StatPill icon={<Sparkles size={16} />} label={`${circles.length} ${plural(circles.length, 'гурток', 'гуртки', 'гуртків')}`} />
            {allFree && <StatPill icon={<Wallet size={16} />} label="Усі заняття безкоштовні" />}
            <StatPill icon={<Heart size={16} />} label="Розвиток через гру" />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-md">
                <div className="h-40 bg-gray-200/60 dark:bg-slate-800/60 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-2/3 bg-gray-200/60 dark:bg-slate-800/60 rounded-full animate-pulse" />
                  <div className="h-4 w-full bg-gray-200/60 dark:bg-slate-800/60 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : !circles || circles.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-12 w-12" />} title="Поки немає гуртків"
            description="Незабаром тут зʼявляться творчі та розвиваючі заняття для малечі" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map((circle, idx) => <CircleCard key={circle.id} circle={circle} idx={idx} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CircleCard({ circle, idx }: { circle: CircleListItem; idx: number }) {
  return (
    <Link
      to={`/circles/${circle.slug}`}
      className="group relative block rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-slate-800 animate-scale-in"
      style={{ animationDelay: `${idx * 0.05}s` }}
    >
      {circle.is_featured && (
        <span className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[11px] font-black px-3 py-1 rounded-full shadow-lg">
          <Star size={12} className="fill-current" /> Популярне
        </span>
      )}

      <div className="h-40 relative overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${circle.color}, ${circle.color}cc)` }}>
        <div className="absolute inset-0 bg-clouds opacity-25" />
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/15 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        {circle.cover ? (
          <>
            <OptimizedImage src={circle.cover} alt={circle.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <i className={`${circle.icon} absolute bottom-3 left-5 text-3xl text-white drop-shadow-lg`} aria-hidden />
          </>
        ) : (
          <i className={`${circle.icon} text-7xl text-white drop-shadow-lg relative group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`} aria-hidden />
        )}
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{circle.name}</h3>
        {circle.tagline && <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-4 line-clamp-2">{circle.tagline}</p>}

        <div className="flex flex-wrap gap-2 mb-5">
          {circle.age_group && <Chip icon={<Users size={13} />} label={circle.age_group} />}
          {circle.schedule && <Chip icon={<Clock size={13} />} label={circle.schedule} />}
        </div>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-bold text-sm group-hover:gap-2.5 transition-all" style={{ color: circle.color }}>
            Детальніше <ArrowRight size={16} />
          </span>
          {circle.price && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{circle.price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Chip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
      {icon} {label}
    </span>
  );
}

function StatPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-4 py-2.5 rounded-full shadow-sm">
      <span className="text-blue-500 dark:text-blue-400">{icon}</span> {label}
    </span>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
