# DevArena

Developer identity + competitive coding platform. Sign in with GitHub or
Google, get your GitHub analyzed into a deterministic Developer DNA, then
battle other developers in realtime 1v1 duels and royale rooms to earn XP,
badges, and leaderboard rank.

## Stack

| Part | Technology |
|---|---|
| Backend | Node.js, Express 5, TypeScript (ESM), MongoDB/Mongoose, Passport (GitHub/Google OAuth), express-session, Zod, Socket.IO |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Socket.IO client, Framer Motion |
| Code execution | Judge0 (public API by default, self-host URL configurable) |
| Auth | Session cookies. No JWT, no browser-stored tokens. |

## Project structure

```text
backend/src/
├── config/        env (validated), db, passport
├── models/        user, battle, theme
├── controllers/   one file per feature
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
result → XP/badges → Leaderboard. Live battles can be spectated; 1v1 lobbies
support host-approved joins (10s window). Hosts can remove players or cancel
a waiting lobby; cancelled battles award nothing.

## Conventions

- The server is authoritative for auth, stats, persona, battle state, score,
  winner, XP, badges, and rankings. Clients only send actions.
- Every API response is `{ success, message, data? }`; mutating endpoints
  validate with Zod.
- Public payloads expose allow-listed fields only — never OAuth tokens,
  answer keys, hidden tests, or other players' code.
- One system per concern: one auth flow, one battle flow, one user model,
  one XP path.
