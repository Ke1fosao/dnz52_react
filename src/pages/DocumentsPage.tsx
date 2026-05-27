import { useMemo } from 'react';
import { FileText, Download, FileQuestion, ExternalLink } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDocuments, useDocumentCategories, useTrackDownload } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';
import type { DocumentItem } from '@/types';

export function DocumentsPage() {
  const { data: categories } = useDocumentCategories();
  const { data: docs, isLoading } = useDocuments({ page: 1 });
  const trackDownload = useTrackDownload();

  const grouped = useMemo(() => {
    if (!docs?.results) return new Map<string, DocumentItem[]>();
    const m = new Map<string, DocumentItem[]>();
    docs.results.forEach(d => {
      const key = d.category?.slug || '_other';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(d);
    });
    return m;
  }, [docs]);

  const handleDownload = (doc: DocumentItem) => {
    trackDownload.mutate(doc.id);
  };

  return (
    <>
      <Seo title="Документи" description="Нормативно-правові документи закладу дошкільної освіти №52" />
      <PageHero
        title="Документи закладу"
        subtitle="Усі офіційні документи у відкритому доступі"
        icon="📄"
        variant="soft"
      />

      <div className="container py-10 max-w-4xl">
        {isLoading ? (
          <Spinner />
        ) : !docs || docs.results.length === 0 ? (
          <EmptyState
            icon={<FileQuestion className="h-16 w-16" />}
            title="Поки немає документів"
          />
        ) : (
          <Accordion type="multiple" defaultValue={categories?.map(c => c.slug)}>
            {categories?.filter(c => (grouped.get(c.slug) || []).length > 0).map(cat => {
              const items = grouped.get(cat.slug) || [];
              return (
                <AccordionItem key={cat.id} value={cat.slug}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>{cat.name}</span>
                      <Badge variant="default">{items.length}</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {items.map(d => <DocRow key={d.id} doc={d} onDownload={handleDownload} />)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {(grouped.get('_other') || []).length > 0 && (
              <AccordionItem value="_other">
                <AccordionTrigger>
                  <span className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Інше</span>
                    <Badge variant="default">{grouped.get('_other')!.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {grouped.get('_other')!.map(d => <DocRow key={d.id} doc={d} onDownload={handleDownload} />)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </>
  );
}

function DocRow({ doc, onDownload }: { doc: DocumentItem; onDownload: (d: DocumentItem) => void }) {
  return (
    <Card className="shadow-none border hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary text-white flex items-center justify-center shrink-0 shadow-soft">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold break-words">{doc.title}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
              <span>{formatDate(doc.created_at)}</span>
              {doc.file_size && <><span>·</span><span>{doc.file_size}</span></>}
              <span>·</span>
              <span>{doc.downloads} завантажень</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:shrink-0">
          <a
            href={doc.file}
            target="_blank"
            rel="noreferrer"
            onClick={() => onDownload(doc)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border-2 border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Переглянути
          </a>
          <a
            href={doc.file}
            download
            onClick={() => onDownload(doc)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-primary text-white shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Завантажити
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
