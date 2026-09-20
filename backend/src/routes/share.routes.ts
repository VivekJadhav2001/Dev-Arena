import express from "express";
import { getBattlePreview, getProfilePreview, getWrappedPreview } from "../controllers/share.controller.js";

const router = express.Router();

// Crawler-first link previews. No auth: scrapers never carry a session.
// Humans are redirected to the real frontend page; only finished battles
// and public profiles are ever exposed here.
router.get("/u/:username", getProfilePreview);
router.get("/wrapped/:username", getWrappedPreview);
router.get("/battle/:roomCode", getBattlePreview);

export default router;
