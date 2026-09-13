import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Battle } from "../models/battle.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import {
  BATTLE_MODES,
  CODING_LANGUAGES,
  DIFFICULTIES,
  MAX_ROYALE_PLAYERS,
  generateRoomCode,
} from "../utils/constants.js";
import { buildBattleQuestions } from "../services/battle-questions.service.js";
import {
  normalizeLanguage,
  runTests,
  gradeCodingReport,
  ExecutionError,
} from "../services/code-execution.service.js";
import { applyBattleCompletion } from "../services/battle-stats.service.js";
import { emitBattleUpdated } from "../sockets/index.js";

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
const codeSchema = z.object({
  questionId: z.string().min(1),
  language: z.string().min(1).max(40),
  code: z.string().min(1).max(100_000),
});
const historySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

type BattleDoc = NonNullable<Awaited<ReturnType<typeof Battle.findOne>>>;

function questions(language: string | null, difficulty: "easy" | "medium" | "hard") {
  return buildBattleQuestions(language, difficulty);
}

/**
 * Repairs battles with missing/corrupt questions so the battle UI always has
 * something to render. Coding questions carry no `options` by design, so the
 * options check only applies to quiz questions. Regeneration is deterministic
 * per difficulty, so existing finalized answers keep matching questionIds.
 */
async function ensureQuestions(battle: BattleDoc): Promise<void> {
  const broken =
    battle.questions.length === 0 ||
    battle.questions.some((q) => {
      if (!q.prompt) return true;
      if (q.type === "coding") {
        return (
          !q.statement ||
          !Array.isArray(q.examples) ||
          q.examples.length === 0
        );
      }
      return !Array.isArray(q.options) || q.options.length === 0;
    });
  if (!broken) return;
  const difficulty = (
    battle.difficulty === "medium" || battle.difficulty === "hard" ? battle.difficulty : "easy"
  ) as "easy" | "medium" | "hard";
  battle.questions = questions(battle.language ?? null, difficulty) as unknown as BattleDoc["questions"];
  await battle.save();
}

/** Backfills the room-level question pointer on battles created before it existed. */
async function ensureRoomIndex(battle: BattleDoc): Promise<void> {
  if (typeof battle.currentQuestionIndex === "number") return;
  const lengths = battle.players.map((p) => p.answers.length);
  battle.currentQuestionIndex = Math.min(
    battle.questions.length,
    lengths.length > 0 ? Math.min(...lengths) : 0,
  );
  await battle.save();
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

interface StandingAnswer {
  questionId: string;
  type?: string;
  answer: string;
  isCorrect: boolean;
  pointsEarned?: number;
  timeTaken: number;
  submittedAt: Date;
  code?: string | null;
  language?: string | null;
  testsPassed?: number;
  testsTotal?: number;
  executionTimeMs?: number | null;
  memoryKb?: number | null;
  error?: string | null;
  testResults?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    error?: string | null;
  }>;
}

interface StandingPlayer {
  userId: { equals(id: unknown): boolean; toString(): string };
  score: number;
  answers: StandingAnswer[];
}

export interface PlayerCodingStats {
  mcqCorrect: number;
  codingSolved: number;
  codingTotal: number;
  testsPassed: number;
  testsTotal: number;
  codingPoints: number;
}

function codingStatsFor(
  answers: StandingAnswer[],
  codingTotal: number,
): PlayerCodingStats {
  const coding = answers.filter((a) => a.type === "coding");
  return {
    mcqCorrect: answers.filter((a) => a.type !== "coding" && a.isCorrect).length,
    codingSolved: coding.filter((a) => a.isCorrect).length,
    codingTotal,
    testsPassed: coding.reduce((sum, a) => sum + (a.testsPassed ?? 0), 0),
    testsTotal: coding.reduce((sum, a) => sum + (a.testsTotal ?? 0), 0),
    codingPoints: coding.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0),
  };
}

async function standingsFor(battle: {
  players: StandingPlayer[];
  questions: Array<{ questionId: string; type: string }>;
  winnerId?: { toString(): string } | null;
  hostId: { equals(id: unknown): boolean };
}) {
  const users = await User.find({
    _id: { $in: battle.players.map((player) => player.userId) },
  }).lean();
  const codingTotal = battle.questions.filter((q) => q.type === "coding").length;
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
      ...codingStatsFor(player.answers, codingTotal),
    };
  });
}

function plainAnswer(a: StandingAnswer) {
  return {
    questionId: a.questionId,
    type: a.type ?? "mcq",
    answer: a.answer,
    isCorrect: a.isCorrect,
    pointsEarned: a.pointsEarned ?? 0,
    timeTaken: a.timeTaken,
    submittedAt: a.submittedAt,
    code: a.code ?? null,
    language: a.language ?? null,
    testsPassed: a.testsPassed ?? 0,
    testsTotal: a.testsTotal ?? 0,
    testResults: [...(a.testResults ?? [])],
    executionTimeMs: a.executionTimeMs ?? null,
    memoryKb: a.memoryKb ?? null,
    error: a.error ?? null,
  };
}

async function resultFor(
  battle: BattleDoc & {
    players: StandingPlayer[];
    questions: Array<{
      questionId: string;
      type: string;
      prompt: string;
      language: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      code: string | null;
      tags: string[];
      xpValue: number;
      statement?: string | null;
      inputDescription?: string | null;
      outputDescription?: string | null;
      constraints?: string[];
      examples?: Array<{ input: string; output: string; explanation?: string | null }>;
      hiddenTests?: Array<{ input: string; output: string; explanation?: string | null }>;
    }>;
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
  const myAnswers = (mine?.answers ?? []).map(plainAnswer);
  const codingTotal = battle.questions.filter((q) => q.type === "coding").length;
  const mcqTotal = battle.questions.length - codingTotal;
  const stats = codingStatsFor(mine?.answers ?? [], codingTotal);
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
    myAnswers,
    myStats: {
      mcqCorrect: stats.mcqCorrect,
      mcqTotal,
      codingSolved: stats.codingSolved,
      codingTotal,
      testsPassed: stats.testsPassed,
      testsTotal: stats.testsTotal,
      codingPoints: stats.codingPoints,
      codingSuccessRate: codingTotal > 0 ? Math.round((stats.codingSolved / codingTotal) * 100) : 0,
    },
    // Finished battles only: safe to reveal answers + hidden tests.
    // Carries ONLY the requesting player's answer records — never others'.
    questions: battle.questions.map((entry) => {
      const q =
        typeof (entry as unknown as { toObject?: () => Record<string, unknown> }).toObject === "function"
          ? ((entry as unknown as { toObject: () => typeof entry }).toObject() as typeof entry)
          : entry;
      return {
        questionId: q.questionId,
        type: q.type,
        prompt: q.prompt,
        language: q.language,
        xpValue: q.xpValue,
        options: [...(q.options ?? [])],
        correctAnswer: q.correctAnswer ?? "",
        explanation: q.explanation ?? "",
        statement: q.statement ?? null,
        inputDescription: q.inputDescription ?? null,
        outputDescription: q.outputDescription ?? null,
        constraints: [...(q.constraints ?? [])],
        examples: [...(q.examples ?? [])],
        hiddenTests: [...(q.hiddenTests ?? [])],
        myAnswer: myAnswers.find((a) => a.questionId === q.questionId) ?? null,
      };
    }),
    standings,
    endedAt: battle.endedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function publicQuestion(entry: {
  questionId: string;
  prompt: string;
  type: string;
  language: string;
  options?: string[];
  code?: string | null;
  tags?: string[];
  xpValue: number;
  statement?: string | null;
  inputDescription?: string | null;
  outputDescription?: string | null;
  constraints?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string | null }>;
}) {
  // Mongoose subdocuments don't survive rest-spread (only $__, _doc, … are
  // copied), so pick fields explicitly. correctAnswer/explanation/hiddenTests
  // are deliberately omitted — the server is authoritative for grading.
  const q =
    typeof (entry as unknown as { toObject?: () => Record<string, unknown> }).toObject === "function"
      ? ((entry as unknown as { toObject: () => typeof entry }).toObject() as typeof entry)
      : entry;
  return {
    questionId: q.questionId,
    prompt: q.prompt,
    type: q.type,
    language: q.language,
    options: [...(q.options ?? [])],
    code: q.code ?? null,
    tags: [...(q.tags ?? [])],
    xpValue: q.xpValue,
    statement: q.statement ?? null,
    inputDescription: q.inputDescription ?? null,
    outputDescription: q.outputDescription ?? null,
    constraints: [...(q.constraints ?? [])],
    examples: [...(q.examples ?? [])],
  };
}

async function stateFor(
  battle: BattleDoc & {
    players: Array<
      StandingPlayer & {
        pendingSelection?: { questionId: string; answer: string } | null;
        pendingCode?: {
          questionId: string;
          language: string;
          code: string;
          lastRun?: {
            testsPassed: number;
            testsTotal: number;
            allPassed: boolean;
            executionTimeMs: number;
            memoryKb: number | null;
            error: string | null;
          } | null;
        } | null;
      }
    >;
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
    currentQuestionIndex?: number;
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
  const roomIndex = battle.currentQuestionIndex ?? 0;
  const currentId = battle.questions[roomIndex]?.questionId ?? null;
  const mySelection =
    mine?.pendingSelection?.questionId === currentId ? (mine.pendingSelection.answer ?? null) : null;
  const myPendingCode =
    mine?.pendingCode?.questionId === currentId && mine.pendingCode ? mine.pendingCode : null;
  const lastFinal = mine?.answers.at(-1) ?? null;
  const lastFinalQuestion = lastFinal
    ? battle.questions.find((q) => q.questionId === lastFinal.questionId)
    : null;
  return {
    battleId: battle.id,
    roomCode: battle.roomCode,
    status: battle.status,
    mode: battle.mode,
    maxPlayers: battle.maxPlayers ?? battle.players.length,
    difficulty: battle.difficulty,
    language: battle.language,
    timeLimit: battle.timeLimit,
    currentQuestionIndex: roomIndex,
    totalQuestions: battle.questions.length,
    players: battle.players.map((player) => {
      const user = users.find(
        (candidate) => String(candidate._id) === player.userId.toString(),
      );
      // Readiness flag only — never leak WHAT another player picked/typed.
      const hasAnswered =
        (player.pendingSelection?.questionId === currentId && currentId != null) ||
        (player.pendingCode?.questionId === currentId && currentId != null);
      return {
        userId: player.userId.toString(),
        username: user?.userName ?? "Developer",
        avatarUrl: user?.avatarUrl ?? null,
        score: player.score,
        answersCount: player.answers.length,
        hasAnswered,
        isHost: battle.hostId.equals(player.userId),
      };
    }),
    questions:
      battle.status === "active"
        ? battle.questions.map(publicQuestion)
        : [],
    myAnswer: lastFinal?.answer ?? mySelection,
    mySelection,
    myCode: myPendingCode
      ? { language: myPendingCode.language, code: myPendingCode.code }
      : null,
    myLastRun: myPendingCode?.lastRun
      ? {
          testsPassed: myPendingCode.lastRun.testsPassed,
          testsTotal: myPendingCode.lastRun.testsTotal,
          allPassed: myPendingCode.lastRun.allPassed,
          executionTimeMs: myPendingCode.lastRun.executionTimeMs,
          memoryKb: myPendingCode.lastRun.memoryKb ?? null,
          error: myPendingCode.lastRun.error,
        }
      : null,
    lastVerdict: lastFinal
      ? {
          questionId: lastFinal.questionId,
          type: lastFinal.type ?? "mcq",
          correct: lastFinal.isCorrect,
          pointsEarned: lastFinal.pointsEarned ?? 0,
          correctAnswer:
            (lastFinal.type ?? "mcq") === "coding" ? null : (lastFinalQuestion?.correctAnswer ?? null),
          testsPassed: lastFinal.testsPassed ?? 0,
          testsTotal: lastFinal.testsTotal ?? 0,
          error: lastFinal.error ?? null,
        }
      : null,
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
      currentQuestionIndex: 0,
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
        pendingSelection: null,
        pendingCode: null,
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
    await ensureQuestions(battle);
    await ensureRoomIndex(battle);
    return res.success(200, "Battle room", await stateFor(battle, req.user!.id));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/arena/:roomCode/result — shareable battle result.
 * Participants always have access; any other signed-in user can view a
 * finished battle (usernames, scores and standings only — correct answers,
 * explanations, hidden tests and player code are never exposed here).
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
    await ensureQuestions(battle);
    await ensureRoomIndex(battle);
    if (battle.status === "waiting") {
      battle.status = "active";
      battle.currentQuestionIndex = 0;
      battle.startedAt = new Date();
      await battle.save();
    }
    emitBattleUpdated(battle.roomCode);
    return res.success(200, "Battle started", await stateFor(battle, req.user!.id));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/arena/:roomCode/answer — save/change the caller's MCQ selection
 * for the CURRENT room question. This does NOT score or advance: everyone
 * stays on the same question until the host locks it. Changeable until lock.
 */
export async function submitAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const input = answerSchema.parse(req.body);
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || battle.status !== "active") throw ApiError.badRequest("Battle is not active");
    const player = battle.players.find((candidate) => candidate.userId.equals(req.user!.id));
    if (!player) throw ApiError.forbidden();
    const roomIndex = battle.currentQuestionIndex ?? 0;
    const current = battle.questions[roomIndex];
    if (!current) throw ApiError.badRequest("No current question");
    if (current.type === "coding")
      throw ApiError.badRequest("This is a coding question — submit code instead");
    if (input.questionId !== current.questionId)
      throw ApiError.badRequest("That question is not the current one");
    if (!current.options.includes(input.answer.trim()))
      throw ApiError.badRequest("Unknown option");
    player.pendingSelection = {
      questionId: current.questionId,
      answer: input.answer.trim(),
      timeTaken: input.timeTaken,
      updatedAt: new Date(),
    };
    await battle.save();
    emitBattleUpdated(battle.roomCode);
    return res.success(200, "Selection saved", {
      selected: true,
      questionId: current.questionId,
      locked: false,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/arena/:roomCode/lock — host-only. Finalizes the current room
 * question for EVERYONE simultaneously: grades each player's pending
 * selection/code (missing = skipped), updates scores, advances the room
 * pointer (finishing the battle on the last question). Atomic per index so a
 * double-click can't finalize twice.
 */
export async function lockQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || battle.status !== "active") throw ApiError.badRequest("Battle is not active");
    if (!battle.hostId.equals(req.user!.id))
      throw ApiError.forbidden("Only the host can lock the question");
    const roomIndex = battle.currentQuestionIndex ?? 0;
    const raw = battle.questions[roomIndex];
    if (!raw) throw ApiError.badRequest("No current question");
    const q =
      typeof (raw as unknown as { toObject?: () => Record<string, unknown> }).toObject === "function"
        ? ((raw as unknown as { toObject: () => typeof raw }).toObject() as typeof raw)
        : raw;
    const isCoding = q.type === "coding";

    // Evaluate coding submissions BEFORE mutating: an execution outage aborts the
    // lock with a retryable error instead of recording fake results.
    const evals = new Map<string, Awaited<ReturnType<typeof runTests>>>();
    if (isCoding) {
      const tests = [...(q.examples ?? []), ...(q.hiddenTests ?? [])];
      if (tests.length === 0) throw ApiError.internal("This coding question has no test cases");
      const toEval = battle.players.filter(
        (p) =>
          p.pendingCode?.questionId === q.questionId &&
          !p.answers.some((a) => a.questionId === q.questionId),
      );
      try {
        const reports = await Promise.all(
          toEval.map((p) =>
            runTests(
              normalizeLanguage(p.pendingCode!.language) ?? "python",
              p.pendingCode!.code,
              tests.map((t) => ({ input: t.input, output: t.output })),
            ),
          ),
        );
        toEval.forEach((p, i) => evals.set(p.userId.toString(), reports[i]));
      } catch (err) {
        if (err instanceof ExecutionError) throw new ApiError(err.status, err.message);
        throw ApiError.internal("Code evaluation failed. Please try locking again.");
      }
    }

    const now = new Date();
    const totalTests = isCoding ? [...(q.examples ?? []), ...(q.hiddenTests ?? [])].length : 0;
    const newPlayers = battle.players.map((p) => {
      const already = p.answers.some((a) => a.questionId === q.questionId);
      const keptAnswers = p.answers.map((a) => ({
        questionId: a.questionId,
        type: a.type ?? "mcq",
        answer: a.answer,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned ?? 0,
        timeTaken: a.timeTaken,
        submittedAt: a.submittedAt,
        code: a.code ?? null,
        language: a.language ?? null,
        testsPassed: a.testsPassed ?? 0,
        testsTotal: a.testsTotal ?? 0,
        testResults: [...(a.testResults ?? [])],
        executionTimeMs: a.executionTimeMs ?? null,
        memoryKb: a.memoryKb ?? null,
        error: a.error ?? null,
      }));
      if (already) {
        return {
          userId: p.userId,
          score: p.score,
          answers: keptAnswers,
          pendingSelection: p.pendingSelection?.questionId === q.questionId ? null : (p.pendingSelection ?? null),
          pendingCode: p.pendingCode?.questionId === q.questionId ? null : (p.pendingCode ?? null),
        };
      }
      let record;
      if (isCoding) {
        const pending = p.pendingCode?.questionId === q.questionId ? p.pendingCode : null;
        const report = evals.get(p.userId.toString()) ?? null;
        // Strict: solved ⟺ every test passed ⟺ full points. Red means zero.
        const grade = gradeCodingReport(report, q.xpValue);
        record = {
          questionId: q.questionId,
          type: "coding",
          answer: pending?.language ?? "",
          isCorrect: grade.isCorrect,
          pointsEarned: grade.pointsEarned,
          timeTaken: 0,
          submittedAt: now,
          code: pending?.code ?? null,
          language: pending?.language ?? null,
          testsPassed: report?.testsPassed ?? 0,
          testsTotal: totalTests,
          testResults: report?.results ?? [],
          executionTimeMs: report?.executionTimeMs ?? null,
          memoryKb: report?.memoryKb ?? null,
          error: pending ? (report?.error ?? null) : "No code submitted",
        };
      } else {
        const pending = p.pendingSelection?.questionId === q.questionId ? p.pendingSelection : null;
        const correct = pending != null && pending.answer === q.correctAnswer;
        record = {
          questionId: q.questionId,
          type: "mcq",
          answer: pending?.answer ?? "",
          isCorrect: correct,
          pointsEarned: correct ? q.xpValue : 0,
          timeTaken: pending?.timeTaken ?? 0,
          submittedAt: now,
          code: null,
          language: null,
          testsPassed: 0,
          testsTotal: 0,
          testResults: [],
          executionTimeMs: null,
          memoryKb: null,
          error: null,
        };
      }
      return {
        userId: p.userId,
        score: p.score + record.pointsEarned,
        answers: [...keptAnswers, record],
        pendingSelection: null,
        pendingCode: null,
      };
    });

    const nextIndex = roomIndex + 1;
    const finished = nextIndex >= battle.questions.length;
    const winnerId = finished ? winnerOf({ players: newPlayers }) : battle.winnerId;
    const committed = await Battle.findOneAndUpdate(
      { _id: battle._id, status: "active", currentQuestionIndex: roomIndex },
      {
        $set: {
          players: newPlayers,
          currentQuestionIndex: nextIndex,
          ...(finished
            ? { status: "finished", endedAt: now, winnerId }
            : {}),
        },
      },
      { new: true },
    );
    if (!committed) throw ApiError.badRequest("Question was already locked");
    if (finished) await applyBattleCompletion(committed);
    emitBattleUpdated(committed.roomCode);
    return res.success(200, finished ? "Battle finished" : "Question locked", await stateFor(committed, req.user!.id));
  } catch (error) {
    next(error);
  }
}

const runAttempts = new Map<string, number[]>();
const RUN_WINDOW_MS = 10 * 60 * 1000;
const RUN_MAX = 30;

function checkRunLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (runAttempts.get(userId) ?? []).filter((t) => now - t < RUN_WINDOW_MS);
  if (recent.length >= RUN_MAX) return false;
  recent.push(now);
  runAttempts.set(userId, recent);
  return true;
}

/**
 * POST /api/v1/arena/:roomCode/code — save/change the caller's pending code
 * for the current coding question (no execution). Changeable until lock.
 */
export async function saveCode(req: Request, res: Response, next: NextFunction) {
  try {
    const input = codeSchema.parse(req.body);
    const language = normalizeLanguage(input.language);
    if (!language || !(CODING_LANGUAGES as readonly string[]).includes(language)) {
      throw ApiError.badRequest("Unsupported programming language");
    }
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || battle.status !== "active") throw ApiError.badRequest("Battle is not active");
    const player = battle.players.find((candidate) => candidate.userId.equals(req.user!.id));
    if (!player) throw ApiError.forbidden();
    const roomIndex = battle.currentQuestionIndex ?? 0;
    const current = battle.questions[roomIndex];
    if (!current || current.type !== "coding") throw ApiError.badRequest("Current question is not a coding challenge");
    if (input.questionId !== current.questionId) throw ApiError.badRequest("That question is not the current one");
    const prev = player.pendingCode?.questionId === current.questionId ? player.pendingCode : null;
    const unchanged = prev != null && prev.code === input.code && prev.language === language;
    player.pendingCode = {
      questionId: current.questionId,
      language,
      code: input.code,
      updatedAt: new Date(),
      lastRun: unchanged ? (prev?.lastRun ?? null) : null,
    };
    await battle.save();
    emitBattleUpdated(battle.roomCode);
    return res.success(200, "Code saved", { saved: true, questionId: current.questionId });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/arena/:roomCode/run — save the caller's code and execute it
 * against the VISIBLE examples. Real execution via Piston; hidden tests stay
 * hidden until the host locks. Rate-limited per user.
 */
export async function runCode(req: Request, res: Response, next: NextFunction) {
  try {
    const input = codeSchema.parse(req.body);
    const language = normalizeLanguage(input.language);
    if (!language || !(CODING_LANGUAGES as readonly string[]).includes(language)) {
      throw ApiError.badRequest("Unsupported programming language");
    }
    if (!checkRunLimit(req.user!.id)) {
      throw ApiError.badRequest("Run limit reached — wait a few minutes and try again");
    }
    const battle = await Battle.findOne({
      roomCode: String(req.params.roomCode).toUpperCase(),
    });
    if (!battle || battle.status !== "active") throw ApiError.badRequest("Battle is not active");
    const player = battle.players.find((candidate) => candidate.userId.equals(req.user!.id));
    if (!player) throw ApiError.forbidden();
    const roomIndex = battle.currentQuestionIndex ?? 0;
    const current = battle.questions[roomIndex];
    if (!current || current.type !== "coding") throw ApiError.badRequest("Current question is not a coding challenge");
    if (input.questionId !== current.questionId) throw ApiError.badRequest("That question is not the current one");
    const raw = current as unknown as {
      examples?: Array<{ input: string; output: string; explanation?: string | null }>;
    };
    const examples = [...(raw.examples ?? [])];
    if (examples.length === 0) throw ApiError.internal("This coding question has no visible test cases");
    let report;
    try {
      report = await runTests(
        language,
        input.code,
        examples.map((t) => ({ input: t.input, output: t.output })),
      );
    } catch (err) {
      if (err instanceof ExecutionError) throw new ApiError(err.status, err.message);
      throw ApiError.internal("Code execution failed. Please try again.");
    }
    player.pendingCode = {
      questionId: current.questionId,
      language,
      code: input.code,
      updatedAt: new Date(),
      lastRun: {
        testsPassed: report.testsPassed,
        testsTotal: report.testsTotal,
        allPassed: report.allPassed,
        executionTimeMs: report.executionTimeMs,
        memoryKb: report.memoryKb,
        error: report.error,
        ranAt: new Date(),
      },
    };
    await battle.save();
    emitBattleUpdated(battle.roomCode);
    return res.success(200, "Run complete", {
      testsPassed: report.testsPassed,
      testsTotal: report.testsTotal,
      allPassed: report.allPassed,
      results: report.results,
      executionTimeMs: report.executionTimeMs,
      memoryKb: report.memoryKb,
      error: report.error,
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
    if (battle.status === "finished") {
      // Already decided — report the outcome without mutating or double-counting stats.
      const drew = battle.winnerId == null;
      const won = !drew && String(battle.winnerId) === String(req.user!.id);
      return res.success(200, "Battle already finished", {
        outcome: won ? "win" : drew ? "draw" : "loss",
      });
    }
    const others = battle.players.filter((player) => !player.userId.equals(req.user!.id));
    battle.status = "finished";
    battle.endedAt = new Date();
    battle.winnerId = others.length > 0 ? winnerOf({ players: others }) : null;
    await battle.save();
    await applyBattleCompletion(battle);
    emitBattleUpdated(battle.roomCode);
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
