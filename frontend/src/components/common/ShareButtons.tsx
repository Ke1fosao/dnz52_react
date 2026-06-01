import { useState } from 'react';
import { Facebook, Send, Link2, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title?: string;
  url?: string;
}

/**
 * Кнопки "Поділитися" — Facebook, Telegram, Viber, копіювати посилання.
 * url за замовчуванням — поточна сторінка.
 */
export function ShareButtons({ title = '', url }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Посилання скопійовано!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не вдалось скопіювати');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        /* користувач скасував */
      }
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
        <Share2 className="h-4 w-4" /> Поділитися:
      </span>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Поділитися у Facebook"
        className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all hover:scale-110"
      >
        <Facebook className="h-4 w-4" />
      </a>

      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Поділитися у Telegram"
        className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all hover:scale-110"
      >
        <Send className="h-4 w-4" />
      </a>

      <a
        href={`viber://forward?text=${encodedTitle}%20${encodedUrl}`}
        aria-label="Поділитися у Viber"
        className="h-9 w-9 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-all hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M11.4 0C9.5.1 5.3.4 3 2.5 1.3 4.2.7 6.6.6 9.6.5 12.6.4 18.3 5.9 19.8v2.4c0 .9 1 1.4 1.6.8l1.9-2.1c.1 0 .2 0 .3.1 1.3.1 2.6.1 3.9 0 1.9-.1 6.1-.4 8.4-2.5 1.7-1.7 2.3-4.1 2.4-7.1.1-3-0-8.7-5.5-10.2C16.1.3 13.6 0 11.4 0zm.3 2.1c1.9 0 4 .2 5.8.7 4.2 1.1 4.1 5.7 4 8.2-.1 2.5-.5 4.3-1.7 5.5-1.7 1.6-5.3 1.9-7 2-1.2.1-2.4 0-3.6-.1l-.4-.1-.8.9-1 1.1v-2.5l-.8-.2C2 16.3 2.1 11.6 2.2 9.6c.1-2.5.5-4.3 1.7-5.5C5.6 2.5 9.2 2.2 10.9 2.1c.3 0 .5 0 .8 0z"/>
        </svg>
      </a>

      <button
        onClick={handleCopy}
        aria-label="Копіювати посилання"
        className="h-9 w-9 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-white flex items-center justify-center transition-all hover:scale-110"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>

      {/* Native share (мобільні) */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={handleNativeShare}
          aria-label="Поділитися"
          className="h-9 w-9 rounded-full bg-secondary-100 text-secondary-700 hover:bg-secondary hover:text-white flex items-center justify-center transition-all hover:scale-110 sm:hidden"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
