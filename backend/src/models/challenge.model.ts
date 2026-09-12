import mongoose from "mongoose";
import type { Difficulty } from "../utils/constants.js";

export type ChallengeStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled";

export interface IChallenge {
  challenger: mongoose.Types.ObjectId;
  challenged: mongoose.Types.ObjectId;
  status: ChallengeStatus;
  battleId: mongoose.Types.ObjectId | null;
  settings: {
    difficulty: Difficulty;
    language: string | null;
    timeLimit: number;
  };
  message: string | null;
  expiresAt: Date;
  respondedAt: Date | null;
  createdAt: Date;
}

const challengeSchema = new mongoose.Schema<IChallenge>(
  {
    challenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    challenged: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    battleId: { type: mongoose.Schema.Types.ObjectId, ref: "Battle", default: null },
    settings: {
      difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
      language: { type: String, default: null },
      timeLimit: { type: Number, default: 60 },
    },
    message: { type: String, maxlength: 280, trim: true, default: null },
    expiresAt: { type: Date, index: true, required: true },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

challengeSchema.index({ challenger: 1, challenged: 1, status: 1 });
challengeSchema.index({ challenged: 1, status: 1, createdAt: -1 });

export const Challenge = mongoose.model<IChallenge>("Challenge", challengeSchema);
