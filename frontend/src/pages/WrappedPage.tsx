import { Check, Copy, Download, Link2, LoaderCircle, Play, Share2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PosterCard } from '../components/wrapped/PosterCard'
import { StoryPlayer } from '../components/wrapped/StoryPlayer'
import { buildSlides } from '../components/wrapped/slides'
import {
  downloadBlob,
  exportPosterPng,
  linkedInShareUrl,
  nativeSharePoster,
  recapPreviewUrl,
  shareTextFor,
  xShareUrl,
} from '../components/wrapped/share'
import { copyText } from '../lib/clipboard'
import { wrappedService, type IWrappedRecap } from '../services/wrapped.service'

export default function WrappedPage() {
  const [recap, setRecap] = useState<IWrappedRecap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const posterRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    try {
      setRecap(await wrappedService.getMyRecap())
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load your Wrapped.')
    }
  }, [])

  useEffect(() => {
    // Page-specific recap; fetched on demand rather than at login bootstrap.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function sharePoster() {
    if (!recap || !posterRef.current) return
    setExporting(true)
    setNotice(null)
    try {
      const blob = await exportPosterPng(posterRef.current)
      const shared = await nativeSharePoster(recap, blob)
      if (!shared) {
        downloadBlob(blob, `devarena-wrapped-${recap.userName}.png`)
        setNotice('Poster downloaded — share it anywhere.')
      }
    } catch {
      setNotice('Could not render the poster (an image may have blocked export). Try download again.')
    } finally {
      setExporting(false)
    }
  }

  async function copyLink() {
    if (!recap) return
    const ok = await copyText(recapPreviewUrl(recap.userName))
    setCopied(ok)
    if (ok) window.setTimeout(() => setCopied(false), 2000)
  }

  if (error && !recap) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">{error}</div>
      </div>
    )
  }

  if (!recap) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-3 py-10 text-textMuted">
        <LoaderCircle className="animate-spin" size={17} /> Wrapping your season…
      </div>
    )
  }

  const finalSlide = (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#06281f] via-[#0b1f3a] to-[#12060f] px-8 py-14 text-center">
      <p className="text-sm font-bold tracking-[.3em] text-primary">THAT&apos;S A WRAP</p>
      <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">
        Take it<br />everywhere.
      </h2>
      <div className="mt-5 overflow-hidden rounded-xl border border-white/20" style={{ width: 150, height: 266 }}>
        <div style={{ width: 1080, transform: 'scale(0.1389)', transformOrigin: 'top left' }}>
          <PosterCard recap={recap} />
        </div>
      </div>
      <div className="mt-5 grid w-full max-w-[300px] gap-2">
        <button
          onClick={() => void sharePoster()}
          disabled={exporting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-background disabled:opacity-60"
        >
          {exporting ? <LoaderCircle size={16} className="animate-spin" /> : <Share2 size={16} />}
          {exporting ? 'Rendering…' : 'Share poster'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={xShareUrl(recap)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/20 px-4 py-2.5 text-center text-sm font-bold hover:bg-white/10"
          >
            Post to X
          </a>
          <a
            href={linkedInShareUrl(recap)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/20 px-4 py-2.5 text-center text-sm font-bold hover:bg-white/10"
          >
            LinkedIn
          </a>
        </div>
        <button
          onClick={() => void copyLink()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Link copied' : 'Copy recap link'}
        </button>
      </div>
      {notice && <p className="mt-3 max-w-[300px] text-xs text-textMuted">{notice}</p>}
      <p className="mt-3 max-w-[300px] text-[11px] leading-5 text-white/50">{shareTextFor(recap)}</p>
    </div>
  )

  const slides = buildSlides(recap, () => finalSlide)

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold text-primary">{recap.season.toUpperCase()} · GITHUB WRAPPED</p>
      <h1 className="mt-1 font-display text-4xl font-bold">Your year of building.</h1>
      <p className="mt-2 max-w-xl text-textMuted">
        A story-format recap built from your real battles, streaks and badges — ready to watch and share.
      </p>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-secondary via-[#31216b] to-primary/60 p-8 shadow-2xl sm:p-12">
        <p className="font-mono text-xs tracking-[.25em] text-white/70">DEVARENA WRAPPED / {new Date().getFullYear()}</p>
        <h2 className="mt-3 font-display text-5xl font-bold leading-none">
          {recap.userName},<br />
          <span className="text-primary">press play.</span>
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [String(recap.totalBattles), 'battles'],
            [`${recap.winRate}%`, 'win rate'],
            [String(recap.longestWinStreak), 'best streak'],
            [String(recap.badges.length), 'badges'],
          ].map(([n, l]) => (
            <div key={l} className="rounded-2xl bg-black/20 p-4">
              <b className="block text-2xl">{n}</b>
              <span className="text-sm text-white/70">{l}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => setPlaying(true)}
            className="hover-target inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-background transition hover:brightness-110"
          >
            <Play size={18} />
            Play my Wrapped
          </button>
          <Link
            to={`/wrapped/${encodeURIComponent(recap.userName)}`}
            className="hover-target inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
          >
            <Link2 size={17} />
            Public recap
          </Link>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-white/60">
          <Download size={14} />
          {slides.length} story slides · ends with an exportable 1080×1920 poster
        </p>
      </div>

      {playing && <StoryPlayer slides={slides} onExit={() => setPlaying(false)} />}

      {/* Hidden full-resolution poster node for export (never shown, never UI chrome). */}
      <div aria-hidden style={{ position: 'fixed', left: -12000, top: 0 }}>
        <PosterCard ref={posterRef} recap={recap} />
      </div>
    </div>
  )
}
