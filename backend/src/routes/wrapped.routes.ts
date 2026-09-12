import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMyWrapped, getPublicWrapped } from "../controllers/wrapped.controller.js";

const router = express.Router();
router.get("/me", requireAuth, getMyWrapped);
router.get("/:username", getPublicWrapped);
export default router;
