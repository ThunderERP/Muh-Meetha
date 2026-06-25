import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api-client'

interface SignedUrlResponse {
  url: string
  expiresInSeconds: number
}

/**
 * Resolves a storageKey to a renderable pre-signed URL.
 *
 * - Returns null immediately if key is null/undefined (no image set).
 * - Caches the result for 12 minutes (signed URLs last 15 min on the server).
 * - Automatically refetches when the cache entry expires so images never go stale.
 *
 * Usage:
 *   const { signedUrl, isLoading } = useSignedUrl(product.imageUrl)
 *   <Image src={signedUrl ?? ''} ... />
 */
export function useSignedUrl(storageKey: string | null | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['signed-url', storageKey],
    queryFn:   () => get<SignedUrlResponse>('/uploads/signed-url', { key: storageKey! }),
    enabled:   !!storageKey,
    // Cache for 12 min — signed URLs last 15 min, so we refetch with 3 min headroom
    staleTime: 12 * 60 * 1000,
    gcTime:    14 * 60 * 1000,
    retry:     1,
  })

  return {
    signedUrl: data?.url ?? null,
    isLoading: isLoading && !!storageKey,
    isError,
  }
}
