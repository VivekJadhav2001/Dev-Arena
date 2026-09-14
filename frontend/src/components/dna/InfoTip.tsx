import { Info } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '../../utils/cn'

interface InfoTipProps {
  text: string
  label: string
  className?: string
}

/**
 * Small info icon with hover + focus tooltip.
 * CSS-only visibility (group-hover / focus-within) so it works without
 * portals, plus aria-describedby for screen readers and tap-to-toggle
 * for touch via a button.
 */
export function InfoTip({ text, label, className }: InfoTipProps) {
  const id = useId()
  const [pinned, setPinned] = useState(false)
  return (
    <span className={cn('group relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={id}
        onClick={() => setPinned((v) => !v)}
        onBlur={() => setPinned(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-textSubtle transition-colors hover:text-primary focus-visible:text-primary"
      >
        <Info size={13} />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-xl border border-border bg-surfaceElevated p-3 text-left text-xs font-normal leading-5 text-textMuted opacity-0 shadow-card transition-opacity duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          pinned && 'opacity-100',
        )}
      >
        {text}
      </span>
    </span>
  )
}
