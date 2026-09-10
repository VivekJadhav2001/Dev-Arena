import type { IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export interface IBadgeDefinition {
  badgeId: string
  name: string
  description: string
  icon: string
  category: string
  tier: string
  xpReward: number
  isSecret: boolean
}

export interface IBadgeEntry {
  badgeId: string
  earnedAt: string
  tier: string
}

export const badgeService = {
  async getAll(): Promise<IApiResponse<IBadgeDefinition[]>> {
    const response = await apiRequest<IApiResponse<IBadgeDefinition[]>>('get', '/badges')
    return response
  },

  async getMine(): Promise<IApiResponse<{ earned: IBadgeEntry[]; available: IBadgeDefinition[] }>> {
    const response = await apiRequest<IApiResponse<{ earned: IBadgeEntry[]; available: IBadgeDefinition[] }>>('get', '/badges/me')
    return response
  },
}
