import { useState, useEffect } from 'react'
import { getConfig } from '../api/config.api'

export function useConfig() {
  const [config, setConfig] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getConfig()
        setConfig(res || {})
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return { config, loading: isLoading, error }
}
