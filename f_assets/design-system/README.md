# dearCC design system — handoff

Everything an engineer or PM needs to build the game plan on Vercel.

**Revised 5 August 2026.** Rule 1 reversed after a UX review by Nina Samarguliani
and April Underwood. If you have an older copy of these files, throw it away: the
previous version said *coral marks the next action*, and it is now the opposite.

## What to give whom

| File | Give to | How it is used |
|---|---|---|
| `DESIGN.md` | v0, Cursor, Claude Code | paste into project instructions, or commit as `AGENTS.md` at the repo root |
| `globals.css` | engineer | drop into `app/globals.css` |
| `tailwind.config.ts` | engineer | replace or merge into the existing config |
| `game-plan-flow-reference.html` | engineer + v0 | reference implementation, all sixteen screens, self-contained |
| the brand guidelines | PM, reviewers | the argument behind the system, not a build input |

## Start here

The three rules an AI tool will break first and most often:

1. **Primary actions are black.** Coral marks state: the current step, an open
   module, a selected chip, a hover. Never a control fill.
2. **Coral never carries small text.** 3.10:1 on white, fails AA under 18.66px
   bold. White on coral fails identically.
3. **Three font sizes.** 27px headline, 14px body, 11.5px helper. A field label
   and its example are the same size in different weights, not two sizes.

If generated output has a coral button, coral body text, white text on coral, or
a fourth size, it is wrong regardless of how good it looks.

## Why rule 1 changed

Not taste. A coral button fails **WCAG 1.4.11**, which requires 3:1 between a
control and its background:

| Coral button on | Ratio | |
|---|---|---|
| white | 3.10:1 | passes, barely |
| `paper` #F1F1F1 | **2.74:1** | **fails** |
| `page` #EDEDED | **2.69:1** | **fails** |
| black button, any ground | 20–21:1 | passes |

Product screens put controls on paper cards, so every coral button in the old
build failed. A low-vision user could read the label and not find the button.

## Reference implementation

`game-plan-flow-reference.html` is self-contained and current. Sixteen screens:

- **Happy path** — 1 intake, 2 analysis, 3 the plan, 4 the crew
- **Intake variants** — 1F fail-safe résumé, 1Q quick check, 1S and 1S2 role
  swipe, 1T one question per screen
- **Auth and return** — 1V email confirmation, 1R return from the magic link
- **In flight** — 2a mid-analysis with the LinkedIn call going slow, 2F the teaser
  when the plan goes by email
- **Errors** — 1a nothing filled in, 1Fb upload failed, 1b outside the group

Feed it alongside `DESIGN.md`. One working example beats rules alone.

## Open decisions, before anyone builds

These change what gets built, so settle them first:

- **Screens 1 and 1T do the same job.** Two intakes, one has to win. Every error
  state has to be designed against whichever it is.
- **Where 1V sits.** Verifying before the analysis blocks everyone from value to
  prevent a rare abuse. Verifying before the first send prevents the same harm
  and costs less. The second is the recommendation, and it changes the auth model.
- **Where the swipe gets its roles.** 1S needs real role, company and pay data
  per card.

## Still to design

Malformed LinkedIn URL, malformed email, analysis finds no meaningful gaps,
crews full or waitlisted, generic server error, and the screenshot upload
state after someone taps the image icon in the job field. All of them are the
screen 1a inline-error pattern applied to one field, not new design work.

## Not part of this system

There is **no share card**. Everything the game plan produces is evidence the
person needs a job, and nobody posts that. The plan exports as a private PDF.
