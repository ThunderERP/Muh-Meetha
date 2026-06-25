'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, FileText, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { productsApi } from '@/lib/inventory-api'
import { PageHeader } from '@/components/shared/page-header'
import { StatCardSkeleton } from '@/components/shared/loading'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Product } from '@/types'
import apiClient from '@/lib/api-client'

/**
 * Download CSV via the authenticated axios client so the Authorization header
 * is included. window.open / bare <a href> strips headers and gets a 401.
 */
async function downloadProductsCsv() {
  const response = await apiClient.get('/products/export/csv', { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `thundererp-products-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const CHART_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#0EA5E9', '#7C3AED', '#DB2777', '#059669']

export default function InventoryReportsPage() {
  // Backend has no dedicated /reports endpoint yet — derive from full product list (max page size 200 per backend SearchPaginationDto)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-report'],
    queryFn: () => productsApi.list({ page: 1, limit: 200 }),
  })

  const products = productsData?.data ?? []

  const categoryMap = new Map<string, { count: number; value: number }>()
  let totalValue = 0, inStockCount = 0, lowStockCount = 0, outStockCount = 0

  products.forEach((p: Product) => {
    const cat = p.category ?? 'Uncategorised'
    const qty = p.inventory?.availableQty ?? 0
    const val = qty * Number(p.price)
    totalValue += val
    const existing = categoryMap.get(cat) ?? { count: 0, value: 0 }
    categoryMap.set(cat, { count: existing.count + 1, value: existing.value + val })
    const reorder = p.inventory?.reorderLevel ?? 10
    if (qty === 0) outStockCount++
    else if (qty <= reorder) lowStockCount++
    else inStockCount++
  })

  const categoryData = Array.from(categoryMap.entries()).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.value - a.value)
  const stockStatusData = [
    { name: 'In Stock', value: inStockCount, color: '#16A34A' },
    { name: 'Low Stock', value: lowStockCount, color: '#D97706' },
    { name: 'Out of Stock', value: outStockCount, color: '#DC2626' },
  ].filter((d) => d.value > 0)

  const handleExportCSV = async () => {
    try {
      await downloadProductsCsv()
    } catch {
      // toast not imported in this page — use console for now; add sonner if desired
      console.error('CSV export failed')
    }
  }

  const kpis = [
    { label: 'Total Products', value: formatNumber(products.length), sub: `${categoryMap.size} categories` },
    { label: 'Inventory Value', value: formatCurrency(totalValue), sub: 'At selling price' },
    { label: 'In Stock', value: formatNumber(inStockCount), sub: 'Healthy stock' },
    { label: 'Low Stock', value: formatNumber(lowStockCount), sub: 'Need attention' },
    { label: 'Out of Stock', value: formatNumber(outStockCount), sub: 'Immediate action' },
  ]

  return (
    <div>
      <PageHeader
        title="Inventory Reports"
        subtitle="Stock valuation and category breakdown"
        actions={<button onClick={handleExportCSV} className="flex items-center gap-1.5 h-9 px-4 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-subtle transition-colors"><Download size={14} /> Export CSV</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          : kpis.map((k) => (
              <div key={k.label} className="erp-card p-4">
                <p className="text-xl font-bold text-text-primary">{k.value}</p>
                <p className="text-xs font-semibold text-text-secondary mt-0.5">{k.label}</p>
                <p className="text-2xs text-text-muted mt-1">{k.sub}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="erp-card p-5 col-span-2">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-primary-600" /><h3 className="text-sm font-bold text-text-primary">Inventory Value by Category</h3></div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData.slice(0, 8)} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} formatter={(v: number) => [formatCurrency(v), 'Value']} />
                <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-sm text-text-muted">No data yet</div>}
        </div>

        <div className="erp-card p-5">
          <div className="flex items-center gap-2 mb-4"><PieChartIcon size={16} className="text-primary-600" /><h3 className="text-sm font-bold text-text-primary">Stock Status</h3></div>
          {stockStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stockStatusData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {stockStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} formatter={(v: number) => [v, 'Products']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-sm text-text-muted">No products yet</div>}
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2"><FileText size={15} className="text-text-muted" /><h3 className="text-sm font-bold text-text-primary">Category Summary</h3></div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead><tr><th>Category</th><th>Products</th><th>Total Value</th><th>% of Portfolio</th></tr></thead>
            <tbody>
              {categoryData.map((c, i) => (
                <tr key={c.name}>
                  <td><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="font-semibold text-text-primary">{c.name}</span></div></td>
                  <td className="text-text-secondary">{formatNumber(c.count)}</td>
                  <td className="font-semibold">{formatCurrency(c.value)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-subtle rounded-full max-w-[80px]"><div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${totalValue > 0 ? (c.value / totalValue) * 100 : 0}%` }} /></div>
                      <span className="text-text-secondary text-xs">{totalValue > 0 ? ((c.value / totalValue) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {categoryData.length === 0 && <tr><td colSpan={4} className="text-center text-sm text-text-muted py-8">No category data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
