import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, GraduationCap, Quote } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage, PhotoGalleryLightbox } from '@/components/common/ZoomableImage';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { RichContent } from '@/components/common/RichContent';
import { useSpecialistPage } from '@/hooks/useApi';
import { NotFoundPage } from '../NotFoundPage';
import type { SpecialistPageType, SpecialistPageSection } from '@/types';

const PAGE_THEMES: Record<SpecialistPageType, { emoji: string; gradient: string }> = {
  methodical: { emoji: '📚', gradient: 'from-blue-500 to-indigo-700' },
  physical: { emoji: '🤸', gradient: 'from-green-500 to-emerald-700' },
  music: { emoji: '🎵', gradient: 'from-purple-500 to-pink-600' },
  psychologist: { emoji: '🧠', gradient: 'from-cyan-500 to-blue-700' },
  medical: { emoji: '⚕️', gradient: 'from-red-400 to-rose-600' },
};

const ACCENT_COLORS: Record<string, string> = {
  primary: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  danger: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  info: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
  purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',
};

export function SpecialistPageView() {
  const { pageType = '' } = useParams<{ pageType: SpecialistPageType }>();
  const { data, isLoading, isError } = useSpecialistPage(pageType as SpecialistPageType);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const theme = PAGE_THEMES[data.page_type] || PAGE_THEMES.methodical;

  return (
    <div className="-mt-24 md:-mt-28 animate-page-fade-in">
      <Seo title={data.title} description={data.intro} />

      <section className={`relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24 bg-gradient-to-br ${theme.gradient} text-white`}>
        <div className="absolute inset-0 bg-clouds opacity-20" />
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-float-complex" />
        <div className="container mx-auto px-4 max-w-7xl relative">
          <Link to="/" className="group inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-colors mb-6 bg-white/15 hover:bg-white/25 py-2 px-4 rounded-full backdrop-blur-md">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> На головну
          </Link>
          <div className="flex items-start gap-5">
            <div className="text-6xl md:text-7xl drop-shadow-lg animate-float-complex">{theme.emoji}</div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-md">{data.title}</h1>
              {data.intro && <p className="text-lg md:text-xl text-white/90 max-w-2xl font-medium">{data.intro}</p>}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none translate-y-1">
          <svg className="relative block w-full h-[40px] md:h-[70px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V0C1132.19,23.09,1055.71,74.35,985.66,92.83Z" className="fill-[#f8fafc] dark:fill-slate-950" />
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl py-10 space-y-12">
        {/* Фахівці */}
        {data.specialists.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">Наші фахівці</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.specialists.map(s => (
                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all">
                  {s.photo ? (
                    <ZoomableImage src={s.photo} alt={s.full_name} zoomTitle={s.full_name} zoomDescription={s.position}
                      loading="lazy" wrapperClassName="w-full aspect-square overflow-hidden" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full aspect-square bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-7xl`}>{theme.emoji}</div>
                  )}
                  <div className="p-6">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">{s.full_name}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-3">{s.position}</p>
                    <div className="space-y-1 text-sm text-gray-500 dark:text-slate-400">
                      {s.education && <p><strong className="text-gray-700 dark:text-slate-300">Освіта:</strong> {s.education}</p>}
                      {s.experience && <p><strong className="text-gray-700 dark:text-slate-300">Стаж:</strong> {s.experience}</p>}
                      {s.category && <p><strong className="text-gray-700 dark:text-slate-300">Категорія:</strong> {s.category}</p>}
                    </div>
                    {s.motto && (
                      <p className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 italic text-sm text-gray-500 dark:text-slate-400">
                        <Quote className="inline h-3 w-3 mr-1" />{s.motto}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.description && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <RichContent content={data.description} />
          </div>
        )}

        {data.theme_title && (
          <div className="rounded-[2rem] p-6 md:p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-lg"><GraduationCap size={28} /></div>
              <div>
                {data.theme_period && <span className="inline-block bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full mb-2">{data.theme_period}</span>}
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{data.theme_title}</h3>
                {data.theme_text && <p className="text-gray-600 dark:text-slate-400 font-medium whitespace-pre-line">{data.theme_text}</p>}
              </div>
            </div>
          </div>
        )}

        {data.sections.length > 0 && (
          <section className="space-y-6">
            {data.sections.map(section => <SectionCard key={section.id} section={section} />)}
          </section>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: SpecialistPageSection }) {
  const accentClass = ACCENT_COLORS[section.accent] || ACCENT_COLORS.primary;
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const photos = section.photos.map(p => ({ src: p.image, title: p.caption || section.title, description: section.subtitle }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
      <div className="flex items-start gap-4 mb-4">
        <div className={`h-14 w-14 rounded-2xl border-2 flex items-center justify-center shrink-0 ${accentClass}`}>
          <i className={`${section.icon} text-2xl`} aria-hidden />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-1">{section.title}</h3>
          {section.subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{section.subtitle}</p>}
        </div>
      </div>

      {section.description && <RichContent content={section.description} className="mb-4" />}

      {section.kind === 'info' && section.photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {section.photos.map((p, i) => (
              <button key={p.id} onClick={() => setLightboxIndex(i)} className="aspect-square rounded-2xl shadow-sm overflow-hidden group relative cursor-zoom-in">
                <OptimizedImage src={p.image} alt={p.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
          <PhotoGalleryLightbox photos={photos} open={lightboxIndex >= 0} index={lightboxIndex} onClose={() => setLightboxIndex(-1)} />
        </>
      )}

      {section.kind === 'event' && section.has_link && (
        section.link_url.startsWith('http') ? (
          <a href={section.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm px-6 py-3 rounded-full hover:-translate-y-0.5 transition-transform shadow-lg">
            {section.link_label || 'Переглянути'} <ExternalLink size={16} />
          </a>
        ) : (
          <Link to={section.link_url} className="inline-flex items-center gap-2 mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm px-6 py-3 rounded-full hover:-translate-y-0.5 transition-transform shadow-lg">
            {section.link_label || 'Переглянути'}
          </Link>
        )
      )}
    </div>
  );
}
