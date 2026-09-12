import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swords, X } from 'lucide-react'
import { useSocketContext } from '../../app/providers/SocketProvider'
import type { IChallenge } from '../../types'

interface IncomingToast {
  challenge: IChallenge
}

/**
 * Global realtime listener for Battle Zone invites.
 * `challenge:received` → accept/decline toast.
 * `challenge:accepted` → both developers route into the shared battle room.
 */
export function ChallengeNotifications() {
  const socket = useSocketContext()
  const navigate = useNavigate()
  const [incoming, setIncoming] = useState<IncomingToast | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return
    const onReceived = (payload: { challenge: IChallenge }) => {
      if (payload?.challenge) setIncoming({ challenge: payload.challenge })
    }
    const onAccepted = (payload: { roomCode: string }) => {
      if (payload?.roomCode) {
        setNotice(`Battle room ${payload.roomCode} is ready — entering…`)
        window.setTimeout(() => navigate(`/battle/${payload.roomCode}`), 900)
      }
    }
    const onDeclined = () => setNotice('Challenge was declined.')
    const onExpired = () => setNotice('A challenge expired.')
    socket.on('challenge:received', onReceived)
    socket.on('challenge:accepted', onAccepted)
    socket.on('challenge:declined', onDeclined)
    socket.on('challenge:expired', onExpired)
    return () => {
      socket.off('challenge:received', onReceived)
      socket.off('challenge:accepted', onAccepted)
      socket.off('challenge:declined', onDeclined)
      socket.off('challenge:expired', onExpired)
    }
  }, [socket, navigate])

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(t)
  }, [notice])

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
      {notice && (
        <div className="pointer-events-auto rounded-xl border border-border bg-surfaceElevated p-4 text-sm shadow-card">
          {notice}
        </div>
      )}
      {incoming && (
        <div className="pointer-events-auto rounded-2xl border border-primary/40 bg-surface p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 font-bold">
              <Swords size={17} className="text-primary" />
              {incoming.challenge.challenger?.userName ?? 'A developer'} challenges you
            </p>
            <button
              onClick={() => setIncoming(null)}
              className="text-textSubtle hover:text-text"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-2 text-sm text-textMuted">
            {incoming.challenge.settings.difficulty} · {incoming.challenge.settings.language ?? 'Mixed'} ·{' '}
            {incoming.challenge.settings.timeLimit}s
            {incoming.challenge.message ? ` — “${incoming.challenge.message}”` : ''}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setIncoming(null)
                navigate('/challenges')
              }}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background hover:brightness-110"
            >
              Review & respond
            </button>
            <button
              onClick={() => setIncoming(null)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm hover:border-borderHover"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
