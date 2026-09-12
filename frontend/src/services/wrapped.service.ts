import type { IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export interface IWrappedBadge {
  badgeId: string
  tier: string
  earnedAt: string
}

export interface IWrappedRecap {
  userName: string
  avatarUrl: string | null
  persona: string | null
  season: string
  totalBattles: number
  wins: number
  losses: number
  draws: number
  winRate: number
  topLanguage: string | null
  longestWinStreak: number
  currentWinStreak: number
  busiestDay: string | null
  busiestDayCount: number
  topPercent: number | null
  rank: number | null
  totalRanked: number
  badges: IWrappedBadge[]
  totalCommits: number
  totalSolved: number
}

export const wrappedService = {
  async getMyRecap(): Promise<IWrappedRecap> {
    const response = await apiRequest<IApiResponse<IWrappedRecap>>('get', '/wrapped/me')
    return response.data
  },

  async getPublicRecap(username: string): Promise<IWrappedRecap> {
    const response = await apiRequest<IApiResponse<IWrappedRecap>>(
      'get',
      `/wrapped/${encodeURIComponent(username)}`,
    )
    return response.data
  },
}
