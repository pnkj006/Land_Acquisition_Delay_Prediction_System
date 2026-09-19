import { useCallback, useEffect, useState } from 'react'
import { getFieldUpdates, submitFieldUpdate } from '../api/field-updates.api'

/**
 * Field Updates hook — same conventions as useProjects/useAlerts/useRisk.
 * `submit()` records an update via the API and refreshes the list so the
 * newest submission appears immediately in the feed.
 */
export function useFieldUpdates() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUpdates = useCallback(() => {
    let isMounted = true
    setLoading(true)
    getFieldUpdates()
      .then((res) => {
        if (isMounted) setUpdates(res.data)
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
    const cleanup = fetchUpdates()
    return cleanup
  }, [fetchUpdates])

  const submit = useCallback(
    async (payload) => {
      const res = await submitFieldUpdate(payload)
      fetchUpdates()
      return res
    },
    [fetchUpdates],
  )

  return { updates, loading, error, refetch: fetchUpdates, submit }
}
