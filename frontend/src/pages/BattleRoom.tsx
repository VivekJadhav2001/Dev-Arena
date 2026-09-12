import { Check, Copy, Flag, LoaderCircle, Swords } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { copyText } from '../lib/clipboard'
import { arenaService, type IBattleRoomState } from '../services/arena.service'
import { useAuthStore } from '../store/auth.store'

export default function BattleRoom() {
  const { roomCode = '' } = useParams()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.user?.id ?? null)
  const [room, setRoom] = useState<IBattleRoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null)
  const [answering, setAnswering] = useState(false)
  const questionStartedAt = useRef<number>(0)

  const load = useCallback(async () => {
    try {
      const response = await arenaService.getRoom(roomCode)
      // Defensive: never let a partial payload crash the render below.
      const data = response.data
      setRoom({
        ...data,
        players: data.players ?? [],
        questions: data.questions ?? [],
      })
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load this battle room.')
    }
  }, [roomCode])

  useEffect(() => {
    // Polling resolves asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    const timer = window.setInterval(() => void load(), 2500)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (room?.status === 'finished') navigate(`/battle/${room.roomCode}/result`)
  }, [room?.status, room?.roomCode, navigate])

  const questions = room?.questions ?? []
  const question = room && room.status === 'active'
    ? questions[room.currentQuestionIndex] ?? null
    : null
  const options = question?.options ?? []

  useEffect(() => {
    questionStartedAt.current = Date.now()
    // Reset per-question UI state when the server advances the question.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicked(null)
    setFeedback(null)
  }, [question?.questionId])

  async function start() {
    setBusy(true)
    try {
      const response = await arenaService.startBattle(roomCode)
      setRoom(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the battle.')
    } finally {
      setBusy(false)
    }
  }

  async function forfeit() {
    if (!window.confirm('Forfeit this battle?')) return
    try {
      await arenaService.forfeit(roomCode)
      navigate(`/battle/${roomCode}/result`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to forfeit the battle.')
    }
  }

  async function submit(option: string) {
    if (!question || answering || picked !== null) return
    setPicked(option)
    setAnswering(true)
    try {
      // timeTaken is scoring telemetry sent to the server, not render state.
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now()
      const timeTaken = Math.max(0, Math.round((now - questionStartedAt.current) / 1000))
      const outcome = await arenaService.answer(roomCode, {
        questionId: question.questionId,
        answer: option,
        timeTaken,
      })
      setFeedback({ correct: outcome.isCorrect })
      if (outcome.finished) {
        window.setTimeout(() => navigate(`/battle/${roomCode}/result`), 900)
      } else {
        window.setTimeout(() => void load(), 900)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your answer.')
      setPicked(null)
    } finally {
      setAnswering(false)
    }
  }

  async function copyCode() {
    if (!room) return
    const ok = await copyText(room.roomCode)
    setCopied(ok)
    if (ok) window.setTimeout(() => setCopied(false), 2000)
  }

  if (error && !room) {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
    )
  }

  if (!room) {
    return (
      <div className="flex items-center gap-3 text-textMuted">
        <LoaderCircle className="animate-spin" />
        Loading battle room…
      </div>
    )
  }

  const players = room?.players ?? []
  const amIHost = players.some((p) => p.isHost && p.userId === currentUserId)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary">
            {room.mode === 'royale' ? 'ROYALE · 1 VS MANY' : 'DUEL · 1 VS 1'} · {room.status.toUpperCase()}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">
            {room.status === 'waiting' ? 'Battle lobby' : 'Battle in progress'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <code className="rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-lg font-bold tracking-[.25em]">
            {room.roomCode}
          </code>
          <button
            onClick={() => void copyCode()}
            title="Copy battle code"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover"
          >
            {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {room.status === 'waiting' && (
        <div className="mt-7 rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-textMuted">
            {players.length < room.maxPlayers
              ? `Waiting for developers to join (${players.length}/${room.maxPlayers}). Share the battle code above.`
              : 'Room is full. The host can begin when ready.'}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {players.map((player) => (
              <div key={player.userId} className="rounded-xl border border-border bg-background p-4">
                <b>{player.username}</b>
                <span className="float-right text-primary">{player.score} XP</span>
                <p className="mt-1 text-sm text-textMuted">{player.isHost ? 'Host' : 'Challenger'}</p>
              </div>
            ))}
          </div>
          {amIHost && players.length >= 2 ? (
            <button
              onClick={() => void start()}
              disabled={busy}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-background disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Swords size={17} />}
              Start battle
            </button>
          ) : (
            <p className="mt-6 text-sm text-textMuted">
              {players.length < 2
                ? 'Waiting for at least one opponent to join…'
                : 'Waiting for the host to start the battle…'}
            </p>
          )}
        </div>
      )}

      {room.status === 'active' && (
        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            {question ? (
              <div key={question.questionId}>
                <p className="text-xs font-bold uppercase tracking-wider text-textMuted">
                  Question {room.currentQuestionIndex + 1} of {room.totalQuestions} · {question.xpValue} XP
                </p>
                <h2 className="mt-2 text-xl font-bold">{question.prompt}</h2>
                {question.code && (
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-background p-4 font-mono text-sm">
                    {question.code}
                  </pre>
                )}
                <div className="mt-5 grid gap-2">
                  {options.map((option) => {
                    const selected = picked === option
                    const showVerdict = feedback !== null && selected
                    return (
                      <button
                        key={option}
                        onClick={() => void submit(option)}
                        disabled={picked !== null}
                        className={`rounded-xl border px-4 py-3 text-left font-medium transition disabled:cursor-default ${
                          showVerdict
                            ? feedback.correct
                              ? 'border-primary/70 bg-primary/15'
                              : 'border-danger/60 bg-danger/10'
                            : selected
                              ? 'border-primary/60 bg-primary/10'
                              : 'border-border hover:border-borderHover'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                {feedback && (
                  <p className={`mt-4 text-sm font-bold ${feedback.correct ? 'text-primary' : 'text-red-300'}`}>
                    {feedback.correct ? 'Correct! Server-verified.' : 'Not quite — the server scored this one wrong.'}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-textMuted">
                <LoaderCircle className="animate-spin" size={17} />
                You answered everything — waiting for the other developers to finish…
              </div>
            )}
            <button
              onClick={() => void forfeit()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-textMuted hover:border-borderHover hover:text-text"
            >
              <Flag size={15} /> Forfeit
            </button>
          </div>

          <aside className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Live standings</p>
            <div className="mt-3 space-y-2">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.userId}
                    className="flex items-center gap-3 rounded-xl bg-background p-3"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-surfaceRaised text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {player.username} {player.isHost && <span className="text-textSubtle">· host</span>}
                      </p>
                      <p className="text-xs text-textMuted">
                        {player.answersCount}/{room.totalQuestions} answered
                      </p>
                    </div>
                    <b className="text-sm text-primary">{player.score}</b>
                  </div>
                ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
