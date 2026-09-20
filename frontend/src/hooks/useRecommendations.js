import { useCallback, useEffect, useState } from 'react'
import { getAllRecommendations, updateRecommendationStatus } from '../api/recommendations.api'

/**
 * Recommendations workspace hook. Mirrors the useAlerts/useFieldUpdates
 * convention: fetch callback + isMounted guard + refetch for Retry.
 * Status updates only flip the UI AFTER the service call resolves — on
 * failure the card keeps its server state and the caller shows an error.
 */
export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchRecommendations = useCallback(() => {
    let isMounted = true
    setLoading(true)
    getAllRecommendations()
      .then((res) => {
        if (isMounted) {
          setRecommendations(res.data)
          setError(null)
          setLastUpdated(new Date())
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
  }, [])

  useEffect(() => {
    const cleanup = fetchRecommendations()
    return cleanup
  }, [fetchRecommendations])

  const updateStatus = useCallback(async (recId, status) => {
    setUpdatingId(recId)
    try {
      await updateRecommendationStatus(recId, status)
      setRecommendations((prev) => prev.map((r) => (r.id === recId ? { ...r, status } : r)))
      return true
    } catch {
      return false
    } finally {
      setUpdatingId(null)
    }
  }, [])

  return { recommendations, loading, error, refetch: fetchRecommendations, updateStatus, updatingId, lastUpdated }
}
