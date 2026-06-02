import { ExternalLink, BookOpen } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { RichContent } from '@/components/common/RichContent';
import { Badge } from '@/components/ui/badge';
import {
  useAttestationSettings, useAttestationDocuments,
  useAttestationSteps, useAttestationCategories, useAttestationLaws,
} from '@/hooks/useApi';

const CATEGORY_COLORS: Record<string, string> = {
  'cat-1': 'from-green-400 to-emerald-500',
  'cat-2': 'from-sky-400 to-blue-500',
  'cat-3': 'from-blue-500 to-indigo-600',
  'cat-4': 'from-purple-500 to-pink-500',
};

// Тіньовані акценти для карток-документів — світла та темна теми.
// Текст-колір застосовується до іконки; заголовок/підзаголовок задаються окремо.
const ACCENT_BG: Record<string, string> = {
  primary: 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800/60 dark:text-blue-300',
  success: 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800/60 dark:text-green-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800/60 dark:text-amber-300',
  info: 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-900/20 dark:border-cyan-800/60 dark:text-cyan-300',
  purple: 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-900/20 dark:border-purple-800/60 dark:text-purple-300',
  danger: 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/60 dark:text-red-300',
};

export function AttestationPage() {
  const { data: settings } = useAttestationSettings();
  const { data: documents } = useAttestationDocuments();
  const { data: steps } = useAttestationSteps();
  const { data: categories } = useAttestationCategories();
  const { data: laws } = useAttestationLaws();

  const isLoading = !settings && !documents;

  return (
    <>
      <Seo title="Атестація педагогічних працівників" />
      <PageHero
        title="Атестація педагогів"
        subtitle={settings?.hero_lead}
        icon="🎓"
      />

      <div className="container py-10 max-w-5xl space-y-12">
        {isLoading && <Spinner />}

        {settings?.intro_html && (
          <div className="rounded-[2rem] p-6 md:p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700 text-gray-700 dark:text-slate-300">
            <RichContent content={settings.intro_html} />
          </div>
        )}

        {documents && documents.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">📑 Документи комісії</h2>
              {settings?.docs_section_subtitle && (
                <Badge variant="default">{settings.docs_section_subtitle}</Badge>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {documents.map(doc => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group block p-5 rounded-[1.5rem] border-2 hover:shadow-xl hover:-translate-y-1 transition-all ${ACCENT_BG[doc.accent] || ACCENT_BG.primary}`}
                >
                  <div className="flex items-start gap-3">
                    <i className={`${doc.icon} text-2xl shrink-0`} aria-hidden />
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">{doc.category}</Badge>
                      <div className="font-bold mb-1 text-gray-900 dark:text-white group-hover:underline">{doc.title}</div>
                      {doc.subtitle && <p className="text-sm text-gray-500 dark:text-slate-400">{doc.subtitle}</p>}
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-50 shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {steps && steps.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">🚀 Етапи атестації</h2>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black text-lg flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                    {step.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 whitespace-pre-line">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {categories && categories.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">🏆 Кваліфікаційні категорії</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`bg-gradient-to-br ${CATEGORY_COLORS[cat.color] || CATEGORY_COLORS['cat-1']} h-2`} />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <i className={`${cat.icon} text-2xl text-blue-600 dark:text-blue-300`} aria-hidden />
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{cat.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {laws && laws.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">⚖️ Нормативна база</h2>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <ul className="space-y-3">
                {laws.map(law => (
                  <li key={law.id} className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
                    {law.url ? (
                      <a href={law.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        {law.title} <ExternalLink className="inline h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-gray-700 dark:text-slate-300">{law.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {settings?.contact_html && (
          <div className="rounded-[2rem] p-6 md:p-8 bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg">
            <h3 className="text-xl font-black mb-2">{settings.contact_title}</h3>
            <RichContent
              content={settings.contact_html}
              className="text-white/90 [&_a]:text-white [&_a]:underline [&_h2]:text-white [&_h3]:text-white [&_strong]:text-white"
            />
          </div>
        )}
      </div>
    </>
  );
}
