import { useMemo, useState } from 'react'

export interface HeatDay {
  day: string
  count: number
  /** Detail lines shown in the hover card, e.g. repo names or problem titles. */
  lines: string[]
}

const WEEKS = 30
const DAY_MS = 86400000
const MAX_TOOLTIP_LINES = 7

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SCALES: Record<'green' | 'amber', string[]> = {
  green: ['bg-border/40', 'bg-primary/25', 'bg-primary/50', 'bg-primary/75', 'bg-primary'],
  amber: ['bg-border/40', 'bg-amber-400/25', 'bg-amber-400/50', 'bg-amber-400/75', 'bg-amber-400'],
}

function toDayStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function levelFor(total: number): number {
  if (total <= 0) return 0
  if (total === 1) return 1
  if (total <= 3) return 2
  if (total <= 6) return 3
  return 4
}

interface Tip {
  x: number
  y: number
  date: string
  count: number
  lines: string[]
  unit: string
}

/**
 * Single-source contribution wall (GitHub-style). Hovering a day reveals
 * exactly what that day is responsible for via the entry `lines`.
 */
export function HeatWall({
  entries,
  accent,
  unit,
  emptyText,
}: {
  entries: HeatDay[]
  accent: 'green' | 'amber'
  unit: string
  emptyText: string
}) {
  const [tip, setTip] = useState<Tip | null>(null)

  const { weeks, monthLabels, total } = useMemo(() => {
    const byDay = new Map<string, { count: number; lines: string[] }>()
    for (const entry of entries ?? []) {
      const cur = byDay.get(entry.day) ?? { count: 0, lines: [] }
      cur.count += entry.count
      cur.lines.push(...entry.lines)
      byDay.set(entry.day, cur)
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const end = today.getTime()
    const start = new Date(end - (WEEKS * 7 - 1) * DAY_MS)
    // Snap the first column back to Sunday so rows always align Sun–Sat.
    start.setUTCDate(start.getUTCDate() - start.getUTCDay())

    const cols: Array<Array<{ key: string; pretty: string; count: number; lines: string[] }>> = []
    const labels: Array<{ index: number; text: string }> = []
    let lastMonth = -1
    let sum = 0

    for (let cursor = start.getTime(); cursor <= end; cursor += 7 * DAY_MS) {
      const col: Array<{ key: string; pretty: string; count: number; lines: string[] }> = []
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(cursor + d * DAY_MS)
        if (date.getTime() > end) break
        const key = toDayStr(date)
        const found = byDay.get(key) ?? { count: 0, lines: [] }
        sum += found.count
        col.push({
          key,
          pretty: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          count: found.count,
          lines: found.lines,
        })
      }
      const month = new Date(cursor).getUTCMonth()
      if (month !== lastMonth) {
        labels.push({ index: cols.length, text: MONTHS[month] ?? '' })
        lastMonth = month
      }
      cols.push(col)
    }
    return { weeks: cols, monthLabels: labels, total: sum }
  }, [entries])

  const styles = SCALES[accent]

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-textMuted">
        {emptyText}
      </div>
    )
  }

  const shownLines = tip ? tip.lines.slice(0, MAX_TOOLTIP_LINES) : []
  const hiddenLines = tip ? Math.max(0, tip.lines.length - shownLines.length) : 0

  return (
    <div>
      <p className="text-sm text-textMuted">
        <b className="text-text">{total.toLocaleString()}</b> {unit} in the last {WEEKS} weeks
      </p>
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="inline-block">
          <div className="relative mb-1 h-4">
            {monthLabels.map((label) => (
              <span
                key={`${label.index}-${label.text}`}
                className="absolute text-[11px] text-textSubtle"
                style={{ left: 30 + label.index * 15 }}
              >
                {label.text}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 grid grid-rows-7 gap-[3px] text-[10px] leading-[11px] text-textSubtle">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <span key={d} className={i % 2 === 0 ? 'invisible' : ''}>
                  {d}
                </span>
              ))}
            </div>
            {weeks.map((col, ci) => (
              <div key={ci} className="grid grid-rows-7 gap-[3px]">
                {col.map((cell) => (
                  <span
                    key={cell.key}
                    onMouseEnter={(e) =>
                      setTip({
                        x: Math.min(e.clientX, window.innerWidth - 280),
                        y: e.clientY,
                        date: cell.pretty,
                        count: cell.count,
                        lines: cell.lines,
                        unit,
                      })
                    }
                    onMouseLeave={() => setTip(null)}
                    className={`h-[11px] w-[11px] cursor-pointer rounded-[3px] ${styles[levelFor(cell.count)] ?? styles[0]}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-textSubtle">
            Less
            {styles.map((style, i) => (
              <span key={i} className={`h-[11px] w-[11px] rounded-[3px] ${style}`} />
            ))}
            More
          </div>
        </div>
      </div>

      {tip && (
        <div
          className="pointer-events-none fixed z-50 w-64 rounded-xl border border-border bg-surfaceElevated p-3 shadow-card"
          style={{ left: Math.max(8, tip.x + 14), top: Math.max(8, tip.y - 10) }}
        >
          <p className="text-xs font-bold">
            {tip.count === 0 ? `No activity on ${tip.date}` : `${tip.count} ${tip.unit} on ${tip.date}`}
          </p>
          {shownLines.length > 0 && (
            <ul className="mt-1.5 max-h-40 space-y-1 overflow-hidden text-xs leading-5 text-textMuted">
              {shownLines.map((line, i) => (
                <li key={i} className="truncate">
                  · {line}
                </li>
              ))}
            </ul>
          )}
          {hiddenLines > 0 && (
            <p className="mt-1 text-[11px] text-textSubtle">+{hiddenLines} more</p>
          )}
        </div>
      )}
    </div>
  )
}
