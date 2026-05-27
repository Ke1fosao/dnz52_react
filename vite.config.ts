import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
