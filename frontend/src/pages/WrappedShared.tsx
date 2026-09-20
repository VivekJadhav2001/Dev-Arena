import { Braces, LoaderCircle, Swords } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PosterCard } from '../components/wrapped/PosterCard'
import { setPageMeta } from '../lib/share'
import { wrappedService, type IWrappedRecap } from '../services/wrapped.service'

/** Public read-only recap — viewable without logging in, no story controls. */
export default function WrappedShared() {
  const { username = '' } = useParams()
  const [recap, setRecap] = useState<IWrappedRecap | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRecap(await wrappedService.getPublicRecap(username))
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'This recap is private or does not exist.')
    }
  }, [username])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    if (!recap) return
    setPageMeta({
      title: `${recap.userName}'s DevArena Wrapped`,
      description: `${recap.totalBattles} battles · ${recap.winRate}% win rate · best streak ${recap.longestWinStreak}`,
      image: recap.avatarUrl,
      url: `${window.location.origin}/wrapped/${recap.userName}`,
    })
  }, [recap])

  if (error && !recap) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-primary underline">
          Discover DevArena
        </Link>
      </div>
    )
  }

  if (!recap) {
    return (
      <div className="mx-auto flex max-w-2xl items-center gap-3 py-10 text-textMuted">
        <LoaderCircle className="animate-spin" size={17} /> Loading recap…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <p className="text-sm font-bold tracking-[.25em] text-primary">
        {recap.userName.toUpperCase()}&apos;S DEVARENA WRAPPED
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold">Proof, not promises.</h1>

      <div className="mx-auto mt-8 overflow-hidden rounded-3xl border border-white/10 shadow-card" style={{ maxWidth: 420 }}>
        <div style={{ width: 1080, transform: 'scale(0.3889)', transformOrigin: 'top left', height: 746 }}>
          <PosterCard recap={recap} />
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
        {[
          [String(recap.totalBattles), 'battles'],
          [`${recap.winRate}%`, 'win rate'],
          [String(recap.longestWinStreak), 'best streak'],
        ].map(([n, l]) => (
          <div key={l} className="rounded-xl border border-border bg-surface p-3">
            <b className="block text-xl">{n}</b>
            <span className="text-xs text-textMuted">{l}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:2001/api/v1'}/auth/github`}
          className="hover-target inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-background"
        >
          <Swords size={17} />
          Build your own proof
        </a>
        <Link
          to="/leaderboard"
          className="hover-target rounded-xl border border-border px-6 py-3.5 font-semibold hover:border-borderHover"
        >
          See rankings
        </Link>
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-textSubtle">
        <Braces size={14} />
        DevArena — proof of skill, not just a profile.
      </p>
    </div>
  )
}
