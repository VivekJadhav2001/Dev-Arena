import type { IApiResponse, IWrappedData } from '../types'
import { apiRequest } from '../lib/api'

export const wrappedService = {
  async getMyWrapped(): Promise<IWrappedData> {
    const response = await apiRequest<IApiResponse<IWrappedData>>('get', '/wrapped/me')
    return response.data
  },

  async generateShareCard(): Promise<{ imageUrl: string }> {
    const response = await apiRequest<IApiResponse<{ imageUrl: string }>>('post', '/wrapped/generate')
    return response.data
  },
}
