import { User, type ILeetCodeStats } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";
const REQUEST_TIMEOUT_MS = 15000;

/** LeetCode usernames: letters, numbers, underscore, hyphen. */
export const LEETCODE_USERNAME_PATTERN = /^[\w-]{1,30}$/;

interface AcCount {
  difficulty: string;
  count: number;
}

interface RawResponse {
  data?: {
    matchedUser?: {
      username: string;
      profile?: { ranking?: number | null };
      submitStatsGlobal?: { acSubmissionNum?: AcCount[] };
      languageProblemCount?: Array<{ languageName: string; problemsSolved: number }>;
      tagProblemCounts?: {
        advanced?: Array<{ tagName: string; problemsSolved: number }>;
        intermediate?: Array<{ tagName: string; problemsSolved: number }>;
        fundamental?: Array<{ tagName: string; problemsSolved: number }>;
      };
      userCalendar?: { streak?: number; totalActiveDays?: number; submissionCalendar?: string };
      badges?: Array<{ displayName?: string; icon?: string | null; creationDate?: string | null }>;
    } | null;
    userContestRanking?: {
      rating?: number | null;
      globalRanking?: number | null;
      attendedContestsCount?: number;
      topPercentage?: number | null;
      badge?: { name?: string | null } | null;
    } | null;
    recentAcSubmissionList?: Array<{
      title: string;
      titleSlug: string;
      timestamp: string;
      lang: string;
    }> | null;
  };
  errors?: Array<{ message?: string }>;
}

const PROFILE_QUERY = `
query leetcodeProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
    userCalendar { streak totalActiveDays submissionCalendar }
    badges { displayName icon creationDate }
  }
  userContestRanking(username: $username) {
    rating globalRanking attendedContestsCount topPercentage badge { name }
  }
  recentAcSubmissionList(username: $username, limit: 20) {
    title titleSlug timestamp lang
  }
}`;

function countFor(list: AcCount[] | undefined, difficulty: string): number {
  return list?.find((entry) => entry.difficulty === difficulty)?.count ?? 0;
}

async function fetchLeetCode(username: string): Promise<RawResponse> {
  let response: Response;
  try {
    response = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DevArena/1.0",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({ query: PROFILE_QUERY, variables: { username } }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw ApiError.badRequest("LeetCode is unreachable right now. Please try again later.");
  }
  if (!response.ok) {
    throw ApiError.badRequest("LeetCode is unreachable right now. Please try again later.");
  }
  return (await response.json()) as RawResponse;
}

export async function collectLeetCodeStats(username: string): Promise<ILeetCodeStats> {
  const clean = username.trim();
  if (!LEETCODE_USERNAME_PATTERN.test(clean)) {
    throw ApiError.badRequest("That does not look like a valid LeetCode username.");
  }
  const body = await fetchLeetCode(clean);
  const matched = body.data?.matchedUser;
  if (!matched) {
    throw ApiError.notFound(`No public LeetCode profile found for "${clean}".`);
  }
  const ac = matched.submitStatsGlobal?.acSubmissionNum;
  const contest = body.data?.userContestRanking;
  const tags = matched.tagProblemCounts;
  const skillTags: ILeetCodeStats["skillTags"] = [];
  for (const [level, list] of [
    ["advanced", tags?.advanced],
    ["intermediate", tags?.intermediate],
    ["fundamental", tags?.fundamental],
  ] as const) {
    for (const tag of list ?? []) {
      if (tag.problemsSolved > 0) skillTags.push({ name: tag.tagName, solved: tag.problemsSolved, level });
    }
  }
  skillTags.sort((a, b) => b.solved - a.solved);

  // submissionCalendar is a JSON string of { unixTs: submissions } — keep the
  // last 365 days as compact per-day counts for the heatmap, attaching known
  // problem titles from the recent submissions list.
  const problemsByDay = new Map<string, Array<{ title: string; titleSlug: string; lang: string }>>();
  for (const entry of body.data?.recentAcSubmissionList ?? []) {
    const ms = Number(entry.timestamp) * 1000;
    if (!Number.isFinite(ms)) continue;
    const day = new Date(ms).toISOString().slice(0, 10);
    const list = problemsByDay.get(day) ?? [];
    if (!list.some((known) => known.titleSlug === entry.titleSlug)) {
      list.push({ title: entry.title, titleSlug: entry.titleSlug, lang: entry.lang });
    }
    problemsByDay.set(day, list);
  }
  const dailySolved: ILeetCodeStats["dailySolved"] = [];
  try {
    const raw = JSON.parse(matched.userCalendar?.submissionCalendar ?? "{}") as Record<string, number>;
    const cutoff = Date.now() - 365 * 86400000;
    const byDay = new Map<string, number>();
    for (const [ts, count] of Object.entries(raw)) {
      const ms = Number(ts) * 1000;
      if (!Number.isFinite(ms) || ms < cutoff) continue;
      const day = new Date(ms).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + count);
    }
    for (const [day, count] of [...byDay.entries()].sort()) {
      dailySolved.push({ day, count, problems: problemsByDay.get(day) ?? [] });
    }
  } catch {
    // A malformed calendar must never break the whole sync.
  }

  return {
    username: matched.username,
    ranking: matched.profile?.ranking ?? null,
    totalSolved: countFor(ac, "All"),
    easySolved: countFor(ac, "Easy"),
    mediumSolved: countFor(ac, "Medium"),
    hardSolved: countFor(ac, "Hard"),
    contestRating: contest?.rating != null ? Math.round(contest.rating) : null,
    contestGlobalRanking: contest?.globalRanking ?? null,
    contestsAttended: contest?.attendedContestsCount ?? 0,
    contestTopPercentage: contest?.topPercentage ?? null,
    contestBadge: contest?.badge?.name ?? null,
    languages: (matched.languageProblemCount ?? [])
      .map((entry) => ({ name: entry.languageName, solved: entry.problemsSolved }))
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 10),
    skillTags: skillTags.slice(0, 12),
    badges: (matched.badges ?? [])
      .filter((badge) => badge.displayName)
      .map((badge) => ({
        name: badge.displayName as string,
        icon: badge.icon ?? null,
        earnedAt: badge.creationDate ?? null,
      }))
      .slice(0, 12),
    recentSolved: (body.data?.recentAcSubmissionList ?? []).map((entry) => ({
      title: entry.title,
      titleSlug: entry.titleSlug,
      timestamp: Number(entry.timestamp),
      lang: entry.lang,
    })),
    dailySolved,
    totalActiveDays: matched.userCalendar?.totalActiveDays ?? 0,
    streak: matched.userCalendar?.streak ?? 0,
    lastSyncedAt: new Date(),
  };
}

export async function setLeetCodeUsername(userId: string, username: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();
  const stats = await collectLeetCodeStats(username);
  user.leetcodeUsername = stats.username ?? username.trim();
  user.leetcodeStats = stats;
  await user.save();
  return user;
}

export async function syncLeetCodeUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();
  if (!user.leetcodeUsername) {
    throw ApiError.badRequest("Connect a LeetCode username first.");
  }
  const stats = await collectLeetCodeStats(user.leetcodeUsername);
  user.leetcodeStats = stats;
  await user.save();
  return user;
}

export async function clearLeetCodeUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();
  user.leetcodeUsername = null;
  user.leetcodeStats = {
    username: null,
    ranking: null,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    contestRating: null,
    contestGlobalRanking: null,
    contestsAttended: 0,
    contestTopPercentage: null,
    contestBadge: null,
    languages: [],
    skillTags: [],
    badges: [],
    recentSolved: [],
    dailySolved: [],
    totalActiveDays: 0,
    streak: 0,
    lastSyncedAt: null,
  };
  await user.save();
  return user;
}
