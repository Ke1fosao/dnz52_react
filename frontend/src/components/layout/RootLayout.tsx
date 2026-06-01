import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { TopBar } from './TopBar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileMenu } from './MobileMenu';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import { StructuredData } from '@/components/common/StructuredData';
import { Analytics } from '@/components/common/Analytics';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';

export function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData />
      <Analytics />
      <TopBar />
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1">
        {/* Плавний перехід між сторінками (key = шлях) */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />

      <ScrollToTopButton />
      <PWAInstallPrompt />

      {/* Тостер-нотифікації (sonner) */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: 'Nunito, sans-serif' },
        }}
      />
    </div>
  );
}
