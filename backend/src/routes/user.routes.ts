import express from "express";
import { getMyGitHubStats, syncGitHub } from "../controllers/github.controller.js";
import { connectLeetCode, disconnectLeetCode, syncLeetCode } from "../controllers/leetcode.controller.js";
import { getMe, getPublicProfile, updateMe } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.get("/me/github-stats", requireAuth, getMyGitHubStats);
router.post("/me/sync-github", requireAuth, syncGitHub);
router.put("/me/leetcode", requireAuth, connectLeetCode);
router.post("/me/leetcode/sync", requireAuth, syncLeetCode);
router.delete("/me/leetcode", requireAuth, disconnectLeetCode);
router.get("/:username", getPublicProfile);
export default router;
