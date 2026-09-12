import { forwardRef } from 'react'
import type { IWrappedRecap } from '../../services/wrapped.service'

/**
 * Standalone 1080×1920 share poster. Rendered without any UI chrome so the
 * exported PNG is clean. A hidden full-resolution instance is used for
 * export; the same component can preview at any scale.
 */
export const PosterCard = forwardRef<HTMLDivElement, { recap: IWrappedRecap }>(function PosterCard(
  { recap },
  ref,
) {
  const initials = (recap.userName[0] ?? 'D').toUpperCase()
  const winner = recap.topPercent !== null && recap.topPercent <= 50

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1920 }}
      className="relative flex flex-col overflow-hidden bg-[#071018] text-white"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(700px 420px at 15% 8%, rgba(0,212,170,.22), transparent 65%), radial-gradient(760px 480px at 90% 30%, rgba(124,92,255,.22), transparent 65%), radial-gradient(700px 600px at 50% 105%, rgba(255,92,138,.14), transparent 65%), linear-gradient(165deg, #0a1512 0%, #0b0f22 55%, #120818 100%)',
        }}
      />

      <div className="relative flex flex-1 flex-col px-24 pb-16 pt-20">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              style={{ width: 64, height: 64, fontSize: 26 }}
              className="grid place-items-center rounded-2xl bg-[#00d4aa] font-black text-black"
            >
              {'</>'}
            </span>
            <span style={{ fontSize: 34 }} className="font-extrabold tracking-tight">
              DevArena
            </span>
          </div>
          <span
            style={{ fontSize: 22 }}
            className="rounded-full border border-white/25 px-6 py-2 font-bold uppercase tracking-[.25em] text-white/80"
          >
            {recap.season}
          </span>
        </div>

        {/* Identity */}
        <p style={{ fontSize: 26 }} className="mt-16 font-bold uppercase tracking-[.3em] text-[#00d4aa]">
          Wrapped
        </p>
        <div className="mt-6 flex items-center gap-8">
          {recap.avatarUrl ? (
            <img
              src={recap.avatarUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 168, height: 168, borderRadius: 44, border: '5px solid rgba(0,212,170,.6)' }}
              className="object-cover"
            />
          ) : (
            <span
              style={{ width: 168, height: 168, fontSize: 72, borderRadius: 44 }}
              className="grid place-items-center bg-gradient-to-br from-[#7c5cff] to-[#00d4aa] font-black"
            >
              {initials}
            </span>
          )}
          <div>
            <p style={{ fontSize: 64 }} className="font-extrabold leading-tight tracking-tight">
              {recap.userName}
            </p>
            {recap.persona && (
              <p style={{ fontSize: 30 }} className="mt-1 font-bold text-[#00d4aa]">
                {recap.persona}
              </p>
            )}
          </div>
        </div>

        {/* Headline */}
        <p style={{ fontSize: 44 }} className="mt-12 font-extrabold leading-snug">
          {recap.totalBattles === 0
            ? 'The arena is waiting.'
            : winner
              ? `Top ${recap.topPercent}% of the arena.`
              : `${recap.totalBattles} battles deep.`}
        </p>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 gap-6">
          {[
            [String(recap.totalBattles), 'battles fought'],
            [`${recap.winRate}%`, `win rate · ${recap.wins}W ${recap.losses}L`],
            [String(recap.longestWinStreak), 'longest win streak'],
            [recap.topLanguage ?? 'Mixed', 'most battled stack'],
          ].map(([value, label]) => (
            <div key={label} style={{ borderRadius: 32 }} className="border border-white/15 bg-black/30 p-8">
              <p style={{ fontSize: 64 }} className="font-extrabold leading-none">
                {value}
              </p>
              <p style={{ fontSize: 24 }} className="mt-3 text-white/60">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Badges */}
        {recap.badges.length > 0 && (
          <div className="mt-10">
            <p style={{ fontSize: 24 }} className="font-bold uppercase tracking-[.25em] text-white/60">
              Trophy case · {recap.badges.length}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {recap.badges.slice(0, 6).map((badge) => (
                <span
                  key={badge.badgeId}
                  style={{ fontSize: 24, borderRadius: 999 }}
                  className="border border-white/20 bg-white/5 px-6 py-2 font-bold"
                >
                  {badge.badgeId}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Watermark */}
        <div className="flex items-center justify-between border-t border-white/15 pt-8">
          <span style={{ fontSize: 26 }} className="font-bold text-white/70">
            devarena.app/wrapped/{recap.userName}
          </span>
          <span style={{ fontSize: 22 }} className="uppercase tracking-[.25em] text-white/40">
            Proof of skill
          </span>
        </div>
      </div>
    </div>
  )
})
