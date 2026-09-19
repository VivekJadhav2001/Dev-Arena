import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Flame, LoaderCircle, Radio, Swords, Users, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocketContext } from '../app/providers/SocketProvider'
import {
  arenaService,
  type ILiveBattle,
  type IJoinResolutionPayload,
} from '../services/arena.service'
import { useAuthStore } from '../store/auth.store'

type JoinUiState = {
  requestId: string | null
  status: 'pending' | 'declined' | 'expired'
  message: string | null
}

function LiveCard({
  battle,
  currentUserId,
  justStarted,
  joinState,
  joinBusy,
  onJoin,
}: {
  battle: ILiveBattle
  currentUserId: string | null
  justStarted: boolean
  joinState: JoinUiState | undefined
  joinBusy: boolean
  onJoin: (roomCode: string) => void
}) {
  const navigate = useNavigate()
  const progress =
    battle.totalQuestions > 0
      ? Math.min(1, battle.currentQuestionIndex / battle.totalQuestions)
      : 0
  const live = battle.status === 'active'
  const is1v1 = battle.mode !== 'royale'
  const isWaiting = battle.status === 'waiting'
  const slotOpen = battle.playersCount < battle.maxPlayers
  const isParticipant = currentUserId
    ? battle.players.some((p) => p.userId === currentUserId)
    : false

  const joinDisabledReason = !is1v1
    ? null
    : joinState?.status === 'pending'
      ? 'Request sent — waiting on the host…'
      : isParticipant
        ? 'You are already in this battle'
        : !isWaiting
          ? 'Battle already started'
          : !slotOpen
            ? 'Room is full'
            : null
  const joinDisabled = !is1v1 ? true : joinDisabledReason != null || joinBusy
  const joinLabel = joinState?.status === 'pending' || joinBusy
    ? 'Request sent…'
    : isParticipant
      ? 'Slot filled'
      : !isWaiting
        ? 'Started'
        : !slotOpen
          ? 'Full'
          : 'Join duel'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-2xl border bg-surface transition ${
        justStarted
          ? 'border-red-400/70 shadow-[0_0_36px_-6px_rgba(248,113,113,0.6)]'
          : 'border-border hover:border-primary/40'
      }`}
    >
      {/* Start burst: sweeping shine + glow when waiting → active flips. */}
      <AnimatePresence>
        {justStarted && (
          <motion.div
            key={`shine-${battle.roomCode}`}
            initial={{ x: '-120%', opacity: 0 }}
            animate={{ x: '120%', opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut', repeat: 2 }}
            className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-red-400/25 to-transparent"
            aria-hidden
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {justStarted && (
          <motion.div
            key={`started-${battle.roomCode}`}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="flex items-center justify-center gap-1.5 bg-red-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-200"
          >
            <Zap size={13} className="animate-pulse" />
            <motion.span
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            >
              Battle started — cheer live
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
            live ? 'bg-danger/15 text-red-300' : 'bg-secondary/20 text-textMuted'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-red-400' : justStarted ? 'animate-ping bg-red-400' : 'bg-textSubtle'}`} />
          {live ? 'Live now' : 'Forming'}
        </span>
        <code className="font-mono text-sm font-bold tracking-[.2em] text-textMuted">
          {battle.roomCode}
        </code>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          {battle.players.slice(0, 2).map((p) => (
            <div key={p.userId} className="flex min-w-0 flex-1 items-center gap-2">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-bold text-white">
                  {(p.username[0] ?? 'D').toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{p.username}</p>
                <p className="text-xs text-primary">{p.score} pts</p>
              </div>
            </div>
          ))}
          {battle.players.length > 2 && (
            <span className="shrink-0 rounded-lg bg-surfaceRaised px-2 py-1 text-xs font-bold text-textMuted">
              +{battle.players.length - 2}
            </span>
          )}
        </div>
        {battle.players.length === 2 && (
          <p className="mt-2 text-center text-xs font-bold text-textSubtle">VS</p>
        )}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-textMuted">
            <span>
              {battle.mode === 'royale' ? '1 vs Many' : '1 vs 1'} · {battle.difficulty} ·{' '}
              {battle.language ?? 'Mixed'}
            </span>
            <span>
              Q {Math.min(battle.currentQuestionIndex + 1, Math.max(battle.totalQuestions, 1))}/
              {battle.totalQuestions}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
            <motion.div
              className={`h-full rounded-full ${justStarted ? 'bg-red-400' : 'bg-primary'}`}
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-textMuted">
          <span className="inline-flex items-center gap-1">
            <Eye size={13} /> {battle.spectatorCount} watching
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame size={13} /> {battle.totalCheers} cheers
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} /> {battle.playersCount}/{battle.maxPlayers}
          </span>
        </div>
        {is1v1 ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigate(`/live/${battle.roomCode}`)}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background transition group-hover:brightness-110"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Eye size={14} /> Watch
              </span>
            </button>
            <button
              onClick={() => onJoin(battle.roomCode)}
              disabled={joinDisabled}
              title={joinDisabledReason ?? 'Ask the host to let you duel'}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                joinDisabled
                  ? 'cursor-not-allowed border border-border bg-surfaceRaised text-textSubtle'
                  : 'border border-primary/60 bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {joinBusy || joinState?.status === 'pending' ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Swords size={14} />
                )}
                {joinLabel}
              </span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/live/${battle.roomCode}`)}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background transition group-hover:brightness-110"
          >
            Watch live & cheer
          </button>
        )}
        {joinState?.message && (
          <p
            className={`mt-2 text-center text-xs font-semibold ${
              joinState.status === 'pending' ? 'text-primary' : 'text-textMuted'
            }`}
            role="status"
          >
            {joinState.message}
          </p>
        )}
        {is1v1 && joinDisabledReason && !joinState?.message && (
          <p className="mt-2 text-center text-xs text-textSubtle">{joinDisabledReason}</p>
        )}
      </div>
    </motion.article>
  )
}

export default function LiveBattles() {
  const [battles, setBattles] = useState<ILiveBattle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [justStartedCodes, setJustStartedCodes] = useState<string[]>([])
  const [joinStates, setJoinStates] = useState<Record<string, JoinUiState>>({})
  const [joinBusy, setJoinBusy] = useState<string | null>(null)
  const navigate = useNavigate()
  const socket = useSocketContext()
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const prevStatuses = useRef<Map<string, string>>(new Map())

  const flagJustStarted = useCallback((roomCode: string) => {
    const code = roomCode.toUpperCase()
    setJustStartedCodes((prev) => (prev.includes(code) ? prev : [...prev, code]))
    window.setTimeout(() => {
      setJustStartedCodes((prev) => prev.filter((c) => c !== code))
    }, 7000)
  }, [])

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    try {
      const data = await arenaService.getLiveBattles()
      // Detect waiting → active flips so the card can burst even on poll fallback.
      for (const b of data.battles) {
        const prevStatus = prevStatuses.current.get(b.roomCode)
        if (prevStatus === 'waiting' && b.status === 'active') flagJustStarted(b.roomCode)
      }
      prevStatuses.current = new Map(data.battles.map((b) => [b.roomCode, b.status]))
      setBattles(data.battles)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load live battles.')
    } finally {
      setLoading(false)
    }
  }, [flagJustStarted])

  useEffect(() => {
    void load(true)
    const timer = window.setInterval(() => void load(false), 5000)
    return () => window.clearInterval(timer)
  }, [load])

  // Realtime: slot fills + battle starts apply immediately (no 5s wait).
  useEffect(() => {
    if (!socket) return
    const refresh = (payload?: { roomCode?: string }) => {
      void load(false)
      if (payload?.roomCode) {
        const code = String(payload.roomCode).toUpperCase()
        // A filled slot disables Join on that card at once.
        setJoinStates((prev) => {
          if (!prev[code]) return prev
          const next = { ...prev }
          delete next[code]
          return next
        })
      }
    }
    const onLive = (payload: { roomCode?: string }) => {
      if (payload?.roomCode) flagJustStarted(String(payload.roomCode))
      void load(false)
    }
    const onAccepted = (payload: IJoinResolutionPayload) => {
      const code = String(payload?.roomCode ?? '').toUpperCase()
      if (!code) return
      setJoinStates((prev) => {
        if (!prev[code]) return prev
        const next = { ...prev }
        delete next[code]
        return next
      })
      setJoinBusy((busy) => (busy === code ? null : busy))
      void load(false)
      // The slot is filled immediately — take the joiner straight into the duel.
      navigate(`/battle/${code}`)
    }
    const onDeclined = (payload: IJoinResolutionPayload) => {
      const code = String(payload?.roomCode ?? '').toUpperCase()
      if (!code) return
      setJoinBusy((busy) => (busy === code ? null : busy))
      setJoinStates((prev) => ({
        ...prev,
        [code]: {
          requestId: String(payload.requestId ?? ''),
          status: 'declined',
          message: payload.reason ?? 'Host declined your request.',
        },
      }))
      window.setTimeout(() => {
        setJoinStates((prev) => {
          if (!prev[code] || prev[code].status !== 'declined') return prev
          const next = { ...prev }
          delete next[code]
          return next
        })
      }, 5000)
      void load(false)
    }
    const onExpired = (payload: IJoinResolutionPayload) => {
      const code = String(payload?.roomCode ?? '').toUpperCase()
      if (!code) return
      setJoinBusy((busy) => (busy === code ? null : busy))
      setJoinStates((prev) => {
        // Only overwrite a still-pending request; a resolved one already navigated.
        if (prev[code]?.status && prev[code].status !== 'pending') return prev
        return {
          ...prev,
          [code]: {
            requestId: String(payload.requestId ?? ''),
            status: 'expired',
            message: 'Host did not respond in time.',
          },
        }
      })
      window.setTimeout(() => {
        setJoinStates((prev) => {
          if (!prev[code] || prev[code].status !== 'expired') return prev
          const next = { ...prev }
          delete next[code]
          return next
        })
      }, 5000)
    }
    socket.on('live:battles-updated', refresh)
    socket.on('battle:live', onLive)
    socket.on('battle:join-accepted', onAccepted)
    socket.on('battle:join-declined', onDeclined)
    socket.on('battle:join-expired', onExpired)
    return () => {
      socket.off('live:battles-updated', refresh)
      socket.off('battle:live', onLive)
      socket.off('battle:join-accepted', onAccepted)
      socket.off('battle:join-declined', onDeclined)
      socket.off('battle:join-expired', onExpired)
    }
  }, [socket, load, navigate, flagJustStarted])

  async function handleJoin(roomCode: string) {
    const code = roomCode.toUpperCase()
    if (!currentUserId) {
      navigate('/login')
      return
    }
    if (joinBusy) return
    setJoinBusy(code)
    setError(null)
    try {
      const res = await arenaService.requestJoin(code)
      setJoinStates((prev) => ({
        ...prev,
        [code]: {
          requestId: res.requestId,
          status: 'pending',
          message: 'Request sent — host has 10s to accept.',
        },
      }))
      // Local fallback: if the expiry ping is missed, unstick the button.
      window.setTimeout(() => {
        setJoinStates((prev) => {
          if (prev[code]?.status !== 'pending') return prev
          return {
            ...prev,
            [code]: { ...prev[code], status: 'expired', message: 'Host did not respond in time.' },
          }
        })
        setJoinBusy((busy) => (busy === code ? null : busy))
      }, 11000)
    } catch (err) {
      setJoinBusy(null)
      setJoinStates((prev) => ({
        ...prev,
        [code]: {
          requestId: null,
          status: 'declined',
          message: err instanceof Error ? err.message : 'Unable to send join request.',
        },
      }))
      window.setTimeout(() => {
        setJoinStates((prev) => {
          const next = { ...prev }
          delete next[code]
          return next
        })
      }, 5000)
    }
  }

  const live = battles.filter((b) => b.status === 'active')
  const waiting = battles.filter((b) => b.status !== 'active')

  return (
    <div>
      <p className="inline-flex items-center gap-2 text-sm font-bold text-red-300">
        <Radio size={15} className="animate-pulse" /> LIVE BATTLE STREAMS
      </p>
      <h1 className="mt-1 font-display text-4xl font-bold">Watch the Arena live</h1>
      <p className="mt-2 max-w-2xl text-textMuted">
        Spectate real battles as they happen and hype up your favorite developer. For 1v1 duels
        with an open slot you can ask the host to join — they get 10 seconds to decide. Reactions
        never affect the score — the server stays authoritative.
      </p>

      {error && (
        <div className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">
          {error}{' '}
          <button onClick={() => void load(true)} className="ml-2 font-bold underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-3 text-textMuted">
          <LoaderCircle className="animate-spin" /> Finding live battles…
        </div>
      ) : battles.length === 0 && !error ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <Swords size={28} className="mx-auto text-textSubtle" />
          <h2 className="mt-3 text-xl font-bold">No battles live right now</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-textMuted">
            Be the one everyone watches — start a battle and it will show up here the second it
            goes live.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              to="/arena"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-background"
            >
              Start a battle
            </Link>
            <button
              onClick={() => void load(true)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:border-borderHover"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
              Live now ({live.length})
            </h2>
            {live.length === 0 ? (
              <p className="mt-3 text-sm text-textMuted">Nothing in progress — check forming lobbies below.</p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {live.map((b) => (
                  <LiveCard
                    key={b.roomCode}
                    battle={b}
                    currentUserId={currentUserId}
                    justStarted={justStartedCodes.includes(b.roomCode)}
                    joinState={joinStates[b.roomCode]}
                    joinBusy={joinBusy === b.roomCode}
                    onJoin={(code) => void handleJoin(code)}
                  />
                ))}
              </div>
            )}
          </section>

          {waiting.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">Forming lobbies ({waiting.length})</h2>
              <p className="mt-1 text-sm text-textMuted">
                1v1 duel with an open seat? Hit <b>Join duel</b> — the host gets your request for
                10 seconds. Or grab a front-row seat and watch.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {waiting.map((b) => (
                  <LiveCard
                    key={b.roomCode}
                    battle={b}
                    currentUserId={currentUserId}
                    justStarted={justStartedCodes.includes(b.roomCode)}
                    joinState={joinStates[b.roomCode]}
                    joinBusy={joinBusy === b.roomCode}
                    onJoin={(code) => void handleJoin(code)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
