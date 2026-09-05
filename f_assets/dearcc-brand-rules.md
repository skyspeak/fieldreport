# dearCC brand rules, for engineering

Extracted from our working context doc. This is the design system only. Everything
here is decided; if something is not covered, ask rather than inventing.

## Brand system

**Palette is two colours.** Coral `#FF5A3D` and black `#000000`, on white or
paper `#FBF9F7`. Lime, violet, magenta, terracotta `#C65A46` and the
purple-tinted ink `#17111F` were all removed in the July 2026 rebrand. If you
find them in a file, that file is stale.

**Contrast governs everything.** Coral is 3.10:1 on white and 6.78:1 on black.
So coral can carry fills, rules, discs and display type. It can never be small
text on a light ground. White on coral is also 3.10:1.

**Primary controls are black with white labels. Coral marks state only** —
current step, open module, selected chip, hover. A coral button measures 2.74:1
on paper `#F1F1F1`, below the WCAG 1.4.11 minimum of 3:1 for controls. Hover is
a desktop nicety and must never be the only signal.

**Retired and should not reappear:** offset shadows, pill-shaped controls,
all-lowercase display type, weight 900 outside the wordmark, accent rails on
callout cards, and gradients.

**Tagline:** Own your future. No period in lockups, period in prose.

## Naming rules

**Typed out it is always `dearCC`.** No space, lowercase d, uppercase CC. The
square brackets belong to the **logo form only** — rendered markup or artwork,
never running text. This includes body copy, social bios, email text, alt text
and footers. Reason: readability and SEO.

**The mascot is a chinchilla,** not a cat. Never describe her otherwise, in copy
or alt text.

**No em-dashes anywhere in user-facing writing.** They read as AI-generated.

## Type

**dearCC surfaces are Inter only, no serif.** Load it rather than assuming it is
installed. A declared `font-family: Inter` with no stylesheet renders correctly
only on machines that happen to have it.

**JetBrains Mono** for figures, SOC codes and tabular data on Field Report. Fixed
width digits let a reader compare down a column.

**The New Work Foundation site is separate:** Playfair Display for display and
mission copy, Inter for body, JetBrains Mono for uppercase labels, eyebrows and
source citations. Do not carry Playfair onto a dearCC surface.

## Radii

Cards 12px. Controls 8px. Smaller elements 6px or 2px. Use 999px only for shapes
that are actually circular, such as avatars, status dots and icon buttons. Nothing
oblong should be fully rounded.
