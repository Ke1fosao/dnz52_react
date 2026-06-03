import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { PageSpinner } from '@/components/common/Spinner';

// Eager — головна сторінка завантажується одразу
import { HomePage } from '@/pages/HomePage';

// Lazy — інші сторінки завантажуються при переході (code splitting)
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ParentsPage = lazy(() => import('@/pages/ParentsPage').then(m => ({ default: m.ParentsPage })));
const StaffPage = lazy(() => import('@/pages/StaffPage').then(m => ({ default: m.StaffPage })));
const AttestationPage = lazy(() => import('@/pages/AttestationPage').then(m => ({ default: m.AttestationPage })));
const ContactsPage = lazy(() => import('@/pages/ContactsPage').then(m => ({ default: m.ContactsPage })));
const PageDetail = lazy(() => import('@/pages/PageDetail').then(m => ({ default: m.PageDetail })));

const NewsListPage = lazy(() => import('@/pages/news/NewsListPage').then(m => ({ default: m.NewsListPage })));
const NewsDetailPage = lazy(() => import('@/pages/news/NewsDetailPage').then(m => ({ default: m.NewsDetailPage })));

const GalleryPage = lazy(() => import('@/pages/gallery/GalleryPage').then(m => ({ default: m.GalleryPage })));
const AlbumDetailPage = lazy(() => import('@/pages/gallery/AlbumDetailPage').then(m => ({ default: m.AlbumDetailPage })));

const GroupsListPage = lazy(() => import('@/pages/groups/GroupsListPage').then(m => ({ default: m.GroupsListPage })));
const GroupDetailPage = lazy(() => import('@/pages/groups/GroupDetailPage').then(m => ({ default: m.GroupDetailPage })));

const SpecialistPageView = lazy(() => import('@/pages/specialists/SpecialistPageView').then(m => ({ default: m.SpecialistPageView })));

const CirclesListPage = lazy(() => import('@/pages/circles/CirclesListPage').then(m => ({ default: m.CirclesListPage })));
const CircleDetailPage = lazy(() => import('@/pages/circles/CircleDetailPage').then(m => ({ default: m.CircleDetailPage })));

const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const FAQPage = lazy(() => import('@/pages/FAQPage').then(m => ({ default: m.FAQPage })));
const EventsPage = lazy(() => import('@/pages/EventsPage').then(m => ({ default: m.EventsPage })));
const MenuPage = lazy(() => import('@/pages/MenuPage').then(m => ({ default: m.MenuPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AdminRedirectPage = lazy(() => import('@/pages/AdminRedirectPage').then(m => ({ default: m.AdminRedirectPage })));

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />

        <Route element={<Suspense fallback={<PageSpinner />}><AboutPage /></Suspense>} path="about" />
        <Route element={<Suspense fallback={<PageSpinner />}><ParentsPage /></Suspense>} path="parents" />
        <Route element={<Suspense fallback={<PageSpinner />}><StaffPage /></Suspense>} path="staff" />
        <Route element={<Suspense fallback={<PageSpinner />}><AttestationPage /></Suspense>} path="attestation" />
        <Route element={<Suspense fallback={<PageSpinner />}><ContactsPage /></Suspense>} path="contacts" />
        <Route element={<Suspense fallback={<PageSpinner />}><PageDetail /></Suspense>} path="page/:slug" />

        <Route element={<Suspense fallback={<PageSpinner />}><NewsListPage /></Suspense>} path="news" />
        <Route element={<Suspense fallback={<PageSpinner />}><NewsListPage /></Suspense>} path="news/category/:slug" />
        <Route element={<Suspense fallback={<PageSpinner />}><NewsDetailPage /></Suspense>} path="news/:slug" />

        <Route element={<Suspense fallback={<PageSpinner />}><GalleryPage /></Suspense>} path="gallery" />
        <Route element={<Suspense fallback={<PageSpinner />}><GalleryPage /></Suspense>} path="gallery/category/:slug" />
        <Route element={<Suspense fallback={<PageSpinner />}><AlbumDetailPage /></Suspense>} path="gallery/album/:slug" />

        <Route element={<Suspense fallback={<PageSpinner />}><GroupsListPage /></Suspense>} path="groups" />
        <Route element={<Suspense fallback={<PageSpinner />}><GroupDetailPage /></Suspense>} path="groups/:slug" />

        <Route element={<Suspense fallback={<PageSpinner />}><SpecialistPageView /></Suspense>} path="specialists/:pageType" />

        <Route element={<Suspense fallback={<PageSpinner />}><CirclesListPage /></Suspense>} path="circles" />
        <Route element={<Suspense fallback={<PageSpinner />}><CircleDetailPage /></Suspense>} path="circles/:slug" />

        <Route element={<Suspense fallback={<PageSpinner />}><DocumentsPage /></Suspense>} path="documents" />
        <Route element={<Suspense fallback={<PageSpinner />}><ReviewsPage /></Suspense>} path="reviews" />
        <Route element={<Suspense fallback={<PageSpinner />}><FAQPage /></Suspense>} path="faq" />
        <Route element={<Suspense fallback={<PageSpinner />}><EventsPage /></Suspense>} path="events" />
        <Route element={<Suspense fallback={<PageSpinner />}><MenuPage /></Suspense>} path="menu" />
        <Route element={<Suspense fallback={<PageSpinner />}><SearchPage /></Suspense>} path="search" />
        <Route element={<Suspense fallback={<PageSpinner />}><AdminRedirectPage /></Suspense>} path="admin" />

        <Route element={<Suspense fallback={<PageSpinner />}><NotFoundPage /></Suspense>} path="*" />
      </Route>
    </Routes>
  );
}
