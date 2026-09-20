import type { NextFunction, Request, Response } from "express";
import { toPublicUser } from "../utils/user-public.js";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";

const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //after successfull login

    if (!req.user) return res.error(401, "Authentication required");
    const user = await User.findById(req.user.id);
    if (!user) return res.error(401, "Authentication required");
    return res.success(200, "Profile Details", toPublicUser(user));
  } catch (error) {
    next(error);
  }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.logout((error: Error | null) => {
      if (error) {
        return next(error);
      }

      // Passport 0.7 saves and regenerates the session during logout.  Wait
      // for that asynchronous work to finish before destroying it.
      req.session.destroy((sessionError: Error | null) => {
        if (sessionError) {
          return next(sessionError);
        }

        // clearCookie must mirror the session cookie attributes, otherwise
        // the browser keeps a cross-site `SameSite=None; Secure` cookie.
        const isProduction = env.NODE_ENV === "production";
        res.clearCookie("connect.sid", {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
        });
        return res.success(200, "Logged out successfully");
      });
    });
  } catch (error) {
    next(error);
  }
};

export { getCurrentUser, logout };
