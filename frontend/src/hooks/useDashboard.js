import { useEffect, useState } from 'react'
import { getDashboardSummary } from '../api/dashboard.api'

export function useDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    getDashboardSummary()
      .then((res) => {
        if (isMounted) setSummary(res.data)
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
  }, [])

  return { summary, loading, error }
}
