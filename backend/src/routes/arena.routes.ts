import express from "express";
import {
  acceptJoinRequest,
  cancelBattle,
  cheerBattle,
  createBattle,
  declineJoinRequest,
  forfeitBattle,
  getDetails,
  getHistory,
  getLiveBattles,
  getMyActiveBattle,
  getResult,
  getRoom,
  getSpectate,
  joinBattle,
  lockQuestion,
  removePlayer,
  requestJoin,
  runCode,
  saveCode,
  startBattle,
  submitAnswer,
} from "../controllers/arena.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
const router = express.Router();
// Public share target: finished-battle details stay readable without a
// session (standings only — questions are never exposed by getDetails).
// Must be registered before requireAuth; waiting/active battles still 404
// for non-participants inside the controller.
router.get("/:roomCode/details", getDetails);
router.use(requireAuth);
router.post("/create", createBattle);
router.post("/join", joinBattle);
router.get("/history", getHistory);
router.get("/live", getLiveBattles);
router.get("/my-active", getMyActiveBattle);
router.get("/:roomCode/spectate", getSpectate);
router.post("/:roomCode/cheer", cheerBattle);
router.post("/:roomCode/join-request", requestJoin);
router.post("/:roomCode/join-request/:requestId/accept", acceptJoinRequest);
router.post("/:roomCode/join-request/:requestId/decline", declineJoinRequest);
router.post("/:roomCode/remove", removePlayer);
router.post("/:roomCode/cancel", cancelBattle);
router.get("/:roomCode/result", getResult);
router.get("/:roomCode", getRoom);
router.post("/:roomCode/start", startBattle);
router.post("/:roomCode/answer", submitAnswer);
router.post("/:roomCode/lock", lockQuestion);
router.post("/:roomCode/code", saveCode);
router.post("/:roomCode/run", runCode);
router.post("/:roomCode/forfeit", forfeitBattle);
export default router;
