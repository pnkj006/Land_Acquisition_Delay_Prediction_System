import { useMemo } from 'react'
import { useProjects } from './useProjects.js'
import { useFieldUpdates } from './useFieldUpdates.js'

/**
 * Admin "All Project Managers" directory — derived ONLY from data that
 * already exists in the frontend:
 *
 * - The demo Project Manager account from AuthContext (pre-filled on the
 *   Login page: Rakesh Patnaik). No manager-directory API exists, so this
 *   is the only known manager record — no people are invented.
 * - Session field updates (`submittedBy`) — managers who submitted updates
 *   this session are added; this is how "Last Activity" / "Active" is known.
 *
 * Project records carry no manager-assignment field (same precedent as
 * AdminDashboard's managerRows, which renders N/A), so per-manager
 * Assigned Projects / High Risk / Pending Actions are null (rendered N/A).
 * Status is 'Active' only when the manager has a real session activity
 * signal; otherwise 'N/A' — no status is fabricated.
 */

const DEMO_MANAGER = {
  id: 'U-001',
  name: 'Rakesh Patnaik',
  email: 'rakesh.patnaik@lrd.odisha.gov.in',
  district: 'Cuttack District',
  role: 'Project Manager',
}

function matchesManager(update, manager) {
  const submittedName = String(update?.submittedBy?.name || '').trim().toLowerCase()
  if (!submittedName) return false
  if (manager.email && String(update?.submittedBy?.email || '').trim().toLowerCase() === manager.email.toLowerCase()) {
    return true
  }
  return submittedName === String(manager.name || '').trim().toLowerCase()
}

export function useProjectManagers() {
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects({ pageSize: 100 })
  const {
    updates: fieldUpdates,
    loading: fieldLoading,
    error: fieldError,
    refetch: refetchUpdates,
  } = useFieldUpdates()

  const managers = useMemo(() => {
    const byKey = new Map()
    byKey.set(DEMO_MANAGER.email.toLowerCase(), { ...DEMO_MANAGER })

    fieldUpdates.forEach((update) => {
      const submitted = update?.submittedBy
      if (!submitted || !/project manager/i.test(String(submitted.role || ''))) return
      const key = String(submitted.email || submitted.name || '').trim().toLowerCase()
      if (!key || byKey.has(key)) return
      byKey.set(key, {
        id: key,
        name: submitted.name || 'N/A',
        email: submitted.email || 'N/A',
        district: null,
        role: submitted.role || 'Project Manager',
      })
    })

    return [...byKey.values()].map((manager) => {
      const ownUpdates = fieldUpdates
        .filter((update) => matchesManager(update, manager))
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      const lastActivity = ownUpdates.length > 0 ? ownUpdates[0].submittedAt : null
      return {
        ...manager,
        // No assignment data on project records — always null (UI shows N/A).
        assignedProjects: null,
        highRisk: null,
        pendingActions: null,
        lastActivity,
        recentUpdates: ownUpdates.slice(0, 5),
        status: lastActivity ? 'Active' : 'N/A',
      }
    })
  }, [fieldUpdates])

  const districts = useMemo(() => {
    const set = new Set()
    managers.forEach((manager) => {
      if (manager.district) set.add(manager.district)
    })
    return [...set].sort()
  }, [managers])

  const loading = projectsLoading || fieldLoading
  const error = projectsError || fieldError

  const refetch = () => {
    refetchProjects()
    refetchUpdates()
  }

  return { managers, districts, projects, loading, error, refetch }
}
