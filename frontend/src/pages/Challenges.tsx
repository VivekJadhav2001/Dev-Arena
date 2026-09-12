import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, LoaderCircle, Swords, X } from 'lucide-react'
import { challengeService, type ChallengeDirection } from '../services/challenge.service'
import type { IChallenge } from '../types'

const TABS: Array<{ id: ChallengeDirection; label: string }> = [
  { id: 'incoming', label: 'Incoming' },
  { id: 'outgoing', label: 'Outgoing' },
  { id: 'history', label: 'History' },
]

export default function Challenges() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ChallengeDirection>('incoming')
  const [items, setItems] = useState<IChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    challengeService
      .list(tab)
      .then((data) => {
        if (!active) return
        setItems(data)
        setError(null)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load challenges')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [tab])

  async function reload(direction: ChallengeDirection) {
    setLoading(true)
    setError(null)
    try {
      setItems(await challengeService.list(direction))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load challenges')
    } finally {
      setLoading(false)
    }
  }

  async function accept(item: IChallenge) {
    setActing(item.id)
    try {
      const result = await challengeService.accept(item.id)
      navigate(`/battle/${result.roomCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept the challenge')
    } finally {
      setActing(null)
    }
  }

  async function decline(item: IChallenge) {
    setActing(item.id)
    try {
      await challengeService.decline(item.id)
      await reload(tab)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to decline')
    } finally {
      setActing(null)
    }
  }

  async function cancel(item: IChallenge) {
    setActing(item.id)
    try {
      await challengeService.cancel(item.id)
      await reload(tab)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold text-primary">BATTLE REQUESTS</p>
      <h1 className="mt-1 font-display text-4xl font-bold">Challenges</h1>
      <p className="mt-2 text-textMuted">
        Requests from the Battle Zone land here too, so offline developers never miss a fight.
        Accepting creates a shared 1v1 Arena room for both players.
      </p>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setLoading(true)
              setTab(t.id)
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition ${
              tab === t.id ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border text-textMuted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">{error}</div>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-textMuted">
            <LoaderCircle className="animate-spin" size={17} /> Loading requests…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-textMuted">
            Nothing here yet. Head to the <a href="/arena" className="font-bold text-primary underline">Arena</a> to
            battle and send the first challenge.
          </div>
        ) : (
          items.map((item) => {
            const other = tab === 'outgoing' ? item.challenged : item.challenger
            return (
              <div key={item.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-3">
                  {other?.avatarUrl ? (
                    <img src={other.avatarUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary font-bold text-white">
                      {(other?.userName?.[0] ?? 'D').toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{other?.userName ?? 'Developer'}</p>
                    <p className="text-sm text-textMuted">
                      {other?.persona ?? ''} · {item.settings.difficulty} · {item.settings.language ?? 'Mixed'} · {item.settings.timeLimit}s
                    </p>
                    {item.message && <p className="mt-1 truncate text-sm text-textMuted">“{item.message}”</p>}
                  </div>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-textMuted">
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  {tab === 'incoming' && item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => void accept(item)}
                        disabled={acting === item.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background hover:brightness-110 disabled:opacity-60"
                      >
                        <Check size={15} /> {acting === item.id ? 'Joining…' : 'Accept & battle'}
                      </button>
                      <button
                        onClick={() => void decline(item)}
                        disabled={acting === item.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:border-borderHover disabled:opacity-60"
                      >
                        <X size={15} /> Decline
                      </button>
                    </>
                  )}
                  {tab === 'outgoing' && item.status === 'pending' && (
                    <button
                      onClick={() => void cancel(item)}
                      disabled={acting === item.id}
                      className="rounded-xl border border-border px-4 py-2.5 text-sm hover:border-borderHover disabled:opacity-60"
                    >
                      Cancel request
                    </button>
                  )}
                  {item.status === 'accepted' && item.battleId && (
                    <button
                      onClick={() => navigate('/arena')}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary/50 px-4 py-2.5 text-sm font-bold text-primary"
                    >
                      <Swords size={15} /> Open battle
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
