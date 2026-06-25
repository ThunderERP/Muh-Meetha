import { get, post, put, del, upload } from '@/lib/api-client'
import {
  Product, PaginatedResponse, StockMovement,
  InventoryDashboardStats, Supplier, AuditLog,
} from '@/types'

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: 'active' | 'inactive' | 'low_stock' | 'out_of_stock'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProductPayload {
  name: string
  sku?: string
  barcode?: string
  category?: string
  subcategory?: string
  brand?: string
  unit: string
  hsn?: string
  price: number
  purchasePrice?: number
  gstPercentage?: number
  discountPercentage?: number
  description?: string
  expiryDate?: string
  manufacturingDate?: string
  /**
   * Stores the S3 storageKey, NOT a URL.
   * Use useSignedUrl(product.imageUrl) in components to get a renderable URL.
   */
  imageUrl?: string
  reorderLevel?: number
}

export const productsApi = {
  list: (filters?: ProductFilters) =>
    get<PaginatedResponse<Product>>('/products', filters as Record<string, unknown>),

  get: (id: number) => get<Product>(`/products/${id}`),

  create: (data: ProductPayload) => post<Product>('/products', data),

  update: (id: number, data: Partial<ProductPayload>) => put<Product>(`/products/${id}`, data),

  delete: (id: number) => del<{ message: string }>(`/products/${id}`),

  categories: () => get<string[]>('/products/categories'),

  // CSV export — call downloadProductsCsv() in products/page.tsx, not this URL directly
  exportCsvUrl: () => `${process.env.NEXT_PUBLIC_API_URL}/products/export/csv`,
}

// ─── Uploads ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  /** Stable key to store in your entity (e.g. product.imageUrl). NOT a URL. */
  storageKey: string
  fileId: number
}

export const uploadsApi = {
  /**
   * Upload a product image.
   * Returns { storageKey, fileId } — persist storageKey, never a public URL.
   * To render the image, call uploadsApi.getSignedUrl(storageKey) or use
   * the useSignedUrl() hook which handles caching and auto-refresh.
   */
  uploadProductImage: (productId: number, file: File): Promise<UploadResult> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('entityType', 'PRODUCT')
    fd.append('entityId', String(productId))
    fd.append('fieldName', 'image')
    return upload<UploadResult>('/uploads', fd)
  },

  /**
   * Fetch a 15-minute pre-signed URL for a storageKey.
   * Prefer the useSignedUrl() React hook in components — it caches results
   * and prevents redundant requests.
   */
  getSignedUrl: (storageKey: string) =>
    get<{ url: string; expiresInSeconds: number }>('/uploads/signed-url', { key: storageKey }),
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type StockMovementType =
  | 'INWARD' | 'OUTWARD' | 'ADJUSTMENT' | 'RESERVATION' | 'RESERVATION_RELEASE'

export interface AdjustStockPayload {
  type: StockMovementType
  /** Positive for INWARD/OUTWARD/RESERVATION. Signed integer for ADJUSTMENT. */
  quantity: number
  notes?: string
  referenceType?: string
  referenceId?: number
}

export const inventoryApi = {
  dashboard: () => get<InventoryDashboardStats>('/inventory/dashboard'),

  adjust: (productId: number, data: AdjustStockPayload) =>
    post<{
      inventory: { availableQty: number; reservedQty: number; reorderLevel: number }
      movement: StockMovement
    }>(`/inventory/${productId}/adjust`, data),

  // params object so call sites don't have to remember positional args
  history: (productId: number, params: { page?: number; limit?: number } = {}) =>
    get<PaginatedResponse<StockMovement>>(`/inventory/${productId}/history`, {
      page:  params.page  ?? 1,
      limit: params.limit ?? 20,
    }),

  reorderAlerts: (page = 1, limit = 25) =>
    get<PaginatedResponse<Product>>('/reorder-alerts', { page, limit }),
}

// Named export used by reorder-alerts/page.tsx
export const reorderAlertsApi = {
  list: (params: { page?: number; limit?: number } = {}) =>
    inventoryApi.reorderAlerts(params.page ?? 1, params.limit ?? 25),
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface SupplierFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface SupplierPayload {
  name: string
  code?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstin?: string
  pan?: string
  bankName?: string
  bankAccount?: string
  bankIfsc?: string
  notes?: string
  isActive?: boolean
}

export const suppliersApi = {
  list: (filters?: SupplierFilters) =>
    get<PaginatedResponse<Supplier>>('/suppliers', filters as Record<string, unknown>),

  get: (id: number) => get<Supplier>(`/suppliers/${id}`),

  create: (data: SupplierPayload) => post<Supplier>('/suppliers', data),

  update: (id: number, data: Partial<SupplierPayload>) => put<Supplier>(`/suppliers/${id}`, data),

  delete: (id: number) => del<{ message: string }>(`/suppliers/${id}`),
}

// ─── Stock Movements ──────────────────────────────────────────────────────────

export interface StockMovementFilters {
  page?: number
  limit?: number
  productId?: number
  type?: StockMovementType
  from?: string
  to?: string
}

export const stockMovementsApi = {
  list: (filters?: StockMovementFilters) =>
    get<PaginatedResponse<StockMovement>>('/stock-movements', filters as Record<string, unknown>),
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLogFilters {
  page?: number
  limit?: number
  module?: string
  entity?: string
  action?: string
  from?: string
  to?: string
}

export const auditLogsApi = {
  list: (filters?: AuditLogFilters) =>
    get<PaginatedResponse<AuditLog>>('/audit-logs', filters as Record<string, unknown>),
}
