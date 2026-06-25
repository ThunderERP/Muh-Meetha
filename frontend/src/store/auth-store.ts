'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Tenant } from '@/types'

interface AuthStore {
  user: User | null
  tenant: Tenant | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, tenant: Tenant, token: string) => void
  setUser: (user: User) => void
  setTenant: (tenant: Tenant) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, tenant, token) => set({ user, tenant, token, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setTenant: (tenant) => set({ tenant }),
      logout: () => set({ user: null, tenant: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'thundererp_auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : ({} as Storage))),
    },
  ),
)
