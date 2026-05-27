import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Award, GraduationCap, User } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStaff } from '@/hooks/useApi';

const ACCENT_GRADIENTS: Record<string, string> = {
  primary: 'from-primary to-primary-700',
  success: 'from-green-500 to-emerald-600',
  warning: 'from-amber-400 to-orange-500',
  danger: 'from-red-400 to-pink-500',
  info: 'from-secondary to-secondary-700',
  purple: 'from-purple-500 to-pink-500',
};

export function StaffPage() {
  const { data: staff, isLoading } = useStaff();

  const featured = staff?.find(s => s.is_featured);
  const others = staff?.filter(s => !s.is_featured) || [];

  return (
    <>
      <Seo title="Керівництво" description="Адміністрація та керівний склад закладу дошкільної освіти №52" />
      <PageHero
        title="Керівництво"
        subtitle="Команда професіоналів, що дбає про ваших дітей"
        icon="👤"
      />

      <div className="container py-10 max-w-6xl">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {featured && (
              <Card className="mb-8 overflow-hidden border-2 border-primary-200">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-3 gap-0">
                    <div className={`bg-gradient-to-br ${ACCENT_GRADIENTS[featured.accent_color] || ACCENT_GRADIENTS.primary} aspect-square md:aspect-auto flex items-center justify-center text-white overflow-hidden`}>
                      {featured.photo ? (
                        <ZoomableImage
                          src={featured.photo}
                          alt={featured.full_name}
                          zoomTitle={featured.full_name}
                          zoomDescription={featured.position}
                          wrapperClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-32 w-32 opacity-80" />
                      )}
                    </div>
                    <div className="md:col-span-2 p-6 md:p-10">
                      <Badge variant="default" className="mb-3">⭐ Директор</Badge>
                      <h2 className="font-display text-2xl md:text-3xl font-bold mb-1">{featured.full_name}</h2>
                      <p className="text-primary-600 font-semibold mb-4">{featured.position}</p>

                      <div className="space-y-2 text-sm mb-4">
                        {featured.education && <p><strong>Освіта:</strong> {featured.education}</p>}
                        {featured.experience && <p><strong>Стаж:</strong> {featured.experience}</p>}
                        {featured.category && <p><strong>Категорія:</strong> {featured.category}</p>}
                      </div>

                      {featured.awards_list.length > 0 && (
                        <div className="mb-4">
                          <p className="font-semibold flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4" /> Нагороди:
                          </p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {featured.awards_list.map((a, i) => <li key={i}>• {a}</li>)}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm">
                        {featured.email && (
                          <a href={`mailto:${featured.email}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Mail className="h-4 w-4" /> {featured.email}
                          </a>
                        )}
                        {featured.phone && (
                          <a href={`tel:${featured.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone className="h-4 w-4" /> {featured.phone}
                          </a>
                        )}
                        {featured.reception_hours && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" /> {featured.reception_hours}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map(m => (
                <Card key={m.id} className="overflow-hidden hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-br ${ACCENT_GRADIENTS[m.accent_color] || ACCENT_GRADIENTS.primary} aspect-square flex items-center justify-center text-white overflow-hidden`}>
                      {m.photo ? (
                        <ZoomableImage
                          src={m.photo}
                          alt={m.full_name}
                          zoomTitle={m.full_name}
                          zoomDescription={m.position}
                          wrapperClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-24 w-24 opacity-80" />
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-bold text-lg mb-1">{m.full_name}</h3>
                      <p className="text-sm text-primary-600 font-semibold mb-3">{m.position}</p>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {m.education && <p className="flex items-start gap-1"><GraduationCap className="h-3 w-3 mt-0.5 shrink-0" /> {m.education}</p>}
                        {m.experience && <p>{m.experience}</p>}
                      </div>

                      {m.detail_url && (
                        <Link to={m.detail_url} className="inline-block mt-3 text-sm text-primary-600 hover:underline font-semibold">
                          Детальніше →
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
