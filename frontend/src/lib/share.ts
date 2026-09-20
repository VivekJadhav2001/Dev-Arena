/**
 * Share helpers for public pages (profile, Wrapped recap, battle details).
 *
 * Link scrapers (LinkedIn, X, WhatsApp) read only the static `<head>` of the
 * shared URL — they never run the SPA bundle. The backend `/s/*` preview
 * endpoints serve per-item Open Graph HTML to scrapers and redirect humans
 * to the real frontend page, so external shares must use those URLs to get
 * the item's picture in the post.
 */

function backendOrigin(): string {
  const raw =
    (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:2001/api/v1'
  return raw.replace(/\/api\/v1\/?$/, '') || 'http://localhost:2001'
}

/** Crawler-first preview URL for a public developer profile. */
export function previewProfileUrl(username: string): string {
  return `${backendOrigin()}/s/u/${encodeURIComponent(username)}`
}

/** Crawler-first preview URL for a public Wrapped recap. */
export function previewWrappedUrl(username: string): string {
  return `${backendOrigin()}/s/wrapped/${encodeURIComponent(username)}`
}

/** Crawler-first preview URL for a finished battle's details. */
export function previewBattleUrl(roomCode: string): string {
  return `${backendOrigin()}/s/battle/${encodeURIComponent(roomCode.toUpperCase())}`
}

export interface PageMeta {
  title: string
  description: string
  image?: string | null
  url?: string
}

function upsertMeta(selector: string, create: () => HTMLMetaElement): HTMLMetaElement {
  const existing = document.head.querySelector<HTMLMetaElement>(selector)
  if (existing) return existing
  const tag = create()
  document.head.appendChild(tag)
  return tag
}

/**
 * Refresh the document head for a shareable page. This helps in-app share
 * sheets and JS-capable scrapers; LinkedIn-style crawlers rely on the
 * backend `/s/*` preview HTML instead (see above).
 */
export function setPageMeta({ title, description, image, url }: PageMeta): void {
  document.title = title
  const canonical = url ?? window.location.href

  const desc = upsertMeta('meta[name="description"]', () => {
    const tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    return tag
  })
  desc.setAttribute('content', description)

  const set = (property: string, content: string) => {
    const tag = upsertMeta(`meta[property="${property}"]`, () => {
      const next = document.createElement('meta')
      next.setAttribute('property', property)
      return next
    })
    tag.setAttribute('content', content)
  }

  set('og:title', title)
  set('og:description', description)
  set('og:url', canonical)
  set('og:type', 'website')
  if (image) {
    set('og:image', image)
    const twitterImage = upsertMeta('meta[name="twitter:image"]', () => {
      const next = document.createElement('meta')
      next.setAttribute('name', 'twitter:image')
      return next
    })
    twitterImage.setAttribute('content', image)
  }
}
