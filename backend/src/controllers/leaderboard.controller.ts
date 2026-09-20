import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Server-authoritative competitive ranking. Sort: lifetime XP desc, then
 * battle wins desc, then oldest account first (stable, deterministic).
 * Only public-safe fields are exposed — never email, tokens or settings.
 */
function entryOf(user: {
  _id: unknown;
  userName: string;
  avatarUrl?: string | null;
  persona: string | null;
  level: number;
  totalXp: number;
  battleStats?: { totalBattles: number; wins: number; winStreak: number } | null;
  badges: unknown[];
}, rank: number) {
  // Old accounts may predate the battleStats subdocument — treat as zeros.
  const totalBattles = user.battleStats?.totalBattles ?? 0;
  const wins = user.battleStats?.wins ?? 0;
  const streak = user.battleStats?.winStreak ?? 0;
  return {
    rank,
    id: String(user._id),
    userName: user.userName,
    avatarUrl: user.avatarUrl ?? null,
    persona: user.persona,
    level: user.level,
    xp: user.totalXp,
    wins,
    totalBattles,
    badges: user.badges.length,
    winRate: totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0,
    streak,
  };
}

const sortSpec = { totalXp: -1 as const, "battleStats.wins": -1 as const, createdAt: 1 as const };

// Private profiles (settings.publicProfile === false) are never ranked.
// `$ne: false` keeps legacy documents that predate the setting (default true).
const publicFilter = { "settings.publicProfile": { $ne: false } };

/**
 * GET /api/v1/leaderboard — public global rankings, paginated.
 */
export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = listSchema.parse(req.query);
    const total = await User.countDocuments(publicFilter);
    const users = await User.find(publicFilter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .select({
        userName: 1,
        avatarUrl: 1,
        persona: 1,
        level: 1,
        totalXp: 1,
        battleStats: 1,
        badges: 1,
      })
      .lean();
    const entries = users.map((user, index) => entryOf(user, (page - 1) * limit + index + 1));
    return res.success(200, "Leaderboard", {
      entries,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/leaderboard/me — the signed-in developer's rank context.
 * Rank = 1 + number of developers strictly ahead on the leaderboard order.
 */
export async function getMyRank(req: Request, res: Response, next: NextFunction) {
  try {
    const me = await User.findById(req.user!.id)
      .select({ userName: 1, totalXp: 1, level: 1, battleStats: 1, createdAt: 1 })
      .lean();
    if (!me) throw ApiError.unauthorized();
    const myXp = me.totalXp ?? 0;
    const myWins = me.battleStats?.wins ?? 0;
    const myBattles = me.battleStats?.totalBattles ?? 0;
    // createdAt exists at runtime (schema timestamps) and mirrors the list sort's tiebreak.
    const myCreatedAt = (me as unknown as { createdAt: Date }).createdAt;
    // Rank is computed against the visible (public) board only.
    const ahead = await User.countDocuments({
      ...publicFilter,
      $or: [
        { totalXp: { $gt: myXp } },
        { totalXp: myXp, "battleStats.wins": { $gt: myWins } },
        {
          totalXp: myXp,
          "battleStats.wins": myWins,
          createdAt: { $lt: myCreatedAt },
        },
      ],
    });
    return res.success(200, "My rank", {
      rank: ahead + 1,
      id: String(me._id),
      xp: myXp,
      totalXp: myXp,
      level: me.level,
      userName: me.userName,
      wins: myWins,
      totalBattles: myBattles,
    });
  } catch (error) {
    next(error);
  }
}
