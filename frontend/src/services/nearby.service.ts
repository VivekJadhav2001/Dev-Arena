import type { INearbyDeveloper, IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export interface NearbyRequest {
  lat?: number
  lng?: number
  radiusKm?: number
}

export const nearbyService = {
  async getNearby(params: NearbyRequest = {}): Promise<INearbyDeveloper[]> {
    const response = await apiRequest<IApiResponse<INearbyDeveloper[]>>('get', '/nearby', undefined, { params })
    return response.data
  },
}
