import { ReactNode, useRef } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { m as motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
  /** Максимальний нахил у градусах */
  max?: number;
}

/**
 * Картка з 3D-tilt ефектом — нахиляється у бік курсора.
 * На дотику (мобільні) ефект не активний — просто звичайна картка.
 */
export function TiltCard({ children, className, max = 8 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 20 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(px);
    my.set(py);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={cn('[transform-style:preserve-3d]', className)}
    >
      {children}
    </motion.div>
  );
}
