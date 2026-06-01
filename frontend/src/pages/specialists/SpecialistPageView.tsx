import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, GraduationCap, Quote } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage, PhotoGalleryLightbox } from '@/components/common/ZoomableImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpecialistPage } from '@/hooks/useApi';
import { NotFoundPage } from '../NotFoundPage';
import type { SpecialistPageType, SpecialistPageSection } from '@/types';

const PAGE_THEMES: Record<SpecialistPageType, { emoji: string; gradient: string }> = {
  methodical: { emoji: '📚', gradient: 'from-primary to-primary-700' },
  physical: { emoji: '🤸', gradient: 'from-green-500 to-emerald-700' },
  music: { emoji: '🎵', gradient: 'from-purple-500 to-pink-600' },
  psychologist: { emoji: '🧠', gradient: 'from-secondary to-secondary-700' },
  medical: { emoji: '⚕️', gradient: 'from-red-400 to-pink-500' },
};

const ACCENT_COLORS: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
};

export function SpecialistPageView() {
  const { pageType = '' } = useParams<{ pageType: SpecialistPageType }>();
  const { data, isLoading, isError } = useSpecialistPage(pageType as SpecialistPageType);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const theme = PAGE_THEMES[data.page_type] || PAGE_THEMES.methodical;

  return (
    <>
      <Seo title={data.title} description={data.intro} />

      <section className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} text-white`}>
        <div className="absolute inset-0 bg-clouds opacity-30" />
        <div className="container relative py-12 md:py-16">
          <Button asChild variant="ghost" size="sm" className="mb-4 text-white hover:bg-white/20">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> На головну</Link>
          </Button>
          <div className="flex items-start gap-4">
            <div className="text-6xl drop-shadow-lg">{theme.emoji}</div>
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">{data.title}</h1>
              {data.intro && <p className="text-lg text-white/90 max-w-2xl">{data.intro}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10 space-y-10">
        {data.specialists.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Наші фахівці</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.specialists.map(s => (
                <Card key={s.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {s.photo ? (
                      <ZoomableImage
                        src={s.photo}
                        alt={s.full_name}
                        zoomTitle={s.full_name}
                        zoomDescription={s.position}
                        loading="lazy"
                        wrapperClassName="w-full aspect-square overflow-hidden"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full aspect-square bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-7xl`}>
                        {theme.emoji}
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-display font-bold text-lg mb-1">{s.full_name}</h3>
                      <p className="text-sm text-primary-600 font-semibold mb-2">{s.position}</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {s.education && <p><strong>Освіта:</strong> {s.education}</p>}
                        {s.experience && <p><strong>Стаж:</strong> {s.experience}</p>}
                        {s.category && <p><strong>Категорія:</strong> {s.category}</p>}
                      </div>
                      {s.motto && (
                        <p className="mt-3 pt-3 border-t italic text-sm text-muted-foreground">
                          <Quote className="inline h-3 w-3 mr-1" />
                          {s.motto}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {data.description && (
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: data.description }} />
            </CardContent>
          </Card>
        )}

        {data.theme_title && (
          <Card className="bg-gradient-to-br from-secondary-50 to-primary-50 border-secondary-200">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <GraduationCap className="h-10 w-10 text-secondary-600 shrink-0" />
                <div>
                  <Badge variant="secondary" className="mb-2">{data.theme_period}</Badge>
                  <h3 className="font-display text-xl font-bold mb-2">{data.theme_title}</h3>
                  {data.theme_text && (
                    <p className="text-muted-foreground whitespace-pre-line">{data.theme_text}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data.sections.length > 0 && (
          <section className="space-y-6">
            {data.sections.map(section => (
              <SectionCard key={section.id} section={section} />
            ))}
          </section>
        )}
      </div>
    </>
  );
}

function SectionCard({ section }: { section: SpecialistPageSection }) {
  const accentClass = ACCENT_COLORS[section.accent] || ACCENT_COLORS.primary;
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const photos = section.photos.map(p => ({
    src: p.image,
    title: p.caption || section.title,
    description: section.subtitle,
  }));

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className={`h-14 w-14 rounded-2xl border-2 flex items-center justify-center shrink-0 ${accentClass}`}>
            <i className={`${section.icon} text-2xl`} aria-hidden />
          </div>
          <div>
            <h3 className="font-display text-xl md:text-2xl font-bold mb-1">{section.title}</h3>
            {section.subtitle && (
              <p className="text-sm text-muted-foreground">{section.subtitle}</p>
            )}
          </div>
        </div>

        {section.description && (
          <div className="prose-content mb-4" dangerouslySetInnerHTML={{ __html: section.description }} />
        )}

        {section.kind === 'info' && section.photos.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {section.photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setLightboxIndex(i)}
                  className="aspect-square rounded-2xl shadow-card overflow-hidden group relative cursor-zoom-in"
                >
                  <img
                    src={p.image}
                    alt={p.caption}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
            <PhotoGalleryLightbox
              photos={photos}
              open={lightboxIndex >= 0}
              index={lightboxIndex}
              onClose={() => setLightboxIndex(-1)}
            />
          </>
        )}

        {section.kind === 'event' && section.has_link && (
          <Button asChild variant="gradient" className="mt-2">
            {section.link_url.startsWith('http') ? (
              <a href={section.link_url} target="_blank" rel="noreferrer">
                {section.link_label || 'Переглянути'} <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <Link to={section.link_url}>
                {section.link_label || 'Переглянути'}
              </Link>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
