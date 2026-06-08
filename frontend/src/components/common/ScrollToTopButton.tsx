import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { m as motion } from '@/lib/motion';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(top > 500);
      setProgress(height > 0 ? Math.min(1, top / height) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Кільце прогресу
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group fixed bottom-24 right-6 z-30 w-16 h-16 rounded-full flex items-center justify-center
                     bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700
                     text-gray-900 dark:text-white
                     shadow-[0_10px_30px_rgba(0,0,0,0.18)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]
                     hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors duration-300"
          aria-label="Нагору"
        >
          {/* Кільце прогресу прокрутки */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r={R} fill="none" strokeWidth="3"
              className="stroke-gray-200 dark:stroke-slate-700 group-hover:stroke-white/30" />
            <circle cx="30" cy="30" r={R} fill="none" strokeWidth="3" strokeLinecap="round"
              className="stroke-blue-500 group-hover:stroke-white transition-colors"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
          </svg>
          <ArrowUp className="h-6 w-6 relative group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
