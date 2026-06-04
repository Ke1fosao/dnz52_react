import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import { StructuredData } from '@/components/common/StructuredData';
import { Analytics } from '@/components/common/Analytics';
import { CookieConsent } from '@/components/common/CookieConsent';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';

export function RootLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] dark:bg-slate-950 text-gray-900 dark:text-slate-200 transition-colors duration-500 selection:bg-blue-300 dark:selection:bg-blue-900 selection:text-gray-900 dark:selection:text-white">
      <StructuredData />
      <Analytics />
      <Navbar />

      {/* Home керує власним hero на весь екран; інші сторінки — відступ під fixed navbar */}
      <main className={isHome ? 'flex-1' : 'flex-1 pt-24 md:pt-28'}>
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

      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'Manrope, sans-serif' } }}
      />
    </div>
  );
}
