import { useState, useEffect, ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Menu as MenuIcon, X, ChevronDown, Sun, Moon,
  Info, Users, GraduationCap, Utensils, Heart, FileText, MessageSquare,
  Brain, Music, Activity, Star, Zap, Phone, BookOpen, Stethoscope, Palette, Image as ImageIcon,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useGroups } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface DropItem { title: string; desc: string; icon: typeof Info; to: string; color: string; }

const ABOUT_ITEMS: DropItem[] = [
  { title: 'Про заклад', desc: 'Історія та місія', icon: Info, to: '/about', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
  { title: 'Керівництво', desc: 'Адміністрація', icon: Users, to: '/staff', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' },
  { title: 'Атестація', desc: 'Документи комісії', icon: GraduationCap, to: '/attestation', color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400' },
  { title: 'Контакти', desc: 'Адреса, телефони, карта', icon: Phone, to: '/contacts', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' },
];

const SERVICE_ITEMS: DropItem[] = [
  { title: 'Меню на сьогодні', desc: 'Смачно та корисно', icon: Utensils, to: '/menu', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' },
  { title: 'Документи', desc: 'Офіційні папери', icon: FileText, to: '/documents', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400' },
  { title: 'Відгуки', desc: 'Думки батьків', icon: MessageSquare, to: '/reviews', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { title: 'Батькам', desc: 'Корисна інформація', icon: Heart, to: '/parents', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' },
];

const SPECIALISTS = [
  { title: 'Методична робота', icon: BookOpen, to: '/specialists/methodical' },
  { title: 'Фізкультурно-оздоровча', icon: Activity, to: '/specialists/physical' },
  { title: 'Музичний керівник', icon: Music, to: '/specialists/music' },
  { title: 'Психолог', icon: Brain, to: '/specialists/psychologist' },
  { title: 'Медична сестра', icon: Stethoscope, to: '/specialists/medical' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const { data: groups } = useGroups();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Закриваємо все при зміні маршруту
  useEffect(() => {
    setMobileOpen(false);
    setExpandedMobile(null);
    setSearchOpen(false);
    setQuery('');
  }, [location.pathname]);

  // Esc закриває пошук
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  // Блокуємо скрол коли відкрите мобільне меню
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  const closeMobile = () => setMobileOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className={cn('fixed w-full top-0 z-[100] transition-all duration-500 ease-out', scrolled ? 'pt-2' : 'pt-4')}>
      <div className="container mx-auto px-4">
        <div className={cn(
          'mx-auto max-w-6xl transition-all duration-500 flex items-center justify-between gap-2',
          scrolled ? 'ultra-glass rounded-[2rem] px-4 py-2' : 'bg-transparent px-2 py-2',
        )}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 relative z-50 group shrink-0">
            <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-gray-900 font-black text-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_20px_rgba(255,255,255,0.1)] group-hover:rotate-[15deg] transition-all duration-300">
              52
            </div>
            <div className="hidden sm:block">
              <h1 className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight leading-none">ЗДО №52</h1>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                <MapPin size={10} /> Рівне
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1.5 rounded-full border border-white/50 dark:border-slate-700/50 shadow-sm">
            <NavPill to="/" label="Головна" active={isActive('/')} />

            <NavDrop label="Про заклад">
              <div className="w-[380px] glass-dropdown rounded-[2rem] p-3">
                <div className="flex flex-col gap-1">
                  {ABOUT_ITEMS.map(it => <DropLink key={it.to} {...it} />)}
                </div>
              </div>
            </NavDrop>

            <NavDrop label="Світ дитинства">
              <div className="w-[720px] glass-dropdown rounded-[2rem] p-6">
                <div className="grid grid-cols-3 gap-5">
                  {/* Групи */}
                  <div className="bg-white/40 dark:bg-slate-800/40 p-5 rounded-[1.5rem]">
                    <div className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Star size={12} className="fill-current" /> Групи
                    </div>
                    <ul className="space-y-2">
                      <li><Link to="/groups" className="text-sm font-extrabold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Усі групи →</Link></li>
                      {groups?.slice(0, 5).map(g => (
                        <li key={g.id}>
                          <Link to={`/groups/${g.slug}`} className="text-sm font-bold text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">{g.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Спеціалісти (всі 5) */}
                  <div>
                    <div className="text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Zap size={12} className="fill-current" /> Спеціалісти
                    </div>
                    <ul className="space-y-2.5">
                      {SPECIALISTS.map(s => (
                        <li key={s.to}>
                          <Link to={s.to} className="flex items-center gap-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 group/spec">
                            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover/spec:scale-110 transition-transform shrink-0"><s.icon size={15} className="text-purple-500 dark:text-purple-400" /></div>
                            <span className="line-clamp-1">{s.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Активності */}
                  <div className="flex flex-col gap-3">
                    <Link to="/circles" className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-coral/15 to-accent/15 hover:from-coral/25 hover:to-accent/25 transition-colors">
                      <Palette size={26} className="text-pink-500 mb-2" />
                      <div className="font-extrabold text-sm text-gray-900 dark:text-white">Гуртки та секції</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">Творчість і розвиток</div>
                    </Link>
                    <Link to="/gallery" className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 hover:from-blue-500/25 hover:to-cyan-500/25 transition-colors">
                      <ImageIcon size={26} className="text-blue-500 mb-2" />
                      <div className="font-extrabold text-sm text-gray-900 dark:text-white">Галерея</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">Фото та відео</div>
                    </Link>
                  </div>
                </div>
              </div>
            </NavDrop>

            <NavPill to="/news" label="Новини" active={isActive('/news')} />

            <NavDrop label="Сервіси">
              <div className="w-[380px] glass-dropdown rounded-[2rem] p-3">
                <div className="flex flex-col gap-1">
                  {SERVICE_ITEMS.map(it => <DropLink key={it.to} {...it} />)}
                </div>
              </div>
            </NavDrop>
          </nav>

          {/* Right actions */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            <button onClick={toggleTheme} className="w-12 h-12 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-sm hover:scale-105 transition-transform bg-white dark:bg-slate-800 border border-white dark:border-slate-700" aria-label="Тема">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setSearchOpen(true)} className="w-12 h-12 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-sm hover:scale-105 transition-transform bg-white dark:bg-slate-800 border border-white dark:border-slate-700" aria-label="Пошук">
              <Search size={20} />
            </button>
            <Link to="/contacts" className={cn(
              'px-6 py-3 rounded-full font-bold text-sm shadow-[0_10px_20px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all whitespace-nowrap',
              isActive('/contacts') ? 'bg-blue-600 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white',
            )}>
              Звʼязок
            </Link>
          </div>

          {/* Mobile toggles */}
          <div className="xl:hidden flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-sm bg-white dark:bg-slate-800 border border-white dark:border-slate-700 relative z-50" aria-label="Пошук">
              <Search size={18} />
            </button>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-sm bg-white dark:bg-slate-800 border border-white dark:border-slate-700 relative z-50" aria-label="Тема">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-md relative z-50 border border-white dark:border-slate-700" aria-label="Меню">
              {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Пошук — overlay панель (поверх навбару, не ламає layout) */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 z-[105] bg-black/30 backdrop-blur-sm animate-page-fade-in" onClick={() => setSearchOpen(false)} />
          <div className="fixed top-0 left-0 right-0 z-[110] pt-4">
            <div className="container mx-auto px-4">
              <form onSubmit={handleSearch} className="mx-auto max-w-3xl glass-dropdown rounded-[2rem] p-2 flex items-center gap-2 shadow-2xl">
                <div className="pl-4 text-gray-400"><Search size={22} /></div>
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Що ви шукаєте? Новини, групи, документи…"
                  className="flex-1 h-14 bg-transparent outline-none text-lg font-bold text-gray-800 dark:text-slate-100 placeholder:text-gray-400 placeholder:font-medium"
                />
                <button type="submit" className="h-12 px-6 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shrink-0">Знайти</button>
                <button type="button" onClick={() => setSearchOpen(false)} className="w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 shrink-0" aria-label="Закрити">
                  <X size={22} />
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Mobile menu */}
      <div className={cn('xl:hidden fixed inset-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl transition-all duration-500', mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible')}>
        <div className="flex flex-col h-full pt-28 px-6 pb-10 overflow-y-auto">
          <MobileLink to="/" label="Головна" onClick={closeMobile} />
          <MobileGroup label="Про заклад" id="about" expanded={expandedMobile} setExpanded={setExpandedMobile} items={ABOUT_ITEMS} onNav={closeMobile} />
          <MobileLink to="/groups" label="Групи" onClick={closeMobile} />
          <MobileGroup label="Спеціалісти" id="spec" expanded={expandedMobile} setExpanded={setExpandedMobile}
            items={SPECIALISTS.map(s => ({ title: s.title, desc: '', icon: s.icon, to: s.to, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' }))} onNav={closeMobile} />
          <MobileLink to="/circles" label="Гуртки" onClick={closeMobile} />
          <MobileLink to="/news" label="Новини" onClick={closeMobile} />
          <MobileLink to="/gallery" label="Галерея" onClick={closeMobile} />
          <MobileGroup label="Сервіси" id="services" expanded={expandedMobile} setExpanded={setExpandedMobile} items={SERVICE_ITEMS} onNav={closeMobile} />

          <Link to="/contacts" onClick={closeMobile} className="w-full mt-4 bg-blue-600 text-white py-4 rounded-3xl font-extrabold text-xl shadow-lg text-center">
            Контакти
          </Link>
        </div>
      </div>
    </header>
  );
}

// ---------- helpers ----------

function NavPill({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <NavLink to={to} end={to === '/'} className={cn(
      'px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300',
      active ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
             : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50',
    )}>
      {label}
    </NavLink>
  );
}

function NavDrop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="relative group/nav">
      <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all">
        {label}
        <ChevronDown size={14} className="opacity-50 group-hover/nav:rotate-180 transition-transform" />
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-full h-6" />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 translate-y-4 invisible group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:visible transition-all duration-300 z-50 origin-top">
        {children}
      </div>
    </div>
  );
}

function DropLink({ to, title, desc, icon: Icon, color }: DropItem) {
  return (
    <Link to={to} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors group/link">
      <div className={cn('w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/link:scale-110 group-hover/link:rotate-3', color)}>
        <Icon size={20} />
      </div>
      <div>
        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white mb-0.5">{title}</h4>
        {desc && <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{desc}</p>}
      </div>
    </Link>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <NavLink to={to} end={to === '/'} onClick={onClick} className={({ isActive }) => cn(
      'w-full flex items-center p-4 rounded-3xl font-extrabold text-xl transition-all mb-2',
      isActive ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm'
               : 'text-gray-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50',
    )}>
      {label}
    </NavLink>
  );
}

function MobileGroup({ label, id, expanded, setExpanded, items, onNav }: {
  label: string; id: string; expanded: string | null;
  setExpanded: (v: string | null) => void; items: DropItem[]; onNav: () => void;
}) {
  const open = expanded === id;
  return (
    <div className="mb-2">
      <button onClick={() => setExpanded(open ? null : id)}
        className="w-full flex items-center justify-between p-4 rounded-3xl font-extrabold text-xl text-gray-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all">
        {label}
        <ChevronDown size={24} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="p-2 grid gap-2 mt-2">
          {items.map(it => (
            <Link key={it.to} to={it.to} onClick={onNav} className="flex items-center gap-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-3xl">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', it.color)}><it.icon size={20} /></div>
              <div className="font-bold text-gray-800 dark:text-slate-200">{it.title}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
