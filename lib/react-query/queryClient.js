import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Centralized configuration for data fetching and caching
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache time: Data stays in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,

      // Retry failed requests 3 times
      retry: 3,

      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,

      // Retry delay
      retryDelay: 1000,
    },
  },
});

export default queryClient;
