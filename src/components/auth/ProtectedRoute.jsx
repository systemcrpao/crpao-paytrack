import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-warm-gray/70">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-warm-gray/70">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
