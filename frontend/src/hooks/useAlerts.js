import { getAlerts } from '../api/alerts.api'
import { useQuery } from '@tanstack/react-query'

export function useAlerts(filters = {}) {
  const query = useQuery({
    queryKey: ['alerts', filters],
    queryFn: ({ signal }) => getAlerts({ ...filters, signal }),
  })

  return { 
    alerts: query.data?.data || [], 
    unreadCount: query.data?.unreadCount || 0,
    loading: query.isLoading, 
    error: query.error, 
    refetch: query.refetch 
  }
}
