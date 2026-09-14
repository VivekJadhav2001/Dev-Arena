import type { IBattleStats, IGitHubStats, ILeetCodeStats } from "../models/user.model.js";
import type { Persona } from "../utils/constants.js";

/**
 * Tri-source Developer DNA.
 *
 * Deterministic + explainable: same stored stats always produce the same
 * scores. No AI, no randomness, no wall-clock reads inside scoring.
 *
 * - Builder   <- GitHub (commits, repos, streak/consistency, OSS score, languages)
 * - Solver    <- LeetCode (solved volume, difficulty mix, contest rating, regularity)
 * - Competitor<- Battles (experience, smoothed win rate, streak, avg score + quiz/coding split)
 * - Versatility <- balance of the three (100 - range). Level-agnostic on purpose:
 *   a balanced 20/20/20 is versatile but NOT an All-Rounder (that needs level too).
 */

export interface DuelBreakdown {
  quizAccuracy: number | null;
  codingSolveRate: number | null;
  quizAnswered: number;
  quizCorrect: number;
  codingAnswered: number;
  codingSolved: number;
  battlesSampled: number;
}

export interface DnaCoverage {
  hasGitHub: boolean;
  hasLeetCode: boolean;
  hasBattles: boolean;
  sources: number;
}

export interface DnaDimensionDetail {
  score: number;
  label: string;
  summary: string;
  parts: Record<string, number>;
}

export interface DnaVitality {
  commits: number;
  solves: number;
  battles: number;
  /** Days since the most recent stored activity (sync or battle). Null = dormant. */
  daysSinceActive: number | null;
  /** 0-100 visual tempo for the helix. Time-varying by design — NOT a score. */
  energy: number;
  /** 12-110, deterministic from volume: 12 + commits/25 + solves/6 + battles*2. */
  rungCount: number;
  lastActiveLabel: string;
}

export interface DeveloperDNA {
  persona: Persona;
  personaReason: string;
  scores: Record<string, number>;
  traits: Array<{ label: string; score: number }>;
  languageProfile: Record<string, number>;
  activityHeatmap: Array<{ day: string; count: number }>;
  updatedAt: Date;
  // New tri-source fields (additive — old clients keep reading scores/traits).
  versatility: number;
  coverage: DnaCoverage;
  breakdown: {
    builder: DnaDimensionDetail;
    solver: DnaDimensionDetail;
    competitor: DnaDimensionDetail;
  };
  signals: string[];
  vitality: DnaVitality;
  /** One deterministic flavor line derived from the trait combination. */
  flavor: string;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const num = (value: unknown, fallback = 0) => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return n;
};

function languageEntries(languages: IGitHubStats["languages"]): Array<[string, number]> {
  if (languages instanceof Map) return [...languages.entries()];
  if (languages && typeof languages === "object") return Object.entries(languages as Record<string, number>);
  return [];
}

// ---------------------------------------------------------------- Builder ---

export function calculateBuilderScore(github: IGitHubStats): DnaDimensionDetail {
  const g = github ?? ({} as IGitHubStats);
  const totalCommits = num(g.totalCommits);
  const totalRepos = num(g.totalRepos);
  const followers = num(g.followers);
  const stars = num(g.stars);
  const entries = languageEntries(g.languages);
  const languageCount = entries.length;
  const consistency = g.codingConsistency ?? null;
  const longestStreak = num(g.longestStreak);
  const openSource = g.openSourceScore ?? null;

  // Shipping (40%): commits carry, repos support. 400 commits -> 100, 17 repos -> 100.
  const commitScore = clamp(totalCommits / 4);
  const repoScore = clamp(totalRepos * 6);
  const shipping = clamp(commitScore * 0.65 + repoScore * 0.35);

  // Rhythm (25%): % of last 90 days active, else streak-derived fallback.
  const rhythm = consistency != null ? clamp(consistency) : clamp(longestStreak * 12);

  // Influence (20%): stored OSS score, else stars+followers fallback.
  const influence = openSource != null ? clamp(openSource) : clamp(stars * 2 + followers * 2);

  // Breadth (15%): 5 languages saturates.
  const breadth = clamp(languageCount * 22);

  const score = clamp(shipping * 0.4 + rhythm * 0.25 + influence * 0.2 + breadth * 0.15);
  return {
    score,
    label: "Builder",
    summary: `${totalCommits} commits across ${totalRepos} repos, ${languageCount} languages`,
    parts: { shipping, rhythm, influence, breadth },
  };
}

// ---------------------------------------------------------------- Solver ----

export function calculateSolverScore(leetcode: ILeetCodeStats | null | undefined): DnaDimensionDetail {
  const lc = leetcode ?? null;
  const totalSolved = num(lc?.totalSolved);
  const easy = num(lc?.easySolved);
  const medium = num(lc?.mediumSolved);
  const hard = num(lc?.hardSolved);
  const rating = lc?.contestRating ?? null;
  const contestsAttended = num(lc?.contestsAttended);
  const topPct = lc?.contestTopPercentage ?? null;
  const activeDays = num(lc?.totalActiveDays);
  const streak = num(lc?.streak);

  const connected = (lc?.username ?? null) != null || totalSolved > 0 || contestsAttended > 0 || rating != null;
  if (!connected) {
    return {
      score: 0,
      label: "Solver",
      summary: "No LeetCode connected",
      parts: { volume: 0, difficultyMix: 0, contest: 0, regularity: 0 },
    };
  }

  // Volume (45%): hard problems weigh 5x an easy. ~625 weighted points -> ~78.
  const weighted = easy * 1 + medium * 2.5 + hard * 5;
  const volume = clamp(weighted / 8);

  // Difficulty mix (30%): rewards pushing into medium/hard, plus a depth bonus.
  const total = Math.max(1, totalSolved);
  const hardShare = hard / total;
  const medShare = medium / total;
  const difficultyMix = clamp(hardShare * 200 + medShare * 80 + (totalSolved >= 100 ? 15 : 0));

  // Contest (15%): rating-anchored; attendance alone earns partial credit.
  let contest = 0;
  if (rating != null) {
    contest = clamp((rating - 1000) / 15);
    if (topPct != null && topPct <= 10) contest = clamp(contest + 15);
    else if (topPct != null && topPct <= 25) contest = clamp(contest + 10);
  } else {
    contest = clamp(contestsAttended * 8);
  }

  // Regularity (10%): sustained solving habit.
  const regularity = clamp(num(lc?.totalActiveDays) >= 0 ? Math.min(100, activeDays / 3) * 0.5 + Math.min(100, streak * 8) * 0.5 : 0);

  const score = clamp(volume * 0.45 + difficultyMix * 0.3 + contest * 0.15 + regularity * 0.1);
  return {
    score,
    label: "Solver",
    summary: `${totalSolved} solved (${easy}E/${medium}M/${hard}H)${rating != null ? `, rating ${rating}` : ""}`,
    parts: { volume, difficultyMix, contest, regularity },
  };
}

// ------------------------------------------------------------ Competitor ----

export function calculateCompetitorScore(
  battle: IBattleStats | null | undefined,
  duel: DuelBreakdown | null | undefined,
): DnaDimensionDetail {
  const b = battle ?? null;
  const total = num(b?.totalBattles);
  const wins = num(b?.wins);
  const draws = num(b?.draws);
  const winStreak = num(b?.winStreak);
  const bestWinStreak = num(b?.bestWinStreak);
  const avgScore = num(b?.avgScore);

  if (!b || total <= 0) {
    return {
      score: 0,
      label: "Competitor",
      summary: "No battles played yet",
      parts: { experience: 0, winRate: 0, streak: 0, performance: 0 },
    };
  }

  // Experience (25%): 10 battles saturates — veterans aren't boosted forever.
  const experience = clamp(total * 10);

  // Win rate (35%): Laplace-smoothed toward 50 so a 1-0 debut isn't 100.
  // (wins + 2) / (total + 4) * 100. Draws count as half a win.
  const smoothed = ((wins + draws * 0.5 + 2) / (total + 4)) * 100;
  const winRate = clamp(smoothed);

  // Streak (15%): best streak carries, current streak adds a spark.
  const streak = clamp(bestWinStreak * 22 + winStreak * 3);

  // Performance (25%): avg battle score scaled to a ~300pt ceiling, blended
  // with the quiz/coding split when battle history is available.
  const scoreBased = clamp(avgScore / 2.8);
  let performance = scoreBased;
  const parts: Record<string, number> = { experience, winRate, streak, performance: scoreBased };
  if (duel && (duel.quizAccuracy != null || duel.codingSolveRate != null)) {
    const quiz = duel.quizAccuracy ?? scoreBased;
    const coding = duel.codingSolveRate ?? scoreBased;
    performance = clamp(scoreBased * 0.6 + quiz * 0.2 + coding * 0.2);
    parts.performance = performance;
    parts.quizAccuracy = duel.quizAccuracy ?? 0;
    parts.codingSolveRate = duel.codingSolveRate ?? 0;
  }

  const score = clamp(experience * 0.25 + winRate * 0.35 + streak * 0.15 + performance * 0.25);
  const winPct = Math.round(((wins + draws * 0.5) / Math.max(1, total)) * 100);
  return {
    score,
    label: "Competitor",
    summary: `${winPct}% win rate over ${total} battles, best streak ${bestWinStreak}`,
    parts,
  };
}

export function calculateVersatility(builder: number, solver: number, competitor: number): number {
  const values = [clamp(builder), clamp(solver), clamp(competitor)];
  const range = Math.max(...values) - Math.min(...values);
  return clamp(100 - range * 1.2);
}

// --------------------------------------------------------------- Vitality ---

/**
 * Visual-tempo metadata for the helix. Scores stay frozen in time;
 * vitality intentionally reflects recency so the visual feels alive.
 */
export function calculateVitality(
  github: IGitHubStats,
  leetcode: ILeetCodeStats | null | undefined,
  battle: IBattleStats | null | undefined,
  lastActiveAt: Date | string | null | undefined,
  now: Date = new Date(),
): DnaVitality {
  const commits = num(github?.totalCommits);
  const solves = num(leetcode?.totalSolved);
  const battles = num(battle?.totalBattles);
  const candidates: number[] = [];
  const pushDate = (d: unknown) => {
    if (d instanceof Date && !Number.isNaN(d.getTime())) candidates.push(d.getTime());
    else if (typeof d === "string" && d.length > 0) {
      const t = new Date(d).getTime();
      if (Number.isFinite(t)) candidates.push(t);
    }
  };
  pushDate(github?.lastSyncedAt);
  pushDate(leetcode?.lastSyncedAt);
  pushDate(lastActiveAt);
  let daysSinceActive: number | null = null;
  if (candidates.length > 0) {
    const mostRecent = Math.max(...candidates);
    const diff = now.getTime() - mostRecent;
    daysSinceActive = diff <= 0 ? 0 : Math.floor(diff / 86400000);
  }
  const energy =
    daysSinceActive == null ? 5 : Math.max(8, Math.round(100 * Math.exp(-daysSinceActive / 12)));
  const rungCount = Math.max(12, Math.min(110, 12 + Math.floor(commits / 25) + Math.floor(solves / 6) + battles * 2));
  const lastActiveLabel =
    daysSinceActive == null
      ? "dormant"
      : daysSinceActive <= 0
        ? "today"
        : daysSinceActive === 1
          ? "yesterday"
          : daysSinceActive < 30
            ? `${daysSinceActive}d ago`
            : `${Math.floor(daysSinceActive / 7)}w ago`;
  return { commits, solves, battles, daysSinceActive, energy, rungCount, lastActiveLabel };
}

export function flavorForDna(persona: Persona, builder: number, solver: number, competitor: number): string {
  switch (persona) {
    case "The All-Rounder":
      return "Ships, solves, and spars — no off-season.";
    case "The Shipper-Duelist":
      return "Ships by day, duels by night.";
    case "The Arena Scholar":
      return "Practice-ground depth that survives the clock.";
    case "The Grinder":
      return "One more problem. Every day.";
    case "The Duelist":
      return "Calm in practice, electric head-to-head.";
    case "The Architect":
      return "Designs systems, then outlasts them.";
    case "The Polyglot":
      return "Fluent in many tongues, curious in all of them.";
    case "The Consistent Coder":
      return "Streaks are just promises you keep to yourself.";
    case "The Open Source Warrior":
      return "Builds in public, lifts everyone up.";
    case "The Specialist":
      if (Math.max(builder, solver, competitor) < 40) return "Depth is forming — keep feeding one fire.";
      return "Deep in one craft, widening everywhere else.";
    case "The Explorer":
    default: {
      if (builder >= solver && builder >= competitor && builder >= 15) return "Momentum through shipping.";
      if (solver >= builder && solver >= competitor && solver >= 15) return "Curiosity, compiled daily.";
      if (competitor >= builder && competitor >= solver && competitor >= 15) return "You come alive head-to-head.";
      return "Every commit is a breadcrumb — follow them.";
    }
  }
}

// ---------------------------------------------------------------- Persona ---

interface PersonaContext {
  languageCount: number;
  topLanguage: string | null;
  rhythm: number;
  influence: number;
  totalSolved: number;
  contestRating: number | null;
  totalBattles: number;
  quizAccuracy: number | null;
  codingSolveRate: number | null;
}

function derivePersona(
  builder: number,
  solver: number,
  competitor: number,
  versatility: number,
  ctx: PersonaContext,
): { persona: Persona; personaReason: string } {
  const B = builder;
  const S = solver;
  const C = competitor;
  const V = versatility;
  const min3 = Math.min(B, S, C);
  const avg = Math.round((B + S + C) / 3);

  const duelEdge =
    ctx.quizAccuracy != null && ctx.codingSolveRate != null
      ? ctx.codingSolveRate > ctx.quizAccuracy + 15
        ? ` Stronger on code (${ctx.codingSolveRate}%) than quiz (${ctx.quizAccuracy}%) under pressure.`
        : ctx.quizAccuracy > ctx.codingSolveRate + 15
          ? ` Sharper on quiz (${ctx.quizAccuracy}%) than code (${ctx.codingSolveRate}%) under pressure.`
          : ` Even split between quiz (${ctx.quizAccuracy}%) and code (${ctx.codingSolveRate}%).`
      : "";

  // 0 — cold start.
  if (B < 15 && S < 15 && C < 15) {
    return {
      persona: "The Explorer",
      personaReason:
        "Fresh profile with little stored signal yet. Connect GitHub and LeetCode and play a battle to reveal your DNA.",
    };
  }

  // 1 — true all-rounder: strong everywhere AND balanced.
  if ((min3 >= 60 && V >= 65) || avg >= 78) {
    return {
      persona: "The All-Rounder",
      personaReason: `Builder ${B}, Solver ${S}, Competitor ${C} — strong on all three fronts with versatility ${V}. Ships, solves, and wins.${duelEdge}`,
    };
  }

  // 2 — hybrid spikes (need two highs + a clear laggard).
  if (B >= 65 && C >= 65 && S < 50) {
    return {
      persona: "The Shipper-Duelist",
      personaReason: `Builder ${B} (ships often) plus Competitor ${C} (wins duels) outweigh Solver ${S} (algorithm depth). You deliver and you duel.${duelEdge}`,
    };
  }
  if (B >= 65 && S >= 65 && C < 50) {
    return {
      persona: "The Architect",
      personaReason: `Builder ${B} plus Solver ${S} with only Competitor ${C} so far. You design systems and crack hard problems — the arena hasn't seen you yet.`,
    };
  }
  if (S >= 65 && C >= 65 && B < 50) {
    return {
      persona: "The Arena Scholar",
      personaReason: `Solver ${S} (${ctx.totalSolved} LeetCode solves${ctx.contestRating != null ? `, rating ${ctx.contestRating}` : ""}) plus Competitor ${C} across ${ctx.totalBattles} battles. Theory that survives the clock.${duelEdge}`,
    };
  }

  // 3 — mid hybrids (55+ pairs still read as a blend, not a solo).
  if (B >= 55 && S >= 55 && C < 45) {
    return {
      persona: "The Architect",
      personaReason: `Balanced craft: Builder ${B} and Solver ${S}. You build steadily and solve methodically.`,
    };
  }
  if (B >= 55 && C >= 55 && S < 45) {
    return {
      persona: "The Shipper-Duelist",
      personaReason: `Builder ${B} meets Competitor ${C} over ${ctx.totalBattles} battles. You ship under calm and fight under pressure.${duelEdge}`,
    };
  }
  if (S >= 55 && C >= 55 && B < 45) {
    return {
      persona: "The Arena Scholar",
      personaReason: `Solver ${S} plus Competitor ${C}. Practice-ground depth that converts into live wins.${duelEdge}`,
    };
  }

  // 4 — solo spikes.
  if (S >= 60 && B < 55 && C < 45) {
    return {
      persona: "The Grinder",
      personaReason: `Solver ${S} dominates (${ctx.totalSolved} solves) while Builder ${B} and Competitor ${C} trail. Relentless problem-by-problem progress.`,
    };
  }
  if (C >= 60 && B < 55 && S < 50) {
    return {
      persona: "The Duelist",
      personaReason: `Competitor ${C} across ${ctx.totalBattles} battles leads the profile. You peak when someone is across the board.${duelEdge}`,
    };
  }

  // 5 — GitHub-only nuance (Solver 0, Competitor 0): preserve legacy readings.
  if (S < 15 && C < 15) {
    if (ctx.languageCount >= 4)
      return {
        persona: "The Polyglot",
        personaReason: `You work across ${ctx.languageCount} languages (Builder ${B}). Breadth is your clearest signal.`,
      };
    if (ctx.rhythm >= 60)
      return {
        persona: "The Consistent Coder",
        personaReason: `Coding rhythm ${ctx.rhythm} powers Builder ${B}. Streaks and steady output define you.`,
      };
    if (ctx.influence >= 65)
      return {
        persona: "The Open Source Warrior",
        personaReason: `Open-source influence ${ctx.influence} leads Builder ${B}. Repos, stars and followers show real impact.`,
      };
    if (B >= 45)
      return {
        persona: "The Builder",
        personaReason: `Builder ${B}: repository and commit activity shows a strong habit of shipping.`,
      };
    if (ctx.topLanguage)
      return {
        persona: "The Specialist",
        personaReason: `${ctx.topLanguage} is the clearest signal in your current GitHub profile (Builder ${B}).`,
      };
    return {
      persona: "The Explorer",
      personaReason: `Builder ${B} with growing signals. Keep pushing — your pattern is still forming.`,
    };
  }

  // 6 — Builder solo (with arena/leetcode present but quiet).
  if (B >= 60 && B >= S && B >= C) {
    return {
      persona: "The Builder",
      personaReason: `Builder ${B} leads Solver ${S} and Competitor ${C}. Shipping is your superpower.`,
    };
  }

  // 7 — balanced middle that isn't strong enough for All-Rounder.
  if (V >= 70 && avg >= 40) {
    return {
      persona: "The Specialist",
      personaReason: `Versatility ${V} with Builder ${B}, Solver ${S}, Competitor ${C}. No single spike yet — depth is forming evenly${ctx.topLanguage ? ` around ${ctx.topLanguage}` : ""}.`,
    };
  }

  // 8 — highest trait wins.
  if (B >= S && B >= C) {
    if (ctx.topLanguage && B < 45)
      return {
        persona: "The Specialist",
        personaReason: `${ctx.topLanguage} leans your Builder ${B} ahead of Solver ${S} and Competitor ${C}.`,
      };
    return {
      persona: "The Builder",
      personaReason: `Builder ${B} edges Solver ${S} and Competitor ${C}. Momentum through shipping.`,
    };
  }
  if (S >= B && S >= C)
    return {
      persona: "The Grinder",
      personaReason: `Solver ${S} leads Builder ${B} and Competitor ${C}. One more problem, every day.`,
    };
  return {
    persona: "The Duelist",
    personaReason: `Competitor ${C} leads Builder ${B} and Solver ${S}. You come alive head-to-head.${duelEdge}`,
  };
}

// ----------------------------------------------------------------- Entry ----

export function calculateDNA(
  github: IGitHubStats,
  leetcode?: ILeetCodeStats | null,
  battle?: IBattleStats | null,
  duel?: DuelBreakdown | null,
  lastActiveAt?: Date | string | null,
): DeveloperDNA {
  const builder = calculateBuilderScore(github);
  const solver = calculateSolverScore(leetcode ?? null);
  const competitor = calculateCompetitorScore(battle ?? null, duel ?? null);
  const versatility = calculateVersatility(builder.score, solver.score, competitor.score);

  const entries = languageEntries(github?.languages);
  const total = entries.reduce((sum, [, bytes]) => sum + num(bytes), 0) || 1;
  const languageProfile = Object.fromEntries(
    entries.map(([name, bytes]) => [name, clamp((num(bytes) / total) * 100)]),
  );
  const activityHeatmap = Array.isArray(github?.activityCalendar)
    ? github.activityCalendar.map((d) => ({ day: d.day, count: num(d.count) }))
    : [];

  const hasGitHub = num(github?.totalCommits) > 0 || num(github?.totalRepos) > 0 || entries.length > 0;
  const hasLeetCode =
    (leetcode?.username ?? null) != null || num(leetcode?.totalSolved) > 0 || num(leetcode?.contestsAttended) > 0;
  const hasBattles = num(battle?.totalBattles) > 0;
  const coverage: DnaCoverage = {
    hasGitHub,
    hasLeetCode,
    hasBattles,
    sources: (hasGitHub ? 1 : 0) + (hasLeetCode ? 1 : 0) + (hasBattles ? 1 : 0),
  };

  const { persona, personaReason } = derivePersona(builder.score, solver.score, competitor.score, versatility, {
    languageCount: entries.length,
    topLanguage: github?.topLanguage ?? null,
    rhythm: builder.parts.rhythm ?? 0,
    influence: builder.parts.influence ?? 0,
    totalSolved: num(leetcode?.totalSolved),
    contestRating: leetcode?.contestRating ?? null,
    totalBattles: num(battle?.totalBattles),
    quizAccuracy: duel?.quizAccuracy ?? null,
    codingSolveRate: duel?.codingSolveRate ?? null,
  });

  const signals: string[] = [];
  if (!hasLeetCode) signals.push("Connect LeetCode to sharpen your Solver score.");
  if (!hasBattles) signals.push("Play an arena battle to reveal your Competitor score.");
  if (!hasGitHub) signals.push("Sync GitHub to grow your Builder score.");
  if (versatility >= 70 && Math.min(builder.score, solver.score, competitor.score) < 60)
    signals.push("Balanced profile — push your lowest trait to reach All-Rounder.");

  const vitality = calculateVitality(github, leetcode ?? null, battle ?? null, lastActiveAt ?? null);
  const flavor = flavorForDna(persona, builder.score, solver.score, competitor.score);

  return {
    persona,
    personaReason,
    scores: {
      builder: builder.score,
      solver: solver.score,
      competitor: competitor.score,
      versatility,
    },
    traits: [
      { label: "Builder", score: builder.score },
      { label: "Solver", score: solver.score },
      { label: "Competitor", score: competitor.score },
      { label: "Versatility", score: versatility },
    ],
    languageProfile,
    activityHeatmap,
    updatedAt: new Date(),
    versatility,
    coverage,
    breakdown: { builder, solver, competitor },
    signals,
    vitality,
    flavor,
  };
}
