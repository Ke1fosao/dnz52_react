import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, HelpCircle, Newspaper, CalendarDays, Image as ImageIcon,
  Users, Sparkles, FileText, Plus, ArrowRight,
} from 'lucide-react';
import { adminStatsApi } from '../lib/adminApi';
import { BarChart } from '../components/AdminUI';
import { useAdminAuth } from '../lib/adminAuth';

const DJANGO = import.meta.env.DEV ? 'http://localhost:8000/admin' : '/admin';

const TOTALS: { key: string; label: string; icon: typeof Newspaper; to?: string; ext?: string }[] = [
  { key: 'news', label: 'Новини', icon: Newspaper, to: '/manage/news/new' },
  { key: 'events', label: 'Події', icon: CalendarDays, to: '/manage/events/new' },
  { key: 'faq', label: 'FAQ', icon: HelpCircle, to: '/manage/faq/new' },
  { key: 'albums', label: 'Альбоми', icon: ImageIcon, ext: `${DJANGO}/gallery/galleryalbum/add/` },
  { key: 'groups', label: 'Групи', icon: Users },
  { key: 'circles', label: 'Гуртки', icon: Sparkles },
];

export function DashboardPage() {
  const { user } = useAdminAuth();
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: adminStatsApi.get });

  return (
    <div className="space-y-6 animate-page-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
          Вітаємо, {user?.full_name?.split(' ')[0] || 'адміне'}! 👋
        </h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Огляд сайту та швидкі дії</p>
      </div>

      {/* Швидкі дії з лічильниками */}
      <div className="grid sm:grid-cols-2 gap-4">
        <QuickCard to="/manage/reviews" icon={MessageSquare} gradient="from-violet-500 to-purple-600"
          label="Відгуки на модерації" value={data?.pending_reviews} />
        <QuickCard to="/manage/questions" icon={HelpCircle} gradient="from-blue-500 to-cyan-500"
          label="Нові питання" value={data?.new_questions} />
      </div>

      {/* Графік */}
      <div className="premium-glass rounded-[1.8rem] p-6">
        <h2 className="font-black text-lg text-gray-900 dark:text-white">Новини за 6 місяців</h2>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Скільки новин публікувалось щомісяця</p>
        {data ? <BarChart data={data.chart} /> : <div className="h-44 animate-pulse bg-gray-100/50 dark:bg-slate-800/30 rounded-xl" />}
      </div>

      {/* Контент сайту */}
      <div>
        <h2 className="font-black text-lg mb-3 text-gray-900 dark:text-white">Контент сайту</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TOTALS.map(t => (
            <div key={t.key} className="premium-glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 grid place-items-center shrink-0">
                <t.icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{data?.totals?.[t.key] ?? '—'}</p>
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">{t.label}</p>
              </div>
              {t.to && (
                <Link to={t.to} title="Додати" className="w-8 h-8 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0">
                  <Plus size={16} />
                </Link>
              )}
              {t.ext && (
                <a href={t.ext} target="_blank" rel="noreferrer" title="Додати у Django-адмінці" className="w-8 h-8 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0">
                  <Plus size={16} />
                </a>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          Новини, події та FAQ редагуються тут (кнопка «+» або розділи зліва). Альбоми/групи/гуртки — поки що в Django-адмінці.
        </p>
      </div>
    </div>
  );
}

function QuickCard({ to, icon: Icon, gradient, label, value }: {
  to: string; icon: typeof MessageSquare; gradient: string; label: string; value?: number;
}) {
  return (
    <Link to={to} className="premium-glass rounded-[1.8rem] p-6 flex items-center gap-4 group hover:-translate-y-1 transition-transform">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white grid place-items-center shrink-0 shadow-lg`}>
        <Icon size={26} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white">{value ?? '—'}</p>
      </div>
      <ArrowRight className="text-gray-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-blue-500 transition-all shrink-0" />
    </Link>
  );
}
