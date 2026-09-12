import { LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { useAppStore } from '../store/app.store'

export default function DNAPage() {
  const dna = useAppStore((s) => s.dna.data)
  const loading = useAppStore((s) => s.dna.loading)
  const error = useAppStore((s) => s.dna.error)
  const ensureDna = useAppStore((s) => s.ensureDna)
  const regenerateDna = useAppStore((s) => s.regenerateDna)

  useEffect(() => {
    // Served from the app store (prefetched at login); refetches only when stale.
    void ensureDna()
  }, [ensureDna])

  if (error && !dna) {
    return <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
  }

  if (!dna) {
    return (
      <div className="flex items-center gap-3 text-textMuted">
        <LoaderCircle className="animate-spin" />
        Calculating your Developer DNA…
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-primary">DEVELOPER DNA</p>
          <h1 className="mt-1 font-display text-4xl font-bold">{dna.persona}.</h1>
          <p className="mt-3 max-w-2xl text-textMuted">
            {dna.personaReason} This is a transparent, deterministic reading of stored GitHub activity.
          </p>
        </div>
        <button
          onClick={() => void regenerateDna()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Recalculating…' : 'Recalculate'}
        </button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {dna.traits.slice(0, 3).map(({ label, score }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-textMuted">{label}</p>
            <p className="mt-3 text-4xl font-bold text-primary">{score}</p>
            <p className="mt-3 text-sm text-textMuted">Derived from your connected GitHub signals</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-bold">How we calculate it</h2>
        <p className="mt-2 text-textMuted">
          Contribution rhythm, language breadth, repository activity and open-source signals are evaluated with fixed backend rules.
        </p>
      </div>
    </div>
  )
}
