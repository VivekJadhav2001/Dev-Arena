import type { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";

/** GET /api/v1/developers/:username/presence — online state only. */
export async function getDeveloperPresence(req: Request, res: Response, next: NextFunction) {
  try {
    const username = String(req.params.username);
    const user = await User.findOne({
      userName: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).lean();
    if (!user) {
      return res.success(200, "Developer presence", { isOnline: false, lastSeenAt: null });
    }
    return res.success(200, "Developer presence", {
      isOnline: user.presence?.isOnline ?? false,
      lastSeenAt: user.presence?.lastSeenAt ?? null,
    });
  } catch (error) {
    next(error);
  }
}
