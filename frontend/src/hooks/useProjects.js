import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { getProjectById, getProjects } from '../api/projects.api'

export function useProjects(initialFilters = {}) {
  const [filters, setFilters] = useState({ page: 1, pageSize: 5, search: '', riskLevel: '', stage: '', ...initialFilters })
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters.search])

  const queryFilters = { ...filters, search: debouncedSearch }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', queryFilters],
    queryFn: ({ signal }) => getProjects(queryFilters),
  })

  return {
    projects: data?.data || [],
    pagination: {
      total: data?.total || 0,
      page: data?.page || 1,
      pageSize: data?.pageSize || 5,
      totalPages: data?.totalPages || 1
    },
    loading: isLoading,
    error: isError ? error : null,
    filters,
    setFilters,
    refetch,
  }
}

export function useProjectDetails(projectId) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  })

  return {
    project: data?.data || null,
    loading: isLoading,
    error: isError ? error : null,
  }
}
