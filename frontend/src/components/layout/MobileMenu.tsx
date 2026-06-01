import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useGroups } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

const SECTIONS: Array<{ title: string; links: { to: string; label: string; emoji?: string }[] }> = [
  {
    title: 'Навігація',
    links: [
      { to: '/', label: 'Головна', emoji: '🏠' },
      { to: '/about', label: 'Про заклад', emoji: 'ℹ️' },
      { to: '/news', label: 'Новини', emoji: '📰' },
      { to: '/gallery', label: 'Галерея', emoji: '🖼️' },
    ],
  },
  {
    title: 'Освітній процес',
    links: [
      { to: '/circles', label: 'Гуртки', emoji: '🎨' },
      { to: '/menu', label: 'Меню', emoji: '🍽️' },
      { to: '/documents', label: 'Документи', emoji: '📄' },
      { to: '/reviews', label: 'Відгуки', emoji: '💬' },
    ],
  },
  {
    title: 'Спеціалісти',
    links: [
      { to: '/specialists/methodical', label: 'Методична робота', emoji: '📚' },
      { to: '/specialists/physical', label: 'Фізкультурно-оздоровча', emoji: '🤸' },
      { to: '/specialists/music', label: 'Музичний керівник', emoji: '🎵' },
      { to: '/specialists/psychologist', label: 'Психолог', emoji: '🧠' },
      { to: '/specialists/medical', label: 'Медична сестра', emoji: '⚕️' },
    ],
  },
  {
    title: 'Інформація',
    links: [
      { to: '/parents', label: 'Батькам', emoji: '👨‍👩‍👧' },
      { to: '/staff', label: 'Керівництво', emoji: '👤' },
      { to: '/attestation', label: 'Атестація', emoji: '🎓' },
      { to: '/contacts', label: 'Контакти', emoji: '📞' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: Props) {
  const location = useLocation();
  const { data: groups } = useGroups();

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-background shadow-2xl transition-transform lg:hidden flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
          <Logo size="sm" />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрити меню">
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 px-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors"
                    >
                      {link.emoji && <span className="text-lg">{link.emoji}</span>}
                      <span>{link.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {groups && groups.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 px-2">
                Групи
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/groups"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors"
                  >
                    <span className="text-lg">👶</span>
                    <span>Усі групи</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
                {groups.map(g => (
                  <li key={g.id}>
                    <Link
                      to={`/groups/${g.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 hover:text-primary-700 font-medium transition-colors"
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ background: g.color }}
                      />
                      <span>{g.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
