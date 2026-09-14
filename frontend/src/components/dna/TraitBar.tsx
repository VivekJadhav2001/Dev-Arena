import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { InfoTip } from './InfoTip'

interface TraitBarProps {
  label: string
  score: number
  summary?: string
  hint?: string | null
  info?: string
  barClass: string
  delay?: number
}

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      raf = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(raf)
    }
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}

/** Animated trait row: count-up number + spring bar + explainable summary. */
export function TraitBar({ label, score, summary, hint, info, barClass, delay = 0 }: TraitBarProps) {
  const display = useCountUp(score)
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-textMuted">
          {label}
          {info && <InfoTip label={label} text={info} />}
        </p>
        <p className="font-display text-3xl font-bold tabular-nums">
          {display}
          <span className="ml-1 text-sm font-medium text-textSubtle">/100</span>
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-surfaceRaised"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${score} out of 100`}
      >
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: '0%' }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 55, damping: 16, delay }}
        />
      </div>
      {summary && <p className="mt-3 text-sm leading-6 text-textMuted">{summary}</p>}
      {hint && <p className="mt-2 text-xs leading-5 text-warning">{hint}</p>}
    </div>
  )
}
