import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/ui/card';
import { useGroups } from '@/hooks/useApi';

const AGE_EMOJIS: Record<string, string> = {
  nursery: '🧸',
  junior: '🌱',
  middle: '🌟',
  senior: '🚀',
  school: '🎓',
};

export function GroupsListPage() {
  const { data: groups, isLoading } = useGroups();

  return (
    <>
      <Seo title="Групи" description="Усі вікові групи закладу дошкільної освіти №52" />
      <PageHero
        title="Наші групи"
        subtitle="П'ять вікових категорій — від ясельної до підготовчої"
        icon="👶"
      />

      <div className="container py-10">
        {isLoading ? (
          <Spinner />
        ) : !groups || groups.length === 0 ? (
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="Поки немає інформації про групи"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <Card
                key={group.id}
                className="group overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all"
              >
                <Link to={`/groups/${group.slug}`}>
                  <div
                    className="aspect-[16/10] relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${group.color}40, ${group.color}80)` }}
                  >
                    {group.cover ? (
                      <img
                        src={group.cover}
                        alt={group.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl drop-shadow-md">
                        {AGE_EMOJIS[group.age_group] || '👶'}
                      </div>
                    )}
                    <div
                      className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur shadow-soft"
                      style={{ background: group.color }}
                    >
                      {AGE_EMOJIS[group.age_group]} {group.age_group_display}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary-700 transition-colors">
                      {group.name}
                    </h3>
                    {group.motto && (
                      <p className="text-sm text-muted-foreground italic mb-3">«{group.motto}»</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                      Дізнатися більше <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
