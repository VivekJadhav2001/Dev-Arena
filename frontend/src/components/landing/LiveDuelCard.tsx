import { useEffect, useState } from 'react'

const SCRIPT: { text: string; tone: 'dim' | 'std' | 'good' | 'violet' }[] = [
  { text: '$ deverena join KX7Q2P --duel', tone: 'dim' },
  { text: '✓ anu.sh joined · 1,240 XP · “Night Owl”', tone: 'std' },
  { text: '✓ ravi_codes joined · 1,187 XP · “Polyglot”', tone: 'std' },
  { text: 'Q3/5  closures — anu +120 (0.8s)', tone: 'good' },
  { text: 'Q4/5  git rebase — ravi +110 (1.1s)', tone: 'violet' },
  { text: '◷ 00:07 left · anu 340 — ravi 310', tone: 'dim' },
  { text: '✔ winner: anu.sh · +48 XP · receipt #4821', tone: 'good' },
]

const TONE_CLASS: Record<string, string> = {
  dim: 'text-textSubtle',
  std: 'text-textMuted',
  good: 'text-primary',
  violet: 'text-secondary',
}

/**
 * LiveDuelCard — a hand-set terminal receipt that replays a finished duel
 * on a loop. Gives the hero a heartbeat without faking live backend data:
 * copy is fixed, timing is the only motion.
 */
export function LiveDuelCard() {
  const [lineCount, setLineCount] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? SCRIPT.length
      : 1,
  )
  const [chars, setChars] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? SCRIPT[SCRIPT.length - 1].text.length
      : 0,
  )

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const current = SCRIPT[Math.min(lineCount - 1, SCRIPT.length - 1)].text
    if (chars < current.length) {
      const id = window.setTimeout(() => setChars((c) => c + 1), 18 + Math.random() * 30)
      return () => window.clearTimeout(id)
    }
    if (lineCount < SCRIPT.length) {
      const id = window.setTimeout(() => {
        setLineCount((l) => l + 1)
        setChars(0)
      }, 420)
      return () => window.clearTimeout(id)
    }
    const id = window.setTimeout(() => {
      setLineCount(1)
      setChars(0)
    }, 4200)
    return () => window.clearTimeout(id)
  }, [lineCount, chars])

  const progress = Math.min(1, lineCount / SCRIPT.length)

  return (
    <div className="hover-target relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-[#0b0d14]/90 shadow-card backdrop-blur">
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[11px] tracking-wider text-textSubtle">
          live · room KX7Q2P
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          server-verified
        </span>
      </div>

      {/* log */}
      <div className="min-h-[196px] px-4 py-4 font-mono text-[12.5px] leading-6">
        {SCRIPT.slice(0, lineCount).map((line, i) => {
          const isLast = i === lineCount - 1
          const text = isLast ? line.text.slice(0, chars) : line.text
          return (
            <p key={i} className={TONE_CLASS[line.tone]}>
              {text}
              {isLast && <span className="landing-caret ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 bg-primary" />}
            </p>
          )
        })}
      </div>

      {/* footer: question progress + receipt note */}
      <div className="border-t border-border/70 px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[11px] text-textSubtle">
          <span>
            Q{Math.min(5, 2 + lineCount)}/5
          </span>
          <span>signed by server · #4821</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surfaceRaised">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
