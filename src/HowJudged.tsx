import { agentsPerInsideRun, fmtInt, inWords, type Results } from "./data";

export function HowJudged({ data }: { data: Results }) {
  const r = data.rounds;
  const each = agentsPerInsideRun(data.plugins);
  const claude = data.judges?.claude;
  const codex = data.judges?.codex;
  const totalReads = (claude?.reads ?? 0) + (codex?.reads ?? 0);
  const pct = (n: number) => `${Math.round((n / totalReads) * 100)}%`;
  return (
    <section className="wrap section" aria-labelledby="how-h" id="how">
      <h2 id="how-h">How it was judged</h2>
      <ol className="steps">
        <li>
          <strong>Every plugin read once.</strong> {fmtInt(r.read1.agents)} agents read all{" "}
          {fmtInt(r.read1.plugins)} plugins and scored each out of 30.
        </li>
        <li>
          <strong>The top {fmtInt(r.read2.plugins)} read again.</strong> {fmtInt(r.read2.agents)} agents gave
          each a second read.
        </li>
        <li>
          <strong>The best {fmtInt(r.round3.plugins)} run inside real Hermes.</strong> {fmtInt(r.round3.agents)}{" "}
          agents installed and ran them{each > 0 && <>, {inWords(each)} agents each</>}.
        </li>
        <li>
          <strong>{fmtInt(r.final.plugins)} finalists ranked.</strong> {inWords(r.final.agents)} agents each
          ranked the whole final.
        </li>
      </ol>
      {claude && codex && totalReads > 0 && (
        <p className="measure">
          Codex agents wrote {pct(codex.reads)} of the reads and Claude agents {pct(claude.reads)}, and both are
          graded on one curve.
        </p>
      )}
      <p className="links">
        {data.goal_url && <a href={data.goal_url}>The judging goal on the IMD explorer</a>}
        {data.plan_url && <a href={data.plan_url}>The judging plan and results file</a>}
      </p>
    </section>
  );
}
