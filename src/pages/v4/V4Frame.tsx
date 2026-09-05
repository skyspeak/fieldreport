import type { ReactNode } from 'react'
import { BackLink } from '../../components/BackLink'
import { DocumentMeta } from '../../components/DocumentMeta'

export function V4Frame({
  option,
  title,
  kicker,
  subtitle,
  loading,
  loadingHint,
  error,
  children,
}: {
  option: string
  title: string
  kicker?: string
  subtitle?: string
  loading?: boolean
  loadingHint?: string
  error?: string | null
  children?: ReactNode
}) {
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-muted">{loadingHint || 'Building from AOI…'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <BackLink to="/v4">← v4 prototypes</BackLink>
        <h1 className="font-sans font-bold tracking-tight text-2xl text-ink">Could not build this prototype</h1>
        <p className="mt-3 text-negative">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <DocumentMeta title={title} />
      <BackLink to="/v4">← v4 prototypes</BackLink>
      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          Option {option}
          {kicker ? ` · ${kicker}` : ''}
        </p>
        <h1 className="mt-2 font-sans font-bold tracking-tight text-3xl sm:text-5xl text-ink leading-tight">{title}</h1>
        {subtitle ? <p className="mt-3 text-lg text-ink/70">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  )
}

export function Coverage({ text, source }: { text: string; source: string }) {
  return (
    <>
      <p className="mt-10 max-w-2xl text-sm text-ink/70 leading-relaxed border-l border-border pl-4">
        {text}
      </p>
      <p className="mt-3 max-w-2xl text-xs text-muted leading-relaxed">{source}</p>
    </>
  )
}
