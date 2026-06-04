import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Users, Quote, Image as ImageIcon, Sparkles, Calendar, PlayCircle, Heart } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageSpinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { RichContent } from '@/components/common/RichContent';
import { useGroup } from '@/hooks/useApi';
import { cn, plural, stripQuotes } from '@/lib/utils';
import type { GroupStaff } from '@/types';
import { NotFoundPage } from '../NotFoundPage';

const AGE_EMOJIS: Record<string, string> = {
  nursery: '🧸', junior: '🌱', middle: '🌟', senior: '🚀', school: '🎓',
};

export function GroupDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useGroup(slug);

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <NotFoundPage />;

  const emoji = AGE_EMOJIS[data.age_group] || '👶';
  const teachers = data.staff.filter(s => s.role === 'teacher');
  const assistants = data.staff.filter(s => s.role === 'assistant');
  const orderedStaff = [...teachers, ...assistants];

  // Bento-статистика — лише з реальних даних (вікова категорія часто не задана в адмінці)
  const stats = [
    ...(teachers.length ? [{ Icon: GraduationCap, value: teachers.length, label: plural(teachers.length, 'Вихователь', 'Вихователі', 'Вихователів') }] : []),
    ...(assistants.length ? [{ Icon: Users, value: assistants.length, label: plural(assistants.length, 'Помічник', 'Помічники', 'Помічників') }] : []),
  ];

  return (
    <div className="mesh-bg-gallery min-h-screen -mt-24 md:-mt-28 pb-20 animate-page-fade-in">
      <Seo title={data.name} description={data.motto || data.description} />

      {/* --- HERO: обкладинка + скляна панель, що наїжджає --- */}
      <section className="relative w-full">
        <div className="relative w-full h-[44vh] md:h-[60vh]">
          {data.cover ? (
            <img src={data.cover} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}bb)` }}>
              <span className="text-[8rem] md:text-[14rem] drop-shadow-xl animate-float-complex">{emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/10" />

          {/* Кнопка «назад» поверх фото, під навбаром */}
          <Link
            to="/groups"
            className="group absolute top-24 md:top-28 left-4 md:left-8 z-30 premium-glass px-5 py-3 rounded-full flex items-center gap-2 font-bold text-sm text-gray-800 dark:text-white shadow-lg hover:scale-105 transition-transform"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Усі групи
          </Link>
        </div>

        {/* Скляна панель з назвою/девізом + bento-статистикою */}
        <div className="container mx-auto px-4 max-w-7xl relative -mt-24 md:-mt-36 z-20">
          <div className="premium-glass rounded-[2rem] md:rounded-[3rem] p-7 md:p-12 flex flex-col md:flex-row md:items-stretch justify-between gap-7 md:gap-10">
            <div className="text-center md:text-left flex-1 flex flex-col justify-center">
              {data.age_group_display && (
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest mb-5 self-center md:self-start"
                  style={{ background: `${data.color}22`, color: data.color }}
                >
                  <Sparkles size={14} /> {data.age_group_display}
                </span>
              )}
              <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight text-gray-900 dark:text-white">{data.name}</h1>
              {data.motto && (
                <p className="text-lg md:text-2xl font-medium text-gray-600 dark:text-slate-300 italic flex items-start justify-center md:justify-start gap-2">
                  <Heart className="text-pink-500 fill-pink-500 shrink-0 mt-1" size={22} /> «{stripQuotes(data.motto)}»
                </p>
              )}
            </div>

            {/* Bento-статистика */}
            {stats.length > 0 && (
              <div className={cn(
                'grid gap-3 md:gap-4 w-full md:w-auto self-center',
                stats.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              )}>
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white/55 dark:bg-slate-800/55 rounded-2xl px-5 py-4 md:min-w-[7.5rem] flex flex-col items-center justify-center text-center shadow-sm border border-white/50 dark:border-white/5"
                  >
                    <stat.Icon size={26} className="mb-1.5" style={{ color: data.color }} />
                    <span className="font-black text-2xl text-gray-900 dark:text-white leading-none mb-1">{stat.value}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 leading-tight">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- ПРО ГРУПУ + ФОТОАЛЬБОМ --- */}
      {(data.description || data.album_slug) && (
        <section className="container mx-auto px-4 max-w-7xl mt-8 md:mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {data.description && (
              <div className={cn('premium-glass rounded-[2rem] p-7 md:p-10', data.album_slug ? 'lg:col-span-8' : 'lg:col-span-12')}>
                <h2 className="text-2xl md:text-3xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                  <span className="w-1.5 h-7 rounded-full" style={{ background: data.color }} /> Про нашу групу
                </h2>
                <RichContent content={data.description} />
              </div>
            )}

            {data.album_slug && (
              <Link
                to={`/gallery/album/${data.album_slug}`}
                className={cn('premium-glass rounded-[2rem] p-6 flex flex-col group overflow-hidden', data.description ? 'lg:col-span-4' : 'lg:col-span-12')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Фотоальбом</h3>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: `${data.color}22`, color: data.color }}>
                    <ImageIcon size={20} />
                  </div>
                </div>
                <div className="flex-1 min-h-[200px] rounded-2xl overflow-hidden relative shadow-inner">
                  {data.cover ? (
                    <img src={data.cover} alt={`Фотоальбом групи ${data.name}`} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}bb)` }}>{emoji}</div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/45 transition-colors">
                    <span className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full text-white font-bold text-sm flex items-center gap-2 border border-white/40">
                      <PlayCircle size={18} /> Відкрити галерею
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* --- КОМАНДА --- */}
      {orderedStaff.length > 0 && (
        <section className="container mx-auto px-4 max-w-7xl mt-12 md:mt-16">
          <h2 className="text-3xl md:text-4xl font-black mb-8 md:mb-10 text-center text-gray-900 dark:text-white">Наша команда</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderedStaff.map(person => <StaffCard key={person.id} staff={person} accent={data.color} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function StaffCard({ staff, accent }: { staff: GroupStaff; accent: string }) {
  return (
    <div className="premium-glass rounded-[2rem] p-6 flex flex-col group hover:-translate-y-2 transition-transform duration-300">
      <div className="flex items-center gap-5 mb-5">
        {staff.photo ? (
          <ZoomableImage
            src={staff.photo} alt={staff.full_name} zoomTitle={staff.full_name} zoomDescription={staff.role_display}
            wrapperClassName="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] overflow-hidden shrink-0 shadow-lg border-2 border-white/60 dark:border-slate-700/60"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" showHint={false}
          />
        ) : (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-lg" style={{ background: accent }}>
            {staff.full_name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-2" style={{ background: `${accent}22`, color: accent }}>
            {staff.role_display}
          </span>
          <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-tight">{staff.full_name}</h3>
          {staff.experience && (
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1.5">
              <Calendar size={12} className="shrink-0" /> {staff.experience}
            </p>
          )}
        </div>
      </div>
      {staff.motto && (
        <div className="bg-white/40 dark:bg-slate-800/40 p-5 rounded-2xl relative flex-1 flex items-center">
          <Quote size={22} className="absolute top-3 left-3 opacity-20" style={{ color: accent }} />
          <p className="text-sm md:text-base text-gray-600 dark:text-slate-300 font-medium italic relative z-10 pl-6 leading-relaxed">
            «{stripQuotes(staff.motto)}»
          </p>
        </div>
      )}
    </div>
  );
}
