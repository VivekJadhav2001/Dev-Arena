import { CircleHelp } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-icon"><CircleHelp size={28} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
