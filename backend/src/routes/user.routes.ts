import express from "express";
import { getMyGitHubStats, syncGitHub } from "../controllers/github.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/me/github-stats", requireAuth, getMyGitHubStats);
router.post("/me/sync-github", requireAuth, syncGitHub);
export default router;
