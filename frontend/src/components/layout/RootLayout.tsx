import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { m as motion } from '@/lib/motion';
import { Toaster } from 'sonner';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import { BackgroundDecor } from '@/components/common/BackgroundDecor';
import { StructuredData } from '@/components/common/StructuredData';
import { Analytics } from '@/components/common/Analytics';
import { CookieConsent } from '@/components/common/CookieConsent';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';
import { CommandPalette, useCommandPalette } from '@/components/common/CommandPalette';
import { cn } from '@/lib/utils';

export function RootLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col text-gray-900 dark:text-slate-200 transition-colors duration-500 selection:bg-blue-300 dark:selection:bg-blue-900 selection:text-gray-900 dark:selection:text-white">
      {/* Декоративний тематичний фон (за контентом) */}
      <BackgroundDecor />

      {/* Skip-link — для навігації з клавіатури / скрінрідерів */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-5 focus:py-3 focus:rounded-full focus:bg-blue-600 focus:text-white focus:font-bold focus:shadow-lg"
      >
        Перейти до основного вмісту
      </a>

      <StructuredData />
      <Analytics />
      <Navbar onOpenPalette={() => setPaletteOpen(true)} />

      {/* Home керує власним hero на весь екран; інші сторінки — відступ під fixed navbar */}
      <main id="main-content" tabIndex={-1} className={cn('outline-none', isHome ? 'flex-1' : 'flex-1 pt-24 md:pt-28')}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />

      <ScrollToTopButton />
      <PWAInstallPrompt />
      <CookieConsent />

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'Manrope, sans-serif' } }}
      />
    </div>
  );
}
