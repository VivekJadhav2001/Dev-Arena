import { Code2, LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'
import { leetcodeService } from '../../services/leetcode.service'
import { useAuthStore } from '../../store/auth.store'

interface LeetCodeUsernameModalProps {
  onClose: () => void
  title?: string
  subtitle?: string
}

/** Popup that collects the LeetCode username when it is missing (or lets it be changed). */
export function LeetCodeUsernameModal({ onClose, title, subtitle }: LeetCodeUsernameModalProps) {
  const checkSession = useAuthStore((s) => s.checkSession)
  const existing = useAuthStore((s) => s.user?.leetcodeUsername ?? '')
  const [username, setUsername] = useState(existing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    const clean = username.trim()
    if (!clean) {
      setError('Enter your LeetCode username.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await leetcodeService.connect(clean)
      await checkSession(true)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect LeetCode.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Code2 size={22} />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-textMuted hover:bg-surfaceRaised hover:text-text"
          >
            <X size={17} />
          </button>
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">{title ?? 'Connect LeetCode'}</h2>
        <p className="mt-2 text-sm leading-6 text-textMuted">
          {subtitle ??
            'Add your public LeetCode username to unlock problem-solving stats on your dashboard and public profile. Only public data is ever read.'}
        </p>

        <label className="mt-5 block">
          <span className="text-xs font-bold uppercase tracking-wider text-textMuted">
            LeetCode username
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void connect()
            }}
            placeholder="e.g. neetcode"
            maxLength={30}
            autoFocus
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-textSubtle focus:border-primary/60 focus:outline-none"
          />
        </label>

        {error && (
          <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover"
          >
            Skip for now
          </button>
          <button
            onClick={() => void connect()}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background hover:brightness-110 disabled:opacity-60"
          >
            {busy && <LoaderCircle size={15} className="animate-spin" />}
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}
