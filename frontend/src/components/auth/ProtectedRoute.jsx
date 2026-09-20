import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth()

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

  if (requiredPermission) {
    const [resource, action] = requiredPermission;
    if (!hasPermission(resource, action)) {
      return (
        <div className="flex h-screen items-center justify-center flex-col">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">You do not have permission to view this page.</p>
        </div>
      );
    }
  }

  return children
}
