import mongoose from "mongoose";
import { Battle } from "../models/battle.model.js";
import { User } from "../models/user.model.js";
import { getLevelFromXp } from "../utils/constants.js";

/**
 * Single source of truth for battle-derived progression.
 *
 * Nothing else in the codebase writes xp/battleStats, so the leaderboard can
 * trust these fields. Rules (deterministic, server-side):
 * - xpEarned = battle score (question points) + outcome bonus
 *   (win +50, draw +25, loss +10 — a finished battle always counts).
 * - xp AND totalXp both accumulate lifetime earnings; level derives from totalXp.
 * - battleStats track totals, streaks and a running average score.
 */

export type BattleOutcome = "win" | "loss" | "draw";

const BONUS: Record<BattleOutcome, number> = { win: 50, draw: 25, loss: 10 };

export function xpForBattle(score: number, outcome: BattleOutcome): number {
  return Math.max(0, score) + BONUS[outcome];
}

interface BattleParticipant {
  userId: mongoose.Types.ObjectId;
  score: number;
}

export function outcomeFor(
  userId: mongoose.Types.ObjectId,
  winnerId: mongoose.Types.ObjectId | null,
): BattleOutcome {
  if (winnerId == null) return "draw";
  return String(winnerId) === String(userId) ? "win" : "loss";
}

/**
 * Persist one finished battle to every participant's User record.
 * Idempotency comes from callers: lock commits the finished transition
 * atomically and forfeit refuses already-finished battles.
 */
export async function applyBattleCompletion(battle: {
  players: BattleParticipant[];
  winnerId: mongoose.Types.ObjectId | null;
  language: string | null;
}): Promise<void> {
  await Promise.all(
    battle.players.map(async (player) => {
      try {
        const user = await User.findById(player.userId);
        if (!user) return;
        // Ancient accounts may predate the battleStats subdocument.
        if (!user.battleStats) {
          user.battleStats = {
            totalBattles: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winStreak: 0,
            bestWinStreak: 0,
            avgScore: 0,
            favoriteLanguage: null,
          };
        }
        const outcome = outcomeFor(player.userId, battle.winnerId);
        const xpEarned = xpForBattle(player.score, outcome);
        const stats = user.battleStats;
        const totalBattles = stats.totalBattles + 1;
        const wins = stats.wins + (outcome === "win" ? 1 : 0);
        const losses = stats.losses + (outcome === "loss" ? 1 : 0);
        const draws = stats.draws + (outcome === "draw" ? 1 : 0);
        const winStreak = outcome === "win" ? stats.winStreak + 1 : outcome === "loss" ? 0 : stats.winStreak;
        user.battleStats.totalBattles = totalBattles;
        user.battleStats.wins = wins;
        user.battleStats.losses = losses;
        user.battleStats.draws = draws;
        user.battleStats.winStreak = winStreak;
        user.battleStats.bestWinStreak = Math.max(stats.bestWinStreak, winStreak);
        user.battleStats.avgScore =
          Math.round(((stats.avgScore * stats.totalBattles + player.score) / totalBattles) * 10) / 10;
        if (battle.language) user.battleStats.favoriteLanguage = battle.language;
        user.totalXp += xpEarned;
        user.xp += xpEarned;
        user.level = getLevelFromXp(user.totalXp);
        user.lastActiveAt = new Date();
        await user.save();
      } catch (err) {
        // Stats must never break the battle response; surface for logs.
        console.error(`battle-stats: failed to persist battle for ${player.userId}:`, err);
      }
    }),
  );
}

/**
 * One-time repair for battles finished before stat persistence existed.
 * Replays finished battles chronologically per user, but only for users
 * whose battleStats were never computed (totalBattles === 0, applied
 * atomically) — safe to run on every boot.
 */
export async function backfillBattleStats(): Promise<{ users: number; battles: number }> {
  const battles = await Battle.find({ status: "finished" })
    .sort({ endedAt: 1, createdAt: 1 })
    .select({ players: 1, winnerId: 1, language: 1 })
    .lean();
  if (battles.length === 0) return { users: 0, battles: 0 };

  interface Acc {
    totalBattles: number;
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    bestWinStreak: number;
    scoreSum: number;
    xpSum: number;
    favoriteLanguage: string | null;
  }
  const perUser = new Map<string, Acc>();
  for (const battle of battles) {
    for (const player of battle.players) {
      const id = String(player.userId);
      const acc = perUser.get(id) ?? {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        bestWinStreak: 0,
        scoreSum: 0,
        xpSum: 0,
        favoriteLanguage: null,
      };
      const winnerId = battle.winnerId as mongoose.Types.ObjectId | null;
      const outcome = outcomeFor(player.userId as mongoose.Types.ObjectId, winnerId);
      acc.totalBattles += 1;
      if (outcome === "win") {
        acc.wins += 1;
        acc.winStreak += 1;
      } else if (outcome === "loss") {
        acc.losses += 1;
        acc.winStreak = 0;
      } else {
        acc.draws += 1;
      }
      acc.bestWinStreak = Math.max(acc.bestWinStreak, acc.winStreak);
      acc.scoreSum += player.score;
      acc.xpSum += xpForBattle(player.score, outcome);
      if (battle.language) acc.favoriteLanguage = battle.language;
      perUser.set(id, acc);
    }
  }

  let users = 0;
  for (const [id, acc] of perUser) {
    const existing = await User.findById(id).select({ totalXp: 1, xp: 1 }).lean();
    if (!existing) continue;
    const totalXp = (existing.totalXp ?? 0) + acc.xpSum;
    const updated = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), "battleStats.totalBattles": 0 },
      {
        $set: {
          battleStats: {
            totalBattles: acc.totalBattles,
            wins: acc.wins,
            losses: acc.losses,
            draws: acc.draws,
            winStreak: acc.winStreak,
            bestWinStreak: acc.bestWinStreak,
            avgScore: acc.totalBattles > 0 ? Math.round((acc.scoreSum / acc.totalBattles) * 10) / 10 : 0,
            favoriteLanguage: acc.favoriteLanguage,
          },
          totalXp,
          xp: (existing.xp ?? 0) + acc.xpSum,
          level: getLevelFromXp(totalXp),
        },
      },
    );
    if (updated) users += 1;
  }
  return { users, battles: battles.length };
}
