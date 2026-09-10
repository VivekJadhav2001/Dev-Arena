import type { IUser } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

type GitHubRepo = { name: string; fork: boolean; stargazers_count: number; forks_count: number; language: string | null };
type GitHubEvent = { type: string; created_at: string; repo: { name: string }; payload?: { size?: number } };
type GitHubViewer = { login: string; public_repos: number; followers: number; following: number };

export interface GitHubIntelligence {
  totalRepos: number;
  publicRepos: number;
  followers: number;
  following: number;
  stars: number;
  forks: number;
  totalCommits: number;
  languages: Map<string, number>;
  topLanguage: string | null;
  contributionStreak: number;
  longestStreak: number;
  mostActiveRepos: Array<{ repo: string; commits: number }>;
  codingConsistency: number | null;
  openSourceScore: number | null;
  lastSyncedAt: Date;
}

const GITHUB_API = "https://api.github.com";

async function githubRequest<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (response.status === 401) throw ApiError.unauthorized("Your GitHub connection has expired. Please sign in with GitHub again.");
  if (response.status === 403) throw ApiError.tooManyRequests("GitHub API rate limit reached. Please try again later.");
  if (!response.ok) throw ApiError.internal("Unable to retrieve GitHub activity.");
  return response.json() as Promise<T>;
}

function getStreaks(events: GitHubEvent[]): { current: number; longest: number; consistency: number | null } {
  const days = new Set(events.filter((event) => event.type === "PushEvent").map((event) => event.created_at.slice(0, 10)));
  if (!days.size) return { current: 0, longest: 0, consistency: null };
  const ordered = [...days].sort().reverse();
  let current = 0;
  let longest = 0;
  let running = 0;
  let previous: Date | null = null;
  for (const dateString of ordered) {
    const date = new Date(`${dateString}T00:00:00Z`);
    if (previous && (previous.getTime() - date.getTime()) / 86400000 === 1) running += 1;
    else running = 1;
    longest = Math.max(longest, running);
    previous = date;
  }
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  let cursor = today;
  while (days.has(cursor.toISOString().slice(0, 10))) { current += 1; cursor = new Date(cursor.getTime() - 86400000); }
  return { current, longest, consistency: Math.round((days.size / 90) * 100) };
}

export async function collectGitHubIntelligence(user: IUser): Promise<GitHubIntelligence> {
  if (user.provider !== "github" || !user.accessToken) throw ApiError.badRequest("GitHub analysis requires a GitHub-connected account. Sign in with GitHub to analyse your developer profile.");
  const [viewer, repos, events] = await Promise.all([
    githubRequest<GitHubViewer>("/user", user.accessToken),
    githubRequest<GitHubRepo[]>("/user/repos?per_page=100&sort=updated", user.accessToken),
    githubRequest<GitHubEvent[]>("/users/" + encodeURIComponent(user.userName) + "/events/public?per_page=100", user.accessToken),
  ]);
  const nonForkRepos = repos.filter((repo) => !repo.fork);
  const languages = new Map<string, number>();
  await Promise.all(nonForkRepos.slice(0, 50).map(async (repo) => {
    const repoLanguages = await githubRequest<Record<string, number>>(`/repos/${encodeURIComponent(viewer.login)}/${encodeURIComponent(repo.name)}/languages`, user.accessToken!);
    for (const [name, bytes] of Object.entries(repoLanguages)) languages.set(name, (languages.get(name) ?? 0) + bytes);
  }));
  const sortedLanguages = [...languages.entries()].sort(([, left], [, right]) => right - left);
  const streaks = getStreaks(events);
  const pushEvents = events.filter((event) => event.type === "PushEvent");
  const commitsByRepo = new Map<string, number>();
  for (const event of pushEvents) {
    const repoName = event.repo.name.replace(`${viewer.login}/`, "");
    commitsByRepo.set(repoName, (commitsByRepo.get(repoName) ?? 0) + (event.payload?.size ?? 1));
  }
  const now = new Date();
  return {
    totalRepos: viewer.public_repos,
    publicRepos: viewer.public_repos,
    followers: viewer.followers,
    following: viewer.following,
    stars: nonForkRepos.reduce((total, repo) => total + repo.stargazers_count, 0),
    forks: nonForkRepos.reduce((total, repo) => total + repo.forks_count, 0),
    totalCommits: pushEvents.reduce((total, event) => total + (event.payload?.size ?? 1), 0),
    languages,
    topLanguage: sortedLanguages[0]?.[0] ?? null,
    contributionStreak: streaks.current,
    longestStreak: streaks.longest,
    mostActiveRepos: [...commitsByRepo.entries()].sort(([, left], [, right]) => right - left).slice(0, 5).map(([repo, commits]) => ({ repo, commits })),
    codingConsistency: streaks.consistency,
    openSourceScore: Math.min(100, Math.round(nonForkRepos.length * 3 + Math.min(40, viewer.followers) + Math.min(30, nonForkRepos.reduce((total, repo) => total + repo.stargazers_count, 0)))),
    lastSyncedAt: now,
  };
}
