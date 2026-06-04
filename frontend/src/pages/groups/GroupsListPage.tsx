import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { EmptyState } from '@/components/common/EmptyState';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useGroups } from '@/hooks/useApi';
import { stripQuotes } from '@/lib/utils';

const AGE_EMOJIS: Record<string, string> = {
  nursery: '🧸', junior: '🌱', middle: '🌟', senior: '🚀', school: '🎓',
};

export function GroupsListPage() {
  const { data: groups, isLoading } = useGroups();

  return (
    <div className="mesh-bg-gallery min-h-screen -mt-24 md:-mt-28 pt-24 md:pt-28 pb-4 animate-page-fade-in">
      <Seo title="Групи" description="Усі вікові групи закладу дошкільної освіти №52" />
      <div className="container mx-auto px-4 max-w-7xl">
      <PageHero title="Наші групи" subtitle="П'ять вікових категорій — від ясельної до підготовчої" icon="👶" />

      <div className="pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[2rem] overflow-hidden premium-glass">
                <div className="aspect-[16/10] bg-gray-200/50 dark:bg-slate-800/50 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-2/3 bg-gray-200/50 dark:bg-slate-800/50 rounded-full animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200/50 dark:bg-slate-800/50 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : !groups || groups.length === 0 ? (
          <EmptyState icon={<Users className="h-16 w-16" />} title="Поки немає інформації про групи" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, idx) => (
              <Link
                key={group.id}
                to={`/groups/${group.slug}`}
                className="group block rounded-[2rem] overflow-hidden premium-glass hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="aspect-[16/10] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${group.color}55, ${group.color}aa)` }}>
                  {group.cover ? (
                    <OptimizedImage src={group.cover} alt={group.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
                      {AGE_EMOJIS[group.age_group] || '👶'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {group.age_group_display && (
                    <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-xs font-black text-white backdrop-blur-md shadow-lg flex items-center gap-1.5" style={{ background: `${group.color}dd` }}>
                      <span>{AGE_EMOJIS[group.age_group]}</span> {group.age_group_display}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{group.name}</h3>
                  {group.motto && <p className="text-sm text-gray-500 dark:text-slate-400 italic font-medium mb-4 line-clamp-2">«{stripQuotes(group.motto)}»</p>}
                  <span className="inline-flex items-center gap-1.5 font-bold text-sm group-hover:gap-2.5 transition-all" style={{ color: group.color }}>
                    Дізнатися більше <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
