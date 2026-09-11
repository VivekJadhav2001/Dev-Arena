# DevArena Project Specification

> **Status:** Architecture Analysis Complete | Implementation Not Started
> **Date:** 2026-09-10
> **Author:** Lead Architect

---

## 1. Current Architecture Analysis

### 1.1 Backend (Node.js + Express)

```text
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

* Express 5.x (ES Modules)
* Mongoose 9.x
* Passport.js + passport-github2 + passport-google-oauth20
* express-session (7-day cookies, lax sameSite)
* CORS configured for `FRONTEND_URL`
* Global response helpers (`res.success`, `res.error`)

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

```text
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

* React 19, React Router 7
* TypeScript (strict mode via project references)
* Vite 8
* ESLint + TypeScript ESLint
* CSS variables with dark mode support (no Tailwind yet)

---

## 2. Missing Dependencies

### 2.1 Backend (Add to `backend/package.json`)

| Package              | Purpose                                                  | Version Target |
| -------------------- | -------------------------------------------------------- | -------------- |
| `socket.io`          | Real-time battles, presence and challenges               | ^4.x           |
| `zod`                | Request validation                                       | ^3.x           |
| `helmet`             | Security headers                                         | ^7.x           |
| `express-rate-limit` | Rate limiting                                            | ^7.x           |
| `axios`              | GitHub API calls                                         | ^1.x           |
| `node-cron`          | Scheduled jobs (streaks, leaderboards, presence cleanup) | ^3.x           |
| `bcryptjs`           | Password hashing (future local auth)                     | ^2.x           |
| `jsonwebtoken`       | JWT for API tokens (optional)                            | ^9.x           |

### 2.2 Frontend (Add to `frontend/package.json`)

| Package                                    | Purpose                                      | Version Target                         |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------- |
| `tailwindcss`                              | Utility-first CSS                            | ^3.x                                   |
| `postcss`                                  | Tailwind dependency                          | ^8.x                                   |
| `autoprefixer`                             | Tailwind dependency                          | ^10.x                                  |
| `framer-motion`                            | Animations (Wrapped, transitions, map cards) | ^11.x                                  |
| `lucide-react`                             | Icons                                        | ^0.x                                   |
| `recharts`                                 | Charts (dashboard, DNA)                      | ^2.x                                   |
| `html-to-image`                            | Share card generation                        | ^1.x                                   |
| `socket.io-client`                         | Real-time battles, presence and challenges   | ^4.x                                   |
| `axios`                                    | API client                                   | ^1.x                                   |
| `zustand` or `jotai`                       | Lightweight state management                 | ^4.x / ^2.x                            |
| `date-fns`                                 | Date formatting                              | ^3.x                                   |
| `clsx`                                     | Conditional classes                          | ^2.x                                   |
| `tailwind-merge`                           | Tailwind class merging                       | ^2.x                                   |
| `mapcn`                                    | Map UI and developer discovery map           | latest compatible                      |
| MapCN's selected map provider dependencies | Map rendering/provider integration           | As required by selected MapCN provider |

> **MapCN note:** MapCN should be treated as the map UI layer. The actual map provider/configuration required by the selected MapCN setup must be installed and configured according to the provider used by the implementation.

---

## 3. Recommended Folder Structure

### 3.1 Backend

```text
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
│   ├── challenge.controller.js
│   ├── presence.controller.js
│   ├── xp.controller.js
│   ├── badge.controller.js
│   ├── leaderboard.controller.js
│   └── wrapped.controller.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── globalResponses.middlware.js
│   ├── validate.middleware.js
│   ├── rateLimiter.middleware.js
│   └── error.middleware.js
├── models/
│   ├── user.model.js
│   ├── battle.model.js
│   ├── challenge.model.js
│   ├── badge.model.js
│   ├── xpLog.model.js
│   ├── leaderboard.model.js
│   └── question.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── dna.routes.js
│   ├── arena.routes.js
│   ├── battle.routes.js
│   ├── challenge.routes.js
│   ├── presence.routes.js
│   ├── xp.routes.js
│   ├── badge.routes.js
│   ├── leaderboard.routes.js
│   └── wrapped.routes.js
├── services/
│   ├── github.service.js
│   ├── dna.service.js
│   ├── xp.service.js
│   ├── badge.service.js
│   ├── battle.service.js
│   ├── challenge.service.js
│   ├── presence.service.js
│   ├── geo.service.js
│   ├── socket.service.js
│   ├── wrapped.service.js
│   └── shareCard.service.js
├── utils/
│   ├── apiError.js
│   ├── apiResponse.js
│   ├── constants.js
│   └── helpers.js
├── sockets/
│   ├── battle.socket.js
│   ├── presence.socket.js
│   ├── challenge.socket.js
│   └── index.js
├── jobs/
│   ├── streak.job.js
│   ├── leaderboard.job.js
│   └── presenceCleanup.job.js
└── server.js
```

### 3.2 Frontend

```text
frontend/src/
├── app/
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── SocketProvider.tsx
│   │   └── ThemeProvider.tsx
│   ├── router/
│   └── styles/
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
│   ├── nearby/
│   │   ├── components/
│   │   │   ├── DeveloperMap.tsx
│   │   │   ├── DeveloperMarker.tsx
│   │   │   ├── DeveloperPreviewCard.tsx
│   │   │   ├── NearbyDeveloperList.tsx
│   │   │   ├── ChallengeDeveloperModal.tsx
│   │   │   ├── LocationPermissionCard.tsx
│   │   │   └── MapFilters.tsx
│   │   ├── hooks/
│   │   │   ├── useNearbyDevelopers.ts
│   │   │   ├── useGeolocation.ts
│   │   │   └── usePresence.ts
│   │   ├── types.ts
│   │   └── api.ts
│   ├── challenges/
│   │   ├── components/
│   │   │   ├── ChallengeNotification.tsx
│   │   │   ├── ChallengeList.tsx
│   │   │   └── ChallengeCard.tsx
│   │   ├── hooks/
│   │   ├── types.ts
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
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── api/
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
│   ├── NearbyDevelopersPage.tsx
│   ├── ChallengesPage.tsx
│   ├── BattleRoom.tsx
│   ├── BattleResult.tsx
│   ├── Leaderboard.tsx
│   ├── PublicProfile.tsx
│   └── Settings.tsx
└── main.tsx
```

---

# 4. Database Models (Extended)

## 4.1 User Model (Extended)

```javascript
const userSchema = new mongoose.Schema({

  // OAuth
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },

  userName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  avatarUrl: {
    type: String,
    trim: true
  },

  provider: {
    type: String,
    enum: ['local', 'google', 'github'],
    required: true
  },

  providerAccountId: {
    type: String,
    required: true,
    index: true
  },

  githubId: {
    type: String,
    trim: true,
    index: true
  },

  googleId: {
    type: String,
    trim: true
  },

  accessToken: {
    type: String
  },

  refreshToken: {
    type: String
  },

  // DevArena Profile
  persona: {
    type: String,
    enum: PERSONAS
  },

  personaReason: {
    type: String
  },

  level: {
    type: Number,
    default: 1
  },

  xp: {
    type: Number,
    default: 0
  },

  totalXp: {
    type: Number,
    default: 0
  },

  rank: {
    type: Number,
    default: 0
  },

  // GitHub Stats
  githubStats: {
    totalRepos: {
      type: Number,
      default: 0
    },

    publicRepos: {
      type: Number,
      default: 0
    },

    followers: {
      type: Number,
      default: 0
    },

    following: {
      type: Number,
      default: 0
    },

    stars: {
      type: Number,
      default: 0
    },

    forks: {
      type: Number,
      default: 0
    },

    totalCommits: {
      type: Number,
      default: 0
    },

    languages: {
      type: Map,
      of: Number
    },

    topLanguage: {
      type: String
    },

    contributionStreak: {
      type: Number,
      default: 0
    },

    longestStreak: {
      type: Number,
      default: 0
    },

    mostActiveRepos: [{
      repo: String,
      commits: Number
    }],

    codingConsistency: {
      type: Number
    },

    openSourceScore: {
      type: Number
    },

    lastSyncedAt: {
      type: Date
    }
  },

  // Location & Nearby Developer Presence
  //
  // IMPORTANT:
  // This data does NOT come from GitHub.
  // Coordinates are obtained from the browser/device
  // Geolocation API after explicit user permission.

  location: {

    enabled: {
      type: Boolean,
      default: false
    },

    coordinates: {
      type: {
        type: String,
        enum: ['Point']
      },

      coordinates: {
        type: [Number],
        validate: {
          validator: function(value) {
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          }
        }
      }
    },

    accuracy: {
      type: Number
    },

    visibility: {
      type: String,

      enum: [
        'hidden',
        'approximate',
        'exact'
      ],

      default: 'approximate'
    },

    lastUpdatedAt: {
      type: Date
    }
  },

  // Real-time Presence
  presence: {

    isOnline: {
      type: Boolean,
      default: false
    },

    lastSeenAt: {
      type: Date
    },

    socketConnectedAt: {
      type: Date
    }
  },

  // Battle Stats
  battleStats: {

    totalBattles: {
      type: Number,
      default: 0
    },

    wins: {
      type: Number,
      default: 0
    },

    losses: {
      type: Number,
      default: 0
    },

    draws: {
      type: Number,
      default: 0
    },

    winStreak: {
      type: Number,
      default: 0
    },

    bestWinStreak: {
      type: Number,
      default: 0
    },

    avgScore: {
      type: Number,
      default: 0
    },

    favoriteLanguage: {
      type: String
    }
  },

  // Badges
  badges: [{
    badgeId: {
      type: String,
      ref: 'Badge'
    },

    earnedAt: {
      type: Date,
      default: Date.now
    },

    tier: {
      type: String,
      enum: [
        'bronze',
        'silver',
        'gold',
        'platinum',
        'diamond'
      ]
    }
  }],

  // Preferences
  settings: {

    publicProfile: {
      type: Boolean,
      default: true
    },

    showEmail: {
      type: Boolean,
      default: false
    },

    notifications: {
      type: Boolean,
      default: true
    },

    theme: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark'
    },

    nearbyDevelopers: {
      type: Boolean,
      default: false
    },

    allowChallenges: {
      type: Boolean,
      default: true
    }
  },

  lastActiveAt: {
    type: Date,
    default: Date.now
  },

  joinedAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});
```

### Geospatial Indexes

```javascript
userSchema.index({
  'location.coordinates': '2dsphere'
});

userSchema.index({
  'location.enabled': 1,
  'location.lastUpdatedAt': -1
});

userSchema.index({
  'presence.isOnline': 1
});

userSchema.index({
  'githubStats.totalCommits': -1
});

userSchema.index({
  xp: -1,
  level: -1
});

userSchema.index({
  'battleStats.wins': -1
});
```

### Location Data Rules

```text
GitHub Profile
     │
     ├── username
     ├── avatar
     ├── repositories
     ├── languages
     └── statistics
          │
          ▼
      DevArena

Browser Geolocation
     │
     ├── latitude
     ├── longitude
     └── accuracy
          │
          ▼
      DevArena Location
          │
          ▼
     MongoDB 2dsphere
```

**Never:**

```text
GitHub profile location
        ↓
"Hyderabad, India"
        ↓
Geocoding
        ↓
Exact latitude/longitude
```

This would create a false impression of the developer's actual physical location.

---

## 4.2 Battle Model

```javascript
const battleSchema = new mongoose.Schema({

  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  status: {
    type: String,
    enum: [
      'waiting',
      'active',
      'finished',
      'cancelled'
    ],
    default: 'waiting'
  },

  mode: {
    type: String,
    enum: ['1v1', 'tournament'],
    default: '1v1'
  },

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },

  language: {
    type: String
  },

  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    score: {
      type: Number,
      default: 0
    },

    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },

      answer: String,

      isCorrect: Boolean,

      timeTaken: Number,

      submittedAt: Date
    }],

    completedAt: Date,

    xpEarned: {
      type: Number,
      default: 0
    }
  }],

  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },

    order: Number
  }],

  startedAt: Date,

  endedAt: Date,

  timeLimit: {
    type: Number,
    default: 60000
  },

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isDraw: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

battleSchema.index({
  roomCode: 1
});

battleSchema.index({
  'players.user': 1,
  status: 1
});

battleSchema.index({
  createdAt: -1
});
```

---

## 4.3 Developer Challenge Model

A challenge is the bridge between the Nearby Developers feature and the existing Battle system.

```javascript
const challengeSchema = new mongoose.Schema({

  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  challenged: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  status: {
    type: String,

    enum: [
      'pending',
      'accepted',
      'declined',
      'expired',
      'cancelled'
    ],

    default: 'pending',

    index: true
  },

  battleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Battle'
  },

  settings: {

    difficulty: {
      type: String,

      enum: [
        'easy',
        'medium',
        'hard'
      ],

      default: 'medium'
    },

    language: {
      type: String
    },

    timeLimit: {
      type: Number,
      default: 60000
    }
  },

  message: {
    type: String,
    maxlength: 280,
    trim: true
  },

  expiresAt: {
    type: Date,
    index: true
  },

  respondedAt: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

challengeSchema.index({
  challenger: 1,
  challenged: 1,
  status: 1
});

challengeSchema.index({
  challenged: 1,
  status: 1,
  createdAt: -1
});
```

---

## 4.4 Badge Model

```javascript
const badgeSchema = new mongoose.Schema({

  badgeId: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  icon: {
    type: String,
    required: true
  },

  category: {
    type: String,

    enum: [
      'battle',
      'streak',
      'social',
      'code',
      'special'
    ],

    required: true
  },

  criteria: {

    type: {
      type: String,
      required: true
    },

    threshold: {
      type: Number,
      required: true
    },

    operator: {
      type: String,

      enum: [
        'gte',
        'lte',
        'eq'
      ],

      default: 'gte'
    }
  },

  tier: {
    type: String,

    enum: [
      'bronze',
      'silver',
      'gold',
      'platinum',
      'diamond'
    ],

    default: 'bronze'
  },

  xpReward: {
    type: Number,
    default: 0
  },

  isSecret: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

---

## 4.5 XP Log Model

```javascript
const xpLogSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  source: {
    type: String,

    enum: [
      'battle_win',
      'battle_participation',
      'streak',
      'badge',
      'daily_login',
      'wrapped_share',
      'referral'
    ],

    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  balanceAfter: {
    type: Number,
    required: true
  },

  levelBefore: {
    type: Number,
    required: true
  },

  levelAfter: {
    type: Number,
    required: true
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

xpLogSchema.index({
  user: 1,
  createdAt: -1
});
```

---

## 4.6 Question Model

```javascript
const questionSchema = new mongoose.Schema({

  questionId: {
    type: String,
    required: true,
    unique: true
  },

  prompt: {
    type: String,
    required: true
  },

  type: {
    type: String,

    enum: [
      'mcq',
      'code_output',
      'fill_blank',
      'debug'
    ],

    required: true
  },

  language: {
    type: String,
    required: true
  },

  difficulty: {
    type: String,

    enum: [
      'easy',
      'medium',
      'hard'
    ],

    required: true
  },

  options: [String],

  correctAnswer: {
    type: String,
    required: true
  },

  explanation: String,

  tags: [String],

  timeLimit: {
    type: Number,
    default: 60000
  },

  xpValue: {
    type: Number,
    default: 10
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

questionSchema.index({
  language: 1,
  difficulty: 1,
  isActive: 1
});

questionSchema.index({
  tags: 1
});
```

---

# 5. API Architecture

## 5.1 REST Endpoints

| Method                   | Path                                      | Description                        | Auth |
| ------------------------ | ----------------------------------------- | ---------------------------------- | ---- |
| **Auth**                 |                                           |                                    |      |
| GET                      | `/api/v1/auth/github`                     | Initiate GitHub OAuth              | No   |
| GET                      | `/api/v1/auth/github/callback`            | GitHub callback                    | No   |
| GET                      | `/api/v1/auth/google`                     | Initiate Google OAuth              | No   |
| GET                      | `/api/v1/auth/google/callback`            | Google callback                    | No   |
| GET                      | `/api/v1/auth/me`                         | Get current user                   | Yes  |
| POST                     | `/api/v1/auth/logout`                     | Logout                             | Yes  |
| **User / Profile**       |                                           |                                    |      |
| GET                      | `/api/v1/users/me`                        | Full profile                       | Yes  |
| GET                      | `/api/v1/users/:username`                 | Public profile                     | No*  |
| PATCH                    | `/api/v1/users/me`                        | Update settings                    | Yes  |
| POST                     | `/api/v1/users/me/sync-github`            | Trigger GitHub data sync           | Yes  |
| **Location / Presence**  |                                           |                                    |      |
| PATCH                    | `/api/v1/users/me/location`               | Enable/update user's location      | Yes  |
| DELETE                   | `/api/v1/users/me/location`               | Disable and remove location        | Yes  |
| GET                      | `/api/v1/developers/nearby`               | Find nearby opted-in developers    | Yes  |
| GET                      | `/api/v1/developers/:username/presence`   | Get developer presence             | Yes  |
| **Developer Challenges** |                                           |                                    |      |
| POST                     | `/api/v1/challenges`                      | Challenge another developer        | Yes  |
| GET                      | `/api/v1/challenges`                      | Get incoming/outgoing challenges   | Yes  |
| GET                      | `/api/v1/challenges/:challengeId`         | Get challenge details              | Yes  |
| POST                     | `/api/v1/challenges/:challengeId/accept`  | Accept challenge and create battle | Yes  |
| POST                     | `/api/v1/challenges/:challengeId/decline` | Decline challenge                  | Yes  |
| POST                     | `/api/v1/challenges/:challengeId/cancel`  | Cancel own challenge               | Yes  |
| **Developer DNA**        |                                           |                                    |      |
| GET                      | `/api/v1/dna/me`                          | Get DNA + persona                  | Yes  |
| POST                     | `/api/v1/dna/regenerate`                  | Force DNA recalculation            | Yes  |
| **Dashboard**            |                                           |                                    |      |
| GET                      | `/api/v1/dashboard`                       | Aggregated dashboard data          | Yes  |
| **GitHub Wrapped**       |                                           |                                    |      |
| GET                      | `/api/v1/wrapped/me`                      | Wrapped data                       | Yes  |
| POST                     | `/api/v1/wrapped/generate`                | Generate share card                | Yes  |
| **Arena / Battles**      |                                           |                                    |      |
| POST                     | `/api/v1/arena/create`                    | Create battle room                 | Yes  |
| POST                     | `/api/v1/arena/join`                      | Join by room code                  | Yes  |
| GET                      | `/api/v1/arena/:roomCode`                 | Get battle state                   | Yes  |
| POST                     | `/api/v1/arena/:roomCode/start`           | Start battle                       | Yes  |
| POST                     | `/api/v1/arena/:roomCode/answer`          | Submit answer                      | Yes  |
| POST                     | `/api/v1/arena/:roomCode/forfeit`         | Forfeit battle                     | Yes  |
| GET                      | `/api/v1/battles/history`                 | Battle history                     | Yes  |
| GET                      | `/api/v1/battles/:battleId`               | Battle details                     | Yes  |
| **XP / Level**           |                                           |                                    |      |
| GET                      | `/api/v1/xp/me`                           | XP breakdown                       | Yes  |
| GET                      | `/api/v1/xp/levels`                       | Level thresholds                   | No   |
| **Badges**               |                                           |                                    |      |
| GET                      | `/api/v1/badges`                          | All badges                         | Yes  |
| GET                      | `/api/v1/badges/me`                       | Earned badges                      | Yes  |
| **Leaderboard**          |                                           |                                    |      |
| GET                      | `/api/v1/leaderboard`                     | Global leaderboard                 | No*  |
| GET                      | `/api/v1/leaderboard/me`                  | User rank context                  | Yes  |

* Public endpoints support optional auth for personalized data.

---

## 5.2 Nearby Developers API

### Update Location

```http
PATCH /api/v1/users/me/location
```

Request:

```json
{
  "enabled": true,
  "latitude": 17.385,
  "longitude": 78.4867,
  "accuracy": 25,
  "visibility": "approximate"
}
```

Response:

```json
{
  "success": true,
  "message": "Location updated",
  "data": {
    "enabled": true,
    "visibility": "approximate"
  }
}
```

The API must validate:

* latitude between `-90` and `90`
* longitude between `-180` and `180`
* reasonable accuracy
* valid visibility value
* authenticated user
* location sharing enabled

---

### Find Nearby Developers

```http
GET /api/v1/developers/nearby?latitude=17.385&longitude=78.4867&radius=10
```

Example response:

```json
{
  "success": true,
  "message": "Nearby developers fetched",
  "data": {
    "developers": [
      {
        "id": "user_id",
        "userName": "developer123",
        "avatarUrl": "...",
        "persona": "The Architect",
        "level": 18,
        "topLanguage": "TypeScript",
        "battleStats": {
          "wins": 42,
          "losses": 17,
          "winRate": 71
        },
        "presence": {
          "isOnline": true
        },
        "distance": {
          "value": 2.4,
          "unit": "km"
        },
        "location": {
          "latitude": 17.38,
          "longitude": 78.48
        }
      }
    ]
  }
}
```

### Important Privacy Behavior

The server must **not blindly return exact coordinates**.

For:

```text
visibility = hidden
```

The developer does not appear on the map.

For:

```text
visibility = approximate
```

The backend rounds/jitters the coordinates or uses a privacy grid/radius.

For:

```text
visibility = exact
```

Exact coordinates may be returned to other opted-in users.

The default should be:

```text
approximate
```

not exact.

---

# 5.3 Developer Challenge API

### Create Challenge

```http
POST /api/v1/challenges
```

Request:

```json
{
  "challengedUserId": "USER_ID",
  "difficulty": "medium",
  "language": "javascript",
  "timeLimit": 60000,
  "message": "Ready for a quick code fight?"
}
```

Server checks:

1. Challenger is authenticated.
2. Challenger cannot challenge themselves.
3. Target user exists.
4. Target user allows challenges.
5. Target user has not blocked/disabled nearby interactions.
6. There is no existing pending challenge between both users.
7. Challenger is not rate-limited.
8. Challenge has an expiration time.

---

### Accept Challenge

```http
POST /api/v1/challenges/:challengeId/accept
```

Server:

```text
Challenge
    ↓
Validate status
    ↓
Create Battle
    ↓
Attach battleId to Challenge
    ↓
status = accepted
    ↓
Notify challenger through Socket.IO
    ↓
Both users enter Battle Room
```

---

### Decline Challenge

```http
POST /api/v1/challenges/:challengeId/decline
```

---

### Cancel Challenge

```http
POST /api/v1/challenges/:challengeId/cancel
```

Only the challenger can cancel a pending challenge.

---

# 5.4 Request/Response Standards

**Success:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error:**

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": []
}
```

---

# 5.5 Validation

All mutating endpoints must validate input using Zod schemas in:

```text
middlewares/validate.middleware.js
```

Location:

```text
latitude
longitude
accuracy
visibility
```

Challenge:

```text
challengedUserId
difficulty
language
timeLimit
message
```

must all be validated.

---

# 6. Socket.IO Architecture

## 6.1 Namespaces

| Namespace    | Purpose                           |
| ------------ | --------------------------------- |
| `/battle`    | Real-time 1v1 battles             |
| `/arena`     | Lobby, matchmaking, notifications |
| `/presence`  | Developer online/offline presence |
| `/challenge` | Challenge notifications           |

---

# 6.2 Presence Namespace (`/presence`)

### Client → Server

```typescript
socket.emit('presence:join', {
  userId: string
});
```

```typescript
socket.emit('presence:location_update', {
  latitude: number,
  longitude: number,
  accuracy?: number
});
```

```typescript
socket.emit('presence:leave');
```

```typescript
socket.emit('presence:heartbeat');
```

### Server → Client

```typescript
socket.on(
  'presence:developer_online',
  (developer: NearbyDeveloper) => {}
);
```

```typescript
socket.on(
  'presence:developer_offline',
  (userId: string) => {}
);
```

```typescript
socket.on(
  'presence:developer_location_updated',
  (developer: NearbyDeveloper) => {}
);
```

---

# 6.3 Challenge Namespace (`/challenge`)

### Server → Client

```typescript
socket.on(
  'challenge:received',
  (challenge: Challenge) => {}
);
```

```typescript
socket.on(
  'challenge:accepted',
  (data: {
    challengeId: string;
    battleId: string;
    roomCode: string;
  }) => {}
);
```

```typescript
socket.on(
  'challenge:declined',
  (data: {
    challengeId: string;
  }) => {}
);
```

```typescript
socket.on(
  'challenge:expired',
  (data: {
    challengeId: string;
  }) => {}
);
```

---

# 6.4 Battle Namespace (`/battle`)

**Client → Server Events:**

```typescript
socket.emit('battle:join', {
  roomCode: string,
  userId: string
});

socket.emit('battle:start', {
  roomCode: string
});

socket.emit('battle:answer', {
  roomCode: string,
  questionId: string,
  answer: string,
  timeTaken: number
});

socket.emit('battle:forfeit', {
  roomCode: string
});

socket.emit('battle:ping');
```

**Server → Client Events:**

```typescript
socket.on(
  'battle:state',
  (state: BattleRoomState) => {}
);

socket.on(
  'battle:player_joined',
  (player: PlayerState) => {}
);

socket.on(
  'battle:player_left',
  (userId: string) => {}
);

socket.on(
  'battle:started',
  (data: {
    questions: Question[],
    timeLimit: number
  }) => {}
);

socket.on(
  'battle:question',
  (data: {
    question: Question,
    index: number,
    total: number
  }) => {}
);

socket.on(
  'battle:opponent_progress',
  (data: {
    userId: string,
    questionIndex: number,
    score: number
  }) => {}
);

socket.on(
  'battle:answer_result',
  (data: {
    isCorrect: boolean,
    correctAnswer: string,
    explanation: string,
    xpEarned: number,
    currentScore: number
  }) => {}
);

socket.on(
  'battle:ended',
  (result: BattleResult) => {}
);

socket.on(
  'battle:error',
  (error: {
    code: string,
    message: string
  }) => {}
);
```

---

# 6.5 Presence Lifecycle

```text
User Login
    ↓
User enters DevArena
    ↓
Browser requests location permission
    ↓
User accepts
    ↓
Browser returns latitude/longitude
    ↓
POST/PATCH location to backend
    ↓
MongoDB stores GeoJSON Point
    ↓
Socket.IO presence connection
    ↓
User becomes ONLINE
    ↓
Nearby developers can discover user
```

When user leaves:

```text
Socket disconnect
    ↓
presence.isOnline = false
    ↓
lastSeenAt = now
```

A scheduled cleanup job removes stale presence.

---

# 6.6 Location Update Strategy

The frontend should **not send GPS coordinates every few milliseconds**.

Use:

```typescript
navigator.geolocation.watchPosition(...)
```

with reasonable configuration.

Location should only be updated when:

* user moves a meaningful distance
* sufficient time has passed
* accuracy is acceptable

Example:

```text
Minimum movement: 100–250 meters
Minimum update interval: 30–60 seconds
```

The exact values should be configurable.

---

# 6.7 Reconnection Handling

* Store `socket.id` → `userId` mapping in Redis.
* On reconnect, restore presence.
* Battle reconnection grace period: 30 seconds.
* Presence automatically becomes stale after timeout.
* Challenge notifications should also be persisted in MongoDB so an offline user can see them after returning.

---

# 7. Core Algorithms

## 7.1 Nearby Developer Search

MongoDB should use the `2dsphere` index.

Conceptually:

```javascript
User.find({
  'location.enabled': true,
  'settings.nearbyDevelopers': true,
  'location.coordinates': {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [
          longitude,
          latitude
        ]
      },
      $maxDistance: radiusInMeters
    }
  }
});
```

The coordinate order is:

```text
[longitude, latitude]
```

not:

```text
[latitude, longitude]
```

---

## 7.2 Privacy-Aware Coordinates

For approximate visibility:

```text
Actual coordinate
       ↓
Privacy transformation
       ↓
Rounded/grid coordinate
       ↓
Returned to nearby user
```

Example:

```text
Stored:
17.385044, 78.486671

Displayed:
17.3850, 78.4867
```

The actual privacy implementation should use a sufficiently large privacy radius/grid so the displayed point cannot be used to determine someone's exact location.

---

## 7.3 Developer Persona Algorithm

```typescript
type Persona =
  | 'The Architect'
  | 'The Night Owl'
  | 'The Polyglot'
  | 'The Builder'
  | 'The Open Source Warrior'
  | 'The Debugger'
  | 'The Consistent Coder'
  | 'The Weekend Warrior'
  | 'The Specialist'
  | 'The Explorer';

function calculatePersona(
  stats: GitHubStats
): {
  persona: Persona;
  reason: string
} {
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
    explorer: scoreExplorer(stats)
  };

  const top = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    persona: PERSONA_MAP[top[0]],
    reason: generateReason(top[0], stats)
  };
}
```

Each scoring function uses only GitHub metrics.

---

# 7.4 Badge Criteria

| Badge ID              | Name                | Criteria                          | Tier     | XP  |
| --------------------- | ------------------- | --------------------------------- | -------- | --- |
| `first_blood`         | First Blood         | Win first battle                  | Bronze   | 50  |
| `night_owl`           | Night Owl           | 100 commits between 22:00-04:00   | Silver   | 100 |
| `polyglot`            | Polyglot            | Active in 5+ languages            | Gold     | 150 |
| `consistency_king`    | Consistency King    | 30-day commit streak              | Gold     | 200 |
| `arena_regular`       | Arena Regular       | 50 battles played                 | Silver   | 100 |
| `win_streak_5`        | Hot Streak          | 5 consecutive wins                | Gold     | 150 |
| `win_streak_10`       | Unstoppable         | 10 consecutive wins               | Platinum | 300 |
| `open_source_warrior` | Open Source Warrior | 100 stars given + 50 forks        | Gold     | 200 |
| `bug_slayer`          | Bug Slayer          | 500 commits with fix/bug keywords | Silver   | 100 |
| `code_warrior`        | Code Warrior        | Level 25 reached                  | Diamond  | 500 |
| `wrapped_sharer`      | Storyteller         | Share Wrapped 3 times             | Bronze   | 50  |

---

# 8. GitHub Data Integration

## 8.1 Data Sources

| Data          | Source                               | Notes                        |
| ------------- | ------------------------------------ | ---------------------------- |
| User profile  | `GET /users/:username`               | Public                       |
| Repositories  | `GET /users/:username/repos`         | Paginated                    |
| Languages     | `GET /repos/:owner/:repo/languages`  | Per repo                     |
| Commits       | `GET /repos/:owner/:repo/commits`    | Public/authenticated         |
| Events        | `GET /users/:username/events/public` | Public activity              |
| Contributions | Contribution data                    | Public contribution activity |

### GitHub Location Limitation

GitHub profile information may contain a field such as:

```text
location: "Hyderabad, India"
```

This field is **not GPS data**.

DevArena must use it only as optional profile information.

It must **not** be converted into:

```text
latitude
longitude
```

for the Nearby Developers feature.

Actual location comes from:

```text
Browser Geolocation API
```

after explicit user permission.

---

# 8.2 Sync Strategy

* Initial sync: On first login.
* Incremental sync: Daily cron job.
* Manual sync: User-triggered Sync button.
* Respect GitHub API rate limits.
* Cache computed statistics.
* Store `lastSyncedAt`.

Location synchronization is completely separate from GitHub synchronization.

---

# 8.3 Required GitHub OAuth Scopes

```text
read:user
user:email
repo
```

`repo` is optional and should only be requested if private repository statistics are required.

---

# 9. Frontend Architecture Details

## 9.1 State Management

* **Auth:** React Context.
* **Socket:** Singleton Socket.IO client.
* **UI state:** Zustand.
* **Server state:** TanStack Query.
* **Location state:** Nearby feature hook + React Query.
* **Map state:** Local feature state.
* **Challenge state:** React Query + Socket.IO events.

---

# 9.2 Key Shared Components

```text
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

---

# 9.3 Nearby Developer Components

```text
features/nearby/components/

DeveloperMap.tsx
DeveloperMarker.tsx
DeveloperPreviewCard.tsx
NearbyDeveloperList.tsx
ChallengeDeveloperModal.tsx
LocationPermissionCard.tsx
MapFilters.tsx
```

### Developer Map

Responsibilities:

* Initialize MapCN.
* Display user's current location.
* Display nearby developers.
* Cluster markers when many developers exist.
* Handle marker selection.
* Open developer preview.
* Handle map movement.
* Trigger viewport/radius-based developer search.
* Respect privacy settings.

---

# 9.4 Developer Marker

Each marker represents a nearby developer.

Example marker:

```text
       ◉
   [Avatar]
```

Click:

```text
Marker
  ↓
DeveloperPreviewCard
```

---

# 9.5 Developer Preview Card

Example:

```text
┌─────────────────────────────────┐
│  [Avatar]  VivekJadhav2001      │
│            The Architect        │
│                                 │
│  Level 18                       │
│  TypeScript                     │
│                                 │
│  ⚔ 42 Wins   17 Losses         │
│  ● Online                       │
│  📍 ~2.4 km away                │
│                                 │
│  [ View Profile ]               │
│  [ ⚔ Challenge to Code Fight ] │
└─────────────────────────────────┘
```

---

# 9.6 Challenge Flow

```text
Nearby Developers
       ↓
Click Developer
       ↓
Developer Preview
       ↓
Challenge to Code Fight
       ↓
Challenge Modal
       ↓
Select:
  - Difficulty
  - Language
  - Time limit
  - Optional message
       ↓
Send Challenge
       ↓
Socket Notification
       ↓
Opponent
       ↓
Accept
       ↓
Battle Created
       ↓
Battle Room
```

---

# 9.7 Challenge Modal

```text
┌──────────────────────────────────┐
│ Challenge VivekJadhav2001        │
│                                  │
│ Difficulty                       │
│ [ Easy ] [ Medium ] [ Hard ]     │
│                                  │
│ Language                         │
│ [ JavaScript ▼ ]                 │
│                                  │
│ Time Limit                       │
│ [ 60 seconds ▼ ]                 │
│                                  │
│ Message                          │
│ [ Ready for a code fight? ]      │
│                                  │
│ [ Cancel ] [ Send Challenge ]    │
└──────────────────────────────────┘
```

---

# 9.8 Location Permission UX

When the user first enters Nearby Developers:

```text
┌──────────────────────────────────┐
│      Find Developers Near You    │
│                                  │
│ Discover developers around you   │
│ and challenge them to a code     │
│ fight.                           │
│                                  │
│ Your location is only used for   │
│ nearby discovery.                │
│                                  │
│ [ Enable Nearby Developers ]     │
│                                  │
│ Privacy: Approximate             │
└──────────────────────────────────┘
```

If permission is denied:

```text
Location access denied.

Nearby developer discovery requires
location permission.

[ Try Again ]
[ Continue Without Location ]
```

---

# 9.9 Design System

```javascript
module.exports = {

  darkMode: 'class',

  theme: {

    extend: {

      colors: {

        background: '#0a0a0f',
        surface: '#11131a',
        surfaceElevated: '#181b23',
        border: '#2a2e39',
        borderHover: '#3a3f4d',

        text: '#e4e6eb',
        textMuted: '#8b909a',
        textSubtle: '#5c616b',

        primary: '#00d4aa',
        primaryGlow: '#00d4aa40',

        secondary: '#7c5cff',
        secondaryGlow: '#7c5cff40',

        danger: '#ff4757',
        warning: '#ffa502',
        success: '#00d4aa'
      },

      fontFamily: {

        sans: [
          'Space Grotesk',
          'system-ui',
          'sans-serif'
        ],

        mono: [
          'JetBrains Mono',
          'monospace'
        ],

        display: [
          'Syne',
          'system-ui',
          'sans-serif'
        ]
      }
    }
  }
};
```

---

# 9.10 Page Specifications

## Landing Page (`/`)

* Hero: `"Your GitHub tells the story. DevArena proves it."`
* Animated background.
* GitHub login.
* Google login.
* Feature highlights:

  * DNA
  * Wrapped
  * Arena
  * Nearby Developers
  * Leaderboard
* Footer.

---

## Dashboard (`/dashboard`)

* Avatar
* Username
* Persona
* Level
* XP
* Global rank
* Stats cards
* DNA visualization
* Recent battles
* Badges
* Quick actions:

  * Enter Arena
  * Find Developers
  * View Wrapped
  * Sync GitHub

---

# 9.11 Nearby Developers Page (`/developers/nearby`)

The Nearby Developers page is a core DevArena feature.

### Main Layout

```text
┌───────────────────────────────────────────────────────┐
│ Nearby Developers                                     │
│                                                       │
│ [ Search ] [ Language ] [ Online ] [ Distance ]       │
├───────────────────────────────┬───────────────────────┤
│                               │                       │
│                               │ Developer Preview     │
│          MAP                  │                       │
│                               │ Avatar                │
│       ●        ●              │ Username              │
│                ●              │ Persona               │
│                               │ Level                 │
│          ●                    │ Battle Stats          │
│                               │                       │
│                               │ [Challenge]           │
│                               │                       │
└───────────────────────────────┴───────────────────────┘
```

### Features

* MapCN map.
* Current user location.
* Nearby developer markers.
* Marker clustering.
* Developer search.
* Filter by:

  * Language
  * Persona
  * Level
  * Online status
  * Distance
  * Battle availability
* Developer preview.
* Public profile link.
* Challenge button.
* Location visibility control.

---

# 9.12 Challenges Page (`/challenges`)

Tabs:

```text
[ Incoming ] [ Outgoing ] [ History ]
```

Incoming:

```text
VivekJadhav2001
The Architect
Medium • JavaScript

[ Decline ] [ Accept ]
```

Outgoing:

```text
developer123
The Debugger
Waiting for response...

[ Cancel ]
```

---

# 9.13 Arena Lobby (`/arena`)

* Create Battle modal.
* Join Battle modal.
* Active battles.
* Matchmaking.
* Recent challenges.
* Battle history.
* Quick action:

  * Find Nearby Developers.

---

# 9.14 Battle Room (`/battle/:roomCode`)

Split view:

```text
LEFT
Question
Code
Options
Timer

RIGHT
Opponent
Avatar
Username
Question
Score
Progress
Connection status
```

---

# 9.15 Battle Result

* Winner animation.
* Score comparison.
* Answer comparison.
* Time comparison.
* XP earned.
* Badges.
* Rematch.
* Back to Arena.
* Share result.

---

# 9.16 Leaderboard

* Rank.
* Avatar.
* Username.
* Persona.
* Level.
* XP.
* Wins.
* Badges.
* Pagination.
* Global / Weekly / Monthly filters.

---

# 9.17 Public Profile

```text
/u/:username
```

Includes:

* Avatar
* Username
* Persona
* Level
* Rank
* DNA
* GitHub statistics
* Languages
* Badges
* Battle history
* Public GitHub information
* Challenge button

---

# 9.18 Settings

Add:

### Nearby Developer Settings

```text
Nearby Developers
[ ON / OFF ]

Location Visibility
○ Hidden
○ Approximate
○ Exact

Allow Code Challenges
[ ON / OFF ]

Delete Stored Location
[ Remove Location Data ]
```

Recommended defaults:

```text
Nearby Developers: OFF
Visibility: Approximate
Allow Challenges: ON
```

---

# 10. Implementation Order

## Phase 0: Foundation (Week 1)

* [ ] Add missing dependencies.
* [ ] Set up Tailwind CSS.
* [ ] Configure ESLint/Prettier/TypeScript.
* [ ] Set up React Query.
* [ ] Create Axios instance.
* [ ] Create shared UI library.
* [ ] Implement Auth Context.
* [ ] Implement protected routes.
* [ ] Implement OAuth.

---

# Phase 1: User & GitHub Sync (Week 2)

* [ ] Extend User model.
* [ ] Build `github.service.js`.
* [ ] Build DNA service.
* [ ] Build GitHub synchronization.
* [ ] Create `/users/me`.
* [ ] Create `/users/me/sync-github`.
* [ ] Build Dashboard.
* [ ] Build DNA page.

---

# Phase 2: XP, Badges & Leaderboard (Week 3)

* [ ] Implement XP service.
* [ ] Implement level calculation.
* [ ] Create Badge model.
* [ ] Seed badges.
* [ ] Build badge evaluation.
* [ ] Build leaderboard API.
* [ ] Build leaderboard UI.
* [ ] Build Public Profile.

---

# Phase 3: GitHub Wrapped (Week 4)

* [ ] Build Wrapped aggregation.
* [ ] Build Wrapped slides.
* [ ] Add Framer Motion transitions.
* [ ] Implement share card.
* [ ] Implement PNG generation.
* [ ] Build Wrapped page.

---

# Phase 4: Nearby Developers (Week 5)

### Backend

* [ ] Add location fields to User model.
* [ ] Add MongoDB `2dsphere` index.
* [ ] Build `geo.service.js`.
* [ ] Build `presence.service.js`.
* [ ] Build location controller.
* [ ] Build nearby developer controller.
* [ ] Create location validation schemas.
* [ ] Create nearby developer API.
* [ ] Implement privacy-aware location transformation.
* [ ] Implement stale location cleanup.

### Frontend

* [ ] Install/configure MapCN.
* [ ] Configure selected map provider.
* [ ] Build `useGeolocation`.
* [ ] Request browser location permission.
* [ ] Build `DeveloperMap`.
* [ ] Build `DeveloperMarker`.
* [ ] Build `DeveloperPreviewCard`.
* [ ] Build nearby developer list.
* [ ] Add map filters.
* [ ] Add location permission UI.
* [ ] Add location privacy settings.
* [ ] Add mobile-responsive map UI.

---

# Phase 5: Developer Challenges (Week 6)

### Backend

* [ ] Create Challenge model.
* [ ] Create Challenge controller.
* [ ] Create Challenge service.
* [ ] Create Challenge routes.
* [ ] Add Zod challenge schemas.
* [ ] Add challenge rate limiting.
* [ ] Add duplicate challenge protection.
* [ ] Add challenge expiration.
* [ ] Add challenge cancellation.
* [ ] Add challenge acceptance.
* [ ] Create battle after acceptance.

### Socket.IO

* [ ] Create challenge namespace.
* [ ] Implement `challenge:received`.
* [ ] Implement `challenge:accepted`.
* [ ] Implement `challenge:declined`.
* [ ] Implement `challenge:expired`.
* [ ] Persist challenge notifications.

### Frontend

* [ ] Build Challenge modal.
* [ ] Build Challenge card.
* [ ] Build Challenge notification.
* [ ] Build Challenges page.
* [ ] Add incoming/outgoing/history tabs.
* [ ] Add Accept/Decline/Cancel actions.
* [ ] Connect challenge notifications to Socket.IO.
* [ ] Redirect both users to battle after acceptance.

---

# Phase 6: Arena & Battles (Week 7)

* [ ] Set up Socket.IO battle namespace.
* [ ] Build Battle model.
* [ ] Seed 50+ questions.
* [ ] Build battle state machine.
* [ ] Build Arena lobby.
* [ ] Build Battle Room.
* [ ] Implement real-time answers.
* [ ] Implement server-authoritative scoring.
* [ ] Implement battle result.
* [ ] Award XP.
* [ ] Award badges.
* [ ] Implement reconnection.

---

# Phase 7: Polish & Deploy (Week 8)

* [ ] Error boundaries.
* [ ] Loading states.
* [ ] Empty states.
* [ ] Mobile responsiveness.
* [ ] Accessibility audit.
* [ ] Performance optimization.
* [ ] Route-based code splitting.
* [ ] MongoDB index optimization.
* [ ] Redis integration.
* [ ] Socket.IO Redis adapter.
* [ ] Deploy frontend.
* [ ] Deploy backend.
* [ ] Configure production map provider.
* [ ] Configure HTTPS.
* [ ] Monitoring.

---

# 11. Risks & Mitigations

| Risk                       | Likelihood | Impact   | Mitigation                                       |
| -------------------------- | ---------- | -------- | ------------------------------------------------ |
| GitHub API rate limits     | High       | Medium   | Cache aggressively; batch requests               |
| Socket.IO scaling          | Medium     | High     | Redis adapter                                    |
| OAuth token storage        | Medium     | High     | Encrypt tokens at rest                           |
| Battle cheating            | Medium     | High     | Server-authoritative validation                  |
| Location privacy           | High       | Critical | Explicit opt-in; approximate default; deletion   |
| Exact location exposure    | High       | Critical | Never expose exact coordinates by default        |
| GitHub location misuse     | Medium     | Critical | Never derive GPS from GitHub profile location    |
| GPS accuracy               | Medium     | Medium   | Store accuracy and display approximate results   |
| Stale location             | Medium     | Medium   | `lastUpdatedAt` + expiration                     |
| Browser location denied    | Medium     | Medium   | Graceful fallback                                |
| Location spoofing          | Medium     | Medium   | Treat client coordinates as untrusted            |
| Dense map markers          | Medium     | Low      | Marker clustering                                |
| Challenge spam             | Medium     | High     | Rate limiting + duplicate protection             |
| Challenge abuse            | Medium     | High     | Allow challenges toggle + block/report mechanism |
| Wrapped generation         | Low        | Medium   | Optimize client/server generation                |
| MongoDB geospatial queries | Medium     | Medium   | `2dsphere` index + bounded radius                |
| Frontend bundle size       | Medium     | Low      | Lazy-load map and heavy libraries                |
| Solo developer maintenance | High       | High     | Strict module boundaries + tests                 |

---

# 12. Environment Variables

## Backend (`.env`)

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

# GitHub API
GITHUB_API_TOKEN=ghp_...

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=...
ENCRYPTION_KEY=...
```

## Frontend (`.env`)

```env
VITE_BACKEND_URL=http://localhost:2001/api/v1
VITE_SOCKET_URL=http://localhost:2001
VITE_APP_URL=http://localhost:5173

# MapCN / selected map provider
VITE_MAP_PROVIDER=...
VITE_MAP_TOKEN=...
```

> MapCN/provider environment variables should match the specific MapCN-compatible provider selected during implementation. Never commit map provider secrets to Git.

---

# 13. Testing Strategy

| Layer       | Tool                  | Coverage Target |
| ----------- | --------------------- | --------------- |
| Unit        | Vitest                | 80%             |
| Integration | Supertest + Vitest    | 60%             |
| E2E         | Playwright            | 15+ scenarios   |
| Component   | React Testing Library | Key components  |

### Critical Flows

1. OAuth login → session → protected route.
2. GitHub sync → DNA → persona.
3. Create battle → join → answer → result → XP.
4. Wrapped generation → share card.
5. Leaderboard pagination.
6. Enable location → browser permission → location saved.
7. Nearby developers → MongoDB geospatial query → MapCN markers.
8. Click developer marker → preview card.
9. Challenge developer → Socket.IO notification.
10. Accept challenge → battle created.
11. Decline challenge → challenge closed.
12. Cancel pending challenge.
13. Challenge expiration.
14. Disable location → user disappears from nearby search.
15. Approximate location never exposes exact coordinates.
16. Offline user receives persisted challenge after returning.
17. Stale presence automatically becomes offline.

---

# 14. Deployment Architecture

```text
                    ┌─────────────────────┐
                    │      Vercel         │
                    │     Frontend        │
                    │                     │
                    │ React + Vite        │
                    │ MapCN                │
                    └──────────┬──────────┘
                               │
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │ Render / Railway    │
                    │                     │
                    │ Node.js + Express   │
                    │ Socket.IO           │
                    └───────┬─────┬───────┘
                            │     │
                  ┌─────────┘     └─────────┐
                  ▼                         ▼
        ┌─────────────────┐       ┌─────────────────┐
        │ MongoDB Atlas   │       │ Redis / Upstash │
        │                 │       │                 │
        │ User            │       │ Socket adapter  │
        │ Location        │       │ Presence        │
        │ Battles         │       │ Rate limits     │
        │ Challenges      │       │ Sessions        │
        └─────────────────┘       └─────────────────┘
```

### Map Architecture

```text
Browser
   │
   ├── Geolocation API
   │        │
   │        └── User coordinates
   │
   ▼
DevArena Backend
   │
   ├── Validate coordinates
   ├── Check privacy settings
   ├── MongoDB $near query
   │
   ▼
Nearby Developers
   │
   ▼
MapCN
   │
   ├── Developer markers
   ├── User location
   ├── Clustering
   └── Preview cards
```

### Security Requirements

Production must use:

```text
HTTPS
```

because browser geolocation requires a secure context.

The backend must never trust client coordinates blindly.

Apply:

* authentication
* Zod validation
* rate limiting
* coordinate sanity checks
* privacy transformations
* stale location expiration
* challenge rate limiting

---

# 15. Location & Privacy Architecture

## 15.1 Location Source

The source of physical location is:

```text
Browser / Device Geolocation API
```

not GitHub.

---

## 15.2 GitHub's Role

GitHub provides:

```text
Identity
Username
Avatar
Repositories
Languages
Commits
Stars
Forks
Contribution information
```

GitHub's optional profile location is treated as:

```text
Human-readable profile information
```

and not:

```text
GPS coordinates
```

---

## 15.3 Location Visibility

### Hidden

```text
User cannot appear on Nearby Developers.
```

### Approximate

```text
User appears on Nearby Developers
but their exact physical position is protected.
```

### Exact

```text
User explicitly allows exact location
to be displayed to nearby users.
```

The application should strongly recommend:

```text
Approximate
```

for normal use.

---

# 15.4 Location Deletion

When the user selects:

```text
Remove Location Data
```

the backend must:

1. Set `location.enabled = false`.
2. Remove coordinates.
3. Remove accuracy.
4. Remove `lastUpdatedAt`.
5. Remove the user from nearby results.
6. Stop broadcasting location updates.
7. Mark presence appropriately.

---

# 15.5 Location Expiration

A developer should not remain permanently visible because of an old GPS coordinate.

Example:

```text
No location update
       ↓
30 minutes
       ↓
Location considered stale
       ↓
Remove from Nearby Developers
```

The exact timeout should be configurable.

---

# 16. Developer Challenge Architecture

## Challenge Lifecycle

```text
PENDING
   │
   ├── ACCEPTED
   │      │
   │      ▼
   │    BATTLE
   │
   ├── DECLINED
   │
   ├── CANCELLED
   │
   └── EXPIRED
```

## Complete User Flow

```text
Developer A
     │
     ▼
Nearby Developers
     │
     ▼
Developer B Marker
     │
     ▼
Developer B Preview
     │
     ▼
Challenge to Code Fight
     │
     ▼
Configure Challenge
     │
     ▼
POST /challenges
     │
     ▼
Challenge created
     │
     ├───────────────┐
     │               │
     ▼               ▼
MongoDB          Socket.IO
                    │
                    ▼
              Developer B
                    │
              ┌─────┴─────┐
              ▼           ▼
           Accept       Decline
              │
              ▼
        Create Battle
              │
              ▼
         Battle Room
              │
              ▼
          Code Fight
              │
              ▼
          Battle Result
              │
              ▼
          XP + Badges
```

---

# 17. Abuse Prevention

The Nearby Developer feature must not become a spam platform.

### Challenge Rate Limit

Example:

```text
Maximum:
10 challenges / hour
```

Configurable through backend constants.

### Duplicate Protection

Do not allow:

```text
A → B pending
A → B pending
A → B pending
```

Only one pending challenge should exist between two users.

### Self Challenge

Reject:

```text
A → A
```

### Expiration

Pending challenges automatically expire.

Example:

```text
Challenge created
      ↓
10 minutes
      ↓
EXPIRED
```

### User Controls

Users can disable:

```text
Nearby Developers
Allow Challenges
```

---

# 18. Security Considerations

## Location Security

Never expose:

* raw location unnecessarily
* location history
* historical coordinates
* coordinates of users who disabled sharing

Never store:

```text
Location history
```

unless there is a future explicit feature requiring it.

Only the latest location is required.

---

## GitHub Security

Never expose:

```text
GITHUB_CLIENT_SECRET
GITHUB_API_TOKEN
OAuth access tokens
SESSION_SECRET
ENCRYPTION_KEY
```

to the frontend.

---

# 19. Performance Requirements

## Nearby Developer Queries

Limit:

```text
Maximum radius
Maximum results
Viewport-based queries
```

Example:

```text
Default radius: 10 km
Maximum radius: 50 km
Maximum results: 100
```

These should be configurable.

---

## Map Performance

Use:

* lazy loading
* marker clustering
* viewport-based fetching
* debounced map movement
* cached developer results

Do not request the entire developer database.

---

# 20. Code Conventions

## Backend

* **Files:** `kebab-case.js`
* **Functions:** `camelCase`
* **Constants:** `SCREAMING_SNAKE_CASE`
* **Database:** `snake_case`
* **Models:** `PascalCase`
* **Errors:** `ApiError`
* **Async:** `try/catch` → `next(error)`

## Frontend

* **Files:** `PascalCase.tsx`
* **Utilities:** `camelCase.ts`
* **Components:** Functional + TypeScript interfaces
* **Hooks:** `usePrefix`
* **Types:** Shared or feature-specific
* **Styling:** Tailwind
* **State:** React Query + Zustand
* **Map:** Isolated inside `features/nearby`

---

# 21. Final Feature Architecture

The new DevArena feature can be summarized as:

```text
                    DEVARENA
                       │
          ┌────────────┴────────────┐
          │                         │
       GitHub                   Geolocation
          │                         │
          ▼                         ▼
   Developer DNA              Actual Location
   GitHub Stats                User Permission
   Persona                     Privacy Setting
          │                         │
          └────────────┬────────────┘
                       ▼
               Nearby Developers
                       │
                       ▼
                    MapCN
                       │
          ┌────────────┼────────────┐
          │            │            │
       Developer    Developer    Developer
        Marker       Marker       Marker
          │
          ▼
    Preview Profile
          │
          ▼
   Challenge to Code Fight
          │
          ▼
      Challenge API
          │
          ▼
      Socket.IO
          │
          ▼
    Opponent Notification
          │
          ▼
       ACCEPT
          │
          ▼
     Create Battle
          │
          ▼
      Battle Room
          │
          ▼
      Code Fight
          │
          ▼
     Result + XP
          │
          ▼
       Badges
```

---

# 22. Next Immediate Steps

1. **Install dependencies** in both `backend/` and `frontend/`.
2. **Configure Tailwind** and the DevArena design system.
3. **Implement GitHub OAuth**.
4. **Extend User model** with DevArena profile fields.
5. **Build GitHub service** with rate-limited API client.
6. **Implement DNA calculation** as pure functions.
7. **Create Dashboard + DNA APIs**.
8. **Build Dashboard + DNA pages**.
9. **Implement browser Geolocation API**.
10. **Add MongoDB `2dsphere` location index**.
11. **Build `geo.service.js` and nearby developer API**.
12. **Integrate MapCN**.
13. **Build Nearby Developers page**.
14. **Build developer marker + preview card**.
15. **Build Challenge model + API**.
16. **Add Socket.IO challenge notifications**.
17. **Implement Accept → Battle creation**.
18. **Connect challenge flow to the existing Arena/Battle system**.
19. **Add location privacy controls**.
20. **Test location, challenge and battle flows end-to-end**.

---

*End of Specification*

**Next Action:** Begin Phase 0 implementation, followed by GitHub integration and the Nearby Developers + Code Challenge architecture.
