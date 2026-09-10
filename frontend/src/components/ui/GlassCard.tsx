import { cn } from '../../utils/cn'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div className={cn('glass-card', className)} {...props}>
      {children}
    </div>
  )
}
