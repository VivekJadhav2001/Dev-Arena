import dotenv from "dotenv";
dotenv.config();
import express from "express";

import cors from "cors";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import {
  globalError,
  globalResponses,
} from "./middlewares/globalResponses.middlware.js";
import passport from "./config/passport.js";

import session from "express-session";

import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js";
import dnaRoutes from "./routes/dna.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import arenaRoutes from "./routes/arena.routes.js";
import developersRoutes from "./routes/developers.routes.js";
import challengesRoutes from "./routes/challenges.routes.js";
import wrappedRoutes from "./routes/wrapped.routes.js";
import { sweepExpiredChallenges } from "./controllers/challenge.controller.js";
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

//Session

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,

      secure: false,

      sameSite: "lax",

      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

//Passport
app.use(passport.initialize());

app.use(passport.session());

///routes

app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dna", dnaRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/arena", arenaRoutes);
app.use("/api/v1/developers", developersRoutes);
app.use("/api/v1/challenges", challengesRoutes);
app.use("/api/v1/wrapped", wrappedRoutes);

app.use(globalError);

const httpServer = app.listen(process.env.PORT, () => console.log(`Server is running ${process.env.PORT}`));

initSockets(httpServer, process.env.FRONTEND_URL || "*");

// Background sweep: expire pending challenges so offline users don't pile up stale invites.
setInterval(() => {
  void sweepExpiredChallenges();
}, 60 * 1000);
