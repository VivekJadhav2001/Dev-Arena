import { cn } from '../../utils/cn'
import { AnimatedCounter } from './AnimatedCounter'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  subtext?: string
  trend?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function StatCard({ label, value, icon, subtext, trend, tone = 'neutral', className }: StatCardProps) {
  const toneClass = `stat-tone-${tone}`
  return (
    <div className={cn('stat-card', toneClass, className)}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <AnimatedCounter value={value} />
        <span className="stat-subtext">{subtext}</span>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
    </div>
  )
}
