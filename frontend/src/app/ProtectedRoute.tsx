import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="page-loading">
      <div className="spinner" />
      <p>Loading your workspace...</p>
    </div>
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
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