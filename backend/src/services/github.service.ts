import { User, type IUser } from "../models/user.model.js";
import { ApiError, isApiError } from "../utils/apiError.js";

type GitHubRepo = { name: string; full_name: string; fork: boolean; stargazers_count: number; forks_count: number; language: string | null; owner: { login: string } };
type GitHubEvent = { type: string; created_at: string; repo: { name: string }; payload?: { size?: number } };
type GitHubViewer = { login: string; name: string | null; avatar_url: string | null; public_repos: number; total_private_repos: number; followers: number; following: number };
type GitHubResponse<T> = { body: T; link: string | null };

export interface GitHubIntelligence { totalRepos: number; publicRepos: number; followers: number; following: number; stars: number; forks: number; totalCommits: number; languages: Map<string, number>; topLanguage: string | null; contributionStreak: number; longestStreak: number; mostActiveRepos: Array<{ repo: string; commits: number }>; codingConsistency: number | null; openSourceScore: number | null; lastSyncedAt: Date }

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";

async function githubRequest<T>(pathOrUrl: string, token: string): Promise<GitHubResponse<T>> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${GITHUB_API}${pathOrUrl}`;
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": API_VERSION } });
  if (response.status === 401) throw ApiError.unauthorized("Your GitHub connection has expired. Sign in with GitHub again.");
  if (response.status === 403) throw ApiError.tooManyRequests("GitHub API rate limit reached. Please try again later.");
  if (!response.ok) {
    const details = await response.json().catch(() => null) as { message?: string } | null;
    throw ApiError.badRequest(`GitHub API request failed: ${details?.message ?? response.statusText}`);
  }
  return { body: await response.json() as T, link: response.headers.get("link") };
}
function nextLink(link: string | null) { return link?.split(",").map((part) => part.trim()).find((part) => part.endsWith('rel="next"'))?.match(/<([^>]+)>/)?.[1] ?? null; }
function lastPage(link: string | null) { const url = link?.split(",").map((part) => part.trim()).find((part) => part.endsWith('rel="last"'))?.match(/<([^>]+)>/)?.[1]; return url ? Number(new URL(url).searchParams.get("page") ?? "1") : null; }
async function getAllPages<T>(path: string, token: string): Promise<T[]> { const result: T[] = []; let next: string | null = path; while (next) { const response = await githubRequest<T[]>(next, token); result.push(...response.body); next = nextLink(response.link); } return result; }
async function commitCount(repo: GitHubRepo, login: string, token: string) { const response = await githubRequest<unknown[]>(`/repos/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}/commits?author=${encodeURIComponent(login)}&per_page=1`, token); if (response.body.length === 0) return 0; return lastPage(response.link) ?? 1; }
async function inBatches<T, R>(items: T[], batchSize: number, task: (item: T) => Promise<R>) { const output: R[] = []; for (let index = 0; index < items.length; index += batchSize) output.push(...await Promise.all(items.slice(index, index + batchSize).map(task))); return output; }
function isSkippableRepositoryError(error: unknown) { return isApiError(error) && (error.statusCode === 404 || (error.statusCode === 400 && /Git Repository is empty/i.test(error.message))); }
function getStreaks(events: GitHubEvent[]) { const days = new Set(events.filter((event) => event.type === "PushEvent").map((event) => event.created_at.slice(0, 10))); if (!days.size) return { current: 0, longest: 0, consistency: null as number | null }; const ordered = [...days].sort().reverse(); let longest = 0; let running = 0; let previous: Date | null = null; for (const day of ordered) { const date = new Date(`${day}T00:00:00Z`); running = previous && (previous.getTime() - date.getTime()) / 86400000 === 1 ? running + 1 : 1; longest = Math.max(longest, running); previous = date; } let current = 0; let cursor = new Date(); cursor.setUTCHours(0, 0, 0, 0); while (days.has(cursor.toISOString().slice(0, 10))) { current += 1; cursor = new Date(cursor.getTime() - 86400000); } return { current, longest, consistency: Math.round(days.size / 90 * 100) }; }

export async function collectGitHubIntelligence(user: IUser): Promise<GitHubIntelligence> {
  if (user.provider !== "github" || !user.accessToken) throw ApiError.badRequest("GitHub analysis requires a GitHub-connected account. Sign in with GitHub to analyse your developer profile.");
  const viewerResponse = await githubRequest<GitHubViewer>("/user", user.accessToken);
  const viewer = viewerResponse.body;
  const [repos, events] = await Promise.all([
    // GitHub treats `visibility` and `affiliation` as alternative filters.
    // The affiliation default covers all repositories available to this token.
    getAllPages<GitHubRepo>("/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated", user.accessToken),
    getAllPages<GitHubEvent>(`/users/${encodeURIComponent(viewer.login)}/events/public?per_page=100`, user.accessToken),
  ]);
  const ownedRepos = repos.filter((repo) => !repo.fork && repo.owner.login.toLowerCase() === viewer.login.toLowerCase());
  const languages = new Map<string, number>();
  await inBatches(ownedRepos, 5, async (repo) => {
    try {
      const response = await githubRequest<Record<string, number>>(`/repos/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}/languages`, user.accessToken!);
      for (const [name, bytes] of Object.entries(response.body)) languages.set(name, (languages.get(name) ?? 0) + bytes);
    } catch (error) {
      if (!isSkippableRepositoryError(error)) throw error;
    }
  });
  const commitEntries = await inBatches(ownedRepos, 4, async (repo) => {
    try { return { repo: repo.name, commits: await commitCount(repo, viewer.login, user.accessToken!) }; }
    catch (error) { if (isSkippableRepositoryError(error)) return { repo: repo.name, commits: 0 }; throw error; }
  });
  const sortedLanguages = [...languages.entries()].sort(([, left], [, right]) => right - left);
  const streaks = getStreaks(events);
  const stars = ownedRepos.reduce((total, repo) => total + repo.stargazers_count, 0);
  return { totalRepos: repos.length, publicRepos: viewer.public_repos, followers: viewer.followers, following: viewer.following, stars, forks: ownedRepos.reduce((total, repo) => total + repo.forks_count, 0), totalCommits: commitEntries.reduce((total, entry) => total + entry.commits, 0), languages, topLanguage: sortedLanguages[0]?.[0] ?? null, contributionStreak: streaks.current, longestStreak: streaks.longest, mostActiveRepos: commitEntries.sort((left, right) => right.commits - left.commits).slice(0, 5), codingConsistency: streaks.consistency, openSourceScore: Math.min(100, Math.round(ownedRepos.length * 3 + Math.min(40, viewer.followers) + Math.min(30, stars))), lastSyncedAt: new Date() };
}

export async function syncGitHubUser(userId: string) { const user = await User.findById(userId); if (!user) throw ApiError.unauthorized(); const stats = await collectGitHubIntelligence(user); user.userName = (await githubRequest<GitHubViewer>("/user", user.accessToken!)).body.login; user.githubStats = stats; await user.save(); return user; }
