import express from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  acceptChallenge,
  cancelChallenge,
  createChallenge,
  declineChallenge,
  getChallenge,
  listChallenges,
} from "../controllers/challenge.controller.js";

const router = express.Router();
router.use(requireAuth);

const challengeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Challenge limit reached. Try again later." },
});

router.post("/", challengeLimiter, createChallenge);
router.get("/", listChallenges);
router.get("/:challengeId", getChallenge);
router.post("/:challengeId/accept", acceptChallenge);
router.post("/:challengeId/decline", declineChallenge);
router.post("/:challengeId/cancel", cancelChallenge);

export default router;
