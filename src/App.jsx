import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { APP_TITLE } from './constants';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OverviewPage from './pages/OverviewPage';

function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageLabel =
      pathname === '/login'
        ? 'เข้าสู่ระบบ'
        : pathname === '/overview'
          ? 'ภาพรวมระบบ'
          : 'งานของฉัน';

    document.title = `${pageLabel} | ${APP_TITLE}`;
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}
      >
        <DocumentTitle />
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/overview" element={<OverviewPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
