import type { Difficulty, IApiResponse, IBadgeEntry, IBattleQuestion } from '../types'
import { apiRequest } from '../lib/api'

export type BattleMode = '1v1' | 'royale'

export const CODING_LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'go', 'rust'] as const
export type CodingLanguage = (typeof CODING_LANGUAGES)[number]

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
  /** Ready for the host's lock (selection saved / code saved). Never reveals what. */
  hasAnswered: boolean
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
  mcqCorrect: number
  codingSolved: number
  codingTotal: number
  testsPassed: number
  testsTotal: number
  codingPoints: number
}

export interface IRunTestResult {
  input: string
  expected: string
  actual: string
  passed: boolean
  error: string | null
}

export interface IRunReport {
  testsPassed: number
  testsTotal: number
  allPassed: boolean
  results: IRunTestResult[]
  executionTimeMs: number
  memoryKb: number | null
  error: string | null
}

export interface ILastVerdict {
  questionId: string
  type: string
  correct: boolean
  pointsEarned: number
  correctAnswer: string | null
  testsPassed: number
  testsTotal: number
  error: string | null
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
  /** My pending (pre-lock) MCQ selection for the current question. */
  mySelection: string | null
  /** My pending (pre-lock) code for the current coding question. */
  myCode: { language: string; code: string } | null
  /** My latest visible-test run for the current coding question. */
  myLastRun: IRunReport | null
  /** Verdict of my most recently locked question, if any. */
  lastVerdict: ILastVerdict | null
  result: IBattleResult | null
  startedAt: string | null
}

export interface ITestResultView {
  input: string
  expected: string
  actual: string
  passed: boolean
  error: string | null
}

export interface IBattleAnswerRecord {
  questionId: string
  type: string
  answer: string
  isCorrect: boolean
  pointsEarned: number
  timeTaken: number
  submittedAt: string
  code: string | null
  language: string | null
  testsPassed: number
  testsTotal: number
  testResults: ITestResultView[]
  executionTimeMs: number | null
  memoryKb: number | null
  error: string | null
}

export interface IBattleMyStats {
  mcqCorrect: number
  mcqTotal: number
  codingSolved: number
  codingTotal: number
  testsPassed: number
  testsTotal: number
  codingPoints: number
  codingSuccessRate: number
}

export interface IBattleQuestionBreakdown {
  questionId: string
  type: string
  prompt: string
  language: string
  xpValue: number
  options: string[]
  correctAnswer: string
  explanation: string
  statement: string | null
  inputDescription: string | null
  outputDescription: string | null
  constraints: string[]
  examples: Array<{ input: string; output: string; explanation?: string | null }>
  hiddenTests: Array<{ input: string; output: string; explanation?: string | null }>
  myAnswer: IBattleAnswerRecord | null
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
  myStats?: IBattleMyStats
  questions?: IBattleQuestionBreakdown[]
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

export const CHEER_EMOJIS = ['🔥', '👏', '🎉', '💪', '⚡', '❤️', '🚀', '🏆'] as const
export type CheerEmoji = (typeof CHEER_EMOJIS)[number]

export interface ILiveBattlePlayer {
  userId: string
  username: string
  avatarUrl: string | null
  score: number
  answersCount: number
  isHost: boolean
}

export interface ILiveBattle {
  roomCode: string
  mode: BattleMode
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  difficulty: Difficulty
  language: string | null
  currentQuestionIndex: number
  totalQuestions: number
  playersCount: number
  maxPlayers: number
  players: ILiveBattlePlayer[]
  spectatorCount: number
  totalCheers: number
  startedAt: string | null
}

export interface ISpectatePlayer extends ILiveBattlePlayer {
  hasAnswered: boolean
  cheers: number
}

export interface ISpectateSnapshot {
  roomCode: string
  mode: BattleMode
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  difficulty: Difficulty
  language: string | null
  timeLimit: number
  currentQuestionIndex: number
  totalQuestions: number
  players: ISpectatePlayer[]
  currentQuestion: IBattleQuestion | null
  standings: IStandingEntry[]
  cheers: Array<{ targetUserId: string; count: number }>
  totalCheers: number
  spectatorCount: number
  startedAt: string | null
  isParticipant: boolean
  canJoin: boolean
}

export interface ICheerEvent {
  roomCode: string
  targetUserId: string
  emoji: string
  fromUserId: string
  fromUsername: string
  totalForTarget: number
  totalCheers: number
}

/** Global "battle went live" ping broadcast to all active sockets. */
export interface IBattleLivePayload {
  roomCode: string
  mode: string
  difficulty: string
  language: string | null
  playersCount: number
  maxPlayers: number
  hostUsername: string
  playerIds: string[]
  totalQuestions: number
  startedAt: string | null
}

/** Host-side 10s decision window for a 1v1 live join. */
export interface IJoinRequestPayload {
  requestId: string
  roomCode: string
  requesterId: string
  requesterUsername: string
  requesterAvatarUrl: string | null
  mode: string
  difficulty: string
  language: string | null
  playersCount: number
  maxPlayers: number
  expiresAt: string
}

export interface IJoinResolutionPayload {
  requestId: string
  roomCode: string
  battleId?: string
  reason?: string
}

/** Emitted to a developer removed from a waiting lobby by the host. */
export interface IPlayerRemovedPayload {
  roomCode: string
  removedUserId: string
  reason?: string
}

/** Emitted to lobby members + spectators when the host cancels a waiting battle. */
export interface IBattleCancelledPayload {
  roomCode: string
  reason?: string
}

/** The caller's newest still-open battle — survives tab/app navigation. */
export interface IMyActiveBattle {
  roomCode: string
  status: 'waiting' | 'active'
  mode: BattleMode
  difficulty: Difficulty
  language: string | null
  playersCount: number
  maxPlayers: number
  isHost: boolean
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

  /** Save/change my MCQ selection for the current question (host locks later). */
  async answer(roomCode: string, payload: { questionId: string; answer: string; timeTaken: number }): Promise<{ selected: boolean; questionId: string; locked: boolean }> {
    const response = await apiRequest<IApiResponse<{ selected: boolean; questionId: string; locked: boolean }>>('post', `/arena/${roomCode}/answer`, payload)
    return response.data
  },

  /** Host-only: finalize the current question for everyone and advance. */
  async lock(roomCode: string): Promise<IApiResponse<IBattleRoomState>> {
    const response = await apiRequest<IApiResponse<IBattleRoomState>>('post', `/arena/${roomCode}/lock`, undefined, {
      // Coding evaluation runs real test suites; allow time for it.
      timeout: 120000,
    })
    return response
  },

  /** Save my pending code for the current coding question (no execution). */
  async saveCode(roomCode: string, payload: { questionId: string; language: string; code: string }): Promise<{ saved: boolean; questionId: string }> {
    const response = await apiRequest<IApiResponse<{ saved: boolean; questionId: string }>>('post', `/arena/${roomCode}/code`, payload)
    return response.data
  },

  /** Save + really execute my code against the visible examples. */
  async runCode(roomCode: string, payload: { questionId: string; language: string; code: string }): Promise<IRunReport> {
    const response = await apiRequest<IApiResponse<IRunReport>>('post', `/arena/${roomCode}/run`, payload, {
      timeout: 90000,
    })
    return response.data
  },

  async forfeit(roomCode: string): Promise<{ outcome: 'win' | 'loss' | 'draw' }> {
    const response = await apiRequest<IApiResponse<{ outcome: 'win' | 'loss' | 'draw' }>>('post', `/arena/${roomCode}/forfeit`)
    return response.data
  },

  /** Live battles worth watching (active first, then waiting lobbies). */
  async getLiveBattles(): Promise<{ battles: ILiveBattle[]; total: number }> {
    const response = await apiRequest<IApiResponse<{ battles: ILiveBattle[]; total: number }>>('get', '/arena/live')
    return response.data
  },

  /** Safe livestream snapshot for spectators (no answer keys or code). */
  async getSpectate(roomCode: string): Promise<IApiResponse<ISpectateSnapshot>> {
    const response = await apiRequest<IApiResponse<ISpectateSnapshot>>('get', `/arena/${roomCode}/spectate`)
    return response
  },

  /** Cheer on one player in a live battle. Server validates + broadcasts. */
  async cheer(roomCode: string, payload: { targetUserId: string; emoji: string }): Promise<{ targetUserId: string; emoji: string; totalForTarget: number; totalCheers: number }> {
    const response = await apiRequest<IApiResponse<{ targetUserId: string; emoji: string; totalForTarget: number; totalCheers: number }>>('post', `/arena/${roomCode}/cheer`, payload)
    return response.data
  },

  /** Ask the host for the open 1v1 slot (10s decision window, host-approved). */
  async requestJoin(roomCode: string): Promise<{ requestId: string; roomCode: string; expiresAt: string }> {
    const response = await apiRequest<IApiResponse<{ requestId: string; roomCode: string; expiresAt: string }>>(
      'post',
      `/arena/${roomCode}/join-request`,
    )
    return response.data
  },

  /** Host-only: accept a pending join request and fill the slot immediately. */
  async acceptJoin(roomCode: string, requestId: string): Promise<{ roomCode: string; battleId: string }> {
    const response = await apiRequest<IApiResponse<{ roomCode: string; battleId: string }>>(
      'post',
      `/arena/${roomCode}/join-request/${requestId}/accept`,
    )
    return response.data
  },

  /** Host-only: decline a pending join request. */
  async declineJoin(roomCode: string, requestId: string): Promise<{ requestId: string; roomCode: string }> {
    const response = await apiRequest<IApiResponse<{ requestId: string; roomCode: string }>>(
      'post',
      `/arena/${roomCode}/join-request/${requestId}/decline`,
    )
    return response.data
  },

  /** Host-only: remove one player from a waiting lobby (before start). */
  async removePlayer(roomCode: string, userId: string): Promise<{ roomCode: string; removedUserId: string; playersCount: number }> {
    const response = await apiRequest<IApiResponse<{ roomCode: string; removedUserId: string; playersCount: number }>>(
      'post',
      `/arena/${roomCode}/remove`,
      { userId },
    )
    return response.data
  },

  /** Host-only: cancel a waiting battle before it starts. No XP, no stats. */
  async cancelBattle(roomCode: string): Promise<{ roomCode: string }> {
    const response = await apiRequest<IApiResponse<{ roomCode: string }>>(
      'post',
      `/arena/${roomCode}/cancel`,
    )
    return response.data
  },

  /** Newest still-open battle I'm in — keeps the lobby alive across navigation. */
  async getMyActive(): Promise<{ battle: IMyActiveBattle | null }> {
    const response = await apiRequest<IApiResponse<{ battle: IMyActiveBattle | null }>>(
      'get',
      '/arena/my-active',
    )
    return response.data
  },
}
