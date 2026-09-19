import dotenv from "dotenv";
dotenv.config();
import express from "express";

import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import {
  globalError,
  globalResponses,
} from "./middlewares/globalResponses.middleware.js";
import passport from "./config/passport.js";

import session from "express-session";

import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js";
import dnaRoutes from "./routes/dna.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import arenaRoutes from "./routes/arena.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import themeRoutes from "./routes/theme.routes.js";
import developersRoutes from "./routes/developers.routes.js";
import wrappedRoutes from "./routes/wrapped.routes.js";
import { backfillBattleStats } from "./services/battle-stats.service.js";
import { ensureThemeSeeds } from "./services/theme-seeds.js";
import { initSockets } from "./sockets/index.js";

const app = express();

app.use(globalResponses);

connectDB();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generous global API guard (battle screens poll every few seconds, so the
// ceiling stays far above normal multi-tab use). Per-endpoint abuse limits
// (cheers, code runs, challenges) already live in their controllers.
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Cookies must be Secure in production (HTTPS); plain HTTP needs it off
      // for local development, where NODE_ENV defaults to "development".
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dna", dnaRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/arena", arenaRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/themes", themeRoutes);
app.use("/api/v1/developers", developersRoutes);
app.use("/api/v1/wrapped", wrappedRoutes);

app.use(globalError);

const httpServer = app.listen(process.env.PORT, () => console.log(`Server is running ${process.env.PORT}`));

initSockets(httpServer, process.env.FRONTEND_URL || "*");

// One-time repair: battles finished before stat persistence existed never
// wrote xp/battleStats. Replays them (only for never-computed users) so the
// leaderboard reflects real history from the first request.
void (async () => {
  try {
    const result = await backfillBattleStats();
    if (result.battles > 0) {
      console.log(`battle-stats backfill: ${result.users} users from ${result.battles} battles`);
    }
  } catch (error) {
    console.error("battle-stats backfill failed:", error);
  }
})();

// Seed the theme gallery (missing-only, so DB edits survive restarts).
void (async () => {
  try {
    const result = await ensureThemeSeeds();
    if (result.inserted > 0) {
      console.log(`theme seeds: inserted ${result.inserted} themes (${result.total} total)`);
    }
  } catch (error) {
    console.error("theme seeding failed:", error);
  }
})();

