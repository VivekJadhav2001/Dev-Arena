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

export interface IBattlePlayer {
  userId: mongoose.Types.ObjectId;
  score: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeTaken: number;
    submittedAt: Date;
  }>;
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
  startedAt: Date | null;
  endedAt: Date | null;
  winnerId: mongoose.Types.ObjectId | null;
}
const answerSchema = new mongoose.Schema(
  {
    questionId: String,
    answer: String,
    isCorrect: Boolean,
    timeTaken: Number,
    submittedAt: { type: Date, default: Date.now },
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
