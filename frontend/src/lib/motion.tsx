/**
 * LazyMotion-провайдер для framer-motion.
 * Використовуй `m` замість `motion` у компонентах — це зменшує бандл:
 *   import { m as motion } from '@/lib/motion';
 * AnimatePresence, хуки (useInView, useMotionValue тощо) — досі з 'framer-motion'.
 */
import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { ReactNode } from 'react';

export { m };

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
