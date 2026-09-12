import { toPng } from 'html-to-image'
import type { IWrappedRecap } from '../../services/wrapped.service'

export function shareTextFor(recap: IWrappedRecap): string {
  return `I fought ${recap.totalBattles} battles on DevArena with a ${recap.winRate}% win rate 🔥 Top language: ${recap.topLanguage ?? 'mixed'} · longest streak ${recap.longestWinStreak}. What's your proof?`
}

export function recapUrl(userName: string): string {
  return `${window.location.origin}/wrapped/${encodeURIComponent(userName)}`
}

/** Render the hidden 1080×1920 poster node to a PNG blob — chrome-free by construction. */
export async function exportPosterPng(node: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(node, {
    canvasWidth: 1080,
    canvasHeight: 1920,
    pixelRatio: 1,
    cacheBust: true,
  })
  const response = await fetch(dataUrl)
  return response.blob()
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Native share sheet with the poster file; returns false when unavailable. */
export async function nativeSharePoster(recap: IWrappedRecap, blob: Blob): Promise<boolean> {
  const file = new File([blob], `devarena-wrapped-${recap.userName}.png`, { type: 'image/png' })
  if (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `DevArena Wrapped — ${recap.userName}`,
        text: shareTextFor(recap),
        url: recapUrl(recap.userName),
      })
      return true
    } catch (error) {
      // User dismissed the sheet — not a failure.
      if (error instanceof Error && error.name === 'AbortError') return true
      return false
    }
  }
  return false
}

export function xShareUrl(recap: IWrappedRecap): string {
  const params = new URLSearchParams({ text: shareTextFor(recap), url: recapUrl(recap.userName) })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

export function linkedInShareUrl(recap: IWrappedRecap): string {
  const params = new URLSearchParams({ url: recapUrl(recap.userName) })
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`
}
