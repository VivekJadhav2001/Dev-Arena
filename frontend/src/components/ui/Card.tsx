import { cn } from '../../utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  padded?: boolean
  glow?: boolean
}

export function Card({ elevated = false, padded = true, glow = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        elevated && 'card-elevated',
        padded && 'card-padded',
        glow && 'card-glow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
