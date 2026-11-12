import {
  averages,
  CRITERIA,
  CRITERION_LABEL,
  family,
  fmtInt,
  hashFor,
  ordinal,
  reachLabel,
  repoAtCommit,
  roundName,
  scoredReads,
  whyList,
  type Plugin,
  type Read,
  type Results,
} from "./data";

function shareUrl(p: Plugin): string {
  const link = `${location.origin}${location.pathname}${hashFor(p)}`;
  const text = `${p.name} scored ${p.score!.toFixed(2)} of 30 with the IMD swarm judging the Hermes plugin hackathon`;
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
}

function ReadItem({ r }: { r: Read }) {
  const notes: [string, string | null | undefined][] = [
    ["Validation", r.validate],
    ["Inside Hermes", r.inside],
    ["Tests", r.tests],
  ];
  const hasNotes = notes.some(([, v]) => v);
  return (
    <li className="read">
      <p className="read-head">
        <strong>{family(r.judge)}</strong>
        <span>{roundName(r)}</span>
        {r.total != null && !r.blocked && <span className="num">{r.total} of 30</span>}
        {r.record && <a href={r.record}>Public record</a>}
      </p>
      {r.blocked ? (
        <p className="muted">Could not read: {r.blocked}</p>
      ) : (
        <>
          {r.best && <p><span className="lbl">Best:</span> {r.best}</p>}
          {r.worst && <p><span className="lbl">Worst:</span> {r.worst}</p>}
        </>
      )}
      {hasNotes && (
        <dl className="notes">
          {notes.map(([k, v]) =>
            v ? (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ) : null,
          )}
        </dl>
      )}
    </li>
  );
}

export function Scorecard({ plugin: p, data }: { plugin: Plugin | null; data: Results }) {
  if (!p) {
    return (
      <article className="card-page">
        <p><a href="#/">Back to the scoreboard</a></p>
        <h1 id="scorecard-title" tabIndex={-1}>No plugin at this link</h1>
        <p>The link may be mistyped. Search the full list on the scoreboard.</p>
      </article>
    );
  }
  const avg = averages(p);
  const n = scoredReads(p).length;
  const reads = p.reads ?? [];
  const why = whyList(p.final);
  const repo = repoAtCommit(p);
  const insideCount = data.plugins.filter((x) => x.round3).length;
  return (
    <article className="card-page" aria-labelledby="scorecard-title">
      <p><a href="#/">Back to the scoreboard</a></p>
      <h1 id="scorecard-title" tabIndex={-1}>{p.name}</h1>
      <p className="meta">
        <span>by {p.author}</span>
        <span>{reachLabel(p)}</span>
        {p.final?.place != null ? (
          <span>{ordinal(p.final.place)} place</span>
        ) : p.standing != null ? (
          <span>Standing {fmtInt(p.standing)} by score</span>
        ) : null}
      </p>
      <p className="big-score num">
        {p.score != null ? (
          <>
            {p.score.toFixed(2)} <span className="muted">of 30</span>
          </>
        ) : (
          "Not scored"
        )}
      </p>
      <p className="does measure">{p.does}</p>
      <p className="actions">
        {p.score != null && (
          <a className="btn btn-primary" href={shareUrl(p)} target="_blank" rel="noopener noreferrer">
            Share on X
          </a>
        )}
        <a className="btn" href={p.pr_url}>Pull request #{p.pr}</a>
        {repo && (
          <a className="btn" href={repo}>
            Repository at {p.sha ? p.sha.slice(0, 7) : "latest"}
          </a>
        )}
        {p.demo?.url && <a className="btn" href={p.demo.url}>Demo post</a>}
      </p>
      {p.tags && p.tags.length > 0 && (
        <p className="tags">{p.tags.map((t) => <span key={t} className="tag">{t}</span>)}</p>
      )}

      <section aria-labelledby="sc-scores">
        <h2 id="sc-scores">Scores</h2>
        {avg ? (
          <>
            <p className="muted">Each out of 5, averaged over {n} read{n === 1 ? "" : "s"}.</p>
            <dl className="bars">
              {CRITERIA.map((c) => (
                <div key={c} className="bar-row">
                  <dt>{CRITERION_LABEL[c]}</dt>
                  <dd>
                    <span className="bar" aria-hidden="true">
                      <span style={{ inlineSize: `${(avg[c] / 5) * 100}%` }} />
                    </span>
                    <span className="num">{avg[c].toFixed(1)}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="muted">No agent could read this plugin, so it has no scores.</p>
        )}
      </section>

      {p.final && (
        <section aria-labelledby="sc-final">
          <h2 id="sc-final">The final</h2>
          <p>
            {ordinal(p.final.place)} of {data.rounds.final.plugins}, mean rank {p.final.mean_rank.toFixed(2)}, ranked
            first by {p.final.firsts} of {data.rounds.final.agents} final agents.
          </p>
          {why.length > 0 && (
            <ul className="why-list">
              {why.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </section>
      )}

      {p.round3 && (
        <section aria-labelledby="sc-r3">
          <h2 id="sc-r3">Round 3, inside Hermes</h2>
          <p>
            {p.round3.score != null && <>Scored {p.round3.score.toFixed(2)} of 30</>}
            {p.round3.rank != null && <>, {ordinal(p.round3.rank)} of the {insideCount} run inside Hermes</>}. The
            notes from each run are under its judge below.
          </p>
        </section>
      )}

      <section aria-labelledby="sc-reads">
        <h2 id="sc-reads">What each judge said</h2>
        {reads.length ? (
          <ol className="reads">
            {reads.map((r, i) => <ReadItem key={r.item ?? i} r={r} />)}
          </ol>
        ) : (
          <p className="muted">No reads are recorded for this plugin.</p>
        )}
      </section>
    </article>
  );
}
