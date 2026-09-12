import { Link, useRouteError } from 'react-router-dom'

export function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : 'Something went wrong here.'

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className="text-sm font-bold text-primary">UNEXPECTED ERROR</p>
      <h1 className="mt-2 font-display text-4xl font-bold">This page crashed.</h1>
      <p className="mx-auto mt-3 max-w-md text-textMuted">{message}</p>
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-primary px-5 py-3 font-bold text-background"
        >
          Reload page
        </button>
        <Link
          to="/dashboard"
          className="rounded-xl border border-border px-5 py-3 font-semibold hover:border-borderHover"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
