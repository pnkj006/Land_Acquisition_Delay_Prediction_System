import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

<<<<<<< HEAD
export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth()
=======
/**
 * Auth gate. Optional `roles` accepts roleKey values ('admin' | 'project-manager')
 * or display role strings. When omitted, any authenticated user may proceed
 * (legacy behaviour for shared workspaces).
 *
 * Role isolation (routing only, no UI change):
 * - Admin-only route hit by a PM  → /dashboard (PM home)
 * - PM-only route hit by an admin → /admin/dashboard (Admin home)
 * This keeps /dashboard PM-only and /admin/* admin-only without touching page UI.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, loading } = useAuth()
<<<<<<< HEAD
>>>>>>> origin/admin-dashboard
=======
>>>>>>> 584dfbe (Add admin pages and update SANKET branding)
>>>>>>> ac465b9fcc447332bbf2b263ec28e795ec440c9e

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

<<<<<<< HEAD
  if (requiredPermission) {
    const [resource, action] = requiredPermission;
    if (!hasPermission(resource, action)) {
      return (
        <div className="flex h-screen items-center justify-center flex-col">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">You do not have permission to view this page.</p>
        </div>
      );
=======
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
      return <Navigate to="/dashboard" replace />
<<<<<<< HEAD
>>>>>>> origin/admin-dashboard
=======
>>>>>>> 584dfbe (Add admin pages and update SANKET branding)
>>>>>>> ac465b9fcc447332bbf2b263ec28e795ec440c9e
    }
  }

  return children
}
