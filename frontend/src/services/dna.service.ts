import type { IDNA, IDnaHistoryEntry, IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export const dnaService = {
  async getMyDNA(): Promise<IDNA> {
    const response = await apiRequest<IApiResponse<IDNA>>('get', '/dna/me')
    return response.data
  },

  async regenerateDNA(): Promise<IDNA> {
    const response = await apiRequest<IApiResponse<IDNA>>('post', '/dna/regenerate')
    return response.data
  },

  async getHistory(): Promise<IDnaHistoryEntry[]> {
    const response = await apiRequest<IApiResponse<{ history: IDnaHistoryEntry[] }>>('get', '/dna/history')
    return response.data.history ?? []
  },
}
