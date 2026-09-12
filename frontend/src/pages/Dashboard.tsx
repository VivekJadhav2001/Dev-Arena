import { useEffect, useState } from "react";
import { Code2, Flame, Github, Languages, LoaderCircle, RefreshCw, Swords, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { LeetCodeStats } from "../components/leetcode/LeetCodeStats";
import { LeetCodeUsernameModal } from "../components/leetcode/LeetCodeUsernameModal";
import { leetcodeService } from "../services/leetcode.service";
import { userService } from "../services/user.service";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";

export default function Dashboard() {
  const { user } = useAuth();
  const checkSession = useAuthStore((s) => s.checkSession);
  const ensureDashboard = useAppStore((s) => s.ensureDashboard);
  // GitHub stats ride along on the session user — no per-page fetch.
  const stats = user?.githubStats ?? null;
  // Recent battles were prefetched at login; tops up only when stale.
  const recentBattles = useAppStore((s) => s.dashboard.data?.recentBattles ?? []);
  useEffect(() => {
    void ensureDashboard();
  }, [ensureDashboard]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leetcodeOpen, setLeetcodeOpen] = useState(false);
  const [leetcodeSyncing, setLeetcodeSyncing] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState<string | null>(null);
  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      await userService.syncGithub();
      // Mutations bypass the session freshness window.
      await checkSession(true);
      await ensureDashboard(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync GitHub.");
    } finally {
      setSyncing(false);
    }
  }
  async function syncLeetCode() {
    setLeetcodeSyncing(true);
    setLeetcodeError(null);
    try {
      await leetcodeService.sync();
      await checkSession(true);
    } catch (err) {
      setLeetcodeError(err instanceof Error ? err.message : "Unable to sync LeetCode.");
    } finally {
      setLeetcodeSyncing(false);
    }
  }
  async function disconnectLeetCode() {
    if (!window.confirm("Disconnect your LeetCode account?")) return;
    setLeetcodeSyncing(true);
    setLeetcodeError(null);
    try {
      await leetcodeService.disconnect();
      await checkSession(true);
    } catch (err) {
      setLeetcodeError(err instanceof Error ? err.message : "Unable to disconnect LeetCode.");
    } finally {
      setLeetcodeSyncing(false);
    }
  }
  const cards = [
    [String(stats?.publicRepos ?? "—"), "repositories", Github],
    [String(stats?.totalCommits ?? "—"), "recent pushes", Swords],
    [stats ? `${stats.longestStreak} days` : "—", "longest streak", Flame],
    [stats?.topLanguage, "top language used", Languages],
  ] as const;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-primary">YOUR PROOF OF SKILL</p>
          <h1 className="mt-1 font-display text-4xl font-bold">
            {user
              ? `Welcome, ${user.userName}.`
              : "Your developer command center."}
          </h1>
          <p className="mt-2 text-textMuted">
            GitHub facts are collected and cached by DevArena—not supplied by
            your browser.
          </p>
        </div>
        <button
          onClick={() => void sync()}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-background disabled:opacity-60"
        >
          {syncing ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Github size={17} />
          )}{" "}
          {syncing
            ? "Analysing GitHub…"
            : stats
              ? "Refresh GitHub"
              : "Analyse GitHub"}
        </button>
      </div>
      {error && (
        <div className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([value, label, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <Icon size={19} className="text-primary" />
            <p className="mt-5 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-textMuted">{label}</p>
          </div>
        ))}
      </div>
      {stats ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <p className="font-bold">GitHub intelligence</p>
            <p className="mt-1 text-sm text-textMuted">
              Cached data from your connected GitHub account.
            </p>
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-secondary/30 to-primary/15 p-6">
              <p className="text-sm font-bold text-primary">
                TOP LANGUAGE · {stats.topLanguage ?? "Still calculating"}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold">
                {Object.keys(stats.languages).length} languages across{" "}
                {stats.publicRepos} public repositories.
              </h2>
              <p className="mt-3 text-textMuted">
                {stats.stars} stars · {stats.forks} forks · {stats.followers}{" "}
                followers
              </p>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-6">
            <p className="font-bold">Continue your story</p>
            <p className="mt-2 text-sm text-textMuted">
              Developer DNA is the next server-side step built from these stored
              statistics.
            </p>
            <Link
              to="/dna"
              className="mt-6 block rounded-xl border border-primary/40 py-2.5 text-center text-sm font-bold text-primary"
            >
              View Developer DNA
            </Link>
          </section>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-bold">Ready to read your GitHub story?</p>
          <p className="mt-2 text-sm text-textMuted">
            Run analysis once. DevArena caches the result and refreshes it at a
            controlled interval.
          </p>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-bold">
              <Code2 size={18} className="text-primary" />
              LeetCode
            </p>
            <p className="mt-1 text-sm text-textMuted">
              {user?.leetcodeUsername
                ? `Connected as ${user.leetcodeUsername}${
                    user.leetcodeStats?.lastSyncedAt
                      ? ` · synced ${new Date(user.leetcodeStats.lastSyncedAt).toLocaleString()}`
                      : ""
                  }`
                : "Connect your public LeetCode username to showcase problem-solving stats."}
            </p>
          </div>
          {user?.leetcodeUsername && (
            <button
              onClick={() => void syncLeetCode()}
              disabled={leetcodeSyncing}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover disabled:opacity-60"
            >
              <RefreshCw size={15} className={leetcodeSyncing ? "animate-spin" : ""} />
              {leetcodeSyncing ? "Syncing…" : "Refresh"}
            </button>
          )}
        </div>

        {leetcodeError && (
          <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
            {leetcodeError}
          </div>
        )}

        <div className="mt-5">
          {user?.leetcodeUsername && user.leetcodeStats ? (
            <>
              <LeetCodeStats stats={user.leetcodeStats} username={user.leetcodeUsername} />
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => setLeetcodeOpen(true)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-borderHover"
                >
                  Change username
                </button>
                <button
                  onClick={() => void disconnectLeetCode()}
                  disabled={leetcodeSyncing}
                  className="rounded-xl border border-danger/50 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-danger/10 disabled:opacity-60"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setLeetcodeOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-background hover:brightness-110"
            >
              <Code2 size={17} />
              Connect LeetCode
            </button>
          )}
        </div>
      </section>

      {recentBattles.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-bold">
              <Trophy size={18} className="text-primary" />
              Recent battles
            </p>
            <Link to="/arena" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {recentBattles.slice(0, 5).map((battle) => (
              <Link
                key={battle.battleId}
                to={`/battle/${battle.roomCode}/details`}
                className="flex items-center gap-3 rounded-xl bg-background p-3 transition hover:border hover:border-primary/40"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black ${
                    battle.outcome === "win"
                      ? "bg-primary/15 text-primary"
                      : battle.outcome === "loss"
                        ? "bg-danger/10 text-red-300"
                        : "bg-surfaceRaised text-textMuted"
                  }`}
                >
                  {battle.outcome ? battle.outcome[0].toUpperCase() : "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    vs {battle.opponentUsername} · {battle.score}–{battle.opponentScore}
                  </p>
                  <p className="text-xs text-textMuted">
                    {battle.difficulty} · {battle.accuracy}% accuracy ·{" "}
                    {new Date(battle.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <Swords size={15} className="shrink-0 text-textSubtle" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {leetcodeOpen && <LeetCodeUsernameModal onClose={() => setLeetcodeOpen(false)} />}
    </div>
  );
}
