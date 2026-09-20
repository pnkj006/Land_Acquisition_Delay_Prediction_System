import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { registerAccount } from '../api/auth.api.js'

const AuthContext = createContext(null)

// Mock authenticated user — a real implementation would hydrate this from a
// login endpoint / stored token.
const MOCK_USER = {
  id: 'U-001',
  name: 'Rakesh Patnaik',
  role: 'Project Manager',
  roleKey: 'project-manager',
  district: 'Cuttack District',
  state: 'Odisha',
  email: 'rakesh.patnaik@lrd.odisha.gov.in',
}

// Demo admin account — same mock-auth pattern as MOCK_USER; credentials are
// matched in login() so Project Manager demo sign-in is unchanged.
export const MOCK_ADMIN_USER = {
  id: 'U-ADMIN',
  name: 'Administrator',
  role: 'Administrator',
  roleKey: 'admin',
  district: null,
  state: 'Odisha',
  email: 'admin@lrd.odisha.gov.in',
}

export const DEMO_ADMIN_EMAIL = 'admin@lrd.odisha.gov.in'

function resolveDemoUser(credentials = {}) {
  const email = String(credentials.email || '').trim().toLowerCase()
  if (email === DEMO_ADMIN_EMAIL.toLowerCase()) {
    return MOCK_ADMIN_USER
  }
  return MOCK_USER
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('lrd-auth-user')
      return raw ? JSON.parse(raw) : MOCK_USER
    } catch {
      return MOCK_USER
    }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (credentials) => {
    setLoading(true)
    // Simulated auth — replace with a real auth API call later.
    await new Promise((resolve) => setTimeout(resolve, 600))
    const nextUser = resolveDemoUser(credentials)
    setUser(nextUser)
    try {
      localStorage.setItem('lrd-auth-user', JSON.stringify(nextUser))
    } catch {
      // Session-only fallback when storage is unavailable.
    }
    setLoading(false)
    return nextUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem('lrd-auth-user')
    } catch {
      // Ignore storage errors on logout.
    }
  }, [])

  const register = useCallback(async ({ name, email, password, role }) => {
    setLoading(true)
    try {
      const result = await registerAccount({ name, email, password, role })
      const registeredUser = {
        ...result.user,
        role: result.user?.role === 'PROJECT_MANAGER' ? 'Project Manager' : result.user?.role,
        roleKey: result.user?.role === 'ADMIN' ? 'admin' : 'project-manager',
      }
      setUser(registeredUser)
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  // Profile edits are intentionally held only for the current browser session.
  // There is no profile API or persistence layer connected to this frontend.
  const updateProfile = useCallback((updates) => {
    setUser((currentUser) => (currentUser ? { ...currentUser, ...updates } : currentUser))
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, register, updateProfile, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout, register, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
