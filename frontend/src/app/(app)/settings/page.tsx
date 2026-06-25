'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Package, Bell, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi } from '@/lib/users-api'
import { useSettingsStore } from '@/store/settings-store'
import { PageHeader } from '@/components/shared/page-header'
import { UserSettings } from '@/types'

type Tab = 'general' | 'inventory' | 'notifications'

function ToggleRow({ label, description, checked, onChange, disabled }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 rounded-full transition-colors duration-200 flex-shrink-0 ml-6 disabled:opacity-50 ${checked ? 'bg-primary-600' : 'bg-border-strong'}`}
        style={{ minWidth: '2.5rem', height: '1.375rem' }}
      >
        <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

/**
 * Default values for the fields the backend UpdateUserSettingsDto accepts.
 * language, currency, notifyReturns are intentionally excluded — the backend
 * strips them via whitelist validation and they would never be saved.
 * If you add them to the backend DTO, add them here too.
 */
const defaultSettings: UserSettings = {
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
  sidebarCollapsed: false,
  notifyOrderUpdates: true,
  notifyLowStock: true,
  notifyPayments: true,
  invShowSku: true,
  invShowGst: true,
  invShowDiscount: true,
  invShowReorderLevel: true,
  invShowImage: true,
  invShowMfgDate: false,
  invShowExpiryDate: true,
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { settings: localSettings, setSettings: setLocalSettings } = useSettingsStore()
  const [draft, setDraft] = useState<UserSettings>(localSettings)

  // Debounce ref — prevents rapid toggle clicks firing multiple concurrent PATCHes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: serverSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: settingsApi.getUserSettings,
  })

  useEffect(() => {
    if (serverSettings) {
      setDraft(serverSettings)
      setLocalSettings(serverSettings)
    }
  }, [serverSettings, setLocalSettings])

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<UserSettings>) => settingsApi.updateUserSettings(updates),
    onSuccess: (updated) => {
      setDraft(updated)
      setLocalSettings(updated)
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  /**
   * Debounced save — waits 400ms after the last toggle before sending the PATCH.
   * Prevents rapid consecutive clicks from firing multiple in-flight requests.
   */
  const scheduleSave = (updates: Partial<UserSettings>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateMutation.mutate(updates)
    }, 400)
  }

  const handleToggle = (key: keyof UserSettings) => (val: boolean) => {
    const updates = { [key]: val }
    setDraft((prev) => ({ ...prev, ...updates }))
    scheduleSave(updates)
  }

  const handleSelectChange = (key: keyof UserSettings) => (val: string) => {
    const updates = { [key]: val }
    setDraft((prev) => ({ ...prev, ...updates }))
    scheduleSave(updates)
  }

  const handleReset = () => {
    setDraft(defaultSettings)
    // Only send fields the backend DTO accepts — no language/currency/notifyReturns
    updateMutation.mutate(defaultSettings)
    toast.success('Settings reset to defaults')
  }

  const isSaving = updateMutation.isPending

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general',       label: 'General',           icon: Settings },
    { id: 'inventory',     label: 'Inventory Display',  icon: Package  },
    { id: 'notifications', label: 'Notifications',      icon: Bell     },
  ]

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle={isSaving ? 'Saving…' : 'Preferences saved to your account'}
      />

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <nav className="erp-card p-2 space-y-0.5">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  activeTab === tab.id ? 'bg-primary-600 text-white font-semibold' : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}>
                <tab.icon size={15} />{tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="erp-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary mb-1">General Preferences</h2>
                <p className="text-sm text-text-secondary">Theme, date format, and locale settings</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="erp-label">Theme</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button key={t}
                        onClick={() => handleSelectChange('theme')(t)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium capitalize transition-colors ${
                          draft.theme === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-border hover:border-primary-300 text-text-secondary'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="erp-label">Date Format</label>
                  <select
                    value={draft.dateFormat}
                    onChange={(e) => handleSelectChange('dateFormat')(e.target.value)}
                    className="erp-input max-w-xs"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>

                {/*
                  Currency is a tenant-level setting managed via Company Settings,
                  not a per-user preference. The backend UpdateUserSettingsDto does
                  not include a currency field — changing it here had no effect.
                  Display the tenant currency as read-only for reference.
                */}
                <div>
                  <label className="erp-label">Currency</label>
                  <p className="text-sm text-text-secondary mt-1">
                    Currency is configured at the company level in{' '}
                    <a href="/company" className="text-primary-600 hover:underline font-medium">Company Settings</a>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="erp-card p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Inventory Display</h2>
                  <p className="text-sm text-text-secondary mt-0.5">Control which fields appear in the Products table and edit forms</p>
                </div>
                <button
                  onClick={handleReset}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={12} /> Reset defaults
                </button>
              </div>

              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Product Columns</p>
              <ToggleRow label="Product Image"     description="Show product image thumbnail in table and forms"        checked={!!draft.invShowImage}        onChange={handleToggle('invShowImage')}        disabled={isSaving} />
              <ToggleRow label="SKU / Product Code" description="Display SKU column and SKU field in product form"       checked={!!draft.invShowSku}          onChange={handleToggle('invShowSku')}          disabled={isSaving} />
              <ToggleRow label="GST Rate"           description="Show GST percentage column and input field"             checked={!!draft.invShowGst}          onChange={handleToggle('invShowGst')}          disabled={isSaving} />
              <ToggleRow label="Discount %"         description="Show discount percentage column and input field"        checked={!!draft.invShowDiscount}     onChange={handleToggle('invShowDiscount')}     disabled={isSaving} />
              <ToggleRow label="Reorder Level"      description="Show reorder level in stock table and product form"     checked={!!draft.invShowReorderLevel} onChange={handleToggle('invShowReorderLevel')} disabled={isSaving} />

              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-5 mb-2 pt-4 border-t border-border">Date Fields</p>
              <ToggleRow label="Manufacturing Date" description="Show manufacturing date field in product form"          checked={!!draft.invShowMfgDate}      onChange={handleToggle('invShowMfgDate')}      disabled={isSaving} />
              <ToggleRow label="Expiry Date"        description="Show expiry date field in product form"                 checked={!!draft.invShowExpiryDate}   onChange={handleToggle('invShowExpiryDate')}   disabled={isSaving} />

              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs text-text-muted">These settings are saved to your account and persist across devices and sessions.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="erp-card p-6">
              <h2 className="text-base font-bold text-text-primary mb-1">Notification Preferences</h2>
              <p className="text-sm text-text-secondary mb-5">Control what alerts you receive</p>
              <ToggleRow label="Low Stock Alerts"  description="Notify when a product drops below reorder level" checked={!!draft.notifyLowStock}     onChange={handleToggle('notifyLowStock')}     disabled={isSaving} />
              <ToggleRow label="Order Updates"     description="Notify on order status changes"                  checked={!!draft.notifyOrderUpdates} onChange={handleToggle('notifyOrderUpdates')} disabled={isSaving} />
              <ToggleRow label="Payment Updates"   description="Notify on payment events"                        checked={!!draft.notifyPayments}     onChange={handleToggle('notifyPayments')}     disabled={isSaving} />
              {/*
                notifyReturns removed — not in backend UpdateUserSettingsDto.
                To restore it, add notifyReturns: boolean to the backend DTO first.
              */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
