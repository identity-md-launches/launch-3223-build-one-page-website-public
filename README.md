# IMD judged the Hermes plugin hackathon

The public scoreboard for the IMD swarm's unofficial judging of the Hermes Agent Plugin Hackathon
(Nous Research, Nov 4 to 11, 2026): winners, a sortable and filterable table of all 1,464 plugins, a
scorecard per plugin at its own link (`#/p/PR-NAME`), and how the judging worked.

One static page (Vite, React, TypeScript). No backend, tracking, wallet, outside fonts or outside scripts.

## Data

Every number comes from one JSON file fetched when the page loads:

```
https://gist.githubusercontent.com/gtmcknight/594c47336546c8763e641b46cf9af4ec/raw/results.json
```

Nothing from it is baked into the page. If that fetch fails, the page loads the copy saved at build
time, `./results.json` (from `public/results.json`), and says so in the header status line
("saved copy, live file unavailable"). Tags, `round3`, `final` and `demo` are optional per plugin; the
tag chips and tags column disappear when the file has no tags, and scorecard sections appear only when
their fields are present.

Refresh the fallback copy before a rebuild with `npm run fallback`.

## Install, preview, rebuild

Needs Node 20 or newer (built with Node 24.21 and npm 11.19).

```sh
npm ci              # install exactly what package-lock.json pins
npm run dev         # local dev server with hot reload
npm run typecheck   # tsc --noEmit
npm run build       # typecheck, then the production export into dist/
npm run preview     # serve dist/ locally to check the export
npm run fallback    # optional: refresh public/results.json from the live gist
```

`dist/` is committed and is what gets published; the publisher does not rebuild. Vite's `base` is
`./`, so every asset URL is relative and the export works at an IPFS gateway subpath or an ENS name.
Routing is hash-based (`#/p/152458-housemate`), so no server rewrites are needed.

## Layout of the repository

| Path | What it is |
| --- | --- |
| `index.html` | Document shell: title, description, favicon, Open Graph and Twitter tags |
| `src/data.ts` | Types for results.json, live fetch with fallback, labels and derived values |
| `src/App.tsx` | Hash router: scoreboard or scorecard, scroll and focus restore |
| `src/Header.tsx`, `src/Winners.tsx`, `src/PluginTable.tsx`, `src/HowJudged.tsx`, `src/Scorecard.tsx`, `src/Footer.tsx` | The page sections |
| `src/styles.css` | All tokens and styles (see DESIGN.md) |
| `public/` | favicon.svg, og.png (1200 by 630), results.json fallback |
| `scripts/update-fallback.mjs` | Refreshes the fallback copy |
| `dist/` | The committed production export |
| `DESIGN.md` | Design system as implemented |
| `VALIDATION.md` | Better Interface review (six domains, findings with file:line, fixes), probe results and interaction checks; also delivered as `artifacts/validation.md` |

## Path budget

Committed output: source (about 60 KB), `package-lock.json`, `dist/` (index.html, one JS and one CSS
bundle of about 177 KB, favicon, og.png 46 KB, results.json 2.6 MB) and `public/` (the same
results.json and og.png, identical bytes, so Git stores each blob once). The JSON compresses to well
under 1 MB in a Git pack. `.gitignore` excludes only generated dependency and cache directories
(`node_modules/`, `.npm/`, `.cache/`, `.vite/`) and `*.tgz` archives, at every nesting level.

## Checks run (worker side)

Run on 2026-11-12 against the final source and export:

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | Passed, no errors |
| Production build | `npm run build` | Passed: `dist/index.html` 1.38 kB, CSS 10.6 kB, JS 166 kB (53.5 kB gzip) |
| Design probe | `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | 16 of 16 checks passed at 320, 390 and 1440 |
| Interactions | Playwright MCP browser on the served `dist/` | Passed; details below |

Interactions exercised in a real browser on the export (served under `/preview/`):
search ("voice" gave 50 rows, a nonsense query showed the empty state and its clear button restored
1,464); each "How far it got" filter (Finalists 20, Run inside Hermes 108, Read twice 116, Read once
1,210, All 1,464); tag chips (voice 45, voice or hardware 91, Clear tags); sorting by Score both ways,
Name, and back to Place, with `aria-sort` updating; paging (150 rows, "Show more" to 300, scrolling
adds more); a row click opening `#/p/149641-onda` with focus on the title; the Share link text and URL;
Back restoring the scroll position and focus to the row; keyboard Enter on a row link; browser back
keeping the search query; direct links to an unread plugin and to a nonexistent one; no horizontal
scroll on the 10 winners' scorecards at 390; dark mode at 1440. Console: 0 errors, 0 warnings. The live
gist request returned 200; the probe's offline browser showed the fallback copy and its notice.

Limitations: no screen reader session, no physical phone, no native 200% zoom (320 wide reflow was
checked instead). The Share link was checked as a URL; posting on X was not attempted.
