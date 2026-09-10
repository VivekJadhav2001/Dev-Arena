export type Persona =
  | 'The Architect'
  | 'The Night Owl'
  | 'The Polyglot'
  | 'The Builder'
  | 'The Open Source Warrior'
  | 'The Debugger'
  | 'The Consistent Coder'
  | 'The Weekend Warrior'
  | 'The Specialist'
  | 'The Explorer';

export type Provider = 'local' | 'google' | 'github';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type BadgeCategory = 'battle' | 'streak' | 'social' | 'code' | 'special';
export type BattleStatus = 'waiting' | 'active' | 'finished' | 'cancelled';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'code_output' | 'fill_blank' | 'debug';

export interface IGitHubStats {
  totalRepos: number;
  publicRepos: number;
  followers: number;
  following: number;
  stars: number;
  forks: number;
  totalCommits: number;
  languages: Record<string, number>;
  topLanguage: string | null;
  contributionStreak: number;
  longestStreak: number;
  mostActiveRepos: Array<{ repo: string; commits: number }>;
  codingConsistency: number | null;
  openSourceScore: number | null;
  lastSyncedAt: string | null;
}

export interface IBattleStats {
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestWinStreak: number;
  avgScore: number;
  favoriteLanguage: string | null;
}

export interface IBadgeEntry {
  badgeId: string;
  earnedAt: string;
  tier: BadgeTier;
}

export interface ISettings {
  publicProfile: boolean;
  showEmail: boolean;
  notifications: boolean;
  theme: 'dark' | 'light' | 'system';
}

export interface INearbyLocation {
  optedIn: boolean;
  approximateCity: string | null;
  approximateRegion: string | null;
  countryCode: string | null;
  geohash: string | null;
  updatedAt: string | null;
}

export interface IUser {
  id: string;
  email: string | null;
  userName: string;
  username: string;
  avatarUrl: string | null;
  provider: Provider;
  providerAccountId: string;
  githubId: string | null;
  googleId: string | null;
  persona: Persona | null;
  personaReason: string | null;
  level: number;
  xp: number;
  totalXp: number;
  rank: number;
  githubStats: IGitHubStats;
  battleStats: IBattleStats;
  badges: IBadgeEntry[];
  settings: ISettings;
  nearbyLocation: INearbyLocation;
  lastActiveAt: string;
  joinedAt: string;
}

export interface IDNA {
  persona: Persona;
  personaReason: string;
  scores: Record<string, number>;
  traits: Array<{ label: string; score: number }>;
  languageProfile: Record<string, number>;
  activityHeatmap: Array<{ day: string; count: number }>;
  updatedAt: string;
}

export interface IXPBreakdown {
  level: number;
  xp: number;
  totalXp: number;
  xpToNextLevel: number;
  xpForNextLevel: number;
  progress: number;
  sources: Array<{ source: string; amount: number }>;
}

export interface IBadgeDefinition {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  xpReward: number;
  isSecret: boolean;
}

export interface CreateBattleRequest {
  difficulty: Difficulty
  language: string | null
  timeLimit: number
}

export interface IBattleSummary {
  battleId: string;
  roomCode: string;
  opponentUsername: string;
  opponentAvatarUrl: string | null;
  outcome: 'win' | 'loss' | 'draw' | null;
  score: number;
  opponentScore: number;
  accuracy: number;
  xpEarned: number;
  durationMinutes: number;
  difficulty: Difficulty;
  startedAt: string;
}

export interface IBattleHistoryPage {
  battles: IBattleSummary[];
  page: number;
  totalPages: number;
  total: number;
}

export interface IBattleQuestion {
  questionId: string;
  prompt: string;
  type: QuestionType;
  language: string;
  difficulty: Difficulty;
  options: string[];
  correctAnswer: string;
  explanation: string;
  code: string | null;
  tags: string[];
  xpValue: number;
}

export interface IPlayerState {
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  questionIndex: number;
  isHost: boolean;
}

export interface IBattleRoomState {
  battleId: string;
  roomCode: string;
  status: BattleStatus;
  mode: '1v1' | 'tournament';
  difficulty: Difficulty;
  language: string | null;
  timeLimit: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  players: IPlayerState[];
  questions: IBattleQuestion[];
  myAnswer: string | null;
  result: IBattleResult | null;
  startedAt: string | null;
}

export interface IBattleAnswerRecord {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken: number;
  submittedAt: string;
}

export interface IBattleResult {
  winner: string | null;
  isDraw: boolean;
  myScore: number;
  opponentScore: number;
  myAccuracy: number;
  opponentAccuracy: number;
  xpEarned: number;
  badgesEarned: IBadgeEntry[];
  myAnswers: IBattleAnswerRecord[];
  opponentAnswers: IBattleAnswerRecord[];
  endedAt: string;
}

export interface ILanguageStat {
  name: string;
  bytes: number;
  percent: number;
}

export interface ILeaderboardEntry {
  rank: number;
  user: Pick<IUser, 'id' | 'userName' | 'username' | 'avatarUrl' | 'persona' | 'level' | 'xp' | 'rank'>;
  wins: number;
  totalBattles: number;
  badges: number;
  winRate: number;
  streak: number;
  isCurrentUser: boolean;
}

export interface IWrappedSlideData {
  title: string;
  subtitle: string;
  value: string;
  detail: string;
  icon: string;
  gradient: string;
}

export interface IWrappedData {
  season: string;
  slides: IWrappedSlideData[];
  githubStats: IGitHubStats;
  persona: Persona;
  battleStats: IBattleStats;
  languageStats: ILanguageStat[];
  topRepositories: Array<{ name: string; description: string; stars: number; commits: number }>;
  streakDays: number;
  identity: {
    title: string;
    subtitle: string;
    level: number;
    xp: number;
    avatarUrl: string | null;
    userName: string;
  };
}

export interface INearbyDeveloper {
  username: string;
  avatarUrl: string | null;
  persona: Persona | null;
  level: number;
  xp: number;
  distanceText: string;
  approximateCity: string | null;
  lastActiveMinutes: number;
  tags: string[];
}

export interface IApiError {
  success: boolean;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
