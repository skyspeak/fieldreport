import Fuse from 'fuse.js'
import type { Major } from '../types'
import { isRealMajor, majorDisplayName } from './majorName'

/** Common abbreviations / nicknames → phrases to match against major names. */
const ALIASES: Record<string, string[]> = {
  cs: ['computer science'],
  'comp sci': ['computer science'],
  'computer science': ['computer science'],
  'comp science': ['computer science'],
  econ: ['economics'],
  economics: ['economics'],
  psych: ['psychology'],
  psychology: ['psychology'],
  nursing: ['registered nursing', 'registered nurse'],
  rn: ['registered nursing', 'registered nurse'],
  premed: ['biology', 'biomedical sciences', 'chemistry', 'biochemistry'],
  'pre-med': ['biology', 'biomedical sciences', 'chemistry', 'biochemistry'],
  'pre med': ['biology', 'biomedical sciences', 'chemistry', 'biochemistry'],
  bio: ['biology', 'biological sciences'],
  chem: ['chemistry'],
  'poli sci': ['political science'],
  'poly sci': ['political science'],
  polisci: ['political science'],
  calc: ['mathematics'],
  math: ['mathematics'],
  eng: ['english', 'engineering'],
  english: ['english language and literature', 'english, general'],
  business: ['business administration', 'business/commerce'],
  bba: ['business administration'],
  accounting: ['accounting'],
  finance: ['finance'],
  marketing: ['marketing'],
  history: ['history'],
  phil: ['philosophy'],
  philosophy: ['philosophy'],
  soc: ['sociology'],
  sociology: ['sociology'],
  anthro: ['anthropology'],
  anthropology: ['anthropology'],
  comm: ['communication', 'communications'],
  communications: ['communication'],
  journalism: ['journalism'],
  education: ['education'],
  teaching: ['education', 'teacher education'],
  'mech e': ['mechanical engineering'],
  'mech eng': ['mechanical engineering'],
  'mechanical engineering': ['mechanical engineering'],
  ee: ['electrical engineering', 'electrical and electronics engineering'],
  'electrical engineering': ['electrical and electronics engineering', 'electrical engineering'],
  ce: ['civil engineering', 'computer engineering'],
  'civil engineering': ['civil engineering'],
  'chem e': ['chemical engineering'],
  'chemical engineering': ['chemical engineering'],
  'comp eng': ['computer engineering'],
  art: ['fine arts', 'art/art studies'],
  music: ['music'],
  theatre: ['drama', 'theatre'],
  theater: ['drama', 'theatre'],
  film: ['film/cinema', 'cinematography'],
  cinema: ['film/cinema', 'cinematography'],
  architecture: ['architecture'],
  criminology: ['criminology', 'criminal justice'],
  cj: ['criminal justice'],
  'criminal justice': ['criminal justice'],
  law: ['legal studies', 'pre-law'],
  prelaw: ['legal studies'],
  'pre-law': ['legal studies'],
  international: ['international relations', 'international/global studies'],
  ir: ['international relations'],
  env: ['environmental science', 'environmental studies'],
  environmental: ['environmental science', 'environmental studies'],
  neuroscience: ['neuroscience'],
  neuro: ['neuroscience'],
  biochem: ['biochemistry'],
  biochemistry: ['biochemistry'],
  physics: ['physics'],
  stats: ['statistics'],
  statistics: ['statistics'],
  data: ['data science', 'data analytics'],
  'data science': ['data science'],
}

/** Flagship undergrad CIPs — boosted so they beat niche alphabetically-earlier matches. */
const FLAGSHIP_BOOST: Record<string, number> = {
  '11.0701': 40, // Computer Science
  '11.0101': 28, // Computer and Information Sciences, General
  '45.0601': 40, // Economics, General
  '51.3801': 45, // Registered Nursing
  '42.0101': 40, // Psychology, General
  '54.0101': 40, // History, General
  '26.0101': 38, // Biology/Biological Sciences, General
  '26.0102': 30, // Biomedical Sciences, General
  '40.0501': 32, // Chemistry, General
  '40.0801': 32, // Physics, General
  '27.0101': 32, // Mathematics, General
  '23.0101': 35, // English Language and Literature, General
  '45.1001': 35, // Political Science and Government, General
  '45.1101': 32, // Sociology
  '52.0201': 35, // Business Administration and Management, General
  '52.0301': 32, // Accounting
  '52.0801': 30, // Finance, General
  '14.1901': 32, // Mechanical Engineering
  '14.1001': 30, // Electrical and Electronics Engineering
  '14.0801': 28, // Civil Engineering
  '14.0701': 28, // Chemical Engineering
  '14.0901': 28, // Computer Engineering
  '51.1201': 25, // Medicine (grad — still useful for premed-adjacent)
  '45.0201': 28, // Anthropology
  '38.0101': 28, // Philosophy
  '50.0701': 22, // Art/Art Studies, General
  '50.0901': 22, // Music, General
  '09.0101': 28, // Speech Communication and Rhetoric
  '09.0401': 25, // Journalism
  '13.1202': 20, // Elementary Education and Teaching
  '26.1501': 28, // Neuroscience
  '26.0202': 28, // Biochemistry
  '03.0104': 25, // Environmental Science
  '45.0901': 25, // International Relations
  '43.0104': 25, // Criminal Justice/Safety Studies
  '04.0201': 22, // Architecture
  '51.0000': 20, // Health Services/Allied Health/Health Sciences, General
}

export type SearchableMajor = Major & { displayName: string }

export function toSearchable(majors: Major[]): SearchableMajor[] {
  return majors
    .filter((m) => isRealMajor(m.cip))
    .map((m) => ({ ...m, displayName: majorDisplayName(m.name) }))
}

function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[./_,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function expandQuery(q: string): string[] {
  const n = normalizeQuery(q)
  if (!n) return []
  const extras = ALIASES[n] ?? []
  return [n, ...extras]
}

function scoreMajor(major: SearchableMajor, rawQuery: string, fuseScore: number | undefined): number {
  const q = normalizeQuery(rawQuery)
  const name = normalizeQuery(major.displayName)
  const expansions = expandQuery(rawQuery)

  let score = 0

  // Fuse: lower is better → invert
  if (fuseScore != null) score += (1 - fuseScore) * 50
  else score += 10

  for (const phrase of expansions) {
    if (!phrase) continue
    if (name === phrase || name === `${phrase} general`) score += 55
    else if (name.startsWith(phrase)) score += 40
    else if (name.includes(`, ${phrase}`) || name.includes(` ${phrase}`)) score += 28
    else if (name.includes(phrase)) score += 18
  }

  // Prefer the generic flagship form over Teacher Ed / Admin / niche compounds
  if (/,\s*general$/i.test(major.displayName)) score += 18
  if (/\bgeneral\b/i.test(major.displayName) && !/other$/i.test(major.displayName)) score += 8

  // Niche penalties when the query is a common short token
  if (q.length <= 12) {
    if (/teacher education|administration|assistant|aide|residency|fellowship/i.test(name)) {
      score -= 25
    }
    if (/other$/i.test(name)) score -= 12
    // "Composition" matching "comp sci", "Intermedia" matching "premed", etc.
    if (q === 'comp sci' || q === 'cs') {
      if (!/computer science/i.test(name)) score -= 55
      else score += 25
    }
    if (q === 'econ' || q === 'economics') {
      if (/agricultural|home economics|consumer economics|pharmacoeconomics/i.test(name)) score -= 40
      if (/^economics/i.test(major.displayName)) score += 25
    }
    if (q === 'nursing' || q === 'rn') {
      if (/registered nursing/i.test(name)) score += 35
      else score -= 20
    }
    if (q === 'psychology' || q === 'psych') {
      if (/^psychology,\s*general/i.test(major.displayName)) score += 35
      if (/geropsychology|psychoanalysis|psychopharmacology/i.test(name)) score -= 30
    }
    if (q === 'history') {
      if (/^history,\s*general/i.test(major.displayName)) score += 35
      if (/teacher education|architectural history|history of medicine/i.test(name)) score -= 30
    }
    if (q === 'premed' || q === 'pre-med' || q === 'pre med') {
      if (/biology\/biological sciences,\s*general/i.test(name)) score += 55
      else if (/biomedical sciences,\s*general|chemistry,\s*general|^biochemistry$/i.test(name)) {
        score += 40
      } else {
        score -= 15
      }
    }
  }

  // Flagship boost only when the name actually relates to the query
  const textHit = expansions.some((phrase) => phrase && name.includes(phrase.split(' ')[0]!))
  if (textHit || (fuseScore != null && fuseScore < 0.35)) {
    score += FLAGSHIP_BOOST[major.cip] ?? 0
  }

  // Shorter catalog names tend to be the flagship
  score -= Math.min(major.displayName.length, 80) * 0.05

  return score
}

export function searchMajors(
  majors: SearchableMajor[],
  query: string,
  limit = 10,
): SearchableMajor[] {
  const q = query.trim()
  if (!q) {
    // Empty query: show flagship-ish defaults, not alphabetical CIP order
    return [...majors]
      .map((m) => ({ m, s: (FLAGSHIP_BOOST[m.cip] ?? 0) - m.displayName.length * 0.01 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.m)
  }

  const expansions = expandQuery(q)
  const fuse = new Fuse(majors, {
    keys: [
      { name: 'displayName', weight: 0.75 },
      { name: 'category', weight: 0.15 },
      { name: 'cip', weight: 0.1 },
    ],
    threshold: 0.45,
    ignoreLocation: true,
    includeScore: true,
  })

  const seen = new Map<string, { major: SearchableMajor; fuseScore: number }>()

  for (const phrase of expansions) {
    for (const hit of fuse.search(phrase, { limit: 30 })) {
      const prev = seen.get(hit.item.cip)
      const fs = hit.score ?? 1
      if (!prev || fs < prev.fuseScore) {
        seen.set(hit.item.cip, { major: hit.item, fuseScore: fs })
      }
    }
  }

  // Also run raw query in case alias expansion missed
  for (const hit of fuse.search(q, { limit: 30 })) {
    const prev = seen.get(hit.item.cip)
    const fs = hit.score ?? 1
    if (!prev || fs < prev.fuseScore) {
      seen.set(hit.item.cip, { major: hit.item, fuseScore: fs })
    }
  }

  return [...seen.values()]
    .map(({ major, fuseScore }) => ({
      major,
      score: scoreMajor(major, q, fuseScore),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.major)
}
