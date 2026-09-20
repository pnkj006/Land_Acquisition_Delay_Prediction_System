import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MOCK_ALERTS } from '../api/alerts.api'
import { timeAgo } from '../utils/dateUtils'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(MOCK_ALERTS)
  const [readIds, setReadIds] = useState(() => new Set())
  const unreadCount = notifications.reduce((count, notification) => count + (readIds.has(notification.id) ? 0 : 1), 0)

  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map((notification) => notification.id)))
  }, [notifications])

  const markAsRead = useCallback((id) => {
    setReadIds((current) => new Set([...current, id]))
  }, [])

  const markAsUnread = useCallback((id) => {
    setReadIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }, [])

  const pushNotification = useCallback((notification) => {
    setNotifications((prev) => [{ ...notification, timestamp: new Date().toISOString() }, ...prev])
    setReadIds((current) => {
      const next = new Set(current)
      next.delete(notification.id)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount, readIds, markAllRead, markAsRead, markAsUnread, pushNotification, timeAgo }),
    [notifications, unreadCount, readIds, markAllRead, markAsRead, markAsUnread, pushNotification],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider')
  return context
}
