import type { NextFunction, Request, Response } from "express";
import { Theme } from "../models/theme.model.js";

/**
 * GET /api/v1/themes — public gallery of all available UI themes,
 * sortOrder first. The frontend applies the user's saved themeId and
 * falls back to the default when it is missing.
 */
export async function getThemes(_req: Request, res: Response, next: NextFunction) {
  try {
    const themes = await Theme.find({}).sort({ sortOrder: 1 }).lean();
    return res.success(200, "Themes", {
      themes: themes.map((theme) => ({
        themeId: theme.themeId,
        name: theme.name,
        description: theme.description,
        vars: theme.vars,
        isLight: theme.isLight,
        isDefault: theme.isDefault,
      })),
      defaultThemeId: themes.find((theme) => theme.isDefault)?.themeId ?? "midnight",
    });
  } catch (error) {
    next(error);
  }
}
