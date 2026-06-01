import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Чи пробувати WebP-версію (заміна розширення на .webp). За замовчуванням true. */
  webp?: boolean;
}

/**
 * Оптимізоване зображення:
 *   • <picture> з WebP-джерелом + оригінал як fallback
 *   • lazy loading + async decoding
 *   • blur-up: поки вантажиться — розмитий плейсхолдер, потім плавна поява
 *
 * WebP-версії генеруються на бекенді командою:
 *   python manage.py generate_webp
 * Якщо .webp немає — браузер автоматично бере оригінал з <img>.
 */
export function OptimizedImage({ src, alt, webp = true, className, ...props }: Props) {
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
          'transition-[filter,opacity] duration-500',
          loaded ? 'blur-0 opacity-100' : 'blur-md opacity-70 scale-[1.02]',
          className,
        )}
        {...props}
      />
    </picture>
  );
}
