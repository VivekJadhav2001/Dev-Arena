import mongoose from "mongoose";
import { Persona, BadgeTier } from "../utils/constants.js";

export interface IGitHubStats {
  totalRepos: number;
  publicRepos: number;
  followers: number;
  following: number;
  stars: number;
  forks: number;
  totalCommits: number;
  languages: Map<string, number>;
  topLanguage: string | null;
  contributionStreak: number;
  longestStreak: number;
  mostActiveRepos: Array<{ repo: string; commits: number }>;
  codingConsistency: number | null;
  openSourceScore: number | null;
  /**
   * Per-day pushed commits (YYYY-MM-DD), built from recent public events.
   * `repos` names which repositories moved that day with sample messages,
   * so heatmap hovers can show what each day is responsible for.
   */
  activityCalendar: Array<{
    day: string;
    count: number;
    repos: Array<{ name: string; commits: string[] }>;
  }>;
  lastSyncedAt: Date | null;
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
  earnedAt: Date;
  tier: BadgeTier;
}

export interface ILeetCodeLanguage {
  name: string;
  solved: number;
}

export interface ILeetCodeSkillTag {
  name: string;
  solved: number;
  level: "advanced" | "intermediate" | "fundamental";
}

export interface ILeetCodeBadge {
  name: string;
  icon: string | null;
  earnedAt: string | null;
}

export interface ILeetCodeRecentSolve {
  title: string;
  titleSlug: string;
  timestamp: number;
  lang: string;
}

export interface ILeetCodeStats {
  username: string | null;
  ranking: number | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number | null;
  contestGlobalRanking: number | null;
  contestsAttended: number;
  contestTopPercentage: number | null;
  contestBadge: string | null;
  languages: ILeetCodeLanguage[];
  skillTags: ILeetCodeSkillTag[];
  badges: ILeetCodeBadge[];
  recentSolved: ILeetCodeRecentSolve[];
  /**
   * Per-day accepted submissions (YYYY-MM-DD), trimmed to the last 365 days.
   * `problems` holds known titles (from recent submissions) so heatmap
   * hovers can show what each day is responsible for.
   */
  dailySolved: Array<{
    day: string;
    count: number;
    problems: Array<{ title: string; titleSlug: string; lang: string }>;
  }>;
  totalActiveDays: number;
  streak: number;
  lastSyncedAt: Date | null;
}

export interface ISettings {
  publicProfile: boolean;
  showEmail: boolean;
  notifications: boolean;
  theme: "dark" | "light" | "system";
  allowChallenges: boolean;
}

export interface IPresence {
  isOnline: boolean;
  lastSeenAt: Date | null;
  socketConnectedAt: Date | null;
}

export interface IUser {
  email?: string | null;
  userName: string;
  avatarUrl?: string | null;
  provider: string;
  providerAccountId: string;
  githubId?: string;
  googleId?: string;
  accessToken?: string;
  refreshToken?: string;

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
  leetcodeUsername: string | null;
  leetcodeStats: ILeetCodeStats;
  presence: IPresence;
  lastActiveAt: Date;
  joinedAt: Date;
}

const githubStatsSchema = new mongoose.Schema<IGitHubStats>(
  {
    totalRepos: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    totalCommits: { type: Number, default: 0 },
    languages: { type: Map, of: Number, default: {} },
    topLanguage: { type: String, default: null },
    contributionStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    mostActiveRepos: [
      {
        repo: { type: String, required: true },
        commits: { type: Number, required: true },
      },
    ],
    codingConsistency: { type: Number, default: null },
    openSourceScore: { type: Number, default: null },
    activityCalendar: [
      {
        day: { type: String, required: true },
        count: { type: Number, required: true },
        repos: [
          {
            name: { type: String, required: true },
            commits: { type: [String], default: [] },
          },
        ],
      },
    ],
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

const battleStatsSchema = new mongoose.Schema<IBattleStats>(
  {
    totalBattles: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    favoriteLanguage: { type: String, default: null },
  },
  { _id: false }
);

const badgeEntrySchema = new mongoose.Schema<IBadgeEntry>(
  {
    badgeId: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
    tier: { type: String, enum: ["bronze", "silver", "gold", "platinum", "diamond"], required: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema<ISettings>(
  {
    publicProfile: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
    allowChallenges: { type: Boolean, default: true },
  },
  { _id: false }
);

const leetcodeStatsSchema = new mongoose.Schema<ILeetCodeStats>(
  {
    username: { type: String, default: null },
    ranking: { type: Number, default: null },
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    contestRating: { type: Number, default: null },
    contestGlobalRanking: { type: Number, default: null },
    contestsAttended: { type: Number, default: 0 },
    contestTopPercentage: { type: Number, default: null },
    contestBadge: { type: String, default: null },
    languages: [
      {
        name: { type: String, required: true },
        solved: { type: Number, required: true },
      },
    ],
    skillTags: [
      {
        name: { type: String, required: true },
        solved: { type: Number, required: true },
        level: { type: String, enum: ["advanced", "intermediate", "fundamental"], required: true },
      },
    ],
    badges: [
      {
        name: { type: String, required: true },
        icon: { type: String, default: null },
        earnedAt: { type: String, default: null },
      },
    ],
    recentSolved: [
      {
        title: { type: String, required: true },
        titleSlug: { type: String, required: true },
        timestamp: { type: Number, required: true },
        lang: { type: String, required: true },
      },
    ],
    dailySolved: [
      {
        day: { type: String, required: true },
        count: { type: Number, required: true },
        problems: [
          {
            title: { type: String, required: true },
            titleSlug: { type: String, required: true },
            lang: { type: String, required: true },
          },
        ],
      },
    ],
    totalActiveDays: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

const presenceSchema = new mongoose.Schema<IPresence>(
  {
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: null },
    socketConnectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
    },

    providerAccountId: {
      type: String,
      required: true,
    },

    githubId: {
      type: String,
      trim: true,
    },

    googleId: {
      type: String,
      trim: true,
    },

    accessToken: {
      type: String,
    },

    refreshToken: {
      type: String,
    },

    persona: {
      type: String,
      enum: [
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
      ],
      default: null,
    },
    personaReason: {
      type: String,
      default: null,
    },
    level: {
      type: Number,
      default: 1,
    },
    xp: {
      type: Number,
      default: 0,
    },
    totalXp: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },

    githubStats: {
      type: githubStatsSchema,
      default: () => ({}),
    },

    battleStats: {
      type: battleStatsSchema,
      default: () => ({}),
    },

    badges: {
      type: [badgeEntrySchema],
      default: [],
    },

    settings: {
      type: settingsSchema,
      default: () => ({}),
    },

    leetcodeUsername: {
      type: String,
      trim: true,
      default: null,
    },

    leetcodeStats: {
      type: leetcodeStatsSchema,
      default: () => ({}),
    },

    presence: {
      type: presenceSchema,
      default: () => ({}),
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.index({ "githubStats.totalCommits": -1 });
userSchema.index({ xp: -1, level: -1 });
userSchema.index({ "battleStats.wins": -1 });
userSchema.index({ "presence.isOnline": 1 });

export const User = mongoose.model<IUser>("User", userSchema);
