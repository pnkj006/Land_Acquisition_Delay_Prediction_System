import { useState } from 'react'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { useAuth } from '../../context/AuthContext.jsx'
import logo from '../../assets/images/logo.png'

export default function Navbar({ onOpenMobile, searchPlaceholder = 'Search project, district, document...' }) {
  const { unreadCount, markAllRead, notifications, timeAgo } = useNotifications()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [bellOpen, setBellOpen] = useState(false)

  const recentNotifications = notifications.slice(0, 5)

  // Initials avatar derived from the logged-in user (AuthContext).
  const initials = (user?.name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-2.5 lg:gap-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand — logo + product name + tagline */}
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logo}
            alt="SANKET system logo"
            draggable={false}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
          />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-bold leading-tight text-gray-900">
              SANKET
            </p>
            <p className="truncate text-[11px] font-medium text-gray-500">Land Acquisition Delay Predictor</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative ml-auto hidden w-64 lg:block xl:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 transition-colors focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </div>

        {/* Notifications */}
        <div className="relative ml-auto lg:ml-0">
          <button
            type="button"
            onClick={() => {
              setBellOpen((o) => !o)
              if (!bellOpen) markAllRead()
            }}
            className="relative rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 top-12 w-72 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
              <p className="px-2 py-1.5 text-xs font-semibold text-gray-700">Notifications</p>
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                {recentNotifications.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-gray-400">No notifications</p>
                ) : (
                  recentNotifications.map((n) => (
                    <div key={n.id} className="rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50">
                      <p className="text-xs leading-snug text-gray-700">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(n.timestamp)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* User — data comes from AuthContext (logged-in user) */}
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold leading-tight text-gray-800">{user?.name || '—'}</p>
            <p className="text-[10px] leading-tight text-gray-500">{user?.role || ''}</p>
            <p className="text-[10px] leading-tight text-gray-400">{user?.district || ''}</p>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-primary-100"
            aria-label="User menu"
          >
            {initials || 'U'}
          </button>
          <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 sm:block" />
        </div>
      </div>
    </header>
  )
}

