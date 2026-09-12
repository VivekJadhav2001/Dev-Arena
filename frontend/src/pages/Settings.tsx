import { useState } from 'react'
import { Code2, LoaderCircle } from 'lucide-react'
import { LeetCodeUsernameModal } from '../components/leetcode/LeetCodeUsernameModal'
import { useAuthStore } from '../store/auth.store'
import { leetcodeService } from '../services/leetcode.service'
import { userService } from '../services/user.service'

function SettingsForm({ initialAllowChallenges, initialPublicProfile }: { initialAllowChallenges: boolean; initialPublicProfile: boolean }) {
  const checkSession = useAuthStore((s) => s.checkSession)
  const [allowChallenges, setAllowChallenges] = useState(initialAllowChallenges)
  const [publicProfile, setPublicProfile] = useState(initialPublicProfile)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [leetcodeOpen, setLeetcodeOpen] = useState(false)
  const leetcodeUsername = useAuthStore((s) => s.user?.leetcodeUsername ?? null)

  async function save() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await userService.updateSettings({ allowChallenges, publicProfile })
      await checkSession(true)
      setMessage('Preferences saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
    <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-bold">Challenges</h2>
      <p className="mt-2 text-sm text-textMuted">
        Control whether other developers can send you battle requests.
      </p>

      <label className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
        <span>
          <b className="text-sm">Public profile</b>
          <span className="block text-xs text-textMuted">Anyone with your link can view /u/username</span>
        </span>
        <button
          onClick={() => setPublicProfile((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition ${publicProfile ? 'bg-primary' : 'bg-border'}`}
          aria-pressed={publicProfile}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${publicProfile ? 'left-6' : 'left-1'}`} />
        </button>
      </label>

      <label className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
        <span>
          <b className="text-sm">Allow code challenges</b>
          <span className="block text-xs text-textMuted">Let developers send you battle requests</span>
        </span>
        <button
          onClick={() => setAllowChallenges((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition ${allowChallenges ? 'bg-primary' : 'bg-border'}`}
          aria-pressed={allowChallenges}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${allowChallenges ? 'left-6' : 'left-1'}`} />
        </button>
      </label>

      {error && <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">{error}</div>}
      {message && <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm">{message}</div>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => void save()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-background hover:brightness-110 disabled:opacity-60"
        >
          {busy && <LoaderCircle size={15} className="animate-spin" />} Save preferences
        </button>
      </div>
    </section>

    <section className="mt-4 rounded-2xl border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 font-bold">
        <Code2 size={18} className="text-primary" /> LeetCode
      </h2>
      <p className="mt-2 text-sm text-textMuted">
        {leetcodeUsername
          ? `Connected as ${leetcodeUsername}. Stats appear on your dashboard and public profile.`
          : 'Connect your public LeetCode username to showcase problem-solving stats.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setLeetcodeOpen(true)}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-borderHover"
        >
          {leetcodeUsername ? 'Change username' : 'Connect LeetCode'}
        </button>
        {leetcodeUsername && (
          <button
            onClick={() => {
              void leetcodeService
                .disconnect()
                .then(() => checkSession(true))
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : 'Unable to disconnect LeetCode.'),
                )
            }}
            className="rounded-xl border border-danger/50 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-danger/10"
          >
            Disconnect
          </button>
        )}
      </div>
    </section>
    {leetcodeOpen && <LeetCodeUsernameModal onClose={() => setLeetcodeOpen(false)} />}
    </>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-textMuted">Update your preferences here.</p>
      {loading || !user ? (
        <div className="mt-6 flex items-center gap-2 text-textMuted">
          <LoaderCircle size={17} className="animate-spin" /> Loading settings…
        </div>
      ) : (
        <SettingsForm
          key={user.id}
          initialAllowChallenges={user.settings.allowChallenges ?? true}
          initialPublicProfile={user.settings.publicProfile ?? true}
        />
      )}
    </div>
  )
}
