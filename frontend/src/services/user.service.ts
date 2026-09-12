import type { IApiResponse, IGitHubStats, ISettings, IUser } from '../types'
import { apiRequest } from '../lib/api'

export interface UpdateSettingsRequest {
  publicProfile?: boolean
  showEmail?: boolean
  notifications?: boolean
  theme?: 'dark' | 'light' | 'system'
  allowChallenges?: boolean
}

export const userService = {
  async getProfile(username: string): Promise<IUser> {
    const response = await apiRequest<IApiResponse<IUser>>('get', `/users/${encodeURIComponent(username)}`)
    return response.data
  },

  async getMyProfile(): Promise<IUser> {
    const response = await apiRequest<IApiResponse<IUser>>('get', '/users/me')
    return response.data
  },

  async updateSettings(payload: UpdateSettingsRequest): Promise<ISettings> {
    const response = await apiRequest<IApiResponse<ISettings>>('patch', '/users/me', payload)
    return response.data
  },

  async syncGithub(): Promise<{ githubStats: IGitHubStats; lastSyncedAt: string | null }> {
    const response = await apiRequest<IApiResponse<{ githubStats: IGitHubStats; lastSyncedAt: string | null }>>('post', '/users/me/sync-github')
    return response.data
  },

  async getMyGithubStats(): Promise<{ githubStats: IGitHubStats; lastSyncedAt: string | null }> {
    const response = await apiRequest<IApiResponse<{ githubStats: IGitHubStats; lastSyncedAt: string | null }>>('get', '/users/me/github-stats')
    return response.data
  },
}
