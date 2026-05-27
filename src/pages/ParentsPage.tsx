import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { ZoomableImage, PhotoGalleryLightbox } from '@/components/common/ZoomableImage';
import { Card, CardContent } from '@/components/ui/card';
import {
  useParentsAnnouncements, useParentsDocuments,
  useParentsAdaptation, useParentsEnrollment, useParentsSamples,
} from '@/hooks/useApi';

const ACCENT_BG: Record<string, string> = {
  primary: 'bg-primary-50 border-primary-200 text-primary-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  danger: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-secondary-50 border-secondary-200 text-secondary-700',
  secondary: 'bg-muted border-border text-foreground',
};

export function ParentsPage() {
  const { data: announcements } = useParentsAnnouncements();
  const { data: documents } = useParentsDocuments();
  const { data: adaptation } = useParentsAdaptation();
  const { data: enrollment } = useParentsEnrollment();
  const { data: samples } = useParentsSamples();

  const [adaptationIdx, setAdaptationIdx] = useState(-1);
  const [samplesIdx, setSamplesIdx] = useState(-1);

  const isLoading = !announcements && !documents;

  return (
    <>
      <Seo title="Батькам" description="Інформація для батьків наших вихованців" />
      <PageHero
        title="Сторінка для батьків"
        subtitle="Усе, що варто знати про наш садочок"
        icon="👨‍👩‍👧"
        variant="warm"
      />

      <div className="container py-10 max-w-5xl space-y-10">
        {isLoading && <Spinner />}

        {announcements && announcements.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">📢 Оголошення</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {announcements.map(a => (
                <Card key={a.id} className="overflow-hidden">
                  {a.link ? (
                    <a href={a.link} target="_blank" rel="noreferrer" className="block hover:opacity-90 transition-opacity">
                      <img src={a.image} alt={a.title} className="w-full aspect-video object-cover" />
                      {a.title && <div className="p-3 font-semibold">{a.title}</div>}
                    </a>
                  ) : (
                    <>
                      <ZoomableImage
                        src={a.image}
                        alt={a.title}
                        zoomTitle={a.title}
                        wrapperClassName="w-full aspect-video overflow-hidden"
                        className="w-full h-full object-cover"
                      />
                      {a.title && <div className="p-3 font-semibold">{a.title}</div>}
                    </>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {documents && documents.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">📄 Корисні документи</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {documents.map(doc => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target={doc.link_type === 'external' ? '_blank' : undefined}
                  rel="noreferrer"
                  className={`group block p-5 rounded-2xl border-2 hover:shadow-card-hover hover:-translate-y-0.5 transition-all ${ACCENT_BG[doc.accent] || ACCENT_BG.primary}`}
                >
                  <div className="flex items-start gap-3">
                    <i className={`${doc.icon} text-3xl shrink-0`} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold mb-1 group-hover:underline">{doc.title}</div>
                      {doc.description && <p className="text-sm opacity-90">{doc.description}</p>}
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-50 shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {enrollment && enrollment.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">📋 Документи для зарахування</h2>
            <Card>
              <CardContent className="p-6">
                <ol className="space-y-3">
                  {enrollment.map((doc, i) => (
                    <li key={doc.id} className="flex gap-3 items-start">
                      <span className="h-8 w-8 rounded-full bg-gradient-primary text-white font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-semibold">{doc.title}</div>
                        {doc.note && <div className="text-xs text-muted-foreground mt-0.5">{doc.note}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>
        )}

        {samples && samples.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">📝 Зразки заяв</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {samples.map((s, i) => (
                <figure key={s.id} className="rounded-2xl overflow-hidden bg-card shadow-card">
                  <button
                    onClick={() => setSamplesIdx(i)}
                    className="w-full block cursor-zoom-in group"
                  >
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full aspect-[4/5] object-contain bg-muted group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                  <figcaption className="p-4">
                    <div className="font-display font-bold">{s.title}</div>
                    {s.caption && <p className="text-xs text-muted-foreground mt-1">{s.caption}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
            <PhotoGalleryLightbox
              photos={samples.map(s => ({ src: s.image, title: s.title, description: s.caption }))}
              open={samplesIdx >= 0}
              index={samplesIdx}
              onClose={() => setSamplesIdx(-1)}
            />
          </section>
        )}

        {adaptation && adaptation.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">🤗 Адаптація дітей у садочку</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {adaptation.map((p, i) => (
                <figure key={p.id} className="rounded-2xl overflow-hidden shadow-card">
                  <button
                    onClick={() => setAdaptationIdx(i)}
                    className="w-full block cursor-zoom-in group"
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </button>
                  {p.title && <figcaption className="p-3 text-xs text-center">{p.title}</figcaption>}
                </figure>
              ))}
            </div>
            <PhotoGalleryLightbox
              photos={adaptation.map(p => ({ src: p.image, title: p.title }))}
              open={adaptationIdx >= 0}
              index={adaptationIdx}
              onClose={() => setAdaptationIdx(-1)}
            />
          </section>
        )}
      </div>
    </>
  );
}
