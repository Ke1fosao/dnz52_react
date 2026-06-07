import { ReactNode } from 'react';
import { m as motion } from '@/lib/motion';

/**
 * Обгортка для плавної появи сторінки при переході.
 * Поважає prefers-reduced-motion (Framer це робить автоматично через CSS).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
