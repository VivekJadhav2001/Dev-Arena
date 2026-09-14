import {
  LoaderCircle,
  RefreshCw,
  Dna,
  BrainCircuit,
  Swords,
  Sparkles,
  LayoutGrid,
  BarChart3,
  FlaskConical,
  Languages,
  History as HistoryIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/app.store'
import { dnaService } from '../services/dna.service'
import { DnaHelix } from '../components/dna/DnaHelix'
import { TraitBar } from '../components/dna/TraitBar'
import { InfoTip } from '../components/dna/InfoTip'
import { DNA_TIPS } from '../components/dna/dnaCopy'
import type { IDNA, IDnaHistoryEntry } from '../types'

const TABS = ['overview', 'traits', 'breakdown', 'language', 'history'] as const
type DnaTab = (typeof TABS)[number]

const TAB_META: Array<{ id: DnaTab; label: string; icon: typeof LayoutGrid }> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'traits', label: 'Traits', icon: BarChart3 },
  { id: 'breakdown', label: 'Breakdown', icon: FlaskConical },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'history', label: 'History', icon: HistoryIcon },
]

function tabFromHash(): DnaTab {
  if (typeof window === 'undefined') return 'overview'
  const h = window.location.hash.replace('#', '') as DnaTab
  return (TABS as readonly string[]).includes(h) ? h : 'overview'
}

function traitScore(dna: IDNA, label: string, key: string): number {
  const fromScores = dna.scores?.[key]
  if (typeof fromScores === 'number' && Number.isFinite(fromScores)) return fromScores
  const fromTraits = dna.traits?.find((t) => t.label.toLowerCase() === label.toLowerCase())?.score
  if (typeof fromTraits === 'number' && Number.isFinite(fromTraits)) return fromTraits
  return 0
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return 'recently'
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  const d = Math.floor(s / 86400)
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m}mo ago`
  return `${Math.floor(m / 12)}y ago`
}

function Delta({ value }: { value: number | null }) {
  if (value == null) return null
  if (value === 0)
    return <span className="ml-1.5 text-[11px] font-medium text-textSubtle">—</span>
  const up = value > 0
  return (
    <span className={`ml-1.5 text-[11px] font-bold ${up ? 'text-success' : 'text-danger'}`}>
      {up ? `▲${value}` : `▼${Math.abs(value)}`}
    </span>
  )
}

const PART_HINTS: Record<string, string> = {
  shipping: 'Commit + repo volume. 400 commits or ~17 repos saturates it.',
  rhythm: 'Coding rhythm: % of the last 90 days active, or streak fallback.',
  influence: 'Open-source influence: stored OSS score, or stars + followers.',
  breadth: 'Language count: 5 languages saturates it.',
  volume: 'Weighted solves: easy×1, medium×2.5, hard×5.',
  difficultyMix: 'Share of medium/hard solves, plus a depth bonus past 100.',
  contest: 'Contest rating anchored (or attendance credit without rating).',
  regularity: 'Active days + solving streak.',
  experience: 'Battles played: 10 saturates it.',
  winRate: 'Wins smoothed toward 50% until you play enough battles.',
  streak: 'Best win streak plus a spark from the current one.',
  performance: 'Average battle score blended with quiz vs code accuracy.',
}

export default function DNAPage() {
  const dna = useAppStore((s) => s.dna.data)
  const loading = useAppStore((s) => s.dna.loading)
  const error = useAppStore((s) => s.dna.error)
  const ensureDna = useAppStore((s) => s.ensureDna)
  const regenerateDna = useAppStore((s) => s.regenerateDna)

  const [tab, setTab] = useState<DnaTab>(() => tabFromHash())
  const [history, setHistory] = useState<IDnaHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    void ensureDna()
  }, [ensureDna])

  useEffect(() => {
    let cancelled = false
    dnaService
      .getHistory()
      .then((h) => {
        if (!cancelled) {
          setHistory(h)
          setHistoryError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setHistoryError(e instanceof Error ? e.message : 'Could not load history.')
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectTab = (t: DnaTab) => {
    setTab(t)
    window.history.replaceState(null, '', `#${t}`)
  }

  const derived = useMemo(() => {
    if (!dna) return null
    const builder = traitScore(dna, 'Builder', 'builder')
    const solver = traitScore(dna, 'Solver', 'solver')
    const competitor = traitScore(dna, 'Competitor', 'competitor')
    const versatility =
      typeof dna.versatility === 'number' ? dna.versatility : traitScore(dna, 'Versatility', 'versatility')
    const languages = Object.entries(dna.languageProfile ?? {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
    const heat = dna.activityHeatmap ?? []
    const pushes = heat.reduce((s, d) => s + (d.count || 0), 0)
    return { builder, solver, competitor, versatility, languages, heat, pushes }
  }, [dna])

  if (error && !dna) {
    return <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
  }

  if (!dna || !derived) {
    return (
      <div className="flex items-center gap-3 text-textMuted">
        <LoaderCircle className="animate-spin" />
        Calculating your Developer DNA…
      </div>
    )
  }

  const { builder, solver, competitor, versatility, languages, heat, pushes } = derived
  const coverage = dna.coverage
  const breakdown = dna.breakdown
  const signals = dna.signals ?? []
  const vitality = dna.vitality
  const prev = history.length >= 2 ? history[history.length - 2] : null
  const deltaFor = (key: 'builder' | 'solver' | 'competitor' | 'versatility', now: number) =>
    prev ? now - prev[key] : null

  return (
    <div>
      {/* Header — always visible */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold text-primary">
            <Dna size={15} /> DEVELOPER DNA
            <InfoTip label="Developer DNA" text={DNA_TIPS.persona} />
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold">{dna.persona}.</h1>
          {dna.flavor && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm italic text-textMuted">
              “{dna.flavor}” <InfoTip label="Flavor line" text={DNA_TIPS.flavor} />
            </p>
          )}
          <p className="mt-2 max-w-2xl leading-7 text-textMuted">{dna.personaReason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-success">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
              Evolving · updated {timeAgo(dna.updatedAt)}
              <InfoTip label="Evolving DNA" text={DNA_TIPS.evolving} />
            </span>
            {coverage && (
              <>
                <span
                  className={`rounded-full border px-2.5 py-1 ${coverage.hasGitHub ? 'border-primary/40 bg-primaryGlow text-primary' : 'border-border text-textSubtle'}`}
                >
                  GitHub {coverage.hasGitHub ? '●' : '○'}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 ${coverage.hasLeetCode ? 'border-secondary/40 bg-secondaryGlow text-secondary' : 'border-border text-textSubtle'}`}
                >
                  LeetCode {coverage.hasLeetCode ? '●' : '○'}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 ${coverage.hasBattles ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border text-textSubtle'}`}
                >
                  Battles {coverage.hasBattles ? '●' : '○'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-textSubtle">
                  {coverage.sources}/3 sources <InfoTip label="Coverage" text={DNA_TIPS.coverage} />
                </span>
              </>
            )}
          </div>
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

      {/* Repo-style subnav */}
      <nav aria-label="DNA sections" className="mt-6 border-b border-border">
        <div role="tablist" className="-mb-px flex gap-1 overflow-x-auto">
          {TAB_META.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(id)}
                className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary text-text'
                    : 'border-transparent text-textMuted hover:border-borderHover hover:text-text'
                }`}
              >
                <Icon size={14} />
                {label}
                {id === 'history' && history.length > 0 && (
                  <span className="rounded-full bg-surfaceRaised px-1.5 py-0.5 text-[11px] text-textMuted">
                    {history.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mt-6">
        {tab === 'overview' && (
          <div role="tabpanel">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="pointer-events-none absolute inset-0 bg-glow-radial" />
              {vitality ? (
                <DnaHelix
                  builder={builder}
                  solver={solver}
                  competitor={competitor}
                  vitality={vitality}
                  className="h-[320px] w-full"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-textSubtle">
                  Sync once to grow your helix.
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-textMuted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Builder widens teal
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-secondary" /> Solver widens violet
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-accent" /> Competitor lights rungs
                  </span>
                  <InfoTip label="Helix mapping" text={`${DNA_TIPS.strands} ${DNA_TIPS.rungs} ${DNA_TIPS.energy}`} />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-textMuted backdrop-blur">
                  <Sparkles size={13} className="text-primary" /> Versatility {versatility}
                </div>
              </div>
            </motion.div>
            {vitality && (
              <p className="mt-2 text-xs leading-5 text-textSubtle">
                {vitality.rungCount} rungs = {vitality.commits} commits + {vitality.solves} solves +{' '}
                {vitality.battles} battles · spins {vitality.energy >= 60 ? 'briskly' : vitality.energy >= 25 ? 'gently' : 'almost still'} (energy{' '}
                {vitality.energy}, active {vitality.lastActiveLabel})
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Builder', value: builder, tip: DNA_TIPS.builder, delta: deltaFor('builder', builder) },
                { label: 'Solver', value: solver, tip: DNA_TIPS.solver, delta: deltaFor('solver', solver) },
                { label: 'Competitor', value: competitor, tip: DNA_TIPS.competitor, delta: deltaFor('competitor', competitor) },
                { label: 'Versatility', value: versatility, tip: DNA_TIPS.versatility, delta: deltaFor('versatility', versatility) },
              ].map(({ label, value, tip, delta }) => (
                <div key={label} className="rounded-2xl border border-border bg-surface p-5">
                  <p className="inline-flex items-center gap-1.5 text-sm text-textMuted">
                    {label} <InfoTip label={label} text={tip} />
                  </p>
                  <p className="mt-2 font-display text-4xl font-bold tabular-nums">
                    {value}
                    <Delta value={delta} />
                  </p>
                  <p className="mt-1 text-xs text-textSubtle">
                    {delta == null || prev == null ? 'baseline snapshot' : 'vs previous snapshot'}
                  </p>
                </div>
              ))}
            </div>

            {signals.length > 0 && (
              <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/5 p-5">
                <h2 className="text-sm font-bold text-warning">What would move the needle</h2>
                <ul className="mt-2 space-y-1.5 text-sm leading-6 text-textMuted">
                  {signals.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!coverage?.hasLeetCode && (
                    <Link
                      to="/settings"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-borderHover"
                    >
                      <BrainCircuit size={13} /> Connect LeetCode
                    </Link>
                  )}
                  {!coverage?.hasBattles && (
                    <Link
                      to="/arena"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-borderHover"
                    >
                      <Swords size={13} /> Enter the Arena
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'traits' && (
          <div role="tabpanel">
            <div className="grid gap-4 md:grid-cols-2">
              <TraitBar
                label="Builder"
                score={builder}
                summary={breakdown?.builder.summary ?? 'GitHub shipping, rhythm, influence and breadth.'}
                hint={!coverage?.hasGitHub ? 'Sync GitHub to grow this trait.' : null}
                info={DNA_TIPS.builder}
                barClass="bg-primary"
                delay={0.05}
              />
              <TraitBar
                label="Solver"
                score={solver}
                summary={breakdown?.solver.summary ?? 'LeetCode volume, difficulty mix and contests.'}
                hint={!coverage?.hasLeetCode ? 'Connect LeetCode in Settings to sharpen this trait.' : null}
                info={DNA_TIPS.solver}
                barClass="bg-secondary"
                delay={0.12}
              />
              <TraitBar
                label="Competitor"
                score={competitor}
                summary={breakdown?.competitor.summary ?? 'Win rate, streaks and live battle performance.'}
                hint={!coverage?.hasBattles ? 'Play an arena battle to reveal this trait.' : null}
                info={DNA_TIPS.competitor}
                barClass="bg-accent"
                delay={0.19}
              />
              <TraitBar
                label="Versatility"
                score={versatility}
                summary="How balanced Builder, Solver and Competitor are. High versatility plus high levels makes an All-Rounder."
                info={DNA_TIPS.versatility}
                barClass="bg-gradient-to-r from-primary to-secondary"
                delay={0.26}
              />
            </div>
          </div>
        )}

        {tab === 'breakdown' && (
          <div role="tabpanel">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="inline-flex items-center gap-2 font-bold">
                How we calculate it <InfoTip label="Breakdown" text={DNA_TIPS.breakdown} />
              </h2>
              <div className="mt-3 space-y-2.5 text-sm leading-6 text-textMuted">
                <p>
                  <span className="font-semibold text-text">Builder</span> — 40% shipping (commits + repos),
                  25% rhythm (consistency / streak), 20% influence (open-source score), 15% breadth (languages).
                </p>
                <p>
                  <span className="font-semibold text-text">Solver</span> — 45% volume (easy×1 + medium×2.5 +
                  hard×5), 30% difficulty mix, 15% contest rating, 10% regularity. Zero when LeetCode is not
                  connected — never guessed.
                </p>
                <p>
                  <span className="font-semibold text-text">Competitor</span> — 25% experience, 35% smoothed
                  win rate (pulled toward 50% until you have played enough), 15% streak, 25% live performance
                  (avg score blended with quiz accuracy vs code solve rate). Zero until your first battle.
                </p>
                <p>
                  <span className="font-semibold text-text">Versatility</span> — 100 minus the spread between
                  your highest and lowest trait. Persona comes from trait <em>combinations</em>, not a single
                  rule chain.
                </p>
                <p className="text-textSubtle">
                  Deterministic: the same stored GitHub, LeetCode and battle stats always give the same DNA.
                </p>
              </div>
            </div>
            {breakdown && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {(
                  [
                    { key: 'builder', detail: breakdown.builder },
                    { key: 'solver', detail: breakdown.solver },
                    { key: 'competitor', detail: breakdown.competitor },
                  ] as const
                ).map(({ key, detail }) => (
                  <div key={key} className="rounded-2xl border border-border bg-surface p-5">
                    <p className="text-sm font-bold">
                      {detail.label} · {detail.score}
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {Object.entries(detail.parts)
                        .filter(([part]) => part !== 'quizAccuracy' && part !== 'codingSolveRate')
                        .map(([part, value]) => (
                          <div key={part}>
                            <div className="flex items-center justify-between text-xs text-textMuted">
                              <span className="inline-flex items-center gap-1">
                                {part}
                                {PART_HINTS[part] && <InfoTip label={part} text={PART_HINTS[part]} />}
                              </span>
                              <span className="tabular-nums">{value}</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surfaceRaised">
                              <div className="h-full rounded-full bg-primary/70" style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'language' && (
          <div role="tabpanel">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="inline-flex items-center gap-2 font-bold">
                Language fingerprint <InfoTip label="Language fingerprint" text={DNA_TIPS.language} />
              </h2>
              {languages.length === 0 ? (
                <p className="mt-2 text-sm text-textMuted">No language signal yet — sync GitHub.</p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-textMuted">
                    Top language <span className="font-semibold text-text">{languages[0][0]}</span> at{' '}
                    {languages[0][1]}% · {languages.length} languages detected
                    {languages.length >= 5 ? ' (breadth saturated)' : ` (${5 - languages.length} more to saturate breadth)`}.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {languages.map(([name, pct]) => (
                      <span
                        key={name}
                        className="rounded-full border border-border bg-surfaceElevated px-3 py-1 text-xs text-textMuted"
                      >
                        {name} · {pct}%
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surfaceRaised">
                    <div className="flex h-full">
                      {languages.map(([name, pct], i) => (
                        <div
                          key={name}
                          title={`${name} ${pct}%`}
                          className={i % 3 === 0 ? 'bg-primary/80' : i % 3 === 1 ? 'bg-secondary/80' : 'bg-accent/80'}
                          style={{ width: `${pct}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
              <p className="mt-4 text-xs leading-5 text-textSubtle">
                {heat.length} active days · {pushes} pushes in the stored window. Heatmap detail lives on your
                public profile.
              </p>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div role="tabpanel">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="inline-flex items-center gap-2 font-bold">
                Persona history <InfoTip label="History" text={DNA_TIPS.history} />
              </h2>
              {historyLoading ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-textMuted">
                  <LoaderCircle size={15} className="animate-spin" /> Loading snapshots…
                </p>
              ) : historyError ? (
                <p className="mt-3 text-sm text-red-300">{historyError}</p>
              ) : history.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-textMuted">
                  No snapshots yet — we start recording from this visit. Recalculate after a sync or battle and
                  your trail begins here.
                </p>
              ) : (
                <ol className="mt-4 space-y-0">
                  {[...history].reverse().map((entry, revIdx, arr) => {
                    const older = arr[revIdx + 1]
                    const isLatest = revIdx === 0
                    return (
                      <li key={`${entry.createdAt}-${revIdx}`} className="relative flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 rounded-full ${isLatest ? 'bg-primary' : 'bg-borderHover'}`}
                          />
                          {revIdx < arr.length - 1 && <span className="w-px flex-1 bg-border" />}
                        </div>
                        <div className="flex-1 rounded-xl border border-border bg-surfaceElevated p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="font-semibold">
                              {entry.persona ?? 'Unknown'}
                              {isLatest && (
                                <span className="ml-2 rounded-full bg-primaryGlow px-2 py-0.5 text-[11px] text-primary">
                                  current
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-textSubtle">{timeAgo(entry.createdAt)}</p>
                          </div>
                          <p className="mt-2 font-mono text-xs tabular-nums text-textMuted">
                            B {entry.builder} · S {entry.solver} · C {entry.competitor} · V {entry.versatility}
                          </p>
                          {older ? (
                            <p className="mt-1 text-xs text-textSubtle">
                              {entry.persona !== older.persona ? (
                                <>
                                  evolved from <span className="text-textMuted">{older.persona}</span>
                                </>
                              ) : (
                                <>
                                  B {entry.builder - older.builder >= 0 ? '+' : ''}
                                  {entry.builder - older.builder} · S {entry.solver - older.solver >= 0 ? '+' : ''}
                                  {entry.solver - older.solver} · C {entry.competitor - older.competitor >= 0 ? '+' : ''}
                                  {entry.competitor - older.competitor} since last snapshot
                                </>
                              )}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-textSubtle">baseline snapshot</p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
