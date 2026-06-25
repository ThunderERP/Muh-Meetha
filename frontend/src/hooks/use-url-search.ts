import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Drop-in replacement for useState('') on search fields.
 * Seeds the initial value from the ?search= URL param so that
 * global topbar navigation (which appends ?search=term) is reflected
 * in the page's search box and query immediately on load.
 *
 * Usage — replace:
 *   const [search, setSearch] = useState('')
 * with:
 *   const [search, setSearch] = useUrlSearch()
 */
export function useUrlSearch(): [string, React.Dispatch<React.SetStateAction<string>>] {
  const params = useSearchParams()
  return useState<string>(params.get('search') ?? '')
}
