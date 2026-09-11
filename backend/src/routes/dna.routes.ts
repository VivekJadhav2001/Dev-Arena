import express from "express";
import { getMyDNA, regenerateDNA } from "../controllers/dna.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = express.Router(); router.get("/me", requireAuth, getMyDNA); router.post("/regenerate", requireAuth, regenerateDNA); export default router;
