import { post, get } from '@/lib/api-client'
import { User, Tenant } from '@/types'

// Matches LoginTenantDto exactly
export interface LoginPayload {
  tenantSlug: string
  email: string
  password: string
}

// Matches RegisterTenantDto exactly — note adminName/adminEmail, not name/email
export interface RegisterPayload {
  companyName: string
  slug: string
  phone?: string
  email?: string
  gstin?: string
  industry?: string
  website?: string
  adminName: string
  adminEmail: string
  password: string
  jobTitle?: string
  tosAccepted: boolean
  privacyAccepted: boolean
}

export interface AuthResponse {
  accessToken: string
  user: User
  tenant: Tenant
}

export interface RegisterResponse extends AuthResponse {
  message: string
}

export const authApi = {
  // POST /auth/login-tenant
  login: (payload: LoginPayload) => post<AuthResponse>('/auth/login-tenant', payload),

  // POST /auth/register-tenant
  register: (payload: RegisterPayload) => post<RegisterResponse>('/auth/register-tenant', payload),

  // GET /auth/me → { user, tenant }
  me: () => get<{ user: User; tenant: Tenant }>('/auth/me'),

  // POST /auth/change-password
  changePassword: (currentPassword: string, newPassword: string) =>
    post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
}
