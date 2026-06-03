import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  variant?: 'primary' | 'warm' | 'sky' | 'soft';
}

// Сегменти шляху → людські назви для хлібних крихт
const SEG_LABELS: Record<string, string> = {
  about: 'Про заклад', staff: 'Керівництво', attestation: 'Атестація', contacts: 'Контакти',
  groups: 'Групи', circles: 'Гуртки', menu: 'Меню', gallery: 'Галерея', news: 'Новини',
  documents: 'Документи', reviews: 'Відгуки', parents: 'Батькам', specialists: 'Спеціалісти',
  search: 'Пошук', admin: 'Адмінпанель',
};

// Преміум-заголовок сторінки: хлібні крихти + gradient-бейдж з іконкою + великий
// font-black заголовок, мʼякі кольорові плями на фоні. Єдиний стиль для внутрішніх сторінок.
export function PageHero({ title, subtitle, icon, className, children, variant = 'primary' }: Props) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  // Крихти-предки (без останнього сегмента — це поточна сторінка, її назва вже у заголовку).
  // Структурні префікси без власних сторінок (category/album) пропускаємо.
  const crumbs = segments
    .slice(0, -1)
    .map((seg, i) => ({ seg, to: '/' + segments.slice(0, i + 1).join('/') }))
    .filter(c => c.seg !== 'category' && c.seg !== 'album')
    .map(c => ({ label: SEG_LABELS[c.seg] || decodeURIComponent(c.seg), to: c.to }));

  const badge = {
    primary: 'from-blue-500 to-indigo-600 shadow-blue-500/30',
    warm: 'from-orange-400 to-rose-600 shadow-orange-500/30',
    sky: 'from-cyan-400 to-blue-600 shadow-cyan-500/30',
    soft: 'from-slate-500 to-slate-700 shadow-slate-500/20',
  }[variant];

  const blob = {
    primary: 'bg-blue-300/30 dark:bg-blue-600/15',
    warm: 'bg-orange-300/30 dark:bg-orange-600/15',
    sky: 'bg-cyan-300/30 dark:bg-cyan-600/15',
    soft: 'bg-slate-300/30 dark:bg-slate-600/15',
  }[variant];

  return (
    <section className={cn('relative overflow-hidden', className)}>
      {/* Декоративні плями */}
      <div className={cn('absolute -top-20 -left-24 w-96 h-96 rounded-full blur-[100px] pointer-events-none animate-float-complex', blob)} />
      <div className={cn('absolute -top-10 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none animate-float-complex', blob)} style={{ animationDelay: '2s' }} />

      <div className="container relative pt-4 pb-10 md:pb-14">
        {/* Хлібні крихти */}
        <nav className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm font-semibold text-gray-400 dark:text-slate-500 mb-4" aria-label="Навігація сторінкою">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Головна</Link>
          {crumbs.map(c => (
            <span key={c.to} className="flex items-center gap-1.5">
              <ChevronRight size={14} className="opacity-50" />
              <Link to={c.to} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{c.label}</Link>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          {icon && (
            <div className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] bg-gradient-to-br text-white text-3xl md:text-4xl flex items-center justify-center shadow-lg shrink-0 rotate-[-8deg] hover:rotate-0 transition-transform duration-300',
              badge,
            )}>
              {icon}
            </div>
          )}
          <div>
            <h1 className="font-black text-4xl md:text-6xl tracking-tight text-gray-900 dark:text-white mb-1">{title}</h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 font-medium max-w-2xl">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
