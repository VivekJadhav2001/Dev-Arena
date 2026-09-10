import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export function Input({ label, error, hint, icon, className, ...props }: InputProps) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className={cn('input-wrap', icon && 'input-with-icon')}>{icon}</div>
      <input
        className={cn('input', error && 'input-error', className)}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
