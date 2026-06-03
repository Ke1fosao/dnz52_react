import { useState, ImgHTMLAttributes } from 'react';
import { ZoomIn } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { cn } from '@/lib/utils';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onClick'> {
  zoomSrc?: string;
  zoomTitle?: string;
  zoomDescription?: string;
  wrapperClassName?: string;
  showHint?: boolean;
}

/**
 * Картинка з можливістю клікнути і відкрити у lightbox.
 * Використовується скрізь де треба показати фото з можливістю наблизити.
 */
export function ZoomableImage({
  zoomSrc,
  zoomTitle,
  zoomDescription,
  wrapperClassName,
  showHint = true,
  className,
  src,
  alt,
  ...props
}: Props) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fullSrc = zoomSrc || src;

  return (
    <>
      <div className={cn('relative group cursor-zoom-in', wrapperClassName)} onClick={() => setOpen(true)}>
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={cn(
            'transition-[transform,filter,opacity] duration-500 dark:brightness-90',
            loaded ? 'blur-0 opacity-100' : 'blur-[3px] opacity-80',
            className,
          )}
          {...props}
        />
        {showHint && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-[inherit] pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-gray-900 rounded-full p-3 shadow-soft-lg">
              <ZoomIn className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: fullSrc || '', alt: zoomTitle || (typeof alt === 'string' ? alt : '') }]}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
      />
    </>
  );
}

/**
 * Галерея з кількох фото — клік відкриває лайтбокс з усіма картинками.
 * Повертає функцію onClick для кожного фото та сам Lightbox.
 */
interface GalleryProps {
  photos: Array<{ src: string; title?: string; description?: string }>;
  open: boolean;
  index: number;
  onClose: () => void;
}

export function PhotoGalleryLightbox({ photos, open, index, onClose }: GalleryProps) {
  // Якщо фото лише одне — приховуємо стрілки гортання (вони безглузді)
  const isSingle = photos.length <= 1;

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={photos.map(p => ({ src: p.src, alt: p.title || '' }))}
      carousel={{ finite: true }}
      render={isSingle ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
    />
  );
}
