import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import type { Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from "passport-google-oauth20";
import type { Profile as GitHubProfile } from "passport-github2";
import { findOrCreateOAuthUser } from "../utils/checkUserInDB.js";
import { User } from "../models/user.model.js";
import { env } from "./env.js";

// This module is evaluated before server.js runs its top-level code, so it
// must load the OAuth credentials before registering the strategies.
dotenv.config();

// Keep only the database id in the signed session cookie; rehydrate the user
// from MongoDB for each authenticated request.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

//google
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: GoogleVerifyCallback) => {
      try {
        const user = await findOrCreateOAuthUser({
          provider: "google",
          providerAccountId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value ?? null,
          avatar: profile.photos?.[0]?.value ?? null,
          accessToken,
          refreshToken,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null as unknown as Express.User);
      }
    },
  ),
);


passport.use(
  "github",
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
    },
    async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: GoogleVerifyCallback) => {
      try {
        const user = await findOrCreateOAuthUser({
          provider: "github",
          providerAccountId: profile.id,
          name: profile.username || profile.displayName,
          email: profile.emails?.[0]?.value ?? null,
          avatar: profile.photos?.[0]?.value ?? null,
          accessToken,
          refreshToken,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null as unknown as Express.User);
      }
    }
  )
);



export default passport;
