import { hashFor, ordinal, slug, whyList, type Plugin, type Results } from "./data";

function Demo({ p }: { p: Plugin }) {
  if (!p.demo?.url) return null;
  return (
    <a href={p.demo.url}>
      Demo post{p.demo.handle ? <> by @{p.demo.handle}</> : null}
    </a>
  );
}

function Firsts({ p, agents }: { p: Plugin; agents: number }) {
  const n = p.final?.firsts ?? 0;
  return (
    <span>
      Ranked first by {n} of {agents} final agents
    </span>
  );
}

function Entry({ p, agents, big }: { p: Plugin; agents: number; big: boolean }) {
  const why = whyList(p.final);
  const [lead, ...more] = why;
  return (
    <li className={big ? "win" : "win win-small"}>
      <span className="win-place" aria-hidden="true">
        {p.final!.place}
      </span>
      <div className="win-body">
        <h3 className="win-name">
          <span className="sr-only">{ordinal(p.final!.place)} place: </span>
          <a href={hashFor(p)} data-slug={slug(p)}>
            {p.name}
          </a>{" "}
          <span className="muted">by {p.author}</span>
        </h3>
        <p className="does">{p.does}</p>
        {big && lead && <p className="why">{lead}</p>}
        <p className="meta">
          <Firsts p={p} agents={agents} />
          <span>Mean rank {p.final!.mean_rank.toFixed(2)}</span>
          <Demo p={p} />
        </p>
        {(big ? more : why).length > 0 && (
          <details>
            <summary>
              {big ? `${more.length} more reason${more.length === 1 ? "" : "s"}` : "Why it placed here"}
            </summary>
            <ul className="why-list">
              {(big ? more : why).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </li>
  );
}

export function Winners({ data }: { data: Results }) {
  const finals = data.plugins
    .filter((p) => p.final?.place != null)
    .sort((a, b) => a.final!.place - b.final!.place);
  const agents = data.rounds.final.agents;
  if (finals.length === 0) {
    return (
      <section className="wrap section" aria-labelledby="winners-h" id="winners">
        <h2 id="winners-h">Winners</h2>
        <p>The final ranking is not in the results file yet.</p>
      </section>
    );
  }
  const top = finals.filter((p) => p.final!.place <= 5);
  const runners = finals.filter((p) => p.final!.place >= 6 && p.final!.place <= 10);
  const first = top[0];
  const rest = top.slice(1);
  const lo = rest.length ? Math.min(...rest.map((p) => p.final!.mean_rank)) : null;
  const hi = rest.length ? Math.max(...rest.map((p) => p.final!.mean_rank)) : null;
  return (
    <section className="wrap section" aria-labelledby="winners-h" id="winners">
      <h2 id="winners-h">Winners</h2>
      <ol className="wins">
        {top.map((p) => (
          <Entry key={slug(p)} p={p} agents={agents} big />
        ))}
      </ol>
      {first && lo != null && hi != null && (
        <p className="measure">
          First place is clear: {first.name} has a mean rank of {first.final!.mean_rank.toFixed(2)} across the{" "}
          {agents} final agents, where lower is better. Places 2 to {1 + rest.length} are close, between{" "}
          {lo.toFixed(2)} and {hi.toFixed(2)}.
        </p>
      )}
      {runners.length > 0 && (
        <>
          <h3 className="sub">Runners-up, 6 to 10</h3>
          <ol className="wins">
            {runners.map((p) => (
              <Entry key={slug(p)} p={p} agents={agents} big={false} />
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
