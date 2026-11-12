import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  fmtInt,
  fmtScore,
  hashFor,
  ordinal,
  placeKey,
  reachLabel,
  slug,
  STAGE_DEPTH,
  type Plugin,
  type Results,
  type Stage,
} from "./data";

type SortKey = "place" | "name" | "author" | "reach" | "score";
type Reach = "all" | Stage;

const REACH_FILTERS: { id: Reach; label: string }[] = [
  { id: "all", label: "All" },
  { id: "final", label: "Finalists" },
  { id: "round3", label: "Run inside Hermes" },
  { id: "read2", label: "Read twice" },
  { id: "read1", label: "Read once" },
];

const SORT_LABEL: Record<SortKey, string> = {
  place: "Place",
  name: "Name",
  author: "Author",
  reach: "How far it got",
  score: "Score",
};

/** Natural first direction per column: ranks ascend, scores descend, text A to Z. */
const FIRST_DIR: Record<SortKey, 1 | -1> = { place: 1, name: 1, author: 1, reach: -1, score: -1 };

const PAGE = 150;

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function compare(a: Plugin, b: Plugin, key: SortKey): number {
  switch (key) {
    case "place":
      return placeKey(a) - placeKey(b);
    case "name":
      return collator.compare(a.name, b.name);
    case "author":
      return collator.compare(a.author, b.author);
    case "reach":
      return STAGE_DEPTH[a.stage] - STAGE_DEPTH[b.stage] || placeKey(b) - placeKey(a);
    case "score":
      return (a.score ?? -1) - (b.score ?? -1) || placeKey(b) - placeKey(a);
  }
}

function Place({ p }: { p: Plugin }) {
  if (p.final?.place != null) return <strong>{ordinal(p.final.place)}</strong>;
  if (p.standing != null) return <span className="muted">#{p.standing}</span>;
  return <span className="muted">None</span>;
}

const Row = memo(function Row({ p, showTags }: { p: Plugin; showTags: boolean }) {
  const href = hashFor(p);
  return (
    <tr
      className={p.stage === "final" ? "row row-final" : "row"}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a") || window.getSelection()?.toString()) return;
        location.hash = href;
      }}
    >
      <td className="c-place num">
        <Place p={p} />
      </td>
      <td className="c-name">
        <a href={href} data-slug={slug(p)}>
          {p.name}
        </a>
      </td>
      <td className="c-author">{p.author}</td>
      <td className="c-does">
        <span className="clamp">{p.does}</span>
      </td>
      {showTags && <td className="c-tags">{(p.tags ?? []).join(", ")}</td>}
      <td className="c-reach">{reachLabel(p)}</td>
      <td className="c-score num">
        {p.score == null ? <span className="muted">None</span> : fmtScore(p.score)}
      </td>
    </tr>
  );
});

export function PluginTable({ data }: { data: Results }) {
  const all = data.plugins;
  const [query, setQuery] = useState("");
  const [reach, setReach] = useState<Reach>("all");
  const [tags, setTags] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "place", dir: 1 });
  const [limit, setLimit] = useState(PAGE);
  const q = useDeferredValue(query.trim().toLowerCase());
  const sentinel = useRef<HTMLDivElement>(null);

  // Tags fill in after the judging, so the chips come from the file and disappear when it has none.
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of all) for (const t of p.tags ?? []) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]));
  }, [all]);
  const showTags = tagCounts.length > 0;

  const reachCounts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const p of all) c[p.stage] = (c[p.stage] ?? 0) + 1;
    return c;
  }, [all]);

  const haystack = useMemo(
    () => new Map(all.map((p) => [p, `${p.name}\n${p.author}\n${p.does}`.toLowerCase()])),
    [all],
  );

  const rows = useMemo(() => {
    const words = q.split(/\s+/).filter(Boolean);
    const out = all.filter((p) => {
      if (reach !== "all" && p.stage !== reach) return false;
      if (tags.length && !(p.tags ?? []).some((t) => tags.includes(t))) return false;
      if (words.length) {
        const h = haystack.get(p)!;
        return words.every((w) => h.includes(w));
      }
      return true;
    });
    out.sort((a, b) => compare(a, b, sort.key) * sort.dir || placeKey(a) - placeKey(b));
    return out;
  }, [all, haystack, q, reach, tags, sort]);

  useEffect(() => setLimit(PAGE), [q, reach, tags, sort]);

  // Render rows in pages; scrolling near the end of the list adds the next page.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || limit >= rows.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE);
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [limit, rows.length]);

  const setSortKey = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: FIRST_DIR[key] }));

  const toggleTag = (t: string) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const clearAll = () => {
    setQuery("");
    setReach("all");
    setTags([]);
  };

  const filtered = query.trim() !== "" || reach !== "all" || tags.length > 0;

  const header = (key: SortKey, className: string) => {
    const active = sort.key === key;
    return (
      <th
        scope="col"
        className={className}
        aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
      >
        <button type="button" className="sort" onClick={() => setSortKey(key)}>
          {SORT_LABEL[key]}
          <span className="sort-mark" aria-hidden="true">
            {active ? (sort.dir === 1 ? "↑" : "↓") : ""}
          </span>
        </button>
      </th>
    );
  };

  const shown = rows.slice(0, limit);

  return (
    <section className="wrap section" aria-labelledby="plugins-h" id="plugins">
      <h2 id="plugins-h">All {fmtInt(all.length)} plugins</h2>

      <div className="controls">
        <div className="search">
          <label htmlFor="q">Search by name, author or what it does</label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="voice, memory, RaYYeR220"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="filter" role="group" aria-labelledby="reach-l">
          <span id="reach-l" className="filter-label">How far it got</span>
          <div className="chips">
            {REACH_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="chip"
                aria-pressed={reach === f.id}
                onClick={() => setReach(f.id)}
              >
                {f.label} <span className="count">{fmtInt(reachCounts[f.id] ?? 0)}</span>
              </button>
            ))}
          </div>
        </div>

        {showTags && (
          <div className="filter" role="group" aria-labelledby="tags-l">
            <span id="tags-l" className="filter-label">
              Tags{tags.length > 0 && <> ({tags.length} chosen, showing plugins with any of them)</>}
            </span>
            <div className="chips">
              {tagCounts.map(([t, n]) => (
                <button
                  key={t}
                  type="button"
                  className="chip"
                  aria-pressed={tags.includes(t)}
                  onClick={() => toggleTag(t)}
                >
                  {t} <span className="count">{fmtInt(n)}</span>
                </button>
              ))}
              {tags.length > 0 && (
                <button type="button" className="chip chip-clear" onClick={() => setTags([])}>
                  Clear tags
                </button>
              )}
            </div>
          </div>
        )}

        <div className="sort-mobile">
          <label htmlFor="sort-by">Sort by</label>
          <select
            id="sort-by"
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":");
              setSort({ key: key as SortKey, dir: Number(dir) as 1 | -1 });
            }}
          >
            <option value="place:1">Place, best first</option>
            <option value="score:-1">Score, highest first</option>
            <option value="score:1">Score, lowest first</option>
            <option value="reach:-1">How far it got, furthest first</option>
            <option value="name:1">Name, A to Z</option>
            <option value="author:1">Author, A to Z</option>
            {![["place", 1], ["score", -1], ["score", 1], ["reach", -1], ["name", 1], ["author", 1]].some(
              ([k, d]) => k === sort.key && d === sort.dir,
            ) && <option value={`${sort.key}:${sort.dir}`}>{SORT_LABEL[sort.key]}, reversed</option>}
          </select>
        </div>
      </div>

      <p className="result-line" role="status">
        Showing {fmtInt(rows.length)} of {fmtInt(all.length)} plugins
        {filtered && (
          <>
            {" "}
            <button type="button" className="linkish" onClick={clearAll}>
              Clear search and filters
            </button>
          </>
        )}
      </p>
      <p className="muted small">
        Place: finalists by their final place, then every other plugin by its standing on score (#). Scores are out of 30.
      </p>

      {rows.length === 0 ? (
        <div className="empty">
          <p>
            No plugins match{query.trim() ? <> “{query.trim()}”</> : null} with these filters.
          </p>
          <button type="button" className="btn" onClick={clearAll}>
            Clear search and filters
          </button>
        </div>
      ) : (
        <table className={showTags ? "board" : "board no-tags"}>
          <caption className="sr-only">
            Plugins sorted by {SORT_LABEL[sort.key].toLowerCase()}. Select a name to open its scorecard.
          </caption>
          <thead>
            <tr>
              {header("place", "c-place")}
              {header("name", "c-name")}
              {header("author", "c-author")}
              <th scope="col" className="c-does">One line</th>
              {showTags && <th scope="col" className="c-tags">Tags</th>}
              {header("reach", "c-reach")}
              {header("score", "c-score")}
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <Row key={slug(p)} p={p} showTags={showTags} />
            ))}
          </tbody>
        </table>
      )}
      {limit < rows.length && (
        <div ref={sentinel} className="more">
          <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE)}>
            Show {fmtInt(Math.min(PAGE, rows.length - limit))} more of {fmtInt(rows.length - limit)} left
          </button>
        </div>
      )}
    </section>
  );
}
