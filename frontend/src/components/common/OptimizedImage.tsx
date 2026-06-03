import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// WebP вмикається ТІЛЬКИ якщо у .env задано VITE_ENABLE_WEBP=true.
// За замовчуванням ВИМКНЕНО — бо webp-версії додаються поряд з оригіналами
// і подвоюють обсяг media (не підходить для хостингів з малим диском, напр. PA free).
// Вмикайте лише якщо реально згенерували .webp і маєте достатньо місця.
const WEBP_ENABLED = import.meta.env.VITE_ENABLE_WEBP === 'true';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Примусово увімкнути/вимкнути WebP для конкретного зображення. */
  webp?: boolean;
}

/**
 * Оптимізоване зображення:
 *   • lazy loading + async decoding
 *   • blur-up: поки вантажиться — розмитий плейсхолдер, потім плавна поява
 *   • (опціонально) <picture> з WebP — лише якщо VITE_ENABLE_WEBP=true
 *
 * WebP-версії генеруються командою `python manage.py generate_webp`.
 * УВАГА: вони ДОДАЮТЬСЯ поряд з оригіналами (не замінюють), тому збільшують
 * обсяг media. Вмикайте WebP тільки маючи достатньо дискового простору.
 */
export function OptimizedImage({ src, alt, webp = WEBP_ENABLED, className, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);

  // Будуємо шлях до webp: foo.jpg → foo.webp (тільки для локальних media)
  const isLocal = src.startsWith('/media') || src.startsWith('http');
  const webpSrc = webp && isLocal ? src.replace(/\.(jpe?g|png)(\?.*)?$/i, '.webp$2') : null;
  const hasWebp = webpSrc && webpSrc !== src;

  return (
    <picture>
      {hasWebp && <source srcSet={webpSrc} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          'transition-[filter,opacity] duration-500 dark:brightness-90',
          loaded ? 'blur-0 opacity-100' : 'blur-md opacity-70 scale-[1.02]',
          className,
        )}
        {...props}
      />
    </picture>
  );
}
