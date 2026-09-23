import { Crown, LoaderCircle, Medal, Swords } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  leaderboardService,
  type ILeaderboardEntry,
  type IMyRank,
} from "../services/leaderboard.service";
import { setPageMeta } from "../lib/share";
import { useAuthStore } from "../store/auth.store";

function EntryRow({
  entry,
  highlight,
}: {
  entry: ILeaderboardEntry;
  highlight: boolean;
}) {
  const initials = (entry.userName?.[0] ?? "D").toUpperCase();
  return (
    <div
      className={`grid grid-cols-[60px_1fr_90px_90px] items-center px-5 py-4 ${
        highlight ? "bg-primary/10" : ""
      }`}
    >
      <span className="font-bold text-primary">
        {entry.rank === 1 ? <Crown size={19} /> : entry.rank}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/60 font-bold">
            {initials}
          </span>
        )}
        <span className="min-w-0">
          <Link
            to={`/u/${encodeURIComponent(entry.userName)}`}
            className="block truncate font-bold hover:text-primary hover:underline"
          >
            {entry.userName}
            {highlight && (
              <span className="ml-2 text-xs font-bold text-primary">YOU</span>
            )}
          </Link>
          <small className="block truncate text-textMuted">
            {entry.persona ?? "Arena contender"} · Lv {entry.level}
          </small>
        </span>
      </span>
      <b>{entry.xp.toLocaleString()}</b>
      <span className="inline-flex items-center gap-1 text-textMuted">
        <Swords size={14} />
        {entry.wins}
      </span>
    </div>
  );
}

export default function Leaderboard() {
  useEffect(() => {
    setPageMeta({
      title: "Developer Rankings — DevArena Leaderboard",
      description:
        "Server-verified developer rankings: 1v1 duel wins, royale victories, XP and levels. Only real battle results count.",
      image: "https://dev-arena-plum.vercel.app/og-cover.png",
      url: "https://dev-arena-plum.vercel.app/leaderboard",
    });
  }, []);

  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const [entries, setEntries] = useState<ILeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<IMyRank | null>(null);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const data = await leaderboardService.getList(nextPage);
      setEntries((prev) => (append ? [...prev, ...data.entries] : data.entries));
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load rankings.",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // List + rank context resolve asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1, false);
    void leaderboardService
      .getMyRank()
      .then(setMe)
      .catch(() => setMe(null));
  }, [load]);

  return (
    <div>
      <p className="text-sm font-bold text-primary">GLOBAL RANKINGS</p>
      <h1 className="mt-1 font-display text-4xl font-bold">
        Builders earning their place.
      </h1>
      <p className="mt-2 text-textMuted">
        Ranked by lifetime XP, then verified battle wins. Stats are written
        server-side when battles finish — never self-reported.
      </p>

      {me && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4">
          <span className="font-display text-3xl font-bold text-primary">
            #{me.rank}
          </span>
          <span className="text-sm text-textMuted">
            <b className="text-text">{me.userName}</b> ·{" "}
            {me.xp.toLocaleString()} XP · {me.wins}/{me.totalBattles} wins ·
            Lv {me.level}
          </span>
        </div>
      )}

      {error && entries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">
          {error}
        </div>
      ) : loading ? (
        <div className="mt-8 flex items-center gap-3 text-textMuted">
          <LoaderCircle className="animate-spin" /> Loading live rankings…
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-bold">No ranked developers yet.</p>
          <p className="mt-2 text-sm text-textMuted">
            Finish a battle and you&apos;ll take the #1 spot automatically.
          </p>
          <Link
            to="/arena"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-background"
          >
            Enter the Arena
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[60px_1fr_90px_90px] border-b border-border px-5 py-4 text-xs font-bold uppercase tracking-wider text-textSubtle">
            <span>Rank</span>
            <span>Developer</span>
            <span>XP</span>
            <span>Wins</span>
          </div>
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              highlight={currentUserId != null && entry.id === currentUserId}
            />
          ))}
        </div>
      )}

      {error && entries.length > 0 && (
        <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-textMuted">
            Page {page} of {totalPages} · {total} developers
          </p>
          {page < totalPages && (
            <button
              onClick={() => void load(page + 1, true)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover disabled:opacity-60"
            >
              {loadingMore && (
                <LoaderCircle className="animate-spin" size={15} />
              )}
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 text-sm text-textMuted">
        <Medal className="text-warning" size={18} />
        Battle wins and earned badges are server-verified before affecting rank.
      </div>
    </div>
  );
}
