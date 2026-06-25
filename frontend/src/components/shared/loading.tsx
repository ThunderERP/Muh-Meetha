import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingSpinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-primary-600', className)} />
}

export function PageLoading() {
  return <div className="flex items-center justify-center py-24"><LoadingSpinner size={28} /></div>
}

export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-surface-subtle rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return <>{Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}</>
}

export function StatCardSkeleton() {
  return (
    <div className="erp-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-surface-subtle rounded-lg" />
        <div className="w-16 h-5 bg-surface-subtle rounded-full" />
      </div>
      <div className="h-7 bg-surface-subtle rounded w-2/3 mb-1.5" />
      <div className="h-4 bg-surface-subtle rounded w-1/2" />
    </div>
  )
}
