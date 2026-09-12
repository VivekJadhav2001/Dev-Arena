import express from "express";
import { createBattle, forfeitBattle, getDetails, getHistory, getResult, getRoom, joinBattle, startBattle, submitAnswer } from "../controllers/arena.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = express.Router(); router.use(requireAuth); router.post("/create", createBattle); router.post("/join", joinBattle); router.get("/history", getHistory); router.get("/:roomCode/result", getResult); router.get("/:roomCode/details", getDetails); router.get("/:roomCode", getRoom); router.post("/:roomCode/start", startBattle); router.post("/:roomCode/answer", submitAnswer); router.post("/:roomCode/forfeit", forfeitBattle); export default router;
