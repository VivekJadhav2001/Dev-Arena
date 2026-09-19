import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Code2,
  Eye,
  Flame,
  ListChecks,
  LoaderCircle,
  Radio,
  Swords,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSocketContext } from '../app/providers/SocketProvider'
import { useBattleTimer, formatBattleTime } from '../hooks/useBattleTimer'
import {
  arenaService,
  CHEER_EMOJIS,
  type ICheerEvent,
  type IJoinResolutionPayload,
  type ISpectateSnapshot,
} from '../services/arena.service'
import { useAuthStore } from '../store/auth.store'

interface Floater {
  id: number
  emoji: string
  x: number
  targetUsername: string
}

interface FeedItem {
  id: number
  emoji: string
  text: string
}

let floaterId = 0

export default function LiveBattleView() {
  const { roomCode = '' } = useParams()
  const code = roomCode.toUpperCase()
  const navigate = useNavigate()
  const socket = useSocketContext()
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const [snap, setSnap] = useState<ISpectateSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [cheerBusy, setCheerBusy] = useState<string | null>(null)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [joinBusy, setJoinBusy] = useState(false)
  const [joinNotice, setJoinNotice] = useState<string | null>(null)
  const feedId = useRef(0)

  const load = useCallback(async () => {
    try {
      const response = await arenaService.getSpectate(code)
      setSnap(response.data)
      setError(null)
      setTargetId((prev) => {
        if (prev && response.data.players.some((p) => p.userId === prev)) return prev
        const leader = [...response.data.players].sort((a, b) => b.score - a.score)[0]
        return leader?.userId ?? null
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load this live battle.')
    }
  }, [code])

  const pushReaction = useCallback((emoji: string, targetUsername: string, feedText?: string) => {
    floaterId += 1
    const id = floaterId
    setFloaters((prev) => [...prev.slice(-24), { id, emoji, x: 10 + Math.random() * 80, targetUsername }])
    window.setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id))
    }, 2200)
    if (feedText) {
      feedId.current += 1
      const fid = feedId.current
      setFeed((prev) => [{ id: fid, emoji, text: feedText }, ...prev].slice(0, 8))
    }
  }, [])

  // Spectate channel: join for `battle:updated` pings + `battle:cheer` fan-out.
  // Polling stays as a fallback so a missed ping never desyncs the stream.
  useEffect(() => {
    // Initial spectate fetch resolves asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    const timer = window.setInterval(() => void load(), 5000)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!socket || !code) return
    socket.emit('battle:spectate:join', { roomCode: code })
    const onUpdated = (payload: { roomCode?: string }) => {
      if (!payload?.roomCode || payload.roomCode === code) void load()
    }
    const onSpectators = (payload: { roomCode?: string; spectatorCount?: number }) => {
      if (payload?.roomCode !== code || typeof payload.spectatorCount !== 'number') return
      setSnap((prev) => (prev ? { ...prev, spectatorCount: payload.spectatorCount as number } : prev))
    }
    const onCheer = (event: ICheerEvent) => {
      if (event.roomCode !== code) return
      setSnap((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          totalCheers: event.totalCheers,
          players: prev.players.map((p) =>
            p.userId === event.targetUserId ? { ...p, cheers: event.totalForTarget } : p,
          ),
          cheers: prev.cheers.some((c) => c.targetUserId === event.targetUserId)
            ? prev.cheers.map((c) =>
                c.targetUserId === event.targetUserId ? { ...c, count: event.totalForTarget } : c,
              )
            : [...prev.cheers, { targetUserId: event.targetUserId, count: event.totalForTarget }],
        }
      })
      const target = snap?.players.find((p) => p.userId === event.targetUserId)?.username ?? 'a developer'
      void snap
      pushReaction(event.emoji, target, `${event.fromUsername} cheered ${target}`)
    }
    const onCancelled = (payload: { roomCode?: string }) => {
      if (!payload?.roomCode || String(payload.roomCode).toUpperCase() !== code) return
      navigate('/live')
    }
    socket.on('battle:updated', onUpdated)
    socket.on('battle:spectators', onSpectators)
    socket.on('battle:cheer', onCheer)
    socket.on('battle:cancelled', onCancelled)
    return () => {
      socket.off('battle:updated', onUpdated)
      socket.off('battle:spectators', onSpectators)
      socket.off('battle:cheer', onCheer)
      socket.off('battle:cancelled', onCancelled)
      socket.emit('battle:spectate:leave', { roomCode: code })
    }
    // `snap` is read inside onCheer only for a display name; the socket
    // subscription itself must not re-subscribe on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, code, load, pushReaction, navigate])

  async function cheer(targetUserId: string, emoji: string) {
    if (cheerBusy) return
    const target = snap?.players.find((p) => p.userId === targetUserId)
    setCheerBusy(`${targetUserId}:${emoji}`)
    // Optimistic burst — the server broadcast confirms the persisted total.
    pushReaction(emoji, target?.username ?? 'a developer')
    try {
      await arenaService.cheer(code, { targetUserId, emoji })
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send that cheer.')
    } finally {
      setCheerBusy(null)
    }
  }

  async function joinLobby() {
    // 1v1 duels need the host's approval (10s window); royale keeps direct join.
    const needsApproval = snap?.mode === '1v1' && snap?.status === 'waiting'
    if (!needsApproval) {
      try {
        const room = await arenaService.joinBattle({ roomCode: code })
        navigate(`/battle/${room.roomCode}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to join this battle.')
      }
      return
    }
    if (joinBusy) return
    setJoinBusy(true)
    setJoinNotice('Request sent — the host has 10s to accept.')
    try {
      await arenaService.requestJoin(code)
      // Navigation happens on `battle:join-accepted` so the slot fill is instant.
    } catch (err) {
      setJoinBusy(false)
      setJoinNotice(null)
      setError(err instanceof Error ? err.message : 'Unable to send join request.')
    }
  }

  // Join-request resolution for this stream: accepted → enter the duel at once.
  useEffect(() => {
    if (!socket || !code) return
    const matches = (payload: IJoinResolutionPayload) =>
      String(payload?.roomCode ?? '').toUpperCase() === code
    const onAccepted = (payload: IJoinResolutionPayload) => {
      if (!matches(payload)) return
      setJoinBusy(false)
      setJoinNotice(null)
      navigate(`/battle/${code}`)
    }
    const onDeclined = (payload: IJoinResolutionPayload) => {
      if (!matches(payload)) return
      setJoinBusy(false)
      setJoinNotice(payload.reason ?? 'Host declined your request.')
    }
    const onExpired = (payload: IJoinResolutionPayload) => {
      if (!matches(payload)) return
      setJoinBusy(false)
      setJoinNotice('Host did not respond in time.')
    }
    socket.on('battle:join-accepted', onAccepted)
    socket.on('battle:join-declined', onDeclined)
    socket.on('battle:join-expired', onExpired)
    return () => {
      socket.off('battle:join-accepted', onAccepted)
      socket.off('battle:join-declined', onDeclined)
      socket.off('battle:join-expired', onExpired)
    }
  }, [socket, code, navigate])

  const timer = useBattleTimer(snap?.startedAt ?? null, snap?.timeLimit ?? 60, snap?.status === 'active')

  if (error && !snap) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => void load()}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:border-borderHover"
          >
            Retry
          </button>
          <Link to="/live" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-background">
            Back to live
          </Link>
        </div>
      </div>
    )
  }

  if (!snap) {
    return (
      <div className="flex items-center gap-3 text-textMuted">
        <LoaderCircle className="animate-spin" /> Tuning into the battle…
      </div>
    )
  }

  const leader = [...snap.players].sort((a, b) => b.score - a.score)[0]
  const progress =
    snap.totalQuestions > 0 ? Math.min(1, snap.currentQuestionIndex / snap.totalQuestions) : 0
  const q = snap.currentQuestion
  const isCoding = q?.type === 'coding'

  return (
    <div className="relative">
      {/* Floating reaction overlay */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-16 z-40 overflow-hidden" aria-hidden>
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 60, x: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -420, x: (f.x - 50) / 4, scale: [0.6, 1.3, 1.1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.1, ease: 'easeOut' }}
              className="absolute bottom-24 text-3xl drop-shadow-lg"
              style={{ left: `${f.x}%` }}
              title={`Cheering ${f.targetUsername}`}
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={() => navigate('/live')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-textMuted hover:text-text"
      >
        <ArrowLeft size={15} /> All live battles
      </button>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold text-red-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
            </span>
            LIVE · {snap.mode === 'royale' ? 'ROYALE 1 VS MANY' : 'DUEL 1 VS 1'} · ROOM {snap.roomCode}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
            {snap.players[0]?.username ?? 'Developer'} vs {snap.players[1]?.username ?? 'Developer'}
            {snap.players.length > 2 && <span className="text-textMuted"> +{snap.players.length - 2}</span>}
          </h1>
          <p className="mt-1 text-sm text-textMuted">
            {snap.difficulty} · {snap.language ?? 'Mixed'} · Question{' '}
            {Math.min(snap.currentQuestionIndex + 1, Math.max(snap.totalQuestions, 1))} of{' '}
            {snap.totalQuestions} · {formatBattleTime(timer.secondsLeft)} left
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 font-semibold text-textMuted">
            <Eye size={15} /> {snap.spectatorCount} watching
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 font-bold text-primary">
            <Flame size={15} /> {snap.totalCheers} cheers
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {snap.status === 'waiting' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary/40 bg-secondary/10 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <b>Forming lobby</b> — the battle hasn&apos;t started yet. Stay for the stream or grab a
              seat.
              {snap.mode === '1v1' && snap.canJoin && (
                <span className="text-textMuted"> Joining a 1v1 duel asks the host (10s).</span>
              )}
            </p>
            {joinNotice && (
              <p className="mt-1 text-xs font-semibold text-primary" role="status">
                {joinNotice}
              </p>
            )}
          </div>
          {snap.canJoin ? (
            <button
              onClick={() => void joinLobby()}
              disabled={joinBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {joinBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Swords size={15} />}
              {joinBusy ? 'Request sent…' : 'Join this battle'}
            </button>
          ) : snap.isParticipant ? (
            <button
              onClick={() => navigate(`/battle/${snap.roomCode}`)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background"
            >
              Enter my battle room
            </button>
          ) : null}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Stream column */}
        <div className="min-w-0">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress * 100}%` }} />
            </div>
            {q ? (
              <div key={q.questionId} className="mt-4">
                <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-textMuted">
                  <Radio size={12} className="animate-pulse text-red-300" />
                  Live question {snap.currentQuestionIndex + 1} · {q.xpValue} XP
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                      isCoding ? 'bg-secondary/20 text-secondary' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {isCoding ? <Code2 size={12} /> : <ListChecks size={12} />}
                    {isCoding ? 'coding' : 'quiz'}
                  </span>
                </p>
                <h2 className="mt-2 text-xl font-bold">{q.prompt}</h2>
                {isCoding ? (
                  <>
                    {q.statement && <p className="mt-2 text-sm leading-relaxed text-textMuted">{q.statement}</p>}
                    <div className="mt-3 rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Visible examples</p>
                      <div className="mt-2 space-y-2">
                        {q.examples.map((ex, i) => (
                          <div key={i} className="grid gap-2 sm:grid-cols-2">
                            <pre className="overflow-x-auto rounded-lg bg-surface p-3 font-mono text-xs">
                              <span className="text-textSubtle">in: </span>{ex.input}
                            </pre>
                            <pre className="overflow-x-auto rounded-lg bg-surface p-3 font-mono text-xs">
                              <span className="text-textSubtle">out: </span>{ex.output}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                    {q.code && (
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-background p-4 font-mono text-sm">{q.code}</pre>
                    )}
                  </>
                ) : (
                  <>
                    {q.code && (
                      <pre className="mt-4 overflow-x-auto rounded-xl bg-background p-4 font-mono text-sm">{q.code}</pre>
                    )}
                    <div className="mt-4 grid gap-2">
                      {q.options.map((option) => (
                        <div key={option} className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-textMuted">
                          {option}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-textSubtle">
                      Spectators see the options but not the answer key — players lock in the battle room.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-textMuted">
                {snap.status === 'waiting'
                  ? 'Waiting for the host to start — the first question appears here live.'
                  : 'Between questions — the next one lands here in a moment.'}
              </p>
            )}
          </div>

          {/* Cheer console */}
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h3 className="flex items-center gap-2 font-bold">
              <Flame size={17} className="text-primary" /> Cheer them on
            </h3>
            <p className="mt-1 text-sm text-textMuted">
              Pick a developer, tap a reaction — it bursts across everyone&apos;s screen. Max 20
              cheers a minute so the hype stays real.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {snap.players.map((p) => (
                <button
                  key={p.userId}
                  onClick={() => setTargetId(p.userId)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    targetId === p.userId
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-border hover:border-borderHover'
                  }`}
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className="h-5 w-5 rounded-md object-cover" />
                  ) : (
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-secondary text-[10px] font-bold text-white">
                      {(p.username[0] ?? 'D').toUpperCase()}
                    </span>
                  )}
                  {p.username} · {p.cheers}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {CHEER_EMOJIS.map((emoji) => {
                const busy = cheerBusy === `${targetId}:${emoji}`
                const isSelf = targetId != null && targetId === currentUserId
                return (
                  <button
                    key={emoji}
                    disabled={!targetId || !!cheerBusy || isSelf}
                    onClick={() => targetId && void cheer(targetId, emoji)}
                    title={isSelf ? 'You cannot cheer yourself' : `Cheer ${snap.players.find((p) => p.userId === targetId)?.username ?? ''}`}
                    className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface text-2xl transition hover:scale-110 hover:border-primary/50 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    {busy ? <LoaderCircle size={18} className="animate-spin" /> : emoji}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Live standings</p>
            <div className="mt-3 space-y-2">
              {[...snap.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div key={p.userId} className="rounded-xl bg-background p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surfaceRaised text-sm font-bold">
                        {i + 1}
                      </span>
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-bold text-white">
                          {(p.username[0] ?? 'D').toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {p.username}
                          {p.isHost && <span className="ml-1 text-xs font-normal text-textSubtle">· host</span>}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-textMuted">
                          {p.answersCount}/{snap.totalQuestions} locked
                          <span
                            title={p.hasAnswered ? 'Ready for lock' : 'Still thinking'}
                            className={`ml-1 inline-block h-2 w-2 rounded-full ${p.hasAnswered ? 'bg-primary' : 'bg-border'}`}
                          />
                        </p>
                      </div>
                      <b className="text-sm text-primary">{p.score}</b>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-textMuted">
                        <Flame size={12} /> {p.cheers} cheers
                      </span>
                      <button
                        disabled={p.userId === currentUserId || !!cheerBusy}
                        onClick={() => {
                          setTargetId(p.userId)
                          void cheer(p.userId, '🔥')
                        }}
                        className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/25 disabled:opacity-40"
                      >
                        Cheer 🔥
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {leader && (
              <p className="mt-3 text-center text-xs text-textMuted">
                {leader.username} leads with {leader.score} pts
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Crowd feed</p>
            {feed.length === 0 ? (
              <p className="mt-2 text-sm text-textMuted">
                Quiet crowd… be the first to light it up. 🔥
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {feed.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 rounded-lg bg-background px-3 py-2 text-sm">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-textMuted">{item.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
