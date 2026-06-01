import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Декоративні емодзі (хмаринки, сонечко, кульки) що плавно рухаються
 * при прокручуванні сторінки — створюють ефект параллаксу.
 * Чисто декоративні, приховані від скрінрідерів.
 */
export function ParallaxDecor() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Різні елементи рухаються з різною швидкістю → ефект глибини
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <motion.div style={{ y: y1 }} className="absolute top-[10%] left-[5%] text-5xl opacity-60 animate-float">☁️</motion.div>
      <motion.div style={{ y: y2 }} className="absolute top-[20%] right-[8%] text-6xl opacity-70">☀️</motion.div>
      <motion.div style={{ y: y3 }} className="absolute top-[55%] left-[12%] text-4xl opacity-50">🎈</motion.div>
      <motion.div style={{ y: y4 }} className="absolute top-[65%] right-[15%] text-5xl opacity-50 animate-float">🦋</motion.div>
      <motion.div style={{ y: y1 }} className="absolute top-[40%] right-[40%] text-3xl opacity-40">⭐</motion.div>
      <motion.div style={{ y: y2 }} className="absolute top-[80%] left-[40%] text-4xl opacity-40">🌈</motion.div>
    </div>
  );
}
