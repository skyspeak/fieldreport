import type { CompetitionLevel } from '../types'

export const COMPETITION_COPY: Record<
  CompetitionLevel,
  { label: string; blurb: string; color: string }
> = {
  Low: {
    label: 'Low',
    blurb:
      'Fewer graduates enter this field than there are annual openings. Getting a job here is relatively straightforward.',
    color: 'var(--color-severity-low)',
  },
  Moderate: {
    label: 'Moderate',
    blurb:
      'Roughly 1–3 graduates compete for each opening. Solid prospects with competitive but manageable job hunting.',
    color: 'var(--color-severity-mid)',
  },
  High: {
    label: 'High',
    blurb:
      "3–6 graduates per opening. You'll need to stand out: internships, skills, and networking matter a lot.",
    color: 'var(--color-severity-high)',
  },
  'Very High': {
    label: 'Very High',
    blurb:
      'More than 6 graduates per opening. The field is significantly oversupplied. Expect a tough job market.',
    color: 'var(--color-severity-max)',
  },
}

export const AI_BAND_COPY: Record<string, string> = {
  Low: 'Lower AI exposure. Day-to-day work leans on physical presence, trust, or judgment that models struggle to replace.',
  Moderate:
    'Medium AI exposure. Routine administrative and documentation tasks will likely shift to AI, but the role still depends on hands-on work, interpersonal trust, or oversight that\'s hard to automate.',
  High: "High AI exposure. A large share of the day-to-day output — drafts, analyses, reports — is within reach of today's LLMs. Differentiation is moving to judgment, client relationships, and ownership of outcomes.",
  'Very High':
    "Very high AI exposure. The core workflow is digital knowledge work that frontier models already do competently. Expect headcount pressure and a rising bar on what distinguishes human practitioners.",
}

export function aiBandFromScore(score: number | null | undefined): string {
  if (score == null) return '—'
  if (score <= 3) return 'Low'
  if (score <= 5) return 'Moderate'
  if (score <= 7) return 'High'
  return 'Very High'
}

/** Live Field Report bands (Low / Medium / High / Very High). */
export function aiBandLive(score: number | null | undefined): string {
  if (score == null) return '—'
  if (score <= 2) return 'Low'
  if (score <= 5) return 'Medium'
  if (score <= 7) return 'High'
  return 'Very High'
}

export const AI_BAND_LIVE_COLORS: Record<string, string> = {
  Low: 'var(--color-severity-low)',
  Medium: 'var(--color-severity-mid)',
  High: 'var(--color-severity-high)',
  'Very High': 'var(--color-severity-max)',
}

/** Shared 5-step severity scale used on landing, results, and the legend. */
export const SEVERITY_COLORS = {
  Low: 'var(--color-severity-low)',
  Moderate: 'var(--color-severity-mid)',
  Medium: 'var(--color-severity-mid)',
  High: 'var(--color-severity-high)',
  'Very High': 'var(--color-severity-max)',
  'Very high': 'var(--color-severity-max)',
  'No data': 'var(--color-severity-none)',
} as const

export const SEVERITY_LEGEND = [
  { label: 'Low', color: SEVERITY_COLORS.Low },
  { label: 'Moderate', color: SEVERITY_COLORS.Moderate },
  { label: 'High', color: SEVERITY_COLORS.High },
  { label: 'Very high', color: SEVERITY_COLORS['Very high'] },
  { label: 'No data', color: SEVERITY_COLORS['No data'] },
] as const

export const AI_BAND_LIVE_COPY: Record<string, string> = {
  Low: "Low AI exposure. The work requires physical presence, manual dexterity, or real-time human judgment that current AI can't replicate. Expect incremental tooling gains, not displacement.",
  Medium:
    "Medium AI exposure. Routine administrative and documentation tasks will likely shift to AI, but the role still depends on hands-on work, interpersonal trust, or oversight that's hard to automate.",
  High: "High AI exposure. A large share of the day-to-day output — drafts, analyses, reports — is within reach of today's LLMs. Differentiation is moving to judgment, client relationships, and ownership of outcomes.",
  'Very High':
    "Very high AI exposure. The core workflow is digital knowledge work that frontier models already do competently. Expect headcount pressure and a rising bar on what distinguishes human practitioners.",
}

export const COMPETITION_DOT: Record<string, string> = {
  Low: 'var(--color-severity-low)',
  Moderate: 'var(--color-severity-mid)',
  High: 'var(--color-severity-high)',
  'Very High': 'var(--color-severity-max)',
  Unknown: 'var(--color-severity-none)',
}

export const ELOUNDOU_COPY =
  'Eloundou β is the headline LLM-exposure score from Eloundou et al. (2023) / OpenAI “GPTs are GPTs.” A task is exposed if GPT-4 (via ChatGPT or the Playground) would cut the time to do it by at least 50% at equal quality. β = E1 + 0.5·E2: direct LLM exposure plus half-credit for tasks that need complementary software. This is exposure, not a forecast that the job disappears.'

export const ELOUNDOU_ALPHA_COPY =
  'α (alpha) = E1: share of tasks the LLM can expose on its own, with no extra software. Lower bound.'

export const ELOUNDOU_GAMMA_COPY =
  'γ (gamma) = E1 + E2: share of tasks exposed if you also count LLM-powered tools (the paper’s upper bound, sometimes written ζ). Always ≥ β.'

export const ELOUNDOU_METHOD_COPY =
  'Ratings in this app are GPT-4 occupation scores (dv_rating) from OpenAI’s occ_level.csv, averaged from O*NET detailed codes up to 6-digit SOC. Human annotator scores are shown in the tooltip for comparison.'

export const ELOUNDOU_BAND_COLORS: Record<string, string> = {
  Low: 'var(--color-severity-low)',
  Moderate: 'var(--color-severity-mid)',
  High: 'var(--color-severity-high)',
  'Very High': 'var(--color-severity-max)',
}

export const AI_FLAG_LABEL: Record<string, string> = {
  'Raising the Bar': 'Raising the bar',
  'Shrinking Fields': 'Shrinking fields',
  'Winners Pull Away': 'Winners pull away',
  'Lower Potential': 'Lower potential',
}

export const ENTRY_BARRIER_COPY =
  'Whether the American Opportunity Index says the door into this occupation is getting harder or easier to walk through. The line under Rising/Falling is the Gen-3 AI-impact flag (methodology 2026-04-21). A dash means the occupation has not been classified yet — not that it is untouched.'

export const AOI_ATTRIBUTION =
  'Employer and entry-barrier data: American Opportunity Index, Schultz Family Foundation, methodology 2026-04-21'

