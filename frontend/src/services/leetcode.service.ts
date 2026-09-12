import type { IApiResponse, ILeetCodeStats } from '../types'
import { apiRequest } from '../lib/api'

export interface LeetCodeConnectResponse {
  leetcodeUsername: string | null
  leetcodeStats: ILeetCodeStats
  lastSyncedAt: string | null
}

export const leetcodeService = {
  async connect(username: string): Promise<LeetCodeConnectResponse> {
    const response = await apiRequest<IApiResponse<LeetCodeConnectResponse>>(
      'put',
      '/users/me/leetcode',
      { username },
    )
    return response.data
  },

  async sync(): Promise<LeetCodeConnectResponse> {
    const response = await apiRequest<IApiResponse<LeetCodeConnectResponse>>(
      'post',
      '/users/me/leetcode/sync',
    )
    return response.data
  },

  async disconnect(): Promise<void> {
    await apiRequest('delete', '/users/me/leetcode')
  },
}
