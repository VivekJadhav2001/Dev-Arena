import { AnimatePresence, motion } from 'framer-motion'
import { Check, Swords, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSocketContext } from '../../app/providers/SocketProvider'
import { arenaService, type IJoinRequestPayload, type IJoinResolutionPayload } from '../../services/arena.service'

const WINDOW_MS = 10_000

function secondsLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

function JoinRequestToast({
  request,
  onDone,
}: {
  request: IJoinRequestPayload
  onDone: (requestId: string) => void
}) {
  const [left, setLeft] = useState(() => secondsLeft(request.expiresAt))
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = secondsLeft(request.expiresAt)
      setLeft(remaining)
      if (remaining <= 0) {
        window.clearInterval(timer)
        // Server emits `battle:join-expired` too; this is the local fallback
        // so the 10s window never sticks open.
        onDone(request.requestId)
      }
    }, 250)
    return () => window.clearInterval(timer)
    // `onDone` is a stable parent setter wrapper; re-arm only per request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.requestId, request.expiresAt])

  async function act(kind: 'accept' | 'decline') {
    if (busy) return
    setBusy(kind)
    setError(null)
    try {
      if (kind === 'accept') await arenaService.acceptJoin(request.roomCode, request.requestId)
      else await arenaService.declineJoin(request.roomCode, request.requestId)
      onDone(request.requestId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to respond.')
      setBusy(null)
    }
  }

  return (
    <motion.div
      key={request.requestId}
      layout
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="pointer-events-auto overflow-hidden rounded-2xl border border-primary/50 bg-surfaceElevated shadow-card"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 p-4">
        {request.requesterAvatarUrl ? (
          <img
            src={request.requesterAvatarUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-base font-bold text-background">
            {(request.requesterUsername[0] ?? 'D').toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Swords size={14} className="shrink-0 text-primary" />
            <span className="truncate">{request.requesterUsername} wants to duel</span>
          </p>
          <p className="mt-0.5 text-xs text-textMuted">
            Room <code className="font-mono font-bold tracking-[.15em]">{request.roomCode}</code> ·{' '}
            1 vs 1 · {request.difficulty} · {request.language ?? 'Mixed'} ·{' '}
            {request.playersCount}/{request.maxPlayers}
          </p>
          <p className="mt-1 text-xs font-bold text-primary" role="timer">
            {left}s left to decide
          </p>
          {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => void act('accept')}
              disabled={busy != null}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-background hover:brightness-110 disabled:opacity-60"
            >
              <Check size={13} /> {busy === 'accept' ? 'Filling slot…' : 'Accept'}
            </button>
            <button
              onClick={() => void act('decline')}
              disabled={busy != null}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-borderHover disabled:opacity-60"
            >
              <X size={13} /> {busy === 'decline' ? 'Declining…' : 'Decline'}
            </button>
          </div>
        </div>
        <button
          onClick={() => void act('decline')}
          className="shrink-0 rounded-lg p-1 text-textSubtle hover:text-text"
          aria-label="Decline join request"
        >
          <X size={15} />
        </button>
      </div>
      <motion.div
        key={`join-countdown-${request.requestId}`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: WINDOW_MS / 1000, ease: 'linear' }}
        className="h-0.5 origin-left bg-primary/70"
      />
    </motion.div>
  )
}

/**
 * Host-side inbox for 1v1 live join requests.
 * Server emits `battle:join-request` only to the host; the toast lives for the
 * 10s decision window, then resolves via REST (authoritative) + socket fan-out.
 */
export function JoinRequestNotifications() {
  const socket = useSocketContext()
  const [requests, setRequests] = useState<IJoinRequestPayload[]>([])

  useEffect(() => {
    if (!socket) return
    const onRequest = (payload: IJoinRequestPayload) => {
      if (!payload?.requestId || !payload?.roomCode) return
      setRequests((prev) => {
        if (prev.some((r) => r.requestId === payload.requestId)) return prev
        return [...prev.slice(-2), payload]
      })
      // Safety: never keep a stale card if its expiry ping is missed.
      window.setTimeout(() => {
        setRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId))
      }, WINDOW_MS + 1500)
    }
    const onResolved = (payload: IJoinResolutionPayload) => {
      const id = String(payload?.requestId ?? '')
      if (!id) return
      setRequests((prev) => prev.filter((r) => r.requestId !== id))
    }
    socket.on('battle:join-request', onRequest)
    socket.on('battle:join-accepted', onResolved)
    socket.on('battle:join-declined', onResolved)
    socket.on('battle:join-expired', onResolved)
    return () => {
      socket.off('battle:join-request', onRequest)
      socket.off('battle:join-accepted', onResolved)
      socket.off('battle:join-declined', onResolved)
      socket.off('battle:join-expired', onResolved)
    }
  }, [socket])

  return (
    <div
      className="pointer-events-none fixed right-5 top-20 z-[70] flex w-[min(92vw,380px)] flex-col gap-2"
      aria-live="polite"
    >
      <AnimatePresence>
        {requests.map((req) => (
          <JoinRequestToast
            key={req.requestId}
            request={req}
            onDone={(id) => setRequests((prev) => prev.filter((r) => r.requestId !== id))}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
