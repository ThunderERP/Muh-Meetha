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
    // staleTime 12 min: refetch before the 15-min signed URL expires (3 min headroom)
    // gcTime   16 min: keep in cache after going stale so a background refetch can replace it
    //                   before it's garbage-collected; prevents a visible 403 on long sessions
    staleTime: 12 * 60 * 1000,
    gcTime:    16 * 60 * 1000,
    retry:     1,
  })

  return {
    signedUrl: data?.url ?? null,
    isLoading: isLoading && !!storageKey,
    isError,
  }
}
