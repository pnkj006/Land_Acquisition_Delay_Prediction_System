import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { registerAccount } from '../api/auth.api.js'

const AuthContext = createContext(null)

// Mock authenticated user — a real implementation would hydrate this from a
// login endpoint / stored token.
const MOCK_USER = {
  id: 'U-001',
  name: 'Rakesh Patnaik',
  role: 'Project Manager',
  district: 'Cuttack District',
  state: 'Odisha',
  email: 'rakesh.patnaik@lrd.odisha.gov.in',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK_USER)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (credentials) => {
    setLoading(true)
    // Simulated auth — replace with a real auth API call later.
    await new Promise((resolve) => setTimeout(resolve, 600))
    setUser(MOCK_USER)
    setLoading(false)
    return MOCK_USER
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const register = useCallback(async ({ name, email, password, role }) => {
    setLoading(true)
    try {
      const result = await registerAccount({ name, email, password, role })
      const registeredUser = {
        ...result.user,
        role: result.user?.role === 'PROJECT_MANAGER' ? 'Project Manager' : result.user?.role,
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
