'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpDown, Filter } from 'lucide-react'
import { stockMovementsApi } from '@/lib/inventory-api'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { TableSkeleton } from '@/components/shared/loading'
import { formatDate } from '@/lib/utils'
import { StockMovementType } from '@/types'

const MOVEMENT_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'INWARD', label: 'Stock In' },
  { value: 'OUTWARD', label: 'Stock Out' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RESERVATION', label: 'Reserved' },
  { value: 'RESERVATION_RELEASE', label: 'Released' },
]

const typeLabel = (type: string) => MOVEMENT_TYPES.find((t) => t.value === type)?.label ?? type
const typeVariant = (type: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' => {
  if (type === 'INWARD') return 'success'
  if (type === 'OUTWARD') return 'danger'
  if (type === 'ADJUSTMENT') return 'warning'
  if (type === 'RESERVATION') return 'info'
  return 'neutral'
}

export default function StockMovementsPage() {
  const [page, setPage] = useState(1)
  const [typeFilter, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', page, typeFilter, from, to],
    queryFn: () => stockMovementsApi.list({
      page, limit: 25,
      type: (typeFilter as StockMovementType) || undefined,
      from: from || undefined, to: to || undefined,
    }),
    placeholderData: (prev) => prev,
  })

  const movements = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader title="Stock Movements" subtitle="Complete log of all inventory transactions" />

      <div className="erp-card px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <select value={typeFilter} onChange={(e) => { setType(e.target.value); setPage(1) }} className="erp-input h-8 text-sm w-40">
            {MOVEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted font-medium">From</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} className="erp-input h-8 text-sm w-36" />
          <label className="text-xs text-text-muted font-medium">To</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} className="erp-input h-8 text-sm w-36" />
        </div>
        {(typeFilter || from || to) && (
          <button onClick={() => { setType(''); setFrom(''); setTo(''); setPage(1) }} className="text-xs text-primary-600 hover:underline">Clear filters</button>
        )}
        <div className="ml-auto text-xs text-text-muted">{meta ? `${meta.total} records` : ''}</div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr><th>#</th><th>Date & Time</th><th>Product</th><th>Type</th><th>Stock Before → After</th><th>Qty</th><th>Reference</th><th>By</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={10} cols={8} />
              ) : movements.length === 0 ? (
                <tr><td colSpan={8} className="border-0 py-0"><EmptyState icon={<ArrowUpDown size={24} />} title="No movements yet" description="Stock movements will appear here as you adjust inventory" /></td></tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td className="text-xs font-mono text-text-muted">#{m.id}</td>
                    <td className="text-xs text-text-muted whitespace-nowrap">{formatDate(m.createdAt, 'datetime')}</td>
                    <td>
                      <p className="font-semibold text-text-primary text-sm">{m.product?.name ?? `Product #${m.productId}`}</p>
                      {m.product?.sku && <p className="text-xs font-mono text-text-muted">{m.product.sku}</p>}
                    </td>
                    <td><StatusBadge label={typeLabel(m.type)} variant={typeVariant(m.type)} /></td>
                    <td className="text-xs text-text-secondary">{m.stockBefore} → {m.stockAfter}</td>
                    <td><span className={`font-bold ${m.type === 'OUTWARD' ? 'text-danger' : m.type === 'INWARD' ? 'text-success' : 'text-warning'}`}>{m.type === 'OUTWARD' ? '-' : '+'}{m.quantity}</span></td>
                    <td className="text-xs text-text-muted">{m.referenceType}{m.referenceId ? ` #${m.referenceId}` : ''}</td>
                    <td className="text-xs text-text-muted">{m.createdByUser?.name ?? `User #${m.createdBy}`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={25} onPageChange={setPage} />}
      </div>
    </div>
  )
}
