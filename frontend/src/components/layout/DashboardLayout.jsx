import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import AdminSidebar from './AdminSidebar.jsx'
import Navbar from './Navbar.jsx'
import WatermarkBackground from '../common/WatermarkBackground.jsx'
import { useSidebar } from '../../context/SidebarContext.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

<<<<<<< HEAD
export default function DashboardLayout({ activeKey, children }) {
=======
const PM_TO_ADMIN_KEY = {
  dashboard: 'dashboard',
  'my-projects': 'projects',
  projects: 'projects',
  'risk-analysis': 'risk-analysis',
  'field-updates': 'field-updates',
  recommendations: 'recommendations',
  alerts: 'alerts',
  reports: 'reports',
  profile: 'profile',
  settings: 'settings',
  'project-managers': 'project-managers',
  districts: 'districts',
  'system-activity': 'system-activity',
}

function isAdminUser(user) {
  return user?.roleKey === 'admin' || user?.role === 'Administrator'
}

/**
 * Routing shell selector (no visual changes).
 * Administrator sessions render AdminSidebar; Project Manager sessions render
 * the existing PM Sidebar exactly as before. Shared pages keep using this
 * layout so an admin never sees the PM sidebar, and a PM never sees the
 * admin sidebar — regardless of URL.
 */
export default function DashboardLayout({ activeKey, adminActiveKey, children, watermarkClassName = '' }) {
>>>>>>> origin/admin-dashboard
  // Collapsed state lives in SidebarProvider (mounted in App) so it persists across route changes
  const { collapsed, toggleCollapsed } = useSidebar()
  // Real unread alert count (NotificationContext is mounted at App level),
  // shown on the sidebar Alerts item — the badge was previously hardcoded to 0.
  const { unreadCount } = useNotifications()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = isAdminUser(user)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdmin ? (
        <AdminSidebar
          activeKey={adminActiveKey || PM_TO_ADMIN_KEY[activeKey] || activeKey}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          alertsBadgeCount={unreadCount}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      ) : (
        <Sidebar
          activeKey={activeKey}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          alertsBadgeCount={unreadCount}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onOpenMobile={() => setMobileOpen(true)}
          searchPlaceholder={isAdmin ? 'Search project, district, manager...' : undefined}
        />
        {/* Content region: watermark (z-0) behind, real content (z-10) above */}
        <div className="relative flex flex-1">
          <WatermarkBackground />
          <main className="relative z-10 min-w-0 flex-1 px-4 py-5 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
