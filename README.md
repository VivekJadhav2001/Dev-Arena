# DevArena

**Proof of skill, not just a profile.** DevArena is a developer identity +
competitive coding platform. Sign in with GitHub or Google, get your GitHub
analyzed into a deterministic **Developer DNA**, then battle other developers
in realtime 1v1 duels and royale rooms to earn **XP, badges, and leaderboard
rank**.

## Live demo

| Part | URL |
|---|---|
| Frontend | https://dev-arena-plum.vercel.app/ |
| Backend API | https://dev-arena-62si.onrender.com/api/v1 |

## Features

- **OAuth login** — GitHub or Google via Passport sessions (cookies, no JWT).
- **GitHub intelligence** — repos, languages, commits, streaks and activity
  heatmaps imported in the background and cached in MongoDB (respects rate
  limits, manual re-sync supported).
- **Developer DNA** — deterministic persona + traits derived from real GitHub
  activity. Same data always gives the same DNA, no AI API needed.
- **Dashboard** — command center for stats, DNA, XP, battles and badges.
- **Wrapped** — animated season recap with PNG poster export, native/X/LinkedIn
  sharing.
- **Arena** — create, join or quick-match 1v1 and royale battles; sticky
  lobbies, host-approved joins (10s window), remove/cancel controls.
- **Realtime battles** — Socket.IO presence + progress pings; the server grades
  MCQ and live coding questions (Judge0 execution), decides the winner and
  awards XP. Clients only send actions, never scores.
- **XP, levels, badges** — server-side evaluation from battles and activity.
- **Leaderboard** — server-ranked, paginated, with personal rank context.
- **Public profiles** — `/u/:username` with a privacy toggle; private profiles
  are visible only to the owner and hidden from the leaderboard.
- **Shareable links with rich previews** — profiles, Wrapped recaps and
  finished battles unfurl with per-item pictures on LinkedIn/X/WhatsApp via
  crawler-first `/s/*` preview pages.
- **Live spectating** — watch active battles, cheer players, browse the live
  lobby list.
- **LeetCode integration** — connect your username, sync solve stats and
  daily activity.
- **Themes & settings** — theme gallery plus profile, privacy and
  notification controls.

## Stack

| Part | Technology |
|---|---|
| Backend | Node.js, Express 5, TypeScript (ESM), MongoDB/Mongoose, Passport (GitHub/Google OAuth), express-session, Zod, Socket.IO |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Axios, Socket.IO client, Framer Motion, Recharts |
| Code execution | Judge0 (public API by default, self-host URL configurable) |
| Auth | Session cookies (`SameSite=None; Secure` in production). No JWT, no browser-stored tokens. |

## Project structure

```text
backend/src/
├── config/        env (validated), db, passport
├── models/        user, battle, theme
├── controllers/   one file per feature (incl. share link previews)
├── services/      github, leetcode, dna, questions, execution, stats, seeds
├── routes/        URL → controller wiring
├── sockets/       presence + battle pings (game facts travel over REST)
├── middlewares/   requireAuth, global responses
└── server.ts      app setup and boot

frontend/src/
├── pages/         one screen per route
├── services/      typed API clients (one per backend feature)
├── store/         zustand stores (auth session, app cache, theme)
├── app/           routes, route guard, socket provider
├── components/    live, wrapped, dna, leetcode, profile, effects
├── lib/           API client, share/meta helpers
└── hooks/         session, battle timer
```

## Run it

```bash
# backend (needs backend/.env — see backend/.env.example)
cd backend
pnpm install
pnpm dev

# frontend (needs frontend/.env — see frontend/.env.example)
cd frontend
pnpm install
pnpm dev
```

Required backend env: `MONGODB_URI`, `FRONTEND_URL`, `SESSION_SECRET`
(32+ chars), `GITHUB_CLIENT_ID/SECRET/CALLBACK_URL`,
`GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`. Optional: `JUDGE0_API_URL`.

Frontend env: `VITE_BACKEND_URL` (e.g. `http://localhost:2001/api/v1`),
optional `VITE_SOCKET_URL`.

## Checks

```bash
# backend
pnpm typecheck
pnpm build
pnpm test        # node:test suite (XP curve, battle XP, DNA determinism)

# frontend
pnpm typecheck
pnpm lint
pnpm build
```

TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`) on both sides.

## Product flow

Landing → OAuth login → GitHub analysis → Developer DNA → Dashboard →
Wrapped → Arena (create/join/quick-match) → Battle lobby → realtime battle →
result → XP/badges → Leaderboard → Public profile. Live battles can be
spectated; finished battles, profiles and Wrapped recaps are publicly
shareable with rich link previews. Private profiles stay visible only to
their owner.

## Conventions

- The server is authoritative for auth, stats, persona, battle state, score,
  winner, XP, badges, and rankings. Clients only send actions.
- Every API response is `{ success, message, data? }`; mutating endpoints
  validate with Zod.
- Public payloads expose allow-listed fields only — never OAuth tokens,
  answer keys, hidden tests, or other players' code.
- One system per concern: one auth flow, one battle flow, one user model,
  one XP path.
