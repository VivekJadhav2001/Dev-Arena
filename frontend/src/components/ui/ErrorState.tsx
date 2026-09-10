import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

export interface ErrorStateProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('error-state', className)} role="alert">
      <AlertTriangle size={26} />
      <div>
        <h3>Something went wrong</h3>
        <p>{message}</p>
      </div>
      {onRetry && <Button variant="secondary" size="sm" icon={<RefreshCw size={15} />} onClick={onRetry}>Retry</Button>}
    </div>
  )
}
