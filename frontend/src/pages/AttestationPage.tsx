import { ExternalLink, FileText, BookOpen } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { RichContent } from '@/components/common/RichContent';
import { Card, CardContent } from '@/components/ui/card';
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

const ACCENT_BG: Record<string, string> = {
  primary: 'bg-primary-50 border-primary-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-secondary-50 border-secondary-200',
  purple: 'bg-purple-50 border-purple-200',
  danger: 'bg-red-50 border-red-200',
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

      <div className="container py-10 max-w-5xl space-y-10">
        {isLoading && <Spinner />}

        {settings?.intro_html && (
          <Card className="border-primary-200 bg-primary-50">
            <CardContent className="p-6">
              <RichContent content={settings.intro_html} />
            </CardContent>
          </Card>
        )}

        {documents && documents.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display text-2xl md:text-3xl font-bold">📑 Документи комісії</h2>
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
                  className={`group block p-5 rounded-2xl border-2 hover:shadow-card-hover hover:-translate-y-0.5 transition-all ${ACCENT_BG[doc.accent] || ACCENT_BG.primary}`}
                >
                  <div className="flex items-start gap-3">
                    <i className={`${doc.icon} text-2xl shrink-0 text-primary-700`} aria-hidden />
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">{doc.category}</Badge>
                      <div className="font-display font-bold mb-1 group-hover:underline">{doc.title}</div>
                      {doc.subtitle && <p className="text-sm text-muted-foreground">{doc.subtitle}</p>}
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
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">🚀 Етапи атестації</h2>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <Card key={step.id}>
                  <CardContent className="p-5 flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-primary text-white font-bold text-lg flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-display font-bold mb-1">{step.title}</h3>
                      {step.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{step.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {categories && categories.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">🏆 Кваліфікаційні категорії</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {categories.map(cat => (
                <Card key={cat.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-br ${CATEGORY_COLORS[cat.color] || CATEGORY_COLORS['cat-1']} h-2`} />
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <i className={`${cat.icon} text-2xl text-primary-700`} aria-hidden />
                        <h3 className="font-display font-bold text-lg">{cat.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {laws && laws.length > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">⚖️ Нормативна база</h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {laws.map(law => (
                    <li key={law.id} className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-primary mt-1 shrink-0" />
                      {law.url ? (
                        <a href={law.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {law.title} <ExternalLink className="inline h-3 w-3" />
                        </a>
                      ) : (
                        <span>{law.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {settings?.contact_html && (
          <Card className="bg-gradient-warm text-white border-0">
            <CardContent className="p-6 md:p-8">
              <h3 className="font-display text-xl font-bold mb-2">{settings.contact_title}</h3>
              <RichContent
                content={settings.contact_html}
                className="text-white/90 [&_a]:text-white [&_a]:underline [&_h2]:text-white [&_h3]:text-white [&_strong]:text-white"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
