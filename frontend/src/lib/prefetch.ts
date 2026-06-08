/**
 * Prefetch lazy-чанків сторінок при наведенні на посилання навбара.
 * Завантаження відбувається один раз на сесію (Set для дедуплікації).
 */

type Loader = () => Promise<unknown>;

const ROUTE_MAP: Record<string, Loader> = {
  '/about':                () => import('@/pages/AboutPage'),
  '/parents':              () => import('@/pages/ParentsPage'),
  '/staff':                () => import('@/pages/StaffPage'),
  '/attestation':          () => import('@/pages/AttestationPage'),
  '/contacts':             () => import('@/pages/ContactsPage'),
  '/news':                 () => import('@/pages/news/NewsListPage'),
  '/gallery':              () => import('@/pages/gallery/GalleryPage'),
  '/groups':               () => import('@/pages/groups/GroupsListPage'),
  '/circles':              () => import('@/pages/circles/CirclesListPage'),
  '/menu':                 () => import('@/pages/MenuPage'),
  '/enrollment':           () => import('@/pages/EnrollmentPage'),
  '/tour':                 () => import('@/pages/TourPage'),
  '/documents':            () => import('@/pages/DocumentsPage'),
  '/reviews':              () => import('@/pages/ReviewsPage'),
  '/faq':                  () => import('@/pages/FAQPage'),
  '/events':               () => import('@/pages/EventsPage'),
  '/search':               () => import('@/pages/SearchPage'),
  '/specialists':          () => import('@/pages/specialists/SpecialistPageView'),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string): void {
  // Беремо перший сегмент (/groups/slug → /groups)
  const base = '/' + (path.split('/')[1] ?? '');
  const key = ROUTE_MAP[path] ? path : base;
  if (prefetched.has(key)) return;
  const load = ROUTE_MAP[key];
  if (!load) return;
  prefetched.add(key);
  load().catch(() => {});
}
