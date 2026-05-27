import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/common/Seo';

export function NotFoundPage() {
  return (
    <>
      <Seo title="Сторінку не знайдено" />
      <section className="container py-20 text-center">
        <div className="text-8xl md:text-9xl mb-4 animate-float">🧸</div>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-3">
          Ой! Сторінку не знайдено
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Здається, ця сторінка кудись загубилася. Давайте повернемося на головну?
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="gradient" size="lg">
            <Link to="/">
              <Home className="h-5 w-5" /> На головну
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" onClick={() => history.back()}>
            <button type="button">
              <ArrowLeft className="h-5 w-5" /> Назад
            </button>
          </Button>
        </div>
      </section>
    </>
  );
}
