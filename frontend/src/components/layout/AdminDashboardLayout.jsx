import { useState } from 'react'
import AdminSidebar from './AdminSidebar.jsx'
import Navbar from './Navbar.jsx'
import WatermarkBackground from '../common/WatermarkBackground.jsx'
import { useSidebar } from '../../context/SidebarContext.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'

/**
 * Admin shell — same structure as DashboardLayout (sidebar + navbar + watermark)
 * but uses AdminSidebar and an admin-specific search placeholder.
 */
export default function AdminDashboardLayout({ activeKey, children, watermarkClassName = '' }) {
  const { collapsed, toggleCollapsed } = useSidebar()
  const { unreadCount } = useNotifications()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        activeKey={activeKey}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        alertsBadgeCount={unreadCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onOpenMobile={() => setMobileOpen(true)}
          searchPlaceholder="Search project, district, manager..."
        />
        <div className="relative flex flex-1">
          <WatermarkBackground imageClassName={watermarkClassName} />
          <main className="relative z-10 min-w-0 flex-1 px-4 py-5 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
