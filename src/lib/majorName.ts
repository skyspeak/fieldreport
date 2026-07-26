/** Strip CIP catalog trailing periods and tidy whitespace for display. */
export function majorDisplayName(name: string): string {
  return name.replace(/\.+$/, '').trim()
}

/** Synthetic CIP used by the crosswalk for unmatched SOCs — never a real major. */
export const NO_MATCH_CIP = '99.9999'

export function isRealMajor(cip: string): boolean {
  return cip !== NO_MATCH_CIP
}
