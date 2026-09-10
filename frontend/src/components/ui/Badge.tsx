import { cn } from '../../utils/cn'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  outline?: boolean
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'neutral', outline = false, size = 'md' }: BadgeProps) {
  return (
    <span className={cn(
      'badge',
      `badge-${variant}`,
      outline && 'badge-outline',
      size === 'sm' && 'badge-sm',
    )}>
      {children}
    </span>
  )
}
