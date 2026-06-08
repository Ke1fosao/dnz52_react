import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { m } from '@/lib/motion';
import {
  Search, Home, Newspaper, Users, Palette, Utensils, MessageSquare,
  FileText, Heart, Image as ImageIcon, Phone, Info, GraduationCap, X, Clock, ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { useSearch } from '@/hooks/useApi';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

// ─── Швидкі посилання ────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: 'Головна', icon: Home, to: '/', desc: 'На головну сторінку' },
  { label: 'Новини', icon: Newspaper, to: '/news', desc: 'Останні новини садка' },
  { label: 'Групи', icon: Users, to: '/groups', desc: 'Вікові групи та вихователі' },
  { label: 'Гуртки', icon: Palette, to: '/circles', desc: 'Творчість і розвиток' },
  { label: 'Меню', icon: Utensils, to: '/menu', desc: 'Раціон харчування' },
  { label: 'Відгуки', icon: MessageSquare, to: '/reviews', desc: 'Думки батьків' },
  { label: 'Документи', icon: FileText, to: '/documents', desc: 'Офіційні документи' },
  { label: 'Батькам', icon: Heart, to: '/parents', desc: 'Корисна інформація' },
  { label: 'Галерея', icon: ImageIcon, to: '/gallery', desc: 'Фото та відео' },
  { label: 'Контакти', icon: Phone, to: '/contacts', desc: 'Звʼязок з нами' },
  { label: 'Про заклад', icon: Info, to: '/about', desc: 'Наша місія та цінності' },
  { label: 'Атестація', icon: GraduationCap, to: '/attestation', desc: 'Документи комісії' },
] as const;

type QuickLink = (typeof QUICK_LINKS)[number];

const RECENT_KEY = 'dnz52:recent-nav';
const MAX_RECENT = 5;

function getRecent(): QuickLink[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const paths: string[] = JSON.parse(raw);
    return paths
      .map(p => QUICK_LINKS.find(l => l.to === p))
      .filter(Boolean) as QuickLink[];
  } catch {
    return [];
  }
}

function saveRecent(to: string) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const paths: string[] = raw ? JSON.parse(raw) : [];
    const updated = [to, ...paths.filter(p => p !== to)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Маппінг SearchResultType → URL ──────────────────────────────────────────
function getResultUrl(type: string, slug: string): string {
  switch (type) {
    case 'news': return `/news/${slug}`;
    case 'group': return `/groups/${slug}`;
    case 'circle': return `/circles/${slug}`;
    case 'document': return `/documents`;
    case 'album': return `/gallery/${slug}`;
    case 'event': return `/events`;
    case 'faq': return `/faq`;
    default: return `/${slug}`;
  }
}

// ─── Hook відкриття ───────────────────────────────────────────────────────────
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}

// ─── Компонент ────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
}

interface DisplayItem {
  label: string;
  desc: string;
  to: string;
  icon: LucideIcon;
}

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<QuickLink[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  // Пошук через API
  const { data: searchResults } = useSearch(query);

  // Оновлюємо недавні при відкритті
  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Закрити при Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Блокуємо скрол
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const trimmed = query.trim().toLowerCase();

  const filteredQuick: DisplayItem[] = (trimmed.length === 0
    ? [...QUICK_LINKS]
    : QUICK_LINKS.filter(l =>
        l.label.toLowerCase().includes(trimmed) ||
        l.desc.toLowerCase().includes(trimmed)
      )
  ).map(l => ({ label: l.label, desc: l.desc, to: l.to, icon: l.icon as LucideIcon }));

  // API результати
  const apiItems: DisplayItem[] =
    trimmed.length >= 2 && searchResults
      ? searchResults.results.slice(0, 5).map(r => ({
          label: r.title,
          to: getResultUrl(r.type, r.slug),
          desc: r.excerpt || r.type,
          icon: Search as LucideIcon,
        }))
      : [];

  const allItems: DisplayItem[] = [...filteredQuick, ...apiItems];

  // Клавіатурна навігація
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allItems[activeIndex]) {
      e.preventDefault();
      goTo(allItems[activeIndex].to);
    }
  }, [allItems, activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((to: string) => {
    saveRecent(to);
    navigate(to);
    onClose();
  }, [navigate, onClose]);

  const overlayMotion = reduced
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

  const panelMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96, y: -20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: -10 },
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <m.div
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            {...overlayMotion}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Палітра */}
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
            <m.div
              ref={trapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Командна палітра — швидка навігація"
              className="w-full max-w-2xl pointer-events-auto"
              {...panelMotion}
            >
              <div className="glass-dropdown rounded-[1.8rem] overflow-hidden shadow-2xl">
                {/* Пошук */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/60 dark:border-slate-700/60">
                  <Search size={20} className="text-gray-400 shrink-0" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    id="command-palette-input"
                    type="search"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Пошук сторінок, новин…"
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white font-bold text-lg placeholder:text-gray-400 placeholder:font-medium"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="command-list"
                    aria-activedescendant={allItems[activeIndex] ? `cmd-item-${activeIndex}` : undefined}
                  />
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 font-bold shrink-0">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg">Esc</kbd>
                    <span>закрити</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                    aria-label="Закрити командну палітру"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Список */}
                <div
                  id="command-list"
                  role="listbox"
                  className="max-h-[60vh] overflow-y-auto py-3 px-3"
                >
                  {/* Нещодавні */}
                  {trimmed.length === 0 && recent.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                        <Clock size={12} /> Нещодавні
                      </div>
                      {recent.map((item, idx) => (
                        <CommandItem
                          key={`recent-${item.to}`}
                          id={`cmd-item-recent-${idx}`}
                          label={item.label}
                          desc={item.desc}
                          Icon={item.icon as LucideIcon}
                          active={false}
                          onClick={() => goTo(item.to)}
                        />
                      ))}
                      <div className="border-t border-gray-100 dark:border-slate-700/50 my-2" />
                    </div>
                  )}

                  {/* Швидкі посилання */}
                  {filteredQuick.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                        {trimmed.length === 0 ? 'Швидкий перехід' : 'Розділи'}
                      </div>
                      {filteredQuick.map((item, idx) => (
                        <CommandItem
                          key={item.to}
                          id={`cmd-item-${idx}`}
                          label={item.label}
                          desc={item.desc}
                          Icon={item.icon}
                          active={activeIndex === idx}
                          onClick={() => goTo(item.to)}
                        />
                      ))}
                    </div>
                  )}

                  {/* API результати */}
                  {apiItems.length > 0 && (
                    <div>
                      <div className="border-t border-gray-100 dark:border-slate-700/50 my-2" />
                      <div className="px-3 py-1.5 text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                        Результати пошуку
                      </div>
                      {apiItems.map((item, idx) => {
                        const globalIdx = filteredQuick.length + idx;
                        return (
                          <CommandItem
                            key={`${item.to}-${idx}`}
                            id={`cmd-item-${globalIdx}`}
                            label={item.label}
                            desc={item.desc}
                            Icon={Search}
                            active={activeIndex === globalIdx}
                            onClick={() => goTo(item.to)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Порожній стан */}
                  {allItems.length === 0 && (
                    <div className="py-10 text-center">
                      <Search size={36} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-slate-400 font-bold">Нічого не знайдено</p>
                      <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Спробуйте інший запит</p>
                    </div>
                  )}
                </div>

                {/* Підказки */}
                <div className="border-t border-gray-200/60 dark:border-slate-700/60 px-5 py-2.5 flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-bold">↑↓</kbd> навігація
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-bold">Enter</kbd> перейти
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-bold">Ctrl</kbd>+
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-bold">K</kbd> відкрити/закрити
                  </span>
                </div>
              </div>
            </m.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Елемент списку ───────────────────────────────────────────────────────────
function CommandItem({
  id, label, desc, Icon, active, onClick,
}: {
  id: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <button
      ref={ref}
      id={id}
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-150 group',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800',
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
        active ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700',
      )}>
        <Icon size={18} className={active ? 'text-white' : 'text-gray-600 dark:text-slate-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('font-bold text-sm truncate', active ? 'text-white' : '')}>{label}</div>
        {desc && (
          <div className={cn('text-xs truncate', active ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500')}>
            {desc}
          </div>
        )}
      </div>
      <ArrowRight size={16} className={cn('shrink-0 opacity-0 group-hover:opacity-100 transition-opacity', active && 'opacity-100 text-white')} />
    </button>
  );
}
