import express from "express";
import { getLeaderboard, getMyRank } from "../controllers/leaderboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.get("/me", requireAuth, getMyRank);
router.get("/", getLeaderboard);
export default router;
