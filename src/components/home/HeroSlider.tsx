import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSliders } from '@/hooks/useApi';

export function HeroSlider() {
  const { data: slides, isLoading } = useSliders();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides]);

  if (isLoading) {
    return <Skeleton className="aspect-[16/7] w-full" />;
  }

  if (!slides || slides.length === 0) {
    return (
      <section className="relative aspect-[16/7] md:aspect-[21/9] bg-gradient-primary text-white flex items-center">
        <div className="absolute inset-0 bg-clouds opacity-30" />
        <div className="container relative text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-3 drop-shadow-md">
            Ласкаво просимо до ЗДО №52! 👋
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Місце, де дитинство сповнене відкриттів, дружби та радості
          </p>
        </div>
      </section>
    );
  }

  const slide = slides[index];

  return (
    <section className="relative aspect-[16/7] md:aspect-[21/9] overflow-hidden bg-gradient-primary">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-end">
        <div className="container pb-12 md:pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${slide.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl text-white"
            >
              <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                {slide.title}
              </h1>
              {slide.description && (
                <p className="text-base md:text-xl text-white/90 mb-4 drop-shadow-md">
                  {slide.description}
                </p>
              )}
              {slide.link && (
                <Button asChild variant="warm" size="lg">
                  <a href={slide.link}>Дізнатися більше</a>
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white flex items-center justify-center transition-colors"
            aria-label="Попередній слайд"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => setIndex(i => (i + 1) % slides.length)}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white flex items-center justify-center transition-colors"
            aria-label="Наступний слайд"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                aria-label={`Слайд ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
