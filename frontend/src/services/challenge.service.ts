import type { Difficulty, IApiResponse, IChallenge, IChallengeAccepted } from '../types'
import { apiRequest } from '../lib/api'

export interface CreateChallengePayload {
  challengedUserId: string
  difficulty: Difficulty
  language: string | null
  timeLimit: number
  message?: string
}

export type ChallengeDirection = 'incoming' | 'outgoing' | 'history'

export const challengeService = {
  async create(payload: CreateChallengePayload): Promise<IChallenge> {
    const response = await apiRequest<IApiResponse<IChallenge>>('post', '/challenges', payload)
    return response.data
  },

  async list(direction: ChallengeDirection = 'incoming'): Promise<IChallenge[]> {
    const response = await apiRequest<IApiResponse<{ challenges: IChallenge[] }>>(
      'get',
      '/challenges',
      undefined,
      { params: { direction } },
    )
    return response.data.challenges
  },

  async accept(challengeId: string): Promise<IChallengeAccepted> {
    const response = await apiRequest<IApiResponse<IChallengeAccepted>>(
      'post',
      `/challenges/${challengeId}/accept`,
    )
    return response.data
  },

  async decline(challengeId: string): Promise<void> {
    await apiRequest('post', `/challenges/${challengeId}/decline`)
  },

  async cancel(challengeId: string): Promise<void> {
    await apiRequest('post', `/challenges/${challengeId}/cancel`)
  },
}
