import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './lib/adminAuth';
import { AdminLayout } from './AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { QuestionsPage } from './pages/QuestionsPage';

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
          <Route path="*" element={<Navigate to="/manage" replace />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
