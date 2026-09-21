import { useQuery } from '@tanstack/react-query'
import { getConfig } from '../api/config.api'

export function useConfig() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })

  return { config: data || {}, loading: isLoading, error }
}
