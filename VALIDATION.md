# Validation: IMD Hermes hackathon scoreboard

Worker's report for this assignment, not an independent certification. Date: 2026-11-12.

## 1. Scope and assumptions

- Reviewed: the scoreboard (header, winners, table with search, tag chips, "How far it got" filter,
  sorting, paging, how it was judged, footer) and the scorecard route `#/p/PR-NAME`, including the
  unread and not-found states. Export: `dist/`, built by `npm run build`, served by the IMD browser
  launcher at `/preview/` (a subpath, so relative assets were exercised).
- Data: the live gist loaded in the browser tool (HTTP 200). The design probe's browser could not reach
  it, so the probe measured the fallback copy, which also confirmed the fallback path and its notice.
- Inferred choices: "Place" shows the final place for the 20 finalists and the score standing (#) for
  everyone else; filters match the stage words exactly (Run inside Hermes = 108 round 3 plugins that
  did not reach the final); tag chips use "any of the chosen tags"; the one-line text clamps to two
  lines in the table with the full text on the scorecard; the "two shares" in the judging section are
  `judges.codex.share_27_up` and `judges.claude.share_27_up` (share of each family's reads that scored
  27 or higher), shown to one decimal; "three agents each" is the median count of
  inside-Hermes reads per round 3 plugin, computed from the file. Eight PRs hold several plugins, so the
  unique key and link is `PR-NAME`.
- Variants: light and dark (system preference). No localization.

## 2. Coverage (Better Interface, six domains)

| Domain | Status | Evidence |
| --- | --- | --- |
| Accessibility | Checked | Native buttons, links, `<label for>` on search and sort select, `aria-pressed` chips, `aria-sort` on sortable headers, `role="status"` result count, skip link as first tab stop (focus ring computed 2px solid and seen in the browser), one `h1` per view, row name is a real link, scorecard focuses its `h1` and Back returns focus to the exact link that opened it (the table row or the winner entry, which share a slug). Probe: all 205 controls at least 24px or spaced at 390. Unperformed: screen reader session, forced-colors mode, native 200% zoom. |
| Layout | Checked | Probe: no horizontal scroll at 320, 390, 1440, no overlaps, nothing cut off. Browser: scorecards of all 10 winners plus unread and low entries at 390 had scrollWidth 390; table becomes a list at 56rem and narrows at 64rem; one primary action per view. Unperformed: pseudo-localization, RTL. |
| Writing | Checked (source) | Verb-first buttons ("Search all 1,464 plugins", "Share on X", "Clear search and filters", "Try again"), descriptive links ("Public record", "Pull request #152458", "Repository at 09c1a1d"), sentence case throughout, empty state names the query and offers a clear button, load error says how to recover. |
| Typography | Checked | Probe: one family (system-ui), weights 400/600/700, 5 sizes (13, 14, 16, 20, 28 to 40), tracking natural, no caps, no em dashes. Inputs 16px. Tabular numbers on scores and places. Measures capped. |
| Colors | Checked | Semantic tokens only, both theme blocks present. Probe measured all text at or above 4.5:1 (3:1 large) in light mode. Dark mode viewed at 1440, contrast not measured. |
| UI | Checked | No cards, shadows or gradients (probe "chrome" pass), named transition properties at 120ms on color only, reduced motion removes them, hover gated by `(hover: hover)`. No icons other than sort arrows. |

## 3. Findings and fixes

| # | Severity | Location | Evidence | Fix | Recheck |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | `src/PluginTable.tsx:313` (was `key={p.pr}`) | After filtering and sorting in the browser, the table showed "#1370 onda" first under Place ascending; 8 PRs contain several plugins, so React row keys collided and rows were reused out of order. | Key rows and winner entries by the unique `slug(p)` (`PR-NAME`). | Same sequence rerun: first rows 1st housemate, 2nd hermes-canvas, 3rd hermes-ark; order monotonic over all 150 rendered rows; rows unique. |
| 2 | HIGH | `src/styles.css:341` | Scorecard at 390 had scrollWidth 883: long pinned URLs in round 3 notes widened the grid track. | `grid-template-columns: minmax(0, 1fr)` on page grids, `overflow-wrap: anywhere` on reads and reasons. | All 10 winners' scorecards and others at 390: scrollWidth 390. Probe layout pass. |
| 3 | MEDIUM | `src/Header.tsx:28-44`, `src/Winners.tsx:90` | Probe copy-budget failed: 100 words of prose on the first screen at 390; the two header buttons wrapped into a stack. | Shorter how sentence, event line moved to the status line, second header button removed (one main action), closeness sentence moved after the top five. | Probe: 59 words at 390 and 1440; first screen at 390 shows title, how sentence, status, note, main action and the start of the winners (screenshot `test/scratch/taste/shots/390.png`, viewed). |
| 4 | MEDIUM | `src/styles.css:81` | Probe type-faces failed: 5 weights (400, 600, 650, 700, 900); `strong` inside bold text resolved to 900. | Weights limited to 400/600/700; `strong, b { font-weight: 700 }`. | Probe type-faces pass. |
| 5 | MEDIUM | `src/styles.css:255`, `:304` | Phone list showed a stray rule under the one-line text (desktop rule outranked the phone rule), and tags were hidden on phones and below 64rem. | Clamp moved to an inner `.clamp` span, desktop-only shadow rule removed; tags get their own grid area on phones and narrower columns below 64rem instead of being hidden. | 390 screenshot: rows show name, score, author, one line, how far, tags with clean rules. |
| 6 | LOW | `src/styles.css:241` | Desktop headers: sortable button headers and plain text headers sat at different heights. | `vertical-align: bottom; line-height: 24px` on header cells. | Built; probe still 16/16. |

No unresolved findings within scope.

## 4. Verification

Commands (from the repository root):

- `npm run typecheck`: passed, no output errors.
- `npm run build`: passed. `dist/index.html` 1.38 kB, `dist/assets/index-*.css` 10.6 kB,
  `dist/assets/index-*.js` 166 kB (53.5 kB gzip).
- `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` (with
  `IMD_PLAYWRIGHT` pointing at the machine's Playwright): exit 0, 16 of 16 passed: render, layout,
  targets, contrast, casing, tracking, eyebrows, type-sizes, type-faces, glyphs, slogans, repetition,
  copy-budget, chrome, motion, share. Screenshots in `test/scratch/taste/shots/` (not submitted).

Browser tool (Playwright MCP) on the served export, viewports 1440x900 and 390x844, light and dark:

- Search: "voice" 50 rows; "zzzqqq" empty state; its button restored 1,464; typed "tenure" gave 1 row.
- Filters: Finalists 20, Run inside Hermes 108, Read twice 116, Read once 1,210, All 1,464.
- Tags: voice 45, voice or hardware 91, Clear tags back to 1,464.
- Sort: Score descending (permission-canvas 28.04 first, `aria-sort="descending"`), ascending, Name, Place.
- Paging: 150 rows, "Show more" 300, scrolling 600; filtering all rows took about 120 ms to the next frame.
- Scorecard: row click opened `#/p/149641-onda`, title focused, bars, reads, record links, PR and
  repository-at-commit links, Share link `https://x.com/intent/post?text=onda%20scored%2016.86%20of%2030%20with%20the%20IMD%20swarm%20judging%20the%20Hermes%20plugin%20hackathon&url=...%23%2Fp%2F149641-onda`.
  Finalist housemate: final, round 3 and per-run Validation / Inside Hermes / Tests notes, demo link.
  Unread plugin: "Not scored", blocked reasons, no Share. Unknown link: "No plugin at this link".
- Back link and browser back: scroll restored (3162 to 3162), focus back on the row link, search kept.
- Keyboard: Tab reaches the skip link first with a visible 2px ring; Enter on a row link opens the scorecard.
- Console: 0 errors, 0 warnings. Network: gist 200; no other outside hosts.

## Revision 2: reviewer findings

Each finding was reproduced on the previous export (`git archive HEAD dist`, served locally) with a
Playwright script in `test/scratch/check.mjs` (Chromium; results.json routed to the local copy), then
fixed and rechecked on the new export with the same script.

| Finding | Before (old export) | Fix | After |
| --- | --- | --- | --- |
| Table at tablet widths | 721px: header overlap 24.3px, one-line cell 41px; 740px: overlap 5.3px, 60px; 800px: 104px | `src/styles.css:280` list breakpoint 45rem to 56rem | 721, 740, 800, 896px use the list with Sort by; 897, 960, 1024, 1280, 1440px tables have no header overlap and a one-line column of 201 to 352px |
| Long scorecard names at 320px | 3 of 1,464 scorecards scrolled sideways (predictionmarketspicks 375px, getyoutubetranscript 343px, aitrainingdatabroker 333px) | `src/styles.css:344` `#scorecard-title { overflow-wrap: anywhere; }` | all 1,464 scorecards at 320px have scrollWidth 320; title stays 28px and complete |
| Counts in share metadata | description and og:description said 1,464; og.png printed it | `index.html` copy without counts; `public/og.png` re-rendered with "Scorecards for every plugin" | no digits in either meta tag |
| Shares from judges | sentence used read volume (64%, 36%) | `src/HowJudged.tsx` uses `share_27_up` | "...one curve; 20.4% of Codex reads and 10.9% of Claude reads scored 27 or higher." |
| Focus after Back from a table scorecard | focus went to the winner link at y=-2335; next Tab stayed in winners | `src/App.tsx` remembers the link that opened the scorecard; `src/PluginTable.tsx` row click focuses its own link first | Enter on the table link, then Back: focus on the table link in view (y=442), next Tab moves on from the table; row click + browser Back: focus in table; winner link + Back: focus on the winner |

After the last source change: `npm run build` (tsc --noEmit then vite build) passed; the design probe
passed 16 of 16 again; console errors 0 in the scripted runs. The probe's browser had no network, so
it measured the fallback copy, as before.

## 5. Completion

Complete for the stated scope. Remaining limitations: no screen reader session, no physical device,
no native browser zoom (320 reflow checked instead), dark-mode contrast viewed but not measured,
forced-colors not checked, posting to X not attempted.
