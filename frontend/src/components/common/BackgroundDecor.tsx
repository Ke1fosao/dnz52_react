import { useLocation } from 'react-router-dom';

/**
 * Декоративний фон на весь екран (fixed, позаду контенту, не клікабельний).
 * Для кожної сторінки — своя тема: розмиті градієнтні «плями» + ледь помітні
 * плаваючі емодзі під тематику розділу. Адаптовано під світлу й темну теми.
 */
interface Variant { blobs: [string, string, string]; emojis: string[] }

const DEFAULT: Variant = {
  blobs: ['bg-blue-300/40 dark:bg-blue-600/20', 'bg-violet-300/40 dark:bg-violet-600/20', 'bg-cyan-300/40 dark:bg-cyan-600/15'],
  emojis: ['✨', '⭐', '🎈', '☁️', '🌟'],
};

// Ключ — префікс маршруту (перший збіг). '/' (головна) перевіряємо окремо.
const VARIANTS: { prefix: string; v: Variant }[] = [
  { prefix: '/menu',        v: { blobs: ['bg-orange-300/45 dark:bg-orange-600/20', 'bg-amber-300/45 dark:bg-amber-600/20', 'bg-lime-300/40 dark:bg-emerald-600/15'], emojis: ['🍎', '🥕', '🍇', '🥛', '🍪', '🥦'] } },
  { prefix: '/gallery',     v: { blobs: ['bg-pink-300/45 dark:bg-pink-600/20', 'bg-sky-300/45 dark:bg-sky-600/20', 'bg-fuchsia-300/40 dark:bg-fuchsia-600/15'], emojis: ['📸', '🎨', '🌈', '⭐', '🖼️', '✨'] } },
  { prefix: '/news',        v: { blobs: ['bg-sky-300/45 dark:bg-sky-600/20', 'bg-indigo-300/45 dark:bg-indigo-600/20', 'bg-blue-300/40 dark:bg-blue-600/15'], emojis: ['📰', '✨', '📣', '⭐', '🗞️'] } },
  { prefix: '/events',      v: { blobs: ['bg-amber-300/45 dark:bg-amber-600/20', 'bg-rose-300/45 dark:bg-rose-600/20', 'bg-violet-300/40 dark:bg-violet-600/15'], emojis: ['📅', '🎉', '🎈', '⭐', '🎊', '🥳'] } },
  { prefix: '/contacts',    v: { blobs: ['bg-emerald-300/45 dark:bg-emerald-600/20', 'bg-teal-300/45 dark:bg-teal-600/20', 'bg-cyan-300/40 dark:bg-cyan-600/15'], emojis: ['📍', '✉️', '📞', '🗺️', '🏡'] } },
  { prefix: '/parents',     v: { blobs: ['bg-rose-300/45 dark:bg-rose-600/20', 'bg-violet-300/45 dark:bg-violet-600/20', 'bg-pink-300/40 dark:bg-pink-600/15'], emojis: ['❤️', '🤝', '👨‍👩‍👧', '🌷', '💛'] } },
  { prefix: '/faq',         v: { blobs: ['bg-violet-300/45 dark:bg-violet-600/20', 'bg-blue-300/45 dark:bg-blue-600/20', 'bg-indigo-300/40 dark:bg-indigo-600/15'], emojis: ['❓', '💡', '💬', '🤔', '✨'] } },
  { prefix: '/documents',   v: { blobs: ['bg-cyan-300/45 dark:bg-cyan-600/20', 'bg-slate-300/50 dark:bg-slate-600/25', 'bg-sky-300/40 dark:bg-sky-600/15'], emojis: ['📄', '📁', '✅', '📋', '🗂️'] } },
  { prefix: '/reviews',     v: { blobs: ['bg-emerald-300/45 dark:bg-emerald-600/20', 'bg-amber-300/45 dark:bg-amber-600/20', 'bg-teal-300/40 dark:bg-teal-600/15'], emojis: ['💬', '⭐', '👍', '😊', '💚'] } },
  { prefix: '/groups',      v: { blobs: ['bg-indigo-300/45 dark:bg-indigo-600/20', 'bg-fuchsia-300/45 dark:bg-fuchsia-600/20', 'bg-violet-300/40 dark:bg-violet-600/15'], emojis: ['🧸', '🎈', '👶', '🖍️', '⭐', '🪁'] } },
  { prefix: '/circles',     v: { blobs: ['bg-pink-300/45 dark:bg-pink-600/20', 'bg-amber-300/45 dark:bg-amber-600/20', 'bg-purple-300/40 dark:bg-purple-600/15'], emojis: ['🎨', '🎵', '⚽', '🩰', '🎭', '🤸'] } },
  { prefix: '/specialists', v: { blobs: ['bg-purple-300/45 dark:bg-purple-600/20', 'bg-blue-300/45 dark:bg-blue-600/20', 'bg-indigo-300/40 dark:bg-indigo-600/15'], emojis: ['🎓', '📚', '🩺', '🎵', '⭐'] } },
  { prefix: '/about',       v: { blobs: ['bg-blue-300/45 dark:bg-blue-600/20', 'bg-purple-300/45 dark:bg-purple-600/20', 'bg-cyan-300/40 dark:bg-cyan-600/15'], emojis: ['🏫', '🎓', '📚', '⭐', '🌟'] } },
  { prefix: '/staff',       v: { blobs: ['bg-purple-300/45 dark:bg-purple-600/20', 'bg-blue-300/45 dark:bg-blue-600/20', 'bg-violet-300/40 dark:bg-violet-600/15'], emojis: ['🎓', '👩‍🏫', '⭐', '📚', '🌟'] } },
  { prefix: '/attestation', v: { blobs: ['bg-blue-300/45 dark:bg-blue-600/20', 'bg-indigo-300/45 dark:bg-indigo-600/20', 'bg-purple-300/40 dark:bg-purple-600/15'], emojis: ['🎓', '📜', '⭐', '✅', '📚'] } },
];

const HOME: Variant = {
  blobs: ['bg-blue-300/40 dark:bg-blue-600/20', 'bg-fuchsia-300/40 dark:bg-fuchsia-600/20', 'bg-amber-300/40 dark:bg-amber-600/15'],
  emojis: ['🎈', '⭐', '🧸', '✏️', '🎨', '🌟', '☁️'],
};

// Сталі позиції плям і емодзі (контент по центру лишається чистим).
const BLOB_POS = [
  'w-[30rem] h-[30rem] -top-32 -left-32',
  'top-1/3 -right-40 w-[34rem] h-[34rem]',
  'bottom-[-8rem] left-1/4 w-[28rem] h-[28rem]',
];
const EMOJI_POS = [
  'top-[14%] right-[8%] text-6xl md:text-7xl',
  'top-[42%] left-[5%] text-5xl md:text-6xl',
  'bottom-[16%] right-[14%] text-5xl md:text-7xl',
  'top-[24%] left-[20%] text-4xl md:text-5xl',
  'bottom-[28%] left-[10%] text-5xl md:text-6xl',
  'top-[60%] right-[6%] text-4xl md:text-6xl',
  'top-[8%] left-[44%] text-4xl md:text-5xl',
];

function pickVariant(pathname: string): Variant {
  if (pathname === '/') return HOME;
  const hit = VARIANTS.find(x => pathname.startsWith(x.prefix));
  return hit ? hit.v : DEFAULT;
}

export function BackgroundDecor() {
  const { pathname } = useLocation();
  const v = pickVariant(pathname);

  return (
    <div key={pathname} className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Колір-«підлога» (щоб не залежати від фону root) */}
      <div className="absolute inset-0 bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-500" />
      {/* Розмиті градієнтні плями */}
      {v.blobs.map((c, i) => (
        <div key={i} className={`absolute rounded-full blur-[110px] ${c} ${BLOB_POS[i]} animate-float-complex`} style={{ animationDelay: `${i * 1.5}s`, animationDuration: `${12 + i * 2}s` }} />
      ))}
      {/* Ледь помітні плаваючі емодзі під тематику сторінки */}
      {v.emojis.map((e, i) => (
        <span
          key={i}
          className={`absolute select-none animate-float-complex opacity-[0.13] dark:opacity-[0.09] ${EMOJI_POS[i % EMOJI_POS.length]}`}
          style={{ animationDelay: `${i * 0.9}s`, animationDuration: `${9 + (i % 4) * 1.6}s` }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}
