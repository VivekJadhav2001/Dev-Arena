import { create } from 'zustand'
import type { IUser } from '../types'
import { authApi } from '../services/auth.service'

interface AuthState {
  user: IUser | null
  loading: boolean
  error: string | null
  setUser: (user: IUser) => void
  clearUser: () => void
  checkSession: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, loading: false, error: null }),
  clearUser: () => set({ user: null, loading: false, error: null }),

  checkSession: async () => {
    try {
      const user = await authApi.getMe()
      set({ user, loading: false, error: null })
    } catch (error) {
      set({ user: null, loading: false, error: error instanceof Error ? error.message : 'Session check failed' })
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.warn('Logout request failed, clearing local session anyway.', error)
    } finally {
      set({ user: null, loading: false, error: null })
    }
  },
}))
