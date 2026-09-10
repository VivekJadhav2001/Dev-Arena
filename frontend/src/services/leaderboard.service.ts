import type { IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export const leaderboardService = {
  async getList(params: { page: number; period?: 'global' | 'week' | 'month' }): Promise<Array<{
    rank: number
    userName: string
    avatarUrl: string | null
    persona: string | null
    level: number
    xp: number
    wins: number
    totalBattles: number
    badges: number
    winRate: number
    streak: number
  }>> {
    const response = await apiRequest<IApiResponse<Array<{
      rank: number
      userName: string
      avatarUrl: string | null
      persona: string | null
      level: number
      xp: number
      wins: number
      totalBattles: number
      badges: number
      winRate: number
      streak: number
    }>>>('get', '/leaderboard', undefined, { params })
    return response.data
  },

  async getMyRank(): Promise<{ rank: number; xp: number; userName: string }> {
    const response = await apiRequest<IApiResponse<{ rank: number; xp: number; userName: string }>>(
      'get',
      '/leaderboard/me',
    )
    return response.data
  },
}
