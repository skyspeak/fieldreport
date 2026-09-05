import { useEffect } from 'react'
import { assetUrl } from '../lib/assetUrl'

const DEFAULT_TITLE = 'Field Report'
const DEFAULT_DESCRIPTION =
  'BLS salary data, projected annual openings, and AI-exposure scores for every U.S. major.'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

/** Sets document title + Open Graph / Twitter tags for the current view. */
export function DocumentMeta({
  title,
  description = DEFAULT_DESCRIPTION,
}: {
  title?: string
  description?: string
}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE
    document.title = fullTitle

    const url = window.location.href
    const image = new URL(assetUrl('brand/og.png'), window.location.origin).href
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', image)
    upsertMeta('name', 'twitter:card', 'summary')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)

    return () => {
      document.title = DEFAULT_TITLE
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION)
    }
  }, [title, description])

  return null
}
