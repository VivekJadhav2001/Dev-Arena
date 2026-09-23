import { Ban, Check, Copy, Eye, History, LoaderCircle, Plus, Radio, Swords, Trophy, Users, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { copyText } from '../lib/clipboard'
import { setPageMeta } from '../lib/share'
import { arenaService, type BattleMode, type IBattleResult, type IMyActiveBattle } from '../services/arena.service'
import { useAppStore } from '../store/app.store'
import type { Difficulty } from '../types'

/** Last lobby code — survives tab switches and in-app navigation. */
const LAST_BATTLE_KEY = 'devarena:lastBattleCode'

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust']

const OUTCOME_STYLES: Record<string, string> = {
  win: 'bg-primary/15 text-primary',
  loss: 'bg-danger/10 text-red-300',
  draw: 'bg-secondary/20 text-textMuted',
}

/** Popup showing a past battle's leaderboard plus a link to full details. */
function HistoryPopup({ roomCode, onClose, onDetails }: { roomCode: string; onClose: () => void; onDetails: () => void }) {
  const [result, setResult] = useState<IBattleResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await arenaService.getResult(roomCode)
      setResult(response.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load this battle.')
    }
  }, [roomCode])

  useEffect(() => {
    // Fetch resolves asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const standings = result?.standings ?? []

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-primary" />
            <h2 className="font-display text-xl font-bold">Leaderboard</h2>
            <code className="rounded-md bg-background px-2 py-0.5 font-mono text-sm font-bold tracking-widest">
              {roomCode}
            </code>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-textMuted hover:bg-surfaceRaised hover:text-text"
          >
            <X size={17} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {!result && !error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-textMuted">
            <LoaderCircle size={15} className="animate-spin" /> Loading standings…
          </div>
        )}
        {standings.length > 0 && (
          <div className="mt-4 space-y-2">
            {standings.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3 rounded-xl bg-background p-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-surfaceRaised text-sm font-bold">
                  {entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {entry.username}
                    {entry.isWinner && <span className="ml-2 text-xs font-bold text-primary">WINNER</span>}
                  </p>
                  <p className="text-xs text-textMuted">
                    {entry.correct}/{entry.total} correct · {entry.accuracy}%
                  </p>
                </div>
                <b className="text-sm text-primary">{entry.score}</b>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onDetails}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background"
          >
            View full details
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ArenaLobby() {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [language, setLanguage] = useState('JavaScript')
  const [timeLimit, setTimeLimit] = useState(300)
  const [mode, setMode] = useState<BattleMode>('1v1')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [roomCode, setRoomCode] = useState('')
  const [createdCode, setCreatedCode] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(LAST_BATTLE_KEY)
    } catch {
      return null
    }
  })
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [popupCode, setPopupCode] = useState<string | null>(null)
  // Newest still-open battle I'm in — the lobby lives here until the host
  // cancels or starts it, even across tab switches and route changes.
  const [myActive, setMyActive] = useState<IMyActiveBattle | null>(null)
  // Battle history is prefetched at login; this reads the cache and tops up only when stale.
  const historyData = useAppStore((s) => s.history.data)
  const historyLoading = useAppStore((s) => s.history.loading)
  const historyError = useAppStore((s) => s.history.error)
  const ensureHistory = useAppStore((s) => s.ensureHistory)
  const loadMoreHistory = useAppStore((s) => s.loadMoreHistory)
  const history = historyData?.battles ?? []
  const historyPage = historyData?.page ?? 1
  const historyTotalPages = historyData?.totalPages ?? 1

  useEffect(() => {
    setPageMeta({
      title: 'Battle Arena — Create, Join or Quick-Match | DevArena',
      description:
        'Enter the DevArena: create a 1v1 duel or royale room, join with a code, or quick-match. Server-scored live coding battles.',
      image: 'https://dev-arena-plum.vercel.app/og-cover.png',
      url: 'https://dev-arena-plum.vercel.app/arena',
    })
    // Served from the app store (prefetched at login); refetches only when stale.
    void ensureHistory()
  }, [ensureHistory])

  const refreshMyActive = useCallback(async () => {
    try {
      const data = await arenaService.getMyActive()
      setMyActive(data.battle)
      if (!data.battle) {
        try {
          window.localStorage.removeItem(LAST_BATTLE_KEY)
        } catch {
          // Storage is best-effort; the server stays authoritative.
        }
      }
    } catch {
      // Best-effort banner — the Arena works without it.
    }
  }, [])

  useEffect(() => {
    // Restores the open lobby after tab switches / route changes; resolves
    // asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshMyActive()
    const timer = window.setInterval(() => void refreshMyActive(), 10000)
    return () => window.clearInterval(timer)
  }, [refreshMyActive])

  const fail = (err: unknown) =>
    setError(err instanceof Error ? err.message : 'Unable to complete that request.')

  async function create() {
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const room = await arenaService.createBattle({
        difficulty,
        language,
        timeLimit,
        mode,
        ...(mode === 'royale' ? { maxPlayers } : {}),
      })
      setCreatedCode(room.roomCode)
      try {
        window.localStorage.setItem(LAST_BATTLE_KEY, room.roomCode)
      } catch {
        // Storage is best-effort; the server stays authoritative.
      }
      void refreshMyActive()
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function cancelLobby(code: string) {
    if (cancelBusy) return
    if (!window.confirm(`Cancel battle ${code}? Everyone in the lobby will be sent back.`)) return
    setCancelBusy(true)
    setError(null)
    try {
      await arenaService.cancelBattle(code)
      if (createdCode === code) setCreatedCode(null)
      try {
        window.localStorage.removeItem(LAST_BATTLE_KEY)
      } catch {
        // Storage is best-effort; the server stays authoritative.
      }
      setMyActive(null)
    } catch (err) {
      fail(err)
    } finally {
      setCancelBusy(false)
    }
  }

  async function join() {
    setBusy(true)
    setError(null)
    try {
      const room = await arenaService.joinBattle({ roomCode })
      navigate(`/battle/${room.roomCode}`)
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    if (!createdCode) return
    const ok = await copyText(createdCode)
    setCopied(ok)
    if (ok) window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <p className="text-sm font-bold text-primary">LIVE CODE ARENA</p>
      <h1 className="mt-1 font-display text-4xl font-bold">One prompt. One winner.</h1>
      <p className="mt-2 max-w-2xl text-textMuted">
        Create a private 1v1 duel or a 1-vs-many royale room, or join one with a code.
        Multiple-choice coding questions, verified by DevArena.
      </p>
      <Link
        to="/live"
        className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/5 px-5 py-4 transition hover:border-red-400/60"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-400" />
          </span>
          <span>
            <b className="block text-sm">Live battle streams</b>
            <span className="block text-xs text-textMuted">
              Watch battles in progress and cheer your favorite developer.
            </span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-red-500/15 px-3 py-2 text-sm font-bold text-red-300">
          <Eye size={15} /> Watch live
        </span>
      </Link>
      {myActive && myActive.roomCode !== createdCode && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-bold">
              {myActive.isHost ? 'Your lobby is still open' : 'You have a battle waiting'}{' '}
              <code className="rounded-md bg-background px-2 py-0.5 font-mono tracking-[.2em]">
                {myActive.roomCode}
              </code>
            </p>
            <p className="mt-0.5 text-xs text-textMuted">
              {myActive.mode === 'royale' ? '1 vs Many' : '1 vs 1'} · {myActive.status} ·{' '}
              {myActive.playersCount}/{myActive.maxPlayers} players
              {myActive.isHost
                ? ' — it stays here until you start or cancel it.'
                : ' — hop back in before the host starts.'}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => navigate(`/battle/${myActive.roomCode}`)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background"
            >
              {myActive.status === 'active' ? 'Rejoin battle' : 'Enter lobby'}
            </button>
            {myActive.isHost && myActive.status === 'waiting' && (
              <button
                onClick={() => void cancelLobby(myActive.roomCode)}
                disabled={cancelBusy}
                title="Cancel this battle for everyone"
                className="inline-flex items-center gap-1.5 rounded-xl border border-danger/40 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-danger/10 disabled:opacity-50"
              >
                {cancelBusy ? <LoaderCircle className="animate-spin" size={15} /> : <Ban size={15} />}
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-7">
          <Plus className="text-primary" />
          <h2 className="mt-5 text-2xl font-bold">Start a battle</h2>
          <p className="mt-2 text-textMuted">
            Opponents join with a private six-character battle code.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('1v1')}
              className={`rounded-xl border p-3 text-left transition ${
                mode === '1v1'
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border hover:border-borderHover'
              }`}
            >
              <Swords size={17} className="text-primary" />
              <b className="mt-1 block text-sm">1 vs 1 Duel</b>
              <span className="block text-xs text-textMuted">You against one rival</span>
            </button>
            <button
              onClick={() => setMode('royale')}
              className={`rounded-xl border p-3 text-left transition ${
                mode === 'royale'
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border hover:border-borderHover'
              }`}
            >
              <Users size={17} className="text-primary" />
              <b className="mt-1 block text-sm">1 vs Many</b>
              <span className="block text-xs text-textMuted">Royale with up to 8</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-xl border border-border bg-background px-3 py-3"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {mode === 'royale' ? (
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-3"
              >
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    Up to {n} players
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-3"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
          </div>
          {mode === 'royale' && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-textMuted">
            Battle clock
          </label>
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-3"
          >
            <option value={120}>2 minutes — blitz</option>
            <option value={300}>5 minutes — classic (coding friendly)</option>
            <option value={600}>10 minutes — marathon</option>
          </select>
          <p className="mt-1 text-xs text-textSubtle">
            Battles now include quiz + 2 coding challenges locked by the host.
          </p>

          <button
            onClick={() => void create()}
            disabled={busy}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-background disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Swords size={17} />}
            Create battle
          </button>

          {createdCode && (
            <div className="mt-5 rounded-xl border border-primary/40 bg-background p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Battle code</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-surface px-4 py-3 text-center font-mono text-2xl font-bold tracking-[.3em]">
                  {createdCode}
                </code>
                <button
                  onClick={() => void copyCode()}
                  title="Copy battle code"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:border-borderHover"
                >
                  {copied ? <Check size={17} className="text-primary" /> : <Copy size={17} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button
                onClick={() => navigate(`/battle/${createdCode}`)}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-bold text-background"
              >
                Enter room
              </button>
              <button
                onClick={() => void cancelLobby(createdCode)}
                disabled={cancelBusy}
                title="Cancel this battle for everyone"
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-danger/40 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-danger/10 disabled:opacity-50"
              >
                {cancelBusy ? <LoaderCircle className="animate-spin" size={15} /> : <Ban size={15} />}
                {cancelBusy ? 'Cancelling…' : 'Cancel battle'}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-7">
          <Radio className="text-secondary" />
          <h2 className="mt-5 text-2xl font-bold">Join with a battle code</h2>
          <p className="mt-2 text-textMuted">Enter the code shared by the host.</p>
          <div className="mt-7 flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 font-mono text-sm uppercase"
            />
            <button
              onClick={() => void join()}
              disabled={busy || roomCode.length !== 6}
              className="rounded-xl bg-secondary px-4 py-3 font-bold disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="animate-spin" size={17} /> : 'Join'}
            </button>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <History className="text-primary" size={22} />
            Previous battles
          </h2>
          <button
            onClick={() => void ensureHistory(true)}
            disabled={historyLoading}
            className="text-sm font-semibold text-textMuted hover:text-text disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {historyError && (
          <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
            {historyError}
          </div>
        )}
        {history.length === 0 && !historyLoading && !historyError && (
          <p className="mt-4 text-sm text-textMuted">
            No battles yet — create or join one above and it will appear here.
          </p>
        )}
        {history.length > 0 && (
          <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
            {history.map((item) => (
              <div key={item.roomCode} className="flex flex-wrap items-center gap-3 bg-background/60 p-4">
                <button
                  onClick={() => setPopupCode(item.roomCode)}
                  title="View leaderboard"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surfaceRaised font-mono text-xs font-bold hover:border hover:border-primary/50"
                >
                  {item.outcome ? item.outcome[0].toUpperCase() : '•'}
                </button>
                <button onClick={() => setPopupCode(item.roomCode)} className="min-w-0 flex-1 text-left">
                  <span className="font-mono text-sm font-bold tracking-widest">{item.roomCode}</span>
                  {item.outcome && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold uppercase ${OUTCOME_STYLES[item.outcome] ?? ''}`}>
                      {item.outcome}
                    </span>
                  )}
                  <span className="mt-0.5 block truncate text-xs text-textMuted">
                    {item.mode === 'royale' ? '1 vs Many' : '1 vs 1'} · {item.difficulty} ·{' '}
                    {item.playersCount} players · {item.myScore} pts
                    {item.winnerUsername ? ` · won by ${item.winnerUsername}` : ''}
                    {item.endedAt ? ` · ${new Date(item.endedAt).toLocaleDateString()}` : ''}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    Tap for leaderboard · View details
                  </span>
                </button>
                <button
                  onClick={() => navigate(`/battle/${item.roomCode}/details`)}
                  className="shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-borderHover"
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        )}
        {historyLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-textMuted">
            <LoaderCircle size={15} className="animate-spin" /> Loading history…
          </div>
        )}
        {historyPage < historyTotalPages && (
          <button
            onClick={() => void loadMoreHistory()}
            disabled={historyLoading}
            className="mt-4 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover disabled:opacity-60"
          >
            Load more
          </button>
        )}
      </section>

      {popupCode && (
        <HistoryPopup
          roomCode={popupCode}
          onClose={() => setPopupCode(null)}
          onDetails={() => {
            navigate(`/battle/${popupCode}/details`)
            setPopupCode(null)
          }}
        />
      )}
    </div>
  )
}
