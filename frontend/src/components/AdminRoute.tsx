import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Hides admin pages from non-admin users in the UI. This is a convenience
 * only — it does NOT make the app secure by itself. Every admin API
 * endpoint independently re-checks the caller's role server-side
 * (see backend/src/middleware/auth.ts:requireAdmin), because a client-side
 * route guard can always be bypassed by someone editing the frontend.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading, isAdmin } = useAuth();

  if (loading) return <LoadingSpinner label="Verifying access" />;
  if (!profile || !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
