import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import WatermarkBackground from '../common/WatermarkBackground.jsx'
import { useSidebar } from '../../context/SidebarContext.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'

export default function DashboardLayout({ activeKey, children }) {
  // Collapsed state lives in SidebarProvider (mounted in App) so it persists across route changes
  const { collapsed, toggleCollapsed } = useSidebar()
  // Real unread alert count (NotificationContext is mounted at App level),
  // shown on the sidebar Alerts item — the badge was previously hardcoded to 0.
  const { unreadCount } = useNotifications()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeKey={activeKey}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        alertsBadgeCount={unreadCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMobile={() => setMobileOpen(true)} />
        {/* Content region: watermark (z-0) behind, real content (z-10) above */}
        <div className="relative flex flex-1">
          <WatermarkBackground />
          <main className="relative z-10 min-w-0 flex-1 px-4 py-5 lg:px-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
