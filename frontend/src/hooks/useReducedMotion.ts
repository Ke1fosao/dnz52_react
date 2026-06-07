import { useState, useEffect } from 'react';

/**
 * Повертає true, якщо користувач ввімкнув «Зменшити рух» у системних налаштуваннях.
 * Слухає зміни media query в реальному часі (напр. зміна налаштувань без перезавантаження).
 */
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
