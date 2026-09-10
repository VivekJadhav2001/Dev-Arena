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

export interface ISettings {
  publicProfile: boolean;
  showEmail: boolean;
  notifications: boolean;
  theme: "dark" | "light" | "system";
}

export interface INearbyLocation {
  optedIn: boolean;
  approximateCity: string | null;
  approximateRegion: string | null;
  countryCode: string | null;
  geohash: string | null;
  updatedAt: Date | null;
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
  nearbyLocation: INearbyLocation;
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
  },
  { _id: false }
);

const nearbyLocationSchema = new mongoose.Schema<INearbyLocation>(
  {
    optedIn: { type: Boolean, default: false },
    approximateCity: { type: String, default: null },
    approximateRegion: { type: String, default: null },
    countryCode: { type: String, default: null },
    geohash: { type: String, default: null },
    updatedAt: { type: Date, default: null },
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

    nearbyLocation: {
      type: nearbyLocationSchema,
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
userSchema.index({ "nearbyLocation.geohash": 1 });

export const User = mongoose.model("User", userSchema);
