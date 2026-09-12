import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Battle } from "../models/battle.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import {
  BATTLE_MODES,
  DIFFICULTIES,
  MAX_ROYALE_PLAYERS,
  generateRoomCode,
} from "../utils/constants.js";
import { buildBattleQuestions } from "../services/battle-questions.service.js";

const createSchema = z.object({
  difficulty: z.enum(DIFFICULTIES).default("easy"),
  language: z.string().max(40).nullable().default(null),
  timeLimit: z.number().int().min(30).max(600).default(60),
  mode: z.enum(BATTLE_MODES).default("1v1"),
  maxPlayers: z.number().int().min(2).max(MAX_ROYALE_PLAYERS).optional(),
});
const joinSchema = z.object({
  roomCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/),
});
const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().max(200),
  timeTaken: z.number().min(0).max(600),
});
const historySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

type BattleDoc = NonNullable<Awaited<ReturnType<typeof Battle.findOne>>>;

function questions(language: string | null, difficulty: "easy" | "medium" | "hard") {
  return buildBattleQuestions(language, difficulty);
}

async function uniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomCode = generateRoomCode();
    if (!(await Battle.exists({ roomCode }))) return roomCode;
  }
  throw ApiError.internal("Unable to allocate a room code. Please try again.");
}

function hasPlayer(battle: { players: Array<{ userId: { equals(id: unknown): boolean } }> }, id: unknown) {
  return battle.players.some((player) => player.userId.equals(id));
}

function accuracyOf(player: { answers: Array<{ isCorrect: boolean }> }): number {
  if (player.answers.length === 0) return 0;
  return Math.round(
    (player.answers.filter((answer) => answer.isCorrect).length / player.answers.length) * 100,
  );
}

function winnerOf(battle: {
  players: Array<{ userId: mongoose.Types.ObjectId; score: number }>;
}): mongoose.Types.ObjectId | null {
  if (battle.players.length === 0) return null;
  const top = Math.max(...battle.players.map((player) => player.score));
  const leaders = battle.players.filter((player) => player.score === top);
  return leaders.length === 1 ? leaders[0].userId : null;
}

interface StandingPlayer {
  userId: { equals(id: unknown): boolean; toString(): string };
  score: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeTaken: number;
    submittedAt: Date;
  }>;
}

async function standingsFor(battle: {
  players: StandingPlayer[];
  questions: Array<{ questionId: string }>;
  winnerId?: { toString(): string } | null;
  hostId: { equals(id: unknown): boolean };
}) {
  const users = await User.find({
    _id: { $in: battle.players.map((player) => player.userId) },
  }).lean();
  const ranked = [...battle.players].sort((a, b) => b.score - a.score);
  return ranked.map((player, index) => {
    const user = users.find(
      (candidate) => String(candidate._id) === player.userId.toString(),
    );
    const correct = player.answers.filter((answer) => answer.isCorrect).length;
    return {
      rank: index + 1,
      userId: player.userId.toString(),
      username: user?.userName ?? "Developer",
      avatarUrl: user?.avatarUrl ?? null,
      score: player.score,
      correct,
      total: battle.questions.length,
      accuracy: accuracyOf(player),
      isHost: battle.hostId.equals(player.userId),
      isWinner:
        battle.winnerId != null &&
        battle.winnerId.toString() === player.userId.toString(),
    };
  });
}

async function resultFor(
  battle: BattleDoc & {
    players: StandingPlayer[];
    questions: Array<{ questionId: string }>;
    winnerId?: { toString(): string } | null;
  hostId: { equals(id: unknown): boolean };
  roomCode: string;
  mode: string;
  endedAt?: Date | null;
  },
  userId: string,
) {
  const standings = await standingsFor(battle);
  const mine = battle.players.find((player) => player.userId.equals(userId));
  const myRank = standings.find(
    (entry) => mine != null && entry.userId === mine.userId.toString(),
  )?.rank;
  return {
    roomCode: battle.roomCode,
    mode: battle.mode,
    winner: battle.winnerId?.toString() ?? null,
    isDraw: battle.winnerId == null,
    myScore: mine?.score ?? 0,
    myRank: myRank ?? null,
    myAccuracy: mine ? accuracyOf(mine) : 0,
    myCorrect: mine?.answers.filter((answer) => answer.isCorrect).length ?? 0,
    totalQuestions: battle.questions.length,
    xpEarned: 0,
    badgesEarned: [],
    myAnswers: mine?.answers ?? [],
    standings,
    endedAt: battle.endedAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function stateFor(
  battle: BattleDoc & {
    players: StandingPlayer[];
    questions: Array<{
      questionId: string;
      prompt: string;
      type: string;
      language: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      code: string | null;
      tags: string[];
      xpValue: number;
    }>;
    winnerId?: { toString(): string } | null;
  hostId: { equals(id: unknown): boolean };
  roomCode: string;
  mode: string;
  status: string;
  difficulty: string;
    language: string | null;
    timeLimit: number;
    startedAt?: Date | null;
    endedAt?: Date | null;
    id: string;
  },
  userId: string,
) {
  const users = await User.find({
    _id: { $in: battle.players.map((player) => player.userId) },
  }).lean();
  const mine = battle.players.find((player) => player.userId.equals(userId));
  return {
    battleId: battle.id,
    roomCode: battle.roomCode,
    status: battle.status,
    mode: battle.mode,
    maxPlayers: battle.maxPlayers ?? battle.players.length,
    difficulty: battle.difficulty,
    language: battle.language,
    timeLimit: battle.timeLimit,
    currentQuestionIndex: mine?.answers.length ?? 0,
    totalQuestions: battle.questions.length,
    players: battle.players.map((player) => {
      const user = users.find(
        (candidate) => String(candidate._id) === player.userId.toString(),
      );
      return {
        userId: player.userId.toString(),
        username: user?.userName ?? "Developer",
        avatarUrl: user?.avatarUrl ?? null,
        score: player.score,
        answersCount: player.answers.length,
        isHost: battle.hostId.equals(player.userId),
      };
    }),
    questions:
      battle.status === "active"
        ? battle.questions.map(({ correctAnswer: _correct, explanation: _expl, ...question }) => question)
        : [],
    myAnswer: mine?.answers.at(-1)?.answer ?? null,
    result: battle.status === "finished" ? await resultFor(battle, userId) : null,
    startedAt: battle.startedAt?.toISOString() ?? null,
  };
}

export async function createBattle(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createSchema.parse(req.body);
    const maxPlayers = input.mode === "1v1" ? 2 : (input.maxPlayers ?? 4);
    if (input.mode === "royale" && maxPlayers < 3) {
      throw ApiError.badRequest("Royale battles need at least 3 players.");
    }
    const roomCode = await uniqueCode();
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const battle = await Battle.create({
      roomCode,
      hostId: userId,
      mode: input.mode,
      maxPlayers,
      players: [{ userId, score: 0, answers: [] }],
      difficulty: input.difficulty,
      language: input.language,
      timeLimit: input.timeLimit,
      questions: questions(input.language, input.difficulty),
    });
    return res.success(201, "Battle room created", {
      roomCode,
      battleId: battle.id,
      mode: battle.mode,
      maxPlayers: battle.maxPlayers,
    });
  } catch (error) {
    next(error);
  }
}

export async function joinBattle(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomCode } = joinSchema.parse(req.body);
    const battle = await Battle.findOne({ roomCode });
    if (!battle) throw ApiError.notFound("Room not found");
    if (battle.status !== "waiting") throw ApiError.badRequest("This battle has already started");
    if (!hasPlayer(battle, req.user!.id)) {
      if (battle.players.length >= battle.maxPlayers)
        throw ApiError.badRequest("This room is full");
      battle.players.push({
        userId: new mongoose.Types.ObjectId(req.user!.id),
        score: 0,
        answers: [],
      });
      await battle.save();
    }
    return res.success(200, "Joined battle room", { roomCode: battle.roomCode, battleId: battle.id });
  } catch (error) {
    next(error);
  }
}

export async function getRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || !hasPlayer(battle, req.user!.id))
      throw ApiError.notFound("Battle room not found");
    return res.success(200, "Battle room", await stateFor(battle, req.user!.id));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/arena/:roomCode/result — shareable battle result.
 * Participants always have access; any other signed-in user can view a
 * finished battle (usernames, scores and standings only — correct answers
 * and explanations are never exposed here).
 */
export async function getResult(req: Request, res: Response, next: NextFunction) {
  try {
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || battle.status !== "finished") throw ApiError.notFound("Battle result not found");
    if (hasPlayer(battle, req.user!.id)) {
      return res.success(200, "Battle result", await resultFor(battle, req.user!.id));
    }
    const standings = await standingsFor(battle);
    return res.success(200, "Battle result", {
      roomCode: battle.roomCode,
      mode: battle.mode,
      winner: battle.winnerId?.toString() ?? null,
      isDraw: battle.winnerId == null,
      totalQuestions: battle.questions.length,
      xpEarned: 0,
      badgesEarned: [],
      standings,
      endedAt: battle.endedAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function startBattle(req: Request, res: Response, next: NextFunction) {
  try {
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || !hasPlayer(battle, req.user!.id))
      throw ApiError.notFound("Battle room not found");
    if (!battle.hostId.equals(req.user!.id))
      throw ApiError.forbidden("Only the host can start this battle");
    if (battle.players.length < 2) throw ApiError.badRequest("Waiting for more developers to join");
    if (battle.status === "waiting") {
      battle.status = "active";
      battle.startedAt = new Date();
      await battle.save();
    }
    return res.success(200, "Battle started", await stateFor(battle, req.user!.id));
  } catch (error) {
    next(error);
  }
}

export async function submitAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const input = answerSchema.parse(req.body);
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || battle.status !== "active") throw ApiError.badRequest("Battle is not active");
    const player = battle.players.find((candidate) => candidate.userId.equals(req.user!.id));
    if (!player) throw ApiError.forbidden();
    if (player.answers.some((answer) => answer.questionId === input.questionId))
      throw ApiError.badRequest("That answer has already been submitted");
    const question = battle.questions.find(
      (candidate) => candidate.questionId === input.questionId,
    );
    if (!question) throw ApiError.badRequest("Unknown question");
    const isCorrect = input.answer.trim() === question.correctAnswer;
    player.answers.push({
      questionId: question.questionId,
      answer: input.answer.trim(),
      isCorrect,
      timeTaken: input.timeTaken,
      submittedAt: new Date(),
    });
    if (isCorrect) player.score += question.xpValue;
    if (
      battle.players.every((candidate) => candidate.answers.length >= battle.questions.length)
    ) {
      battle.status = "finished";
      battle.endedAt = new Date();
      battle.winnerId = winnerOf(battle);
    }
    await battle.save();
    return res.success(200, "Answer recorded", {
      isCorrect,
      xpEarned: 0,
      currentScore: player.score,
      finished: battle.status === "finished",
    });
  } catch (error) {
    next(error);
  }
}

export async function forfeitBattle(req: Request, res: Response, next: NextFunction) {
  try {
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || !hasPlayer(battle, req.user!.id))
      throw ApiError.notFound("Battle room not found");
    const others = battle.players.filter((player) => !player.userId.equals(req.user!.id));
    battle.status = "finished";
    battle.endedAt = new Date();
    battle.winnerId = others.length > 0 ? winnerOf({ players: others }) : null;
    await battle.save();
    return res.success(200, "Battle forfeited", {
      outcome: others.length > 0 ? "loss" : "draw",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/arena/history — paginated battle history for the signed-in
 * developer, newest first. Summaries only; full detail lives on
 * GET /api/v1/arena/:roomCode/details.
 */
export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = historySchema.parse(req.query);
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const filter = { "players.userId": userId };
    const total = await Battle.countDocuments(filter);
    const battles = await Battle.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const winnerIds = battles
      .map((battle) => battle.winnerId)
      .filter((id): id is mongoose.Types.ObjectId => id != null);
    const winners = winnerIds.length > 0
      ? await User.find({ _id: { $in: winnerIds } }).lean()
      : [];
    const winnerName = (id: mongoose.Types.ObjectId | null | undefined) => {
      if (id == null) return null;
      return winners.find((user) => String(user._id) === String(id))?.userName ?? null;
    };

    const items = battles.map((battle) => {
      const mine = battle.players.find((player) => String(player.userId) === String(userId));
      const myScore = mine?.score ?? 0;
      const outcome =
        battle.status !== "finished"
          ? null
          : battle.winnerId == null
            ? "draw"
            : String(battle.winnerId) === String(userId)
              ? "win"
              : "loss";
      return {
        roomCode: battle.roomCode,
        mode: battle.mode,
        difficulty: battle.difficulty,
        language: battle.language,
        status: battle.status,
        outcome,
        myScore,
        myCorrect: mine?.answers.filter((answer) => answer.isCorrect).length ?? 0,
        totalQuestions: battle.questions.length,
        playersCount: battle.players.length,
        winnerUsername: winnerName(battle.winnerId),
        startedAt: battle.startedAt?.toISOString() ?? null,
        endedAt: battle.endedAt?.toISOString() ?? null,
      };
    });

    return res.success(200, "Battle history", {
      battles: items,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/arena/:roomCode/details — everything about a battle except the
 * questions. Participants always have access; any other signed-in user can
 * view a finished battle (same rule as the shareable result).
 */
export async function getDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle) throw ApiError.notFound("Battle not found");
    const isParticipant = hasPlayer(battle, req.user!.id);
    if (!isParticipant && battle.status !== "finished") {
      throw ApiError.notFound("Battle not found");
    }
    const standings = await standingsFor(battle);
    const mine = battle.players.find((player) => player.userId.equals(req.user!.id));
    const myRank = mine
      ? (standings.find((entry) => entry.userId === mine.userId.toString())?.rank ?? null)
      : null;
    return res.success(200, "Battle details", {
      roomCode: battle.roomCode,
      mode: battle.mode,
      maxPlayers: battle.maxPlayers,
      difficulty: battle.difficulty,
      language: battle.language,
      timeLimit: battle.timeLimit,
      status: battle.status,
      totalQuestions: battle.questions.length,
      winner: battle.winnerId?.toString() ?? null,
      isDraw: battle.status === "finished" && battle.winnerId == null,
      myScore: mine?.score ?? null,
      myRank,
      myCorrect: mine?.answers.filter((answer) => answer.isCorrect).length ?? null,
      myAccuracy: mine ? accuracyOf(mine) : null,
      standings,
      startedAt: battle.startedAt?.toISOString() ?? null,
      endedAt: battle.endedAt?.toISOString() ?? null,
    });
  } catch (error) {
    next(error);
  }
}
