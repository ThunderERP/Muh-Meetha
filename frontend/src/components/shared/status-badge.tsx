import { cn } from '@/lib/utils'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export function StatusBadge({ label, variant, dot = false, className }: {
  label: string; variant: Variant; dot?: boolean; className?: string
}) {
  const styles: Record<Variant, string> = {
    success: 'bg-success-light text-success-text',
    warning: 'bg-warning-light text-warning-text',
    danger:  'bg-danger-light text-danger-text',
    info:    'bg-info-light text-info-text',
    neutral: 'bg-surface-subtle text-text-secondary',
  }
  const dotStyles: Record<Variant, string> = {
    success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info', neutral: 'bg-text-muted',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', styles[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
      {label}
    </span>
  )
}
