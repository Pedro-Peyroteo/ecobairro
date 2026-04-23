import { QueryClient } from '@tanstack/react-query'

/**
 * Creates the app-wide TanStack Query client with sensible defaults.
 *
 * Defaults:
 * - staleTime: 60s — data is considered fresh for 1 minute after fetch
 * - retry: 1 — one automatic retry on failure (avoids hammering a down API)
 * - refetchOnWindowFocus: false — prevents unexpected refetches on tab switch
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}
