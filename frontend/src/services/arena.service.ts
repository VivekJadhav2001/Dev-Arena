import type { Difficulty, IApiResponse } from '../types'
import { apiRequest } from '../lib/api'

export interface CreateBattleRequest {
  difficulty: Difficulty
  language: string | null
  timeLimit: number
}

export interface IBattleRoomState {
  battleId: string
  roomCode: string
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  mode: '1v1' | 'tournament'
  difficulty: Difficulty
  language: string | null
  timeLimit: number
  currentQuestionIndex: number
  totalQuestions: number
  players: Array<{
    userId: string
    username: string
    avatarUrl: string | null
    score: number
    isHost: boolean
  }>
  questions: any[]
  myAnswer: string | null
  result: IBattleResult | null
  startedAt: string | null
}

export interface IBattleAnswerRecord {
  questionId: string
  answer: string
  isCorrect: boolean
  timeTaken: number
  submittedAt: string
}

export interface IBattleResult {
  winner: string | null
  isDraw: boolean
  myScore: number
  opponentScore: number
  myAccuracy: number
  opponentAccuracy: number
  xpEarned: number
  badgesEarned: any[]
  myAnswers: IBattleAnswerRecord[]
  opponentAnswers: IBattleAnswerRecord[]
  endedAt: string
}

export interface IBattleHistoryPage {
  battles: any[]
  page: number
  totalPages: number
  total: number
}

export const arenaService = {
  async createBattle(payload: CreateBattleRequest): Promise<{ roomCode: string; battleId: string }> {
    const response = await apiRequest<IApiResponse<{ roomCode: string; battleId: string }>>(
      'post',
      '/arena/create',
      payload,
    )
    return response.data
  },

  async joinBattle(payload: { roomCode: string }): Promise<{ roomCode: string; battleId: string }> {
    const response = await apiRequest<IApiResponse<{ roomCode: string; battleId: string }>>(
      'post',
      '/arena/join',
      payload,
    )
    return response.data
  },

  async getRoom(roomCode: string): Promise<IApiResponse<IBattleRoomState>> {
    const response = await apiRequest<IApiResponse<IBattleRoomState>>('get', `/arena/${roomCode}`)
    return response
  },

  async startBattle(roomCode: string): Promise<IApiResponse<IBattleRoomState>> {
    const response = await apiRequest<IApiResponse<IBattleRoomState>>('post', `/arena/${roomCode}/start`)
    return response
  },

  async answer(battleId: string, payload: { questionId: string; answer: string; timeTaken: number }): Promise<{ isCorrect: boolean; xpEarned: number; currentScore: number }> {
    const response = await apiRequest<IApiResponse<{ isCorrect: boolean; xpEarned: number; currentScore: number }>>('post', `/arena/${battleId}/answer`, payload)
    return response.data
  },

  async forfeit(battleId: string): Promise<{ outcome: 'loss' | 'draw' }> {
    const response = await apiRequest<IApiResponse<{ outcome: 'loss' | 'draw' }>>('post', `/arena/${battleId}/forfeit`)
    return response.data
  },

  async getHistory(params: { page: number }): Promise<IApiResponse<IBattleHistoryPage>> {
    const response = await apiRequest<IApiResponse<IBattleHistoryPage>>('get', '/battles/history', undefined, {
      params,
    })
    return response
  },

  async getBattle(battleId: string): Promise<{ result: IBattleResult }> {
    const response = await apiRequest<IApiResponse<{ result: IBattleResult }>>('get', `/battles/${battleId}`)
    return response.data
  },
}
