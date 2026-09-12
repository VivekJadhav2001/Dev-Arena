/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { IBadgeEntry, IBattleStats, IGitHubStats, ILeetCodeStats, ISettings } from '../../types'

export interface IAuthUser {
  id: string
  userName: string
  email: string | null
  avatarUrl: string | null
  persona: string | null
  personaReason: string | null
  level: number
  xp: number
  totalXp: number
  rank: number
  githubStats: IGitHubStats | null
  battleStats: IBattleStats | null
  badges: IBadgeEntry[]
  settings: ISettings | null
  leetcodeUsername: string | null
  leetcodeStats: ILeetCodeStats | null
  lastActiveAt: string
  joinedAt: string
}

const AuthContext = createContext<IAuthUser | null>(null)

export const useAuthContext = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IAuthUser | null>(null)

  useEffect(() => {
    fetch('/api/v1/auth/me', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setUser(data.data))
      .catch(() => setUser(null))
  }, [])

  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  )
}