import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, MessageSquare, HelpCircle, LogOut, Sun, Moon,
  ExternalLink, Menu as MenuIcon, X, Newspaper, CalendarDays, FileText,
  Files, Tags, BookOpen, Images, Phone, UsersRound, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAdminAuth } from './lib/adminAuth';
import { adminStatsApi } from './lib/adminApi';

const DJANGO_ADMIN = import.meta.env.DEV ? 'http://localhost:8000/admin/' : '/admin/';

interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: 'pending_reviews' | 'new_questions' }
const SECTIONS: { title?: string; items: NavItem[] }[] = [
  { items: [{ to: '/manage', label: 'Дашборд', icon: LayoutDashboard, end: true }] },
  { title: 'Модерація', items: [
    { to: '/manage/reviews', label: 'Відгуки', icon: MessageSquare, badge: 'pending_reviews' },
    { to: '/manage/questions', label: 'Питання', icon: HelpCircle, badge: 'new_questions' },
  ] },
  { title: 'Контент', items: [
    { to: '/manage/news', label: 'Новини', icon: Newspaper },
    { to: '/manage/events', label: 'Події', icon: CalendarDays },
    { to: '/manage/faq', label: 'FAQ', icon: FileText },
    { to: '/manage/documents', label: 'Документи', icon: Files },
  ] },
  { title: 'Сайт', items: [
    { to: '/manage/pages', label: 'Сторінки', icon: BookOpen },
    { to: '/manage/sliders', label: 'Слайдер', icon: Images },
    { to: '/manage/staff', label: 'Штат', icon: UsersRound },
    { to: '/manage/contact', label: 'Контакти', icon: Phone },
  ] },
  { title: 'Налаштування', items: [
    { to: '/manage/directories', label: 'Довідники', icon: Tags },
  ] },
];

export function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminStatsApi.get });

  return (
    <div className="mesh-bg-gallery min-h-screen text-gray-900 dark:text-slate-200">
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'Manrope, sans-serif' } }} />

      {/* Мобільний топбар */}
      <div className="lg:hidden sticky top-0 z-30 premium-glass flex items-center justify-between px-4 py-3">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2" aria-label="Меню"><MenuIcon size={22} /></button>
        <span className="font-black">Адмінпанель</span>
        <button onClick={toggleTheme} className="p-2 -mr-2" aria-label="Тема">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
      </div>

      <div className="flex">
        {/* Сайдбар */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 p-3 md:p-4 transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}>
          <div className="premium-glass rounded-[1.8rem] h-full lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4 flex flex-col p-5">
            <div className="flex items-center justify-between mb-6">
              <Link to="/manage" className="flex items-center gap-2 font-black text-lg" onClick={() => setOpen(false)}>
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white grid place-items-center text-sm">52</span>
                Адмінка
              </Link>
              <button onClick={() => setOpen(false)} className="lg:hidden p-1" aria-label="Закрити"><X size={20} /></button>
            </div>

            <nav className="flex flex-col gap-1 flex-1 overflow-y-auto -mr-2 pr-2">
              {SECTIONS.map((section, si) => (
                <div key={si} className="mb-1">
                  {section.title && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-600 px-4 mt-3 mb-1">{section.title}</p>
                  )}
                  {section.items.map(n => {
                    const count = n.badge && stats ? stats[n.badge] : 0;
                    return (
                      <NavLink
                        key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
                        className={({ isActive }) => cn(
                          'flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold transition-all',
                          isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'text-gray-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50',
                        )}
                      >
                        <n.icon size={19} />
                        <span className="flex-1">{n.label}</span>
                        {count > 0 && <span className="text-[11px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">{count}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
              <a href={DJANGO_ADMIN} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-gray-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 mt-2">
                <ExternalLink size={19} />
                <span className="flex-1">Django-адмінка</span>
              </a>
            </nav>

            <div className="pt-4 mt-4 border-t border-white/40 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={toggleTheme} className="hidden lg:grid place-items-center w-9 h-9 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50" aria-label="Тема">
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={logout} className="grid place-items-center w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-500/10" aria-label="Вийти">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />}

        {/* Контент */}
        <main className="flex-1 min-w-0 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
