import { useCallback, useEffect, useState } from 'react'
import { getAlerts } from '../api/alerts.api'

export function useAlerts({ projectId } = {}) {
  const [alerts, setAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch logic kept in a callback so consumers get a refetch() for the
  // Retry action (backward compatible — return object only gained a key).
  const fetchAlerts = useCallback(() => {
    let isMounted = true
    setLoading(true)
    getAlerts({ projectId })
      .then((res) => {
        if (isMounted) {
          setAlerts(res.data)
          setUnreadCount(res.unreadCount ?? 0)
        }
      })
      .catch((err) => {
        if (isMounted) setError(err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [projectId])

  useEffect(() => {
    const cleanup = fetchAlerts()
    return cleanup
  }, [fetchAlerts])

  return { alerts, unreadCount, loading, error, refetch: fetchAlerts }
}
