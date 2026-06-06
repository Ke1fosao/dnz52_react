import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './lib/adminAuth';
import { AdminLayout } from './AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { NewsListPage } from './pages/NewsListPage';
import { NewsFormPage } from './pages/NewsFormPage';
import { EventsListPage } from './pages/EventsListPage';
import { EventFormPage } from './pages/EventFormPage';
import { FaqItemsListPage } from './pages/FaqItemsListPage';
import { FaqItemFormPage } from './pages/FaqItemFormPage';
import { DocumentsListPage } from './pages/DocumentsListPage';
import { DocumentFormPage } from './pages/DocumentFormPage';
import { DirectoriesPage } from './pages/DirectoriesPage';
import { ContactFormPage } from './pages/ContactFormPage';
import { SlidersListPage } from './pages/SlidersListPage';
import { SliderFormPage } from './pages/SliderFormPage';
import { StaffListPage } from './pages/StaffListPage';
import { StaffFormPage } from './pages/StaffFormPage';
import { PagesListPage } from './pages/PagesListPage';
import { PageFormPage } from './pages/PageFormPage';

function Guarded() {
  const { user, loading } = useAdminAuth();
  if (loading) {
    return (
      <div className="mesh-bg-gallery min-h-screen grid place-items-center">
        <div className="premium-glass rounded-2xl px-6 py-4 font-bold text-gray-600 dark:text-slate-300">Завантаження…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/manage/login" replace />;
  return <AdminLayout />;
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<Guarded />}>
          <Route index element={<DashboardPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="news" element={<NewsListPage />} />
          <Route path="news/new" element={<NewsFormPage />} />
          <Route path="news/:id/edit" element={<NewsFormPage />} />
          <Route path="events" element={<EventsListPage />} />
          <Route path="events/new" element={<EventFormPage />} />
          <Route path="events/:id/edit" element={<EventFormPage />} />
          <Route path="faq" element={<FaqItemsListPage />} />
          <Route path="faq/new" element={<FaqItemFormPage />} />
          <Route path="faq/:id/edit" element={<FaqItemFormPage />} />
          <Route path="documents" element={<DocumentsListPage />} />
          <Route path="documents/new" element={<DocumentFormPage />} />
          <Route path="documents/:id/edit" element={<DocumentFormPage />} />
          <Route path="directories" element={<DirectoriesPage />} />
          <Route path="contact" element={<ContactFormPage />} />
          <Route path="sliders" element={<SlidersListPage />} />
          <Route path="sliders/new" element={<SliderFormPage />} />
          <Route path="sliders/:id/edit" element={<SliderFormPage />} />
          <Route path="staff" element={<StaffListPage />} />
          <Route path="staff/new" element={<StaffFormPage />} />
          <Route path="staff/:id/edit" element={<StaffFormPage />} />
          <Route path="pages" element={<PagesListPage />} />
          <Route path="pages/new" element={<PageFormPage />} />
          <Route path="pages/:id/edit" element={<PageFormPage />} />
          <Route path="*" element={<Navigate to="/manage" replace />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
