import { useCallback, useEffect, useState } from 'react'
import { getProjectById, getProjects } from '../api/projects.api'

export function useProjects(initialFilters = {}) {
  const [filters, setFilters] = useState({ page: 1, pageSize: 5, search: '', riskLevel: '', stage: '', ...initialFilters })
  const [projects, setProjects] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 5, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(() => {
    setLoading(true)
    getProjects(filters)
      .then((res) => {
        setProjects(res.data)
        setPagination({ total: res.total, page: res.page, pageSize: res.pageSize, totalPages: res.totalPages })
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return { projects, pagination, loading, error, filters, setFilters, refetch: fetchProjects }
}

export function useProjectDetails(projectId) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) return
    let isMounted = true
    setLoading(true)
    getProjectById(projectId)
      .then((res) => {
        if (isMounted) setProject(res.data)
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

  return { project, loading, error }
}
