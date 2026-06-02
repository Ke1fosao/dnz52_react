import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { RichContent } from '@/components/common/RichContent';
import { useCircle } from '@/hooks/useApi';
import { NotFoundPage } from '../NotFoundPage';

export function CircleDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useCircle(slug);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  return (
    <div className="-mt-24 md:-mt-28 animate-page-fade-in">
      <Seo title={data.name} />

      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}bb)` }}>
        <div className="absolute inset-0 bg-clouds opacity-20" />
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-float-complex" />
        <div className="container mx-auto px-4 max-w-7xl relative text-white">
          <button onClick={() => window.history.back()} className="group inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-colors mb-6 bg-white/15 hover:bg-white/25 py-2 px-4 rounded-full backdrop-blur-md">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> До усіх гуртків
          </button>
          <div className="flex items-start gap-5">
            <i className={`${data.icon} text-6xl md:text-7xl drop-shadow-lg animate-float-complex`} aria-hidden />
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 drop-shadow-md">{data.name}</h1>
              <div className="flex flex-wrap gap-2.5">
                {data.leader && <span className="flex items-center gap-1.5 text-sm font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full"><User size={15} /> {data.leader}</span>}
                {data.age_group && <span className="flex items-center gap-1.5 text-sm font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full"><Sparkles size={15} /> {data.age_group}</span>}
                {data.schedule && <span className="flex items-center gap-1.5 text-sm font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full"><Clock size={15} /> {data.schedule}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none translate-y-1">
          <svg className="relative block w-full h-[40px] md:h-[70px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V0C1132.19,23.09,1055.71,74.35,985.66,92.83Z" className="fill-[#f8fafc] dark:fill-slate-950" />
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {data.goal && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">🎯 Мета та завдання</h2>
              <RichContent content={data.goal} />
            </div>
          )}
          {data.description && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Опис діяльності</h2>
              <RichContent content={data.description} />
            </div>
          )}
        </div>

        <aside>
          {data.album_slug && (
            <div className="rounded-[2rem] p-6 text-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}cc)` }}>
              <ImageIcon className="h-10 w-10 mx-auto mb-3" />
              <h3 className="font-black text-lg mb-2">Фотоальбом</h3>
              <p className="text-sm text-white/85 mb-4">Подивіться фото з гуртка</p>
              <Link to={`/gallery/album/${data.album_slug}`} className="inline-block bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform">
                Відкрити альбом
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
