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

app.use(globalError);

app.listen(process.env.PORT, () => console.log(`Server is running ${process.env.PORT}`));
