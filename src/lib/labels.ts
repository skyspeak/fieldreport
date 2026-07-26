import type { CompetitionLevel } from '../types'

export const COMPETITION_COPY: Record<
  CompetitionLevel,
  { label: string; blurb: string; color: string }
> = {
  Low: {
    label: 'Low',
    blurb:
      'Fewer graduates enter this field than there are annual openings. Getting a job here is relatively straightforward.',
    color: '#34d399',
  },
  Moderate: {
    label: 'Moderate',
    blurb:
      'Roughly 1–3 graduates compete for each opening. Solid prospects with competitive but manageable job hunting.',
    color: '#fbbf24',
  },
  High: {
    label: 'High',
    blurb:
      "3–6 graduates per opening. You'll need to stand out — internships, skills, and networking matter a lot.",
    color: '#fb923c',
  },
  'Very High': {
    label: 'Very High',
    blurb:
      'More than 6 graduates per opening. The field is significantly oversupplied. Expect a tough job market.',
    color: '#f87171',
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

export const ELOUNDOU_COPY =
  'LLM Risk (β) is the share of an occupation’s tasks exposed to large language models, from Eloundou et al. (2023) / OpenAI “GPTs are GPTs.” Higher = more of the job can be assisted or automated by today’s LLMs.'

export const ELOUNDOU_ALPHA_COPY =
  'α (alpha): share of tasks exposed to LLMs with no extra tools — what a model can do “out of the box.”'

export const ELOUNDOU_GAMMA_COPY =
  'γ (gamma): share of tasks exposed when LLMs are paired with additional software or tools. Always ≥ β.'

export const ELOUNDOU_BAND_COLORS: Record<string, string> = {
  Low: '#059669',
  Moderate: '#d97706',
  High: '#ea580c',
  'Very High': '#dc2626',
}

