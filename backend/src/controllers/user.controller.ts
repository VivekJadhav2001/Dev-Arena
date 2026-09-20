import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { Theme } from "../models/theme.model.js";
import { ApiError } from "../utils/apiError.js";
import { toPublicUser } from "../utils/user-public.js";

const settingsSchema = z.object({
  publicProfile: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  notifications: z.boolean().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
  themeId: z.string().trim().min(1).max(40).optional(),
  allowChallenges: z.boolean().optional(),
});
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.unauthorized();
    user.lastActiveAt = new Date();
    await user.save();
    return res.success(200, "Profile", toPublicUser(user));
  } catch (error) {
    next(error);
  }
}
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = settingsSchema.parse(req.body);
    if (
      input.themeId != null &&
      !(await Theme.exists({ themeId: input.themeId }))
    )
      throw ApiError.badRequest("Unknown theme");
    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.unauthorized();
    Object.assign(user.settings, input);
    user.markModified("settings");
    await user.save();
    return res.success(200, "Settings updated", user.settings);
  } catch (error) {
    next(error);
  }
}
export async function getPublicProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const username = String(req.params.username);
    const user = await User.findOne({
      userName: new RegExp(
        `^${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    });
    if (!user) throw ApiError.notFound("Developer not found");
    // Private profiles are visible only to the account owner. The session is
    // deserialized even without requireAuth, so the owner's cookie still works.
    const isOwner = req.user?.id != null && String(user._id) === String(req.user.id);
    if (!isOwner && user.settings?.publicProfile === false)
      throw ApiError.notFound("Developer not found");
    const profile = toPublicUser(user);
    return res.success(200, "Public developer profile", {
      ...profile,
      email: null,
      settings: undefined,
      presence: undefined,
    });
  } catch (error) {
    next(error);
  }
}
