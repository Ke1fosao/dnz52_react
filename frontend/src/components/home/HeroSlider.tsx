import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSliders } from '@/hooks/useApi';
import { MagneticButton } from '@/components/common/MagneticButton';
import { cn } from '@/lib/utils';

// Дефолтні слайди — показуються якщо в адмінці ще немає жодного слайда.
// Без зовнішніх зображень: imageless-слайди рендеряться як локальний градієнт.
const FALLBACK = [
  {
    id: -1,
    title: 'Створюємо магію дитинства',
    description: 'Заклад дошкільної освіти №52 — простір, де кожен день перетворюється на захопливу пригоду.',
    image: '',
    link: '',
  },
  {
    id: -2,
    title: 'Безпека та комфорт',
    description: 'Сучасне укриття, відеонагляд та закрита територія. Ми піклуємося про спокій батьків.',
    image: '',
    link: '',
  },
  {
    id: -3,
    title: 'Сучасний розвиток',
    description: 'STEAM-освіта, інтерактивні ігри та креативні підходи. Розкриваємо таланти з ранніх років.',
    image: '',
    link: '',
  },
];

export function HeroSlider() {
  const { data } = useSliders();
  const slides = data && data.length > 0 ? data : FALLBACK;
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // Перехід за посиланням слайда: зовнішнє — повний редірект, внутрішнє — SPA-навігація.
  const go = (link: string) => {
    if (!link) return;
    if (/^https?:\/\//.test(link)) window.location.href = link;
    else navigate(link);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent(p => (p + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Скидаємо індекс якщо кількість слайдів змінилась
  useEffect(() => { setCurrent(0); }, [slides.length]);

  return (
    <section className="relative w-full min-h-[92svh] flex items-center pt-20 overflow-hidden bg-gray-900">
      {/* Фонові фото */}
      {slides.map((slide, i) => (
        <div key={slide.id} className={cn('absolute inset-0 transition-opacity duration-1000 ease-in-out', i === current ? 'opacity-100 z-10' : 'opacity-0 z-0')}>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent z-10" />
          <div className="absolute inset-0 bg-black/20 z-10" />
          {(slide as { video?: string | null }).video ? (
            <video
              src={(slide as { video?: string | null }).video || undefined}
              poster={slide.image || undefined}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : slide.image ? (
            <img
              src={slide.image}
              alt={slide.title}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              className={cn('w-full h-full object-cover', i === current ? 'animate-hero-zoom' : 'scale-100')}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700" />
          )}
        </div>
      ))}

      {/* Плаваючі скляні фігури */}
      <div className="absolute top-1/4 left-6 md:left-10 w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-md rounded-full animate-float-complex z-20 shadow-2xl border border-white/20" />
      <div className="absolute bottom-1/4 right-6 md:right-10 w-32 h-32 md:w-48 md:h-48 bg-blue-400/20 backdrop-blur-xl rounded-[3rem] rotate-12 animate-float-complex z-20 shadow-2xl border border-white/20" style={{ animationDelay: '1s' }} />

      {/* Текст */}
      <div className="container mx-auto px-4 relative z-30 flex flex-col items-center text-center pb-12 md:pb-24 pt-10">
        <div className="relative w-full grid" style={{ gridTemplateAreas: "'slide'" }}>
          {slides.map((slide, i) => (
            <div key={slide.id} className={cn('w-full transition-all duration-1000 ease-out flex flex-col justify-center items-center', i === current ? 'opacity-100 translate-y-0 scale-100 relative z-10' : 'opacity-0 translate-y-8 scale-95 pointer-events-none absolute')} style={{ gridArea: 'slide' }}>
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-extrabold text-xs md:text-sm mb-4 md:mb-6 border border-white/30 shadow-sm uppercase tracking-wider">
                <Sparkles size={16} className="text-yellow-400" /> Кращий старт
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-[6.5rem] font-black text-white leading-[1.05] tracking-tighter mb-4 md:mb-6 max-w-5xl mx-auto drop-shadow-xl">
                {slide.title}
              </h1>
              {slide.description && (
                <p className="text-base md:text-xl lg:text-2xl text-gray-200 font-medium max-w-3xl mx-auto drop-shadow-md leading-snug">
                  {slide.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* CTA кнопки */}
        <div className="relative z-30 mt-8 mb-12 flex flex-col sm:flex-row items-center gap-4 justify-center min-h-[60px]">
          {current === 0 ? (
            <>
              <MagneticButton
                onClick={() => navigate('/groups')}
                aria-label="Наші групи"
                className="px-8 py-4 bg-white text-gray-900 dark:text-white font-black text-base rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:bg-blue-600 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
              >
                <span className="flex items-center gap-2 pointer-events-none">
                  Наші групи <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </MagneticButton>
              <MagneticButton
                onClick={() => navigate('/contacts')}
                aria-label="Контакти"
                className="px-8 py-4 bg-white/15 backdrop-blur-md text-white font-bold text-base rounded-full border border-white/30 hover:bg-white/25 transition-colors duration-300 flex items-center gap-2"
              >
                <span className="flex items-center gap-2 pointer-events-none">
                  <Phone size={18} /> Контакти
                </span>
              </MagneticButton>
            </>
          ) : (
            slides[current]?.link ? (
              <MagneticButton
                onClick={() => go(slides[current].link)}
                aria-label="Дізнатись більше"
                className="px-8 py-4 bg-white/15 backdrop-blur-md text-white font-bold text-base rounded-full border border-white/30 hover:bg-white/25 transition-colors duration-300"
              >
                <span className="pointer-events-none">Дізнатись більше</span>
              </MagneticButton>
            ) : null
          )}
        </div>

        {/* Точки слайдера — тепер вони частина потоку документів, а не абсолютні */}
        {slides.length > 1 && (
          <div className="relative z-30 flex items-center gap-3 justify-center">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Слайд ${i + 1}`}
                className={cn('h-2 rounded-full transition-all duration-500 ease-out', i === current ? 'w-16 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'w-4 bg-white/40 hover:bg-white/70')}
              />
            ))}
          </div>
        )}
      </div>

      {/* SVG-хвиля знизу */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-30 translate-y-1">
        <svg className="relative block w-full h-[50px] md:h-[100px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V0C1132.19,23.09,1055.71,74.35,985.66,92.83Z" className="fill-[#f8fafc] dark:fill-slate-950 transition-colors duration-500" />
        </svg>
      </div>
    </section>
  );
}
