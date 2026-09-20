import type { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

/** GET /api/v1/developers/:username/presence — online state only. Private developers are hidden from everyone but the owner. */
export async function getDeveloperPresence(req: Request, res: Response, next: NextFunction) {
  try {
    const username = String(req.params.username);
    const user = await User.findOne({
      userName: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).lean();
    if (!user) {
      return res.success(200, "Developer presence", { isOnline: false, lastSeenAt: null });
    }
    const isOwner = req.user?.id != null && String(user._id) === String(req.user.id);
    if (!isOwner && user.settings?.publicProfile === false) {
      throw ApiError.notFound("Developer not found");
    }
    return res.success(200, "Developer presence", {
      isOnline: user.presence?.isOnline ?? false,
      lastSeenAt: user.presence?.lastSeenAt ?? null,
    });
  } catch (error) {
    next(error);
  }
}
