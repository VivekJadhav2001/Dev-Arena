import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { StorySlide } from './slides'

function clampIndex(value: number, total: number): number {
  if (value < 0) return 0
  if (value >= total) return total - 1
  return value
}

interface StoryPlayerProps {
  slides: StorySlide[]
  onExit: () => void
}

/**
 * Full-viewport story player: segmented progress, tap zones, arrows,
 * swipe, hold-to-pause, skip and counter. Interactive slides (duration 0)
 * disable auto-advance and tap zones so their buttons stay clickable.
 */
export function StoryPlayer({ slides, onExit }: StoryPlayerProps) {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const progressRef = useRef(0)
  const indexRef = useRef(0)

  const total = slides.length
  const current = slides[Math.min(index, total - 1)]
  const durationMs = current?.durationMs ?? 0
  const interactive = durationMs <= 0

  const go = useCallback(
    (delta: number) => {
      indexRef.current = clampIndex(indexRef.current + delta, total)
      progressRef.current = 0
      setIndex(indexRef.current)
      setProgress(0)
    },
    [total],
  )

  // Auto-advance driven by rAF so hold-pause resumes exactly.
  useEffect(() => {
    if (durationMs <= 0 || paused) return
    let raf = 0
    const startedAt = performance.now() - progressRef.current * durationMs
    const tick = (now: number) => {
      const elapsed = now - startedAt
      if (elapsed >= durationMs) {
        if (indexRef.current < total - 1) {
          indexRef.current += 1
          progressRef.current = 0
          setIndex(indexRef.current)
          setProgress(0)
        } else {
          progressRef.current = 1
          setProgress(1)
        }
        return
      }
      progressRef.current = elapsed / durationMs
      setProgress(progressRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [index, total, paused, durationMs])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1)
      else if (event.key === 'ArrowLeft') go(-1)
      else if (event.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onExit])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button, a')) return
        setPaused(true)
      }}
      onPointerUp={() => setPaused(false)}
      onPointerLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const startX = touchStartX.current
        touchStartX.current = null
        if (startX === null) return
        const deltaX = (e.changedTouches[0]?.clientX ?? startX) - startX
        if (deltaX < -50) go(1)
        else if (deltaX > 50) go(-1)
      }}
    >
      <div className="relative h-full max-h-[92vh] w-full max-w-[480px] overflow-hidden rounded-3xl border border-white/10 shadow-card">
        {/* Progress segments */}
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-3">
          {slides.map((slide, i) => (
            <div key={slide.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }}
              />
            </div>
          ))}
        </div>

        {/* Top controls */}
        <div className="absolute inset-x-0 top-6 z-20 flex items-center justify-between px-4 pt-1 text-sm font-bold text-white/90">
          <span>
            {index + 1}/{total}
          </span>
          <div className="flex items-center gap-2">
            {index < total - 1 && (
              <button
                onClick={() => go(total)}
                className="rounded-full bg-black/40 px-3 py-1.5 backdrop-blur transition hover:bg-black/60"
              >
                Skip
              </button>
            )}
            <button
              onClick={onExit}
              aria-label="Close story"
              className="rounded-full bg-black/40 p-1.5 backdrop-blur transition hover:bg-black/60"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current?.id}-${index}`}
            initial={{ opacity: 0, scale: 1.04, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full"
          >
            {current?.render()}
          </motion.div>
        </AnimatePresence>

        {/* Tap zones (disabled on interactive slides) */}
        {!interactive && (
          <>
            <button
              aria-label="Previous slide"
              onClick={() => go(-1)}
              className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize"
            />
            <button
              aria-label="Next slide"
              onClick={() => go(1)}
              className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-e-resize"
            />
          </>
        )}
      </div>
    </div>
  )
}
