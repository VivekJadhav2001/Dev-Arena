import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import {
  clearLeetCodeUser,
  setLeetCodeUsername,
  syncLeetCodeUser,
} from "../services/leetcode.service.js";

const CACHE_MS = 15 * 60 * 1000;

const usernameSchema = z.object({
  username: z.string().trim().min(1).max(30),
});

function publicStats(user: {
  leetcodeUsername: string | null;
  leetcodeStats: {
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
    languages: Array<{ name: string; solved: number }>;
    skillTags: Array<{ name: string; solved: number; level: string }>;
    badges: Array<{ name: string; icon: string | null; earnedAt: string | null }>;
    recentSolved: Array<{ title: string; titleSlug: string; timestamp: number; lang: string }>;
    totalActiveDays: number;
    streak: number;
    lastSyncedAt: Date | null;
  };
}) {
  return {
    leetcodeUsername: user.leetcodeUsername,
    leetcodeStats: user.leetcodeStats,
    lastSyncedAt: user.leetcodeStats.lastSyncedAt,
  };
}

/** PUT /api/v1/users/me/leetcode — connect a username and pull its public stats. */
export async function connectLeetCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = usernameSchema.parse(req.body);
    const user = await setLeetCodeUsername(req.user!.id, username);
    return res.success(200, "LeetCode account connected", publicStats(user));
  } catch (error) {
    next(error);
  }
}

/** POST /api/v1/users/me/leetcode/sync — refresh cached stats (15-min cache). */
export async function syncLeetCode(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.unauthorized();
    if (!user.leetcodeUsername) throw ApiError.badRequest("Connect a LeetCode username first.");
    const lastSyncedAt = user.leetcodeStats.lastSyncedAt;
    if (lastSyncedAt && Date.now() - lastSyncedAt.getTime() < CACHE_MS) {
      return res.success(200, "LeetCode statistics are up to date", publicStats(user));
    }
    const synced = await syncLeetCodeUser(user.id);
    return res.success(200, "LeetCode statistics synced", publicStats(synced));
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/v1/users/me/leetcode — disconnect. */
export async function disconnectLeetCode(req: Request, res: Response, next: NextFunction) {
  try {
    await clearLeetCodeUser(req.user!.id);
    return res.success(200, "LeetCode account disconnected");
  } catch (error) {
    next(error);
  }
}
