'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, Boxes, History } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { productsApi, inventoryApi } from '@/lib/inventory-api'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Modal } from '@/components/shared/modal'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { TableSkeleton } from '@/components/shared/loading'
import { formatCurrency, formatNumber, formatDate, getStockStatus, permissions } from '@/lib/utils'
import { Product, StockMovementType } from '@/types'

// Matches backend AdjustStockDto: quantity must be positive int, type is IsIn-checked
const adjustSchema = z.object({
  type: z.enum(['INWARD', 'OUTWARD', 'ADJUSTMENT']),
  quantity: z.number({ invalid_type_error: 'Quantity is required' }).int().positive('Must be a positive whole number'),
  notes: z.string().optional(),
})
type AdjustForm = z.infer<typeof adjustSchema>

const ADJUST_TYPES: { value: StockMovementType; label: string; icon: React.ElementType; variant: 'success' | 'danger' | 'warning'; hint: string }[] = [
  { value: 'INWARD', label: 'Stock In', icon: ArrowUpCircle, variant: 'success', hint: 'Adds quantity to current stock' },
  { value: 'OUTWARD', label: 'Stock Out', icon: ArrowDownCircle, variant: 'danger', hint: 'Removes quantity from current stock' },
  { value: 'ADJUSTMENT', label: 'Adjustment', icon: SlidersHorizontal, variant: 'warning', hint: 'Adds (use negative-equivalent via Stock Out for reductions)' },
]

const ADJUSTMENT_REASONS = ['Damaged Goods', 'Expired Stock', 'Theft / Loss', 'Reconciliation', 'Sample / Internal Use', 'Return from Customer', 'Other']

export default function StockManagementPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canWrite = user ? permissions.canWriteInventory(user.role) : false

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)
  const [historyPage, setHistoryPage] = useState(1)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AdjustForm>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: 'INWARD', quantity: 1 },
  })
  const selectedType = watch('type')

  const { data, isLoading } = useQuery({
    queryKey: ['products-stock', page, search],
    queryFn: () => productsApi.list({ page, limit: 20, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['stock-history', historyProduct?.id, historyPage],
    queryFn: () => inventoryApi.history(historyProduct!.id, { page: historyPage, limit: 10 }),
    enabled: !!historyProduct,
  })

  const adjustMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: AdjustForm }) =>
      inventoryApi.adjust(productId, { type: data.type, quantity: data.quantity, notes: data.notes, referenceType: 'MANUAL' }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products-stock'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      toast.success(`Stock updated. New quantity: ${result.inventory.availableQty}`)
      setAdjustingProduct(null)
      reset()
    },
    // Surfaces backend's exact "Insufficient stock" message
    onError: (e) => toast.error((e as Error).message),
  })

  const onAdjust = (data: AdjustForm) => {
    if (!adjustingProduct) return
    adjustMutation.mutate({ productId: adjustingProduct.id, data })
  }

  const products = data?.data ?? []
  const meta = data?.meta
  const movTypeLabel = (t: string) => ADJUST_TYPES.find((x) => x.value === t)?.label ?? t
  const movVariant = (t: string) => ADJUST_TYPES.find((x) => x.value === t)?.variant ?? 'neutral'

  return (
    <div>
      <PageHeader title="Stock Management" subtitle="View and adjust stock levels for all products" />

      <div className="erp-card px-4 py-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search products…" className="erp-input pl-8 h-8 text-sm" />
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product</th><th>Category</th><th>Unit</th><th>Available Qty</th>
                <th>Reserved Qty</th><th>Reorder Level</th><th>Value (₹)</th><th>Status</th>
                {canWrite && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={8} cols={canWrite ? 9 : 8} />
              ) : products.length === 0 ? (
                <tr><td colSpan={99} className="border-0 py-0"><EmptyState icon={<Boxes size={24} />} title="No products found" description="Add products first to manage their stock" /></td></tr>
              ) : (
                products.map((p) => {
                  const qty = p.inventory?.availableQty ?? 0
                  const reserved = p.inventory?.reservedQty ?? 0
                  const reorder = p.inventory?.reorderLevel ?? 10
                  const value = qty * Number(p.price)
                  const { label, variant } = getStockStatus(qty, reorder)
                  return (
                    <tr key={p.id}>
                      <td><p className="font-semibold text-text-primary">{p.name}</p>{p.sku && <p className="text-xs font-mono text-text-muted">{p.sku}</p>}</td>
                      <td><span className="badge-neutral">{p.category ?? '—'}</span></td>
                      <td className="text-text-secondary">{p.unit}</td>
                      <td><span className="font-bold text-lg text-text-primary">{formatNumber(qty)}</span></td>
                      <td className="text-text-secondary">{formatNumber(reserved)}</td>
                      <td className="text-text-secondary">{formatNumber(reorder)}</td>
                      <td className="font-semibold">{formatCurrency(value)}</td>
                      <td><StatusBadge label={label} variant={variant} dot /></td>
                      {canWrite && (
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setAdjustingProduct(p); reset({ type: 'INWARD', quantity: 1 }) }} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-primary-50 text-primary-700 font-semibold rounded-md hover:bg-primary-100 transition-colors">
                              <SlidersHorizontal size={12} /> Adjust
                            </button>
                            <button onClick={() => { setHistoryProduct(p); setHistoryPage(1) }} className="flex items-center gap-1 h-7 px-2.5 text-xs bg-surface-subtle text-text-secondary font-medium rounded-md hover:bg-surface transition-colors">
                              <History size={12} /> History
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onPageChange={setPage} />}
      </div>

      <Modal
        open={!!adjustingProduct}
        onClose={() => { setAdjustingProduct(null); reset() }}
        title="Adjust Stock"
        subtitle={adjustingProduct?.name}
        size="sm"
        footer={
          <>
            <button onClick={() => { setAdjustingProduct(null); reset() }} className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-surface-subtle">Cancel</button>
            <button onClick={handleSubmit(onAdjust)} disabled={adjustMutation.isPending} className="h-9 px-5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-70 flex items-center gap-2">
              {adjustMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Apply Adjustment
            </button>
          </>
        }
      >
        {adjustingProduct && (
          <div className="space-y-4">
            <div className="bg-surface-muted rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Current Stock</p>
                <p className="text-2xl font-bold text-text-primary">
                  {adjustingProduct.inventory?.availableQty ?? 0}
                  <span className="text-sm font-normal text-text-muted ml-1.5">{adjustingProduct.unit}</span>
                </p>
              </div>
              <StatusBadge
                label={getStockStatus(adjustingProduct.inventory?.availableQty ?? 0, adjustingProduct.inventory?.reorderLevel ?? 10).label}
                variant={getStockStatus(adjustingProduct.inventory?.availableQty ?? 0, adjustingProduct.inventory?.reorderLevel ?? 10).variant}
                dot
              />
            </div>

            <div>
              <label className="erp-label">Movement Type</label>
              <div className="grid grid-cols-3 gap-2">
                {ADJUST_TYPES.map((t) => {
                  const isSelected = selectedType === t.value
                  return (
                    <label key={t.value} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? t.variant === 'success' ? 'border-success bg-success-light' : t.variant === 'danger' ? 'border-danger bg-danger-light' : 'border-warning bg-warning-light'
                        : 'border-border hover:border-primary-300'
                    }`}>
                      <input type="radio" {...register('type')} value={t.value} className="sr-only" />
                      <t.icon size={18} className={isSelected ? (t.variant === 'success' ? 'text-success' : t.variant === 'danger' ? 'text-danger' : 'text-warning') : 'text-text-muted'} />
                      <span className={`text-xs font-semibold ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>{t.label}</span>
                    </label>
                  )
                })}
              </div>
              <p className="text-2xs text-text-muted mt-1.5">
                {ADJUST_TYPES.find((t) => t.value === selectedType)?.hint}
              </p>
            </div>

            <div>
              <label className="erp-label">Quantity *</label>
              <input type="number" min="1" {...register('quantity', { valueAsNumber: true })} placeholder="Enter quantity" className={`erp-input text-lg font-semibold ${errors.quantity ? 'border-danger' : ''}`} />
              {errors.quantity && <p className="mt-1 text-xs text-danger">{errors.quantity.message}</p>}
            </div>

            <div>
              <label className="erp-label">Reason / Notes</label>
              {selectedType === 'ADJUSTMENT' ? (
                <select {...register('notes')} className="erp-input">
                  <option value="">Select reason…</option>
                  {ADJUSTMENT_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              ) : (
                <input {...register('notes')} placeholder={selectedType === 'INWARD' ? 'e.g. Purchase from supplier' : 'e.g. Sales order #1234'} className="erp-input" />
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!historyProduct} onClose={() => setHistoryProduct(null)} title="Stock History" subtitle={historyProduct?.name} size="lg">
        {historyLoading ? (
          <div className="py-8 text-center text-text-muted text-sm">Loading history…</div>
        ) : (
          <div>
            <table className="erp-table">
              <thead><tr><th>Date</th><th>Type</th><th>Stock Before → After</th><th>Qty Change</th><th>Reference</th><th>Notes</th></tr></thead>
              <tbody>
                {historyData?.data.length ? (
                  historyData.data.map((m) => (
                    <tr key={m.id}>
                      <td className="text-xs text-text-muted">{formatDate(m.createdAt, 'datetime')}</td>
                      <td><StatusBadge label={movTypeLabel(m.type)} variant={movVariant(m.type) as any} /></td>
                      <td className="text-xs text-text-secondary">{m.stockBefore} → {m.stockAfter}</td>
                      <td><span className={`font-bold ${m.type === 'OUTWARD' ? 'text-danger' : 'text-success'}`}>{m.type === 'OUTWARD' ? '-' : '+'}{m.quantity}</span></td>
                      <td className="text-xs text-text-muted">{m.referenceType}</td>
                      <td className="text-xs text-text-secondary">{m.notes ?? '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="text-center text-sm text-text-muted py-8">No history found</td></tr>
                )}
              </tbody>
            </table>
            {historyData?.meta && historyData.meta.totalPages > 1 && (
              <Pagination page={historyPage} totalPages={historyData.meta.totalPages} total={historyData.meta.total} limit={10} onPageChange={setHistoryPage} />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
