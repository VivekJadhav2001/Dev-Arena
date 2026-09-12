import { Check, Copy, Instagram, Linkedin, LoaderCircle, MessageCircle, Share2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { copyText } from '../lib/clipboard'
import { arenaService, type IBattleDetails } from '../services/arena.service'

export default function BattleDetails() {
  const { roomCode = '' } = useParams()
  const [details, setDetails] = useState<IBattleDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await arenaService.getDetails(roomCode)
      setDetails(response.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load battle details.'
      setError(
        /401|unauthor|session|log in/i.test(message)
          ? 'Sign in to view these battle details. Details are shared with authorized users only.'
          : message,
      )
    }
  }, [roomCode])

  useEffect(() => {
    // Fetch resolves asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function handleCopyLink() {
    const ok = await copyText(`${window.location.origin}/battle/${roomCode}/details`)
    setCopiedLink(ok)
    if (ok) window.setTimeout(() => setCopiedLink(false), 2000)
  }

  function shareText(): string {
    if (!details) return ''
    const winner = details.standings.find((s) => s.isWinner)
    const headline = details.isDraw
      ? `an epic drawn ${details.mode === 'royale' ? '1-vs-many royale' : '1-vs-1 duel'}`
      : `${winner ? `${winner.username} won` : 'a winner emerged in'} a ${details.mode === 'royale' ? '1-vs-many royale' : '1-vs-1 duel'}`;
    return (
      `I just battled through ${headline} on DevArena ` +
      `(${details.totalQuestions} MCQs, ${details.difficulty})! ` +
      `Full battle details: ${window.location.origin}/battle/${details.roomCode}/details`
    )
  }

  async function handleCopyCaption() {
    const ok = await copyText(shareText())
    setCopiedCaption(ok)
    if (ok) window.setTimeout(() => setCopiedCaption(false), 3000)
  }

  if (error && !details) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
        <Link to="/arena" className="mt-4 inline-block text-sm font-bold text-primary underline">
          Back to Arena
        </Link>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-3 py-10 text-textMuted">
        <LoaderCircle className="animate-spin" size={17} /> Loading battle details…
      </div>
    )
  }

  const pageUrl = `${window.location.origin}/battle/${details.roomCode}/details`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(shareText())}`
  const standings = details.standings ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold text-primary">
        BATTLE DETAILS · {details.mode === 'royale' ? '1 VS MANY' : '1 VS 1'} · {details.status.toUpperCase()}
      </p>
      <h1 className="mt-1 font-display text-4xl font-bold">Room {details.roomCode}</h1>
      <p className="mt-2 text-textMuted">
        {details.difficulty} · {details.language ?? 'Mixed'} · {details.totalQuestions} questions ·{' '}
        {standings.length}/{details.maxPlayers} developers
        {details.endedAt ? ` · played ${new Date(details.endedAt).toLocaleString()}` : ''}
      </p>

      {details.myRank !== null && details.myRank !== undefined && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <b className="text-2xl">#{details.myRank}</b>
            <small className="block text-textMuted">your rank</small>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <b className="text-2xl">{details.myScore ?? 0}</b>
            <small className="block text-textMuted">your score</small>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <b className="text-2xl">{details.myAccuracy ?? 0}%</b>
            <small className="block text-textMuted">accuracy</small>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <p className="border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-textMuted">
          Final standings
        </p>
        {standings.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center gap-3 border-b border-border/50 px-5 py-3 last:border-0"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-background text-sm font-bold">
              {entry.rank}
            </span>
            {entry.avatarUrl ? (
              <img src={entry.avatarUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-sm font-bold text-white">
                {(entry.username[0] ?? 'D').toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {entry.username}
                {entry.isWinner && <span className="ml-2 text-xs font-bold text-primary">WINNER</span>}
                {entry.isHost && <span className="ml-2 text-xs text-textSubtle">host</span>}
              </p>
              <p className="text-xs text-textMuted">
                {entry.correct}/{entry.total} correct · {entry.accuracy}% accuracy
              </p>
            </div>
            <b className="text-primary">{entry.score} XP</b>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Share2 size={18} className="text-primary" />
          Share this battle
        </h2>
        <p className="mt-1 text-sm text-textMuted">
          Questions stay private — only the outcome and standings are shared.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a66c2] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"
          >
            <Linkedin size={16} /> LinkedIn
          </a>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <button
            onClick={() => void handleCopyCaption()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"
          >
            {copiedCaption ? <Check size={16} /> : <Instagram size={16} />}
            {copiedCaption ? 'Caption copied' : 'Instagram'}
          </button>
          <button
            onClick={() => void handleCopyLink()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover"
          >
            {copiedLink ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            {copiedLink ? 'Copied' : 'Copy link'}
          </button>
        </div>
        {copiedCaption && (
          <p className="mt-3 text-xs text-textMuted">
            Caption copied — paste it into your Instagram post, reel, or story with the link.
          </p>
        )}
      </section>

      <div className="mt-6 flex gap-2">
        <Link
          to={`/battle/${details.roomCode}/result`}
          className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:border-borderHover"
        >
          View result
        </Link>
        <Link
          to="/arena"
          className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:border-borderHover"
        >
          Back to Arena
        </Link>
      </div>
    </div>
  )
}
