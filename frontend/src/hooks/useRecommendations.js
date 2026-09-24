import { useState, useEffect, useCallback } from 'react'
import {
  getAllRecommendations,
  updateRecommendationStatus,
  generateRecommendations,
} from '../api/recommendations.api'

export function useRecommendations() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAllRecommendations({})
      setData(res)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateStatus = async (id, status) => {
    setUpdatingId(id)
    try {
      await updateRecommendationStatus(id, status)
      await fetchData()
    } finally {
      setUpdatingId(null)
    }
  }

  const generateRecs = async (projectId) => {
    setGenerating(true)
    try {
      await generateRecommendations(projectId)
      await fetchData()
    } finally {
      setGenerating(false)
    }
  }

  return {
    recommendations: data?.data || [],
    loading: isLoading,
    error,
    refetch: fetchData,
    updateStatus,
    updatingId,
    generateRecommendations: generateRecs,
    generating,
    lastUpdated,
  }
}
