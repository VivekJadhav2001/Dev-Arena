import mongoose from "mongoose";
import {
  BATTLE_MODES,
  BATTLE_STATUSES,
  DIFFICULTIES,
  QUESTION_TYPES,
  type BattleMode,
  type BattleStatus,
  type Difficulty,
} from "../utils/constants.js";

export interface IBattleTestCase {
  input: string;
  output: string;
  explanation?: string | null;
}

export interface IBattleAnswer {
  questionId: string;
  /** "mcq" for quiz picks (incl. code_output), "coding" for machine-coding. */
  type: string;
  /** Selected option for MCQ; empty when skipped. */
  answer: string;
  isCorrect: boolean;
  /** Points added to the player's battle score for this question. */
  pointsEarned: number;
  timeTaken: number;
  submittedAt: Date;
  // Machine-coding details (only when type === "coding")
  code?: string | null;
  language?: string | null;
  testsPassed?: number;
  testsTotal?: number;
  /** Per-test outcome in evaluation order ([...examples, ...hiddenTests]). */
  testResults?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    error?: string | null;
  }>;
  executionTimeMs?: number | null;
  memoryKb?: number | null;
  error?: string | null;
}

/** Pending (pre-lock) MCQ selection. Changeable until the host locks. */
export interface IBattlePendingSelection {
  questionId: string;
  answer: string;
  timeTaken: number;
  updatedAt: Date;
}

/** Pending (pre-lock) machine-coding submission. */
export interface IBattlePendingCode {
  questionId: string;
  language: string;
  code: string;
  updatedAt: Date;
  lastRun?: {
    testsPassed: number;
    testsTotal: number;
    allPassed: boolean;
    executionTimeMs: number;
    memoryKb: number | null;
    error: string | null;
    ranAt: Date;
  } | null;
}

export interface IBattlePlayer {
  userId: mongoose.Types.ObjectId;
  score: number;
  answers: IBattleAnswer[];
  pendingSelection: IBattlePendingSelection | null;
  pendingCode: IBattlePendingCode | null;
}

export interface IBattleCodingExample {
  input: string;
  output: string;
  explanation?: string | null;
}

export interface IBattleQuestion {
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
  // Machine-coding fields (only when type === "coding")
  statement?: string | null;
  inputDescription?: string | null;
  outputDescription?: string | null;
  constraints?: string[];
  examples?: IBattleCodingExample[];
  /** NEVER sent to clients pre-finish; used for final validation on lock. */
  hiddenTests?: IBattleTestCase[];
  starterCode?: string | null;
}

export interface IBattle {
  roomCode: string;
  hostId: mongoose.Types.ObjectId;
  mode: BattleMode;
  maxPlayers: number;
  players: IBattlePlayer[];
  status: BattleStatus;
  difficulty: Difficulty;
  language: string | null;
  timeLimit: number;
  /** Room-level synchronized question pointer (host controls progression). */
  currentQuestionIndex: number;
  questions: IBattleQuestion[];
  startedAt: Date | null;
  endedAt: Date | null;
  winnerId: mongoose.Types.ObjectId | null;
}

const answerSchema = new mongoose.Schema(
  {
    questionId: String,
    type: { type: String, default: "mcq" },
    answer: String,
    isCorrect: Boolean,
    pointsEarned: { type: Number, default: 0 },
    timeTaken: Number,
    submittedAt: { type: Date, default: Date.now },
    code: { type: String, default: null },
    language: { type: String, default: null },
    testsPassed: { type: Number, default: 0 },
    testsTotal: { type: Number, default: 0 },
    testResults: {
      type: [
        {
          input: String,
          expected: String,
          actual: String,
          passed: Boolean,
          error: { type: String, default: null },
        },
      ],
      default: [],
    },
    executionTimeMs: { type: Number, default: null },
    memoryKb: { type: Number, default: null },
    error: { type: String, default: null },
  },
  { _id: false },
);

const pendingSelectionSchema = new mongoose.Schema(
  {
    questionId: String,
    answer: String,
    timeTaken: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const lastRunSchema = new mongoose.Schema(
  {
    testsPassed: { type: Number, default: 0 },
    testsTotal: { type: Number, default: 0 },
    allPassed: { type: Boolean, default: false },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: null },
    error: { type: String, default: null },
    ranAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const pendingCodeSchema = new mongoose.Schema(
  {
    questionId: String,
    language: String,
    code: String,
    updatedAt: { type: Date, default: Date.now },
    lastRun: { type: lastRunSchema, default: null },
  },
  { _id: false },
);

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: { type: Number, default: 0 },
    answers: { type: [answerSchema], default: [] },
    pendingSelection: { type: pendingSelectionSchema, default: null },
    pendingCode: { type: pendingCodeSchema, default: null },
  },
  { _id: false },
);

const codingExampleSchema = new mongoose.Schema(
  {
    input: String,
    output: String,
    explanation: { type: String, default: null },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    questionId: String,
    prompt: String,
    type: { type: String, enum: QUESTION_TYPES },
    language: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    code: String,
    tags: [String],
    xpValue: Number,
    statement: { type: String, default: null },
    inputDescription: { type: String, default: null },
    outputDescription: { type: String, default: null },
    constraints: { type: [String], default: [] },
    examples: { type: [codingExampleSchema], default: [] },
    hiddenTests: { type: [codingExampleSchema], default: [] },
    starterCode: { type: String, default: null },
  },
  { _id: false },
);

const battleSchema = new mongoose.Schema<IBattle>(
  {
    roomCode: { type: String, unique: true, index: true },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mode: { type: String, enum: BATTLE_MODES, default: "1v1" },
    maxPlayers: { type: Number, default: 2, min: 2, max: 8 },
    players: { type: [playerSchema], default: [] },
    status: { type: String, enum: BATTLE_STATUSES, default: "waiting" },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    language: { type: String, default: null },
    timeLimit: { type: Number, required: true },
    currentQuestionIndex: { type: Number, default: 0 },
    questions: { type: [questionSchema], default: [] },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);
export const Battle = mongoose.model<IBattle>("Battle", battleSchema);
