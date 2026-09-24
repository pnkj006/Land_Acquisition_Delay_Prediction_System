import { useState, useEffect, useCallback } from 'react'
import { getAlerts } from '../api/alerts.api'

export function useAlerts(filters = {}) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const stringifiedFilters = JSON.stringify(filters)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAlerts(JSON.parse(stringifiedFilters))
      setData(res)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [stringifiedFilters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { 
    alerts: data?.data || [], 
    unreadCount: data?.unreadCount || 0,
    loading: isLoading, 
    error, 
    refetch: fetchData 
  }
}
