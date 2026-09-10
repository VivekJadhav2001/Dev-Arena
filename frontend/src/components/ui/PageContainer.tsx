import { cn } from '../../utils/cn'

export interface PageContainerProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageContainer({ children, title, subtitle, actions, className }: PageContainerProps) {
  return (
    <div className={cn('page-container', className)}>
      {(title || actions) && (
        <div className="page-heading">
          <div>
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
