import { Link } from 'react-router-dom'
import { BrandMark } from '../../components/BrandMark'
import { DocumentMeta } from '../../components/DocumentMeta'
import { MajorSearch } from '../../components/MajorSearch'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../lib/theme'

const OPTIONS = [
  {
    id: 'A',
    recommended: true,
    title: 'National hiring atlas',
    body: 'After a major, see where rated early-career employers actually hire across 40 U.S. metros. Click a bubble to open that city’s report.',
    href: '/v4/map/11.0701',
    cta: 'Open Computer Science map',
  },
  {
    id: 'B',
    recommended: false,
    title: 'Enriched metro report',
    body: 'The v3 employer list, plus AOI wage ladders (0 / 5 / 10 years), premium skills, and a ranked metro comparison — still ZIP-first.',
    href: '/v4/results/11.0701/94402',
    cta: 'Open CS in San Francisco',
  },
  {
    id: 'C',
    recommended: false,
    title: 'Company footprint',
    body: 'Pick an employer from the report and see every metro where they hire this field. Answers “if I want Amazon / Microsoft, where?”',
    href: '/v4/company/11.0701/Amazon',
    cta: 'Open Amazon software map',
  },
  {
    id: 'D',
    recommended: false,
    title: 'Metro vs metro',
    body: 'Same major, two cities side by side — hiring counts, Platinum share, and the names that show up. The v3 feedback request to compare cities.',
    href: '/v4/compare/11.0701/94402/10001',
    cta: 'CS: San Francisco vs New York',
  },
  {
    id: 'E',
    recommended: false,
    title: 'Pathways',
    body: 'Skill-adjacent clusters and common next roles, with stay-vs-leave promotion split. What “five years out” looks like as a map of jobs, not a paragraph.',
    href: '/v4/pathways/11.0701',
    cta: 'Open CS pathways',
  },
  {
    id: 'F',
    recommended: false,
    title: 'WYWM badge matrix',
    body: 'The 3×3 early-career / growth / stability × Platinum / Gold rollup for this field, plus Platinum employers with high entry hiring.',
    href: '/v4/badges/11.0701',
    cta: 'Open CS badge matrix',
  },
  {
    id: 'G',
    recommended: false,
    title: 'Major vs major',
    body: 'National AOI snapshot of two degrees: pay, AI door, rated pairs, top industry, named employers. CS vs Nursing is the exhibit.',
    href: '/v4/versus/11.0701/51.3801',
    cta: 'Computer Science vs Nursing',
  },
  {
    id: 'H',
    recommended: false,
    title: 'Industry mix',
    body: 'Which industries hire this field — not just the obvious sector. For CS, banks and insurers often outrank pure software.',
    href: '/v4/industries/11.0701',
    cta: 'Who hires Computer Science',
  },
] as const

export function V4HomePage() {
  const { majors, loading, error } = useData()
  const { isDark } = useTheme()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-20">
      <DocumentMeta title="Field Report v4 — AOI prototypes" />
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          Local prototype · not shipped
        </p>
        <BrandMark size="lg" as="h1" variant="field" />
        <p className="mt-5 text-lg sm:text-2xl text-ink/70 font-light leading-snug">
          Eight prototypes for putting Schultz / WYWM data on the Field Report
        </p>
        <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed max-w-2xl">
          v3 already names rated employers in one metro. v4 prototypes what AOI
          can add next: geography, comparison, pathways, badges, and industry
          mix. Search a major to enter the recommended atlas.
        </p>
      </div>

      <div className="mt-8 max-w-2xl">
        {loading ? (
          <p className="text-muted">Loading majors…</p>
        ) : error ? (
          <p className="text-negative">{error}</p>
        ) : (
          <MajorSearch
            majors={majors}
            size="lg"
            autoFocus
            resultsBase="/v4/map"
            placeholder="Search a major — opens the U.S. hiring map"
            tone={isDark ? 'dark' : 'light'}
          />
        )}
      </div>

      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OPTIONS.map((opt) => (
          <li
            key={opt.id}
            className={`rounded-xl border px-5 py-5 flex flex-col ${
              opt.recommended
                ? 'border-primary/50 bg-card'
                : 'border-border bg-card'
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              Option {opt.id}
              {opt.recommended ? ' · recommended' : ''}
            </p>
            <h2 className="mt-2 font-sans font-bold tracking-tight text-2xl text-ink leading-tight">
              {opt.title}
            </h2>
            <p className="mt-3 text-sm text-muted leading-relaxed flex-1">
              {opt.body}
            </p>
            <Link
              to={opt.href}
              className="mt-5 inline-flex min-h-11 items-center text-sm text-ink underline underline-offset-2 hover:text-primary"
            >
              {opt.cta} →
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-14 max-w-3xl">
        <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">Why the atlas first</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted leading-relaxed">
          <li>
            Feedback on v3 already asks to compare cities. The existing state
            choropleth is BLS employment by occupation — not who is hiring your
            major.
          </li>
          <li>
            AOI’s distinctive layer is company × cluster × CBSA. A metro bubble
            map is the honest geography for that table. HQ-by-state would show
            legal domicile, not hiring.
          </li>
          <li>
            Keep the ZIP report as the drill-down (option B), and company maps
            as a click-through (option C). Don’t replace Nine Names — attach
            the map above it.
          </li>
        </ul>
        <p className="mt-6 text-xs text-muted leading-relaxed">
          Source: Where You Work Matters / American Opportunity Index — Burning
          Glass Institute and Schultz Family Foundation, via AOI. Coverage is
          rated employers (~1,750 firms), not the whole labor market.
        </p>
        <p className="mt-4 text-sm">
          <Link to="/" className="text-muted hover:text-ink">
            ← Current Field Report
          </Link>
        </p>
      </section>
    </div>
  )
}
