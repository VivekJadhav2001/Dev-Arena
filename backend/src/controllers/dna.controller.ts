import type { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { calculateDNA } from "../services/dna.service.js";
async function dnaForUser(req: Request) { const user = await User.findById(req.user?.id); if (!user) throw ApiError.unauthorized(); const dna = calculateDNA(user.githubStats); user.persona = dna.persona; user.personaReason = dna.personaReason; await user.save(); return dna; }
export async function getMyDNA(req: Request, res: Response, next: NextFunction) { try { return res.success(200, "Developer DNA", await dnaForUser(req)); } catch (error) { next(error); } }
export async function regenerateDNA(req: Request, res: Response, next: NextFunction) { try { return res.success(200, "Developer DNA regenerated", await dnaForUser(req)); } catch (error) { next(error); } }
