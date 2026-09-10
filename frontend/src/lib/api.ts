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
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.request<T>({
    method,
    url,
    data,
    ...config,
  })
  return response.data as T
}