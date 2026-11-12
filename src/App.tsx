import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadResults, slug, type Results, type Source } from "./data";
import { Header } from "./Header";
import { Winners } from "./Winners";
import { PluginTable } from "./PluginTable";
import { HowJudged } from "./HowJudged";
import { Scorecard } from "./Scorecard";
import { Footer } from "./Footer";

/** Returns the scorecard slug for #/p/SLUG, or null for the scoreboard. */
function routeFromHash(hash: string): string | null {
  const m = /^#\/p\/(.+)$/.exec(hash);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export default function App() {
  const [data, setData] = useState<Results | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [failed, setFailed] = useState(false);
  const [route, setRoute] = useState<string | null>(() => routeFromHash(location.hash));
  const boardScroll = useRef(0);
  const lastOpened = useRef<string | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    loadResults()
      .then(({ data, source }) => {
        setData(data);
        setSource(source);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    const onHash = () => {
      const next = routeFromHash(location.hash);
      setRoute((prev) => {
        if (prev === null && next !== null) boardScroll.current = window.scrollY;
        if (next !== null) lastOpened.current = next;
        return next;
      });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Scorecard opens at the top with focus on its title; the scoreboard comes back where the reader left it.
  useLayoutEffect(() => {
    if (route !== null) {
      window.scrollTo(0, 0);
      document.getElementById("scorecard-title")?.focus({ preventScroll: true });
    } else if (lastOpened.current) {
      window.scrollTo(0, boardScroll.current);
      const link = document.querySelector<HTMLAnchorElement>(
        `a[data-slug="${CSS.escape(lastOpened.current)}"]`,
      );
      link?.focus({ preventScroll: true });
    }
  }, [route, data]);

  useEffect(() => {
    const base = "IMD judged the Hermes plugin hackathon";
    const p = route && data?.plugins.find((x) => slug(x) === route);
    document.title = p ? `${p.name}: scorecard | ${base}` : base;
  }, [route, data]);

  const plugin = route && data ? data.plugins.find((x) => slug(x) === route) ?? null : null;

  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <div hidden={route !== null}>
        <Header data={data} source={source} failed={failed} onRetry={load} />
        <main id={route === null ? "main" : undefined} tabIndex={-1}>
          {data && (
            <>
              <Winners data={data} />
              <PluginTable data={data} />
              <HowJudged data={data} />
            </>
          )}
        </main>
      </div>
      {route !== null && (
        <main id="main" tabIndex={-1} className="wrap">
          {data ? (
            <Scorecard plugin={plugin} data={data} />
          ) : failed ? (
            <p className="lede">The results file did not load. <button className="btn" onClick={load}>Try again</button></p>
          ) : (
            <p className="lede" role="status">Loading the scorecard…</p>
          )}
        </main>
      )}
      <Footer data={data} />
    </>
  );
}
