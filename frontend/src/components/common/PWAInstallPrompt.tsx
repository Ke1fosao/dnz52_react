import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { m as motion } from '@/lib/motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'dnz52:pwa-install-dismissed';

/**
 * Банер "Встановити додаток" — з'являється коли браузер дозволяє встановлення PWA.
 * Можна закрити (запам'ятовується на 14 днів).
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Перевіряємо чи користувач недавно закрив банер
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed && Date.now() - Number(dismissed) < 14 * 24 * 60 * 60 * 1000) {
        return;
      }
    } catch {
      /* ignore */
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-card border-2 border-primary-200 rounded-3xl shadow-soft-lg p-4"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            aria-label="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-primary text-white flex items-center justify-center shrink-0 font-display font-bold text-lg">
              52
            </div>
            <div className="flex-1 pr-4">
              <h4 className="font-display font-bold text-sm mb-1">Встановити додаток ЗДО №52</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Швидкий доступ з робочого столу, працює навіть офлайн.
              </p>
              <Button onClick={handleInstall} variant="gradient" size="sm" className="w-full">
                <Download className="h-4 w-4" /> Встановити
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
