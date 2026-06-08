/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// 1. Precache усіх зібраних ассетів (offline-доступ до оболонки додатку)
precacheAndRoute(self.__WB_MANIFEST);

// 1a. SPA-навігації → index.html з precache (будь-який маршрут працює офлайн).
//     API/адмінка/медіа/RSS не чіпаємо — вони йдуть у мережу.
const navHandler = createHandlerBoundToURL('index.html');
registerRoute(new NavigationRoute(navHandler, {
  denylist: [/^\/api\//, /^\/admin\//, /^\/media\//, /^\/static\//, /^\/markdownx\//, /^\/rss\//, /^\/sitemap/, /^\/robots/],
}));

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

// 3. API — StaleWhileRevalidate: миттєво з кешу + фонове оновлення; офлайн — з кешу.
//    (Свіжість на рівні застосунку гарантує react-query через refetch.)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'dnz52-api',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

// 4. Google Fonts — StaleWhileRevalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' }),
);

// 4a. Офлайн-фолбек: якщо навігацію не вдалось обслужити — показуємо оболонку SPA
setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    const fallback = await matchPrecache('index.html');
    if (fallback) return fallback;
  }
  return Response.error();
});

// 5. Push-сповіщення (нові новини)
self.addEventListener('push', (event: PushEvent) => {
  let payload: { title?: string; body?: string; url?: string; icon?: string };
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
