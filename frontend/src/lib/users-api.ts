import { get, post, put, patch } from '@/lib/api-client'
import {
  User, Tenant, CompanyModule, UserSettings, FeatureFlag,
  Notification, PaginatedResponse,
} from '@/types'

// ─── Users — matches UsersController ───────────────────────────────────────────

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: string   // must be one of CREATABLE_ROLES
  phone?: string
  jobTitle?: string
}

export interface UpdateMePayload {
  name?: string
  email?: string
  phone?: string
  jobTitle?: string
  password?: string
  currentPassword?: string
}

export const usersApi = {
  // GET /users
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    get<PaginatedResponse<User>>('/users', params as Record<string, unknown>),

  // GET /users/me
  me: () => get<User>('/users/me'),

  // PUT /users/me
  updateMe: (data: UpdateMePayload) => put<User>('/users/me', data),

  // GET /users/:id
  get: (id: number) => get<User>(`/users/${id}`),

  // POST /users
  create: (data: CreateUserPayload) => post<User>('/users', data),

  // PUT /users/:id
  update: (id: number, data: Partial<CreateUserPayload>) => put<User>(`/users/${id}`, data),

  // PATCH /users/:id/deactivate
  deactivate: (id: number) => patch<User>(`/users/${id}/deactivate`, {}),

  // PATCH /users/:id/activate
  activate: (id: number) => patch<User>(`/users/${id}/activate`, {}),
}

// ─── Company — matches TenantsController (route prefix /company) ──────────────

export const companyApi = {
  // GET /company
  get: () => get<Tenant>('/company'),

  // PUT /company
  update: (data: Partial<Tenant>) => put<Tenant>('/company', data),

  // GET /company/modules
  modules: () => get<CompanyModule[]>('/company/modules'),

  // GET /company/subscription
  subscription: () => get<{ plan: string; maxUsers: number; storageMb: number; startsAt: string } | null>('/company/subscription'),
}

// ─── Settings — matches SettingsController ─────────────────────────────────────

export const settingsApi = {
  // GET /settings/user
  getUserSettings: () => get<UserSettings>('/settings/user'),

  // PUT /settings/user
  updateUserSettings: (data: Partial<UserSettings>) => put<UserSettings>('/settings/user', data),

  // GET /settings/features
  getFeatureFlags: () => get<FeatureFlag[]>('/settings/features'),

  // GET /settings/company?module=
  getCompanySettings: (module?: string) =>
    get<Array<{ module: string; key: string; value: unknown }>>('/settings/company', module ? { module } : undefined),

  // POST /settings/company
  upsertCompanySetting: (data: { module: string; key: string; value: unknown }) =>
    post('/settings/company', data),
}

// ─── Notifications — matches NotificationsController ───────────────────────────

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    get<PaginatedResponse<Notification>>('/notifications', params as Record<string, unknown>),

  unreadCount: () => get<{ count: number }>('/notifications/unread-count'),

  markAllRead: () => patch<{ message: string }>('/notifications/mark-all-read', {}),

  markRead: (id: number) => patch<Notification>(`/notifications/${id}/read`, {}),
}
