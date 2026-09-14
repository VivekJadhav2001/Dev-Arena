import express from "express";
import { getDnaHistory, getMyDNA, regenerateDNA } from "../controllers/dna.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.get("/me", requireAuth, getMyDNA);
router.get("/history", requireAuth, getDnaHistory);
router.post("/regenerate", requireAuth, regenerateDNA);
export default router;
