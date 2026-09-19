import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const SidebarContext = createContext(null)

/**
 * Holds the sidebar collapsed/expanded state at App level so it survives
 * route navigation (each page mounts its own DashboardLayout, so local
 * state there would reset on every navigation).
 */
export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [])
  const value = useMemo(() => ({ collapsed, toggleCollapsed }), [collapsed, toggleCollapsed])

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider')
  return ctx
}