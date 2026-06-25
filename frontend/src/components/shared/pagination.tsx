import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Pagination({ page, totalPages, total, limit, onPageChange }: {
  page: number; totalPages: number; total: number; limit: number; onPageChange: (page: number) => void
}) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-xs text-text-muted">
        Showing <span className="font-semibold text-text-secondary">{start}–{end}</span> of{' '}
        <span className="font-semibold text-text-secondary">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1}><ChevronLeft size={14} /></PageBtn>
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="w-8 text-center text-xs text-text-muted">…</span>
          ) : (
            <PageBtn key={p} onClick={() => onPageChange(p as number)} active={p === page}>{p}</PageBtn>
          ),
        )}
        <PageBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}><ChevronRight size={14} /></PageBtn>
      </div>
    </div>
  )
}

function PageBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-w-[32px] h-8 px-2 text-xs rounded-lg font-medium transition-colors',
        active ? 'bg-primary-600 text-white' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
      )}
    >
      {children}
    </button>
  )
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}
