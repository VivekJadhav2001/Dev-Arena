import React from 'react'
import { cn } from '../../utils/cn'

export interface AvatarProps {
  src: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
}

export function Avatar({ src, alt, size = 'md', fallback = 'DEV' }: AvatarProps) {
  const [failed, setFailed] = React.useState(false)

  return (
    <div
      className={cn('avatar', `avatar-${size}`, failed && 'avatar-fallback')}
      style={src && !failed ? { backgroundImage: `url(${src})` } : undefined}
      role="img"
      aria-label={alt}
      onError={() => setFailed(true)}
    >
      {(!src || failed) && <span>{fallback}</span>}
    </div>
  )
}
