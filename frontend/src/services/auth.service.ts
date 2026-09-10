import type { IApiResponse, IUser } from '../types'
import { apiRequest } from '../lib/api'

export const authApi = {
  async getMe(): Promise<IUser> {
    const response = await apiRequest<IApiResponse<IUser>>('get', '/auth/me')
    return response.data
  },

  async logout(): Promise<void> {
    await apiRequest<void>('post', '/auth/logout')
  },
}
