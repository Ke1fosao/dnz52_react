import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { svg: 'h-9 w-9', text: 'text-lg' },
    md: { svg: 'h-12 w-12', text: 'text-xl' },
    lg: { svg: 'h-16 w-16', text: 'text-2xl' },
  };
  const s = sizes[size];

  return (
    <Link to="/" className={cn('flex items-center gap-3 group', className)}>
      <div className={cn('relative shrink-0', s.svg)}>
        <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-soft group-hover:scale-110 transition-transform">
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4A90E2" />
              <stop offset="100%" stopColor="#50E3C2" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#logo-grad)" />
          <text
            x="32" y="44"
            textAnchor="middle"
            fontFamily="Fredoka, Nunito, sans-serif"
            fontWeight="700"
            fontSize="30"
            fill="#fff"
          >
            52
          </text>
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn('font-display font-bold text-primary-700', s.text)}>ЗДО №52</span>
          <span className="text-xs text-muted-foreground hidden sm:block">м. Рівне</span>
        </div>
      )}
    </Link>
  );
}
