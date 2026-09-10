import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

interface AnimatedCounterProps {
  value: string | number
  duration?: number
  className?: string
  decimals?: number
}

export function AnimatedCounter({ value, duration = 1200, className, decimals = 0 }: AnimatedCounterProps) {
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0
    const startTime = performance.now()
    let animationFrame: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      setDisplay(current.toFixed(decimals))
      if (progress < 1) animationFrame = requestAnimationFrame(tick)
    }

    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, decimals])

  return <span className={cn('animated-counter', className)}>{display}</span>
}
