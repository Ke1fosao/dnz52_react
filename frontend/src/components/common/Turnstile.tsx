import { useEffect, useRef, useId } from 'react';

interface TurnstileProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: object) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    _turnstileLoading?: boolean;
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

function loadScript(): Promise<void> {
  if (document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
    // скрипт вже є — чекаємо на window.turnstile
    return new Promise(resolve => {
      const check = () => (window.turnstile ? resolve() : setTimeout(check, 50));
      check();
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Невидимий Cloudflare Turnstile-віджет.
 * Якщо VITE_TURNSTILE_SITE_KEY не задано — нічого не рендерить (форма працює без captcha).
 */
export function Turnstile({ onToken, onExpire }: TurnstileProps) {
  const containerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    let active = true;

    loadScript().then(() => {
      if (!active || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        'expired-callback': () => {
          onExpire?.();
          onToken('');
        },
        'error-callback': () => onToken(''),
        theme: 'auto',
        size: 'normal',
      });
    });

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} id={containerId} className="mt-1" />;
}
