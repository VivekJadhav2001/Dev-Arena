
export interface ProgressProps {
  value: number
  max?: number
  label?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  showValue?: boolean
}

export function Progress({ value, max = 100, label, color = 'primary', showValue = true }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="progress-block">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showValue && <span className="progress-value">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-fill progress-${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
