/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// 1. Precache усіх зібраних ассетів (offline-доступ до оболонки додатку)
precacheAndRoute(self.__WB_MANIFEST);

// 2. Runtime-кеш для медіа (фото) — CacheFirst, до 60 файлів, 30 днів
registerRoute(
  ({ url }) => url.pathname.startsWith('/media/'),
  new CacheFirst({
    cacheName: 'dnz52-media',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

// 3. API — NetworkFirst (свіжі дані, але fallback на кеш офлайн)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'dnz52-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

// 4. Google Fonts — StaleWhileRevalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' }),
);

// 5. Push-сповіщення (нові новини)
self.addEventListener('push', (event: PushEvent) => {
  let payload: { title?: string; body?: string; url?: string; icon?: string } = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || 'ЗДО №52';
  const options: NotificationOptions = {
    body: payload.body || 'Нова новина на сайті!',
    icon: payload.icon || '/pwa-192.png',
    badge: '/pwa-192.png',
    data: { url: payload.url || '/news' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. Клік по сповіщенню — відкрити відповідну сторінку
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data?.url as string) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // Якщо вкладка вже відкрита — фокусуємо її
      const existing = clientsArr.find((c) => 'focus' in c);
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

// 7. Активувати новий SW одразу
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
