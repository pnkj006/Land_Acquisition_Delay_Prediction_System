import { fetchClient } from './fetchClient'

const API_BASE = '/users'

export const usersApi = {
  listUsers: async (params) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page)
    if (params?.limit) query.append('limit', params.limit)
    if (params?.role) query.append('role', params.role)
    const res = await fetchClient(`${API_BASE}?${query.toString()}`)
    return res.data
  },
  
  createUser: async (data) => {
    const res = await fetchClient(API_BASE, { method: 'POST', body: data })
    return res.data
  },
  
  updateUser: async (id, data) => {
    const res = await fetchClient(`${API_BASE}/${id}`, { method: 'PATCH', body: data })
    return res.data
  },
  
  deleteUser: async (id) => {
    const res = await fetchClient(`${API_BASE}/${id}`, { method: 'DELETE' })
    return res.data
  },
  
  getPermissions: async (id) => {
    const res = await fetchClient(`${API_BASE}/${id}/permissions`)
    return res.data
  },
  
  setPermissions: async (id, grants) => {
    const res = await fetchClient(`${API_BASE}/${id}/permissions`, { method: 'PUT', body: { grants } })
    return res.data
  }
}
/**
 * Get active Project Managers.
 */
export async function getProjectManagers() {
  const res = await fetchClient(
    '/users?role=PROJECT_MANAGER&is_active=true&limit=100',
  )

  return {
    data: res.data ?? [],
    pagination: res.pagination ?? null,
  }
}
