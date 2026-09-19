/* eslint-disable react-refresh/only-export-components */
import { motion } from 'framer-motion'
import {
  BrainCircuit,
  CalendarDays,
  Code2,
  Crown,
  Flame,
  GitBranch,
  Medal,
  Swords,
  Trophy,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { IWrappedRecap } from '../../services/wrapped.service'
import { useCountUp } from './useCountUp'

export interface StorySlide {
  id: string
  /** ms before auto-advance; 0 disables auto-advance (interactive slides). */
  durationMs: number
  render: () => ReactNode
}

const GRADIENTS = [
  'from-[#06281f] via-[#0b3b2e] to-[#071018]',
  'from-[#1c1440] via-[#2b1d66] to-[#0b0718]',
  'from-[#3a0f2b] via-[#5c1640] to-[#12060f]',
  'from-[#3a2404] via-[#5c3a06] to-[#100a03]',
]

function gradientFor(index: number): string {
  return GRADIENTS[index % GRADIENTS.length] ?? GRADIENTS[0]
}

function Blobs() {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-[110px]"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-secondary/20 blur-[120px]"
        animate={{ x: [0, -24, 0], y: [0, -18, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  )
}

/**
 * Fixed skeleton shared by every slide: top padding clears the player chrome
 * (progress segments + counter), the kicker always starts at the same height,
 * and the stat strip is pinned to the bottom. Only the middle breathes.
 */
function Shell({ index, children, footer }: { index: number; children: ReactNode; footer?: ReactNode }) {
  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br px-7 pb-6 pt-16 sm:px-9 ${gradientFor(index)}`}
    >
      <Blobs />
      {/* Scrollable middle so long words/numbers never clip outside the slide. */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {footer && <div className="relative mt-4 shrink-0">{footer}</div>}
    </div>
  )
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="text-xs font-bold tracking-[.3em] text-primary"
    >
      {children}
    </motion.p>
  )
}

/** Bottom stat strip — same position and density on every slide. */
function StatStrip({ items }: { items: Array<[string, string]> }) {
  if (items.length === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.55 }}
      className={`grid gap-2 ${items.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
    >
      {items.map(([value, label]) => (
        <div key={label} className="rounded-xl border border-white/15 bg-black/25 px-2 py-2.5 text-center backdrop-blur">
          <p className="truncate text-lg font-extrabold leading-tight">{value}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
        </div>
      ))}
    </motion.div>
  )
}

function Caption({ children, delay = 0.5 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="mt-3 break-words text-base leading-6 text-white/70"
    >
      {children}
    </motion.p>
  )
}

function HeroNumber({ value, suffix }: { value: number; suffix?: string }) {
  const display = useCountUp(value)
  return (
    <motion.p
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mt-2 font-display font-extrabold leading-none tabular-nums text-[clamp(3rem,19vw,5.25rem)]"
    >
      {display.toLocaleString()}
      {suffix && <span className="text-[0.5em] text-primary">{suffix}</span>}
    </motion.p>
  )
}

function ColdOpenSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const initials = (recap.userName[0] ?? 'D').toUpperCase()
  const strip: Array<[string, string]> =
    recap.totalBattles > 0
      ? [
          [String(recap.totalBattles), 'battles'],
          [`${recap.winRate}%`, 'win rate'],
          [recap.totalCommits.toLocaleString(), 'commits'],
        ]
      : [
          [recap.totalCommits.toLocaleString(), 'commits'],
          [recap.totalSolved.toLocaleString(), 'solves'],
          [String(recap.badges.length), 'badges'],
        ]
  return (
    <Shell
      index={index}
      footer={<StatStrip items={strip} />}
    >
      <Kicker>{recap.season} · DevArena Wrapped</Kicker>
      <motion.h2
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="mt-3 font-display text-[42px] font-extrabold leading-[1.04] sm:text-5xl"
      >
        Your year
        <br />
        in the arena.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-5 flex items-center gap-3"
      >
        {recap.avatarUrl ? (
          <img src={recap.avatarUrl} alt="" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/60" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-xl font-bold">
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold">{recap.userName}</p>
          {recap.persona && <p className="truncate text-sm font-bold text-primary">{recap.persona}</p>}
        </div>
      </motion.div>
    </Shell>
  )
}

function BattlesSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [`${recap.wins}W`, 'wins'],
            [`${recap.losses}L`, 'losses'],
            [recap.draws > 0 ? `${recap.draws}D` : `${recap.winRate}%`, recap.draws > 0 ? 'draws' : 'win rate'],
          ]}
        />
      }
    >
      <Kicker>Battles fought</Kicker>
      <HeroNumber value={recap.totalBattles} />
      <Caption>
        {recap.totalBattles === 1
          ? 'One room. One shot. The story starts here.'
          : `Every room entered, every question answered — ${recap.wins} won outright.`}
      </Caption>
    </Shell>
  )
}

function WinRateSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [String(recap.totalBattles), 'battles'],
            [String(recap.longestWinStreak), 'best streak'],
            [recap.currentWinStreak > 0 ? String(recap.currentWinStreak) : `${recap.losses}L`, recap.currentWinStreak > 0 ? 'active now' : 'losses'],
          ]}
        />
      }
    >
      <Kicker>Win rate</Kicker>
      <div className="relative mt-4 h-44 w-44">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="18" className="stroke-white/15" />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#00d4aa"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (recap.winRate / 100) * circumference }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <p className="font-display text-5xl font-extrabold">
            {recap.winRate}
            <span className="text-xl text-primary">%</span>
          </p>
        </div>
      </div>
      <Caption delay={0.6}>
        <span className="inline-flex items-center gap-2">
          <Trophy size={16} className="text-primary" />
          {recap.wins}W · {recap.losses}L{recap.draws > 0 ? ` · ${recap.draws}D` : ''} when it counted.
        </span>
      </Caption>
    </Shell>
  )
}

function GrindSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const commits = useCountUp(recap.totalCommits)
  const solves = useCountUp(recap.totalSolved)
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [recap.topLanguage ?? 'Mixed', 'top stack'],
            [String(recap.totalBattles), 'battles'],
            [`${recap.winRate}%`, 'win rate'],
          ]}
        />
      }
    >
      <Kicker>Beyond the arena</Kicker>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 flex items-center gap-4"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <GitBranch size={28} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-4xl font-extrabold leading-none tabular-nums sm:text-5xl">{commits.toLocaleString()}</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-white/60">commits shipped</p>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-5 flex items-center gap-4"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-secondary">
          <BrainCircuit size={28} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-4xl font-extrabold leading-none tabular-nums sm:text-5xl">{solves.toLocaleString()}</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-white/60">problems solved</p>
        </div>
      </motion.div>
      <Caption>The quiet grind behind the loud wins.</Caption>
    </Shell>
  )
}

function LanguageSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [String(recap.totalBattles), 'battles'],
            [`${recap.winRate}%`, 'win rate'],
            [String(recap.longestWinStreak), 'best streak'],
          ]}
        />
      }
    >
      <Kicker>Most battled stack</Kicker>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary"
      >
        <Code2 size={32} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="mt-3 break-words font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl"
      >
        {recap.topLanguage}
      </motion.p>
      <Caption>Your weapon of choice this season.</Caption>
    </Shell>
  )
}

function StreakSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const display = useCountUp(recap.longestWinStreak)
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [`${recap.wins}`, 'total wins'],
            [`${recap.winRate}%`, 'win rate'],
            [recap.currentWinStreak > 0 ? `${recap.currentWinStreak}` : '—', 'active now'],
          ]}
        />
      }
    >
      <Kicker>Longest win streak</Kicker>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
        className="mt-4 flex items-center gap-4"
      >
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-red-500 shadow-glow">
          <Flame size={42} className="text-white" />
        </span>
        <p className="min-w-0 font-display font-extrabold leading-none tabular-nums text-[clamp(3rem,19vw,5.25rem)]">{display}</p>
      </motion.div>
      <Caption>
        wins in a row{recap.currentWinStreak > 0 ? ` — and ${recap.currentWinStreak} still burning right now` : ''}.
      </Caption>
    </Shell>
  )
}

function BusiestDaySlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [String(recap.totalBattles), 'battles'],
            [`${recap.wins}W`, 'wins'],
            [recap.topLanguage ?? 'Mixed', 'top stack'],
          ]}
        />
      }
    >
      <Kicker>You battled most on</Kicker>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary"
      >
        <CalendarDays size={32} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="mt-3 break-words font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl"
      >
        {recap.busiestDay}s
      </motion.p>
      <Caption>
        {recap.busiestDayCount} {recap.busiestDayCount === 1 ? 'battle' : 'battles'} on your power day — ritual
        matters.
      </Caption>
    </Shell>
  )
}

function PercentileSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [`${recap.wins}`, 'wins'],
            [`${recap.totalRanked}`, 'ranked'],
            [`${recap.badges.length}`, 'badges'],
          ]}
        />
      }
    >
      <Kicker>Across the whole arena</Kicker>
      <motion.p
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2 font-display font-extrabold leading-none text-[clamp(2.5rem,15vw,4.75rem)]"
      >
        Top <span className="text-primary">{recap.topPercent}%</span>
      </motion.p>
      <Caption>
        <span className="inline-flex items-center gap-2">
          <Crown size={16} className="text-primary" />
          Rank #{recap.rank} of {recap.totalRanked} battlers.
        </span>
      </Caption>
    </Shell>
  )
}

function BadgesSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const shown = recap.badges.slice(0, 4)
  const extra = recap.badges.length - shown.length
  return (
    <Shell
      index={index}
      footer={
        <StatStrip
          items={[
            [String(recap.badges.length), 'badges'],
            [`${recap.wins}W`, 'wins'],
            [`${recap.winRate}%`, 'win rate'],
          ]}
        />
      }
    >
      <Kicker>Trophy case · {recap.badges.length}</Kicker>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {shown.map((badge, i) => (
          <motion.div
            key={`${badge.badgeId}-${i}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-black/25 p-3.5 backdrop-blur"
          >
            <Medal size={22} className="shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{badge.badgeId}</p>
              <p className="text-[11px] uppercase tracking-wider text-white/60">{badge.tier}</p>
            </div>
          </motion.div>
        ))}
        {extra > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + shown.length * 0.1 }}
            className="grid place-items-center rounded-2xl border border-dashed border-white/25 bg-black/15 p-3.5"
          >
            <p className="text-sm font-bold text-white/70">+{extra} more</p>
          </motion.div>
        )}
      </div>
    </Shell>
  )
}

function StarterSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const hasGrind = recap.totalCommits > 0 || recap.totalSolved > 0
  return (
    <Shell
      index={index}
      footer={
        hasGrind ? (
          <StatStrip
            items={[
              [recap.totalCommits.toLocaleString(), 'commits'],
              [recap.totalSolved.toLocaleString(), 'solves'],
              [String(recap.badges.length), 'badges'],
            ]}
          />
        ) : undefined
      }
    >
      <Kicker>Just getting started</Kicker>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary"
      >
        <Swords size={32} />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="mt-3 break-words font-display text-[34px] font-extrabold leading-tight sm:text-5xl"
      >
        {recap.userName}, your story starts with one battle.
      </motion.h2>
      <Caption>
        Fight your first duel and come back — this recap writes itself from real results.
      </Caption>
      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        href="/arena"
        className="hover-target mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-background"
      >
        <Swords size={18} />
        Fight now
      </motion.a>
    </Shell>
  )
}

/**
 * Ordered story assembly. Zero-data slides are skipped so the sequence never
 * shows hollow numbers; brand-new developers get an encouraging variant.
 * Content slides are capped so the interactive share finale is never cut.
 */
export function buildSlides(
  recap: IWrappedRecap,
  finalRender: () => ReactNode,
): StorySlide[] {
  if (recap.totalBattles === 0) {
    return [
      { id: 'open', durationMs: 4500, render: () => <ColdOpenSlide recap={recap} index={0} /> },
      { id: 'starter', durationMs: 0, render: () => <StarterSlide recap={recap} index={1} /> },
    ]
  }
  const content: StorySlide[] = [
    { id: 'open', durationMs: 4500, render: () => <ColdOpenSlide recap={recap} index={0} /> },
    { id: 'battles', durationMs: 4500, render: () => <BattlesSlide recap={recap} index={1} /> },
    { id: 'winrate', durationMs: 5000, render: () => <WinRateSlide recap={recap} index={2} /> },
  ]
  if (recap.totalCommits > 0 || recap.totalSolved > 0) {
    content.push({ id: 'grind', durationMs: 5000, render: () => <GrindSlide recap={recap} index={3} /> })
  }
  if (recap.topLanguage) {
    content.push({ id: 'language', durationMs: 4500, render: () => <LanguageSlide recap={recap} index={content.length} /> })
  }
  if (recap.longestWinStreak > 0) {
    content.push({ id: 'streak', durationMs: 4500, render: () => <StreakSlide recap={recap} index={content.length} /> })
  }
  if (recap.busiestDay) {
    content.push({ id: 'day', durationMs: 4500, render: () => <BusiestDaySlide recap={recap} index={content.length} /> })
  }
  if (recap.topPercent !== null) {
    content.push({ id: 'percentile', durationMs: 4500, render: () => <PercentileSlide recap={recap} index={content.length} /> })
  }
  if (recap.badges.length > 0) {
    content.push({ id: 'badges', durationMs: 5000, render: () => <BadgesSlide recap={recap} index={content.length} /> })
  }
  // Cap content so the share finale always survives the cut.
  const capped = content.slice(0, 8)
  capped.push({ id: 'share', durationMs: 0, render: finalRender })
  return capped
}
