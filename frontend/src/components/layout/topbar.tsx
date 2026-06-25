'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Bell, ChevronDown, Settings, User, LogOut, Building2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { notificationsApi } from '@/lib/users-api'
import { cn, initials, timeAgo } from '@/lib/utils'

/**
 * Map current route to the search-capable page we should navigate to.
 * Keeps the user in context — searching while on /inventory/suppliers
 * searches suppliers, not products.
 */
function resolveSearchDestination(pathname: string, term: string): string {
  const encoded = encodeURIComponent(term)
  if (pathname.includes('/suppliers'))      return `/inventory/suppliers?search=${encoded}`
  if (pathname.includes('/inventory'))      return `/inventory/products?search=${encoded}`
  if (pathname.includes('/users'))          return `/users?search=${encoded}`
  // Default: products
  return `/inventory/products?search=${encoded}`
}

export function TopBar() {
  const router    = useRouter()
  const pathname  = usePathname()
  const queryClient = useQueryClient()
  const user   = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const logout = useAuthStore((s) => s.logout)

  const [menuOpen,  setMenuOpen]  = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [searching, setSearching] = useState(false)

  const menuRef    = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Clear search value when route changes (user navigated away)
  useEffect(() => { setSearchVal('') }, [pathname])

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn:  notificationsApi.unreadCount,
    refetchInterval: 30_000,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications-list'],
    queryFn:  () => notificationsApi.list({ page: 1, limit: 8 }),
    enabled:  notifOpen,
  })

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
    },
  })

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    router.replace('/login')
  }

  const navigate = useCallback((term: string) => {
    if (!term.trim()) return
    setSearching(false)
    router.push(resolveSearchDestination(pathname, term.trim()))
  }, [pathname, router])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchVal(val)
    setSearching(!!val)

    // Debounce auto-navigate: 600ms after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim()) {
      debounceRef.current = setTimeout(() => navigate(val), 600)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      navigate(searchVal)
    }
    if (e.key === 'Escape') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSearchVal('')
      setSearching(false)
      searchRef.current?.blur()
    }
  }

  const handleClearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchVal('')
    setSearching(false)
    searchRef.current?.focus()
  }

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-border flex items-center px-6 gap-4">

      {/* Global Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            value={searchVal}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products, suppliers…"
            className="w-full h-8 pl-8 pr-7 text-sm bg-surface-muted border border-border rounded-lg
                       placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500
                       focus:border-primary-500 transition-colors"
          />
          {searchVal && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1" />
      <span className="text-xs text-text-muted hidden lg:block">{now}</span>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-secondary hover:text-text-primary transition-colors"
        >
          <Bell size={16} />
          {!!unread?.count && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread.count > 9 ? '9+' : unread.count}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border border-border shadow-modal z-50 animate-slide-in-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-bold text-text-primary">Notifications</p>
              {!!unread?.count && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications?.data.length ? (
                notifications.data.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 border-b border-border last:border-0',
                      !n.readAt && 'bg-primary-50/40',
                    )}
                  >
                    <p className="text-xs font-semibold text-text-primary">{n.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{n.body}</p>
                    <p className="text-2xs text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted text-center py-8">No notifications yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
        >
          <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user ? initials(user.name) : '?'}</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-text-primary leading-none">{user?.name}</p>
            <p className="text-2xs text-text-muted mt-0.5">{tenant?.name}</p>
          </div>
          <ChevronDown size={13} className="text-text-muted" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-border shadow-modal z-50 py-1 animate-slide-in-up">
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <Link href="/profile"  onClick={() => setMenuOpen(false)} className={menuItem}><User size={14} /> Profile & Account</Link>
              <Link href="/company"  onClick={() => setMenuOpen(false)} className={menuItem}><Building2 size={14} /> Company Settings</Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)} className={menuItem}><Settings size={14} /> Preferences</Link>
            </div>
            <div className="py-1 border-t border-border">
              <button
                onClick={handleLogout}
                className={cn(menuItem, 'text-danger hover:text-danger hover:bg-danger-light w-full text-left')}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

const menuItem = 'flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors cursor-pointer'
