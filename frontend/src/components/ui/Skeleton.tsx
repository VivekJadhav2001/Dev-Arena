import { cn } from '../../utils/cn'

export function Skeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('skeleton-block', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton-line" style={{ width: `${90 - index * 8}%` }} />
      ))}
    </div>
  )
}
