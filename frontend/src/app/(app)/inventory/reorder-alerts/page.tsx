'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { reorderAlertsApi } from '@/lib/inventory-api'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { TableSkeleton } from '@/components/shared/loading'
import { formatCurrency, formatNumber, getStockStatus } from '@/lib/utils'

export default function ReorderAlertsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['reorder-alerts', page],
    queryFn: () => reorderAlertsApi.list({ page, limit: 25 }),
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
  })

  const items = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader
        title="Reorder Alerts"
        subtitle="Products at or below their reorder level"
        actions={meta?.total ? <span className="badge-warning text-sm px-3 py-1">{meta.total} {meta.total === 1 ? 'alert' : 'alerts'}</span> : null}
      />

      {!isLoading && items.length > 0 && (
        <div className="bg-warning-light border border-warning/30 rounded-xl px-5 py-4 mb-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-warning-text">{meta?.total} {meta?.total === 1 ? 'product requires' : 'products require'} restocking</p>
            <p className="text-xs text-warning-text/80 mt-0.5">Review and place purchase orders to avoid stockouts</p>
          </div>
          <Link href="/inventory/suppliers" className="ml-auto flex items-center gap-1 text-xs font-semibold text-warning-text hover:underline">View Suppliers <ArrowRight size={13} /></Link>
        </div>
      )}

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Unit</th><th>Available</th><th>Reorder At</th><th>Deficit</th><th>Selling Price</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={8} cols={9} />
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="border-0 py-0"><EmptyState icon={<AlertTriangle size={24} />} title="No reorder alerts" description="All your products are above their reorder levels. Great work!" /></td></tr>
              ) : (
                items.map((p) => {
                  const qty = p.inventory?.availableQty ?? 0
                  const reorder = p.inventory?.reorderLevel ?? 10
                  const deficit = Math.max(0, reorder - qty)
                  const { label, variant } = getStockStatus(qty, reorder)
                  return (
                    <tr key={p.id}>
                      <td><p className="font-semibold text-text-primary">{p.name}</p>{p.sku && <p className="text-xs font-mono text-text-muted">{p.sku}</p>}</td>
                      <td><span className="badge-neutral">{p.category ?? '—'}</span></td>
                      <td className="text-text-secondary">{p.unit}</td>
                      <td><span className={`font-bold text-base ${qty === 0 ? 'text-danger' : 'text-warning'}`}>{formatNumber(qty)}</span></td>
                      <td className="text-text-secondary">{formatNumber(reorder)}</td>
                      <td><span className="font-semibold text-danger">{deficit > 0 ? `−${formatNumber(deficit)}` : '—'}</span></td>
                      <td>{formatCurrency(p.price)}</td>
                      <td><StatusBadge label={label} variant={variant} dot /></td>
                      <td><Link href="/inventory/stock" className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">Restock <ArrowRight size={12} /></Link></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={25} onPageChange={setPage} />}
      </div>
    </div>
  )
}
