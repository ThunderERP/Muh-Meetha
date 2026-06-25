'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { UserSettings } from '@/types'

// Mirrors backend UpdateUserSettingsDto exactly.
// language, currency, notifyReturns are intentionally absent — the backend
// strips them via whitelist validation and they are never persisted.
const DEFAULTS: UserSettings = {
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
  notifyOrderUpdates: true,
  notifyLowStock: true,
  notifyPayments: true,
  sidebarCollapsed: false,
  invShowSku: true,
  invShowGst: true,
  invShowDiscount: true,
  invShowReorderLevel: true,
  invShowImage: true,
  invShowMfgDate: false,
  invShowExpiryDate: true,
}

interface SettingsStore {
  settings: UserSettings
  hydrated: boolean
  setSettings: (s: UserSettings) => void
  updateLocal: (updates: Partial<UserSettings>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULTS,
      hydrated: false,
      setSettings: (s) => set({ settings: s, hydrated: true }),
      updateLocal: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),
    }),
    {
      name: 'thundererp_settings',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({} as Storage))),
    },
  ),
)
