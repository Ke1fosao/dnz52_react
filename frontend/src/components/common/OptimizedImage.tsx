import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// WebP вмикається ТІЛЬКИ якщо при білді задано VITE_ENABLE_WEBP=true.
// Медіа зберігаються у Supabase Storage (S3). WebP-версії генеруються командою
// `python manage.py generate_webp` — вона зберігає .webp поряд з оригіналами
// через default_storage (тобто прямо у Supabase Storage).
// Приклад: gallery/photo.jpg → gallery/photo.webp (той самий бакет)
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
 * Вони зберігаються поряд з оригіналами у Supabase Storage (не замінюють).
 * Вмикайте WebP лише після того, як generate_webp успішно завершився.
 *
 * Підтримує URL-формати:
 *   • Supabase Storage: https://xxx.supabase.co/storage/v1/object/public/bucket/photo.jpg
 *   • Локально (dev):   /media/gallery/photo.jpg
 */
export function OptimizedImage({ src, alt, webp = WEBP_ENABLED, className, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);

  // Будуємо шлях до webp: замінюємо .jpg/.jpeg/.png → .webp у кінці URL
  // Працює і для Supabase Storage (https://...), і для локальних /media/ URL
  const hasValidSrc = src && (src.startsWith('/media') || src.startsWith('http'));
  const webpSrc = webp && hasValidSrc
    ? src.replace(/\.(jpe?g|png)(\?.*)?$/i, '.webp$2')
    : null;
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
