import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const QUICK_LINKS = [
  { to: '/groups', icon: '👶', label: 'Наші групи', desc: '5 вікових категорій', color: 'from-primary-100 to-primary-50' },
  { to: '/menu', icon: '🍽️', label: 'Меню сьогодні', desc: 'Корисне харчування', color: 'from-accent-100 to-accent-50' },
  { to: '/gallery', icon: '🖼️', label: 'Галерея', desc: 'Фото з життя садка', color: 'from-secondary-100 to-secondary-50' },
  { to: '/circles', icon: '🎨', label: 'Гуртки', desc: 'Творчість і розвиток', color: 'from-pink-100 to-pink-50' },
  { to: '/parents', icon: '👨‍👩‍👧', label: 'Батькам', desc: 'Документи та поради', color: 'from-purple-100 to-purple-50' },
  { to: '/contacts', icon: '📞', label: 'Контакти', desc: 'Як з нами зв\'язатися', color: 'from-amber-100 to-amber-50' },
];

export function QuickLinks() {
  return (
    <section className="container py-12 md:py-16">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
          Що вас цікавить? 🌈
        </h2>
        <p className="text-muted-foreground">Швидкий доступ до найважливішого</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {QUICK_LINKS.map((link, i) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={link.to}
              className={`group block rounded-3xl bg-gradient-to-br ${link.color} p-6 md:p-7 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all border border-white/40`}
            >
              <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform inline-block">
                {link.icon}
              </div>
              <div className="font-display font-bold text-lg md:text-xl mb-1">{link.label}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{link.desc}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
