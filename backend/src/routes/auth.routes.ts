import passport from "passport";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getCurrentUser, logout } from "../controllers/auth.controller.js";
import express from "express"
const router = express.Router();


// GOOGLE
/*
  STEP 1

  User visits:

  /api/auth/google

  Passport redirects them to Google.
*/
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

/*
  STEP 2

  Google redirects here after authentication.
*/
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/v1/auth/login-failed",
  }),

  (_req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/`);
  },
);


//GITHUB
/*
  STEP 1

  User visits:

  /api/auth/github

  Passport redirects them to GitHub.
*/
router.get(
    "/github",
    passport.authenticate("github",
        {
            scope:["user:email"]
        }
    )
)


/*
  STEP 2

  GitHub redirects here after authentication.
*/
router.get(
    "/github/callback",
    passport.authenticate("github",
        {
            failureRedirect:"/api/v1/auth/login-failed"
        }
    ),
    (_req,res)=>{
        res.redirect(`${process.env.FRONTEND_URL}`);
    }
)

//NOW THE USER IS LOGINED logged in user

router.get("/me",requireAuth,getCurrentUser)

router.post("/logout",requireAuth,logout)

/*
  OAuth failure
*/
router.get("/login-failed", (_req, res) => {
  res.status(401).json({
    success: false,
    message: "Authentication failed",
  });
});


export default router;
