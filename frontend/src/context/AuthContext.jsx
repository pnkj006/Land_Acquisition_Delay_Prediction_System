import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'
import apiClient from '../api/apiClient'

const AuthContext = createContext(null)

// Demo admin account pattern used by the admin dashboard
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Start loading while checking /me

  // Hydrate user session on mount via real API
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await apiClient.get('/auth/me');
          setUser(res.data.data);
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  // Real login API integration
  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const res = await apiClient.post('/auth/login', credentials);
      const { user: userData, token } = res.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false)
    }
  }, [])

  // Real logout API integration
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  }, [])

  // Permission checks introduced by Backend V7
  const hasPermission = useCallback((resource, action) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(`${resource}:${action}`);
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: Boolean(user), hasPermission }),
    [user, loading, login, logout, hasPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
