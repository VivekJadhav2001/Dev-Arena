import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Battle } from "../models/battle.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface RecapBadge {
  badgeId: string;
  tier: string;
  earnedAt: string;
}

export interface WrappedRecap {
  userName: string;
  avatarUrl: string | null;
  persona: string | null;
  season: string;
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  topLanguage: string | null;
  longestWinStreak: number;
  currentWinStreak: number;
  busiestDay: string | null;
  busiestDayCount: number;
  topPercent: number | null;
  rank: number | null;
  totalRanked: number;
  badges: RecapBadge[];
  totalCommits: number;
  totalSolved: number;
}

function seasonLabel(): string {
  return `${new Date().getFullYear()} Season`;
}

interface RecapUser {
  _id: mongoose.Types.ObjectId;
  userName: string;
  avatarUrl?: string | null;
  persona: string | null;
  badges: Array<{ badgeId: string; tier: string; earnedAt: Date }>;
  githubStats: { totalCommits: number };
  leetcodeStats: { totalSolved: number };
}

export async function buildRecap(user: RecapUser | null): Promise<WrappedRecap> {
  if (!user) throw ApiError.unauthorized();
  const userId = user._id;

  const battles = await Battle.find({ "players.userId": userId, status: "finished" })
    .sort({ endedAt: 1 })
    .lean();

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let longestWinStreak = 0;
  let runningStreak = 0;
  const languageCounts = new Map<string, number>();
  const dayCounts = new Array<number>(7).fill(0);

  for (const battle of battles) {
    if (battle.winnerId == null) {
      draws += 1;
      runningStreak = 0;
    } else if (String(battle.winnerId) === String(userId)) {
      wins += 1;
      runningStreak += 1;
      longestWinStreak = Math.max(longestWinStreak, runningStreak);
    } else {
      losses += 1;
      runningStreak = 0;
    }
    if (battle.language) {
      languageCounts.set(battle.language, (languageCounts.get(battle.language) ?? 0) + 1);
    }
    const anchor = battle.startedAt ?? battle.endedAt;
    if (anchor) dayCounts[new Date(anchor).getDay()] += 1;
  }

  // Current streak walks back from the most recent battle.
  let currentWinStreak = 0;
  for (let index = battles.length - 1; index >= 0; index -= 1) {
    const battle = battles[index];
    if (battle.winnerId != null && String(battle.winnerId) === String(userId)) {
      currentWinStreak += 1;
    } else {
      break;
    }
  }

  const totalBattles = battles.length;
  const decisive = wins + losses;
  const winRate = decisive === 0 ? 0 : Math.round((wins / decisive) * 100);

  let topLanguage: string | null = null;
  let topLanguageCount = 0;
  for (const [language, count] of languageCounts) {
    if (count > topLanguageCount) {
      topLanguageCount = count;
      topLanguage = language;
    }
  }

  let busiestDay: string | null = null;
  let busiestDayCount = 0;
  dayCounts.forEach((count, index) => {
    if (count > busiestDayCount) {
      busiestDayCount = count;
      busiestDay = DAY_NAMES[index] ?? null;
    }
  });

  // Percentile by wins among developers with at least one finished battle.
  let topPercent: number | null = null;
  let rank: number | null = null;
  let totalRanked = 0;
  if (totalBattles > 0) {
    const [winsBoard, participants] = await Promise.all([
      Battle.aggregate<{ _id: mongoose.Types.ObjectId; wins: number }>([
        { $match: { status: "finished", winnerId: { $ne: null } } },
        { $group: { _id: "$winnerId", wins: { $sum: 1 } } },
      ]),
      Battle.distinct("players.userId", { status: "finished" }),
    ]);
    totalRanked = participants.length;
    const winsByUser = new Map<string, number>();
    for (const row of winsBoard) winsByUser.set(String(row._id), row.wins);
    const myWins = winsByUser.get(String(userId)) ?? 0;
    let better = 0;
    for (const count of winsByUser.values()) {
      if (count > myWins) better += 1;
    }
    if (totalRanked > 1) {
      rank = better + 1;
      topPercent = Math.max(1, Math.round((rank / totalRanked) * 100));
    }
  }

  return {
    userName: user.userName,
    avatarUrl: user.avatarUrl ?? null,
    persona: user.persona,
    season: seasonLabel(),
    totalBattles,
    wins,
    losses,
    draws,
    winRate,
    topLanguage,
    longestWinStreak,
    currentWinStreak,
    busiestDay,
    busiestDayCount,
    topPercent,
    rank,
    totalRanked,
    badges: user.badges.map((badge) => ({
      badgeId: badge.badgeId,
      tier: badge.tier,
      earnedAt: badge.earnedAt.toISOString(),
    })),
    totalCommits: user.githubStats.totalCommits,
    totalSolved: user.leetcodeStats.totalSolved,
  };
}

/** GET /api/v1/wrapped/me — private recap for the signed-in developer. */
export async function getMyWrapped(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.unauthorized();
    return res.success(200, "Wrapped recap", await buildRecap(user));
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/wrapped/:username — public read-only recap for sharing. */
export async function getPublicWrapped(req: Request, res: Response, next: NextFunction) {
  try {
    const username = String(req.params.username);
    const user = await User.findOne({
      userName: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (!user || !user.settings.publicProfile) throw ApiError.notFound("Wrapped recap not found");
    return res.success(200, "Wrapped recap", await buildRecap(user));
  } catch (error) {
    next(error);
  }
}
