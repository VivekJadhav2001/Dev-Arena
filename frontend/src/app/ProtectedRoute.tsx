import { Navigate, useRouteError } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="page-loading">
      <div className="spinner" />
      <p>Loading your workspace...</p>
    </div>
  }

  if (!user) {
    const error = useRouteError()
    const from = error instanceof Error ? '/' : '/'
    return <Navigate to="/auth/login" replace state={{ from }} />
  }

  return children
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}