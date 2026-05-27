import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Smile, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/common/Seo';
import { HeroSlider } from '@/components/home/HeroSlider';
import { QuickLinks } from '@/components/home/QuickLinks';
import { NewsPreview } from '@/components/home/NewsPreview';

const VALUES = [
  { icon: <Heart className="h-7 w-7" />, title: 'Турбота', desc: 'Кожна дитина оточена увагою та теплом' },
  { icon: <Smile className="h-7 w-7" />, title: 'Радість', desc: 'Веселі заняття, друзі та посмішки щодня' },
  { icon: <Sparkles className="h-7 w-7" />, title: 'Розвиток', desc: 'Сучасні методики для всебічного розвитку' },
  { icon: <Star className="h-7 w-7" />, title: 'Безпека', desc: 'Затишне середовище, де діти почуваються вдома' },
];

export function HomePage() {
  return (
    <>
      <Seo title="Головна" description="Заклад дошкільної освіти №52 — місце, де дитинство сповнене відкриттів і радості" />

      <HeroSlider />

      <section className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center rounded-3xl bg-gradient-to-br from-cream to-white p-6 border border-white shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-white mb-3 shadow-soft">
                {v.icon}
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{v.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <QuickLinks />

      <NewsPreview />

      <section className="container py-12 md:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-warm p-10 md:p-16 text-center text-white shadow-soft-lg">
          <div className="absolute inset-0 bg-clouds opacity-40" />
          <div className="relative">
            <div className="text-6xl mb-3">💌</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Маєте запитання?
            </h2>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Ми завжди раді відповісти. Завітайте на сторінку контактів або залишіть нам відгук.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="default" size="lg" className="bg-white text-primary-700 hover:bg-cream">
                <Link to="/contacts">Контакти</Link>
              </Button>
              <Button asChild variant="default" size="lg" className="bg-white/20 backdrop-blur text-white hover:bg-white/30 border-2 border-white/40">
                <Link to="/reviews">Залишити відгук</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
