import type { NextFunction, Request, Response } from "express";
import { Battle } from "../models/battle.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { calculateDNA, type DuelBreakdown } from "../services/dna.service.js";

const HISTORY_LIMIT = 20;

async function duelBreakdownForUser(userId: string): Promise<DuelBreakdown> {
  const empty: DuelBreakdown = {
    quizAccuracy: null,
    codingSolveRate: null,
    quizAnswered: 0,
    quizCorrect: 0,
    codingAnswered: 0,
    codingSolved: 0,
    battlesSampled: 0,
  };
  try {
    const battles = await Battle.find({ status: "finished", "players.userId": userId })
      .sort({ endedAt: -1, updatedAt: -1 })
      .limit(50)
      .select({ players: 1 })
      .lean();
    if (battles.length === 0) return empty;
    let quizAnswered = 0;
    let quizCorrect = 0;
    let codingAnswered = 0;
    let codingSolved = 0;
    for (const battle of battles) {
      const player = battle.players.find((p) => String(p.userId) === String(userId));
      if (!player || !Array.isArray(player.answers)) continue;
      for (const answer of player.answers) {
        if (answer.type === "coding") {
          codingAnswered += 1;
          if (answer.isCorrect) codingSolved += 1;
        } else {
          quizAnswered += 1;
          if (answer.isCorrect) quizCorrect += 1;
        }
      }
    }
    return {
      quizAccuracy: quizAnswered > 0 ? Math.round((quizCorrect / quizAnswered) * 100) : null,
      codingSolveRate: codingAnswered > 0 ? Math.round((codingSolved / codingAnswered) * 100) : null,
      quizAnswered,
      quizCorrect,
      codingAnswered,
      codingSolved,
      battlesSampled: battles.length,
    };
  } catch {
    return empty;
  }
}

async function dnaForUser(req: Request) {
  const user = await User.findById(req.user?.id);
  if (!user) throw ApiError.unauthorized();
  const duel = await duelBreakdownForUser(String(user._id));
  const dna = calculateDNA(user.githubStats, user.leetcodeStats, user.battleStats, duel, user.lastActiveAt);
  user.persona = dna.persona;
  user.personaReason = dna.personaReason;
  // Append a history snapshot only when something actually moved — keeps the
  // trail meaningful and bounded without a background job.
  const last = user.dnaHistory[user.dnaHistory.length - 1];
  const moved =
    !last ||
    last.persona !== dna.persona ||
    last.builder !== dna.scores.builder ||
    last.solver !== dna.scores.solver ||
    last.competitor !== dna.scores.competitor ||
    last.versatility !== dna.versatility;
  if (moved) {
    user.dnaHistory.push({
      persona: dna.persona,
      builder: dna.scores.builder,
      solver: dna.scores.solver,
      competitor: dna.scores.competitor,
      versatility: dna.versatility,
      createdAt: new Date(),
    });
    while (user.dnaHistory.length > HISTORY_LIMIT) user.dnaHistory.shift();
  }
  await user.save();
  return dna;
}

export async function getMyDNA(req: Request, res: Response, next: NextFunction) {
  try {
    return res.success(200, "Developer DNA", await dnaForUser(req));
  } catch (error) {
    next(error);
  }
}

export async function regenerateDNA(req: Request, res: Response, next: NextFunction) {
  try {
    return res.success(200, "Developer DNA regenerated", await dnaForUser(req));
  } catch (error) {
    next(error);
  }
}

export async function getDnaHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id).select({ dnaHistory: 1 }).lean();
    if (!user) throw ApiError.unauthorized();
    return res.success(200, "DNA history", { history: user.dnaHistory ?? [] });
  } catch (error) {
    next(error);
  }
}
