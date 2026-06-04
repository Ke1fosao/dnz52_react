import { useState } from 'react';
import { cn } from '@/lib/utils';

const KEY = 'dnz52:fontScale';
const LEVELS = [
  { key: 'normal', label: 'А', scale: '', title: 'Звичайний розмір тексту' },
  { key: 'large', label: 'А⁺', scale: '112.5%', title: 'Великий шрифт' },
];

/** Перемикач розміру шрифту (доступність). Масштабує root font-size → весь сайт. */
export function FontSizeControl() {
  const [active, setActive] = useState(() => {
    try { return localStorage.getItem(KEY) || 'normal'; } catch { return 'normal'; }
  });

  const set = (k: string) => {
    const lvl = LEVELS.find(l => l.key === k);
    if (!lvl) return;
    document.documentElement.style.fontSize = lvl.scale;
    try { localStorage.setItem(KEY, k); } catch { /* ignore */ }
    setActive(k);
  };

  return (
    <div role="group" aria-label="Розмір шрифту" className="inline-flex items-center gap-2">
      <span className="text-xs text-gray-500">Розмір тексту:</span>
      <div className="inline-flex items-center bg-white/10 rounded-full p-0.5">
        {LEVELS.map(l => (
          <button
            key={l.key}
            onClick={() => set(l.key)}
            aria-pressed={active === l.key}
            title={l.title}
            className={cn('w-8 h-8 rounded-full font-black flex items-center justify-center transition-colors',
              active === l.key ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white')}
          >
            <span className={l.key === 'large' ? 'text-base' : 'text-xs'}>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
