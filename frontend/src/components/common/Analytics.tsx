import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCookieConsent, COOKIE_ACCEPTED_EVENT } from '@/lib/cookieConsent';

/**
 * Опціональна аналітика — вмикається лише якщо задано env-змінні:
 *   VITE_GA_ID          — Google Analytics 4 (напр. G-XXXXXXX)
 *   VITE_PLAUSIBLE_DOMAIN — домен для Plausible (напр. dnz52.pythonanywhere.com)
 *
 * Якщо обидві порожні — нічого не вантажиться (no-op).
 * Трекає перегляди сторінок при зміні роуту.
 */

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (...args: unknown[]) => void;
  }
}

let initialized = false;

function initGA() {
  if (!GA_ID || initialized) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
  initialized = true;
}

function initPlausible() {
  if (!PLAUSIBLE_DOMAIN || initialized) return;
  const s = document.createElement('script');
  s.defer = true;
  s.dataset.domain = PLAUSIBLE_DOMAIN;
  s.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(s);
  initialized = true;
}

export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // Plausible — без cookie, не потребує згоди
    if (PLAUSIBLE_DOMAIN) {
      initPlausible();
      return;
    }
    // Google Analytics (cookie) — вмикаємо лише після згоди користувача
    if (GA_ID) {
      if (getCookieConsent() === 'accepted') initGA();
      const onAccept = () => initGA();
      window.addEventListener(COOKIE_ACCEPTED_EVENT, onAccept);
      return () => window.removeEventListener(COOKIE_ACCEPTED_EVENT, onAccept);
    }
  }, []);

  // Трекаємо перегляд при зміні URL
  useEffect(() => {
    const url = location.pathname + location.search;
    if (GA_ID && window.gtag) {
      window.gtag('event', 'page_view', { page_path: url });
    }
    // Plausible трекає автоматично через History API
  }, [location.pathname, location.search]);

  return null;
}
