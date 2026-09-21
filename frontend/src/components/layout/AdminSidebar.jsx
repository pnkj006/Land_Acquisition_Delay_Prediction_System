import { NavLink } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bell,
  ClipboardList,
  FileBarChart,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Menu,
  PanelLeftClose,
  Settings,
  User,
  Users,
} from 'lucide-react'
import { ADMIN_NAV_ITEMS } from '../../utils/constants'
import logo from '../../assets/images/logo.png'

const ICONS = {
  LayoutDashboard,
  FolderKanban,
  Users,
  MapPin,
  AlertTriangle,
  ClipboardList,
  Lightbulb,
  Bell,
  FileBarChart,
  Activity,
  User,
  Settings,
}

/**
 * Admin-only navigation rail. Mirrors the existing Sidebar visual language
 * but uses ADMIN_NAV_ITEMS so the Project Manager sidebar stays untouched.
 */
export default function AdminSidebar({
  activeKey = 'dashboard',
  collapsed = false,
  onToggle,
  alertsBadgeCount = 0,
  mobileOpen = false,
  onCloseMobile,
}) {
  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onCloseMobile} />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-primary-dark via-primary-dark to-[#0d2f1f] text-white shadow-xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {collapsed ? (
          <div className="flex animate-fade-in justify-center py-4">
            <button
              type="button"
              onClick={onToggle}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex animate-fade-in items-center gap-3 px-4 py-4">
            <img
              src={logo}
              alt="SANKET logo"
              draggable={false}
              className="h-12 w-12 shrink-0 rounded-full bg-white/95 object-cover ring-1 ring-white/25"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">SANKET</p>
              <p className="truncate text-[10px] font-medium tracking-wide text-primary-100">Land Acquisition Delay Predictor</p>
            </div>
          </div>
        )}

        <div className="mx-4 border-t border-white/10" />

        {!collapsed ? (
          <p className="px-5 pb-1 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Admin Menu</p>
        ) : null}

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-2">
          <ul className="flex flex-col gap-0.5">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.icon]
              const isActive = item.key === activeKey
              const isAlerts = item.key === 'alerts'
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center rounded-lg py-2 text-sm transition-colors ${
                      collapsed ? 'justify-center px-2.5' : 'gap-3 px-3'
                    } ${isActive ? 'bg-white/15 font-semibold text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                  >
                    {isActive ? (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent-light"
                        aria-hidden="true"
                      />
                    ) : null}
                    {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                    {!collapsed ? <span className="truncate animate-fade-in">{item.label}</span> : null}
                    {isAlerts && alertsBadgeCount > 0 && !collapsed ? (
                      <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {alertsBadgeCount}
                      </span>
                    ) : null}
                    {isAlerts && alertsBadgeCount > 0 && collapsed ? (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                    ) : null}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {!collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="absolute -right-3 top-16 hidden h-6 w-6 animate-fade-in items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow transition-colors hover:text-accent lg:flex"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </aside>
    </>
  )
}
