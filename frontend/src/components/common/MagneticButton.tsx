import { ReactNode, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { m } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Сила притягання (0–1). Дефолт 0.25 — м'яко, без різких ривків. */
  strength?: number;
  /** Максимальне зміщення у px (обмежує «стрибок» при різких рухах миші). Дефолт 12. */
  maxOffset?: number;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  disabled?: boolean;
}

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/**
 * Кнопка, що м'яко «притягується» до курсора.
 * Зміщення обмежене (clamp) і згладжене добре задемпфованою пружиною —
 * тож на різких/швидких рухах миші кнопка НЕ смикається.
 * При prefers-reduced-motion і на тач-екранах — звичайна кнопка без руху.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.25,
  maxOffset = 12,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  disabled,
}: MagneticButtonProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  // М'яка, добре задемпфована пружина (без overshoot/тремтіння).
  const spring = { stiffness: 120, damping: 20, mass: 0.6 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rawX.set(clamp((e.clientX - cx) * strength, maxOffset));
    rawY.set(clamp((e.clientY - cy) * strength, maxOffset));
  };

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  if (reduced) {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn('active:scale-95 transition-transform', className)}
      >
        {children}
      </button>
    );
  }

  return (
    <m.button
      ref={ref}
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      onBlur={reset}
      whileTap={{ scale: 0.96 }}
      className={cn('relative select-none', className)}
    >
      {children}
    </m.button>
  );
}
