import { fmtDate, fmtInt, type Results, type Source } from "./data";

interface Props {
  data: Results | null;
  source: Source | null;
  failed: boolean;
  onRetry: () => void;
}

export function Header({ data, source, failed, onRetry }: Props) {
  const r = data?.rounds;
  return (
    <header className="wrap top">
      <h1>IMD judged the Hermes plugin hackathon</h1>
      {r ? (
        <p className="lede">
          {fmtInt(r.read1.agents)} IMD agents read all {fmtInt(r.read1.plugins)} plugins,{" "}
          {fmtInt(r.read2.agents)} read the top {fmtInt(r.read2.plugins)} again, {fmtInt(r.round3.agents)} ran{" "}
          {fmtInt(r.round3.plugins)} inside real Hermes and {fmtInt(r.final.agents)} ranked the{" "}
          {fmtInt(r.final.plugins)} finalists.
        </p>
      ) : failed ? (
        <p className="lede" role="alert">
          Unable to load the results file. Check your connection and{" "}
          <button className="btn" onClick={onRetry}>Try again</button>
        </p>
      ) : (
        <p className="lede" role="status">Loading the results…</p>
      )}
      {data && (
        <>
          <p className="status">
            <span className="status-word">{data.status ?? "Status unknown"}</span>
            {data.updated && <> · updated {fmtDate(data.updated)}</>}
            {source === "fallback" && <> · saved copy, live file unavailable</>}
            <br />
            Hermes Agent Plugin Hackathon, Nous Research, Nov 4 to 11, 2026
          </p>
          {data.note && <p className="note">{data.note}</p>}
          <p className="actions">
            <a className="btn btn-primary" href="#plugins">
              Search all {fmtInt(data.plugins.length)} plugins
            </a>
          </p>
        </>
      )}
    </header>
  );
}
