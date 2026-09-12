import type { Difficulty, IApiResponse, IBadgeEntry, IBattleQuestion } from '../types'
import { apiRequest } from '../lib/api'

export type BattleMode = '1v1' | 'royale'

export interface CreateBattleRequest {
  difficulty: Difficulty
  language: string | null
  timeLimit: number
  mode: BattleMode
  maxPlayers?: number
}

export interface IBattlePlayerState {
  userId: string
  username: string
  avatarUrl: string | null
  score: number
  answersCount: number
  isHost: boolean
}

export interface IStandingEntry {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  score: number
  correct: number
  total: number
  accuracy: number
  isHost: boolean
  isWinner: boolean
}

export interface IBattleRoomState {
  battleId: string
  roomCode: string
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  mode: BattleMode
  maxPlayers: number
  difficulty: Difficulty
  language: string | null
  timeLimit: number
  currentQuestionIndex: number
  totalQuestions: number
  players: IBattlePlayerState[]
  questions: IBattleQuestion[]
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
  roomCode: string
  mode: BattleMode
  winner: string | null
  isDraw: boolean
  myScore?: number
  myRank?: number | null
  myAccuracy?: number
  myCorrect?: number
  totalQuestions: number
  xpEarned: number
  badgesEarned: IBadgeEntry[]
  myAnswers?: IBattleAnswerRecord[]
  standings: IStandingEntry[]
  endedAt: string
}

export interface IBattleHistoryItem {
  roomCode: string
  mode: BattleMode
  difficulty: Difficulty
  language: string | null
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  outcome: 'win' | 'loss' | 'draw' | null
  myScore: number
  myCorrect: number
  totalQuestions: number
  playersCount: number
  winnerUsername: string | null
  startedAt: string | null
  endedAt: string | null
}

export interface IBattleHistoryPage {
  battles: IBattleHistoryItem[]
  page: number
  totalPages: number
  total: number
}

export interface IBattleDetails {
  roomCode: string
  mode: BattleMode
  maxPlayers: number
  difficulty: Difficulty
  language: string | null
  timeLimit: number
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  totalQuestions: number
  winner: string | null
  isDraw: boolean
  myScore: number | null
  myRank: number | null
  myCorrect: number | null
  myAccuracy: number | null
  standings: IStandingEntry[]
  startedAt: string | null
  endedAt: string | null
}

export const arenaService = {
  async createBattle(payload: CreateBattleRequest): Promise<{ roomCode: string; battleId: string; mode: BattleMode; maxPlayers: number }> {
    const response = await apiRequest<IApiResponse<{ roomCode: string; battleId: string; mode: BattleMode; maxPlayers: number }>>(
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

  async getResult(roomCode: string): Promise<IApiResponse<IBattleResult>> {
    const response = await apiRequest<IApiResponse<IBattleResult>>('get', `/arena/${roomCode}/result`)
    return response
  },

  async getHistory(page = 1): Promise<IBattleHistoryPage> {
    const response = await apiRequest<IApiResponse<IBattleHistoryPage>>('get', '/arena/history', undefined, {
      params: { page },
    })
    return response.data
  },

  async getDetails(roomCode: string): Promise<IApiResponse<IBattleDetails>> {
    const response = await apiRequest<IApiResponse<IBattleDetails>>('get', `/arena/${roomCode}/details`)
    return response
  },

  async startBattle(roomCode: string): Promise<IApiResponse<IBattleRoomState>> {
    const response = await apiRequest<IApiResponse<IBattleRoomState>>('post', `/arena/${roomCode}/start`)
    return response
  },

  async answer(roomCode: string, payload: { questionId: string; answer: string; timeTaken: number }): Promise<{ isCorrect: boolean; xpEarned: number; currentScore: number; finished: boolean }> {
    const response = await apiRequest<IApiResponse<{ isCorrect: boolean; xpEarned: number; currentScore: number; finished: boolean }>>('post', `/arena/${roomCode}/answer`, payload)
    return response.data
  },

  async forfeit(roomCode: string): Promise<{ outcome: 'loss' | 'draw' }> {
    const response = await apiRequest<IApiResponse<{ outcome: 'loss' | 'draw' }>>('post', `/arena/${roomCode}/forfeit`)
    return response.data
  },
}
