import { fetchClient } from './fetchClient'

export async function getAlerts(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page)
  if (params.limit) query.append('limit', params.limit)
  if (params.isRead !== undefined) query.append('isRead', params.isRead)
  
  const res = await fetchClient(`/alerts?${query.toString()}`)
  return { data: res.data, unreadCount: res.unreadCount }
}

export async function markAllAlertsRead() {
  const res = await fetchClient(`/alerts/read-all`, { method: 'PATCH' })
  return res.data
}

export async function markAlertRead(alertId) {
  const res = await fetchClient(`/alerts/${alertId}/read`, { method: 'PATCH' })
  return res.data
}
