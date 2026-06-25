import axios, { AxiosError, AxiosInstance } from 'axios'
import { ApiErrorBody } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// ─── Request: attach JWT ──────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('thundererp_auth')
    if (raw) {
      try {
        const { state } = JSON.parse(raw)
        if (state?.token) config.headers.Authorization = `Bearer ${state.token}`
      } catch {
        // corrupted storage
      }
    }
  }
  return config
})

// ─── Response: normalize backend error shape ──────────────────────────────────
// Backend HttpExceptionFilter returns: { success: false, statusCode, message, errors? }
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('thundererp_auth')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    const body = error.response?.data
    const message = body?.errors?.length
      ? body.errors.join(', ')
      : body?.message || error.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

export default apiClient

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<T>(url, { params })
  return res.data
}
export async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.post<T>(url, data)
  return res.data
}
export async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<T>(url, data)
  return res.data
}
export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.patch<T>(url, data)
  return res.data
}
export async function del<T>(url: string): Promise<T> {
  const res = await apiClient.delete<T>(url)
  return res.data
}
export async function upload<T>(url: string, formData: FormData): Promise<T> {
  const res = await apiClient.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
