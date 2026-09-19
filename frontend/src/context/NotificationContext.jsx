import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MOCK_ALERTS } from '../api/alerts.api'
import { timeAgo } from '../utils/dateUtils'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(MOCK_ALERTS)
  const [unreadCount, setUnreadCount] = useState(MOCK_ALERTS.length)

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const pushNotification = useCallback((notification) => {
    setNotifications((prev) => [{ ...notification, timestamp: new Date().toISOString() }, ...prev])
    setUnreadCount((count) => count + 1)
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount, markAllRead, pushNotification, timeAgo }),
    [notifications, unreadCount, markAllRead, pushNotification],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider')
  return context
}
