import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  variant?: 'primary' | 'warm' | 'sky' | 'soft';
}

export function PageHero({ title, subtitle, icon, className, children, variant = 'primary' }: Props) {
  const variants = {
    primary: 'bg-gradient-primary text-white',
    warm: 'bg-gradient-warm text-white',
    sky: 'bg-gradient-sky text-white',
    soft: 'bg-gradient-soft text-foreground',
  };

  return (
    <section className={cn('relative overflow-hidden', variants[variant], className)}>
      <div className="absolute inset-0 bg-clouds opacity-30" />
      <div className="container relative py-12 md:py-16">
        <div className="flex items-center gap-4 mb-3">
          {icon && (
            <div className={cn('text-5xl', variant !== 'soft' && 'drop-shadow-md')}>{icon}</div>
          )}
          <div>
            <h1 className="font-display font-bold text-3xl md:text-5xl">{title}</h1>
            {subtitle && (
              <p className={cn('mt-2 text-base md:text-lg max-w-2xl', variant === 'soft' ? 'text-muted-foreground' : 'text-white/90')}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
