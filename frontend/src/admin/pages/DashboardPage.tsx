import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, HelpCircle, Newspaper, CalendarDays, Camera,
  Users, Sparkles, HelpCircle as Faq, Plus, ArrowRight, BellRing, History,
} from 'lucide-react';
import { adminStatsApi } from '../lib/adminApi';
import { BarChart } from '../components/AdminUI';
import { useAdminAuth } from '../lib/adminAuth';

const TOTALS: { key: string; label: string; icon: typeof Newspaper; to?: string }[] = [
  { key: 'news', label: 'Новини', icon: Newspaper, to: '/manage/news/new' },
  { key: 'events', label: 'Події', icon: CalendarDays, to: '/manage/events/new' },
  { key: 'faq', label: 'FAQ', icon: Faq, to: '/manage/faq/new' },
  { key: 'albums', label: 'Альбоми', icon: Camera, to: '/manage/albums/new' },
  { key: 'groups', label: 'Групи', icon: Users, to: '/manage/groups/new' },
  { key: 'circles', label: 'Гуртки', icon: Sparkles, to: '/manage/circles/new' },
];

const DOT: Record<string, string> = { '+': 'bg-emerald-500', '~': 'bg-blue-500', '-': 'bg-rose-500' };

function shortWhen(iso: string) {
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

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
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickCard to="/manage/reviews" icon={MessageSquare} gradient="from-violet-500 to-purple-600" label="Відгуки на модерації" value={data?.pending_reviews} />
        <QuickCard to="/manage/questions" icon={HelpCircle} gradient="from-blue-500 to-cyan-500" label="Нові питання" value={data?.new_questions} />
        <QuickCard to="/manage/push" icon={BellRing} gradient="from-emerald-500 to-teal-500" label="Активних підписок" value={data?.subscriptions} />
      </div>

      {/* Графіки */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Новини за 6 місяців" subtitle="Скільки новин публікувалось щомісяця" data={data?.chart} />
        <ChartCard title="Відгуки за 6 місяців" subtitle="Динаміка нових відгуків" data={data?.reviews_chart} />
      </div>

      {/* Контент сайту */}
      <div>
        <h2 className="font-black text-lg mb-3 text-gray-900 dark:text-white">Контент сайту</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TOTALS.map(t => (
            <div key={t.key} className="premium-glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 grid place-items-center shrink-0"><t.icon size={22} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{data?.totals?.[t.key] ?? '—'}</p>
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">{t.label}</p>
              </div>
              {t.to && (
                <Link to={t.to} title="Додати" className="w-8 h-8 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0"><Plus size={16} /></Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Остання активність */}
      <div className="premium-glass rounded-[1.8rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-gray-400 dark:text-slate-500" />
            <h2 className="font-black text-lg text-gray-900 dark:text-white">Остання активність</h2>
          </div>
          <Link to="/manage/history" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">Уся історія <ArrowRight size={14} /></Link>
        </div>
        {!data ? <div className="h-24 animate-pulse bg-gray-100/50 dark:bg-slate-800/30 rounded-xl" />
          : !data.recent?.length ? <p className="text-sm text-gray-400 dark:text-slate-500">Поки що немає записів</p>
          : (
            <div className="space-y-2">
              {data.recent.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-white/30 dark:border-white/5 last:border-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT[h.type] || DOT['~']}`} />
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase shrink-0">{h.model}</span>
                  <span className="font-bold text-gray-800 dark:text-slate-200 truncate flex-1">{h.repr}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0 hidden sm:inline">{h.user}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{shortWhen(h.date)}</span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, data }: { title: string; subtitle: string; data?: { label: string; value: number }[] }) {
  return (
    <div className="premium-glass rounded-[1.8rem] p-6">
      <h2 className="font-black text-lg text-gray-900 dark:text-white">{title}</h2>
      <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">{subtitle}</p>
      {data ? <BarChart data={data} /> : <div className="h-44 animate-pulse bg-gray-100/50 dark:bg-slate-800/30 rounded-xl" />}
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
