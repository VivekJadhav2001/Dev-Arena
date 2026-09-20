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

// Render (and most hosts) terminate TLS at a reverse proxy. Without this,
// Express sees HTTP internally and refuses to set `Secure` session cookies.
app.set("trust proxy", 1);

app.use(globalResponses);

connectDB();

// FRONTEND_URL may be a single URL or a comma-separated allowlist
// (e.g. "https://dev-arena-plum.vercel.app,http://localhost:5173").
const frontendUrls = (env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => {
  // Same-origin / curl / mobile clients send no Origin — allow them.
  if (!origin) return callback(null, true);
  if (frontendUrls.includes(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(
  cors({
    origin: corsOrigin,
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

// Cross-site deployment (Vercel frontend -> Render backend) requires
// `SameSite=None; Secure` so the browser stores/sends the session cookie
// on API calls. Localhost stays on `Lax` without `Secure` (plain HTTP).
const isProduction = env.NODE_ENV === "production";

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
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

initSockets(httpServer, frontendUrls);

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

