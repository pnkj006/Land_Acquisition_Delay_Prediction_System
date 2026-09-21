import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function isAdminUser(user) {
  return user?.roleKey === 'admin' || user?.role === 'Administrator'
}

/**
 * Routing-only fallback (no UI change).
 * - Authenticated admin on an unknown path → /admin/dashboard
 * - Authenticated PM on an unknown path → /dashboard
 * - Guests on an unknown path → / (public landing)
 * This prevents an admin ever "falling back" into the PM dashboard.
 */
export default function RoleFallback() {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Checking session…
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <Navigate to={isAdminUser(user) ? '/admin/dashboard' : '/dashboard'} replace />
}
