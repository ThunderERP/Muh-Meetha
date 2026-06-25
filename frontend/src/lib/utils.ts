import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Role } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'INR', locale = 'en-IN'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(isNaN(n) ? 0 : n)
}

export function formatNumber(value: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'long' | 'time' | 'datetime' = 'short',
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  const opts: Record<string, Intl.DateTimeFormatOptions> = {
    short:    { day: '2-digit', month: 'short', year: 'numeric' },
    long:     { day: '2-digit', month: 'long', year: 'numeric' },
    time:     { hour: '2-digit', minute: '2-digit', hour12: true },
    datetime: { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true },
  }
  return d.toLocaleDateString('en-IN', opts[format])
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(d, 'short')
}

export function getStockStatus(availableQty: number, reorderLevel: number): {
  label: string; variant: 'success' | 'warning' | 'danger'
} {
  if (availableQty <= 0) return { label: 'Out of Stock', variant: 'danger' }
  if (availableQty <= reorderLevel) return { label: 'Low Stock', variant: 'warning' }
  return { label: 'In Stock', variant: 'success' }
}

// Roles that can write inventory (mirrors backend @Roles() on Products/Inventory/Suppliers controllers)
const INVENTORY_WRITE_ROLES: Role[] = ['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER']
// Roles that can delete products / manage company (matches backend exactly)
const ADMIN_DELETE_ROLES: Role[] = ['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER']
const USER_MANAGE_ROLES: Role[] = ['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER']
const AUDIT_VIEW_ROLES: Role[] = ['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'FINANCE_MANAGER']

export const permissions = {
  canWriteInventory: (role: Role) => INVENTORY_WRITE_ROLES.includes(role),
  canDeleteProduct:  (role: Role) => ADMIN_DELETE_ROLES.includes(role),
  canManageUsers:    (role: Role) => USER_MANAGE_ROLES.includes(role),
  canViewAuditLogs:  (role: Role) => AUDIT_VIEW_ROLES.includes(role),
  canManageCompany:  (role: Role) => ADMIN_DELETE_ROLES.includes(role),
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isImageFile(file: File): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(str: string, maxLen = 40): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
}

export function roleLabel(role: Role): string {
  const map: Record<Role, string> = {
    DEVELOPER_ADMIN: 'Developer Admin', BUSINESS_OWNER: 'Business Owner',
    SALES_MANAGER: 'Sales Manager', SALES_STAFF: 'Sales Staff',
    INVENTORY_MANAGER: 'Inventory Manager', FINANCE_MANAGER: 'Finance Manager',
    ACCOUNTANT: 'Accountant', CRM_SUPPORT: 'CRM Support',
    REFUND_HANDLER: 'Refund Handler', MANAGER: 'Manager',
  }
  return map[role] ?? role
}

export function gstLabel(rate: number): string {
  return `${rate}% GST`
}
