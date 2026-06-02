import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, GraduationCap, Calendar, Quote, Image as ImageIcon } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { RichContent } from '@/components/common/RichContent';
import { useGroup } from '@/hooks/useApi';
import { NotFoundPage } from '../NotFoundPage';

const AGE_EMOJIS: Record<string, string> = {
  nursery: '🧸', junior: '🌱', middle: '🌟', senior: '🚀', school: '🎓',
};

export function GroupDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useGroup(slug);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const teachers = data.staff.filter(s => s.role === 'teacher');
  const assistants = data.staff.filter(s => s.role === 'assistant');

  return (
    <div className="-mt-24 md:-mt-28 animate-page-fade-in">
      <Seo title={data.name} description={data.motto || data.description} />

      {/* Кольоровий hero групи */}
      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}bb)` }}>
        <div className="absolute inset-0 bg-clouds opacity-20" />
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-float-complex" />
        <div className="container mx-auto px-4 max-w-7xl relative text-white">
          <button onClick={() => window.history.back()} className="group inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-colors mb-6 bg-white/15 hover:bg-white/25 py-2 px-4 rounded-full backdrop-blur-md">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> До усіх груп
          </button>
          <div className="flex items-start gap-5">
            <div className="text-6xl md:text-7xl drop-shadow-lg animate-float-complex">{AGE_EMOJIS[data.age_group] || '👶'}</div>
            <div>
              <span className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wide mb-3">{data.age_group_display}</span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-md">{data.name}</h1>
              {data.motto && <p className="text-lg md:text-2xl italic text-white/90 max-w-2xl font-medium">«{data.motto}»</p>}
            </div>
          </div>
        </div>
        {/* Хвиля */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none translate-y-1">
          <svg className="relative block w-full h-[40px] md:h-[70px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V0C1132.19,23.09,1055.71,74.35,985.66,92.83Z" className="fill-[#f8fafc] dark:fill-slate-950" />
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {data.cover && (
            <ZoomableImage src={data.cover} alt={data.name} zoomTitle={data.name} zoomDescription={data.motto}
              wrapperClassName="w-full aspect-video rounded-[2rem] overflow-hidden shadow-xl" className="w-full h-full object-cover" />
          )}

          {data.description && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Про групу</h2>
              <RichContent content={data.description} />
            </div>
          )}

          {teachers.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap size={26} style={{ color: data.color }} /> Вихователі
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {teachers.map(s => <StaffCard key={s.id} staff={s} accent={data.color} />)}
              </div>
            </div>
          )}

          {assistants.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={26} style={{ color: data.color }} /> Помічники вихователя
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {assistants.map(s => <StaffCard key={s.id} staff={s} accent={data.color} />)}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {data.album_slug && (
            <div className="rounded-[2rem] p-6 text-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}cc)` }}>
              <ImageIcon className="h-10 w-10 mx-auto mb-3" />
              <h3 className="font-black text-lg mb-2">Фотоальбом групи</h3>
              <p className="text-sm text-white/85 mb-4">Подивіться фото з життя нашої групи</p>
              <Link to={`/gallery/album/${data.album_slug}`} className="inline-block bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform">
                Відкрити альбом
              </Link>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="font-black text-gray-900 dark:text-white mb-3">Вікова категорія</h3>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{AGE_EMOJIS[data.age_group] || '👶'}</span>
              <span className="font-bold text-gray-700 dark:text-slate-300">{data.age_group_display}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StaffCard({ staff, accent }: { staff: import('@/types').GroupStaff; accent: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="flex gap-4 p-5">
        {staff.photo ? (
          <ZoomableImage src={staff.photo} alt={staff.full_name} zoomTitle={staff.full_name} zoomDescription={staff.role_display}
            wrapperClassName="h-20 w-20 rounded-2xl overflow-hidden shadow-md shrink-0" className="w-full h-full object-cover" showHint={false} />
        ) : (
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0" style={{ background: accent }}>
            {staff.full_name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-black text-gray-900 dark:text-white leading-tight mb-1">{staff.full_name}</h4>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">{staff.role_display}</p>
          {staff.experience && <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><Calendar size={12} /> {staff.experience}</p>}
        </div>
      </div>
      {staff.motto && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm italic text-gray-500 dark:text-slate-400 border-l-2 pl-3" style={{ borderColor: accent }}>
            <Quote className="inline h-3 w-3 mr-1" />{staff.motto}
          </p>
        </div>
      )}
    </div>
  );
}
