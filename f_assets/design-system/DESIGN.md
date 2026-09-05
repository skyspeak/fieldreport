# dearCC design system

Give this file to v0, Cursor, or Claude Code as project instructions. It is the
source of truth. If a rule here conflicts with something in an older dearCC file,
this file wins.

**Revised 4 August 2026** after a UX review by Nina Samarguliani and April
Underwood. Rule 1 reversed. If you have seen "coral marks the next action" in a
dearCC file, that file is stale.

## The two rules everything follows

1. **Primary actions are black. Coral marks state, not action.** A filled control
   is `ink` with a `white` label. Coral is for the current step, an open module,
   a live badge, a hover. One or two coral moments per screen, never six. An
   accent used six times is not an accent.
2. **Coral never carries small text, and never fills a control.** Coral on white
   is **3.10:1** and fails WCAG AA under 18.66px bold. White on coral is also
   3.10:1. On black, coral is 6.78:1 and safe anywhere.

The reason rule 1 changed is not taste. A coral button fails **WCAG 1.4.11**,
which requires 3:1 between a control and its background:

| Coral button on | Ratio | |
|---|---|---|
| white | 3.10:1 | passes, barely |
| `paper` #F1F1F1 | **2.74:1** | **fails** |
| `page` #EDEDED | **2.69:1** | **fails** |
| black button, any ground | 20–21:1 | passes |

Product screens put controls on `paper` cards. Every coral button in the old flow
failed. A low-vision user could read the label and not find the button.

Coral on hover is fine and is a desktop nicety only. **Never make coral a
hover-only signal**, because touch has no hover and this audience is mobile.

## Type: three sizes, no more

Nina's rule, and it is a hard one. Inside the product, everything is one of:

| Token | Size | Use |
|---|---|---|
| `--t1` | 27px / 700 | the one headline on the screen |
| `--t2` | 14px | body, input values, field labels at 700, row titles |
| `--t3` | 11.5px | helper text, hints, meta, chips, stepper, badges, ghost buttons |

Hierarchy inside a single line comes from **weight and color, not a fourth
size**. A field label is `--t2` weight 700 in `ink`; the placeholder and any
prefix beside it are the same size in `#9A9A9A`. The old flow had the example URL
*larger* than the label it belonged to, which is what prompted the rule.

Other type rules:

- Inter only, variable weight. No second family, no serif, no italic.
- Headings **700**, not 900. 900 is the `dear[CC]` wordmark and nothing else.
- Tracking about `-0.028em` on headings, `0` on body, `0.14em` on uppercase labels.
- **Sentence case everywhere.** The audience is unemployed people; all-lowercase
  reads as too casual for the subject.
- **All screen headings are centred.** One alignment across the whole flow.

## One focal point per screen

Minimize card styles, border treatments, button treatments, and accents. Each
screen has one clear thing to read and one obvious thing to press.

Concretely, things that were removed to get there: icons inside assurance chips,
a gray upload block sitting inside a gray card, coral tiles decorating a
three-item list, coral outlines on every collapsed module rather than the open
one, and a coral avatar in a peer stack.

## Progress is structure

The stepper spans the full width of the frame and sits on a hairline, so it reads
as part of the chrome rather than a floating component. Past steps are solid
`ink`, the current step is a `coral` disc with a bold label, future steps are
gray. Past, present, future — that is the whole language.

Where there is no step to name, use a 3px progress bar filled in coral instead.

## Never disable a button

A greyed-out button says no without saying why, and some screen readers skip it.
Keep controls live. If a required input is missing, let the person press, then
show the error inline: an ink outline on the card, a summary row at the top of it,
and a message under each field. Screen 1a is the reference implementation.

An optional field must be optional everywhere. When the target job became
optional, the validation on screen 1a had to stop erroring on it — a field cannot
be optional in one place and required in another.

## Palette

Coral is the only chromatic color. Everything else is neutral.

| Token | Value | Use |
|---|---|---|
| `coral` | `#FF5A3D` | state, highlight, current step, hover |
| `ink` | `#000000` | text, borders, dark grounds, **all filled controls** |
| `white` | `#FFFFFF` | page ground, content cards, labels on ink |
| `paper` | `#F1F1F1` | **a surface you act on**: inputs, upload zones, copy blocks |
| `page` | `#EDEDED` | the canvas behind a card |
| `muted` | `#5C5C5C` | secondary text (6.69:1 on white) |
| `line` | `#E2E2E2` | hairlines |

Gray means *fillable*. White means *readable*. Do not use gray decoratively.

**Never use:** gradients, `#17111F` or any purple-tinted black, cream, terracotta
`#C65A46`, lime, violet, magenta, or the old pewter blue / pink / green chart
palette. All removed deliberately.

## Shape

| | |
|---|---|
| 12px | containers, cards, panels |
| 8px | inner blocks and controls |
| 6px | chips and badges |
| 999px | only things actually circular — step dots, avatars, swipe buttons |

Border widths: **1px** hairline, **2px** emphasis, **3px** device frame. Nothing else.

**No pills.** **No shadows** — not offset, not blurred, not anywhere.

## Spacing

| | |
|---|---|
| 10px | item to item inside a list or stack |
| 18–22px | paragraph to paragraph, and above a section label |
| 36px | **a category break**, where one concept ends and a different offer begins |

The 36px tier is what separates the game plan from the crew offer. At list
spacing it reads as another item in the stack.

## Grounds

**Marketing pages rotate grounds.** A section can take coral, black, or white.

**The product does not.** Every screen is white. Rotating grounds screen to screen
made the flow feel like three different products.

## Copy

- One verb, one noun: you **build** a **game plan**. Not "get", not "see", not
  "gap analysis".
- Product lockup is `dear[CC] game plan` — brand at 19px weight 900, product name
  at `--t3` weight 600 in black, separated by a 1px hairline. Never gray, which
  reads as disabled. The product name is never a second logo.
- **No em dashes anywhere.**
- **Delete the description if the thing below already shows it.** A label above a
  list of roles does not need a sentence explaining that the list contains roles.
- **Examples beat instructions.** A placeholder reading `Product manager at Stripe`
  converts better than one reading "Job link, screenshot, or description", because
  an example can be copied and an instruction has to be decoded.
- **Never make the user say something self-deprecating.** "Not sure? Take a quick
  quiz" beats "I'm not sure yet".
- **No warmth the product has not earned.** "You're on the list" is correct;
  "We've got you" is a hug from software. Avoid "people like you", which tells
  someone they are a category.
- Errors say what is missing and why, not "required".
- Buttons say what happens: "Build my game plan", not "Submit".
- On a choice screen, the option title carries the whole choice. Put the specifics
  in the label and delete the description.
- **The plan targets a direction, not one job.** Write "PM roles, companies like
  Stripe", never "Product Manager at Stripe". Pinning a single employer commits
  the user to an outcome they do not control.

## Gestures

Where a gesture is the primary input, **the interface demonstrates it and does not
describe it**. The swipe card nudges right on a loop, tilting about 5° with its
state badge appearing, then settles. In the build this runs until the first
interaction, then stops permanently. Honour `prefers-reduced-motion` with a static
tilt instead. Any swipe surface needs an undo, reachable by thumb, between the two
action buttons.

## The mascot

CC the chinchilla appears at moments inside the product — the analysis, the
reveal, the confirmation. Never in the logo, never on a form screen, never more
than once per screen.

## Not part of this system

There is **no share card**. Everything the game plan produces is evidence the
person needs a job, and nobody posts that. The plan exports as a private PDF.
