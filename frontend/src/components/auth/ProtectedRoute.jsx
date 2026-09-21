import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ children, requiredPermission, roles }) {
  const { user, isAuthenticated, loading, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Checking session…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 1. Role-Based Access Control Rule Layer (Bypass/Routing Isolation)
  if (Array.isArray(roles) && roles.length > 0) {
    const roleKey = user?.roleKey || ''
    const roleLabel = user?.role || ''
    const allowed = roles.some((r) => r === roleKey || r === roleLabel)

    if (!allowed) {
      const isAdmin = roleKey === 'admin' || roleLabel === 'Administrator'
      // Admin session on a PM-only route → admin home (never the PM dashboard).
      if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />
      }
      // PM session on an admin-only route → PM home (never the admin dashboard).
      return <Navigate to="/project-manager/dashboard" replace />
    }
  }

  // 2. Permission-Based Access Control Rule Layer (Backend V7 Check)
  if (requiredPermission) {
    const [resource, action] = requiredPermission
    if (!hasPermission(resource, action)) {
      return (
        <div className="flex h-screen items-center justify-center flex-col">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">You do not have permission to view this page.</p>
        </div>
      )
    }
  }

  return children
}