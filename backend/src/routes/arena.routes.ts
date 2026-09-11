import express from "express";
import { createBattle, forfeitBattle, getRoom, joinBattle, startBattle, submitAnswer } from "../controllers/arena.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = express.Router(); router.use(requireAuth); router.post("/create", createBattle); router.post("/join", joinBattle); router.get("/:roomCode", getRoom); router.post("/:roomCode/start", startBattle); router.post("/:roomCode/answer", submitAnswer); router.post("/:roomCode/forfeit", forfeitBattle); export default router;
