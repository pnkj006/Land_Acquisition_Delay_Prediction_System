import { useState, useEffect, useCallback } from 'react'
import { getProjectById, getProjects } from '../api/projects.api'

export function useProjects(initialFilters = {}) {
  const [filters, setFilters] = useState({ page: 1, pageSize: 5, search: '', riskLevel: '', stage: '', ...initialFilters })
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters.search])

  const queryFilters = { ...filters, search: debouncedSearch }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getProjects(queryFilters)
      setData(res)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [queryFilters.page, queryFilters.pageSize, queryFilters.search, queryFilters.riskLevel, queryFilters.stage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    projects: data?.data || [],
    pagination: {
      total: data?.total || 0,
      page: data?.page || 1,
      pageSize: data?.pageSize || 5,
      totalPages: data?.totalPages || 1
    },
    loading: isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchData,
  }
}

export function useProjectDetails(projectId) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getProjectById(projectId)
        setData(res)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [projectId])

  return {
    project: data?.data || null,
    loading: isLoading,
    error,
  }
}
