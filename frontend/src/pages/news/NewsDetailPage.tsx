import { useParams, Link } from 'react-router-dom';
import { Calendar, Eye, ArrowLeft, Tag } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { ReadingProgress } from '@/components/common/ReadingProgress';
import { ShareButtons } from '@/components/common/ShareButtons';
import { RichContent } from '@/components/common/RichContent';
import { useNewsDetail } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';
import { NotFoundPage } from '../NotFoundPage';

export function NewsDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useNewsDetail(slug);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  return (
    <>
      <Seo title={data.title} description={data.title} image={data.image || undefined}
        type="article" path={`/news/${data.slug}`} publishedTime={data.created_at} />
      <ReadingProgress />

      <article className="container mx-auto px-4 max-w-4xl pb-16">
        <Link to="/news" className="group inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-6 bg-white dark:bg-slate-800 py-2 px-4 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> До усіх новин
        </Link>

        {/* Мета + заголовок */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {data.category && (
            <Link to={`/news/category/${data.category.slug}`}
              className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wide hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors">
              <Tag size={12} /> {data.category.name}
            </Link>
          )}
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-slate-400"><Calendar size={15} /> {formatDate(data.created_at)}</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-slate-400"><Eye size={15} /> {data.views} переглядів</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4 leading-[1.1]">
          {data.title}
        </h1>

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-7">
            {data.tags.map(t => (
              <Link key={t.id} to={`/news?tag=${t.slug}`} className="text-xs font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full transition-colors">
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        {data.image && (
          <ZoomableImage src={data.image} alt={data.title} zoomTitle={data.title}
            wrapperClassName="aspect-video rounded-[2rem] overflow-hidden mb-8 shadow-xl"
            className="w-full h-full object-cover" />
        )}

        {/* Контент у clay-картці */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 dark:border-slate-800">
          <RichContent content={data.content} className="prose-lg" />
        </div>

        {/* Поділитись */}
        <div className="mt-8 flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900 rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <ShareButtons title={data.title} />
          <Link to="/news" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft size={16} /> Усі новини
          </Link>
        </div>

        {/* Схожі новини */}
        {data.related && data.related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-5">Схожі новини</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {data.related.map(r => (
                <Link key={r.id} to={`/news/${r.slug}`} className="group block rounded-[1.5rem] overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  {r.image ? (
                    <img src={r.image} alt={r.title} loading="lazy" className="w-full aspect-video object-cover dark:brightness-90" />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-blue-500 to-cyan-500" />
                  )}
                  <div className="p-4">
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-1">{formatDate(r.created_at)}</div>
                    <h3 className="font-black text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
