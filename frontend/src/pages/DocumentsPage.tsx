import { useMemo } from 'react';
import { FileText, Download, FileQuestion, ExternalLink } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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

  const handleDownload = (doc: DocumentItem) => trackDownload.mutate(doc.id);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <Seo title="Документи" description="Нормативно-правові документи закладу дошкільної освіти №52" />
      <PageHero title="Документи закладу" subtitle="Усі офіційні документи у відкритому доступі" icon="📄" variant="soft" />

      <div className="pb-12">
        {isLoading ? (
          <Spinner />
        ) : !docs || docs.results.length === 0 ? (
          <EmptyState icon={<FileQuestion className="h-16 w-16" />} title="Поки немає документів" />
        ) : (
          <Accordion type="multiple" defaultValue={categories?.map(c => c.slug)} className="space-y-4">
            {categories?.filter(c => (grouped.get(c.slug) || []).length > 0).map(cat => {
              const items = grouped.get(cat.slug) || [];
              return (
                <AccordionItem key={cat.id} value={cat.slug} className="!rounded-[1.5rem] !border-gray-100 dark:!border-slate-800 bg-white dark:bg-slate-900 !mb-0 overflow-hidden shadow-sm">
                  <AccordionTrigger className="hover:bg-gray-50 dark:hover:bg-slate-800/50 px-6">
                    <span className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center shrink-0"><FileText size={18} /></div>
                      <span className="font-black text-gray-900 dark:text-white">{cat.name}</span>
                      <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full">{items.length}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <ul className="space-y-2.5">{items.map(d => <DocRow key={d.id} doc={d} onDownload={handleDownload} />)}</ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {(grouped.get('_other') || []).length > 0 && (
              <AccordionItem value="_other" className="!rounded-[1.5rem] !border-gray-100 dark:!border-slate-800 bg-white dark:bg-slate-900 !mb-0 overflow-hidden shadow-sm">
                <AccordionTrigger className="hover:bg-gray-50 dark:hover:bg-slate-800/50 px-6">
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 text-white flex items-center justify-center shrink-0"><FileText size={18} /></div>
                    <span className="font-black text-gray-900 dark:text-white">Інше</span>
                    <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full">{grouped.get('_other')!.length}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <ul className="space-y-2.5">{grouped.get('_other')!.map(d => <DocRow key={d.id} doc={d} onDownload={handleDownload} />)}</ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
}

function DocRow({ doc, onDownload }: { doc: DocumentItem; onDownload: (d: DocumentItem) => void }) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="h-11 w-11 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm"><FileText size={20} /></div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-white break-words">{doc.title}</div>
          <div className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-2 mt-1 flex-wrap font-medium">
            <span>{formatDate(doc.created_at)}</span>
            {doc.file_size && <><span>·</span><span>{doc.file_size}</span></>}
            <span>·</span><span>{doc.downloads} завантажень</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <a href={doc.file} target="_blank" rel="noreferrer" onClick={() => onDownload(doc)}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors">
          <ExternalLink size={14} /> Переглянути
        </a>
        <a href={doc.file} download onClick={() => onDownload(doc)}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:-translate-y-0.5 transition-transform">
          <Download size={14} /> Завантажити
        </a>
      </div>
    </li>
  );
}
