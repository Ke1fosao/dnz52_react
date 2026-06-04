import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { getCookieConsent, setCookieConsent } from '@/lib/cookieConsent';

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

/**
 * Банер згоди на cookie. Показується ЛИШЕ якщо ввімкнена аналітика з cookie (GA)
 * і вибір ще не зроблено. Plausible не використовує cookie — банер не потрібен.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(() => !!GA_ID && getCookieConsent() === null);
  if (!visible) return null;

  const choose = (v: 'accepted' | 'declined') => {
    setCookieConsent(v);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:max-w-md z-[130] animate-scale-in" role="dialog" aria-label="Згода на використання cookie">
      <div className="glass-dropdown rounded-[1.5rem] p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Cookie size={20} />
          </div>
          <div>
            <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1">Ми використовуємо cookie</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Аналітичні файли cookie допомагають нам покращувати сайт. Детальніше — у{' '}
              <Link to="/privacy" className="text-blue-600 dark:text-blue-400 underline">Політиці конфіденційності</Link>.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => choose('accepted')} className="flex-1 bg-blue-600 text-white font-bold text-sm py-2.5 rounded-full hover:bg-blue-700 transition-colors">
            Прийняти
          </button>
          <button onClick={() => choose('declined')} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-sm py-2.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
            Лише необхідні
          </button>
        </div>
      </div>
    </div>
  );
}
