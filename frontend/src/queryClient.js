import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => (err.message === 'Failed to fetch' || err.status >= 500) && count < 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Don't auto-retry mutations by default
    }
  },
});
