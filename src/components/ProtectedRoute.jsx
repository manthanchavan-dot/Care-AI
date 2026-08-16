import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Guards a route behind an authenticated session, and optionally a specific
 * profile role. Unauthenticated users are bounced to /login.
 * Unauthorized roles are redirected to their appropriate role home page.
 */
export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading || (isAuthenticated && !role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    if (role === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'patient') return <Navigate to="/patient" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
