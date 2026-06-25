'use client'

import { useQuery } from '@tanstack/react-query'
import { Package, AlertTriangle, TrendingDown, DollarSign, ArrowUpDown, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { inventoryApi } from '@/lib/inventory-api'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { StatCardSkeleton } from '@/components/shared/loading'
import { formatCurrency, formatNumber, timeAgo, getStockStatus } from '@/lib/utils'
import { InventoryDashboardStats } from '@/types'

export default function InventoryDashboardPage() {
  const { data: stats, isLoading, refetch } = useQuery<InventoryDashboardStats>({
    queryKey: ['inventory-dashboard'],
    queryFn: inventoryApi.dashboard,
  })

  const kpis = [
    { label: 'Total Products', value: formatNumber(stats?.totalProducts ?? 0), icon: Package, bg: 'bg-primary-50', color: 'text-primary-600', sub: `${stats?.totalCategories ?? 0} categories` },
    { label: 'Low Stock', value: formatNumber(stats?.lowStockCount ?? 0), icon: AlertTriangle, bg: 'bg-warning-light', color: 'text-warning', sub: 'Near reorder level' },
    { label: 'Out of Stock', value: formatNumber(stats?.outOfStockCount ?? 0), icon: TrendingDown, bg: 'bg-danger-light', color: 'text-danger', sub: 'Need restock' },
    { label: 'Inventory Value', value: formatCurrency(stats?.inventoryValue ?? 0), icon: DollarSign, bg: 'bg-success-light', color: 'text-success', sub: 'At selling price' },
    { label: "Today's Movements", value: formatNumber(stats?.totalMovementsToday ?? 0), icon: ArrowUpDown, bg: 'bg-info-light', color: 'text-info', sub: 'Stock ins + outs' },
  ]

  const movementTypeLabel = (type: string) => ({
    INWARD: 'Stock In', OUTWARD: 'Stock Out', ADJUSTMENT: 'Adjustment',
    RESERVATION: 'Reserved', RESERVATION_RELEASE: 'Released',
  }[type] ?? type)

  const movementVariant = (type: string): 'success' | 'danger' | 'warning' | 'neutral' =>
    type === 'INWARD' ? 'success' : type === 'OUTWARD' ? 'danger' : type === 'ADJUSTMENT' ? 'warning' : 'neutral'

  return (
    <div>
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Real-time overview of your inventory health"
        actions={
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-subtle transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          : kpis.map((k) => (
              <div key={k.label} className="erp-card p-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${k.bg}`}>
                  <k.icon size={18} className={k.color} />
                </div>
                <p className="text-xl font-bold text-text-primary">{k.value}</p>
                <p className="text-xs font-semibold text-text-secondary mt-0.5">{k.label}</p>
                <p className="text-2xs text-text-muted mt-1">{k.sub}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="erp-card p-5 col-span-2">
          <h3 className="text-sm font-bold text-text-primary mb-4">Products by Category</h3>
          {stats?.topCategories && stats.topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topCategories} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} formatter={(v: number) => [formatNumber(v), 'Products']} />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">No category data yet</div>
          )}
        </div>

        <div className="erp-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-primary">Stock Alerts</h3>
            <span className="badge-warning">{stats?.stockAlerts?.length ?? 0} items</span>
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-[220px]">
            {stats?.stockAlerts?.length ? (
              stats.stockAlerts.slice(0, 8).map((p) => {
                const { label, variant } = getStockStatus(p.inventory?.availableQty ?? 0, p.inventory?.reorderLevel ?? 10)
                return (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{p.name}</p>
                      <p className="text-2xs text-text-muted">{p.inventory?.availableQty ?? 0} {p.unit}</p>
                    </div>
                    <StatusBadge label={label} variant={variant} />
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-text-muted text-center py-6">All stock levels healthy ✓</p>
            )}
          </div>
        </div>
      </div>

      <div className="erp-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-text-primary">Recent Stock Movements</h3>
        </div>
        <div className="divide-y divide-border">
          {stats?.recentMovements?.length ? (
            stats.recentMovements.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center px-5 py-3 gap-4">
                <StatusBadge label={movementTypeLabel(m.type)} variant={movementVariant(m.type)} />
                <p className="text-sm text-text-primary flex-1 truncate">{m.product?.name ?? `Product #${m.productId}`}</p>
                <p className="text-sm font-semibold text-text-primary">{m.type === 'OUTWARD' ? '-' : '+'}{m.quantity}</p>
                <p className="text-xs text-text-muted w-24 text-right">{timeAgo(m.createdAt)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted text-center py-8">No movements recorded yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
