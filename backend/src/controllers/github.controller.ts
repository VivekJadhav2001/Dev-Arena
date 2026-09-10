import type { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import type { IGitHubStats } from "../models/user.model.js";
import type { Persona } from "../utils/constants.js";
import { collectGitHubIntelligence } from "../services/github.service.js";
import { ApiError } from "../utils/apiError.js";

const CACHE_MS = 15 * 60 * 1000;

function publicStats(user: { githubStats: IGitHubStats; persona: Persona | null; personaReason: string | null }) {
  return { githubStats: user.githubStats, persona: user.persona, personaReason: user.personaReason, lastSyncedAt: user.githubStats.lastSyncedAt };
}

export async function syncGitHub(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.unauthorized();
    const lastSyncedAt = user.githubStats.lastSyncedAt;
    if (lastSyncedAt && Date.now() - lastSyncedAt.getTime() < CACHE_MS) return res.success(200, "GitHub statistics are up to date", publicStats(user));
    const stats = await collectGitHubIntelligence(user);
    user.githubStats = stats;
    await user.save();
    return res.success(200, "GitHub statistics synced", publicStats(user));
  } catch (error) { next(error); }
}

export async function getMyGitHubStats(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.unauthorized();
    return res.success(200, "GitHub statistics", publicStats(user));
  } catch (error) { next(error); }
}
