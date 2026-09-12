import { Award, CalendarDays, ExternalLink, Flame, Trophy } from 'lucide-react'
import type { ILeetCodeStats } from '../../types'

function SolvedRing({ total, easy, medium, hard }: { total: number; easy: number; medium: number; hard: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const segments = [
    { value: easy, color: '#22c55e' },
    { value: medium, color: '#eab308' },
    { value: hard, color: '#ef4444' },
  ]
  const denom = Math.max(total, 1)
  let offset = 0
  return (
    <div className="relative grid h-36 w-36 place-items-center">
      <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="11" className="stroke-border" />
        {segments.map((seg) => {
          const frac = seg.value / denom
          const dash = `${frac * circumference} ${circumference}`
          const el = (
            <circle
              key={seg.color}
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={-offset * circumference}
            />
          )
          offset += frac
          return el
        })}
      </svg>
      <div className="text-center">
        <p className="font-display text-3xl font-bold">{total}</p>
        <p className="text-xs text-textMuted">solved</p>
      </div>
    </div>
  )
}

/** Shared LeetCode showcase rendered on the Dashboard and the public profile. */
export function LeetCodeStats({ stats, username }: { stats: ILeetCodeStats; username: string }) {
  const breakdown = [
    { label: 'Easy', value: stats.easySolved, color: '#22c55e' },
    { label: 'Medium', value: stats.mediumSolved, color: '#eab308' },
    { label: 'Hard', value: stats.hardSolved, color: '#ef4444' },
  ]
  const maxLang = Math.max(...stats.languages.map((l) => l.solved), 1)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <SolvedRing
          total={stats.totalSolved}
          easy={stats.easySolved}
          medium={stats.mediumSolved}
          hard={stats.hardSolved}
        />
        <div className="min-w-0 flex-1">
          <a
            href={`https://leetcode.com/u/${username}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-display text-2xl font-bold hover:text-primary"
          >
            {username}
            <ExternalLink size={17} className="text-textMuted" />
          </a>
          <div className="mt-2 space-y-1.5">
            {breakdown.map((row) => (
              <div key={row.label} className="flex items-center gap-2 text-sm">
                <span className="w-14 text-textMuted">{row.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stats.totalSolved > 0 ? Math.round((row.value / stats.totalSolved) * 100) : 0}%`,
                      background: row.color,
                    }}
                  />
                </div>
                <b className="w-10 text-right">{row.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-background p-3 text-center">
          <Trophy size={15} className="mx-auto text-primary" />
          <b className="mt-1 block">{stats.ranking != null ? `#${stats.ranking.toLocaleString()}` : '–'}</b>
          <span className="text-xs text-textMuted">global rank</span>
        </div>
        <div className="rounded-xl bg-background p-3 text-center">
          <Award size={15} className="mx-auto text-primary" />
          <b className="mt-1 block">{stats.contestRating ?? '–'}</b>
          <span className="text-xs text-textMuted">contest rating</span>
        </div>
        <div className="rounded-xl bg-background p-3 text-center">
          <Flame size={15} className="mx-auto text-primary" />
          <b className="mt-1 block">{stats.streak}</b>
          <span className="text-xs text-textMuted">day streak</span>
        </div>
        <div className="rounded-xl bg-background p-3 text-center">
          <CalendarDays size={15} className="mx-auto text-primary" />
          <b className="mt-1 block">{stats.totalActiveDays}</b>
          <span className="text-xs text-textMuted">active days</span>
        </div>
      </div>

      {stats.contestsAttended > 0 && (
        <p className="mt-3 text-sm text-textMuted">
          {stats.contestsAttended} contests attended
          {stats.contestBadge ? ` · ${stats.contestBadge} badge` : ''}
          {stats.contestTopPercentage != null ? ` · top ${stats.contestTopPercentage}%` : ''}
          {stats.contestGlobalRanking != null ? ` · #${stats.contestGlobalRanking.toLocaleString()} globally` : ''}
        </p>
      )}

      {stats.languages.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Top languages</p>
          <div className="mt-2 space-y-2">
            {stats.languages.slice(0, 5).map((lang) => (
              <div key={lang.name} className="flex items-center gap-2 text-sm">
                <span className="w-24 truncate text-textMuted">{lang.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.round((lang.solved / maxLang) * 100)}%` }}
                  />
                </div>
                <b className="w-10 text-right">{lang.solved}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.skillTags.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Strongest topics</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stats.skillTags.slice(0, 8).map((tag) => (
              <span
                key={`${tag.level}-${tag.name}`}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs"
              >
                {tag.name} <b className="text-primary">{tag.solved}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.recentSolved.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-textMuted">Recently solved</p>
          <div className="mt-2 space-y-1.5">
            {stats.recentSolved.slice(0, 5).map((solve) => (
              <a
                key={`${solve.titleSlug}-${solve.timestamp}`}
                href={`https://leetcode.com/problems/${solve.titleSlug}/`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm hover:border-borderHover"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{solve.title}</span>
                <span className="shrink-0 text-xs text-textSubtle">{solve.lang}</span>
                <span className="shrink-0 text-xs text-textSubtle">
                  {new Date(solve.timestamp * 1000).toLocaleDateString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {stats.badges.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-textMuted">LeetCode badges</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.badges.slice(0, 6).map((badge) => (
              <span
                key={badge.name}
                title={badge.earnedAt ?? undefined}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold"
              >
                {badge.icon ? (
                  <img src={badge.icon} alt="" className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <Award size={13} className="text-primary" />
                )}
                {badge.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
