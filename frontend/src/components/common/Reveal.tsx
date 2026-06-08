import { ReactNode } from 'react';
import { Variants } from 'framer-motion';
import { m } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type RevealVariant = 'fade-up' | 'fade' | 'scale';

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  /** Якщо true — контейнер для stagger-дітей (stagger застосовується до прямих дітей) */
  stagger?: boolean;
  /** Відступ viewport, при якому починається анімація */
  margin?: string;
}

const variants: Record<RevealVariant, Variants> = {
  'fade-up': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0,
    },
  },
};

/**
 * Обгортка «reveal on scroll» — дочірні елементи плавно з'являються при прокручуванні.
 * Поважає prefers-reduced-motion (не анімує при увімкненому налаштуванні).
 *
 * Використання:
 *   <Reveal variant="fade-up"><Section /></Reveal>
 *
 *   // stagger-список (кожен дочірній елемент — окремо):
 *   <Reveal stagger>
 *     <Reveal variant="fade-up"><Card /></Reveal>
 *     <Reveal variant="fade-up"><Card /></Reveal>
 *   </Reveal>
 */
export function Reveal({
  children,
  variant = 'fade-up',
  delay = 0,
  className,
  stagger = false,
  margin = '-10%',
}: RevealProps) {
  const reduced = useReducedMotion();

  // При reduced-motion — просто рендеримо без анімацій
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  if (stagger) {
    return (
      <m.div
        className={className}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin }}
      >
        {children}
      </m.div>
    );
  }

  return (
    <m.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      {children}
    </m.div>
  );
}
