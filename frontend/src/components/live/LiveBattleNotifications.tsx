import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Radio, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSocketContext } from '../../app/providers/SocketProvider'
import type { IBattleLivePayload } from '../../services/arena.service'
import { useAuthStore } from '../../store/auth.store'

const AUTO_DISMISS_MS = 10000

/**
 * Global realtime listener for "a battle just went live".
 * Deliberately quiet: a single small toast (bottom-left, never covering the
 * join-request toasts on the right), no sound, no modal, auto-dismisses, one at
 * a time, and never shown when you're already watching/playing that battle.
 */
export function LiveBattleNotifications() {
  const socket = useSocketContext()
  const navigate = useNavigate()
  const location = useLocation()
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const [toast, setToast] = useState<IBattleLivePayload | null>(null)
  const seenRef = useRef<Set<string>>(new Set())
  const locationRef = useRef(location.pathname)
  const userIdRef = useRef(currentUserId)

  useEffect(() => {
    locationRef.current = location.pathname
  }, [location.pathname])
  useEffect(() => {
    userIdRef.current = currentUserId
  }, [currentUserId])

  useEffect(() => {
    if (!socket) return
    const onLive = (payload: IBattleLivePayload) => {
      const roomCode = String(payload?.roomCode ?? '').toUpperCase()
      if (!roomCode) return
      // Dedupe: one toast per battle per session.
      if (seenRef.current.has(roomCode)) return
      seenRef.current.add(roomCode)
      // Don't interrupt participants or anyone already watching this battle.
      const me = userIdRef.current
      if (me && payload.playerIds?.includes(me)) return
      const path = locationRef.current
      if (path === `/live/${roomCode}` || path === `/battle/${roomCode}`) return
      setToast({ ...payload, roomCode })
      // Nudge the navbar Live badge immediately (it also polls every 20s).
      window.dispatchEvent(new CustomEvent('live:battle-started', { detail: { roomCode } }))
    }
    socket.on('battle:live', onLive)
    return () => {
      socket.off('battle:live', onLive)
    }
  }, [socket])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-[60] w-[min(92vw,360px)]" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.roomCode}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-red-400/30 bg-surfaceElevated shadow-card"
          >
            <div className="flex items-start gap-3 p-4">
              <span className="relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/15">
                <Radio size={17} className="text-red-300" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {toast.hostUsername} started a live battle
                </p>
                <p className="mt-0.5 truncate text-xs text-textMuted">
                  {toast.mode === 'royale' ? '1 vs Many' : '1 vs 1'} · {toast.difficulty} ·{' '}
                  {toast.language ?? 'Mixed'} · {toast.playersCount} players ·{' '}
                  {toast.totalQuestions} questions
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => {
                      setToast(null)
                      navigate(`/live/${toast.roomCode}`)
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-background hover:brightness-110"
                  >
                    <Eye size={13} /> Catch it live
                  </button>
                  <button
                    onClick={() => setToast(null)}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-textMuted hover:border-borderHover hover:text-text"
                    aria-label="Dismiss"
                  >
                    Later
                  </button>
                </div>
              </div>
              <button
                onClick={() => setToast(null)}
                className="shrink-0 rounded-lg p-1 text-textSubtle hover:text-text"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
            <motion.div
              key={`progress-${toast.roomCode}`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              className="h-0.5 origin-left bg-red-400/60"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
