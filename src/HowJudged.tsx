import { agentsPerInsideRun, fmtInt, inWords, type Results } from "./data";

export function HowJudged({ data }: { data: Results }) {
  const r = data.rounds;
  const each = agentsPerInsideRun(data.plugins);
  const claude = data.judges?.claude;
  const codex = data.judges?.codex;
  const pct = (share: number) => `${(share * 100).toFixed(1)}%`;
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
      {claude?.share_27_up != null && codex?.share_27_up != null && (
        <p className="measure">
          Codex and Claude agents are graded on one curve; {pct(codex.share_27_up)} of Codex reads and{" "}
          {pct(claude.share_27_up)} of Claude reads scored 27 or higher.
        </p>
      )}
      <p className="links">
        {data.goal_url && <a href={data.goal_url}>The judging goal on the IMD explorer</a>}
        {data.plan_url && <a href={data.plan_url}>The judging plan and results file</a>}
      </p>
    </section>
  );
}
