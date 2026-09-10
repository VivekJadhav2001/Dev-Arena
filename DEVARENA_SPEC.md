# DevArena Project Specification

> **Status:** Architecture Analysis Complete | Implementation Not Started
> **Date:** 2026-09-10
> **Author:** Lead Architect

---

## 1. Current Architecture Analysis

### 1.1 Backend (Node.js + Express)

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── passport.js        # OAuth strategies (Google, GitHub)
│   ├── controllers/
│   │   └── auth.controller.js # GET /me endpoint
│   ├── middlewares/
│   │   ├── auth.middleware.js # requireAuth guard
│   │   └── globalResponses.middlware.js # res.success/res.error helpers
│   ├── models/
│   │   └── user.model.js      # User schema (OAuth fields only)
│   ├── routes/
│   │   └── auth.routes.js     # /api/v1/auth/* routes
│   └── server.js              # Express entry point
├── .env                       # Environment config
└── package.json               # Dependencies
```

**Current Stack:**
- Express 5.x (ES Modules)
- Mongoose 9.x
- Passport.js + passport-github2 + passport-google-oauth20
- express-session (7-day cookies, lax sameSite)
- CORS configured for `FRONTEND_URL`
- Global response helpers (`res.success`, `res.error`)

**Auth Flow:**
1. `POST /api/v1/auth/github` → redirects to GitHub OAuth
2. `GET /api/v1/auth/github/callback` → creates/finds user, sets session, redirects to frontend
3. `GET /api/v1/auth/me` → returns authenticated user (protected by `requireAuth`)

**User Model (Current):**
```javascript
{
  email: String (unique, sparse),
  userName: String (required),
  avatarUrl: String,
  provider: Enum['local','google','github'],
  providerAccountId: String (required),
  githubId: String,
  googleId: String,
  accessToken: String,      // OAuth access token
  refreshToken: String,     // OAuth refresh token
  createdAt/updatedAt: timestamps
}
```

### 1.2 Frontend (React + TypeScript + Vite)

```
frontend/
├── src/
│   ├── components/
│   │   ├── GithubLoginButton.tsx  # Placeholder
│   │   └── GoogleLoginButton.tsx  # Placeholder
│   ├── pages/
│   │   └── Home.tsx               # Placeholder
│   ├── App.tsx                    # Vite default template
│   ├── main.tsx                   # Entry point
│   └── index.css                  # CSS variables (dark mode ready)
├── .env                           # VITE_BACKEND_URL
├── tsconfig.json                  # Project references
├── vite.config.ts                 # Basic React plugin
└── package.json
```

**Current Stack:**
- React 19, React Router 7
- TypeScript (strict mode via project references)
- Vite 8
- ESLint + TypeScript ESLint
- CSS variables with dark mode support (no Tailwind yet)

---

## 2. Missing Dependencies

### 2.1 Backend (Add to `backend/package.json`)

| Package | Purpose | Version Target |
|---------|---------|----------------|
| `socket.io` | Real-time battles | ^4.x |
| `zod` | Request validation | ^3.x |
| `helmet` | Security headers | ^7.x |
| `express-rate-limit` | Rate limiting | ^7.x |
| `axios` | GitHub API calls | ^1.x |
| `node-cron` | Scheduled jobs (streaks, leaderboards) | ^3.x |
| `bcryptjs` | Password hashing (future local auth) | ^2.x |
| `jsonwebtoken` | JWT for API tokens (optional) | ^9.x |

### 2.2 Frontend (Add to `frontend/package.json`)

| Package | Purpose | Version Target |
|---------|---------|----------------|
| `tailwindcss` | Utility-first CSS | ^3.x |
| `postcss` `autoprefixer` | Tailwind dependencies | ^8.x |
| `framer-motion` | Animations (Wrapped, transitions) | ^11.x |
| `lucide-react` | Icons | ^0.x |
| `recharts` | Charts (dashboard, DNA) | ^2.x |
| `html-to-image` | Share card generation | ^1.x |
| `socket.io-client` | Real-time battles | ^4.x |
| `axios` | API client | ^1.x |
| `zustand` or `jotai` | Lightweight state management | ^4.x / ^2.x |
| `date-fns` | Date formatting | ^3.x |
| `clsx` `tailwind-merge` | Class utilities | ^2.x / ^2.x |

---

## 3. Recommended Folder Structure

### 3.1 Backend

```
backend/src/
├── config/
│   ├── db.js
│   ├── passport.js
│   └── env.js                 # Centralized env validation (Zod)
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── dna.controller.js
│   ├── arena.controller.js
│   ├── battle.controller.js
│   ├── xp.controller.js
│   ├── badge.controller.js
│   ├── leaderboard.controller.js
│   └── wrapped.controller.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── globalResponses.middlware.js
│   ├── validate.middleware.js # Zod validation wrapper
│   ├── rateLimiter.middleware.js
│   └── error.middleware.js
├── models/
│   ├── user.model.js          # EXTEND significantly
│   ├── battle.model.js
│   ├── badge.model.js
│   ├── xpLog.model.js
│   ├── leaderboard.model.js   # Optional: materialized view
│   └── question.model.js      # Battle questions
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── dna.routes.js
│   ├── arena.routes.js
│   ├── battle.routes.js
│   ├── xp.routes.js
│   ├── badge.routes.js
│   ├── leaderboard.routes.js
│   └── wrapped.routes.js
├── services/
│   ├── github.service.js      # GitHub API integration
│   ├── dna.service.js         # DNA calculation (deterministic)
│   ├── xp.service.js          # XP/Level calculations
│   ├── badge.service.js       # Badge criteria evaluation
│   ├── battle.service.js      # Battle logic
│   ├── socket.service.js      # Socket.IO handlers
│   ├── wrapped.service.js     # Wrapped data aggregation
│   └── shareCard.service.js   # PNG generation
├── utils/
│   ├── apiError.js
│   ├── apiResponse.js
│   ├── constants.js
│   └── helpers.js
├── sockets/
│   ├── battle.socket.js       # Battle namespace handlers
│   └── index.js               # Socket.IO initialization
├── jobs/
│   ├── streak.job.js          # Daily streak updates
│   └── leaderboard.job.js     # Periodic leaderboard recalc
└── server.js
```

### 3.2 Frontend

```
frontend/src/
├── app/
│   ├── providers/             # Context providers (Auth, Socket, Theme)
│   ├── router/                # React Router setup
│   └── styles/                # Global styles, Tailwind
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── dna/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── wrapped/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── arena/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── battle/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   ├── xp/
│   │   ├── components/
│   │   └── hooks/
│   ├── badges/
│   │   ├── components/
│   │   └── hooks/
│   ├── leaderboard/
│   │   ├── components/
│   │   └── hooks/
│   └── profile/
│       ├── components/
│       └── hooks/
├── shared/
│   ├── components/            # Reusable UI (Button, Card, Modal, Avatar, etc.)
│   ├── hooks/                 # useAuth, useSocket, useDebounce, etc.
│   ├── utils/                 # formatters, validators, constants
│   ├── types/                 # Global TypeScript types
│   └── api/                   # Axios instance, interceptors
├── layouts/
│   ├── MainLayout.tsx
│   ├── AuthLayout.tsx
│   └── BattleLayout.tsx
├── pages/
│   ├── LandingPage.tsx
│   ├── Dashboard.tsx
│   ├── DNAPage.tsx
│   ├── WrappedPage.tsx
│   ├── ArenaLobby.tsx
│   ├── BattleRoom.tsx
│   ├── BattleResult.tsx
│   ├── Leaderboard.tsx
│   ├── PublicProfile.tsx
│   └── Settings.tsx
└── main.tsx
```

---

## 4. Database Models (Extended)

### 4.1 User Model (Extended)

```javascript
const userSchema = new mongoose.Schema({
  // OAuth (existing)
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  userName: { type: String, required: true, trim: true, index: true },
  avatarUrl: { type: String, trim: true },
  provider: { type: String, enum: ['local','google','github'], required: true },
  providerAccountId: { type: String, required: true, index: true },
  githubId: { type: String, trim: true, index: true },
  googleId: { type: String, trim: true },
  accessToken: { type: String },           // Encrypted in production
  refreshToken: { type: String },          // Encrypted in production
  
  // DevArena Profile
  persona: { type: String, enum: PERSONAS },  // 'Architect', 'NightOwl', etc.
  personaReason: { type: String },            // Human-readable explanation
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },      // Lifetime XP (never decreases)
  rank: { type: Number, default: 0 },         // Global leaderboard rank
  
  // GitHub Stats (cached, updated periodically)
  githubStats: {
    totalRepos: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    totalCommits: { type: Number, default: 0 },
    languages: { type: Map, of: Number },     // language -> bytes/usage
    topLanguage: { type: String },
    contributionStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    mostActiveRepos: [{ repo: String, commits: Number }],
    codingConsistency: { type: Number },       // 0-100 score
    openSourceScore: { type: Number },         // 0-100 score
    lastSyncedAt: { type: Date },
  },
  
  // Battle Stats
  battleStats: {
    totalBattles: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    favoriteLanguage: { type: String },
  },
  
  // Badges
  badges: [{
    badgeId: { type: String, ref: 'Badge' },
    earnedAt: { type: Date, default: Date.now },
    tier: { type: String, enum: ['bronze','silver','gold','platinum','diamond'] }
  }],
  
  // Preferences
  settings: {
    publicProfile: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['dark','light','system'], default: 'dark' }
  },
  
  // Timestamps
  lastActiveAt: { type: Date, default: Date.now },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
userSchema.index({ 'githubStats.totalCommits': -1 });
userSchema.index({ xp: -1, level: -1 });
userSchema.index({ 'battleStats.wins': -1 });
```

### 4.2 Battle Model

```javascript
const battleSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, uppercase: true },
  status: { 
    type: String, 
    enum: ['waiting','active','finished','cancelled'], 
    default: 'waiting' 
  },
  mode: { type: String, enum: ['1v1', 'tournament'], default: '1v1' },
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  language: { type: String },                 // Optional: specific language
  
  // Participants
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer: String,
      isCorrect: Boolean,
      timeTaken: Number,                       // ms
      submittedAt: Date
    }],
    completedAt: Date,
    xpEarned: { type: Number, default: 0 }
  }],
  
  // Questions (snapshot at battle creation)
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    order: Number
  }],
  
  // Timing
  startedAt: Date,
  endedAt: Date,
  timeLimit: { type: Number, default: 60000 }, // ms per question (default 60s)
  
  // Result
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDraw: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

battleSchema.index({ roomCode: 1 });
battleSchema.index({ 'players.user': 1, status: 1 });
battleSchema.index({ createdAt: -1 });
```

### 4.3 Badge Model

```javascript
const badgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true, unique: true }, // e.g., 'first_blood'
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },                  // Lucide icon name
  category: { 
    type: String, 
    enum: ['battle','streak','social','code','special'], 
    required: true 
  },
  criteria: {
    type: { type: String, required: true },                // e.g., 'battle_wins', 'streak_days'
    threshold: { type: Number, required: true },
    operator: { type: String, enum: ['gte','lte','eq'], default: 'gte' }
  },
  tier: { type: String, enum: ['bronze','silver','gold','platinum','diamond'], default: 'bronze' },
  xpReward: { type: Number, default: 0 },
  isSecret: { type: Boolean, default: false },             // Hidden until earned
  createdAt: { type: Date, default: Date.now }
});
```

### 4.4 XP Log Model (Audit Trail)

```javascript
const xpLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  source: { 
    type: String, 
    enum: ['battle_win','battle_participation','streak','badge','daily_login','wrapped_share','referral'],
    required: true 
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  levelBefore: { type: Number, required: true },
  levelAfter: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },         // battleId, badgeId, etc.
  createdAt: { type: Date, default: Date.now }
});

xpLogSchema.index({ user: 1, createdAt: -1 });
```

### 4.5 Question Model (Battle Questions)

```javascript
const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true, unique: true }, // e.g., 'js_001'
  prompt: { type: String, required: true },
  type: { type: String, enum: ['mcq','code_output','fill_blank','debug'], required: true },
  language: { type: String, required: true },                 // javascript, python, typescript, etc.
  difficulty: { type: String, enum: ['easy','medium','hard'], required: true },
  options: [String],                                          // For MCQ
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  tags: [String],                                             // ['async', 'closures', 'array-methods']
  timeLimit: { type: Number, default: 60000 },                // ms
  xpValue: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

questionSchema.index({ language: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ tags: 1 });
```

---

## 5. API Architecture

### 5.1 REST Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| **Auth** |
| GET | `/api/v1/auth/github` | Initiate GitHub OAuth | No |
| GET | `/api/v1/auth/github/callback` | GitHub callback | No |
| GET | `/api/v1/auth/google` | Initiate Google OAuth | No |
| GET | `/api/v1/auth/google/callback` | Google callback | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/logout` | Logout | Yes |
| **User / Profile** |
| GET | `/api/v1/users/me` | Full profile (stats, DNA, badges) | Yes |
| GET | `/api/v1/users/:username` | Public profile | No* |
| PATCH | `/api/v1/users/me` | Update settings | Yes |
| POST | `/api/v1/users/me/sync-github` | Trigger GitHub data sync | Yes |
| **Developer DNA** |
| GET | `/api/v1/dna/me` | Get DNA + persona | Yes |
| POST | `/api/v1/dna/regenerate` | Force DNA recalculation | Yes |
| **Dashboard** |
| GET | `/api/v1/dashboard` | Aggregated dashboard data | Yes |
| **GitHub Wrapped** |
| GET | `/api/v1/wrapped/me` | Wrapped data for current user | Yes |
| POST | `/api/v1/wrapped/generate` | Generate share card (returns image URL) | Yes |
| **Arena / Battles** |
| POST | `/api/v1/arena/create` | Create battle room | Yes |
| POST | `/api/v1/arena/join` | Join by room code | Yes |
| GET | `/api/v1/arena/:roomCode` | Get battle room state | Yes |
| POST | `/api/v1/arena/:roomCode/start` | Start battle (host only) | Yes |
| POST | `/api/v1/arena/:roomCode/answer` | Submit answer | Yes |
| POST | `/api/v1/arena/:roomCode/forfeit` | Forfeit battle | Yes |
| GET | `/api/v1/battles/history` | User's battle history (paginated) | Yes |
| GET | `/api/v1/battles/:battleId` | Battle details/replay | Yes |
| **XP / Level** |
| GET | `/api/v1/xp/me` | XP breakdown, level progress | Yes |
| GET | `/api/v1/xp/levels` | Level thresholds (static) | No |
| **Badges** |
| GET | `/api/v1/badges` | All badges (with earned status) | Yes |
| GET | `/api/v1/badges/me` | User's earned badges | Yes |
| **Leaderboard** |
| GET | `/api/v1/leaderboard` | Global leaderboard (paginated) | No* |
| GET | `/api/v1/leaderboard/me` | User's rank context | Yes |

*Public endpoints support optional auth for personalized data

### 5.2 Request/Response Standards

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": []  // Zod validation errors if applicable
}
```

### 5.3 Validation (Zod Schemas)

All mutating endpoints must validate input with Zod schemas in `validate.middleware.js`.

---

## 6. Socket.IO Architecture

### 6.1 Namespaces

| Namespace | Purpose |
|-----------|---------|
| `/battle` | Real-time 1v1 battles |
| `/arena` | Lobby, matchmaking, notifications |

### 6.2 Battle Namespace (`/battle`)

**Client → Server Events:**
```typescript
// Join battle room
socket.emit('battle:join', { roomCode: string, userId: string });

// Host starts battle
socket.emit('battle:start', { roomCode: string });

// Submit answer
socket.emit('battle:answer', { 
  roomCode: string, 
  questionId: string, 
  answer: string,
  timeTaken: number 
});

// Forfeit
socket.emit('battle:forfeit', { roomCode: string });

// Heartbeat
socket.emit('battle:ping');
```

**Server → Client Events:**
```typescript
// Room state update
socket.on('battle:state', (state: BattleRoomState) => {});

// Player joined/left
socket.on('battle:player_joined', (player: PlayerState) => {});
socket.on('battle:player_left', (userId: string) => {});

// Battle started
socket.on('battle:started', (data: { questions: Question[], timeLimit: number }) => {});

// New question
socket.on('battle:question', (data: { question: Question, index: number, total: number }) => {});

// Opponent progress (real-time)
socket.on('battle:opponent_progress', (data: { userId: string, questionIndex: number, score: number }) => {});

// Answer result
socket.on('battle:answer_result', (data: { 
  isCorrect: boolean, 
  correctAnswer: string, 
  explanation: string,
  xpEarned: number,
  currentScore: number 
}) => {});

// Battle ended
socket.on('battle:ended', (result: BattleResult) => {});

// Error
socket.on('battle:error', (error: { code: string, message: string }) => {});
```

### 6.3 Battle Room State Machine

```
WAITING → (host starts) → ACTIVE → (all answered/timeup) → QUESTION_TRANSITION → ACTIVE → ... → FINISHED
                    ↓                                                                    ↓
               (forfeit)                                                            (forfeit)
                    ↓                                                                    ↓
               CANCELLED ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 6.4 Reconnection Handling

- Store `socket.id` → `userId` mapping in Redis (or in-memory Map for single instance)
- On reconnect: `socket.emit('battle:reconnect', { roomCode })` → server sends current state
- Grace period: 30 seconds before forfeit

---

## 7. Core Algorithms (Deterministic)

### 7.1 XP / Level System

```typescript
// Level thresholds: quadratic growth
// Level 1: 0 XP
// Level 2: 100 XP
// Level 3: 300 XP (100 + 200)
// Level 4: 600 XP (100 + 200 + 300)
// Level N: 50 * N * (N - 1)

function getXpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

function getLevelFromXp(xp: number): number {
  return Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2);
}

function getXpProgress(xp: number): { currentLevel: number; currentLevelXp: number; nextLevelXp: number; progress: number } {
  const level = getLevelFromXp(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  return {
    currentLevel: level,
    currentLevelXp: xp - currentLevelXp,
    nextLevelXp: nextLevelXp - currentLevelXp,
    progress: (xp - currentLevelXp) / (nextLevelXp - currentLevelXp)
  };
}
```

**XP Sources:**
| Source | Base XP | Multipliers |
|--------|---------|-------------|
| Battle participation | 10 | ×1 |
| Battle win | 50 | ×1.5 if streak ≥3 |
| Battle perfect score | 30 | - |
| Daily login streak | 5 | ×streak (max ×7) |
| Badge earned | 20-200 | By tier |
| GitHub sync (weekly) | 10 | - |
| Wrapped share | 15 | Once per season |

### 7.2 Developer Persona Algorithm

```typescript
type Persona = 
  | 'The Architect'      // High repo count, structured commits, multiple languages
  | 'The Night Owl'      // >60% commits 22:00-04:00
  | 'The Polyglot'       // ≥5 languages with >500 lines each
  | 'The Builder'        // High public repos, low forks (original work)
  | 'The Open Source Warrior' // High forks, stars given, PRs
  | 'The Debugger'       // High commit frequency, small diffs, fix keywords
  | 'The Consistent Coder' // Long streak, low variance in daily commits
  | 'The Weekend Warrior'  // >70% commits Sat-Sun
  | 'The Specialist'     // >80% commits in single language
  | 'The Explorer';      // Many languages, low depth each

function calculatePersona(stats: GitHubStats): { persona: Persona; reason: string } {
  const scores = {
    architect: scoreArchitect(stats),
    nightOwl: scoreNightOwl(stats),
    polyglot: scorePolyglot(stats),
    builder: scoreBuilder(stats),
    openSource: scoreOpenSource(stats),
    debugger: scoreDebugger(stats),
    consistent: scoreConsistent(stats),
    weekend: scoreWeekend(stats),
    specialist: scoreSpecialist(stats),
    explorer: scoreExplorer(stats),
  };
  
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { persona: PERSONA_MAP[top[0]], reason: generateReason(top[0], stats) };
}
```

Each scoring function uses only raw GitHub metrics (no ML, no external APIs).

### 7.3 Badge Criteria (Examples)

| Badge ID | Name | Criteria | Tier | XP |
|----------|------|----------|------|-----|
| `first_blood` | First Blood | Win first battle | Bronze | 50 |
| `night_owl` | Night Owl | 100 commits between 22:00-04:00 | Silver | 100 |
| `polyglot` | Polyglot | Active in 5+ languages | Gold | 150 |
| `consistency_king` | Consistency King | 30-day commit streak | Gold | 200 |
| `arena_regular` | Arena Regular | 50 battles played | Silver | 100 |
| `win_streak_5` | Hot Streak | 5 consecutive wins | Gold | 150 |
| `win_streak_10` | Unstoppable | 10 consecutive wins | Platinum | 300 |
| `open_source_warrior` | Open Source Warrior | 100 stars given + 50 forks | Gold | 200 |
| `bug_slayer` | Bug Slayer | 500 commits with 'fix'/'bug' in message | Silver | 100 |
| `code_warrior` | Code Warrior | Level 25 reached | Diamond | 500 |
| `wrapped_sharer` | Storyteller | Share Wrapped 3 times | Bronze | 50 |

---

## 8. GitHub Data Integration

### 8.1 Data Sources (Free Tier Compatible)

| Data | Source | Notes |
|------|--------|-------|
| User profile | `GET /users/:username` | Public |
| Repositories | `GET /users/:username/repos` | Paginated, 100/page |
| Languages | `GET /repos/:owner/:repo/languages` | Per repo |
| Commits | `GET /repos/:owner/:repo/commits` | Requires auth for private; use `author=:username` |
| Events | `GET /users/:username/events/public` | Public activity only |
| Contributions | Scrape contributions calendar | No official API; use HTML parsing |

### 8.2 Sync Strategy

- **Initial sync:** On first login, fetch all repos, compute stats
- **Incremental sync:** Daily cron job + manual "Sync" button
- **Rate limiting:** Respect `X-RateLimit-Remaining`, exponential backoff
- **Caching:** Store computed stats in `user.githubStats`, update `lastSyncedAt`

### 8.3 Required GitHub OAuth Scopes

```
read:user
user:email
repo (for private repo stats - optional)
```

Current scope only has `user:email`. Need to update passport config.

---

## 9. Frontend Architecture Details

### 9.1 State Management

- **Auth:** React Context + localStorage (persist session)
- **Socket:** Singleton Socket.IO client in Context
- **UI State:** Zustand stores per feature (battle, dashboard, wrapped)
- **Server State:** TanStack Query (React Query) for caching, invalidation

### 9.2 Key Components (Shared)

```
shared/components/
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── ProgressBar.tsx
│   ├── StatCard.tsx
│   ├── LanguageBadge.tsx
│   ├── LevelBadge.tsx
│   ├── Tooltip.tsx
│   ├── Dropdown.tsx
│   ├── Tabs.tsx
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   └── ErrorBoundary.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
└── data-display/
    ├── ChartWrapper.tsx
    ├── DNAVisualization.tsx
    ├── BattleTimer.tsx
    ├── CodeBlock.tsx
    └── ShareCard.tsx
```

### 9.3 Design System (Tailwind Config)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark-first palette
        background: '#0a0a0f',
        surface: '#11131a',
        surfaceElevated: '#181b23',
        border: '#2a2e39',
        borderHover: '#3a3f4d',
        text: '#e4e6eb',
        textMuted: '#8b909a',
        textSubtle: '#5c616b',
        primary: '#00d4aa',      // Teal accent
        primaryGlow: '#00d4aa40',
        secondary: '#7c5cff',    // Purple accent
        secondaryGlow: '#7c5cff40',
        danger: '#ff4757',
        warning: '#ffa502',
        success: '#00d4aa',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': 'url("data:image/svg+xml,...")',
        'noise-pattern': 'url("data:image/svg+xml,...")',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
};
```

### 9.4 Page Specifications

#### Landing Page (`/`)
- Hero: "Your GitHub tells the story. DevArena proves it."
- Animated background (canvas/WebGL or CSS)
- GitHub login button (primary), Google login (secondary)
- Feature highlights: DNA, Wrapped, Arena, Leaderboard
- Footer: links, social

#### Dashboard (`/dashboard`)
- Top bar: Avatar, username, persona badge, level/XP bar, global rank
- Grid: Stats cards (Repos, Commits, Streak, Languages, Battles, Win Rate)
- DNA visualization (radar chart or custom SVG)
- Recent battles (horizontal scroll)
- Badges showcase (top 6)
- Quick actions: "Enter Arena", "View Wrapped", "Sync GitHub"

#### DNA Page (`/dna`)
- Full-screen persona reveal animation
- Persona card with explanation
- Detailed metrics breakdown
- Language distribution chart
- Activity heatmap (GitHub-style)
- Share button → generates PNG

#### Wrapped Page (`/wrapped`)
- Full-screen carousel/slideshow (Framer Motion)
- Slide components: `WrappedSlide` with consistent layout
- Navigation: keyboard, swipe, next/prev buttons
- Progress indicator
- Final slide: Shareable identity card with "Download PNG" / "Share to Twitter"

#### Arena Lobby (`/arena`)
- "Create Battle" modal: difficulty, language, time limit
- "Join Battle" modal: room code input
- Active battles list (if spectating supported)
- Battle history summary
- Matchmaking queue (future)

#### Battle Room (`/battle/:roomCode`)
- Split view: left = question, right = opponent status
- Question card: prompt, code block (syntax highlighted), MCQ options / input
- Timer (circular progress)
- Opponent: avatar, name, current question, score, live progress bar
- Submit button (disabled until answer selected)
- Connection status indicator

#### Battle Result (`/battle/:roomCode/result`)
- Winner announcement animation
- Side-by-side comparison: score, answers, time per question
- XP breakdown
- Badges earned
- "Rematch" / "Back to Arena" / "Share Result"

#### Leaderboard (`/leaderboard`)
- Table: Rank, Avatar, Username, Persona, Level, XP, Wins, Badges
- Pagination (50/page)
- Filters: Global / This Week / This Month
- "My Rank" highlight row

#### Public Profile (`/u/:username`)
- Hero: Avatar, username, persona, level badge, rank
- DNA summary (mini)
- Stats grid
- Language bars
- Badges grid (all)
- Battle record (W/L/D, recent)
- Share profile button (generates OG image)

---

## 10. Implementation Order (Phased)

### Phase 0: Foundation (Week 1)
- [ ] Add missing dependencies (both package.json)
- [ ] Set up Tailwind CSS + design system
- [ ] Configure ESLint/Prettier/TypeScript strict
- [ ] Set up React Query + Axios instance + interceptors
- [ ] Create shared UI component library
- [ ] Implement Auth Context + protected routes
- [ ] Replace placeholder login buttons with real OAuth flow

### Phase 1: User & GitHub Sync (Week 2)
- [ ] Extend User model with all fields
- [ ] Build `github.service.ts` (API wrapper with rate limiting)
- [ ] Build `dna.service.ts` (persona algorithm)
- [ ] Create `/api/v1/users/me/sync-github` endpoint
- [ ] Build Dashboard page with real data
- [ ] Add DNA page with persona reveal

### Phase 2: XP, Badges, Leaderboard (Week 3)
- [ ] Implement XP/Level service + database migration
- [ ] Create Badge model + seed data
- [ ] Build badge evaluation service (cron + real-time)
- [ ] Leaderboard endpoint + pagination
- [ ] Leaderboard page + User profile page

### Phase 3: GitHub Wrapped (Week 4)
- [ ] Build wrapped data aggregation service
- [ ] Create Wrapped slide components + Framer Motion transitions
- [ ] Implement `html-to-image` share card generation
- [ ] Wrapped page with full-screen experience

### Phase 4: Arena & Battles (Week 5-6)
- [ ] Set up Socket.IO server + client
- [ ] Build Battle model + question seed data (50+ questions)
- [ ] Create battle room state machine
- [ ] Build Arena lobby + Battle room UI
- [ ] Implement real-time answer submission + scoring
- [ ] Battle result screen + XP/badge awards

### Phase 5: Polish & Deploy (Week 7)
- [ ] Error boundaries, loading states, empty states everywhere
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (ARIA, keyboard nav, contrast)
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Deploy frontend to Vercel, backend to Render/Railway
- [ ] MongoDB Atlas indexes, connection pooling
- [ ] Monitoring (Sentry, LogRocket)

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GitHub API rate limits (5000/hr) | High | Medium | Cache aggressively; batch requests; show stale data with refresh button |
| Socket.IO scaling (multiple instances) | Medium | High | Use Redis adapter from day one; design stateless handlers |
| OAuth token storage security | Medium | High | Encrypt tokens at rest; rotate secrets; minimal scopes |
| Battle cheating (client-side answers) | Medium | High | Server-authoritative validation; time-limited questions; obfuscate correct answer |
| Wrapped share card generation performance | Low | Medium | Generate server-side (Puppeteer) or optimize client canvas |
| MongoDB query performance (leaderboard) | Medium | Medium | Materialized view / aggregation pipeline; cache in Redis |
| Frontend bundle size | Medium | Low | Code splitting per route; dynamic imports for heavy libs (framer-motion, recharts) |
| Solo developer maintenance burden | High | High | Strict module boundaries; comprehensive types; automated tests for core logic |

---

## 12. Environment Variables (Complete)

### Backend (`.env`)
```env
# Server
PORT=2001
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://...

# Frontend
FRONTEND_URL=http://localhost:5173

# Session
SESSION_SECRET=...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:2001/api/v1/auth/github/callback

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:2001/api/v1/auth/google/callback

# GitHub API (for server-side calls)
GITHUB_API_TOKEN=ghp_...  # Personal access token for higher rate limits

# Redis (for Socket.IO scaling + caching)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=...  # If using JWT for API tokens
ENCRYPTION_KEY=...  # 32-char key for token encryption
```

### Frontend (`.env`)
```env
VITE_BACKEND_URL=http://localhost:2001/api/v1
VITE_SOCKET_URL=http://localhost:2001
VITE_APP_URL=http://localhost:5173
```

---

## 13. Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit (services, utils) | Vitest | 80% |
| Integration (API routes) | Supertest + Vitest | 60% |
| E2E (critical flows) | Playwright | 10 scenarios |
| Component | React Testing Library | Key components only |

**Critical flows to test:**
1. OAuth login → session → protected route access
2. GitHub sync → DNA calculation → persona assignment
3. Create battle → join → answer questions → result → XP award
4. Wrapped generation → share card download
5. Leaderboard pagination + rank accuracy

---

## 14. Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Render/       │     │   MongoDB       │
│   (Frontend)    │────▶│   Railway       │────▶│   Atlas         │
│                 │◀────│   (Backend)     │◀────│                 │
│   Static + SSR  │     │   Node.js       │     │   Cluster       │
│   Edge Functions│     │   Socket.IO     │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Redis (Upstash)       │
                    │   - Socket.IO adapter   │
                    │   - Rate limit cache    │
                    │   - Session store       │
                    └─────────────────────────┘
```

**Build Commands:**
- Frontend: `pnpm build` → outputs to `dist/`
- Backend: `pnpm start` (via `server.js`)

---

## 15. Next Immediate Steps

1. **Install dependencies** in both `backend/` and `frontend/`
2. **Configure Tailwind** in frontend with design system
3. **Extend User model** with all DevArena fields
4. **Build GitHub service** with rate-limited API client
5. **Implement DNA calculation** as pure TypeScript functions (testable)
6. **Create API routes** for `/me`, `/dna`, `/dashboard`
7. **Build Dashboard + DNA pages** with real data

---

## 16. Code Conventions

### Backend
- **Files:** `kebab-case.js` (ES Modules)
- **Functions:** `camelCase`
- **Constants:** `SCREAMING_SNAKE_CASE`
- **Database:** `snake_case` fields, `PascalCase` models
- **Errors:** Throw `ApiError` with status + message
- **Async:** Always `try/catch` → `next(error)`

### Frontend
- **Files:** `PascalCase.tsx` (components), `camelCase.ts` (utils)
- **Components:** Functional + TypeScript interfaces for props
- **Hooks:** `usePrefix` naming
- **Types:** Shared in `shared/types/`, feature-specific in `features/*/types.ts`
- **Styling:** Tailwind utility classes; `clsx` for conditionals
- **State:** React Query for server, Zustand for client

---

*End of Specification*

**Next Action:** Begin Phase 0 implementation (dependencies + Tailwind + Auth Context)