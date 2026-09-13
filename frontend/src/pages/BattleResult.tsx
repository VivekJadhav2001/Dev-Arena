import { Check, Code2, Copy, ListChecks, LoaderCircle, Share2, Trophy } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { copyText } from '../lib/clipboard'
import { arenaService, type IBattleResult } from '../services/arena.service'

export default function BattleResult() {
  const { roomCode = '' } = useParams()
  const [result, setResult] = useState<IBattleResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await arenaService.getResult(roomCode)
      setResult(response.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load this result.'
      setError(
        /401|unauthor|session|log in/i.test(message)
          ? 'Sign in to view this battle result. Results are shared with authorized users only.'
          : message,
      )
    }
  }, [roomCode])

  useEffect(() => {
    // Fetch resolves asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function copyResultLink() {
    const ok = await copyText(`${window.location.origin}/battle/${roomCode}/result`)
    setCopiedLink(ok)
    if (ok) window.setTimeout(() => setCopiedLink(false), 2000)
  }

  async function copyCode() {
    const ok = await copyText(roomCode)
    setCopiedCode(ok)
    if (ok) window.setTimeout(() => setCopiedCode(false), 2000)
  }

  if (error && !result) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
        <Link to="/arena" className="mt-4 inline-block text-sm font-bold text-primary underline">
          Back to Arena
        </Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="mx-auto flex max-w-2xl items-center gap-3 py-10 text-textMuted">
        <LoaderCircle className="animate-spin" size={17} /> Loading result…
      </div>
    )
  }

  const standings = result.standings ?? []
  const winnerEntry = standings.find((s) => s.isWinner) ?? null
  const headline = result.isDraw
    ? 'Draw.'
    : result.myRank === 1
      ? 'You won.'
      : `${winnerEntry?.username ?? 'Someone'} won.`
  const stats = result.myStats
  const breakdown = result.questions ?? []

  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-primary">
        <Trophy size={38} />
      </div>
      <p className="mt-7 text-sm font-bold text-primary">BATTLE COMPLETE</p>
      <h1 className="mt-2 font-display text-5xl font-bold">{headline}</h1>
      <p className="mt-3 text-textMuted">
        {result.mode === 'royale' ? '1-vs-many royale' : '1-vs-1 duel'} · Room {result.roomCode} ·
        Server-verified quiz + coding.
      </p>

      {(result.myScore !== undefined || result.myRank !== undefined) && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <b>{result.myCorrect ?? 0}/{result.totalQuestions}</b>
            <small className="block text-textMuted">correct</small>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <b>#{result.myRank ?? '–'}</b>
            <small className="block text-textMuted">your rank</small>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <b>{result.myAccuracy ?? 0}%</b>
            <small className="block text-textMuted">accuracy</small>
          </div>
        </div>
      )}

      {stats && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <b>{stats.mcqCorrect}/{stats.mcqTotal}</b>
            <small className="block text-textMuted">MCQ correct</small>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <b>{stats.codingSolved}/{stats.codingTotal}</b>
            <small className="block text-textMuted">coding solved</small>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <b>{stats.testsPassed}/{stats.testsTotal}</b>
            <small className="block text-textMuted">tests passed</small>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <b>{stats.codingPoints}</b>
            <small className="block text-textMuted">coding XP ({stats.codingSuccessRate}%)</small>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface text-left">
        <p className="border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-textMuted">
          Final standings
        </p>
        {standings.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center gap-3 border-b border-border/50 px-5 py-3 last:border-0"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-background text-sm font-bold">
              {entry.rank}
            </span>
            {entry.avatarUrl ? (
              <img src={entry.avatarUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-sm font-bold text-white">
                {(entry.username[0] ?? 'D').toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {entry.username}
                {entry.isWinner && <span className="ml-2 text-xs font-bold text-primary">WINNER</span>}
              </p>
              <p className="text-xs text-textMuted">
                {entry.correct}/{entry.total} correct · {entry.accuracy}% accuracy
                {(entry.codingTotal ?? 0) > 0 && (
                  <> · {(entry.codingSolved ?? 0)}/{entry.codingTotal} coding · {(entry.testsPassed ?? 0)}/{entry.testsTotal} tests</>
                )}
              </p>
            </div>
            <b className="text-primary">{entry.score} XP</b>
          </div>
        ))}
      </div>

      {breakdown.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface text-left">
          <p className="border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-textMuted">
            Question-by-question
          </p>
          {breakdown.map((q, i) => {
            const mine = q.myAnswer
            const solved = mine?.isCorrect ?? false
            return (
              <div key={q.questionId} className="border-b border-border/50 px-5 py-4 last:border-0">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-textMuted">
                  Q{i + 1} · {q.xpValue} XP
                  <span className="inline-flex items-center gap-1 rounded-full bg-surfaceRaised px-2 py-0.5 normal-case">
                    {q.type === 'coding' ? <Code2 size={11} /> : <ListChecks size={11} />}
                    {q.type === 'coding' ? 'coding' : 'quiz'}
                  </span>
                </p>
                <p className="mt-1 font-bold">{q.prompt}</p>
                {mine ? (
                  <div className="mt-2 text-sm">
                    {q.type === 'coding' ? (
                      <>
                        <p className={solved ? 'text-primary' : 'text-red-300'}>
                          {solved ? 'Solved' : 'Not solved'} · {mine.testsPassed}/{mine.testsTotal} tests
                          {' · '}+{mine.pointsEarned} XP
                          {mine.language && <span className="text-textMuted"> · {mine.language}</span>}
                        </p>
                        {!solved && mine.error && (
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-danger/10 p-2 font-mono text-xs text-red-200">
                            {mine.error.slice(0, 500)}
                          </pre>
                        )}
                        {!solved && (mine.testResults ?? []).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {(mine.testResults ?? []).map((t, ti) => {
                              const hidden = ti >= q.examples.length
                              return (
                                <p key={ti} className={`font-mono text-xs ${t.passed ? 'text-primary' : 'text-red-300'}`}>
                                  {t.passed ? '✓' : '✗'} {hidden ? `hidden test ${ti - q.examples.length + 1}` : `example ${ti + 1}`}
                                  {!t.passed && !hidden && (
                                    <span className="text-textMuted"> · expected {t.expected.slice(0, 80)} · got {(t.actual || '(empty)').slice(0, 80)}</span>
                                  )}
                                  {!t.passed && t.error && (
                                    <span className="text-textMuted"> · {t.error.slice(0, 120)}</span>
                                  )}
                                </p>
                              )
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className={solved ? 'text-primary' : 'text-red-300'}>
                        {solved ? `Correct (${mine.answer})` : `Wrong (you: ${mine.answer || 'skipped'})`}
                        {' · '}+{mine.pointsEarned} XP
                      </p>
                    )}
                    {!solved && q.type !== 'coding' && q.correctAnswer && (
                      <p className="mt-1 text-xs text-textMuted">Answer: {q.correctAnswer}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-textSubtle">
                    No record{q.type !== 'coding' && q.correctAnswer ? ` · answer: ${q.correctAnswer}` : ''}.
                    Sign in as a participant to see your attempt.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => void copyResultLink()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-background"
        >
          {copiedLink ? <Check size={17} /> : <Share2 size={17} />}
          {copiedLink ? 'Link copied' : 'Share result'}
        </button>
        <button
          onClick={() => void copyCode()}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold hover:border-borderHover"
        >
          {copiedCode ? <Check size={17} className="text-primary" /> : <Copy size={17} />}
          {copiedCode ? 'Copied' : `Code ${result.roomCode}`}
        </button>
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold hover:border-borderHover"
        >
          See rankings
        </Link>
      </div>
      <p className="mt-3 text-xs text-textSubtle">
        Anyone signed in can open a shared result link; live questions and answer keys are never exposed.
      </p>
    </div>
  )
}
