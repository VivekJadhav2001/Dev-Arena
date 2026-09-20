import passport from "passport";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getCurrentUser, logout } from "../controllers/auth.controller.js";
import { syncGitHubUser } from "../services/github.service.js";
import { env } from "../config/env.js";
import express from "express"
const router = express.Router();

// Primary public frontend origin. FRONTEND_URL may be a comma-separated
// allowlist (prod + localhost) — OAuth must redirect to exactly one.
const primaryFrontendUrl = env.FRONTEND_URL.split(",")[0]!.trim().replace(/\/$/, "");

// OAuth flow per provider: GET /:provider redirects to the provider, which
// calls back to /:provider/callback to establish the session.
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/v1/auth/login-failed",
  }),

  (_req, res) => {
    res.redirect(`${primaryFrontendUrl}/dashboard`);
  },
);

router.get(
    "/github",
    passport.authenticate("github",
        {
            scope:["read:user", "user:email", "repo"]
        }
    )
)

router.get(
    "/github/callback",
    passport.authenticate("github",
        {
            failureRedirect:"/api/v1/auth/login-failed"
        }
    ),
    (req,res)=>{
        // Redirect first so login feels instant. The GitHub import fans out
        // to dozens of API calls (repos, languages, commit counts) — it now
        // runs in the background and the dashboard reads the cached copy,
        // with a manual re-sync button as fallback. A sync failure must never
        // fail the login itself.
        const userId = req.user!.id;
        res.redirect(`${primaryFrontendUrl}/dashboard`);
        void syncGitHubUser(userId).catch(() => {
          // Best-effort: surfaced on the next manual sync instead.
        });
    }
)

router.get("/me",requireAuth,getCurrentUser)

router.post("/logout",requireAuth,logout)

router.get("/login-failed", (_req, res) => {
  res.status(401).json({
    success: false,
    message: "Authentication failed",
  });
});


export default router;
