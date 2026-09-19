import type { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { Battle } from "../models/battle.model.js";
import { ApiError } from "../utils/apiError.js";
import { toPublicUser } from "../utils/user-public.js";
export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.unauthorized();
    const battles = await Battle.find({
      "players.userId": user._id,
      status: "finished",
    })
      .sort({ endedAt: -1 })
      .limit(5);
    const recentBattles = battles.map((battle) => {
      const mine = battle.players.find((player) =>
        player.userId.equals(user._id),
      )!;
      const opponent = battle.players.find(
        (player) => !player.userId.equals(user._id),
      );
      return {
        battleId: battle.id,
        roomCode: battle.roomCode,
        opponentUsername: opponent ? "Opponent" : "Waiting",
        opponentAvatarUrl: null,
        outcome: battle.winnerId
          ? battle.winnerId.equals(user._id)
            ? "win"
            : "loss"
          : "draw",
        score: mine.score,
        opponentScore: opponent?.score ?? 0,
        accuracy: mine.answers.length
          ? Math.round(
              (mine.answers.filter((a) => a.isCorrect).length /
                mine.answers.length) *
                100,
            )
          : 0,
        xpEarned: 0,
        durationMinutes: 0,
        difficulty: battle.difficulty,
        startedAt: battle.startedAt?.toISOString() ?? new Date().toISOString(),
      };
    });
    const topRepositories = user.githubStats.mostActiveRepos.map((repo) => ({
      name: repo.repo,
      description: "GitHub activity",
      stars: 0,
      commits: repo.commits,
    }));
    return res.success(200, "Dashboard", {
      user: toPublicUser(user),
      recentBattles,
      badges: user.badges,
      topRepositories,
    });
  } catch (error) {
    next(error);
  }
}
