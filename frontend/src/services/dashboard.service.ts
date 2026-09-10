import type {
  IBadgeEntry,
  IBattleSummary,
  IApiResponse,
  IUser,
} from '../types'
import { apiRequest } from '../lib/api'

export const dashboardService = {
  async getDashboard(): Promise<{
    user: IUser
    recentBattles: IBattleSummary[]
    badges: IBadgeEntry[]
    topRepositories: Array<{ name: string; description: string; stars: number; commits: number }>
  }> {
    const response = await apiRequest<IApiResponse<{
      user: IUser
      recentBattles: IBattleSummary[]
      badges: IBadgeEntry[]
      topRepositories: Array<{ name: string; description: string; stars: number; commits: number }>
    }>>('get', '/dashboard')
    return response.data
  },
}
