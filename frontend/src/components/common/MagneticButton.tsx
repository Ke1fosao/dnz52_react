import { ReactNode, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { m } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Сила магнітного притяжіння (0–1, дефолт 0.4) */
  strength?: number;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  disabled?: boolean;
}

/**
 * Кнопка, що «притягується» до курсора.
 * При prefers-reduced-motion — звичайна кнопка без руху.
 * На мобільних (touchscreen) — ефект вимкнено.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.4,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  disabled,
}: MagneticButtonProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 300, damping: 20, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 300, damping: 20, mass: 0.5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rawX.set((e.clientX - cx) * strength);
    rawY.set((e.clientY - cy) * strength);
  };

  const handleMouseLeave = () => {
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
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
      className={cn('relative select-none', className)}
    >
      {children}
    </m.button>
  );
}
