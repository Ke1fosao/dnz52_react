import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, GraduationCap, Calendar, Quote, Image as ImageIcon } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGroup } from '@/hooks/useApi';
import { NotFoundPage } from '../NotFoundPage';

const AGE_EMOJIS: Record<string, string> = {
  nursery: '🧸', junior: '🌱', middle: '🌟', senior: '🚀', school: '🎓',
};

export function GroupDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useGroup(slug);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const teachers = data.staff.filter(s => s.role === 'teacher');
  const assistants = data.staff.filter(s => s.role === 'assistant');

  return (
    <>
      <Seo title={data.name} description={data.motto || data.description} />

      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}cc)` }}
      >
        <div className="absolute inset-0 bg-clouds opacity-30" />
        <div className="container relative py-12 md:py-16 text-white">
          <Button asChild variant="ghost" size="sm" className="mb-4 text-white hover:bg-white/20">
            <Link to="/groups"><ArrowLeft className="h-4 w-4" /> До усіх груп</Link>
          </Button>
          <div className="flex items-start gap-4">
            <div className="text-6xl drop-shadow-lg">{AGE_EMOJIS[data.age_group] || '👶'}</div>
            <div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur mb-2">
                {data.age_group_display}
              </Badge>
              <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">{data.name}</h1>
              {data.motto && (
                <p className="text-lg md:text-xl italic text-white/90 max-w-2xl">«{data.motto}»</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {data.cover && (
            <ZoomableImage
              src={data.cover}
              alt={data.name}
              zoomTitle={data.name}
              zoomDescription={data.motto}
              wrapperClassName="w-full aspect-video rounded-3xl overflow-hidden shadow-soft-lg"
              className="w-full h-full object-cover"
            />
          )}

          {data.description && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-2xl font-bold mb-3">Про групу</h2>
                <div className="prose-content whitespace-pre-line">{data.description}</div>
              </CardContent>
            </Card>
          )}

          {teachers.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                Вихователі
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {teachers.map(s => <StaffCard key={s.id} staff={s} accent={data.color} />)}
              </div>
            </div>
          )}

          {assistants.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <User className="h-6 w-6 text-secondary" />
                Помічники вихователя
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {assistants.map(s => <StaffCard key={s.id} staff={s} accent={data.color} />)}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {data.album_slug && (
            <Card>
              <CardContent className="p-6 text-center">
                <ImageIcon className="h-10 w-10 mx-auto text-primary mb-3" />
                <h3 className="font-display font-bold text-lg mb-2">Фотоальбом групи</h3>
                <p className="text-sm text-muted-foreground mb-4">Подивіться фото з життя нашої групи</p>
                <Button asChild variant="gradient" size="sm">
                  <Link to={`/gallery/album/${data.album_slug}`}>Відкрити альбом</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-soft border-primary-100">
            <CardContent className="p-6">
              <h3 className="font-display font-bold mb-3">Вікова категорія</h3>
              <div className="flex items-center gap-3 text-3xl">
                <span>{AGE_EMOJIS[data.age_group] || '👶'}</span>
                <span className="font-semibold text-base text-foreground">{data.age_group_display}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function StaffCard({ staff, accent }: { staff: import('@/types').GroupStaff; accent: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-4 p-5">
          {staff.photo ? (
            <ZoomableImage
              src={staff.photo}
              alt={staff.full_name}
              zoomTitle={staff.full_name}
              zoomDescription={staff.role_display}
              wrapperClassName="h-20 w-20 rounded-2xl overflow-hidden shadow-soft shrink-0"
              className="w-full h-full object-cover"
              showHint={false}
            />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ background: accent }}
            >
              {staff.full_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-display font-bold leading-tight mb-1">{staff.full_name}</h4>
            <p className="text-xs text-muted-foreground mb-2">{staff.role_display}</p>
            {staff.experience && (
              <p className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {staff.experience}
              </p>
            )}
          </div>
        </div>
        {staff.motto && (
          <div className="px-5 pb-5 -mt-2">
            <p className="text-sm italic text-muted-foreground border-l-2 pl-3" style={{ borderColor: accent }}>
              <Quote className="inline h-3 w-3 mr-1" />
              {staff.motto}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
