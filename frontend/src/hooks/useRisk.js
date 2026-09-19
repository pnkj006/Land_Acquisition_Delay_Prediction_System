import { useCallback, useEffect, useState } from 'react'
import { getRiskPrediction } from '../api/risk.api'

export function useRisk(projectId) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPrediction = useCallback(() => {
    if (!projectId) return
    let isMounted = true
    setLoading(true)
    getRiskPrediction(projectId)
      .then((res) => {
        if (isMounted) setPrediction(res.data)
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
    const cleanup = fetchPrediction()
    return cleanup
  }, [fetchPrediction])

  return { prediction, loading, error, refetch: fetchPrediction }
}
