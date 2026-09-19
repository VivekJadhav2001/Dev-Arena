import { LoaderCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Gate for logged-in-only routes (dashboard, DNA, wrapped, arena, battle,
 * live, leaderboard, profiles, settings). Logged-out visitors are sent to
 * /login; the session is revalidated first so a direct link or refresh
 * never flashes a redirect for a user who is actually signed in.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading && !user) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-textMuted">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <LoaderCircle size={17} className="animate-spin" />
          Checking your session…
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
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
