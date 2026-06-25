// ─── Enums (mirrors Prisma schema) ─────────────────────────────────────────────

export type Role =
  | 'DEVELOPER_ADMIN' | 'BUSINESS_OWNER' | 'SALES_MANAGER' | 'SALES_STAFF'
  | 'INVENTORY_MANAGER' | 'FINANCE_MANAGER' | 'ACCOUNTANT' | 'CRM_SUPPORT'
  | 'REFUND_HANDLER' | 'MANAGER'

// Role list accepted by POST /users (excludes DEVELOPER_ADMIN — backend @IsIn)
export const CREATABLE_ROLES: Role[] = [
  'BUSINESS_OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER',
  'SALES_STAFF', 'FINANCE_MANAGER', 'ACCOUNTANT', 'CRM_SUPPORT', 'REFUND_HANDLER',
]

export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE'

export type StockMovementType =
  | 'INWARD' | 'OUTWARD' | 'ADJUSTMENT' | 'RESERVATION' | 'RESERVATION_RELEASE'

// Exact GST slabs enforced by backend @IsIn on CreateProductDto
export const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28] as const
export type GstRate = typeof GST_RATES[number]

export type ModuleKey =
  | 'INVENTORY' | 'SALES' | 'PURCHASE' | 'ACCOUNTING' | 'CRM' | 'HRMS'
  | 'PAYROLL' | 'MANUFACTURING' | 'POS' | 'ASSET_MANAGEMENT'
  | 'SERVICE_MANAGEMENT' | 'PROJECT_MANAGEMENT' | 'ANALYTICS'
  | 'COMPLIANCE' | 'WORKFLOW_AUTOMATION'

export type ModuleStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL'

// ─── Core Entities ──────────────────────────────────────────────────────────────

export interface Tenant {
  id: number
  slug: string
  name: string
  legalName?: string | null
  plan: TenantPlan
  isActive: boolean
  maxUsers: number
  storageQuotaMb: number
  phone?: string | null
  email?: string | null
  website?: string | null
  gstin?: string | null
  pan?: string | null
  cin?: string | null
  industry?: string | null
  businessType?: string | null
  country: string
  state?: string | null
  city?: string | null
  pincode?: string | null
  address?: string | null
  timezone: string
  currency: string
  fiscalYearStart?: number
  isEmailVerified?: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  tenantId: number
  name: string
  email: string
  role: Role
  isActive: boolean
  phone?: string | null
  jobTitle?: string | null
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface CompanyModule {
  id: number
  tenantId: number
  moduleKey: ModuleKey
  status: ModuleStatus
  activatedAt?: string | null
  expiresAt?: string | null
}

export interface Inventory {
  id: number
  productId: number
  availableQty: number
  reservedQty: number
  reorderLevel: number
  updatedAt: string
}

export interface Product {
  id: number
  tenantId: number
  name: string
  sku?: string | null
  barcode?: string | null
  category?: string | null
  subcategory?: string | null
  brand?: string | null
  unit: string
  hsn?: string | null
  price: number | string
  purchasePrice?: number | string | null
  gstPercentage: number | string
  discountPercentage: number | string
  description?: string | null
  expiryDate?: string | null
  manufacturingDate?: string | null
  imageUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: number
  inventory?: Inventory | null
}

export interface StockMovement {
  id: number
  productId: number
  product?: { id: number; name: string; sku?: string | null }
  type: StockMovementType
  quantity: number
  stockBefore: number
  stockAfter: number
  referenceType: string
  referenceId?: number | null
  notes?: string | null
  createdAt: string
  createdBy: number
  createdByUser?: { id: number; name: string }
}

export interface Supplier {
  id: number
  tenantId: number
  name: string
  code?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  gstin?: string | null
  pan?: string | null
  bankName?: string | null
  bankAccount?: string | null
  bankIfsc?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: number
}

export interface AuditLog {
  id: number
  tenantId: number
  userId: number
  user?: { id: number; name: string; email: string }
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT' | 'ACTIVATE' | 'DEACTIVATE'
  module: string
  entityType: string
  entityId?: number | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  ipAddress?: string | null
  createdAt: string
}

export interface Notification {
  id: number
  tenantId: number
  userId: number
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ'
  title: string
  body: string
  data?: Record<string, unknown> | null
  readAt?: string | null
  createdAt: string
}

/**
 * Mirrors backend UpdateUserSettingsDto exactly.
 *
 * Fields deliberately NOT included here because the backend DTO does not accept them
 * (they would be stripped by NestJS whitelist validation and never persisted):
 *   - language     → not in UpdateUserSettingsDto
 *   - currency     → not in UpdateUserSettingsDto (tenant-level, not user-level)
 *   - notifyReturns → not in UpdateUserSettingsDto
 *
 * If you need these fields, add them to the backend DTO first.
 */
export interface UserSettings {
  theme?: string
  timezone?: string
  dateFormat?: string
  sidebarCollapsed?: boolean
  // Notification preferences
  notifyLowStock?: boolean
  notifyOrderUpdates?: boolean
  notifyPayments?: boolean
  // Inventory display toggles
  invShowSku?: boolean
  invShowGst?: boolean
  invShowDiscount?: boolean
  invShowReorderLevel?: boolean
  invShowImage?: boolean
  invShowMfgDate?: boolean
  invShowExpiryDate?: boolean
}

export interface FeatureFlag {
  id: number
  tenantId?: number | null
  key: string
  enabled: boolean
  description?: string | null
}

// ─── API Wrappers ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface ApiErrorBody {
  success: false
  statusCode: number
  message: string
  errors?: string[]
}

// ─── Inventory Dashboard ──────────────────────────────────────────────────────

export interface InventoryDashboardStats {
  totalProducts: number
  totalCategories: number
  lowStockCount: number
  outOfStockCount: number
  inventoryValue: number
  totalMovementsToday: number
  recentMovements: StockMovement[]
  topCategories: Array<{ category: string; count: number; value: number }>
  stockAlerts: Product[]
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface ProductFilters extends PaginationParams {
  search?: string
  category?: string
  status?: 'active' | 'inactive' | 'low_stock' | 'out_of_stock'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface StockMovementFilters extends PaginationParams {
  productId?: number
  type?: StockMovementType
  from?: string
  to?: string
}

export interface SupplierFilters extends PaginationParams {
  search?: string
  isActive?: boolean
}

export interface AuditLogFilters extends PaginationParams {
  module?: string
  entity?: string
  action?: string
  from?: string
  to?: string
}
