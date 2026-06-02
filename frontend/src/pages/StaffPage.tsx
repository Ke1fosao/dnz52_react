import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Award, GraduationCap, User } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { useStaff } from '@/hooks/useApi';

const ACCENT_GRADIENTS: Record<string, string> = {
  primary: 'from-blue-500 to-indigo-700',
  success: 'from-green-500 to-emerald-600',
  warning: 'from-amber-400 to-orange-500',
  danger: 'from-red-400 to-pink-500',
  info: 'from-cyan-500 to-blue-700',
  purple: 'from-purple-500 to-pink-500',
};

export function StaffPage() {
  const { data: staff, isLoading } = useStaff();
  const featured = staff?.find(s => s.is_featured);
  const others = staff?.filter(s => !s.is_featured) || [];

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <Seo title="Керівництво" description="Адміністрація та керівний склад закладу дошкільної освіти №52" />
      <PageHero title="Керівництво" subtitle="Команда професіоналів, що дбає про ваших дітей" icon="👤" variant="primary" />

      <div className="pb-12">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {featured && (
              <div className="mb-8 overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-lg border border-gray-100 dark:border-slate-800">
                <div className="grid md:grid-cols-3 gap-0">
                  <div className={`bg-gradient-to-br ${ACCENT_GRADIENTS[featured.accent_color] || ACCENT_GRADIENTS.primary} aspect-square md:aspect-auto flex items-center justify-center text-white overflow-hidden`}>
                    {featured.photo ? (
                      <ZoomableImage src={featured.photo} alt={featured.full_name} zoomTitle={featured.full_name} zoomDescription={featured.position} wrapperClassName="w-full h-full" className="w-full h-full object-cover" />
                    ) : <User className="h-32 w-32 opacity-80" />}
                  </div>
                  <div className="md:col-span-2 p-6 md:p-10">
                    <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full mb-3">⭐ Директор</span>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1">{featured.full_name}</h2>
                    <p className="text-blue-600 dark:text-blue-400 font-bold mb-4">{featured.position}</p>
                    <div className="space-y-1.5 text-sm text-gray-600 dark:text-slate-400 mb-4">
                      {featured.education && <p><strong className="text-gray-800 dark:text-slate-200">Освіта:</strong> {featured.education}</p>}
                      {featured.experience && <p><strong className="text-gray-800 dark:text-slate-200">Стаж:</strong> {featured.experience}</p>}
                      {featured.category && <p><strong className="text-gray-800 dark:text-slate-200">Категорія:</strong> {featured.category}</p>}
                    </div>
                    {featured.awards_list.length > 0 && (
                      <div className="mb-4">
                        <p className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-2"><Award size={16} /> Нагороди:</p>
                        <ul className="space-y-1 text-sm text-gray-500 dark:text-slate-400">
                          {featured.awards_list.map((a, i) => <li key={i}>• {a}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                      {featured.email && <a href={`mailto:${featured.email}`} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"><Mail size={16} /> {featured.email}</a>}
                      {featured.phone && <a href={`tel:${featured.phone}`} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"><Phone size={16} /> {featured.phone}</a>}
                      {featured.reception_hours && <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400"><Clock size={16} /> {featured.reception_hours}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map(m => (
                <div key={m.id} className="overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`bg-gradient-to-br ${ACCENT_GRADIENTS[m.accent_color] || ACCENT_GRADIENTS.primary} aspect-square flex items-center justify-center text-white overflow-hidden`}>
                    {m.photo ? (
                      <ZoomableImage src={m.photo} alt={m.full_name} zoomTitle={m.full_name} zoomDescription={m.position} wrapperClassName="w-full h-full" className="w-full h-full object-cover" />
                    ) : <User className="h-24 w-24 opacity-80" />}
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">{m.full_name}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-3">{m.position}</p>
                    <div className="space-y-1 text-xs text-gray-500 dark:text-slate-400">
                      {m.education && <p className="flex items-start gap-1"><GraduationCap size={13} className="mt-0.5 shrink-0" /> {m.education}</p>}
                      {m.experience && <p>{m.experience}</p>}
                    </div>
                    {m.detail_url && (
                      <Link to={m.detail_url} className="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-bold">Детальніше →</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
