import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'
import { getAlerts, markAllAlertsRead } from '../api/alerts.api'
import { timeAgo } from '../utils/dateUtils'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    getAlerts()
      .then(data => {
        setNotifications(data || [])
        setUnreadCount((data || []).filter(n => !n.isRead).length)
      })
      .catch(err => console.error('Error fetching alerts:', err))
  }, [])

  const markAllRead = useCallback(() => {
    markAllAlertsRead()
      .then(() => {
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      })
      .catch(err => console.error('Error marking alerts read:', err))
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
