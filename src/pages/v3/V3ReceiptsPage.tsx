import { Link } from 'react-router-dom'
import { BackLink } from '../../components/BackLink'
import { DocumentMeta } from '../../components/DocumentMeta'
import { useAppPaths } from '../../lib/useAppPaths'

const SECTIONS = [
  {
    id: 'platinum',
    title: 'Platinum entry rating',
    body: [
      'On this report, “Platinum” (and “Gold”) refer to the Where You Work Matters early-career badge for a specific occupation cluster at a specific company — not a vibe score and not a “best places to work” survey.',
      'Early-career quality is built from how people actually move: internal promotion within about five years, and advancement into better-paid roles elsewhere. Companies need a meaningful share of entry-level hires to be scored on this dimension.',
      'Badges are relative. Platinum means roughly the top fifth of assessed employers for that measure in a refresh cycle; Gold is the next fifth. They are national comparisons, not industry-adjusted rankings.',
      'Across occupations, people at Platinum-overall companies are on average more likely to stay past three years, get promoted inside, move to better external roles, and earn more for the same work — that is why the badge is on this page.',
    ],
  },
  {
    id: 'core',
    title: 'Core roles',
    body: [
      '“Core role” means this occupation is among the company’s top occupations for that field (AOI’s top10_occupation flag). In plain language: this is a job the employer actually hires into at volume, not a rare or peripheral title.',
      'A Platinum rating on a core role is the combination to pay attention to — strong early-career outcomes where they are actively hiring people like you.',
    ],
  },
  {
    id: 'hiring',
    title: 'High hiring / active hiring',
    body: [
      'Hiring intensity comes from posting volume for that occupation at the company (entry and total tiers from AOI). “High hiring” means elevated early-career posting volume relative to other assessed employers; “Active hiring” is the next tier down.',
      'Intensity is how we rank names on Nine Names — not pay. There is no per-company wage in this dataset, so we never invent one.',
    ],
  },
  {
    id: 'funnel',
    title: 'The funnel',
    body: [
      'Rated in your field counts distinct rated employers tied to the occupation clusters for your major.',
      'Hiring in your metro is how many of those show up with early-career ratings in your CBSA (or nationwide if your ZIP is outside a mapped metro). The second number is the share-card punchline: how the national field set narrows to where you live.',
    ],
  },
  {
    id: 'nine',
    title: 'Nine Names',
    body: [
      'The shortlist is the top nine employers after ranking: hiring intensity first, then early-career badge (Platinum before Gold), then whether the role is core, then how many of your field groups they match.',
      'Only rated companies appear. A famous employer missing from the list has not been rated for early-career hiring in these occupations — that is not a judgment that they are a bad place to work.',
    ],
  },
  {
    id: 'five',
    title: 'Five years out',
    body: [
      'Destination roles are common next clusters people move into from your field. Promotion split is the share who move up while staying versus leaving, for the entry experience band and your metro size.',
      'That split is about the field (cluster × metro size), never about a named employer. Two companies in the same cluster and metro size share the same promotion picture in this data.',
    ],
  },
  {
    id: 'door',
    title: 'The Door',
    body: [
      'The Door summarizes AOI’s AI expertise-impact flags: whether entry barriers are rising or falling, and whether experience still carries a pay premium.',
      'We use the four plain-language states (harder/easier entry × rising/flat ceiling). We do not call fields “risky” or “safe,” and we do not render a 2×2 horoscope chart.',
      'Only some occupation clusters have been classified so far. Missing AI data means “not assessed,” not “unaffected by AI.”',
    ],
  },
  {
    id: 'na',
    title: 'What missing ratings mean',
    body: [
      'NA or a blank badge does not mean a bad employer. It usually means too little sample, a methodological exclusion (for example, too few entry-level hires for the early-career score), or data quality below threshold.',
      'This list only shows companies with an early-career rating. Absence from Nine Names is coverage, not a ranking of unrated firms.',
    ],
  },
  {
    id: 'sources',
    title: 'Sources & limits',
    body: [
      'Employer ratings: Where You Work Matters (WYWM) / American Opportunity Index lineage — Burning Glass Institute and Schultz Family Foundation, via AOI at aonav.ai. Observation window predominantly 2019–2024.',
      'Major → occupation: NCES–BLS CIP–SOC crosswalk (expert judgment about where a degree can lead, not a census of where graduates actually went).',
      'Occupation → cluster: O*NET / AOI TITLECONVERT. Display group names on Computer Science are ours; other majors use cluster labels from the vendor.',
      'WYWM does not measure satisfaction, benefits, work–life balance, or cost of living. Flat orgs and contractor-heavy firms can look weaker in this methodology without being “bad” employers.',
    ],
  },
] as const

export function V3ReceiptsPage() {
  const { home } = useAppPaths()

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-8 sm:pt-14 pb-20">
      <DocumentMeta
        title="How to read Field Report"
        description="What Platinum entry ratings, core roles, hiring intensity, and the rest of the employer layer mean."
      />
      <BackLink to={home}>← Field Report</BackLink>

      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        Receipts
      </p>
      <h1 className="mt-2 font-sans font-bold tracking-tight text-3xl sm:text-5xl text-ink leading-tight">
        How to read this report
      </h1>
      <p className="mt-4 text-muted leading-relaxed text-lg">
        Short definitions for the labels you see on Nine Names, the funnel, Five
        years out, and The Door.
      </p>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm border-b border-border pb-4">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-muted hover:text-ink underline-offset-4 hover:underline"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">{s.title}</h2>
            <div className="mt-3 space-y-3 text-ink/80 leading-relaxed">
              {s.body.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 text-sm text-muted leading-relaxed">
        Authoritative methodology:{' '}
        <a
          href="https://whereyouworkmatters.org/"
          className="text-ink underline underline-offset-2 hover:text-primary"
          target="_blank"
          rel="noreferrer"
        >
          whereyouworkmatters.org
        </a>
        . Data served through AOI / aonav.ai.
      </p>

      <Link
        to={home}
        className="inline-flex mt-8 min-h-11 items-center text-ink underline underline-offset-2 hover:text-primary"
      >
        Back to Field Report v3
      </Link>
    </div>
  )
}
