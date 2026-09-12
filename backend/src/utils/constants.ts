export const PERSONAS = [
  "The Architect",
  "The Night Owl",
  "The Polyglot",
  "The Builder",
  "The Open Source Warrior",
  "The Debugger",
  "The Consistent Coder",
  "The Weekend Warrior",
  "The Specialist",
  "The Explorer",
] as const;

export type Persona = (typeof PERSONAS)[number];

export const BADGE_CATEGORIES = ["battle", "streak", "social", "code", "special"] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

export const BADGE_TIERS = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
export type BadgeTier = (typeof BADGE_TIERS)[number];

export const BATTLE_STATUSES = ["waiting", "active", "finished", "cancelled"] as const;
export type BattleStatus = (typeof BATTLE_STATUSES)[number];

export const BATTLE_MODES = ["1v1", "royale"] as const;
export type BattleMode = (typeof BATTLE_MODES)[number];

export const MAX_ROYALE_PLAYERS = 8;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPES = ["mcq", "code_output", "fill_blank", "debug"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const XP_SOURCES = [
  "battle_win",
  "battle_participation",
  "streak",
  "badge",
  "daily_login",
  "wrapped_share",
  "referral",
] as const;
export type XpSource = (typeof XP_SOURCES)[number];

export const PROVIDERS = ["local", "google", "github"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const ROOM_CODE_LENGTH = 6;
export const DEFAULT_BATTLE_TIME_LIMIT = 60000; // 60 seconds
export const MAX_PLAYERS_PER_BATTLE = 2;
export const RECONNECT_GRACE_PERIOD = 30000; // 30 seconds

export function getXpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function getLevelFromXp(xp: number): number {
  if (xp < 0) return 1;
  return Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
}

export function getXpProgress(xp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const level = getLevelFromXp(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  return {
    currentLevel: level,
    currentLevelXp: xp - currentLevelXp,
    nextLevelXp: nextLevelXp - currentLevelXp,
    progress: (xp - currentLevelXp) / (nextLevelXp - currentLevelXp),
  };
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}