import axios, { type AxiosRequestConfig } from 'axios'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:2001/api/v1') as string

export const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      window.dispatchEvent(new Event('app:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export async function apiRequest<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await api.request<T>({
      method,
      url,
      data,
      ...config,
    })
    return response.data as T
  } catch (error: unknown) {
    // Surface the server's message (e.g. "Developer not found") instead of
    // axios's generic "Request failed with status code …".
    if (axios.isAxiosError(error)) {
      const serverMessage = (error.response?.data as { message?: unknown } | undefined)?.message
      const status = error.response?.status
      if (typeof serverMessage === 'string' && serverMessage.length > 0) {
        const enriched = new Error(serverMessage)
        ;(enriched as Error & { status?: number }).status = status
        throw enriched
      }
    }
    throw error
  }
}