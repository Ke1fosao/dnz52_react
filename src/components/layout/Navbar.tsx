import { useState, useEffect, ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Menu as MenuIcon, X, ChevronDown,
  Home, Info, GraduationCap, Phone, Users, Sparkles,
  Music, Brain, Stethoscope, BookOpen, Newspaper, Image as ImageIcon,
  FileText, MessageSquare, Utensils, Heart,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/common/Logo';
import { useGroups } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

// ============================================================================
// Меню згруповане по розділах
// ============================================================================

interface NavLinkItem {
  to: string;
  label: string;
  description?: string;
  icon: ReactNode;
}

const FACILITY_LINKS: NavLinkItem[] = [
  { to: '/about',       label: 'Про заклад',   description: 'Історія, місія, цінності',     icon: <Info className="h-5 w-5" /> },
  { to: '/staff',       label: 'Керівництво',  description: 'Адміністрація закладу',        icon: <Users className="h-5 w-5" /> },
  { to: '/attestation', label: 'Атестація',    description: 'Документи атестаційної комісії', icon: <GraduationCap className="h-5 w-5" /> },
  { to: '/contacts',    label: 'Контакти',     description: 'Адреса, телефон, карта',       icon: <Phone className="h-5 w-5" /> },
];

const SPECIALISTS_LINKS = [
  { to: '/specialists/methodical',   label: 'Методична робота',     icon: <BookOpen className="h-4 w-4" /> },
  { to: '/specialists/physical',     label: 'Фізкультурно-оздоровча', icon: <Sparkles className="h-4 w-4" /> },
  { to: '/specialists/music',        label: 'Музичний керівник',     icon: <Music className="h-4 w-4" /> },
  { to: '/specialists/psychologist', label: 'Психолог',              icon: <Brain className="h-4 w-4" /> },
  { to: '/specialists/medical',      label: 'Медична сестра',        icon: <Stethoscope className="h-4 w-4" /> },
];

const SERVICES_LINKS: NavLinkItem[] = [
  { to: '/menu',      label: 'Меню харчування', description: 'Корисне меню на тиждень',     icon: <Utensils className="h-5 w-5" /> },
  { to: '/documents', label: 'Документи',       description: 'Нормативні документи',         icon: <FileText className="h-5 w-5" /> },
  { to: '/reviews',   label: 'Відгуки',         description: 'Думки батьків',                icon: <MessageSquare className="h-5 w-5" /> },
  { to: '/parents',   label: 'Батькам',         description: 'Оголошення, поради, зразки',   icon: <Heart className="h-5 w-5" /> },
];

// ============================================================================
// Navbar
// ============================================================================

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: groups } = useGroups();

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setShowSearch(false);
    setSearchQuery('');
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b transition-shadow',
        isScrolled && 'shadow-soft',
      )}
    >
      <div className="container flex h-16 items-center gap-3">
        <Logo size="sm" />

        {/* Desktop navigation */}
        <nav className="hidden xl:flex items-center gap-1 ml-4 flex-1">
          <NavItem to="/" icon={<Home className="h-4 w-4" />} label="Головна" />

          <NavDropdown label="Заклад" align="start" width="w-[480px]">
            <div className="grid grid-cols-2 gap-2">
              {FACILITY_LINKS.map(link => <MegaItem key={link.to} {...link} />)}
            </div>
          </NavDropdown>

          <NavDropdown label="Дітям" align="start" width="w-[680px]">
            <div className="grid grid-cols-3 gap-3">
              {/* Групи */}
              <div>
                <SectionHeader icon={<Users className="h-3.5 w-3.5" />} label="Групи" />
                <Link
                  to="/groups"
                  className="block px-3 py-2 rounded-xl hover:bg-primary-50 hover:text-primary-700 font-semibold text-sm transition-colors"
                >
                  Усі групи →
                </Link>
                <ul className="space-y-0.5 mt-1">
                  {groups?.slice(0, 6).map(g => (
                    <li key={g.id}>
                      <Link
                        to={`/groups/${g.slug}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 text-sm transition-colors"
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.color }} />
                        <span className="truncate">{g.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Спеціалісти */}
              <div>
                <SectionHeader icon={<GraduationCap className="h-3.5 w-3.5" />} label="Спеціалісти" />
                <ul className="space-y-0.5">
                  {SPECIALISTS_LINKS.map(link => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 text-sm transition-colors"
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Гуртки */}
              <div>
                <SectionHeader icon={<Sparkles className="h-3.5 w-3.5" />} label="Активності" />
                <Link
                  to="/circles"
                  className="block p-3 rounded-2xl bg-gradient-to-br from-coral/10 to-accent/10 hover:from-coral/20 hover:to-accent/20 transition-colors"
                >
                  <div className="text-2xl mb-1">🎨</div>
                  <div className="font-semibold text-sm">Гуртки та секції</div>
                  <div className="text-xs text-muted-foreground">Творчість і розвиток</div>
                </Link>
              </div>
            </div>
          </NavDropdown>

          <NavItem to="/news" icon={<Newspaper className="h-4 w-4" />} label="Новини" />
          <NavItem to="/gallery" icon={<ImageIcon className="h-4 w-4" />} label="Галерея" />

          <NavDropdown label="Сервіси" align="end" width="w-[480px]">
            <div className="grid grid-cols-2 gap-2">
              {SERVICES_LINKS.map(link => <MegaItem key={link.to} {...link} />)}
            </div>
          </NavDropdown>
        </nav>

        {/* Правий блок — пошук, контакти, моб. меню */}
        <div className="flex items-center gap-2 ml-auto">
          {showSearch ? (
            <form onSubmit={handleSearch} className="relative">
              <Input
                autoFocus
                placeholder="Пошук..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 w-56 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Закрити пошук"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} aria-label="Пошук">
              <Search className="h-5 w-5" />
            </Button>
          )}

          <Button asChild variant="gradient" size="sm" className="hidden md:inline-flex">
            <Link to="/contacts">Контакти</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={onMenuClick}
            aria-label="Меню"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// Допоміжні компоненти
// ============================================================================

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-semibold transition-colors',
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-foreground hover:bg-primary-50 hover:text-primary-700',
        )
      }
    >
      {icon} {label}
    </NavLink>
  );
}

function NavDropdown({
  label,
  children,
  align = 'start',
  width = 'w-[480px]',
}: {
  label: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Закриваємо при зміні маршруту (на випадок гарячих оновлень)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Закриваємо коли користувач клікнув на будь-яке посилання всередині дропдауну
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href]')) {
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="group inline-flex items-center gap-1 h-10 px-3 rounded-xl text-sm font-semibold transition-colors text-foreground hover:bg-primary-50 hover:text-primary-700 data-[state=open]:bg-primary-50 data-[state=open]:text-primary-700 focus:outline-none">
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn(width, 'max-w-[calc(100vw-2rem)]')}
        onClick={handleContentClick}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SectionHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 px-2 flex items-center gap-1.5">
      {icon} {label}
    </h4>
  );
}

function MegaItem({ to, label, description, icon }: NavLinkItem) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 p-3 rounded-2xl hover:bg-primary-50 transition-colors group"
    >
      <div className="h-10 w-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm group-hover:text-primary-700 transition-colors">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</div>
        )}
      </div>
    </Link>
  );
}
