import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllRecommendations,
  updateRecommendationStatus,
  generateRecommendations,
} from '../api/recommendations.api'

/**
 * Recommendations workspace hook. Mirrors the useAlerts/useFieldUpdates
 * convention: fetch callback + isMounted guard + refetch for Retry.
 * Status updates only flip the UI AFTER the service call resolves — on
 * failure the card keeps its server state and the caller shows an error.
 */
export function useRecommendations() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['recommendations'],
    queryFn: ({ signal }) => getAllRecommendations({ signal }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateRecommendationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
  const generateMutation = useMutation({
  mutationFn: (projectId) => generateRecommendations(projectId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['recommendations'] })
  },
})

return {
  recommendations: query.data?.data || [],
  loading: query.isLoading,
  error: query.error,
  refetch: query.refetch,

  updateStatus: (id, status) =>
    mutation.mutateAsync({ id, status }),

  updatingId: mutation.variables?.id || null,

  generateRecommendations: (projectId) =>
    generateMutation.mutateAsync(projectId),

  generating: generateMutation.isPending,

  lastUpdated: query.dataUpdatedAt
    ? new Date(query.dataUpdatedAt)
    : null,
}
}
