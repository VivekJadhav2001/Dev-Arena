import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getDeveloperPresence } from "../controllers/developers.controller.js";

const router = express.Router();
router.use(requireAuth);

router.get("/:username/presence", getDeveloperPresence);

export default router;
