import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Seo } from '@/components/common/Seo';

const POPULAR_LINKS = [
  { to: '/news', label: '📰 Новини' },
  { to: '/gallery', label: '🖼️ Галерея' },
  { to: '/groups', label: '👶 Групи' },
  { to: '/menu', label: '🍽️ Меню' },
  { to: '/contacts', label: '📞 Контакти' },
];

export function NotFoundPage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <Seo title="Сторінку не знайдено" />
      <section className="container py-16 md:py-24 text-center max-w-2xl">
        <div className="text-8xl md:text-9xl mb-4 animate-float">🧸</div>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-3">
          Ой! Сторінку не знайдено
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Здається, ця сторінка кудись загубилася. Спробуйте знайти потрібне через пошук:
        </p>

        {/* Пошук */}
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Що ви шукаєте?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-14 pl-12 pr-28 text-base"
          />
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            Знайти
          </Button>
        </form>

        {/* Популярні посилання */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-muted-foreground mb-3">Або перейдіть до:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {POPULAR_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 rounded-full bg-muted hover:bg-primary-50 hover:text-primary-700 text-sm font-semibold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="gradient" size="lg">
            <Link to="/">
              <Home className="h-5 w-5" /> На головну
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => history.back()}>
            <ArrowLeft className="h-5 w-5" /> Назад
          </Button>
        </div>
      </section>
    </>
  );
}
