'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { UserSettings } from '@/types'

const DEFAULTS: UserSettings = {
  theme: 'light',
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  notifyOrderUpdates: true,
  notifyLowStock: true,
  notifyPayments: true,
  notifyReturns: true,
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
