/* eslint-disable react-refresh/only-export-components */
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Code2,
  Crown,
  Flame,
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

function Shell({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div className={`relative flex h-full w-full flex-col justify-center overflow-hidden bg-gradient-to-br px-8 py-16 sm:px-12 ${gradientFor(index)}`}>
      <Blobs />
      <div className="relative">{children}</div>
    </div>
  )
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="text-sm font-bold tracking-[.3em] text-primary"
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
      className="mt-3 font-display text-[110px] font-extrabold leading-none sm:text-[140px]"
    >
      {display.toLocaleString()}
      {suffix && <span className="text-[48px] text-primary">{suffix}</span>}
    </motion.p>
  )
}

function ColdOpenSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const initials = (recap.userName[0] ?? 'D').toUpperCase()
  return (
    <Shell index={index}>
      <Kicker>{recap.season} · DevArena Wrapped</Kicker>
      <motion.h2
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="mt-4 font-display text-5xl font-extrabold leading-[1.02] sm:text-6xl"
      >
        Your year
        <br />
        in the arena.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-8 flex items-center gap-4"
      >
        {recap.avatarUrl ? (
          <img src={recap.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/60" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-2xl font-bold">
            {initials}
          </span>
        )}
        <div>
          <p className="font-display text-2xl font-bold">{recap.userName}</p>
          {recap.persona && <p className="text-sm font-bold text-primary">{recap.persona}</p>}
        </div>
      </motion.div>
    </Shell>
  )
}

function BattlesSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell index={index}>
      <Kicker>Battles fought</Kicker>
      <HeroNumber value={recap.totalBattles} />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-4 max-w-xs text-lg text-textMuted"
      >
        {recap.totalBattles === 1 ? 'One room. One shot.' : 'Every room entered, every question answered.'}
      </motion.p>
    </Shell>
  )
}

function WinRateSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  const radius = 84
  const circumference = 2 * Math.PI * radius
  return (
    <Shell index={index}>
      <Kicker>Win rate</Kicker>
      <div className="relative mt-6 h-52 w-52">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="16" className="stroke-border" />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#00d4aa"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (recap.winRate / 100) * circumference }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <p className="font-display text-6xl font-extrabold">
            {recap.winRate}
            <span className="text-2xl text-primary">%</span>
          </p>
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-5 flex items-center gap-2 text-lg text-textMuted"
      >
        <Trophy size={18} className="text-primary" />
        {recap.wins}W · {recap.losses}L{recap.draws > 0 ? ` · ${recap.draws}D` : ''}
      </motion.p>
    </Shell>
  )
}

function LanguageSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell index={index}>
      <Kicker>Most battled stack</Kicker>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 text-primary"
      >
        <Code2 size={40} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="mt-4 font-display text-6xl font-extrabold leading-none sm:text-7xl"
      >
        {recap.topLanguage}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-4 text-lg text-textMuted"
      >
        Your weapon of choice this season.
      </motion.p>
    </Shell>
  )
}

function StreakSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell index={index}>
      <Kicker>Longest win streak</Kicker>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
        className="mt-4 flex items-center gap-4"
      >
        <span className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-red-500 shadow-glow">
          <Flame size={52} className="text-white" />
        </span>
        <p className="font-display text-[110px] font-extrabold leading-none sm:text-[140px]">
          {recap.longestWinStreak}
        </p>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-4 text-lg text-textMuted"
      >
        wins in a row
        {recap.currentWinStreak > 0 ? ` · riding ${recap.currentWinStreak} right now` : ''}.
      </motion.p>
    </Shell>
  )
}

function BusiestDaySlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell index={index}>
      <Kicker>You battled most on</Kicker>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 text-primary"
      >
        <CalendarDays size={40} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="mt-4 font-display text-6xl font-extrabold leading-none sm:text-7xl"
      >
        {recap.busiestDay}s
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-4 text-lg text-textMuted"
      >
        {recap.busiestDayCount} {recap.busiestDayCount === 1 ? 'battle' : 'battles'} and counting.
      </motion.p>
    </Shell>
  )
}

function PercentileSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell index={index}>
      <Kicker>Across the whole arena</Kicker>
      <motion.p
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 font-display text-[100px] font-extrabold leading-none sm:text-[130px]"
      >
        Top <span className="text-primary">{recap.topPercent}%</span>
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-4 flex items-center gap-2 text-lg text-textMuted"
      >
        <Crown size={18} className="text-primary" />
        Rank #{recap.rank} of {recap.totalRanked} battlers.
      </motion.p>
    </Shell>
  )
}

function BadgesSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell index={index}>
      <Kicker>Trophy case · {recap.badges.length}</Kicker>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {recap.badges.slice(0, 6).map((badge, i) => (
          <motion.div
            key={`${badge.badgeId}-${i}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.12 }}
            className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur"
          >
            <Medal size={26} className="shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{badge.badgeId}</p>
              <p className="text-xs uppercase tracking-wider text-textMuted">{badge.tier}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Shell>
  )
}

function StarterSlide({ recap, index }: { recap: IWrappedRecap; index: number }) {
  return (
    <Shell index={index}>
      <Kicker>Just getting started</Kicker>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 text-primary"
      >
        <Swords size={40} />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="mt-4 font-display text-5xl font-extrabold leading-tight sm:text-6xl"
      >
        {recap.userName}, your story starts with one battle.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-4 max-w-sm text-lg text-textMuted"
      >
        Fight your first duel and come back — this recap writes itself from real results.
      </motion.p>
      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        href="/arena"
        className="hover-target mt-8 inline-flex w-fit items-center gap-2 rounded-2xl bg-primary px-7 py-4 font-bold text-background"
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
  const slides: StorySlide[] = [
    { id: 'open', durationMs: 4500, render: () => <ColdOpenSlide recap={recap} index={0} /> },
    { id: 'battles', durationMs: 4500, render: () => <BattlesSlide recap={recap} index={1} /> },
    { id: 'winrate', durationMs: 5000, render: () => <WinRateSlide recap={recap} index={2} /> },
  ]
  let next = 3
  if (recap.topLanguage) {
    slides.push({ id: 'language', durationMs: 4500, render: () => <LanguageSlide recap={recap} index={next} /> })
    next += 1
  }
  if (recap.longestWinStreak > 0) {
    slides.push({ id: 'streak', durationMs: 4500, render: () => <StreakSlide recap={recap} index={next} /> })
    next += 1
  }
  if (recap.busiestDay) {
    slides.push({ id: 'day', durationMs: 4500, render: () => <BusiestDaySlide recap={recap} index={next} /> })
    next += 1
  }
  if (recap.topPercent !== null) {
    slides.push({ id: 'percentile', durationMs: 4500, render: () => <PercentileSlide recap={recap} index={next} /> })
    next += 1
  }
  if (recap.badges.length > 0) {
    slides.push({ id: 'badges', durationMs: 5000, render: () => <BadgesSlide recap={recap} index={next} /> })
    next += 1
  }
  slides.push({ id: 'share', durationMs: 0, render: finalRender })
  return slides.slice(0, 9)
}
