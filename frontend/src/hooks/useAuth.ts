import { useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'

export function useAuth() {
  const { user, loading, error, setUser, clearUser, checkSession, logout } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return { user, loading, error, setUser, clearUser, logout }
}