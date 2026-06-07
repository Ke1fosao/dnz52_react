import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';

import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/globals.css';

// Sentry — моніторинг помилок фронтенду (вмикається лише якщо задано VITE_SENTRY_DSN)
// Додайте у frontend/.env: VITE_SENTRY_DSN=https://xxxx@o123.ingest.sentry.io/456
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      // Відтворення сесій — вмикається лише при помилках (errorSampleRate=1)
      // для дотримання конфіденційності відвідувачів
      Sentry.replayIntegration(),
    ],
    // 10% транзакцій для трасування продуктивності
    tracesSampleRate: 0.1,
    // Запис Replay тільки при помилках
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 хвилин
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  </StrictMode>,
);
