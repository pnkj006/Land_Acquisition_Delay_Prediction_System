import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '../api/dashboard.api'

export function useDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async ({ signal }) => {
      // Pass signal down to getDashboardSummary if it supported it, but it currently doesn't pass it to fetchClient
      // The wrapper handles it automatically if we pass the signal, so we should update dashboard.api.js next.
      return getDashboardSummary({ signal })
    },
    staleTime: 60000,
  })

  return {
    summary: data?.data,
    riskDistribution: data?.riskDistribution,
    recentAlerts: data?.recentAlerts,
    attentionProjects: data?.attentionProjects,
    loading: isLoading,
    error,
    refetch,
  }
}
