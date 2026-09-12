import { motion } from 'framer-motion'
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Code2,
  Flame,
  Github,
  LoaderCircle,
  Medal,
  Share2,
  Star,
  Swords,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LeetCodeStats } from '../components/leetcode/LeetCodeStats'
import { HeatWall, type HeatDay } from '../components/profile/ActivityHeatmap'
import { copyText } from '../lib/clipboard'
import { userService } from '../services/user.service'
import type { BadgeTier, IUser } from '../types'

const TIER_STYLES: Record<BadgeTier, string> = {
  bronze: 'border-[#cd7f32]/50 bg-[#cd7f32]/10 text-[#e8a06a]',
  silver: 'border-slate-300/40 bg-slate-300/10 text-slate-200',
  gold: 'border-[#ffd447]/50 bg-[#ffd447]/10 text-[#ffd447]',
  platinum: 'border-sky-300/50 bg-sky-300/10 text-sky-200',
  diamond: 'border-fuchsia-300/50 bg-fuchsia-300/10 text-fuchsia-200',
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#e76f00',
  Go: '#00add8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  'C++': '#f34b7d',
  C: '#555555',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#ffac45',
  Kotlin: '#7f52ff',
  Dart: '#0175c2',
}

function languageColor(name: string): string {
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return `hsl(${hash} 70% 60%)`
}

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export default function PublicProfile() {
  const { username = '' } = useParams()
  const [user, setUser] = useState<IUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      setUser(await userService.getProfile(username))
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'This profile is private or does not exist.')
    }
  }, [username])

  useEffect(() => {
    // Fetch resolves asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const githubWall = useMemo<HeatDay[]>(() => {
    return (user?.githubStats?.activityCalendar ?? []).map((entry) => ({
      day: entry.day,
      count: entry.count,
      lines: (entry.repos ?? []).flatMap((repo) =>
        repo.commits.length > 0
          ? [`${repo.name}`, ...repo.commits.map((message) => `  ${message}`)]
          : [repo.name],
      ),
    }))
  }, [user])

  const leetcodeWall = useMemo<HeatDay[]>(() => {
    return (user?.leetcodeStats?.dailySolved ?? []).map((entry) => ({
      day: entry.day,
      count: entry.count,
      lines: (entry.problems ?? []).map((problem) => `${problem.title} (${problem.lang})`),
    }))
  }, [user])

  const languages = useMemo(() => {
    const entries = Object.entries(user?.githubStats?.languages ?? {})
    const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0)
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, bytes]) => ({
        name,
        percent: total > 0 ? Math.round((bytes / total) * 100) : 0,
      }))
  }, [user])

  async function share() {
    const ok = await copyText(`${window.location.origin}/u/${username}`)
    setCopied(ok)
    if (ok) window.setTimeout(() => setCopied(false), 2000)
  }

  if (error && !user) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">
          {error}
        </div>
        <Link to="/leaderboard" className="mt-4 inline-block text-sm font-bold text-primary underline">
          Browse rankings instead
        </Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-4xl items-center gap-3 text-textMuted">
        <LoaderCircle className="animate-spin" size={17} /> Loading profile…
      </div>
    )
  }

  const initials = (user.userName?.[0] ?? 'D').toUpperCase()
  const wins = user.battleStats?.wins ?? 0
  const losses = user.battleStats?.losses ?? 0
  const draws = user.battleStats?.draws ?? 0
  const totalBattles = user.battleStats?.totalBattles ?? 0
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const badges = user.badges ?? []
  const topRepos = (user.githubStats?.mostActiveRepos ?? []).slice(0, 5)

  const heroStats: Array<{ icon: typeof Code2; value: string; label: string }> = [
    { icon: Code2, value: String(user.githubStats?.totalCommits ?? 0), label: 'commits' },
    { icon: Swords, value: String(wins), label: 'battle wins' },
    { icon: Medal, value: String(badges.length), label: 'badges' },
    { icon: Target, value: `${winRate}%`, label: 'win rate' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Hero ─────────────────────────────────────────── */}
      <motion.section
        variants={card}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-secondary/30 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-primary/25 blur-[110px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[.15]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(255 255 255 / .25) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / .25) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 80% 90% at 50% 0%, black 30%, transparent 75%)',
          }}
        />

        <div className="relative p-7 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-24 w-24 rounded-3xl object-cover ring-4 ring-primary/40 shadow-[0_0_50px_-8px_var(--color-primary,#22c55e)]"
                  />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-secondary to-primary text-3xl font-bold ring-4 ring-primary/40">
                    {initials}
                  </div>
                )}
                <span className="absolute -bottom-2 -right-2 rounded-xl bg-primary px-2 py-1 text-xs font-black text-background shadow-glow">
                  LV {user.level}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[.2em] text-primary">
                  Developer proof
                </p>
                <h1 className="mt-1 font-display text-4xl font-bold sm:text-5xl">{user.userName}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-textMuted">
                  <span>{user.totalXp} XP earned</span>
                  {user.githubStats?.topLanguage && (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: languageColor(user.githubStats.topLanguage) }}
                      />
                      {user.githubStats.topLanguage}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs">
                    <CalendarDays size={13} />
                    since {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'recently'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {user.provider === 'github' && (
                <a
                  href={`https://github.com/${user.userName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm backdrop-blur hover:border-borderHover"
                >
                  <Github size={16} />
                  GitHub
                </a>
              )}
              <button
                onClick={() => void share()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background shadow-glow hover:brightness-110"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>

          {user.persona && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/15 p-4">
              <BadgeCheck size={20} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <b>{user.persona}</b>
                {user.personaReason && (
                  <p className="mt-1 text-sm leading-6 text-textMuted">{user.personaReason}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroStats.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                variants={card}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur"
              >
                <Icon size={18} className="text-primary" />
                <p className="mt-3 font-display text-3xl font-bold">{value}</p>
                <p className="text-sm text-textMuted">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── LeetCode ─────────────────────────────────────── */}
      {user.leetcodeUsername && user.leetcodeStats && (
        <motion.section
          variants={card}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mt-6 rounded-2xl border border-border bg-surface p-6"
        >
          <h2 className="flex items-center gap-2 font-bold">
            <Code2 className="text-primary" size={19} />
            LeetCode grind
          </h2>
          <div className="mt-4">
            <LeetCodeStats stats={user.leetcodeStats} username={user.leetcodeUsername} />
          </div>
        </motion.section>
      )}

      {/* ── Activity heat walls ──────────────────────────── */}
      <motion.section
        variants={card}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-6 rounded-2xl border border-border bg-surface p-6"
      >
        <h2 className="flex items-center gap-2 font-bold">
          <Flame className="text-primary" size={19} />
          Contribution heat walls
        </h2>
        <p className="mt-1 text-sm text-textMuted">
          Hover any day to see exactly what moved — repos and commits, or problems solved.
        </p>
        <div className="mt-6 space-y-8">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Github size={16} className="text-primary" />
              GitHub commits
            </p>
            <HeatWall
              entries={githubWall}
              accent="green"
              unit="pushes"
              emptyText="No GitHub activity yet — sync GitHub to light up this wall."
            />
          </div>
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Code2 size={16} className="text-amber-400" />
              LeetCode solves
            </p>
            <HeatWall
              entries={leetcodeWall}
              accent="amber"
              unit="solves"
              emptyText="No LeetCode activity yet — connect LeetCode to light up this wall."
            />
          </div>
        </div>
      </motion.section>

      {/* ── Detail grid ──────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <motion.section
            variants={card}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <h2 className="flex items-center gap-2 font-bold">
              <Trophy className="text-primary" size={19} />
              Battle record
            </h2>
            <div className="mt-4 flex items-end gap-2">
              <p className="font-display text-4xl font-bold">
                {wins}<span className="text-textSubtle">W</span> · {losses}
                <span className="text-textSubtle">L</span>
                {draws > 0 && (
                  <>
                    {' '}· {draws}<span className="text-textSubtle">D</span>
                  </>
                )}
              </p>
              <p className="pb-1 text-sm text-textMuted">across {totalBattles} battles</p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${winRate}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
              />
            </div>
            <p className="mt-2 text-xs text-textSubtle">
              {winRate}% win rate
              {user.battleStats?.bestWinStreak ? ` · best streak ${user.battleStats.bestWinStreak}` : ''}
              {user.battleStats?.favoriteLanguage ? ` · sharpest in ${user.battleStats.favoriteLanguage}` : ''}
            </p>
          </motion.section>

          {topRepos.length > 0 && (
            <motion.section
              variants={card}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h2 className="flex items-center gap-2 font-bold">
                <Flame className="text-primary" size={19} />
                Most active repositories
              </h2>
              <div className="mt-4 space-y-3">
                {topRepos.map((repo) => {
                  const max = Math.max(...topRepos.map((r) => r.commits), 1)
                  return (
                    <div key={repo.repo}>
                      <div className="flex items-center justify-between text-sm">
                        <b className="truncate">{repo.repo}</b>
                        <span className="ml-3 shrink-0 text-textMuted">{repo.commits} commits</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.round((repo.commits / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )}

          {languages.length > 0 && (
            <motion.section
              variants={card}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.4, delay: 0.25 }}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h2 className="flex items-center gap-2 font-bold">
                <Code2 className="text-primary" size={19} />
                Language fingerprint
              </h2>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                {languages.map((l) => (
                  <div
                    key={l.name}
                    title={`${l.name} ${l.percent}%`}
                    style={{ width: `${l.percent}%`, background: languageColor(l.name) }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {languages.map((l) => (
                  <span key={l.name} className="inline-flex items-center gap-1.5 text-sm text-textMuted">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: languageColor(l.name) }}
                    />
                    {l.name} <b className="text-text">{l.percent}%</b>
                  </span>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        <div className="space-y-4">
          <motion.section
            variants={card}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <h2 className="flex items-center gap-2 font-bold">
              <Users className="text-primary" size={19} />
              GitHub gravity
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              {[
                [String(user.githubStats?.followers ?? 0), 'followers'],
                [String(user.githubStats?.following ?? 0), 'following'],
                [String(user.githubStats?.stars ?? 0), 'stars'],
                [String(user.githubStats?.publicRepos ?? 0), 'repos'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-background p-3">
                  <b className="block text-xl">{n}</b>
                  <span className="text-xs text-textMuted">{l}</span>
                </div>
              ))}
            </div>
            {(user.githubStats?.contributionStreak ?? 0) > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                <Star size={15} />
                {user.githubStats?.contributionStreak}-day contribution streak
              </p>
            )}
          </motion.section>

          <motion.section
            variants={card}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <h2 className="flex items-center gap-2 font-bold">
              <Medal className="text-primary" size={19} />
              Badges
              <span className="ml-auto text-sm font-normal text-textMuted">{badges.length}</span>
            </h2>
            {badges.length === 0 ? (
              <p className="mt-3 text-sm text-textMuted">
                No badges yet — battles and streaks earn them.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={`${badge.badgeId}-${badge.earnedAt}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${TIER_STYLES[badge.tier] ?? 'border-border text-textMuted'}`}
                  >
                    <Medal size={13} />
                    {badge.badgeId}
                  </span>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  )
}
