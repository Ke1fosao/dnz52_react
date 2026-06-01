import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Кастомний service worker (offline-кеш + push-сповіщення)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Заклад дошкільної освіти №52',
        short_name: 'ЗДО №52',
        description: 'Офіційний сайт ЗДО №52, м. Рівне — новини, групи, галерея, меню.',
        lang: 'uk',
        theme_color: '#4A90E2',
        background_color: '#FFF9F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,  // SW не вмикаємо в dev (заважає HMR)
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Проксі для Django REST API — щоб не мати CORS-проблем у деві
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          'vendor-query': ['@tanstack/react-query', 'axios'],
          'vendor-motion': ['framer-motion'],
          'vendor-form': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'vendor-lightbox': ['yet-another-react-lightbox'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
