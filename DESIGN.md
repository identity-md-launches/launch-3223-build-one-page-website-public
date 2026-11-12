# DESIGN.md

Design system of the IMD Hermes hackathon scoreboard, as implemented in `src/styles.css` and the
components in `src/`. Use it to add another page that belongs to the same site.

## Overview

A public results page for people following the hackathon: entrants checking where they landed,
readers looking for the winners, and anyone opening a shared scorecard link. The character is a plain
leaderboard: the system font, black on white (white on near-black in dark mode), hairline rules, dense
rows, and no cards, shadows, gradients or small caps labels. Hierarchy comes from size, weight and
order, never from color or decoration. Density is high in the table and lists, with more air between
sections than within them (8 to 16px inside a group, 40px between sections).

The page order is fixed by the brief: header with status and note, winners, the table, how it was
judged, footer. A scorecard replaces the scoreboard in the same document at `#/p/PR-NAME`.

## Colors

Defined once as semantic tokens on `:root` in `src/styles.css`; dark values in the
`@media (prefers-color-scheme: dark)` block. There is no switch; the system preference decides.
`color-scheme: light dark` is set on `:root` and in `index.html` so native controls follow.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#ffffff` | `#0f0f0f` | Page background, inputs |
| `--color-text` | `#111111` | `#f0f0f0` | Body text, headings, links |
| `--color-text-muted` | `#595959` | `#a6a6a6` | Authors, meta lines, tags, secondary text |
| `--color-rule` | `#d4d4d4` | `#383838` | Hairline rules between rows and sections, chip outlines |
| `--color-rule-strong` | `#111111` | `#f0f0f0` | Table header rule, button and input outlines |
| `--color-row-hover` | `#f3f3f3` | `#1b1b1b` | Row and outline button hover (pointer devices only) |
| `--color-fill` | `#111111` | `#f0f0f0` | The one filled action per view, pressed chips, score bars, skip link |
| `--color-on-fill` | `#ffffff` | `#0f0f0f` | Text on `--color-fill` |
| `--color-track` | `#e4e4e4` | `#2c2c2c` | Empty part of a score bar |
| `--color-focus` | `#0b57d0` | `#8ab4f8` | `:focus-visible` outline, 2px solid, 2px offset |

There is no accent hue. The design probe measured all rendered text at or above 4.5:1 (3:1 for large
text) in light mode at 320, 390 and 1440; dark mode pairs were viewed, not measured.

## Typography

- Family: `--font-sans`: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
  No web fonts are loaded.
- Weights: 400 (text), 600 (labels, names, buttons, `h3`), 700 (`h1`, `h2`, `strong`, places).
- One scale of five sizes:

| Token | Size | Role |
| --- | --- | --- |
| `--text-small` | 13px | The table legend |
| `--text-row` | 14px | Table rows, meta lines, chips, buttons, labels, judges' notes |
| `--text-body` | 16px | Body copy, inputs (never smaller on phones), runner-up names, phone row names |
| `--text-heading` | 20px | `h2`, top-five names and place numbers, "of 30" |
| `--text-display` | `clamp(28px, 4.2vw, 40px)` | `h1`, the big score on a scorecard |

- Line height 1.5 for text, 1.15 for headings (`h1` to `h3`), 24px in table headers.
- `h1` letter-spacing `-0.02em`; nothing else is tracked. No uppercase transforms.
- `text-wrap: balance` on headings, `pretty` on descriptions. Long-form lines are capped
  (`.measure` 70ch, `.lede` 62ch, descriptions 75ch, judges' reads 80ch).
- `.num` sets `font-variant-numeric: tabular-nums` on scores, places and counts.
- Long unbroken strings (URLs in judges' notes, and plugin names in the scorecard title
  `#scorecard-title`) use `overflow-wrap: anywhere`, so a long name wraps at its full size instead of
  widening the page at 320px.

## Layout

- Container `.wrap`: `max-width: 1240px` (`--page-max`), centered, inline padding `--gutter`
  (16px, 24px from 48rem), respecting `env(safe-area-inset-left)`.
- Spacing steps: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px,
  `--space-5` 24px, `--space-6` 40px, `--space-7` 64px (reserved).
- Sections (`.section`) are single-column grids, `gap: 16px`, `padding-block: 40px`, closed by one
  hairline. Every grid track is `minmax(0, 1fr)` so content can never widen the page.
- Breakpoints, chosen where the content stops fitting:
  - `max-width: 64rem`: table columns narrow (place 3.75rem, name 9.5rem, author 7.5rem, tags 7rem,
    how far 8.5rem, score 4.25rem); the one-line column takes the rest.
  - `max-width: 56rem` (896px): phones and tablets get the list instead of the table, because below
    that width the seven fixed columns leave the one-line column too narrow to read. The table becomes a list. Each row is a grid: place on the left; name and
    score on the first line; then author, the one line, how far it got and tags. The header row is
    visually hidden but stays for screen readers, and a "Sort by" select replaces the column buttons.
- The first screen at 390 wide shows the title, the how sentence, status, the note, the main action
  ("Search all 1,464 plugins") and the start of the winners.

## Elevation & Depth

Deliberately flat. No shadows, no gradients, no overlays. Structure comes from 1px rules
(`--hairline: 1px solid var(--color-rule)`) between rows and sections, a stronger rule under the table
header, and a 1px rule on the left of the round 3 notes. Nothing stacks except the skip link
(`z-index: 10`).

## Shapes

- `--radius: 4px` on buttons, inputs and the skip link; `2px` on score bars.
- Pills (`border-radius: 999px`) only for filter chips and tag labels on a scorecard.
- Rows, lists and sections have no radius and no box: they are separated by rules.

## Components

| Pattern | Source | Use and states |
| --- | --- | --- |
| Button `.btn` | `src/styles.css`, used in Header, PluginTable, Scorecard | Outline, 44px min height, 14px 600. `.btn-primary` fills with `--color-fill`: one per view (Search on the scoreboard, Share on X on a scorecard). Hover background on pointer devices; focus ring from `:focus-visible`. Links styled as buttons stay `<a>`. |
| Chip `.chip` | `PluginTable.tsx` | Toggle buttons with `aria-pressed`, 32px high, count in muted text. Pressed: filled. Used for "How far it got" (single choice) and tags (any of the chosen). `.chip-clear` is dashed. |
| Text button `.linkish` | `PluginTable.tsx` | Underlined button for inline actions such as "Clear search and filters". |
| Leaderboard table `.board` | `PluginTable.tsx` (`Row`) | `table-layout: fixed`, 14px rows, 8px cell padding, hairlines. Sortable headers are buttons inside `th` with `aria-sort` and an arrow. The whole row is clickable; the name is the real link (`data-slug`) for keyboard, new tab and focus restore. Descriptions clamp to two lines (`.clamp`); the full text is on the scorecard. Rows render 150 at a time; a "Show more" button and an IntersectionObserver add pages. Finalists show "1st"; others "#standing". Status line is `role="status"`; empty state names the query and offers a clear button. |
| Winner row `.wins` / `.win` | `Winners.tsx` | Ordered list with the place in a 3ch column. Top five: 20px name, one line, first reason, meta line (firsts, mean rank, demo link), the other reasons in `<details>`. Runners-up (`.win-small`): 16px, reasons in `<details>`. |
| Meta line `.meta` | Winners, Scorecard | Wrapping flex row of short facts, 14px muted, 16px gaps. |
| Score bars `.bars` | `Scorecard.tsx` | `<dl>`: label, bar (`--color-fill` on `--color-track`, width = average / 5), value with one decimal. |
| Judge read `.read` | `Scorecard.tsx` (`ReadItem`) | Head line (family, round, total, record link), Best and Worst sentences, round 3 notes as a `<dl class="notes">`. Blocked reads show the reason. |
| Steps `.steps` | `HowJudged.tsx` | Numbered list, bold lead phrase then the counts from `rounds`. |
| Skip link `.skip` | `App.tsx` | First focusable element; moves focus to `main`. |

Routing (`App.tsx`): `#/p/PR-NAME` shows the scorecard and focuses its `h1`; any other hash shows the
scoreboard, which stays mounted (hidden) so search, filters, sort and scroll survive a round trip.

## Do's and Don'ts

- Do start a new page inside `.wrap` with `.section` blocks and one `h1`; separate sections with the
  hairline, not boxes.
- Do take colors only from the semantic tokens; add a token for a new role instead of reusing one by value.
- Do keep exactly one `.btn-primary` per view; everything else is an outline `.btn`, a chip or a link.
- Do read every count from `results.json`; never type a number from the data into copy.
- Do use `.num` for any number that sits in a column or changes.
- Don't add a font, a shadow, a gradient, a card, an accent hue or uppercase tracked labels.
- Don't add a sixth font size; pick from the five tokens.
- Don't put interactive elements inside table rows other than the name link (the row itself is clickable).

Recipe for another page: add a route in `App.tsx` (`#/something`), render a `<main className="wrap">`
with an `h1` at `--text-display`, a `.meta` line, then `<section>` blocks with `h2` headings, using
`.btn`, `.chip` and `.board` as they are.
