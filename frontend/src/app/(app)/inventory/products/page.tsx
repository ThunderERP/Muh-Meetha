'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, Edit2, Trash2, Package, Download, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { productsApi, uploadsApi, type UploadResult } from '@/lib/inventory-api'
import { useUrlSearch } from '@/hooks/use-url-search'
import { useSignedUrl } from '@/hooks/use-signed-url'
import { useSettingsStore } from '@/store/settings-store'
import { useAuthStore } from '@/store/auth-store'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Drawer } from '@/components/shared/drawer'
import { Modal } from '@/components/shared/modal'
import { Pagination } from '@/components/shared/pagination'
import { EmptyState } from '@/components/shared/empty-state'
import { ImageUpload } from '@/components/shared/image-upload'
import { TableSkeleton } from '@/components/shared/loading'
import { cn, formatCurrency, getStockStatus, permissions, truncate } from '@/lib/utils'
import { Product, GST_RATES } from '@/types'
import apiClient from '@/lib/api-client'

// Matches CreateProductDto exactly — gstPercentage must be one of backend's @IsIn values
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number({ invalid_type_error: 'Price must be a number' }).min(0),
  gstPercentage: z.number().refine((v) => (GST_RATES as readonly number[]).includes(v), 'Invalid GST rate'),
  discountPercentage: z.number().min(0).max(100),
  description: z.string().optional(),
  reorderLevel: z.number().min(0),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
})
type ProductForm = z.infer<typeof productSchema>

const UNITS = ['Piece', 'Kg', 'Gram', 'Litre', 'Ml', 'Box', 'Carton', 'Pack', 'Ream', 'Set', 'Pair', 'Dozen', 'Metre', 'Sqft']
const DEFAULT_CATEGORIES = ['Electronics', 'Furniture', 'Stationery', 'Food & Beverage', 'Apparel', 'Tools & Equipment', 'Packaging', 'Safety', 'Other']

/**
 * Download the product CSV using the authenticated axios client so the
 * Authorization header is included. A bare <a href> navigation strips headers
 * and will receive a 401 from the JWT-protected endpoint.
 */
async function downloadProductsCsv() {
  const response = await apiClient.get('/products/export/csv', {
    responseType: 'blob',
  })
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

// Resolves a product's storageKey to a signed URL for the table thumbnail.
// Defined outside the page component so it doesn't re-mount on every render.
function ProductThumbnail({ storageKey, name }: { storageKey: string; name: string }) {
  const { signedUrl, isLoading } = useSignedUrl(storageKey)
  if (isLoading) return <div className="w-9 h-9 bg-surface-subtle rounded-lg animate-pulse" />
  if (!signedUrl) return <div className="w-9 h-9 bg-surface-subtle rounded-lg flex items-center justify-center"><ImageIcon size={14} className="text-text-muted" /></div>
  return (
    <div className="w-9 h-9 relative rounded-lg overflow-hidden border border-border">
      <Image src={signedUrl} alt={name} fill className="object-cover" unoptimized />
    </div>
  )
}

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const display = useSettingsStore((s) => s.settings)
  const canWrite = user ? permissions.canWriteInventory(user.role) : false
  const canDelete = user ? permissions.canDeleteProduct(user.role) : false

  const [search, setSearch] = useUrlSearch()
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [extraCategories, setExtraCategories] = useState<string[]>([])
  const [csvLoading, setCsvLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: 'Piece', gstPercentage: 18, discountPercentage: 0, price: 0, reorderLevel: 10 },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: () => productsApi.list({ page, limit: 20, search: search || undefined, category: categoryFilter || undefined }),
    placeholderData: (prev) => prev,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: productsApi.categories,
    initialData: [],
  })

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...(categoriesData ?? []), ...extraCategories])]

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: async (created) => {
      // Backend requires the product to exist before an image can be uploaded
      // (UploadsController needs entityId). Upload the staged file now.
      if (stagedFile) {
        try {
          const res: UploadResult = await uploadsApi.uploadProductImage(created.id, stagedFile)
          // Persist the storageKey on the product record
          await productsApi.update(created.id, { imageUrl: res.storageKey })
        } catch {
          toast.error('Product created but image upload failed. You can retry from Edit.')
        }
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] })
      toast.success('Product created successfully')
      closeDrawer()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof productsApi.update>[1] }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully')
      closeDrawer()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] })
      toast.success('Product deleted')
      setDeleteModal(null)
    },
    // Backend blocks delete with stock > 0 — surface that message directly
    onError: (e) => toast.error((e as Error).message),
  })

  const openCreate = () => {
    setEditingProduct(null)
    setImageUrl(null)
    setStagedFile(null)
    reset({ unit: 'Piece', gstPercentage: 18, discountPercentage: 0, price: 0, reorderLevel: 10 })
    setDrawerOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setImageUrl(p.imageUrl ?? null)
    setStagedFile(null)
    reset({
      name: p.name,
      sku: p.sku ?? '',
      category: p.category ?? '',
      unit: p.unit,
      price: Number(p.price),
      gstPercentage: Number(p.gstPercentage),
      discountPercentage: Number(p.discountPercentage),
      description: p.description ?? '',
      reorderLevel: p.inventory?.reorderLevel ?? 10,
      manufacturingDate: p.manufacturingDate?.slice(0, 10) ?? '',
      expiryDate: p.expiryDate?.slice(0, 10) ?? '',
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingProduct(null)
    setImageUrl(null)
    setStagedFile(null)
  }

  const onSubmit = async (formData: ProductForm) => {
    const payload = {
      ...formData,
      imageUrl: imageUrl ?? undefined,
      manufacturingDate: formData.manufacturingDate || undefined,
      expiryDate: formData.expiryDate || undefined,
    }
    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
  }

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    if (!editingProduct) throw new Error('Product must be saved first')
    const res: UploadResult = await uploadsApi.uploadProductImage(editingProduct.id, file)
    // Return storageKey — ImageUpload persists this via onChange and resolves
    // it to a signed URL internally via useSignedUrl()
    return res.storageKey
  }, [editingProduct])

  const handleAddCategory = () => {
    const trimmed = newCategory.trim()
    if (trimmed && !allCategories.includes(trimmed)) {
      setExtraCategories((prev) => [...prev, trimmed])
      setValue('category', trimmed)
      setNewCategory('')
    }
  }

  const handleExportCsv = async () => {
    setCsvLoading(true)
    try {
      await downloadProductsCsv()
    } catch {
      toast.error('Failed to export CSV. Please try again.')
    } finally {
      setCsvLoading(false)
    }
  }

  const products = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${meta?.total ?? 0} products in your inventory`}
        actions={canWrite ? (
          <button onClick={openCreate} className="flex items-center gap-1.5 h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={15} /> Add Product
          </button>
        ) : null}
      />

      <div className="erp-card px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search products…" className="erp-input pl-8 h-8 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="erp-input h-8 text-sm w-40">
            <option value="">All Categories</option>
            {allCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* CSV export uses authenticated fetch — bare <a href> would 401 because
              browser navigation doesn't send the Authorization header */}
          <button
            onClick={handleExportCsv}
            disabled={csvLoading}
            className="flex items-center gap-1.5 h-8 px-3 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface-subtle transition-colors disabled:opacity-60"
          >
            <Download size={13} className={csvLoading ? 'animate-bounce' : ''} />
            {csvLoading ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                {display.invShowImage && <th style={{ width: 52 }}>Image</th>}
                {display.invShowSku && <th>SKU</th>}
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Selling Price</th>
                {display.invShowGst && <th>GST</th>}
                {display.invShowDiscount && <th>Discount</th>}
                <th>Stock</th>
                <th>Status</th>
                {canWrite && <th style={{ width: 80 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton rows={8} cols={9} />
              ) : products.length === 0 ? (
                <tr><td colSpan={99} className="py-0 border-0">
                  <EmptyState icon={<Package size={24} />} title="No products found" description={search ? `No results for "${search}"` : 'Add your first product to get started'}
                    action={canWrite ? <button onClick={openCreate} className="flex items-center gap-1.5 h-9 px-4 bg-primary-600 text-white text-sm font-semibold rounded-lg"><Plus size={14} /> Add Product</button> : undefined} />
                </td></tr>
              ) : (
                products.map((p) => {
                  const qty = p.inventory?.availableQty ?? 0
                  const reorder = p.inventory?.reorderLevel ?? 10
                  const { label, variant } = getStockStatus(qty, reorder)
                  return (
                    <tr key={p.id}>
                      {display.invShowImage && (
                        <td>
                          {p.imageUrl
                            ? <ProductThumbnail storageKey={p.imageUrl} name={p.name} />
                            : <div className="w-9 h-9 bg-surface-subtle rounded-lg flex items-center justify-center"><ImageIcon size={14} className="text-text-muted" /></div>
                          }
                        </td>
                      )}
                      {display.invShowSku && <td><span className="font-mono text-xs text-text-muted">{p.sku ?? '—'}</span></td>}
                      <td><p className="font-semibold text-text-primary">{truncate(p.name, 36)}</p></td>
                      <td><span className="badge-neutral">{p.category ?? '—'}</span></td>
                      <td className="text-text-secondary">{p.unit}</td>
                      <td className="font-semibold">{formatCurrency(p.price)}</td>
                      {display.invShowGst && <td className="text-text-secondary">{Number(p.gstPercentage)}%</td>}
                      {display.invShowDiscount && <td className="text-text-secondary">{Number(p.discountPercentage) > 0 ? `${Number(p.discountPercentage)}%` : '—'}</td>}
                      <td>
                        <span className="font-semibold text-text-primary">{qty}</span>
                        {display.invShowReorderLevel && <span className="text-xs text-text-muted ml-1">/ {reorder}</span>}
                      </td>
                      <td><StatusBadge label={label} variant={variant} dot /></td>
                      {canWrite && (
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Edit"><Edit2 size={13} /></button>
                            {canDelete && (
                              <button onClick={() => setDeleteModal(p)} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-danger hover:bg-danger-light transition-colors" title="Delete"><Trash2 size={13} /></button>
                            )}
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

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle={editingProduct ? editingProduct.name : 'Fill in the product details'}
        width="w-[600px]"
        footer={
          <>
            <button type="button" onClick={closeDrawer} className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-surface-subtle transition-colors">Cancel</button>
            <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="h-9 px-5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg disabled:opacity-70 transition-colors flex items-center gap-2">
              {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </>
        }
      >
        <form className="space-y-5">
          {display.invShowImage && (
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              productId={editingProduct?.id}
              onUpload={handleImageUpload}
              onStageFile={setStagedFile}
            />
          )}

          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Basic Information</p>
            <div className="space-y-3">
              <div>
                <label className="erp-label">Product Name *</label>
                <input {...register('name')} placeholder="Enter product name" className={cn('erp-input', errors.name && 'border-danger')} />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
              </div>

              {display.invShowSku && (
                <div>
                  <label className="erp-label">SKU / Product Code</label>
                  <input {...register('sku')} placeholder="e.g. PROD-001" className="erp-input font-mono" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Category</label>
                  <select {...register('category')} className="erp-input">
                    <option value="">Select category</option>
                    {allCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-1.5 mt-1.5">
                    <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} placeholder="Add new…" className="erp-input h-7 text-xs flex-1" />
                    <button type="button" onClick={handleAddCategory} className="h-7 px-2.5 text-xs bg-surface-subtle border border-border rounded-md hover:bg-surface text-text-secondary font-medium">+ Add</button>
                  </div>
                </div>
                <div>
                  <label className="erp-label">Unit *</label>
                  <select {...register('unit')} className={cn('erp-input', errors.unit && 'border-danger')}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="erp-label">Description</label>
                <textarea {...register('description')} rows={2} placeholder="Product description…" className="erp-input h-auto py-2 resize-none" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Pricing</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="erp-label">Selling Price (₹) *</label>
                <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} placeholder="0.00" className={cn('erp-input', errors.price && 'border-danger')} />
                {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
              </div>
              {display.invShowGst && (
                <div>
                  <label className="erp-label">GST Rate</label>
                  <select {...register('gstPercentage', { valueAsNumber: true })} className="erp-input">
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              )}
              {display.invShowDiscount && (
                <div>
                  <label className="erp-label">Discount %</label>
                  <input type="number" min="0" max="100" step="0.5" {...register('discountPercentage', { valueAsNumber: true })} className="erp-input" />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Stock Settings</p>
            {display.invShowReorderLevel && (
              <div>
                <label className="erp-label">Reorder Level</label>
                <input type="number" min="0" {...register('reorderLevel', { valueAsNumber: true })} className="erp-input" />
                <p className="text-xs text-text-muted mt-1">Alert when stock falls below this quantity</p>
                {editingProduct && <p className="text-2xs text-info mt-1">Use the Stock page to add/remove quantity</p>}
              </div>
            )}
          </div>

          {(display.invShowMfgDate || display.invShowExpiryDate) && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Manufacturing & Expiry</p>
              <div className="grid grid-cols-2 gap-3">
                {display.invShowMfgDate && <div><label className="erp-label">Manufacturing Date</label><input type="date" {...register('manufacturingDate')} className="erp-input" /></div>}
                {display.invShowExpiryDate && <div><label className="erp-label">Expiry Date</label><input type="date" {...register('expiryDate')} className="erp-input" /></div>}
              </div>
            </div>
          )}
        </form>
      </Drawer>

      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteModal(null)} className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-surface-subtle">Cancel</button>
            <button onClick={() => deleteModal && deleteMutation.mutate(deleteModal.id)} disabled={deleteMutation.isPending} className="h-9 px-4 text-sm bg-danger text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-70">
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Product'}
            </button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete <span className="font-semibold text-text-primary">{deleteModal?.name}</span>?
        </p>
        {(deleteModal?.inventory?.availableQty ?? 0) > 0 && (
          <p className="text-xs text-warning-text bg-warning-light rounded-lg px-3 py-2 mt-3">
            This product has {deleteModal?.inventory?.availableQty} units in stock. The server will reject deletion until stock is cleared.
          </p>
        )}
      </Modal>
    </div>
  )
}
