import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Users, Clock, Wallet, Layers, Calendar,
  Image as ImageIcon, Sparkles,
} from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { RichContent } from '@/components/common/RichContent';
import { useCircle, useCircles } from '@/hooks/useApi';
import { NotFoundPage } from '../NotFoundPage';

export function CircleDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useCircle(slug);
  const { data: allCircles } = useCircles();

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const related = (allCircles || []).filter(c => c.slug !== data.slug).slice(0, 3);
  const grad = `linear-gradient(135deg, ${data.color}, ${data.color}cc)`;

  const infoRows = [
    data.leader && { icon: <User size={18} />, label: 'Керівник', value: data.leader },
    data.age_group && { icon: <Users size={18} />, label: 'Вік', value: data.age_group },
    data.format && { icon: <Layers size={18} />, label: 'Формат', value: data.format },
    data.duration && { icon: <Clock size={18} />, label: 'Тривалість', value: data.duration },
    data.schedule && { icon: <Calendar size={18} />, label: 'Розклад', value: data.schedule },
    data.price && { icon: <Wallet size={18} />, label: 'Вартість', value: data.price },
  ].filter(Boolean) as { icon: JSX.Element; label: string; value: string }[];

  return (
    <div className="-mt-24 md:-mt-28 animate-page-fade-in">
      <Seo title={data.name} description={data.tagline || undefined} />

      {/* HERO */}
      <section
        className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24 text-white"
        style={!data.cover ? { background: `linear-gradient(135deg, ${data.color}, ${data.color}bb)` } : undefined}
      >
        {data.cover && (
          <>
            <img src={data.cover} alt={data.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${data.color}f2, ${data.color}b3)` }} />
          </>
        )}
        <div className="absolute inset-0 bg-clouds opacity-20" />
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-float-complex" />

        <div className="container mx-auto px-4 max-w-7xl relative">
          <button onClick={() => window.history.back()} className="group inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-colors mb-6 bg-white/15 hover:bg-white/25 py-2 px-4 rounded-full backdrop-blur-md">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> До усіх гуртків
          </button>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.8rem] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-lg animate-float-complex">
              <i className={`${data.icon} text-4xl md:text-5xl drop-shadow`} aria-hidden />
            </div>
            <div>
              {data.is_featured && (
                <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[11px] font-black px-3 py-1 rounded-full mb-3">★ Популярний гурток</span>
              )}
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-md">{data.name}</h1>
              {data.tagline && <p className="text-lg md:text-2xl text-white/90 max-w-2xl font-medium">{data.tagline}</p>}
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
        {/* MAIN */}
        <div className="lg:col-span-2 space-y-6">
          {data.benefits.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-5">✨ Що розвиває гурток</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.benefits.map(b => (
                  <div key={b.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: grad }}>
                      <i className={`${b.icon} text-xl`} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-gray-900 dark:text-white text-sm mb-0.5">{b.title}</h4>
                      {b.text && <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{b.text}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.goal && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">🎯 Мета та завдання</h2>
              <RichContent content={data.goal} />
            </div>
          )}

          {data.description && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">📋 Опис діяльності</h2>
              <RichContent content={data.description} />
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4">
          {infoRows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="font-black text-gray-900 dark:text-white mb-4">Коротко про гурток</h3>
              <div className="space-y-3.5">
                {infoRows.map(row => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0" style={{ color: data.color }}>{row.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">{row.label}</div>
                      <div className="font-bold text-gray-800 dark:text-slate-200 text-sm">{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.sessions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={18} style={{ color: data.color }} /> Розклад занять
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {data.sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="font-bold text-gray-800 dark:text-slate-200 text-sm">{s.day}</span>
                    <span className="text-right">
                      <span className="font-black" style={{ color: data.color }}>{s.time}</span>
                      {s.note && <span className="block text-[11px] text-gray-400 dark:text-slate-500">{s.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.album_slug && (
            <div className="rounded-[2rem] p-6 text-center text-white shadow-lg" style={{ background: grad }}>
              <ImageIcon className="h-10 w-10 mx-auto mb-3" />
              <h3 className="font-black text-lg mb-2">Фотоальбом</h3>
              <p className="text-sm text-white/85 mb-4">Подивіться фото з життя гуртка</p>
              <Link to={`/gallery/album/${data.album_slug}`} className="inline-block bg-white dark:bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform">
                Відкрити альбом
              </Link>
            </div>
          )}

          <Link to="/contacts" className="block rounded-[2rem] p-6 text-center bg-gray-900 dark:bg-slate-800 text-white shadow-lg hover:-translate-y-1 transition-transform">
            <Sparkles className="h-9 w-9 mx-auto mb-2 text-amber-300" />
            <h3 className="font-black text-lg mb-1">Записати дитину</h3>
            <p className="text-sm text-white/70 mb-4">Зателефонуйте або завітайте — ми допоможемо обрати гурток до душі</p>
            <span className="inline-block bg-white dark:bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-full">Звʼязатися з нами</span>
          </Link>
        </aside>
      </div>

      {/* RELATED */}
      {related.length > 0 && (
        <div className="container mx-auto px-4 max-w-7xl pb-16">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">Інші гуртки</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map(c => (
              <Link key={c.id} to={`/circles/${c.slug}`} className="group flex items-center gap-4 p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)` }}>
                  <i className={`${c.icon} text-2xl`} aria-hidden />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.name}</h4>
                  {c.tagline && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{c.tagline}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
