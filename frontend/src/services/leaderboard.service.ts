import type { IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export interface ILeaderboardEntry {
  rank: number
  id: string
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
}

export interface ILeaderboardPage {
  entries: ILeaderboardEntry[]
  page: number
  totalPages: number
  total: number
}

export interface IMyRank {
  rank: number
  id: string
  xp: number
  totalXp: number
  level: number
  userName: string
  wins: number
  totalBattles: number
}

export const leaderboardService = {
  async getList(page = 1, limit = 20): Promise<ILeaderboardPage> {
    const response = await apiRequest<IApiResponse<ILeaderboardPage>>('get', '/leaderboard', undefined, {
      params: { page, limit },
    })
    return response.data
  },

  async getMyRank(): Promise<IMyRank> {
    const response = await apiRequest<IApiResponse<IMyRank>>('get', '/leaderboard/me')
    return response.data
  },
}
