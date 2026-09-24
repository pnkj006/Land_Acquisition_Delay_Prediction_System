import { useState, useEffect, useCallback } from 'react'
import { getDashboardSummary } from '../api/dashboard.api'

export function useDashboard() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getDashboardSummary()
      setData(res)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    summary: data?.data,
    riskDistribution: data?.riskDistribution,
    recentAlerts: data?.recentAlerts,
    attentionProjects: data?.attentionProjects,
    loading: isLoading,
    error,
    refetch: fetchData,
  }
}
