import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import apiClient from '../api/apiClient'

const AuthContext = createContext(null)

// Demo Project Manager user
const MOCK_USER = {
  id: 'U-001',
  name: 'Rakesh Patnaik',
  role: 'Project Manager',
  roleKey: 'project-manager',
  district: 'Cuttack District',
  state: 'Odisha',
  email: 'rakesh.patnaik@lrd.odisha.gov.in',
}

// Demo Admin user from admin-dashboard branch
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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore authentication when application starts via real API
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const res = await apiClient.get('/auth/me')
          setUser(res.data.data)
        }
      } catch (err) {
        setUser(null)
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [])

  // Hybrid Login (Supports Demo Account Bypass + Real API Authentication)
  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const email = String(credentials?.email || '').trim().toLowerCase()

      // 1. Check for Demo Administrator Bypass
      if (email === DEMO_ADMIN_EMAIL.toLowerCase()) {
        const demoUser = resolveDemoUser(credentials)
        setUser(demoUser)
        try {
          localStorage.setItem('lrd-auth-user', JSON.stringify(demoUser))
        } catch {
          // Ignore storage errors
        }
        return demoUser
      }

      // 2. Fallback to Production API Authentication
      const res = await apiClient.post('/auth/login', credentials)
      const { user: userData, token } = res.data.data
      localStorage.setItem('token', token)
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout Handler
  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('token')) {
        await apiClient.post('/auth/logout')
      }
    } catch (e) {
      // Ignore network errors during logout
    }
    localStorage.removeItem('token')
    localStorage.removeItem('lrd-auth-user')
    setUser(null)
    window.location.href = '/login'
  }, [])

  // Hybrid Permission engine supporting explicit string checks and admin bypass rules
  const hasPermission = useCallback(
    (resource, action) => {
      if (!user) return false

      // Intercept and bypass permissions for general Admin flags
      if (
        user.roleKey === 'admin' ||
        user.role === 'ADMIN' ||
        user.role === 'Administrator'
      ) {
        return true
      }

      if (!user.permissions) return false
      return user.permissions.includes(`${resource}:${action}`)
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
      hasPermission,
    }),
    [user, loading, login, logout, hasPermission],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
