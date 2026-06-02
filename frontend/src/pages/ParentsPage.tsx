import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { ZoomableImage, PhotoGalleryLightbox } from '@/components/common/ZoomableImage';
import {
  useParentsAnnouncements, useParentsDocuments,
  useParentsAdaptation, useParentsEnrollment, useParentsSamples,
} from '@/hooks/useApi';

// Тіньовані акценти для карток-посилань — світла та темна теми
const ACCENT_BG: Record<string, string> = {
  primary: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/60 dark:text-blue-300',
  success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800/60 dark:text-green-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/60 dark:text-amber-300',
  danger: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/60 dark:text-red-300',
  info: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800/60 dark:text-cyan-300',
  secondary: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300',
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

      <div className="container py-10 max-w-5xl space-y-12">
        {isLoading && <Spinner />}

        {announcements && announcements.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">📢 Оголошення</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {announcements.map(a => (
                <div key={a.id} className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all">
                  {a.link ? (
                    <a href={a.link} target="_blank" rel="noreferrer" className="block hover:opacity-90 transition-opacity">
                      <img src={a.image} alt={a.title} className="w-full aspect-video object-cover" />
                      {a.title && <div className="p-4 font-bold text-gray-900 dark:text-white">{a.title}</div>}
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
                      {a.title && <div className="p-4 font-bold text-gray-900 dark:text-white">{a.title}</div>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {documents && documents.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">📄 Корисні документи</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {documents.map(doc => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target={doc.link_type === 'external' ? '_blank' : undefined}
                  rel="noreferrer"
                  className={`group block p-5 rounded-[1.5rem] border-2 hover:shadow-xl hover:-translate-y-1 transition-all ${ACCENT_BG[doc.accent] || ACCENT_BG.primary}`}
                >
                  <div className="flex items-start gap-3">
                    <i className={`${doc.icon} text-3xl shrink-0`} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold mb-1 group-hover:underline">{doc.title}</div>
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
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">📋 Документи для зарахування</h2>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <ol className="space-y-4">
                {enrollment.map((doc, i) => (
                  <li key={doc.id} className="flex gap-4 items-start">
                    <span className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{doc.title}</div>
                      {doc.note && <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{doc.note}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {samples && samples.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">📝 Зразки заяв</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {samples.map((s, i) => (
                <figure key={s.id} className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => setSamplesIdx(i)}
                    className="w-full block cursor-zoom-in group"
                  >
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full aspect-[4/5] object-contain bg-gray-100 dark:bg-slate-800 group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                  <figcaption className="p-4">
                    <div className="font-bold text-gray-900 dark:text-white">{s.title}</div>
                    {s.caption && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{s.caption}</p>}
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
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">🤗 Адаптація дітей у садочку</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {adaptation.map((p, i) => (
                <figure key={p.id} className="rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
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
                  {p.title && <figcaption className="p-3 text-xs text-center text-gray-600 dark:text-slate-400">{p.title}</figcaption>}
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
