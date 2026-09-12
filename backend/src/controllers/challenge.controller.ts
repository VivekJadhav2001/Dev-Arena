import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Battle } from "../models/battle.model.js";
import { Challenge } from "../models/challenge.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { DIFFICULTIES, generateRoomCode } from "../utils/constants.js";
import { buildBattleQuestions } from "../services/battle-questions.service.js";
import { emitToUser } from "../sockets/index.js";

export const CHALLENGE_TTL_MINUTES = 10;
export const CHALLENGE_RATE_LIMIT_PER_HOUR = 10;

const createSchema = z.object({
  challengedUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid developer id"),
  difficulty: z.enum(DIFFICULTIES).default("medium"),
  language: z.string().max(40).nullable().default(null),
  timeLimit: z.number().int().min(30).max(600).default(60),
  message: z.string().trim().max(280).optional(),
});

const listSchema = z.object({
  direction: z.enum(["incoming", "outgoing", "history"]).default("incoming"),
});

async function expireStaleChallenges(): Promise<void> {
  const expired = await Challenge.find({ status: "pending", expiresAt: { $lt: new Date() } });
  for (const challenge of expired) {
    challenge.status = "expired";
    await challenge.save();
    emitToUser(String(challenge.challenger), "challenge:expired", { challengeId: String(challenge._id) });
    emitToUser(String(challenge.challenged), "challenge:expired", { challengeId: String(challenge._id) });
  }
}

export async function sweepExpiredChallenges(): Promise<void> {
  try {
    await expireStaleChallenges();
  } catch {
    // best-effort background sweep
  }
}

function toChallengeDTO(challenge: {
  _id: unknown;
  challenger: unknown;
  challenged: unknown;
  status: string;
  battleId: unknown;
  settings: unknown;
  message: unknown;
  expiresAt: unknown;
  respondedAt: unknown;
  createdAt?: unknown;
}) {
  return {
    id: String(challenge._id),
    challengerId: String(challenge.challenger),
    challengedId: String(challenge.challenged),
    status: challenge.status,
    battleId: challenge.battleId ? String(challenge.battleId) : null,
    settings: challenge.settings,
    message: challenge.message ?? null,
    expiresAt: challenge.expiresAt,
    respondedAt: challenge.respondedAt ?? null,
    createdAt: challenge.createdAt ?? null,
  };
}

async function populateChallengeUsers(challenges: Array<{ challenger: unknown; challenged: unknown }>) {
  const ids = new Set<string>();
  for (const c of challenges) {
    ids.add(String(c.challenger));
    ids.add(String(c.challenged));
  }
  const users = await User.find({ _id: { $in: [...ids] } }).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return byId;
}

/** POST /api/v1/challenges — challenge a nearby developer to a code fight. */
export async function createChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createSchema.parse(req.body);
    const challengerId = new mongoose.Types.ObjectId(req.user!.id);
    const challengedId = new mongoose.Types.ObjectId(input.challengedUserId);

    if (challengerId.equals(challengedId)) throw ApiError.badRequest("You cannot challenge yourself");

    const target = await User.findById(challengedId);
    if (!target) throw ApiError.notFound("Developer not found");
    if (target.settings.allowChallenges === false) {
      throw ApiError.badRequest("This developer is not accepting challenges right now");
    }

    const existing = await Challenge.findOne({
      status: "pending",
      expiresAt: { $gte: new Date() },
      $or: [
        { challenger: challengerId, challenged: challengedId },
        { challenger: challengedId, challenged: challengerId },
      ],
    });
    if (existing) throw ApiError.badRequest("A pending challenge already exists between you two");

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await Challenge.countDocuments({
      challenger: challengerId,
      createdAt: { $gte: hourAgo },
    });
    if (recentCount >= CHALLENGE_RATE_LIMIT_PER_HOUR) {
      throw ApiError.tooManyRequests("Challenge limit reached. Try again later.");
    }

    const challenge = await Challenge.create({
      challenger: challengerId,
      challenged: challengedId,
      settings: {
        difficulty: input.difficulty,
        language: input.language,
        timeLimit: input.timeLimit,
      },
      message: input.message ?? null,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MINUTES * 60 * 1000),
    });

    const challenger = await User.findById(challengerId).lean();
    emitToUser(String(challengedId), "challenge:received", {
      challenge: {
        ...toChallengeDTO(challenge),
        challenger: challenger
          ? {
              id: String(challenger._id),
              userName: challenger.userName,
              avatarUrl: challenger.avatarUrl ?? null,
              persona: challenger.persona ?? null,
              level: challenger.level ?? 1,
            }
          : null,
      },
    });

    return res.success(201, "Challenge sent", toChallengeDTO(challenge));
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/challenges?direction=incoming|outgoing|history */
export async function listChallenges(req: Request, res: Response, next: NextFunction) {
  try {
    await expireStaleChallenges();
    const { direction } = listSchema.parse(req.query);
    const me = new mongoose.Types.ObjectId(req.user!.id);

    const filter =
      direction === "incoming"
        ? { challenged: me, status: "pending" as const }
        : direction === "outgoing"
          ? { challenger: me, status: "pending" as const }
          : { $or: [{ challenger: me }, { challenged: me }], status: { $ne: "pending" as const } };

    const challenges = await Challenge.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    const usersById = await populateChallengeUsers(challenges);
    const data = challenges.map((c) => ({
      ...toChallengeDTO(c),
      challenger: (() => {
        const u = usersById.get(String(c.challenger));
        return u
          ? { id: String(u._id), userName: u.userName, avatarUrl: u.avatarUrl ?? null, persona: u.persona ?? null, level: u.level ?? 1 }
          : { id: String(c.challenger), userName: "Developer", avatarUrl: null, persona: null, level: 1 };
      })(),
      challenged: (() => {
        const u = usersById.get(String(c.challenged));
        return u
          ? { id: String(u._id), userName: u.userName, avatarUrl: u.avatarUrl ?? null, persona: u.persona ?? null, level: u.level ?? 1 }
          : { id: String(c.challenged), userName: "Developer", avatarUrl: null, persona: null, level: 1 };
      })(),
    }));

    return res.success(200, "Challenges fetched", { challenges: data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/v1/challenges/:challengeId */
export async function getChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    await expireStaleChallenges();
    const challenge = await Challenge.findById(req.params.challengeId).lean();
    if (!challenge) throw ApiError.notFound("Challenge not found");
    const me = String(req.user!.id);
    if (String(challenge.challenger) !== me && String(challenge.challenged) !== me) {
      throw ApiError.forbidden("You are not part of this challenge");
    }
    return res.success(200, "Challenge", toChallengeDTO(challenge));
  } catch (error) {
    next(error);
  }
}

async function uniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const roomCode = generateRoomCode();
    if (!(await Battle.exists({ roomCode }))) return roomCode;
  }
  throw ApiError.internal("Unable to allocate a room code. Please try again.");
}

/**
 * POST /api/v1/challenges/:challengeId/accept
 * Reuses the existing Arena battle system: creates a Battle with both
 * developers as players, then both clients join the same roomCode.
 */
export async function acceptChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) throw ApiError.notFound("Challenge not found");
    if (String(challenge.challenged) !== String(req.user!.id)) {
      throw ApiError.forbidden("Only the challenged developer can accept");
    }
    if (challenge.status !== "pending") throw ApiError.badRequest(`Challenge is ${challenge.status}`);
    if (challenge.expiresAt.getTime() < Date.now()) {
      challenge.status = "expired";
      await challenge.save();
      throw ApiError.badRequest("Challenge has expired");
    }

    const roomCode = await uniqueRoomCode();
    const battle = await Battle.create({
      roomCode,
      hostId: challenge.challenger,
      mode: "1v1",
      maxPlayers: 2,
      players: [{ userId: challenge.challenger, score: 0, answers: [] }, { userId: challenge.challenged, score: 0, answers: [] }],
      difficulty: challenge.settings.difficulty,
      language: challenge.settings.language,
      timeLimit: challenge.settings.timeLimit,
      questions: buildBattleQuestions(challenge.settings.language, challenge.settings.difficulty),
    });

    challenge.status = "accepted";
    challenge.battleId = battle._id;
    challenge.respondedAt = new Date();
    await challenge.save();

    const payload = { challengeId: String(challenge._id), battleId: String(battle._id), roomCode };
    emitToUser(String(challenge.challenger), "challenge:accepted", payload);
    emitToUser(String(challenge.challenged), "challenge:accepted", payload);

    return res.success(200, "Challenge accepted", payload);
  } catch (error) {
    next(error);
  }
}

/** POST /api/v1/challenges/:challengeId/decline */
export async function declineChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) throw ApiError.notFound("Challenge not found");
    if (String(challenge.challenged) !== String(req.user!.id)) {
      throw ApiError.forbidden("Only the challenged developer can decline");
    }
    if (challenge.status !== "pending") throw ApiError.badRequest(`Challenge is ${challenge.status}`);
    challenge.status = "declined";
    challenge.respondedAt = new Date();
    await challenge.save();
    emitToUser(String(challenge.challenger), "challenge:declined", { challengeId: String(challenge._id) });
    return res.success(200, "Challenge declined", toChallengeDTO(challenge));
  } catch (error) {
    next(error);
  }
}

/** POST /api/v1/challenges/:challengeId/cancel — challenger only. */
export async function cancelChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) throw ApiError.notFound("Challenge not found");
    if (String(challenge.challenger) !== String(req.user!.id)) {
      throw ApiError.forbidden("Only the challenger can cancel");
    }
    if (challenge.status !== "pending") throw ApiError.badRequest(`Challenge is ${challenge.status}`);
    challenge.status = "cancelled";
    challenge.respondedAt = new Date();
    await challenge.save();
    emitToUser(String(challenge.challenged), "challenge:declined", { challengeId: String(challenge._id) });
    return res.success(200, "Challenge cancelled", toChallengeDTO(challenge));
  } catch (error) {
    next(error);
  }
}
