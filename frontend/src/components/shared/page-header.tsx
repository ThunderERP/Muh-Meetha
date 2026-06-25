import { cn } from '@/lib/utils'

export function PageHeader({ title, subtitle, actions, className }: {
  title: string; subtitle?: string; actions?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
    </div>
  )
}
