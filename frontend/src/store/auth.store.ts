import { create } from 'zustand'
import type { IUser } from '../types'
import { authApi } from '../services/auth.service'
import { useAppStore } from './app.store'

/** Session revalidation is skipped when the last check is this fresh. */
const SESSION_FRESH_MS = 60 * 1000

interface AuthState {
  user: IUser | null
  loading: boolean
  error: string | null
  lastChecked: number
  setUser: (user: IUser) => void
  clearUser: () => void
  checkSession: (force?: boolean) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  lastChecked: 0,

  setUser: (user) => set({ user, loading: false, error: null }),
  clearUser: () => {
    set({ user: null, loading: false, error: null, lastChecked: 0 })
    useAppStore.getState().reset()
  },

  checkSession: async (force = false) => {
    const { user, lastChecked } = get()
    if (!force && user && Date.now() - lastChecked < SESSION_FRESH_MS) return
    try {
      const freshUser = await authApi.getMe()
      set({ user: freshUser, loading: false, error: null, lastChecked: Date.now() })
    } catch (error) {
      set({ user: null, loading: false, error: error instanceof Error ? error.message : 'Session check failed', lastChecked: Date.now() })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.warn('Logout request failed, clearing local session anyway.', error)
    } finally {
      set({ user: null, loading: false, error: null, lastChecked: 0 })
      useAppStore.getState().reset()
    }
  },
}))
