import type { IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export const xpService = {
  async getMine(): Promise<{
    level: number
    xp: number
    totalXp: number
    xpToNextLevel: number
    xpForNextLevel: number
    sources: Array<{ source: string; amount: number }>
  }> {
    const response = await apiRequest<IApiResponse<{
      level: number
      xp: number
      totalXp: number
      xpToNextLevel: number
      xpForNextLevel: number
      sources: Array<{ source: string; amount: number }>
    }>>('get', '/xp/me')
    return response.data
  },

  async getLevels(): Promise<Array<{ level: number; xpRequired: number }>> {
    const response = await apiRequest<IApiResponse<Array<{ level: number; xpRequired: number }>>>(
      'get',
      '/xp/levels',
    )
    return response.data
  },
}
