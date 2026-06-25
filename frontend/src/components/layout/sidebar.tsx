'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Boxes, ArrowUpDown, AlertTriangle,
  Users, ClipboardList, Settings, ChevronDown, ChevronRight,
  Building2, UserCircle, ShoppingCart, DollarSign, UserCog,
  BarChart3, Lock, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  children?: NavItem[]
  locked?: boolean
}

// Children map 1:1 to actual implemented routes — every href below has a real page
const NAV: NavItem[] = [
  {
    label: 'Inventory',
    icon: Package,
    children: [
      { label: 'Dashboard',      href: '/inventory',                icon: LayoutDashboard },
      { label: 'Products',       href: '/inventory/products',       icon: Package },
      { label: 'Stock',          href: '/inventory/stock',          icon: Boxes },
      { label: 'Movements',      href: '/inventory/movements',      icon: ArrowUpDown },
      { label: 'Reorder Alerts', href: '/inventory/reorder-alerts', icon: AlertTriangle },
      { label: 'Suppliers',      href: '/inventory/suppliers',      icon: Users },
      { label: 'Reports',        href: '/inventory/reports',        icon: BarChart3 },
      { label: 'Audit Logs',     href: '/inventory/audit-logs',     icon: ClipboardList },
    ],
  },
  // These ModuleKeys exist in the backend schema/enum but have no controllers/UI yet
  { label: 'Sales',     icon: ShoppingCart, locked: true },
  { label: 'Purchase',  icon: FileText,     locked: true },
  { label: 'Finance',   icon: DollarSign,   locked: true },
  { label: 'CRM',       icon: UserCog,      locked: true },
  { label: 'HRMS',      icon: UserCircle,   locked: true },
]

const BOTTOM_NAV: NavItem[] = [
  { label: 'Company',  href: '/company',  icon: Building2 },
  { label: 'Users',    href: '/users',    icon: Users },
  { label: 'Profile',  href: '/profile',  icon: UserCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(
    () => item.children?.some((c) => c.href && pathname.startsWith(c.href)) ?? false,
  )
  const isActiveParent = item.children?.some((c) => c.href && pathname.startsWith(c.href))

  if (item.locked) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-not-allowed text-text-muted opacity-60">
        <item.icon size={16} className="flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        <span className="text-2xs px-1.5 py-0.5 bg-surface-subtle rounded-full font-medium">Soon</span>
        <Lock size={11} className="flex-shrink-0" />
      </div>
    )
  }

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            isActiveParent ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
          )}
        >
          <item.icon size={16} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="mt-0.5 ml-6 border-l border-border pl-3 space-y-0.5">
            {item.children.map((child) => <NavLink key={child.label} item={child} />)}
          </div>
        )}
      </div>
    )
  }

  const isActive = item.href === '/inventory' ? pathname === item.href : item.href ? pathname.startsWith(item.href) : false

  return (
    <Link
      href={item.href!}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        isActive ? 'bg-primary-600 text-white font-semibold shadow-sm' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
      )}
    >
      <item.icon size={15} className="flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const tenant = useAuthStore((s) => s.tenant)

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-border flex flex-col h-full overflow-hidden">
      <div className="px-4 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-sm leading-none truncate">ThunderERP</p>
            <p className="text-xs text-text-muted truncate mt-0.5">{tenant?.name ?? 'Loading…'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="text-2xs font-bold text-text-muted uppercase tracking-widest px-3 py-1 mb-1">Modules</p>
        {NAV.map((item) => <NavLink key={item.label} item={item} />)}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-0.5 flex-shrink-0">
        {BOTTOM_NAV.map((item) => <NavLink key={item.label} item={item} />)}
      </div>
    </aside>
  )
}
