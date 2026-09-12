import { useEffect, useState } from 'react'

/** Ease-out-expo count-up: fast start, slow settle. Restarts when `target` changes. */
export function useCountUp(target: number, durationMs = 1400, delayMs = 350): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now
      const elapsed = now - start
      if (elapsed < delayMs) {
        raf = requestAnimationFrame(tick)
        return
      }
      const progress = Math.min(1, (elapsed - delayMs) / durationMs)
      const eased = progress >= 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, delayMs])

  return value
}
